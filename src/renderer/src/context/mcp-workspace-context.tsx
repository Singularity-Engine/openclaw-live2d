/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/jsx-no-constructed-context-values */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { mcpMusicManager } from '@/utils/mcp-music-manager';

// MCP 工作区数据类型定义
export interface MCPToolCall {
  name: string;
  status: 'in_progress' | 'completed' | 'error';
  parameters?: Record<string, any>;
  result?: any;
}

export interface MCPToolResult {
  name: string;
  status: 'in_progress' | 'completed' | 'error';
  result?: any;
  partial_result?: any;
  error?: string;
}

export interface MCPWorkspaceData {
  type: 'mcp-workspace-update';
  status: 'in_progress' | 'completed' | 'error';
  timestamp: string;
  user_query: string;
  tool_calls: MCPToolCall[];
  tool_results: MCPToolResult[];
  final_answer?: string;
  partial_answer?: string;
}

// 单个MCP会话记录
export interface MCPSessionRecord {
  id: string;
  timestamp: string;
  user_query: string;
  status: 'in_progress' | 'completed' | 'error';
  tool_calls: MCPToolCall[];
  tool_results: MCPToolResult[];
  final_answer?: string;
  partial_answer?: string;
}

interface MCPWorkspaceContextType {
  workspaceData: MCPWorkspaceData | null;
  sessionHistory: MCPSessionRecord[];
  currentSessionId: string | null;
  updateWorkspaceData: (data: MCPWorkspaceData) => void;
  clearWorkspaceData: () => void;
  clearSessionHistory: () => void;
  isActive: boolean;
  onAutoOpen?: () => void;
  setAutoOpenCallback: (callback: () => void) => void;
}

const MCPWorkspaceContext = createContext<MCPWorkspaceContextType | undefined>(undefined);

export const useMCPWorkspace = () => {
  const context = useContext(MCPWorkspaceContext);
  if (context === undefined) {
    throw new Error('useMCPWorkspace must be used within a MCPWorkspaceProvider');
  }
  return context;
};

// 数据合并函数
const mergeWorkspaceData = (oldData: MCPWorkspaceData, newData: MCPWorkspaceData): MCPWorkspaceData => {
  const merged = { ...oldData };

  // 更新基本字段
  merged.status = newData.status || oldData.status;
  merged.timestamp = newData.timestamp || oldData.timestamp;
  merged.user_query = newData.user_query || oldData.user_query;

  // 合并工具调用
  if (newData.tool_calls && newData.tool_calls.length > 0) {
    const existingCalls = new Map(merged.tool_calls.map(call => [call.name, call]));
    newData.tool_calls.forEach(newCall => {
      existingCalls.set(newCall.name, { ...existingCalls.get(newCall.name), ...newCall });
    });
    merged.tool_calls = Array.from(existingCalls.values());
  }

  // 更新工具结果
  if (newData.tool_results && newData.tool_results.length > 0) {
    if (!merged.tool_results) merged.tool_results = [];
    
    // 更新现有工具结果或添加新的
    newData.tool_results.forEach(newResult => {
      const existingIndex = merged.tool_results!.findIndex(r => r.name === newResult.name);
      if (existingIndex >= 0) {
        // 如果新结果包含完整结果，则替换部分结果
        if (newResult.result) {
          merged.tool_results![existingIndex] = { ...merged.tool_results![existingIndex], ...newResult };
        } 
        // 否则保留部分结果
        else if (newResult.partial_result) {
          merged.tool_results![existingIndex] = { 
            ...merged.tool_results![existingIndex], 
            status: newResult.status,
            partial_result: newResult.partial_result
          };
        }
        // 仅更新状态
        else {
          merged.tool_results![existingIndex] = { 
            ...merged.tool_results![existingIndex], 
            status: newResult.status
          };
        }
      } else {
        merged.tool_results!.push(newResult);
      }
    });
  }

  // 更新回答 - 保持已存在的final_answer
  if (newData.status === 'in_progress') {
    // 只有当新数据有partial_answer时才更新
    if (newData.partial_answer !== undefined) {
      merged.partial_answer = newData.partial_answer;
    }
  } else if (newData.status === 'completed') {
    // 只有当新数据有final_answer时才更新
    if (newData.final_answer !== undefined) {
      merged.final_answer = newData.final_answer;
    }
  }
  
  // 保持已有的final_answer，不被后续消息覆盖
  if (oldData.final_answer && !newData.final_answer) {
    merged.final_answer = oldData.final_answer;
  }

  return merged;
};

// 消息规范化函数
const normalizeToWorkspaceUpdate = (data: any): MCPWorkspaceData | null => {
  // 已经是正确格式
  if (data && data.type === 'mcp-workspace-update') {
    return data as MCPWorkspaceData;
  }

  // 处理工具调用状态消息
  if (data && data.type === 'tool_call_status') {
    return {
      type: 'mcp-workspace-update',
      status: data.status === 'completed' ? 'completed' : 'in_progress',
      timestamp: data.timestamp || new Date().toISOString(),
      user_query: data.user_query || '',
      tool_calls: [{
        name: data.tool_name || data.name || 'Unknown Tool',
        status: data.status,
        parameters: data.parameters,
      }],
      tool_results: [{
        name: data.tool_name || data.name || 'Unknown Tool',
        status: data.status,
        result: data.status === 'completed' ? (data.content || data.result) : undefined,
        partial_result: data.status !== 'completed' ? (data.content || data.result) : undefined,
        error: data.error,
      }],
      final_answer: data.status === 'completed' && data.content ? data.content : undefined,
      partial_answer: data.status !== 'completed' && data.content ? data.content : undefined,
    };
  }

  // 处理各种可能的 MCP 相关消息
  if (data && typeof data === 'object') {
    console.log('MCP Normalize: Processing message', data.type, data);
    
    // 排除非MCP消息类型
    const excludedTypes = [
      'audio', 'control', 'full-text', 'config-files', 'config-switched',
      'background-files', 'history-data', 'new-history-created', 'history-deleted',
      'history-list', 'user-input-transcription', 'error', 'group-update',
      'group-operation-result', 'backend-synth-complete', 'conversation-chain-end',
      'force-new-message', 'interrupt-signal', 'set-model-and-conf',
      'HeartAffinity', 'heartaffinity', 'heart-affinity', 'heart_affinity',
      'affinity-update', 'affinity_update', 'affinity-data', 'affinity_data',
      'affinity', 'affinity-milestone', 'affinity_milestone', 'emotion-expression',
      'expression'
    ];

    // 如果消息类型在排除列表中，不处理
    if (data.type && excludedTypes.includes(data.type)) {
      console.log('MCP Normalize: Message excluded by type', data.type);
      return null;
    }

    // 放宽MCP标识检查条件
    const hasMCPIndicators = (
      data.tool_name || 
      data.tool_id ||
      data.tool_calls ||
      data.tool_results ||
      data.final_answer ||
      data.partial_answer ||
      data.user_query ||
      (data.type && data.type.includes('mcp')) ||
      (data.type && data.type.includes('tool'))
    );

    if (!hasMCPIndicators) {
      console.log('MCP Normalize: No MCP indicators found', data);
      return null;
    }

    console.log('MCP Normalize: Message accepted as MCP', data);

    // 如果消息已经包含完整的工具调用和结果信息，直接使用
    if (data.tool_calls && data.tool_results) {
      return {
        type: 'mcp-workspace-update',
        status: data.status || 'in_progress',
        timestamp: data.timestamp || new Date().toISOString(),
        user_query: data.user_query || '',
        tool_calls: data.tool_calls,
        tool_results: data.tool_results,
        final_answer: data.final_answer,
        partial_answer: data.partial_answer,
      };
    }

    // 提取工具相关信息
    const toolName = data.tool_name || data.name || 'Unknown Tool';
    const status = data.status || 'in_progress';
    const content = data.content || data.text || data.message || data.final_answer || data.partial_answer || '';

    return {
      type: 'mcp-workspace-update',
      status: status === 'completed' ? 'completed' : 'in_progress',
      timestamp: data.timestamp || new Date().toISOString(),
      user_query: data.user_query || '',
      tool_calls: data.tool_calls || [{
        name: toolName,
        status,
      }],
      tool_results: data.tool_results || [{
        name: toolName,
        status,
        result: status === 'completed' ? content : undefined,
        partial_result: status !== 'completed' ? content : undefined,
      }],
      final_answer: data.final_answer || (status === 'completed' && content ? content : undefined),
      partial_answer: data.partial_answer || (status !== 'completed' && content ? content : undefined),
    };
  }

  return null;
};

export const MCPWorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspaceData, setWorkspaceData] = useState<MCPWorkspaceData | null>(null);
  const [sessionHistory, setSessionHistory] = useState<MCPSessionRecord[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [autoOpenCallback, setAutoOpenCallback] = useState<(() => void) | null>(null);

  // 生成会话ID的函数
  const generateSessionId = useCallback(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const setAutoOpenCallbackHandler = useCallback((callback: () => void) => {
    setAutoOpenCallback(() => callback);
  }, []);

  const updateWorkspaceData = useCallback((newData: MCPWorkspaceData) => {
    console.log('MCP Workspace: Updating data', newData);

    // 检查是否包含音乐生成工具的完成结果
    if (newData.tool_results && newData.status === 'completed') {
      newData.tool_results.forEach(toolResult => {
        if (toolResult.status === 'completed' && toolResult.result) {
          // 异步处理音乐播放，避免阻塞UI更新
          setTimeout(() => {
            mcpMusicManager.handleMCPToolResult(toolResult.name, toolResult.result);
          }, 100);
        }
      });
    }

    // 触发自动弹出，当有新的MCP数据更新时
    if (autoOpenCallback) {
      console.log('MCP Workspace: Triggering auto-open');
      autoOpenCallback();
    }
    
    setWorkspaceData(prevData => {
      // 检查是否是新的查询
      const isNewQuery = newData.user_query && 
        newData.user_query.trim() !== '' && 
        (!prevData || newData.user_query !== prevData.user_query);

      // 如果是新查询且有之前的数据，保存到历史记录
      if (isNewQuery && prevData && prevData.user_query) {
        setSessionHistory(prevHistory => {
          // 检查是否已经存在相同的查询（避免重复）
          const existingIndex = prevHistory.findIndex(
            session => session.user_query === prevData.user_query
          );
          
          const sessionRecord: MCPSessionRecord = {
            id: currentSessionId || generateSessionId(),
            timestamp: prevData.timestamp,
            user_query: prevData.user_query,
            status: prevData.status,
            tool_calls: prevData.tool_calls,
            tool_results: prevData.tool_results,
            final_answer: prevData.final_answer,
            partial_answer: prevData.partial_answer,
          };

          if (existingIndex >= 0) {
            // 更新现有会话
            const newHistory = [...prevHistory];
            newHistory[existingIndex] = sessionRecord;
            console.log('MCP Workspace: Updated existing session in history');
            return newHistory;
          } else {
            // 添加新会话到历史记录
            console.log('MCP Workspace: Added new session to history:', prevData.user_query);
            return [...prevHistory, sessionRecord];
          }
        });

        // 创建新会话ID
        const newSessionId = generateSessionId();
        setCurrentSessionId(newSessionId);
        console.log('MCP Workspace: Created new session', newSessionId, 'for query:', newData.user_query);
        
        return newData; // 新查询直接返回新数据
      }

      // 如果不是新查询，合并数据
      if (!prevData) {
        return newData;
      } else {
        return mergeWorkspaceData(prevData, newData);
      }
    });
  }, [currentSessionId, generateSessionId, autoOpenCallback]);

  const clearWorkspaceData = useCallback(() => {
    console.log('MCP Workspace: Clearing current data');
    setWorkspaceData(null);
    setCurrentSessionId(null);
  }, []);

  const clearSessionHistory = useCallback(() => {
    console.log('MCP Workspace: Clearing session history');
    setSessionHistory([]);
    setWorkspaceData(null);
    setCurrentSessionId(null);
  }, []);

  // 监听当前会话状态变化，当会话完成时也保存到历史记录
  useEffect(() => {
    if (workspaceData && workspaceData.status === 'completed' && workspaceData.user_query && currentSessionId) {
      setSessionHistory(prevHistory => {
        // 检查是否已经存在这个会话
        const existingIndex = prevHistory.findIndex(
          session => session.user_query === workspaceData.user_query
        );
        
        const sessionRecord: MCPSessionRecord = {
          id: currentSessionId,
          timestamp: workspaceData.timestamp,
          user_query: workspaceData.user_query,
          status: workspaceData.status,
          tool_calls: workspaceData.tool_calls,
          tool_results: workspaceData.tool_results,
          final_answer: workspaceData.final_answer,
          partial_answer: workspaceData.partial_answer,
        };

        if (existingIndex >= 0) {
          // 更新现有会话
          const newHistory = [...prevHistory];
          newHistory[existingIndex] = sessionRecord;
          console.log('MCP Workspace: Updated completed session in history');
          return newHistory;
        } else {
          // 添加完成的会话到历史记录
          console.log('MCP Workspace: Added completed session to history:', workspaceData.user_query);
          return [...prevHistory, sessionRecord];
        }
      });
    }
  }, [workspaceData, currentSessionId]);

  // 设置全局消息拦截器
  useEffect(() => {
    // 保存原始的 console.log
    const originalConsoleLog = console.log;

    // 重写 console.log
    console.log = function(...args: any[]) {
      const message = typeof args[0] === 'string' ? args[0] : '';

      // 检查 MCP 工作区消息
      if ((message.includes('Received message from server') || 
           message.includes('WebSocket message received') ||
           message.includes('tool_call_status')) && args.length > 1) {
        const data = args[1];
        if (data && typeof data === 'object') {
          const normalized = normalizeToWorkspaceUpdate(data);
          if (normalized) {
            updateWorkspaceData(normalized);
          }
        }
      }

      // 调用原始的 console.log
      return originalConsoleLog.apply(console, args);
    };

    // 设置全局窗口对象供其他地方调用
    (window as any).mcpWorkspace = {
      updateWorkspace: updateWorkspaceData,
      clearWorkspace: clearWorkspaceData,
    };

    // 设置消息派发函数
    (window as any).dispatchMCPMessage = (message: any) => {
      console.log('MCP Message dispatched:', message);
      const normalized = normalizeToWorkspaceUpdate(message);
      if (normalized) {
        updateWorkspaceData(normalized);
      }
    };

    // 清理函数
    return () => {
      console.log = originalConsoleLog;
      delete (window as any).mcpWorkspace;
      delete (window as any).dispatchMCPMessage;
    };
  }, [updateWorkspaceData, clearWorkspaceData]);

  const contextValue: MCPWorkspaceContextType = {
    workspaceData,
    sessionHistory,
    currentSessionId,
    updateWorkspaceData,
    clearWorkspaceData,
    clearSessionHistory,
    isActive: sessionHistory.length > 0 || workspaceData !== null,
    setAutoOpenCallback: setAutoOpenCallbackHandler,
  };

  return (
    <MCPWorkspaceContext.Provider value={contextValue}>
      {children}
    </MCPWorkspaceContext.Provider>
  );
};

export default MCPWorkspaceProvider;