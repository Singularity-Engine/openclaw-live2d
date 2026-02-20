/* eslint-disable no-else-return */
import {
  createContext, useContext, useState, useMemo, useCallback,
} from 'react';
import { Message } from '@/services/websocket-service';
import { HistoryInfo } from './websocket-context';
import { filterDisplayText } from '@/utils/text-filter';

/**
 * Chat history context state interface
 * @interface ChatHistoryState
 */
interface ChatHistoryState {
  messages: Message[]; // Use the unified Message type
  historyList: HistoryInfo[];
  currentHistoryUid: string | null;
  appendHumanMessage: (content: string) => void;
  appendAIMessage: (content: string, name?: string, avatar?: string) => void;
  appendOrUpdateToolCallMessage: (toolMessageData: Partial<Message>) => void; // Accept partial data
  setMessages: (messages: Message[]) => void; // Use the unified Message type
  setHistoryList: (
    value: HistoryInfo[] | ((prev: HistoryInfo[]) => HistoryInfo[])
  ) => void;
  setCurrentHistoryUid: (uid: string | null) => void;
  updateHistoryList: (uid: string, latestMessage: Message | null) => void; // Use the unified Message type
  fullResponse: string;
  setFullResponse: (text: string) => void;
  appendResponse: (text: string) => void;
  clearResponse: () => void;
  setForceNewMessage: (value: boolean) => void;
}

/**
 * Default values and constants
 */
const DEFAULT_HISTORY = {
  messages: [] as Message[],
  historyList: [] as HistoryInfo[],
  currentHistoryUid: null as string | null,
  fullResponse: '',
};

/**
 * Create the chat history context
 */
export const ChatHistoryContext = createContext<ChatHistoryState | null>(null);

/**
 * Chat History Provider Component
 * @param {Object} props - Provider props
 * @param {React.ReactNode} props.children - Child components
 */
export function ChatHistoryProvider({ children }: { children: React.ReactNode }) {
  // State management
  const [messages, setMessages] = useState<Message[]>(DEFAULT_HISTORY.messages);
  const [historyList, setHistoryList] = useState<HistoryInfo[]>(
    DEFAULT_HISTORY.historyList,
  );
  const [currentHistoryUid, setCurrentHistoryUid] = useState<string | null>(
    DEFAULT_HISTORY.currentHistoryUid,
  );
  const [fullResponse, setFullResponse] = useState(DEFAULT_HISTORY.fullResponse);
  const [forceNewMessage, setForceNewMessage] = useState<boolean>(false);

  /**
   * Append a human message to the chat history
   * @param content - Message content
   */
  const appendHumanMessage = useCallback((content: string) => {
    const filteredContent = filterDisplayText(content);
    
    // 如果过滤后没有内容，不添加消息
    if (!filteredContent) {
      return;
    }
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content: filteredContent,
      role: 'human',
      type: 'text', // Explicitly set type for human messages
      timestamp: new Date().toISOString(),
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  }, []);

  /**
   * Append or update an AI message in the chat history
   * @param content - Message content
   */
  const appendAIMessage = useCallback((content: string, name?: string, avatar?: string) => {
    const filteredContent = filterDisplayText(content);
    
    // 如果过滤后没有内容，不进行任何操作
    if (!filteredContent) {
      return;
    }
    
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1];

      // If forceNewMessage is true or last message is not an AI text message, create new message
      if (forceNewMessage || !lastMessage || lastMessage.role !== 'ai' || lastMessage.type !== 'text') {
        setForceNewMessage(false); // Reset the flag
        return [...prevMessages, {
          id: Date.now().toString(),
          content: filteredContent,
          role: 'ai',
          type: 'text', // Explicitly set type for AI text messages
          timestamp: new Date().toISOString(),
          name,
          avatar,
        }];
      }

      // Otherwise, merge with last AI text message
      const newContent = lastMessage.content + filteredContent;
      return [
        ...prevMessages.slice(0, -1),
        {
          ...lastMessage,
          content: newContent,
          timestamp: new Date().toISOString(),
        },
      ];
    });
  }, [forceNewMessage, setForceNewMessage]);

  /**
   * Append or update a Tool Call message using its tool_id
   * @param toolMessageData - The partial tool call message data from WebSocket
   */
  const appendOrUpdateToolCallMessage = useCallback((toolMessageData: Partial<Message>) => {
    // Ensure required fields for a tool call are present
    if (!toolMessageData.tool_id || !toolMessageData.tool_name || !toolMessageData.status || !toolMessageData.timestamp) {
      console.error('Incomplete tool message data received:', toolMessageData);
      return;
    }

    setMessages((prevMessages) => {
      const existingMessageIndex = prevMessages.findIndex(
        (msg) => msg.type === 'tool_call_status' && msg.tool_id === toolMessageData.tool_id!,
      );

      if (existingMessageIndex !== -1) {
        // Update existing tool call message status and content
        const updatedMessages = [...prevMessages];
        const existingMsg = updatedMessages[existingMessageIndex];
        updatedMessages[existingMessageIndex] = {
          ...existingMsg,
          status: toolMessageData.status, // Update status
          name: toolMessageData.name || existingMsg.name,
          content: toolMessageData.content || existingMsg.content, // Update content (result/error or keep input)
          timestamp: toolMessageData.timestamp!, // Update timestamp
        };
        return updatedMessages;
      } else {
        // Append new tool call message
        const newToolMessage: Message = {
          id: toolMessageData.tool_id!, // Use tool_id as the main ID for uniqueness
          role: 'ai',
          type: 'tool_call_status',
          name: toolMessageData.name || '',
          tool_id: toolMessageData.tool_id,
          tool_name: toolMessageData.tool_name,
          status: toolMessageData.status,
          content: toolMessageData.content || '', // Initial content (input)
          timestamp: toolMessageData.timestamp!,
          // name/avatar could potentially be added if needed
        };
        return [...prevMessages, newToolMessage];
      }
    });
  }, []);

  /**
   * Update the history list with the latest message
   * @param uid - History unique identifier
   * @param latestMessage - Latest message to update with
   */
  const updateHistoryList = useCallback(
    (uid: string, latestMessage: Message | null) => {
      if (!uid) {
        console.error('updateHistoryList: uid is null');
      }
      if (!currentHistoryUid) {
        console.error('updateHistoryList: currentHistoryUid is null');
      }

      setHistoryList((prevList) => prevList.map((history) => {
        if (history.uid === uid) {
          return {
            ...history,
            latest_message: latestMessage
              ? {
                content: latestMessage.content,
                role: latestMessage.role,
                timestamp: latestMessage.timestamp,
              }
              : null,
            timestamp: latestMessage?.timestamp || history.timestamp,
          };
        }
        return history;
      }));
    },
    [currentHistoryUid],
  );

  const appendResponse = useCallback((text: string) => {
    setFullResponse((prev) => prev + (text || ''));
  }, []);

  const clearResponse = useCallback(() => {
    setFullResponse(DEFAULT_HISTORY.fullResponse);
  }, []);

  // Memoized context value
  const contextValue = useMemo(
    () => ({
      messages,
      historyList,
      currentHistoryUid,
      appendHumanMessage,
      appendAIMessage,
      appendOrUpdateToolCallMessage, // Add to context value
      setMessages,
      setHistoryList,
      setCurrentHistoryUid,
      updateHistoryList,
      fullResponse,
      setFullResponse,
      appendResponse,
      clearResponse,
      setForceNewMessage,
    }),
    [
      messages,
      historyList,
      currentHistoryUid,
      appendHumanMessage,
      appendAIMessage,
      appendOrUpdateToolCallMessage, // Add dependency
      updateHistoryList,
      fullResponse,
      appendResponse,
      clearResponse,
      setForceNewMessage,
    ],
  );

  return (
    <ChatHistoryContext.Provider value={contextValue}>
      {children}
    </ChatHistoryContext.Provider>
  );
}

/**
 * Custom hook to use the chat history context
 * @throws {Error} If used outside of ChatHistoryProvider
 */
export function useChatHistory() {
  const context = useContext(ChatHistoryContext);

  if (!context) {
    throw new Error('useChatHistory must be used within a ChatHistoryProvider');
  }

  return context;
}
