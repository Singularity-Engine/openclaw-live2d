/* eslint-disable react/jsx-no-constructed-context-values */
import React, { useContext, useCallback } from 'react';
import { wsService } from '@/services/websocket-service';
import { useLocalStorage } from '@/hooks/utils/use-local-storage';

// 🔧 动态获取主机地址，支持多设备访问
const getDefaultUrls = () => {
  const hostname = window.location.hostname;

  const protocol = window.location.protocol;
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
  const port = window.location.port;

  return {
    wsUrl: `${wsProtocol}//${hostname}${port ? ':' + port : ''}/client-ws`,
    baseUrl: `${protocol}//${hostname}${port ? ':' + port : ''}`
  };
};

const { wsUrl: DEFAULT_WS_URL, baseUrl: DEFAULT_BASE_URL } = getDefaultUrls();

export interface HistoryInfo {
  uid: string;
  custom_title?: string | null;
  is_pinned?: boolean;
  latest_message: {
    role: 'human' | 'ai';
    timestamp: string;
    content: string;
  } | null;
  timestamp: string | null;
}

interface WebSocketContextProps {
  sendMessage: (message: object) => void;
  wsState: string;
  reconnect: () => void;
  wsUrl: string;
  setWsUrl: (url: string) => void;
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  checkBilling: () => Promise<boolean>;
}

export const WebSocketContext = React.createContext<WebSocketContextProps>({
  sendMessage: wsService.sendMessage.bind(wsService),
  wsState: 'CLOSED',
  reconnect: () => wsService.connect(DEFAULT_WS_URL),
  wsUrl: DEFAULT_WS_URL,
  setWsUrl: () => {},
  baseUrl: DEFAULT_BASE_URL,
  setBaseUrl: () => {},
  checkBilling: async () => true,
});

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

export const defaultWsUrl = DEFAULT_WS_URL;
export const defaultBaseUrl = DEFAULT_BASE_URL;

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [wsUrl, setWsUrl] = useLocalStorage('wsUrl', DEFAULT_WS_URL);
  const [baseUrl, setBaseUrl] = useLocalStorage('baseUrl', DEFAULT_BASE_URL);
  const handleSetWsUrl = useCallback((url: string) => {
    setWsUrl(url);
    wsService.connect(url);
  }, [setWsUrl]);

  const value = {
    sendMessage: wsService.sendMessage.bind(wsService),
    wsState: 'CLOSED',
    reconnect: () => wsService.connect(wsUrl),
    wsUrl,
    setWsUrl: handleSetWsUrl,
    baseUrl,
    setBaseUrl,
    checkBilling: async () => true as boolean,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}
