import { Box } from '@chakra-ui/react';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { canvasStyles } from './canvas-styles';
import { useWSStatus } from '@/hooks/canvas/use-ws-status';

// Type definitions
interface StatusContentProps {
  textKey: string
}

// Reusable components
const StatusContent: React.FC<StatusContentProps> = ({ textKey }) => {
  const { t } = useTranslation();
  return t(textKey);
};
const MemoizedStatusContent = memo(StatusContent);

// Main component
const WebSocketStatus = memo((): JSX.Element => {
  const {
    color, textKey, handleClick, isDisconnected,
  } = useWSStatus();

  return (
    <Box
      {...canvasStyles.wsStatus.container}
      backgroundColor={color}
      onClick={handleClick}
      cursor={isDisconnected ? 'pointer' : 'default'}
      _hover={{
        opacity: isDisconnected ? 0.8 : 1,
      }}
      zIndex={5}
    >
      <MemoizedStatusContent textKey={textKey} />
    </Box>
  );
});

WebSocketStatus.displayName = 'WebSocketStatus';

export default WebSocketStatus;
