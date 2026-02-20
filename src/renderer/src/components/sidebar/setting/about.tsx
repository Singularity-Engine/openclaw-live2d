import {
  Box,
  Stack,
  Text,
  Heading,
  Flex,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { settingStyles } from './setting-styles';
import { Button } from '@/components/ui/button';
import { useWebSocket } from '@/context/websocket-context';

function About(): JSX.Element {
  const { t } = useTranslation();
  const { baseUrl } = useWebSocket();
  const [gdprLoading, setGdprLoading] = useState<string | null>(null);

  const openExternalLink = (url: string) => {
    window.open(url, '_blank');
  };

  const getToken = (): string | null => {
    return sessionStorage.getItem('_ws_auth_token')
      || new URLSearchParams(window.location.search).get('token');
  };

  const handleExportData = async () => {
    const token = getToken();
    if (!token) { alert('Please log in first'); return; }
    setGdprLoading('export');
    try {
      const res = await fetch(`${baseUrl}/api/auth/export`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-data-export.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Export failed');
    } finally {
      setGdprLoading(null);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action is irreversible and all your data will be permanently deleted.'
    );
    if (!confirmed) return;

    const password = window.prompt('Please enter your password to confirm:');
    if (!password) return;

    const token = getToken();
    if (!token) { alert('Please log in first'); return; }
    setGdprLoading('delete');
    try {
      const res = await fetch(`${baseUrl}/api/auth/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        alert('Account deleted successfully');
        sessionStorage.removeItem('_ws_auth_token');
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.detail || 'Failed to delete account');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Delete failed');
    } finally {
      setGdprLoading(null);
    }
  };

  return (
    <Stack {...settingStyles.common.container} gap={4}>
      <Heading size="md" mb={2} fontFamily="FZLanTingHeiS-R-GB" color="white">
        {t("settings.about.title")}
      </Heading>

      {/* Singularity Engine 介绍 */}
      <Box>
        <Heading size="sm" mb={3} fontFamily="FZLanTingHeiS-R-GB" color="rgb(139, 92, 246)">
          {t("settings.about.singularityEngine.title")}
        </Heading>
        <Text
          fontFamily="FZLanTingHeiS-R-GB"
          color="whiteAlpha.900"
          lineHeight="1.6"
          fontSize="sm"
        >
          {t("settings.about.singularityEngine.description")}
        </Text>
      </Box>

      <Box borderTop="1px solid" borderColor="whiteAlpha.200" pt={4} />

      {/* Lain 介绍 */}
      <Box>
        <Heading size="sm" mb={3} fontFamily="FZLanTingHeiS-R-GB" color="rgb(139, 92, 246)">
          {t("settings.about.lain.title")}
        </Heading>
        <Text
          fontFamily="FZLanTingHeiS-R-GB"
          color="whiteAlpha.900"
          lineHeight="1.6"
          fontSize="sm"
          mb={4}
        >
          {t("settings.about.lain.description")}
        </Text>

        <Button
          size="sm"
          bg="linear-gradient(135deg, rgb(139, 92, 246), rgb(219, 39, 119))"
          color="white"
          _hover={{
            bg: "linear-gradient(135deg, rgb(124, 77, 231), rgb(204, 24, 104))",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)"
          }}
          transition="all 0.2s"
          onClick={() => openExternalLink("https://mcp.sngxai.com/application")}
        >
          {t("settings.about.lain.learnMore")}
        </Button>
      </Box>

      <Box borderTop="1px solid" borderColor="whiteAlpha.200" pt={4} />

      {/* Data & Privacy */}
      <Box>
        <Heading size="sm" mb={3} fontFamily="FZLanTingHeiS-R-GB" color="rgba(255,255,255,0.7)">
          Data & Privacy
        </Heading>
        <Flex gap={3}>
          <Button
            size="sm"
            variant="outline"
            borderColor="whiteAlpha.300"
            color="whiteAlpha.800"
            _hover={{ bg: 'whiteAlpha.100' }}
            onClick={handleExportData}
            disabled={gdprLoading === 'export'}
          >
            {gdprLoading === 'export' ? '...' : 'Export My Data'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            borderColor="rgba(239, 68, 68, 0.4)"
            color="rgba(239, 68, 68, 0.8)"
            _hover={{ bg: 'rgba(239, 68, 68, 0.1)' }}
            onClick={handleDeleteAccount}
            disabled={gdprLoading === 'delete'}
          >
            {gdprLoading === 'delete' ? '...' : 'Delete Account'}
          </Button>
        </Flex>
      </Box>
    </Stack>
  );
}

export default About;
