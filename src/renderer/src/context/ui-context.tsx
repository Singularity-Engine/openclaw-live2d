import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
  chatHistoryListOpen: boolean;
  setChatHistoryListOpen: (open: boolean) => void;
  pricingOpen: boolean;
  setPricingOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [chatHistoryListOpen, setChatHistoryListOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);

  return (
    <UIContext.Provider
      value={{
        chatHistoryListOpen,
        setChatHistoryListOpen,
        pricingOpen,
        setPricingOpen,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within UIProvider');
  }
  return context;
};
