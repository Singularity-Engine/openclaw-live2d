import { useState, useEffect } from "react";
import { useWebSocket } from "@/context/websocket-context";
import { useAiState } from "@/context/ai-state-context";
import { useInterrupt } from "@/components/canvas/live2d";
import { useChatHistory } from "@/context/chat-history-context";
import { useVAD } from "@/context/vad-context";
import { useMediaCapture } from "@/hooks/utils/use-media-capture";
import { useAuth } from "@/context/auth-context";
import { useMessageQueue } from "@/hooks/utils/use-message-queue";
import { audioTaskQueue } from "@/utils/task-queue";
import { audioManager } from "@/utils/audio-manager";

export function useTextInput() {
  const [inputText, setInputText] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const wsContext = useWebSocket();
  const { aiState } = useAiState();
  const { interrupt } = useInterrupt();
  const { appendHumanMessage } = useChatHistory();
  const { stopMic, autoStopMic } = useVAD();
  const { captureAllMedia } = useMediaCapture();
  const { getUserId, getUsername, isAuthenticated, user } = useAuth();

  // 初始化消息队列，每1秒处理一条消息
  const { queueMessage, setSendCallback, cleanup, getQueueStatus } =
    useMessageQueue({
      interval: 1000, // 1秒间隔
      maxQueueSize: 10, // 最多排队10条消息
    });

  // 设置WebSocket发送回调
  useEffect(() => {
    if (wsContext?.sendMessage) {
      setSendCallback(wsContext.sendMessage);
    }

    // 清理函数
    return () => {
      cleanup();
    };
  }, [wsContext, setSendCallback, cleanup]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const handleSend = async () => {
    if (!inputText.trim() || !wsContext) return;

    // 计费检查
    const allowed = await wsContext.checkBilling();
    if (!allowed) return;

    // 扩展中断条件：无论AI状态如何，只要有音频播放就中断
    const hasAudioPlaying =
      audioTaskQueue.hasTask() || audioManager.hasCurrentAudio();
    if (aiState === "thinking-speaking" || hasAudioPlaying) {
      console.log("Interrupting due to user input:", {
        aiState,
        hasAudioPlaying,
      });
      interrupt();
    }

    const images = await captureAllMedia();
    const messageText = inputText.trim();

    // 立即添加到聊天历史显示给用户
    appendHumanMessage(messageText);

    // 构建包含用户信息的消息
    const messageWithUser = {
      type: "text-input",
      text: messageText,
      images,
      // 添加用户认证信息
      user_id: getUserId(),
      username: getUsername(),
      authenticated: isAuthenticated,
      user_email: user?.email,
      user_roles: user?.roles || [],
    };

    console.log("[TextInput] 添加消息到队列:", {
      user_id: getUserId(),
      username: getUsername(),
      authenticated: isAuthenticated,
      messageType: "text-input",
      text: messageText,
    });

    // 将消息添加到队列而不是立即发送
    queueMessage(messageWithUser);

    if (autoStopMic) stopMic();
    setInputText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isComposing) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = () => setIsComposing(false);

  return {
    inputText,
    setInputText: handleInputChange,
    handleSend,
    handleKeyPress,
    handleCompositionStart,
    handleCompositionEnd,
    getQueueStatus,
  };
}
