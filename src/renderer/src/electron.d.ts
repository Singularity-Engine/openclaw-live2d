import { IpcRenderer } from 'electron';

declare global {
  interface Window {
    // Define the structure of the API exposed by your preload script
    electron?: {
      ipcRenderer: IpcRenderer;
      process: {
        platform: string;
      };
      // Add other methods or properties exposed by preload script if any
    };
    // Add other custom window properties if needed
    api?: unknown; // Keep existing check if needed
  }
}

// Export {} is needed to make this a module
export {};
