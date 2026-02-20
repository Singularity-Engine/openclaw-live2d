/**
 * 用户认证上下文
 * 
 * 为整个应用提供用户认证状态管理
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService, UserInfo } from '../services/auth-service';

interface AuthContextType {
  user: UserInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshAuth: () => Promise<void>;
  getUserId: () => string;
  getUsername: () => string;
  hasRole: (role: string) => boolean;
  logUserInfo: (operation?: string) => void;
  updateCredits: (balance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化认证状态
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);

      const userInfo = await authService.initializeAuth();
      setUser(userInfo);


    } catch (error) {
      console.error('[AuthProvider] 认证初始化失败:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 刷新认证状态
  const refreshAuth = useCallback(async () => {
    try {
      console.info('[AuthProvider] Cookie通过同源策略自动传递到后端');
      setIsLoading(true);
      
      const userInfo = await authService.refreshAuth();
      setUser(userInfo);
      
      console.info('[AuthProvider] ✅ 认证状态刷新完成');
    } catch (error) {
      console.error('[AuthProvider] 💥 认证刷新失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取用户ID
  const getUserId = useCallback((): string => {
    // 如果正在加载中，返回空字符串避免误导
    if (isLoading) return '';
    return user?.user_id || 'default_user';
  }, [user, isLoading]);

  // 获取用户名  
  const getUsername = useCallback((): string => {
    // 如果正在加载中，返回空字符串避免误导
    if (isLoading) return '';
    return user?.username || '访客';
  }, [user, isLoading]);

  // 检查角色
  const hasRole = useCallback((role: string): boolean => {
    return user?.roles?.includes(role) || false;
  }, [user]);

  // 更新积分余额
  const updateCredits = useCallback((balance: number) => {
    setUser(prev => prev ? { ...prev, credits_balance: balance } : null);
  }, []);

  // 记录用户信息
  const logUserInfo = useCallback((operation?: string) => {
    authService.logUserContextInfo(operation);
  }, []);

  // 组件挂载时初始化认证
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user?.authenticated || false,
    refreshAuth,
    getUserId,
    getUsername,
    hasRole,
    logUserInfo,
    updateCredits,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for using auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for getting current user ID (便捷函数)
export function useUserId(): string {
  const { getUserId } = useAuth();
  return getUserId();
}

// Hook for getting current username (便捷函数)
export function useUsername(): string {
  const { getUsername } = useAuth();
  return getUsername();
}

// Hook for checking authentication status (便捷函数)
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}