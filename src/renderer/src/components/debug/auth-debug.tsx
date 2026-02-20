/**
 * 用户认证调试组件
 * 
 * 用于显示当前用户认证状态和Cookie信息
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';

interface AuthDebugProps {
  visible?: boolean;
}

const AuthDebug: React.FC<AuthDebugProps> = ({ visible = false }) => {
  const { user, isLoading, isAuthenticated, refreshAuth, logUserInfo } = useAuth();
  const [cookieInfo, setCookieInfo] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  // 获取Cookie信息
  useEffect(() => {
    if (visible) {
      const updateCookieInfo = () => {
        const cookies = document.cookie;
        const hasSession = cookies.includes('__session=');
        const sessionMatch = cookies.match(/__session=([^;]+)/);
        const sessionValue = sessionMatch ? sessionMatch[1] : null;
        
        setCookieInfo(
          `Cookie状态: ${hasSession ? '✅ 有__session' : '❌ 无__session'}\n` +
          (sessionValue ? `Session长度: ${sessionValue.length}\n` : '') +
          (sessionValue ? `Session前30字符: ${sessionValue.substring(0, 30)}...\n` : '') +
          `总Cookie长度: ${cookies.length}`
        );
      };
      
      updateCookieInfo();
      const interval = setInterval(updateCookieInfo, 5000);
      return () => clearInterval(interval);
    }
  }, [visible]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAuth();
      logUserInfo('手动刷新认证');
    } finally {
      setRefreshing(false);
    }
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 1000,
      maxWidth: '400px',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#4ade80' }}>
        🔐 用户认证状态调试
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>加载状态:</strong> {isLoading ? '🔄 加载中' : '✅ 已加载'}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>认证状态:</strong> {isAuthenticated ? '🔐 已认证' : '👤 访客模式'}
      </div>
      
      {user && (
        <>
          <div style={{ marginBottom: '8px' }}>
            <strong>用户ID:</strong> {user.user_id}
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <strong>用户名:</strong> {user.username}
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <strong>邮箱:</strong> {user.email || 'N/A'}
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <strong>角色:</strong> {JSON.stringify(user.roles)}
          </div>
          
          {user.expired && (
            <div style={{ marginBottom: '8px', color: '#fbbf24' }}>
              ⚠️ 令牌已过期
            </div>
          )}
        </>
      )}
      
      <div style={{ 
        marginBottom: '10px',
        padding: '8px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '4px',
        whiteSpace: 'pre-line'
      }}>
        <strong>Cookie信息:</strong>
        <br />
        {cookieInfo}
      </div>
      
      <div style={{ marginTop: '10px' }}>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            marginRight: '8px'
          }}
        >
          {refreshing ? '🔄 刷新中...' : '🔄 刷新认证'}
        </button>
        
        <button
          onClick={() => logUserInfo('调试面板手动记录')}
          style={{
            background: '#10b981',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          📝 记录到控制台
        </button>
      </div>
      
      <div style={{ 
        marginTop: '8px', 
        fontSize: '10px', 
        color: '#9ca3af' 
      }}>
        💡 提示：打开浏览器开发者工具查看详细日志
      </div>
    </div>
  );
};

export default AuthDebug;