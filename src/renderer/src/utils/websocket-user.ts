/**
 * WebSocket用户信息工具函数
 * 
 * 提供统一的用户信息添加功能
 */

import { UserInfo } from '@/services/auth-service';

/**
 * 为WebSocket消息添加用户信息
 */
export function addUserInfoToMessage(
  message: Record<string, any>,
  userId: string,
  username: string,
  isAuthenticated: boolean,
  user?: UserInfo | null
): Record<string, any> {
  return {
    ...message,
    user_id: userId,
    username: username,
    authenticated: isAuthenticated,
    user_email: user?.email,
    user_roles: user?.roles || []
  };
}

/**
 * 记录用户信息到控制台（用于调试）
 */
export function logUserInfoInMessage(
  messageType: string,
  userId: string,
  username: string,
  isAuthenticated: boolean
): void {
  console.log(`[${messageType}] 发送消息包含用户信息:`, {
    user_id: userId,
    username: username,
    authenticated: isAuthenticated,
    messageType: messageType
  });
}