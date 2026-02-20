import { useRef, useCallback } from 'react';

interface QueuedMessage {
  id: string;
  message: object;
  timestamp: number;
}

interface UseMessageQueueOptions {
  /** 队列处理间隔，默认1000ms (1秒) */
  interval?: number;
  /** 最大队列长度，默认10 */
  maxQueueSize?: number;
}

export function useMessageQueue(options: UseMessageQueueOptions = {}) {
  const { interval = 1000, maxQueueSize = 10 } = options;
  
  const queueRef = useRef<QueuedMessage[]>([]);
  const processingRef = useRef<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sendCallbackRef = useRef<((message: object) => void) | null>(null);

  // 设置实际的发送回调函数
  const setSendCallback = useCallback((callback: (message: object) => void) => {
    sendCallbackRef.current = callback;
  }, []);

  // 处理队列中的消息
  const processQueue = useCallback(() => {
    if (processingRef.current || queueRef.current.length === 0) {
      return;
    }

    processingRef.current = true;
    
    // 取出第一条消息
    const messageToSend = queueRef.current.shift();
    
    if (messageToSend && sendCallbackRef.current) {
      console.log('[MessageQueue] 处理消息:', messageToSend.id, '剩余队列长度:', queueRef.current.length);
      
      // 发送消息
      sendCallbackRef.current(messageToSend.message);
      
      // 如果队列中还有消息，设置定时器继续处理
      if (queueRef.current.length > 0) {
        timerRef.current = setTimeout(() => {
          processingRef.current = false;
          processQueue();
        }, interval);
      } else {
        processingRef.current = false;
      }
    } else {
      processingRef.current = false;
    }
  }, [interval]);

  // 添加消息到队列
  const queueMessage = useCallback((message: object) => {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queuedMessage: QueuedMessage = {
      id: messageId,
      message,
      timestamp: Date.now()
    };

    // 如果队列已满，移除最旧的消息
    if (queueRef.current.length >= maxQueueSize) {
      const removedMessage = queueRef.current.shift();
      console.warn('[MessageQueue] 队列已满，移除最旧消息:', removedMessage?.id);
    }

    queueRef.current.push(queuedMessage);
    console.log('[MessageQueue] 添加消息到队列:', messageId, '当前队列长度:', queueRef.current.length);

    // 开始处理队列
    if (!processingRef.current) {
      processQueue();
    }
  }, [maxQueueSize, processQueue]);

  // 清空队列
  const clearQueue = useCallback(() => {
    queueRef.current = [];
    processingRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    console.log('[MessageQueue] 队列已清空');
  }, []);

  // 获取队列状态
  const getQueueStatus = useCallback(() => {
    return {
      queueLength: queueRef.current.length,
      isProcessing: processingRef.current,
      nextMessageTimestamp: queueRef.current[0]?.timestamp || null
    };
  }, []);

  // 清理定时器
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    queueMessage,
    clearQueue,
    getQueueStatus,
    setSendCallback,
    cleanup
  };
}