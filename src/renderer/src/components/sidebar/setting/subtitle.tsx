/* eslint-disable import/no-extraneous-dependencies */
import { useTranslation } from "react-i18next";
import { Stack } from "@chakra-ui/react";
import { settingStyles } from "./setting-styles";
import { useGeneralSettings } from "@/hooks/sidebar/setting/use-general-settings";
import { useWebSocket } from "@/context/websocket-context";
import { useBgUrl } from "@/context/bgurl-context";
import { useConfig } from "@/context/character-config-context";
import { SwitchField } from "./common";

interface SubtitleProps {}

function Subtitle({}: SubtitleProps): JSX.Element {
  const { t } = useTranslation();
  const bgUrlContext = useBgUrl();
  const { confName, setConfName } = useConfig();
  const { wsUrl, setWsUrl, baseUrl, setBaseUrl } = useWebSocket();

  const {
    showSubtitle,
    setShowSubtitle,
  } = useGeneralSettings({
    bgUrlContext,
    confName,
    setConfName,
    baseUrl,
    wsUrl,
    onWsUrlChange: setWsUrl,
    onBaseUrlChange: setBaseUrl,
  });

  return (
    <Stack {...settingStyles.common.container}>
      <SwitchField
        label={t("settings.general.showSubtitle")}
        checked={showSubtitle}
        onChange={setShowSubtitle}
      />
    </Stack>
  );
}

export default Subtitle;