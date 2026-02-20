import {
  createContext, useContext, ReactNode, useEffect, useRef, useCallback, useMemo,
} from 'react';
import { useLocalStorage } from '@/hooks/utils/use-local-storage';
import { useTriggerSpeak } from '@/hooks/utils/use-trigger-speak';
import { useAiState, AiStateEnum } from '@/context/ai-state-context';
import { audioTaskQueue } from '@/utils/task-queue';
import { audioManager } from '@/utils/audio-manager';

interface ProactiveSpeakSettings {
  allowButtonTrigger: boolean;
  allowProactiveSpeak: boolean
  idleSecondsToSpeak: number
}

interface ProactiveSpeakContextType {
  settings: ProactiveSpeakSettings
  updateSettings: (newSettings: ProactiveSpeakSettings) => void
}

const defaultSettings: ProactiveSpeakSettings = {
  allowProactiveSpeak: false,
  idleSecondsToSpeak: 5,
  allowButtonTrigger: false,
};

export const ProactiveSpeakContext = createContext<ProactiveSpeakContextType | null>(null);

export function ProactiveSpeakProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useLocalStorage<ProactiveSpeakSettings>(
    'proactiveSpeakSettings',
    defaultSettings,
  );

  const { aiState } = useAiState();
  const { sendTriggerSignal } = useTriggerSpeak();

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const idleStartTimeRef = useRef<number | null>(null);
  const audioCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (audioCheckIntervalRef.current) {
      clearInterval(audioCheckIntervalRef.current);
      audioCheckIntervalRef.current = null;
    }
    idleStartTimeRef.current = null;
  }, []);

  const startIdleTimer = useCallback(() => {
    clearIdleTimer();

    if (!settings.allowProactiveSpeak) return;

    // 检查音频任务队列和当前音频播放状态
    const checkAudioTasksAndStart = () => {
      const hasQueuedTasks = audioTaskQueue.hasTask();
      const hasPlayingAudio = audioManager.hasCurrentAudio();

      // 额外检查DOM中是否有正在播放的音频元素
      const domAudioElements = document.querySelectorAll('audio');
      let hasActiveAudio = false;
      domAudioElements.forEach(audio => {
        if (!audio.paused && !audio.ended && audio.currentTime > 0) {
          hasActiveAudio = true;
        }
      });

      // 增强调试信息，包含当前状态
      console.log(`🕒 [AI主动对话计时器] 检查音频状态:`);
      console.log(`  - 队列中有任务: ${hasQueuedTasks}`);
      console.log(`  - 正在播放音频: ${hasPlayingAudio}`);
      console.log(`  - DOM中活跃音频: ${hasActiveAudio}`);
      console.log(`  - AI状态: ${aiState}`);

      // 如果有任何音频活动，都需要等待
      const hasAnyAudioActivity = hasQueuedTasks || hasPlayingAudio || hasActiveAudio;

      if (hasAnyAudioActivity) {
        // 如果还有音频任务或正在播放音频，等待500ms后再检查
        console.log(`🕒 [AI主动对话计时器] 音频仍然忙碌，等待完成后再开始计时 (queued: ${hasQueuedTasks}, playing: ${hasPlayingAudio}, domActive: ${hasActiveAudio})`);
        audioCheckIntervalRef.current = setTimeout(checkAudioTasksAndStart, 500);
      } else {
        // 音频任务队列为空且没有音频在播放，可以开始计时
        console.log(`🕒 [AI主动对话计时器] 所有音频任务完成，开始 ${settings.idleSecondsToSpeak}秒 计时`);
        idleStartTimeRef.current = Date.now();
        idleTimerRef.current = setTimeout(() => {
          const actualIdleTime = (Date.now() - idleStartTimeRef.current!) / 1000;
          console.log(`🕒 [AI主动对话计时器] 空闲时间达到: ${actualIdleTime}秒，触发AI主动对话`);
          sendTriggerSignal(actualIdleTime);
        }, settings.idleSecondsToSpeak * 1000);
      }
    };

    checkAudioTasksAndStart();
  }, [settings.allowProactiveSpeak, settings.idleSecondsToSpeak, sendTriggerSignal, clearIdleTimer]);

  useEffect(() => {
    if (aiState === AiStateEnum.IDLE) {
      startIdleTimer();
    } else {
      clearIdleTimer();
    }
  }, [aiState, startIdleTimer, clearIdleTimer]);

  useEffect(() => () => {
    clearIdleTimer();
  }, [clearIdleTimer]);

  const updateSettings = useCallback((newSettings: ProactiveSpeakSettings) => {
    setSettings(newSettings);
  }, [setSettings]);

  const contextValue = useMemo(() => ({
    settings,
    updateSettings,
  }), [settings, updateSettings]);

  return (
    <ProactiveSpeakContext.Provider value={contextValue}>
      {children}
    </ProactiveSpeakContext.Provider>
  );
}

export function useProactiveSpeak() {
  const context = useContext(ProactiveSpeakContext);
  if (!context) {
    throw new Error('useProactiveSpeak must be used within a ProactiveSpeakProvider');
  }
  return context;
}
