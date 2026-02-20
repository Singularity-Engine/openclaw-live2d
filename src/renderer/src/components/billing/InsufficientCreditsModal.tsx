import { Box, Text, Flex } from '@chakra-ui/react';
import { useUI } from '@/context/ui-context';

export interface BillingModalState {
  open: boolean;
  reason?: 'insufficient_credits' | 'daily_limit_reached';
  message?: string;
}

interface InsufficientCreditsModalProps {
  state: BillingModalState;
  onClose: () => void;
}

const InsufficientCreditsModal: React.FC<InsufficientCreditsModalProps> = ({ state, onClose }) => {
  const { setPricingOpen } = useUI();

  if (!state.open) return null;

  const isDailyLimit = state.reason === 'daily_limit_reached';

  return (
    <>
      {/* Backdrop */}
      <Box
        position="fixed"
        inset="0"
        bg="rgba(0, 0, 0, 0.5)"
        backdropFilter="blur(4px)"
        zIndex={1399}
        onClick={onClose}
      />
      {/* Modal */}
      <Box
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        zIndex={1400}
        width="400px"
        maxWidth="90vw"
        bg="rgba(20, 10, 40, 0.95)"
        backdropFilter="blur(20px)"
        borderRadius="20px"
        border="1px solid rgba(168, 85, 247, 0.3)"
        boxShadow="0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(168, 85, 247, 0.15)"
        padding="32px"
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        tabIndex={-1}
        ref={(el) => el?.focus()}
      >
        {/* Icon */}
        <Flex justifyContent="center" mb="20px">
          <Box
            width="56px"
            height="56px"
            borderRadius="full"
            bg={isDailyLimit ? 'rgba(251, 191, 36, 0.15)' : 'rgba(239, 68, 68, 0.15)'}
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="28px"
          >
            {isDailyLimit ? '⏰' : '✦'}
          </Box>
        </Flex>

        {/* Title */}
        <Text
          textAlign="center"
          fontSize="xl"
          fontWeight="700"
          color="white"
          mb="12px"
        >
          {isDailyLimit ? '今日额度已用完' : '积分不足'}
        </Text>

        {/* Message */}
        <Text
          textAlign="center"
          fontSize="sm"
          color="rgba(255, 255, 255, 0.6)"
          mb="28px"
          lineHeight="1.6"
        >
          {state.message || (isDailyLimit
            ? '您今天的免费消息次数已用完，升级方案可获得更多额度。'
            : '您的积分余额不足，请充值后继续使用。'
          )}
        </Text>

        {/* Buttons */}
        <Flex gap="12px" direction="column">
          <Box
            as="button"
            width="100%"
            padding="12px 24px"
            borderRadius="12px"
            bg="linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)"
            color="white"
            fontWeight="600"
            fontSize="sm"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)',
            }}
            onClick={() => {
              onClose();
              setPricingOpen(true);
            }}
          >
            {isDailyLimit ? '升级方案' : '去充值'}
          </Box>
          <Box
            as="button"
            width="100%"
            padding="12px 24px"
            borderRadius="12px"
            bg="transparent"
            color="rgba(255, 255, 255, 0.6)"
            fontWeight="500"
            fontSize="sm"
            cursor="pointer"
            border="1px solid rgba(255, 255, 255, 0.1)"
            transition="all 0.2s"
            _hover={{
              bg: 'rgba(255, 255, 255, 0.05)',
              color: 'rgba(255, 255, 255, 0.8)',
            }}
            onClick={onClose}
          >
            关闭
          </Box>
        </Flex>
      </Box>
    </>
  );
};

export default InsufficientCreditsModal;
