/* eslint-disable no-sparse-arrays */
/* eslint-disable react-hooks/exhaustive-deps */
// eslint-disable-next-line object-curly-newline
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { wsService, MessageEvent } from '@/services/websocket-service';
import {
  WebSocketContext, HistoryInfo, defaultWsUrl, defaultBaseUrl,
} from '@/context/websocket-context';
import { ModelInfo, useLive2DConfig } from '@/context/live2d-config-context';
import { useSubtitle } from '@/context/subtitle-context';
import { audioTaskQueue } from '@/utils/task-queue';
import { audioManager } from '@/utils/audio-manager';
import { useAudioTask } from '@/components/canvas/live2d';
import { useBgUrl } from '@/context/bgurl-context';
import { useConfig } from '@/context/character-config-context';
import { useChatHistory } from '@/context/chat-history-context';
import { toaster } from '@/components/ui/toaster';
import { useVAD } from '@/context/vad-context';
import { AiState, useAiState } from "@/context/ai-state-context";
import { useLocalStorage } from '@/hooks/utils/use-local-storage';
import { useGroup } from '@/context/group-context';
import { useInterrupt } from '@/hooks/utils/use-interrupt';
import { useBrowser } from '@/context/browser-context';
import { useMCPWorkspace } from '@/context/mcp-workspace-context';
import { useAuth } from '@/context/auth-context';
import InsufficientCreditsModal, { BillingModalState } from '@/components/billing/InsufficientCreditsModal';

function WebSocketHandler({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [wsState, setWsState] = useState<string>('CLOSED');
  const [wsUrl, setWsUrl] = useLocalStorage<string>('wsUrl', defaultWsUrl);
  const [baseUrl, setBaseUrl] = useLocalStorage<string>('baseUrl', defaultBaseUrl);
  const { aiState, setAiState, backendSynthComplete, setBackendSynthComplete } = useAiState();
  const { setModelInfo } = useLive2DConfig();
  const { setSubtitleText } = useSubtitle();
  const { clearResponse, setForceNewMessage, appendHumanMessage, appendOrUpdateToolCallMessage } = useChatHistory();
  const { addAudioTask } = useAudioTask();
  const bgUrlContext = useBgUrl();
  const { confUid, setConfName, setConfUid, setConfigFiles } = useConfig();
  const [pendingModelInfo, setPendingModelInfo] = useState<ModelInfo | undefined>(undefined);
  const { setSelfUid, setGroupMembers, setIsOwner } = useGroup();
  const { startMic, stopMic, autoStartMicOnConvEnd } = useVAD();
  const autoStartMicOnConvEndRef = useRef(autoStartMicOnConvEnd);
  const ignoreInitialStartMicRef = useRef(true); // 忽略连接后的第一次 start-mic
  const { interrupt } = useInterrupt();
  const { setBrowserViewData } = useBrowser();
  const { updateWorkspaceData } = useMCPWorkspace();
  const { user, getUserId, getUsername, isAuthenticated, logUserInfo, updateCredits } = useAuth();
  const [billingModal, setBillingModal] = useState<BillingModalState>({ open: false });
  const billingInFlight = useRef(false);

  useEffect(() => {
    autoStartMicOnConvEndRef.current = autoStartMicOnConvEnd;
  }, [autoStartMicOnConvEnd]);

  useEffect(() => {
    if (pendingModelInfo && confUid) {
      setModelInfo(pendingModelInfo);
      setPendingModelInfo(undefined);
    }
  }, [pendingModelInfo, setModelInfo, confUid]);

  const {
    setCurrentHistoryUid, setMessages, setHistoryList,
  } = useChatHistory();

  const handleControlMessage = useCallback((controlText: string) => {
    switch (controlText) {
      case 'start-mic':
        // 忽略连接后的第一次 start-mic 控制消息
        if (ignoreInitialStartMicRef.current) {
          console.log('[WebSocket] Ignoring initial start-mic command after connection');
          ignoreInitialStartMicRef.current = false;
          break;
        }
        console.log('Starting microphone...');
        startMic();
        break;
      case 'stop-mic':
        console.log('Stopping microphone...');
        stopMic();
        break;
      case 'conversation-chain-start':
        setAiState('thinking-speaking');
        audioTaskQueue.clearQueue();
        clearResponse();
        break;
      case 'conversation-chain-end':
        audioTaskQueue.addTask(() => new Promise<void>((resolve) => {
          setAiState((currentState: AiState) => {
            if (currentState === 'thinking-speaking') {
              // Auto start mic if enabled
              if (autoStartMicOnConvEndRef.current) {
                startMic();
              }
              return 'idle';
            }
            return currentState;
          });
          resolve();
        }));
        break;
      default:
        console.warn('Unknown control command:', controlText);
    }
  }, [setAiState, clearResponse, setForceNewMessage, startMic, stopMic]);

  const handleWebSocketMessage = useCallback((message: MessageEvent) => {
    console.log('Received message from server:', message);
    
    // 记录用户上下文信息（用于调试）
    if (message.type && (
      message.type.toLowerCase().includes('affinity') || 
      message.type.toLowerCase().includes('heartaffinity')
    )) {
      console.log('[WebSocketHandler] 收到好感度相关消息，当前用户信息:', {
        userId: getUserId(),
        username: getUsername(),
        authenticated: isAuthenticated,
        messageType: message.type
      });
    }

    // 派发消息到 MCP 工作区 - 放宽过滤条件
    if ((window as any).dispatchMCPMessage) {
      // MCP相关的消息类型
      const mcpMessageTypes = [
        'mcp-workspace-update',
        'tool_call_status'
      ];
      
      // 检查是否是MCP相关消息 - 放宽条件
      const isMCPMessage = (
        mcpMessageTypes.includes(message.type) ||
        (message as any).tool_name ||
        (message as any).tool_id ||
        (message.type && message.type.includes('mcp')) ||
        (message.type && message.type.includes('tool')) ||
        // 添加更多可能的MCP标识
        (message as any).tool_calls ||
        (message as any).tool_results ||
        (message as any).final_answer ||
        (message as any).partial_answer ||
        // 如果消息包含user_query也可能是MCP相关
        (message as any).user_query
      );
      
      if (isMCPMessage) {
        console.log('MCP Message dispatched (WebSocket):', message.type, message);
        (window as any).dispatchMCPMessage(message);
      } else {
        console.log('Message filtered out (not MCP):', message.type, message);
      }
    }

    // 派发消息到好感度组件
    if ((window as any).affinityMessageHandler) {
      (window as any).affinityMessageHandler(message);
    }

    switch (message.type) {
      case 'control':
        if (message.text) {
          handleControlMessage(message.text);
        }
        break;
      case 'set-model-and-conf':
        setAiState('loading');
        if (message.conf_name) {
          setConfName(message.conf_name);
        }
        if (message.conf_uid) {
          setConfUid(message.conf_uid);
          console.log('confUid', message.conf_uid);
        }
        if (message.client_uid) {
          setSelfUid(message.client_uid);
        }
        setPendingModelInfo(message.model_info);
        // setModelInfo(message.model_info);
        // We don't know when the confRef in live2d-config-context will be updated, so we set a delay here for convenience
        if (message.model_info && !message.model_info.url.startsWith("http")) {
          const modelUrl = baseUrl + message.model_info.url;
          // eslint-disable-next-line no-param-reassign
          message.model_info.url = modelUrl;
        }

        setAiState('idle');
        break;
      case 'full-text':
        if (message.text) {
          setSubtitleText(message.text);
        }
        break;
      case 'config-files':
        if (message.configs) {
          setConfigFiles(message.configs);
        }
        break;
      case 'config-switched':
        setAiState('idle');
        setSubtitleText(t('notification.characterLoaded'));

        toaster.create({
          title: t('notification.characterSwitched'),
          type: 'success',
          duration: 2000,
        });

        // setModelInfo(undefined);

        wsService.sendMessage({ type: 'fetch-history-list' });
        wsService.sendMessage({ type: 'create-new-history' });
        break;
      case 'background-files':
        if (message.files) {
          bgUrlContext?.setBackgroundFiles(message.files);
        }
        break;
      case 'audio':
        if (aiState === 'interrupted' || aiState === 'listening') {
          console.log('Audio playback intercepted. Sentence:', message.display_text?.text);
        } else {
          console.log("actions", message.actions);
          addAudioTask({
            audioBase64: message.audio || '',
            volumes: message.volumes || [],
            sliceLength: message.slice_length || 0,
            displayText: message.display_text || null,
            expressions: message.actions?.expressions || null,
            forwarded: message.forwarded || false,
            audioFilePath: message.audio_file_path || null,
            ttsEngineClass: message.tts_engine_class || null,
          });
        }
        break;
      case 'history-data':
        if (message.messages) {
          setMessages(message.messages);
        }
        toaster.create({
          title: t('notification.historyLoaded'),
          type: 'success',
          duration: 2000,
        });
        break;
      case 'new-history-created':
        setAiState('idle');
        setSubtitleText(t('notification.newConversation'));
        // No need to open mic here
        if (message.history_uid) {
          setCurrentHistoryUid(message.history_uid);
          setMessages([]);
          const newHistory: HistoryInfo = {
            uid: message.history_uid,
            latest_message: null,
            timestamp: new Date().toISOString(),
          };
          setHistoryList((prev: HistoryInfo[]) => [newHistory, ...prev]);
          toaster.create({
            title: t('notification.newChatHistory'),
            type: 'success',
            duration: 2000,
          });
        }
        break;
      case 'history-deleted':
        toaster.create({
          title: message.success
            ? t('notification.historyDeleteSuccess')
            : t('notification.historyDeleteFail'),
          type: message.success ? 'success' : 'error',
          duration: 2000,
        });
        break;
      case 'history-pinned':
        if (message.success) {
          wsService.sendMessage({ type: 'fetch-history-list' });
          toaster.create({
            title: message.pinned ? '置顶成功' : '取消置顶成功',
            type: 'success',
            duration: 2000,
          });
        } else {
          toaster.create({
            title: message.pinned ? '置顶失败' : '取消置顶失败',
            type: 'error',
            duration: 2000,
          });
        }
        break;
      case 'history-renamed':
        if (message.success) {
          wsService.sendMessage({ type: 'fetch-history-list' });
          toaster.create({
            title: '重命名成功',
            type: 'success',
            duration: 2000,
          });
        } else {
          toaster.create({
            title: '重命名失败',
            type: 'error',
            duration: 2000,
          });
        }
        break;
      case 'history-list':
        if (message.histories) {
          setHistoryList(message.histories);
          if (message.histories.length > 0) {
            setCurrentHistoryUid(message.histories[0].uid);
          }
        }
        break;
      case 'user-input-transcription':
        console.log('user-input-transcription: ', message.text);
        if (message.text) {
          appendHumanMessage(message.text);
        }
        break;
      case 'error':
        toaster.create({
          title: message.message,
          type: 'error',
          duration: 2000,
        });
        break;
      case 'group-update':
        console.log('Received group-update:', message.members);
        if (message.members) {
          setGroupMembers(message.members);
        }
        if (message.is_owner !== undefined) {
          setIsOwner(message.is_owner);
        }
        break;
      case 'group-operation-result':
        toaster.create({
          title: message.message,
          type: message.success ? 'success' : 'error',
          duration: 2000,
        });
        break;
      case 'backend-synth-complete':
        setBackendSynthComplete(true);
        break;
      case 'force-new-message':
        setForceNewMessage(true);
        break;
      case 'interrupt-signal':
        // Handle forwarded interrupt
        interrupt(false); // do not send interrupt signal to server
        break;
      case 'audio-stop':
        // Handle audio stop signal from backend during interruption
        console.log('🛑 收到后端音频停止信号，停止当前音频播放');
        audioTaskQueue.clearQueue();
        audioManager.stopCurrentAudioAndLipSync();
        break;
      case 'tool_call_status':
        if (message.tool_id && message.tool_name && message.status) {
          // If there's browser view data included, store it in the browser context
          if (message.browser_view) {
            console.log('Browser view data received:', message.browser_view);
            setBrowserViewData(message.browser_view);
          }

          appendOrUpdateToolCallMessage({
            id: message.tool_id,
            type: 'tool_call_status',
            role: 'ai',
            tool_id: message.tool_id,
            tool_name: message.tool_name,
            name: message.name,
            status: message.status as ('running' | 'completed' | 'error'),
            content: message.content || '',
            timestamp: message.timestamp || new Date().toISOString(),
          });

          // Memory toast: when memory_store completes, show "remembered" toast
          if (
            message.status === 'completed' &&
            (message.tool_name === 'memory_store' ||
             message.tool_name === 'store_memory' ||
             (message.tool_name && message.tool_name.toLowerCase().includes('memory_store')))
          ) {
            const memoryContent = message.content || message.name || '';
            const truncated = memoryContent.length > 40
              ? memoryContent.substring(0, 40) + '...'
              : memoryContent;
            toaster.create({
              title: `${t('memory.toastPrefix')}${truncated}`,
              type: 'info',
              duration: 3000,
              meta: {
                closable: true,
              },
            });
            console.log('[WebSocketHandler] Memory stored toast:', truncated);
          }
        } else {
          console.warn('Received incomplete tool_call_status message:', message);
        }
        break;
      case 'mcp-workspace-update':
        // 处理 MCP 工作区更新消息
        console.log('Received MCP workspace update:', message);
        updateWorkspaceData(message as any);
        break;
      case 'HeartAffinity':
      case 'heartaffinity':
      case 'heart-affinity':
      case 'heart_affinity':
      case 'affinity-update':
      case 'affinity_update':
      case 'affinity-data':
      case 'affinity_data':
      case 'affinity':
      case 'affinity-milestone':
      case 'affinity_milestone':
      case 'emotion-expression':
      case 'expression':
        // 好感度相关消息已经通过全局处理器派发到好感度组件
        console.log('[WebSocketHandler] Received affinity message:', {
          type: message.type,
          affinity: (message as any).HeartAffinity ?? (message as any).heartAffinity ?? (message as any).heart_affinity ?? (message as any).affinity,
          level: (message as any).level,
          fullMessage: message
        });
        break;
      case 'relationship-card':
        // 后端发送关系总结卡片数据
        if ((window as any).showRelationshipCard) {
          const cardData = {
            memoriesCount: (message as any).memories_count || 0,
            affinityLevel: (message as any).affinity_level || 'stranger',
            affinityValue: (message as any).affinity_value || 0,
            topTopics: (message as any).top_topics || [],
            daysTogether: (message as any).days_together || 1,
            summary: (message as any).summary || '',
          };
          console.log('[WebSocketHandler] 显示关系总结卡片:', cardData);
          (window as any).showRelationshipCard(cardData);
        }
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }, [aiState, addAudioTask, appendHumanMessage, baseUrl, bgUrlContext, setAiState, setConfName, setConfUid, setConfigFiles, setCurrentHistoryUid, setHistoryList, setMessages, setModelInfo, setSubtitleText, startMic, stopMic, setSelfUid, setGroupMembers, setIsOwner, backendSynthComplete, setBackendSynthComplete, clearResponse, handleControlMessage, appendOrUpdateToolCallMessage, interrupt, setBrowserViewData, updateWorkspaceData, getUserId, getUsername, isAuthenticated, t]);

  useEffect(() => {
    // Cookie通过同源策略自动传递到后端，直接连接WebSocket
    console.log('[WebSocketHandler] Cookie通过同源策略自动传递到后端');
    wsService.connect(wsUrl);

    // 连接成功后发送用户上下文信息（用于回访 greeting）
    const sub = wsService.onStateChange((state) => {
      if (state === 'OPEN') {
        const visitCount = parseInt(localStorage.getItem('ling_visit_count') || '1', 10);
        const isReturning = visitCount > 1;
        const affinityLevel = localStorage.getItem('ling_affinity_level') || '';
        const affinityValue = localStorage.getItem('ling_affinity') || '';
        wsService.sendMessage({
          type: 'user-context',
          visit_count: visitCount,
          is_returning: isReturning,
          affinity_level: affinityLevel,
          affinity_value: affinityValue ? parseFloat(affinityValue) : null,
          user_id: getUserId(),
          username: getUsername(),
          authenticated: isAuthenticated,
        });
        console.log('[WebSocketHandler] 发送用户上下文:', { visitCount, isReturning, affinityLevel });
      }
    });

    return () => sub.unsubscribe();
  }, [wsUrl, getUserId, getUsername, isAuthenticated]);

  useEffect(() => {
    const stateSubscription = wsService.onStateChange(setWsState);
    const messageSubscription = wsService.onMessage(handleWebSocketMessage);
    return () => {
      stateSubscription.unsubscribe();
      messageSubscription.unsubscribe();
    };
  }, [wsUrl, handleWebSocketMessage]);

  const checkBilling = useCallback(async (): Promise<boolean> => {
    // 获取 token（与 websocket-service 相同逻辑）
    const token = sessionStorage.getItem('_ws_auth_token')
      || new URLSearchParams(window.location.search).get('token');
    if (!token) {
      // 未登录（guest）→ 不做前端计费检查，后端 WS 中间件兜底
      return true;
    }
    if (billingInFlight.current) return true; // 防并发
    billingInFlight.current = true;
    try {
      const res = await fetch(`${baseUrl}/api/billing/check-and-deduct`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        // 认证失败等 → 放行，不影响用户体验
        console.warn('[Billing] HTTP error:', res.status);
        return true;
      }
      const data = await res.json();
      if (data.credits_balance !== undefined) {
        updateCredits(data.credits_balance);
      }
      if (!data.allowed) {
        setBillingModal({
          open: true,
          reason: data.reason,
          message: data.message,
        });
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[Billing] check failed, allowing message:', err);
      return true; // 网络异常 → 放行
    } finally {
      billingInFlight.current = false;
    }
  }, [baseUrl, updateCredits]);

  const webSocketContextValue = useMemo(() => ({
    sendMessage: wsService.sendMessage.bind(wsService),
    wsState,
    reconnect: () => wsService.connect(wsUrl),
    wsUrl,
    setWsUrl,
    baseUrl,
    setBaseUrl,
    checkBilling,
  }), [wsState, wsUrl, baseUrl, checkBilling]);

  return (
    <WebSocketContext.Provider value={webSocketContextValue}>
      {children}
      <InsufficientCreditsModal
        state={billingModal}
        onClose={() => setBillingModal({ open: false })}
      />
    </WebSocketContext.Provider>
  );
}

export default WebSocketHandler;
