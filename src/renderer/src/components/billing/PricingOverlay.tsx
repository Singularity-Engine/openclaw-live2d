import { Box, Text, Flex } from '@chakra-ui/react';
import { useState } from 'react';
import { useWebSocket } from '@/context/websocket-context';

interface PricingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLANS = [
  {
    name: 'Stardust',
    price: '$9.99/mo',
    key: 'stardust_monthly',
    features: ['100 messages/day', 'Voice interaction', 'Basic MCP tools'],
    color: '#a855f7',
    popular: false,
  },
  {
    name: 'Resonance',
    price: '$29.99/mo',
    key: 'resonance_monthly',
    features: ['Unlimited messages', 'Voice interaction', 'Full MCP tools', '500 credits/month'],
    color: '#7c3aed',
    popular: true,
  },
  {
    name: 'Eternal',
    price: '$199.99/yr',
    key: 'eternal_yearly',
    features: ['Unlimited everything', 'Custom characters', 'API access', '2000 credits/month'],
    color: '#4f46e5',
    popular: false,
  },
];

const CREDIT_PACKS = [
  { credits: 100, price: '$4.99', cents: 499 },
  { credits: 500, price: '$19.99', cents: 1999 },
  { credits: 2000, price: '$69.99', cents: 6999 },
];

const PricingOverlay: React.FC<PricingOverlayProps> = ({ isOpen, onClose }) => {
  const { baseUrl } = useWebSocket();
  const [loading, setLoading] = useState<string | null>(null);

  if (!isOpen) return null;

  const getToken = (): string | null => {
    return sessionStorage.getItem('_ws_auth_token')
      || new URLSearchParams(window.location.search).get('token');
  };

  const handleCheckout = async (type: 'subscription' | 'credits', plan?: string, credits?: number) => {
    const token = getToken();
    if (!token) {
      alert('Please log in first');
      return;
    }
    const key = plan || `credits-${credits}`;
    setLoading(key);
    try {
      const res = await fetch(`${baseUrl}/api/stripe/create-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, plan, credits }),
      });
      const data = await res.json();
      if (data.checkout_url) {
        window.open(data.checkout_url, '_blank');
      } else {
        alert(data.detail || 'Failed to create checkout session');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Network error');
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <Box
        position="fixed"
        inset="0"
        bg="rgba(0, 0, 0, 0.6)"
        backdropFilter="blur(8px)"
        zIndex={1499}
        onClick={onClose}
      />
      {/* Content */}
      <Box
        position="fixed"
        inset="5vh 5vw"
        zIndex={1500}
        overflowY="auto"
        borderRadius="24px"
        bg="rgba(15, 10, 30, 0.97)"
        border="1px solid rgba(168, 85, 247, 0.2)"
        boxShadow="0 30px 80px rgba(0, 0, 0, 0.6)"
        padding="40px"
      >
        {/* Close Button */}
        <Box
          position="absolute"
          top="16px"
          right="16px"
          cursor="pointer"
          color="rgba(255,255,255,0.5)"
          fontSize="xl"
          _hover={{ color: 'white' }}
          onClick={onClose}
        >
          ✕
        </Box>

        {/* Title */}
        <Text
          textAlign="center"
          fontSize="2xl"
          fontWeight="700"
          color="white"
          mb="8px"
        >
          Choose Your Plan
        </Text>
        <Text
          textAlign="center"
          fontSize="sm"
          color="rgba(255,255,255,0.5)"
          mb="40px"
        >
          Unlock more features and credits
        </Text>

        {/* Plan Cards */}
        <Flex
          justifyContent="center"
          gap="24px"
          flexWrap="wrap"
          mb="48px"
        >
          {PLANS.map((plan) => (
            <Box
              key={plan.key}
              width="280px"
              padding="28px"
              borderRadius="20px"
              bg="rgba(255, 255, 255, 0.04)"
              border={plan.popular
                ? `2px solid ${plan.color}`
                : '1px solid rgba(255, 255, 255, 0.1)'}
              position="relative"
              transition="all 0.2s"
              _hover={{
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 40px rgba(168, 85, 247, 0.15)`,
              }}
            >
              {plan.popular && (
                <Box
                  position="absolute"
                  top="-12px"
                  left="50%"
                  transform="translateX(-50%)"
                  bg={plan.color}
                  color="white"
                  fontSize="xs"
                  fontWeight="600"
                  padding="4px 16px"
                  borderRadius="full"
                >
                  Most Popular
                </Box>
              )}
              <Text fontSize="lg" fontWeight="700" color="white" mb="4px">
                {plan.name}
              </Text>
              <Text fontSize="2xl" fontWeight="800" color={plan.color} mb="20px">
                {plan.price}
              </Text>
              <Box mb="24px">
                {plan.features.map((f, i) => (
                  <Text key={i} fontSize="sm" color="rgba(255,255,255,0.6)" mb="8px">
                    ✓ {f}
                  </Text>
                ))}
              </Box>
              <Box
                as="button"
                width="100%"
                padding="10px"
                borderRadius="12px"
                bg={plan.popular
                  ? `linear-gradient(135deg, ${plan.color} 0%, #4f46e5 100%)`
                  : 'rgba(255, 255, 255, 0.08)'}
                color="white"
                fontWeight="600"
                fontSize="sm"
                cursor="pointer"
                border="none"
                transition="all 0.2s"
                opacity={loading === plan.key ? 0.6 : 1}
                _hover={{ opacity: 0.9 }}
                onClick={() => handleCheckout('subscription', plan.key)}
                disabled={!!loading}
              >
                {loading === plan.key ? '...' : 'Subscribe'}
              </Box>
            </Box>
          ))}
        </Flex>

        {/* Credit Packs */}
        <Text
          textAlign="center"
          fontSize="lg"
          fontWeight="600"
          color="white"
          mb="20px"
        >
          Credit Packs
        </Text>
        <Flex justifyContent="center" gap="20px" flexWrap="wrap">
          {CREDIT_PACKS.map((pack) => {
            const key = `credits-${pack.credits}`;
            return (
              <Box
                key={pack.credits}
                width="200px"
                padding="24px"
                borderRadius="16px"
                bg="rgba(255, 255, 255, 0.04)"
                border="1px solid rgba(255, 255, 255, 0.1)"
                textAlign="center"
                transition="all 0.2s"
                _hover={{
                  transform: 'translateY(-2px)',
                  borderColor: 'rgba(168, 85, 247, 0.3)',
                }}
              >
                <Text fontSize="2xl" fontWeight="700" color="#a855f7" mb="4px">
                  ✦ {pack.credits}
                </Text>
                <Text fontSize="sm" color="rgba(255,255,255,0.5)" mb="16px">
                  {pack.price}
                </Text>
                <Box
                  as="button"
                  width="100%"
                  padding="8px"
                  borderRadius="10px"
                  bg="rgba(168, 85, 247, 0.15)"
                  color="#a855f7"
                  fontWeight="600"
                  fontSize="sm"
                  cursor="pointer"
                  border="1px solid rgba(168, 85, 247, 0.3)"
                  transition="all 0.2s"
                  opacity={loading === key ? 0.6 : 1}
                  _hover={{ bg: 'rgba(168, 85, 247, 0.25)' }}
                  onClick={() => handleCheckout('credits', undefined, pack.credits)}
                  disabled={!!loading}
                >
                  {loading === key ? '...' : 'Buy'}
                </Box>
              </Box>
            );
          })}
        </Flex>
      </Box>
    </>
  );
};

export default PricingOverlay;
