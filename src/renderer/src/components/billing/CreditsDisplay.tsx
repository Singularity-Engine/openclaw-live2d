import { Box, Text } from '@chakra-ui/react';
import { useAuth } from '@/context/auth-context';

const CreditsDisplay: React.FC = () => {
  const { user } = useAuth();

  // owner/admin 不显示积分
  if (!user) return null;
  const role = user.roles?.[0];
  if (role === 'owner' || role === 'admin' || role === 'OWNER' || role === 'ADMIN') return null;

  // free 用户不显示积分（因为不扣积分）
  if (!user.plan || user.plan === 'free') return null;

  const balance = user.credits_balance ?? 0;
  const isLow = balance <= 10;

  return (
    <Box
      display="flex"
      alignItems="center"
      gap="4px"
      padding="4px 10px"
      borderRadius="full"
      bg="rgba(255, 255, 255, 0.06)"
      border="1px solid rgba(255, 255, 255, 0.1)"
      cursor="default"
      title={`积分余额: ${balance}`}
    >
      <Text
        fontSize="xs"
        fontWeight="600"
        color={isLow ? '#ef4444' : 'rgba(168, 85, 247, 0.9)'}
      >
        ✦
      </Text>
      <Text
        fontSize="xs"
        fontWeight="600"
        color={isLow ? '#ef4444' : 'rgba(255, 255, 255, 0.8)'}
      >
        {Math.floor(balance)}
      </Text>
    </Box>
  );
};

export default CreditsDisplay;
