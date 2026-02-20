import React, { createContext, useContext, useState, useEffect } from 'react';
import { toaster } from '../components/ui/toaster';

export type ModeType = 'window' | 'pet';

interface ModeContextType {
  mode: ModeType;
  setMode: (mode: ModeType) => void;
  isElectron: boolean;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export const ModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ModeType>('window');
  const isElectron = window.api !== undefined;

  const setMode = (newMode: ModeType) => {
    if (newMode === 'pet' && !isElectron) {
      toaster.create({
        title: "Pet mode unavailable",
        description: "Pet mode is only available in the desktop application",
        type: "info",
        duration: 2000,
      });
      return;
    }

    // Electron-specific mode change
    if (isElectron && window.api) {
      (window.api as any).setMode(newMode);
    } else {
      setModeState(newMode);
    }
  };

  // Listen for mode changes from main process
  useEffect(() => {
    if (isElectron && window.electron) {
      const handlePreModeChange = (_event: any, newMode: ModeType) => {
        // Use double requestAnimationFrame to ensure UI is ready
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Tell main process we're ready for the actual mode change
            window.electron?.ipcRenderer.send('renderer-ready-for-mode-change', newMode);
          });
        });
      };

      const handleModeChanged = (_event: any, newMode: ModeType) => {
        setModeState(newMode);
        // After mode is set, tell main process the UI has been updated
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.electron?.ipcRenderer.send('mode-change-rendered');
          });
        });
      };

      // Listen for pre-mode-changed and mode-changed events
      window.electron.ipcRenderer.on('pre-mode-changed', handlePreModeChange);
      window.electron.ipcRenderer.on('mode-changed', handleModeChanged);

      return () => {
        if (window.electron) {
          window.electron.ipcRenderer.removeListener('pre-mode-changed', handlePreModeChange);
          window.electron.ipcRenderer.removeListener('mode-changed', handleModeChanged);
        }
      };
    }
    return undefined;
  }, [isElectron]);

  return (
    <ModeContext.Provider value={{ mode, setMode, isElectron }}>
      {children}
    </ModeContext.Provider>
  );
};

export const useMode = (): ModeContextType => {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
}; 