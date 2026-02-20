import { useCallback } from "react";
import { useWebSocket } from "@/context/websocket-context";
import { useMediaCapture } from "@/hooks/utils/use-media-capture";
import { useAuth } from "@/context/auth-context";

export function useSendAudio() {
  const { sendMessage, checkBilling } = useWebSocket();
  const { captureAllMedia } = useMediaCapture();
  const { getUserId, getUsername, isAuthenticated, user } = useAuth();

  const sendAudioPartition = useCallback(
    async (audio: Float32Array) => {
      // 计费检查（在发送音频数据前）
      const allowed = await checkBilling();
      if (!allowed) return;

      const chunkSize = 4096;

      // Send the audio data in chunks
      for (let index = 0; index < audio.length; index += chunkSize) {
        const endIndex = Math.min(index + chunkSize, audio.length);
        const chunk = audio.slice(index, endIndex);
        sendMessage({
          type: "mic-audio-data",
          audio: Array.from(chunk),
          // 添加用户信息到音频数据
          user_id: getUserId(),
          username: getUsername(),
          authenticated: isAuthenticated,
          // Only send images with first chunk
        });
      }

      // Send end signal after all chunks
      const images = await captureAllMedia();
      sendMessage({
        type: "mic-audio-end",
        images,
        // 添加用户信息到音频结束信号
        user_id: getUserId(),
        username: getUsername(),
        authenticated: isAuthenticated,
        user_email: user?.email,
        user_roles: user?.roles || []
      });
      
      console.log('[SendAudio] 发送音频消息包含用户信息:', {
        user_id: getUserId(),
        username: getUsername(),
        authenticated: isAuthenticated,
        messageType: 'mic-audio-end'
      });
    },
    [sendMessage, captureAllMedia, getUserId, getUsername, isAuthenticated, user, checkBilling],
  );

  return {
    sendAudioPartition,
  };
}
