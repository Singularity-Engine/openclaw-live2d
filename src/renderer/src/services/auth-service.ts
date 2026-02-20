/**
 * 简化的认证服务 - 跳过前端认证检查，所有用户直接可用
 * 后端通过 WebSocket token 自动识别用户身份
 */

interface UserInfo {
  user_id: string;
  username: string;
  email?: string;
  roles: string[];
  authenticated: boolean;
  credits_balance?: number;
  plan?: string;
}

class AuthService {
  private static instance: AuthService;
  private currentUser: UserInfo = this.getAuthenticatedUserInfo();

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * 获取默认用户信息 - 始终返回已认证状态，跳过前端认证检查
   */
  private getAuthenticatedUserInfo(): UserInfo {
    return {
      user_id: 'authenticated_user',
      username: '用户',
      email: undefined,
      roles: ['USER'],
      authenticated: true
    };
  }

  /**
   * 开始实时监测认证状态 - 不再轮询cookie，直接回调true
   */
  public startAuthPolling(callback: (isAuthenticated: boolean) => void): void {
    callback(true);
  }

  /**
   * 停止监测 - no-op
   */
  public stopAuthPolling(): void {}

  /**
   * 初始化用户认证状态 - 直接返回已认证用户
   */
  public async initializeAuth(): Promise<UserInfo> {
    return this.currentUser;
  }

  /**
   * 获取当前用户信息
   */
  public getCurrentUser(): UserInfo | null {
    return this.currentUser;
  }

  /**
   * 获取当前用户ID
   */
  public getCurrentUserId(): string {
    return this.currentUser.user_id;
  }

  /**
   * 获取当前用户名
   */
  public getCurrentUsername(): string {
    return this.currentUser.username;
  }

  /**
   * 检查用户是否已认证
   */
  public isAuthenticated(): boolean {
    return this.currentUser.authenticated;
  }

  /**
   * 检查用户是否有特定角色
   */
  public hasRole(role: string): boolean {
    return this.currentUser.roles.includes(role);
  }

  /**
   * 刷新用户认证状态
   */
  public async refreshAuth(): Promise<UserInfo> {
    return this.currentUser;
  }

  /**
   * 清除认证状态 - no-op，始终保持认证状态
   */
  public clearAuth(): void {}

  /**
   * 记录用户上下文信息到控制台
   */
  public logUserContextInfo(operation: string = '操作'): void {
    console.info(`[AuthService] ${operation} - Cookie通过同源策略自动传递到后端`);
  }
}

// 导出单例实例
export const authService = AuthService.getInstance();
export type { UserInfo };