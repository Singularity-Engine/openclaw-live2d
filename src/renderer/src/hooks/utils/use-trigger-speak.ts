import { useCallback } from 'react';
import { useWebSocket } from '@/context/websocket-context';
import { useMediaCapture } from './use-media-capture';
import { useAiState } from '@/context/ai-state-context';

export function useTriggerSpeak() {
  const { sendMessage } = useWebSocket();
  const { captureAllMedia } = useMediaCapture();
  const { setAiState } = useAiState();

  const sendTriggerSignal = useCallback(
    async (actualIdleTime: number) => {
      console.log('AI proactive speak triggered, setting state to thinking-speaking');
      // 立即设置AI状态为thinking-speaking，确保可以被中断
      setAiState('thinking-speaking');
      
      const images = await captureAllMedia();
      sendMessage({
        type: "ai-speak-signal",
        idle_time: actualIdleTime,
        images,
      });
    },
    [sendMessage, captureAllMedia, setAiState],
  );

  return {
    sendTriggerSignal,
  };
}
