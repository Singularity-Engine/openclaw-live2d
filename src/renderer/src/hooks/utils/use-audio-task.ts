/* eslint-disable func-names */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAiState } from '@/context/ai-state-context';
import { useSubtitle } from '@/context/subtitle-context';
import { useChatHistory } from '@/context/chat-history-context';
import { audioTaskQueue } from '@/utils/task-queue';
import { audioManager } from '@/utils/audio-manager';
import { toaster } from '@/components/ui/toaster';
import { useWebSocket } from '@/context/websocket-context';
import { DisplayText } from '@/services/websocket-service';
import { useLive2DExpression } from '@/hooks/canvas/use-live2d-expression';
import * as LAppDefine from '../../../WebSDK/src/lappdefine';

// Simple type alias for Live2D model
type Live2DModel = any;

interface AudioTaskOptions {
  audioBase64: string
  volumes: number[]
  sliceLength: number
  displayText?: DisplayText | null
  expressions?: string[] | number[] | null
  speaker_uid?: string
  forwarded?: boolean
  audioFilePath?: string | null
  ttsEngineClass?: string | null
}

/**
 * Custom hook for handling audio playback tasks with Live2D lip sync
 */
export const useAudioTask = () => {
  const { t } = useTranslation();
  const { aiState, backendSynthComplete, setBackendSynthComplete } = useAiState();
  const { setSubtitleText } = useSubtitle();
  const { appendResponse, appendAIMessage } = useChatHistory();
  const { sendMessage } = useWebSocket();
  const { setExpression } = useLive2DExpression();

  // State refs to avoid stale closures
  const stateRef = useRef({
    aiState,
    setSubtitleText,
    appendResponse,
    appendAIMessage,
  });

  // Note: currentAudioRef and currentModelRef are now managed by the global audioManager

  stateRef.current = {
    aiState,
    setSubtitleText,
    appendResponse,
    appendAIMessage,
  };

  /**
   * Stop current audio playback and lip sync (delegates to global audioManager)
   */
  const stopCurrentAudioAndLipSync = useCallback(() => {
    audioManager.stopCurrentAudioAndLipSync();
  }, []);

  /**
   * Handle audio playback with Live2D lip sync
   */
  const handleAudioPlayback = (options: AudioTaskOptions): Promise<void> => new Promise((resolve) => {
    const {
      aiState: currentAiState,
      setSubtitleText: updateSubtitle,
      appendResponse: appendText,
      appendAIMessage: appendAI,
    } = stateRef.current;

    // Skip if already interrupted
    if (currentAiState === 'interrupted') {
      console.warn('Audio playback blocked by interruption state.');
      resolve();
      return;
    }

    const { audioBase64, displayText, expressions, forwarded, audioFilePath, ttsEngineClass } = options;

    // Update display text
    if (displayText) {
      appendText(displayText.text);
      appendAI(displayText.text, displayText.name, displayText.avatar);
      if (audioBase64) {
        updateSubtitle(displayText.text);
      }
      if (!forwarded) {
        sendMessage({
          type: "audio-play-start",
          display_text: displayText,
          forwarded: true,
        });
      }
    }

    try {
      // Process audio if available
      if (audioBase64) {
        const audioDataUrl = `data:audio/wav;base64,${audioBase64}`;

        // Get Live2D manager and model
        const live2dManager = (window as any).getLive2DManager?.();
        if (!live2dManager) {
          console.error('Live2D manager not found');
          resolve();
          return;
        }

        const model = live2dManager.getModel(0);
        if (!model) {
          console.error('Live2D model not found at index 0');
          resolve();
          return;
        }
        console.log('Found model for audio playback');

        if (!model._wavFileHandler) {
          console.warn('Model does not have _wavFileHandler for lip sync');
        } else {
          console.log('Model has _wavFileHandler available');
        }

        // Set expression if available
        const lappAdapter = (window as any).getLAppAdapter?.();
        if (lappAdapter && expressions?.[0] !== undefined) {
          setExpression(
            expressions[0],
            lappAdapter,
            `Set expression to: ${expressions[0]}`,
          );
        }

        // Start talk motion
        if (LAppDefine && LAppDefine.PriorityNormal) {
          console.log("Starting random 'Talk' motion");
          model.startRandomMotion(
            "Talk",
            LAppDefine.PriorityNormal,
          );
        } else {
          console.warn("LAppDefine.PriorityNormal not found - cannot start talk motion");
        }

        // Setup audio element
        const audio = new Audio(audioDataUrl);
        
        // Register with global audio manager IMMEDIATELY after creating audio
        audioManager.setCurrentAudio(audio, model);
        let isFinished = false;
        let timeoutId: NodeJS.Timeout;

        const cleanup = () => {
          console.log(`🧹 [音频清理] 开始清理音频任务: ${audioFilePath || 'unknown'}`);

          // 防止重复清理
          if (isFinished) {
            console.log('🧹 [音频清理] 任务已经清理过，跳过重复清理');
            return;
          }

          // 清理音频元素
          try {
            audio.pause();
            audio.src = '';
            audio.load();
          } catch (error) {
            console.warn('清理音频元素时出错:', error);
          }

          audioManager.clearCurrentAudio(audio);
          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          // 强制检查和记录音频管理器状态
          const hasCurrentAudio = audioManager.hasCurrentAudio();
          console.log(`🧹 [音频清理] 清理后音频管理器状态 - hasCurrentAudio: ${hasCurrentAudio}`);

          // 只有在音频正常播放完成时才发送删除通知（避免超时/错误时重复删除）
          if (audioFilePath && !audio.error && audio.currentTime > 0) {
            try {
              const playbackCompleteMessage = {
                type: "frontend-playback-complete",
                audio_file_path: audioFilePath,
                tts_engine_class: ttsEngineClass,
                timestamp: Date.now(),
                playback_duration: audio.currentTime // 添加播放时长验证
              };
              sendMessage(playbackCompleteMessage);
              console.log(`📤 已发送音频播放完成通知: ${audioFilePath} (播放时长: ${audio.currentTime}s)`);
            } catch (error) {
              console.error('发送音频播放完成通知失败:', error);
              // 移除重试机制，避免重复删除
            }
          } else if (audioFilePath) {
            console.warn(`⚠️ [音频文件追踪] 音频可能未正常播放，跳过删除请求: ${audioFilePath} (error: ${!!audio.error}, currentTime: ${audio.currentTime})`);
          }

          isFinished = true;
          resolve();
        };

        // 添加超时保护，防止音频卡死
        timeoutId = setTimeout(() => {
          console.warn('Audio playback timeout, forcing cleanup');
          cleanup();
        }, 30000); // 30秒超时

        // Enhance lip sync sensitivity
        const lipSyncScale = 2.0;

        audio.addEventListener('canplaythrough', () => {
          // Check for interruption before playback
          if (stateRef.current.aiState === 'interrupted' || !audioManager.hasCurrentAudio()) {
            console.warn('Audio playback cancelled due to interruption or audio was stopped');
            cleanup();
            return;
          }

          console.log('Starting audio playback with lip sync');
          audio.play().catch((err) => {
            console.error("Audio play error:", err);
            cleanup();
          });

          // Setup lip sync
          if (model._wavFileHandler) {
            if (!model._wavFileHandler._initialized) {
              console.log('Applying enhanced lip sync');
              model._wavFileHandler._initialized = true;

              const originalUpdate = model._wavFileHandler.update.bind(model._wavFileHandler);
              model._wavFileHandler.update = function (deltaTimeSeconds: number) {
                const result = originalUpdate(deltaTimeSeconds);
                // @ts-ignore
                this._lastRms = Math.min(2.0, this._lastRms * lipSyncScale);
                return result;
              };
            }

            if (audioManager.hasCurrentAudio()) {
              model._wavFileHandler.start(audioDataUrl);
            } else {
              console.warn('WavFileHandler start skipped - audio was stopped');
            }
          }
        });

        audio.addEventListener('ended', () => {
          console.log("Audio playback completed");
          cleanup();
        });

        audio.addEventListener('error', (error) => {
          console.error("Audio playback error:", error);
          cleanup();
        });

        audio.load();
      } else {
        resolve();
      }
    } catch (error) {
      console.error('Audio playback setup error:', error);
      toaster.create({
        title: `${t('error.audioPlayback')}: ${error}`,
        type: "error",
        duration: 2000,
      });
      resolve();
    }
  });

  // Handle backend synthesis completion
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const handleComplete = async () => {
      if (!backendSynthComplete) return;
      
      // 使用超时机制避免死循环，最多等待10秒
      const waitForCompletionWithTimeout = () => {
        return new Promise<void>((resolve) => {
          const startTime = Date.now();
          const maxWaitTime = 10000; // 10秒超时
          
          const checkCompletion = () => {
            if (!isMounted) {
              resolve();
              return;
            }
            
            if (!audioTaskQueue.hasTask()) {
              console.log('Audio queue completed normally');
              resolve();
              return;
            }
            
            if (Date.now() - startTime > maxWaitTime) {
              console.warn('Audio queue wait timeout, forcing completion');
              resolve();
              return;
            }
            
            timeoutId = setTimeout(checkCompletion, 200);
          };
          
          checkCompletion();
        });
      };
      
      await waitForCompletionWithTimeout();
      
      if (isMounted && backendSynthComplete) {
        stopCurrentAudioAndLipSync();
        // 移除这里的全局删除请求，避免重复删除
        // 音频文件会在各自的cleanup函数中删除
        // sendMessage({ type: "frontend-playback-complete" });
        setBackendSynthComplete(false);
      }
    };

    handleComplete();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [backendSynthComplete, sendMessage, setBackendSynthComplete, stopCurrentAudioAndLipSync]);

  /**
   * Add a new audio task to the queue
   */
  const addAudioTask = async (options: AudioTaskOptions) => {
    const { aiState: currentState } = stateRef.current;

    if (currentState === 'interrupted') {
      console.log('Skipping audio task due to interrupted state');
      return;
    }

    console.log(`Adding audio task ${options.displayText?.text} to queue`);
    audioTaskQueue.addTask(() => handleAudioPlayback(options));
  };

  return {
    addAudioTask,
    appendResponse,
    stopCurrentAudioAndLipSync,
  };
};
