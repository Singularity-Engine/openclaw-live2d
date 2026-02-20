/* eslint-disable import/no-extraneous-dependencies */
import { useTranslation } from "react-i18next";
import { Stack, createListCollection } from "@chakra-ui/react";
import { settingStyles } from "./setting-styles";
import { useConfig } from "@/context/character-config-context";
import { useWebSocket } from "@/context/websocket-context";
import { useBgUrl } from "@/context/bgurl-context";
import { useGeneralSettings } from "@/hooks/sidebar/setting/use-general-settings";
import { useAgentSettings } from "@/hooks/sidebar/setting/use-agent-settings";
import { useASRSettings } from "@/hooks/sidebar/setting/use-asr-settings";
import { useLive2dSettings } from "@/hooks/sidebar/setting/use-live2d-settings";
import { SelectField, SwitchField, InputField, NumberField, SliderField } from "./common";

interface InputOutputProps {}

function InputOutput({}: InputOutputProps): JSX.Element {
  const { t } = useTranslation();
  const { backgroundFiles } = useBgUrl() || {};
  const { configFiles, confName, setConfName } = useConfig();
  const { wsUrl, setWsUrl, baseUrl, setBaseUrl } = useWebSocket();
  const bgUrlContext = useBgUrl();

  // General settings
  const {
    settings,
    handleSettingChange,
    handleCameraToggle,
    handleCharacterPresetChange,
  } = useGeneralSettings({
    bgUrlContext,
    confName,
    setConfName,
    baseUrl,
    wsUrl,
    onWsUrlChange: setWsUrl,
    onBaseUrlChange: setBaseUrl,
  });

  // Agent settings
  const {
    settings: agentSettings,
    handleAllowProactiveSpeakChange,
    handleIdleSecondsChange,
    handleAllowButtonTriggerChange,
  } = useAgentSettings({});

  // ASR settings
  const {
    localSettings: asrSettings,
    autoStopMic,
    autoStartMicOn,
    autoStartMicOnConvEnd,
    setAutoStopMic,
    setAutoStartMicOn,
    setAutoStartMicOnConvEnd,
    handleInputChange: handleASRInputChange,
    handleSave: handleASRSave,
    handleCancel: handleASRCancel,
  } = useASRSettings();

  // Live2D settings
  const {
    modelInfo,
    handleInputChange: handleLive2DInputChange,
  } = useLive2dSettings();

  // Collections for selects
  const backgrounds = createListCollection({
    items:
      backgroundFiles?.map((filename) => ({
        label: String(filename),
        value: `/bg/${filename}`,
      })) || [],
  });

  const characterPresets = createListCollection({
    items: configFiles.map((config) => ({
      label: config.name,
      value: config.filename,
    })),
  });


  return (
    <Stack {...settingStyles.common.container}>
      {/* Character and Background Settings */}
      <SwitchField
        label={t("settings.general.useCameraBackground")}
        checked={settings.useCameraBackground}
        onChange={handleCameraToggle}
      />

      {!settings.useCameraBackground && (
        <>
          <SelectField
            label={t("settings.general.backgroundImage")}
            value={settings.selectedBgUrl}
            onChange={(value) => handleSettingChange("selectedBgUrl", value)}
            collection={backgrounds}
            placeholder={t("settings.general.backgroundImage")}
          />

          <InputField
            label={t("settings.general.customBgUrl")}
            value={settings.customBgUrl}
            onChange={(value) => handleSettingChange("customBgUrl", value)}
            placeholder={t("settings.general.customBgUrlPlaceholder")}
          />
        </>
      )}

      <SelectField
        label={t("settings.general.characterPreset")}
        value={settings.selectedCharacterPreset}
        onChange={handleCharacterPresetChange}
        collection={characterPresets}
        placeholder={confName || t("settings.general.characterPreset")}
      />


      {/* Image Settings */}
      <InputField
        label={t("settings.general.imageCompressionQuality")}
        value={settings.imageCompressionQuality.toString()}
        onChange={(value) => {
          const quality = parseFloat(value as string);
          if (!Number.isNaN(quality) && quality >= 0.1 && quality <= 1.0) {
            handleSettingChange("imageCompressionQuality", quality);
          } else if (value === "") {
            handleSettingChange("imageCompressionQuality", settings.imageCompressionQuality);
          }
        }}
      />

      <InputField
        label={t("settings.general.imageMaxWidth")}
        value={settings.imageMaxWidth.toString()}
        onChange={(value) => {
          const maxWidth = parseInt(value as string, 10);
          if (!Number.isNaN(maxWidth) && maxWidth > 0) {
            handleSettingChange("imageMaxWidth", maxWidth);
          } else if (value === "") {
            handleSettingChange("imageMaxWidth", settings.imageMaxWidth);
          }
        }}
      />

      {/* Agent Settings */}
      <SwitchField
        label={t('settings.agent.allowProactiveSpeak')}
        checked={agentSettings.allowProactiveSpeak}
        onChange={handleAllowProactiveSpeakChange}
      />

      {agentSettings.allowProactiveSpeak && (
        <NumberField
          label={t('settings.agent.idleSecondsToSpeak')}
          value={agentSettings.idleSecondsToSpeak}
          onChange={(value) => handleIdleSecondsChange(Number(value))}
          min={0}
          step={0.1}
          allowMouseWheel
        />
      )}

      <SwitchField
        label={t('settings.agent.allowButtonTrigger')}
        checked={agentSettings.allowButtonTrigger}
        onChange={handleAllowButtonTriggerChange}
      />

      {/* ASR Settings */}
      <SwitchField
        label={t('settings.asr.autoStopMic')}
        checked={autoStopMic}
        onChange={setAutoStopMic}
      />

      <SwitchField
        label={t('settings.asr.autoStartMicOn')}
        checked={autoStartMicOn}
        onChange={setAutoStartMicOn}
      />

      <SwitchField
        label={t('settings.asr.autoStartMicOnConvEnd')}
        checked={autoStartMicOnConvEnd}
        onChange={setAutoStartMicOnConvEnd}
      />

      <SliderField
        label={t('settings.asr.positiveSpeechThreshold')}
        value={asrSettings.positiveSpeechThreshold}
        onChange={(value) => {
          handleASRInputChange('positiveSpeechThreshold', value);
          handleASRSave(); // 立即保存
        }}
        min={0}
        max={100}
        step={1}
      />

      <SliderField
        label={t('settings.asr.negativeSpeechThreshold')}
        value={asrSettings.negativeSpeechThreshold}
        onChange={(value) => {
          handleASRInputChange('negativeSpeechThreshold', value);
          handleASRSave(); // 立即保存
        }}
        min={0}
        max={100}
        step={1}
      />

      <SliderField
        label={t('settings.asr.redemptionFrames')}
        value={asrSettings.redemptionFrames}
        onChange={(value) => {
          handleASRInputChange('redemptionFrames', value);
          handleASRSave(); // 立即保存
        }}
        min={1}
        max={100}
        step={1}
      />

      {/* Live2D Settings */}
      <SwitchField
        label={t('settings.live2d.pointerInteractive')}
        checked={modelInfo.pointerInteractive ?? false}
        onChange={(checked) => handleLive2DInputChange('pointerInteractive', checked)}
      />

      <SwitchField
        label={t('settings.live2d.scrollToResize')}
        checked={modelInfo.scrollToResize ?? true}
        onChange={(checked) => handleLive2DInputChange('scrollToResize', checked)}
      />
    </Stack>
  );
}

export default InputOutput;