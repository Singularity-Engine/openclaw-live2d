/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable react/require-default-props */
import { Stack } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { settingStyles } from './setting-styles';
import { useASRSettings } from '@/hooks/sidebar/setting/use-asr-settings';
import { SwitchField, SliderField } from './common';

interface ASRProps {
  onSave?: (callback: () => void) => () => void
  onCancel?: (callback: () => void) => () => void
}

function ASR({ onSave, onCancel }: ASRProps): JSX.Element {
  const { t } = useTranslation();
  const {
    localSettings,
    autoStopMic,
    autoStartMicOn,
    autoStartMicOnConvEnd,
    setAutoStopMic,
    setAutoStartMicOn,
    setAutoStartMicOnConvEnd,
    handleInputChange,
    handleSave,
    handleCancel,
  } = useASRSettings();

  useEffect(() => {
    if (!onSave || !onCancel) return;

    const cleanupSave = onSave(handleSave);
    const cleanupCancel = onCancel(handleCancel);

    return (): void => {
      cleanupSave?.();
      cleanupCancel?.();
    };
  }, [onSave, onCancel, handleSave, handleCancel]);

  return (
    <Stack {...settingStyles.common.container}>
      <SwitchField
        label={t('settings.asr.autoStopMic')}
        checked={autoStopMic}
        onChange={setAutoStopMic}
      />

      <SwitchField
        label={t('settings.asr.autoStartMicOnConvEnd')}
        checked={autoStartMicOnConvEnd}
        onChange={setAutoStartMicOnConvEnd}
      />

      <SwitchField
        label={t('settings.asr.autoStartMicOn')}
        checked={autoStartMicOn}
        onChange={setAutoStartMicOn}
      />

      <SliderField
        label={t('settings.asr.positiveSpeechThreshold')}
        help={t('settings.asr.positiveSpeechThresholdDesc')}
        value={localSettings.positiveSpeechThreshold}
        onChange={(value) => handleInputChange('positiveSpeechThreshold', value.toString())}
        min={1}
        max={100}
      />

      <SliderField
        label={t('settings.asr.negativeSpeechThreshold')}
        help={t('settings.asr.negativeSpeechThresholdDesc')}
        value={localSettings.negativeSpeechThreshold}
        onChange={(value) => handleInputChange('negativeSpeechThreshold', value.toString())}
        min={0}
        max={100}
      />

      <SliderField
        label={t('settings.asr.redemptionFrames')}
        help={t('settings.asr.redemptionFramesDesc')}
        value={localSettings.redemptionFrames}
        onChange={(value) => handleInputChange('redemptionFrames', value.toString())}
        min={1}
        max={100}
      />
    </Stack>
  );
}

export default ASR;
