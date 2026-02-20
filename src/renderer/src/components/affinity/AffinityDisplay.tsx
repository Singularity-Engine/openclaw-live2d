import React, { useMemo } from 'react';
import HeartAffinity from './HeartAffinity';
import { wsService } from '@/services/websocket-service';
import { useAuth } from '@/context/auth-context';

interface AffinityDisplayProps {
  debug?: boolean;
  onAffinityChange?: (affinity: number, level: string) => void;
}

const AffinityDisplay: React.FC<AffinityDisplayProps> = ({ debug = false, onAffinityChange }) => {
  // 获取用户认证信息
  const { user, getUserId, getUsername, isAuthenticated, logUserInfo } = useAuth();
  
  // 使用 useMemo 来稳定 websocket 引用，避免不必要的重新渲染
  const websocket = useMemo(() => wsService.getWebSocketInstance(), []);

  // 在调试模式下记录用户信息
  React.useEffect(() => {
    if (debug) {
      logUserInfo('好感度显示组件初始化');
    }
  }, [debug, logUserInfo]);

  return (
    <HeartAffinity 
      websocket={websocket}
      debug={debug} 
      onAffinityChange={onAffinityChange}
      user={user}
      userId={getUserId()}
      username={getUsername()}
      isAuthenticated={isAuthenticated}
    />
  );
};

export default AffinityDisplay;