import { useWebSocket } from '@/context/websocket-context';
import { useChatHistory } from '@/context/chat-history-context';
import { useAuth } from '@/context/auth-context';
import { useMediaCapture } from '@/hooks/utils/use-media-capture';
import { useInterrupt } from '@/components/canvas/live2d';
import { useAiState } from '@/context/ai-state-context';
import { audioTaskQueue } from '@/utils/task-queue';
import { audioManager } from '@/utils/audio-manager';

export const useWelcomeModal = () => {
  const wsContext = useWebSocket();
  const { appendHumanMessage } = useChatHistory();
  const { getUserId, getUsername, isAuthenticated, user } = useAuth();
  const { captureAllMedia } = useMediaCapture();
  const { interrupt } = useInterrupt();
  const { aiState } = useAiState();

  const sendMessage = async (text: string) => {
    if (!wsContext) {
      console.error('WebSocket未连接');
      return;
    }

    // 计费检查
    const allowed = await wsContext.checkBilling();
    if (!allowed) return;

    // 如果AI正在说话或有音频播放，先中断
    const hasAudioPlaying = audioTaskQueue.hasTask() || audioManager.hasCurrentAudio();
    if (aiState === 'thinking-speaking' || hasAudioPlaying) {
      console.log('中断当前对话:', { aiState, hasAudioPlaying });
      interrupt();
    }

    // 获取媒体（如果有的话）
    const images = await captureAllMedia();

    // 添加到聊天历史
    appendHumanMessage(text);

    // 发送消息
    const messageWithUser = {
      type: 'text-input',
      text: text,
      images,
      user_id: getUserId(),
      username: getUsername(),
      authenticated: isAuthenticated,
      user_email: user?.email,
      user_roles: user?.roles || [],
    };

    console.log('[WelcomeModal] 发送消息:', messageWithUser);
    wsContext.sendMessage(messageWithUser);
  };

  return {
    sendMessage,
  };
};
