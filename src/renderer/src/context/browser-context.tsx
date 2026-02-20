/* eslint-disable react/jsx-no-constructed-context-values */
import {
  createContext, useContext, useState, ReactNode, useCallback,
} from 'react';

// Define browser view data structure
export interface BrowserViewData {
  debuggerFullscreenUrl: string;
  debuggerUrl: string;
  pages: {
    id: string;
    url: string;
    faviconUrl: string;
    title: string;
    debuggerUrl: string;
    debuggerFullscreenUrl: string;
  }[];
  wsUrl: string;
  sessionId?: string; // Optional for backward compatibility
}

// Define context interface
interface BrowserContextType {
  browserViewData: BrowserViewData | null;
  setBrowserViewData: (data: BrowserViewData) => void;
  clearBrowserViewData: () => void;
}

// Create context with default values
export const BrowserContext = createContext<BrowserContextType>({
  browserViewData: null,
  setBrowserViewData: () => {},
  clearBrowserViewData: () => {},
});

// Provider component
export function BrowserProvider({ children }: { children: ReactNode }) {
  const [browserViewData, setBrowserViewDataState] = useState<BrowserViewData | null>(null);

  const setBrowserViewData = useCallback((data: BrowserViewData) => {
    setBrowserViewDataState(data);
  }, []);

  const clearBrowserViewData = useCallback(() => {
    setBrowserViewDataState(null);
  }, []);

  return (
    <BrowserContext.Provider
      value={{
        browserViewData,
        setBrowserViewData,
        clearBrowserViewData,
      }}
    >
      {children}
    </BrowserContext.Provider>
  );
}

// Custom hook for using the browser context
export function useBrowser() {
  const context = useContext(BrowserContext);
  if (!context) {
    throw new Error('useBrowser must be used within a BrowserProvider');
  }
  return context;
}
