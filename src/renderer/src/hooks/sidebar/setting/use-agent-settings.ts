import { useCallback } from 'react';
import { useProactiveSpeak } from '@/context/proactive-speak-context';

interface UseAgentSettingsProps {}

export function useAgentSettings({}: UseAgentSettingsProps = {}) {
  const { settings, updateSettings } = useProactiveSpeak();

  const handleAllowProactiveSpeakChange = useCallback((checked: boolean) => {
    updateSettings({
      ...settings,
      allowProactiveSpeak: checked,
    });
  }, [settings, updateSettings]);

  const handleIdleSecondsChange = useCallback((value: number) => {
    updateSettings({
      ...settings,
      idleSecondsToSpeak: value,
    });
  }, [settings, updateSettings]);

  const handleAllowButtonTriggerChange = useCallback((checked: boolean) => {
    updateSettings({
      ...settings,
      allowButtonTrigger: checked,
    });
  }, [settings, updateSettings]);

  return {
    settings,
    handleAllowProactiveSpeakChange,
    handleIdleSecondsChange,
    handleAllowButtonTriggerChange,
  };
}
