/* eslint-disable import/no-extraneous-dependencies */
import { useTranslation } from "react-i18next";
import { Stack, createListCollection } from "@chakra-ui/react";
import { settingStyles } from "./setting-styles";
import { useGeneralSettings } from "@/hooks/sidebar/setting/use-general-settings";
import { useWebSocket } from "@/context/websocket-context";
import { useBgUrl } from "@/context/bgurl-context";
import { useConfig } from "@/context/character-config-context";
import { SelectField } from "./common";

interface LanguageProps {}

function Language({}: LanguageProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const bgUrlContext = useBgUrl();
  const { confName, setConfName } = useConfig();
  const { wsUrl, setWsUrl, baseUrl, setBaseUrl } = useWebSocket();

  const {
    settings,
    handleSettingChange,
  } = useGeneralSettings({
    bgUrlContext,
    confName,
    setConfName,
    baseUrl,
    wsUrl,
    onWsUrlChange: setWsUrl,
    onBaseUrlChange: setBaseUrl,
  });

  const languages = createListCollection({
    items: [
      { label: "English", value: "en" },
      { label: "中文", value: "zh" },
    ],
  });


  return (
    <Stack {...settingStyles.common.container}>
      <SelectField
        label={t("settings.general.language")}
        value={settings.language}
        onChange={(value) => handleSettingChange("language", value)}
        collection={languages}
        placeholder={t("settings.general.language")}
      />
    </Stack>
  );
}

export default Language;