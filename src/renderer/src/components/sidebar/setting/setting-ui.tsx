"use client";

/* eslint-disable import/no-extraneous-dependencies */
import { Box, Text, VStack, Stack, Image } from "@chakra-ui/react";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { JSX } from "react/jsx-runtime";
import Language from "./language";
import Subtitle from "./subtitle";
import InputOutput from "./input-output";
import About from "./about";

// Import all icons
import norLanguagIcon from "../../../../images/nor/nor_Languag_icon.png";
import selLanguagIcon from "../../../../images/sel_or_hover/sel_Languag_icon.png";
import norSubtitleIcon from "../../../../images/nor/nor_Subtitle_icon.png";
import selSubtitleIcon from "../../../../images/sel_or_hover/sel_Subtitle_icon.png";
import norInputOutputIcon from "../../../../images/nor/nor_InputOutput_icon.png";
import selInputOutputIcon from "../../../../images/sel_or_hover/sel_InputOutput_icon.png";
import norAboutIcon from "../../../../images/nor/nor_About_icon.png";
import selAboutIcon from "../../../../images/sel_or_hover/sel_About_icon.png";
import settingHoverIcon from "../../../../images/sel_or_hover/setting_Mouse Hover&sel.png";

type SettingUIProps = {
  open?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
};

function SettingUI({ open, onClose, onToggle }: SettingUIProps): JSX.Element {
  const { t } = useTranslation();
  const [active, setActive] = useState<string>("language");

  const menuItems = useMemo(
    () => [
      {
        id: "language",
        label: t("settings.menu.language"),
        icon: norLanguagIcon,
        activeIcon: selLanguagIcon,
      },
      {
        id: "subtitle",
        label: t("settings.menu.subtitle"),
        icon: norSubtitleIcon,
        activeIcon: selSubtitleIcon,
      },
      {
        id: "inputoutput",
        label: t("settings.menu.inputOutput"),
        icon: norInputOutputIcon,
        activeIcon: selInputOutputIcon,
      },
      {
        id: "about",
        label: t("settings.menu.about"),
        icon: norAboutIcon,
        activeIcon: selAboutIcon,
      },
    ],
    [t]
  );

  const renderContent = () => {
    switch (active) {
      case "language":
        return <Language />;
      case "subtitle":
        return <Subtitle />;
      case "inputoutput":
        return <InputOutput />;
      case "about":
        return <About />;
      default:
        return <Language />;
    }
  };

  return (
    <Box
      position="static"
      width="480px"
      height="100%"
      bg="transparent"
      borderRight="1px solid rgba(255, 255, 255, 0.15)"
      borderRadius="24px"
      boxShadow="0 0 50px rgba(0, 0, 0, 0.5)"
      display="flex"
      flexDirection="row"
      flexShrink={0}
      animation="slideInFromLeft 0.3s ease-out"
      css={{
        "@keyframes slideInFromLeft": {
          "0%": { transform: "translateX(-100%)", opacity: 0 },
          "100%": { transform: "translateX(0)", opacity: 1 },
        },
      }}
    >
      {/* Left Panel - Menu with icon */}
      <Box
        width="160px"
        height="100%"
        bg="rgba(0, 0, 0, 0.1)"
        backdropFilter="blur(15px)"
        borderRight="1px solid rgba(255, 255, 255, 0.25)"
        display="flex"
        flexDirection="column"
        flexShrink={0}
      >
        {/* Settings icon at top */}
        <Box
          position="relative"
          display="flex"
          alignItems="flex-start"
          justifyContent="flex-start"
          py="3"
          px="3"
          cursor="pointer"
          onClick={onClose}
          _hover={{
            opacity: 0.8,
          }}
          transition="opacity 0.2s ease"
        >
          <Image
            src={settingHoverIcon}
            alt="Settings"
            width="22px"
            height="22px"
            objectFit="contain"
            transform="rotate(-30deg)"
            opacity={1}
            position="relative"
            top="-3.17px"
            left="-3.79px"
            border="1.5px solid transparent"
          />
        </Box>

        {/* Menu items */}
        <Stack align="stretch" px="3" py="4" flex="1" overflowY="auto">
          {menuItems.map((item) => (
            <Box
              key={item.id}
              width="134px"
              height="40px"
              py="0"
              px="10px"
              display="flex"
              alignItems="center"
              gap="16px"
              bg={
                active === item.id ? "rgba(178, 178, 178, 0.2)" : "transparent"
              }
              borderRadius="6px"
              border={
                active === item.id
                  ? "1px solid rgba(255, 255, 255, 0.25)"
                  : "1px solid rgba(255, 255, 255, 0.25)"
              }
              boxShadow={
                active === item.id
                  ? "2px 4px 3px 0px rgba(0, 0, 0, 0.25) inset"
                  : "2px 4px 3px 0px rgba(0, 0, 0, 0.25)"
              }
              cursor="pointer"
              transition="all 0.2s ease"
              _hover={{
                bg:
                  active === item.id
                    ? "rgba(178, 178, 178, 0.25)"
                    : "transparent",
                transform: "translateX(4px)",
              }}
              mb="2"
              onClick={() => setActive(item.id)}
            >
              <Image
                src={active === item.id ? item.activeIcon : item.icon}
                alt={item.label}
                width="16px"
                height="20px"
                objectFit="contain"
                flexShrink={0}
              />
              <Text
                fontSize="sm"
                fontWeight="500"
                color={
                  active === item.id
                    ? "rgba(255, 255, 255, 1)"
                    : "rgba(255, 255, 255, 0.8)"
                }
                letterSpacing="0.3px"
                fontFamily="FZLanTingHeiS-R-GB"
                flexShrink={0}
              >
                {item.label}
              </Text>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Right Panel - Content area */}
      <Box
        flex="1"
        bg="rgba(0, 0, 0, 0.5)"
        backdropFilter="blur(10px)"
        borderTopRightRadius="24px"
        borderBottomRightRadius="24px"
        display="flex"
        flexDirection="column"
      >
        {/* Top spacing to match left panel icon area */}
        <Box py="6" borderBottom="1px solid transparent" />

        {/* Content area */}
        <Box
          flex="1"
          p="4"
          overflowY="auto"
          maxHeight="calc(100vh - 280px)"
          css={{
            "&::-webkit-scrollbar": {
              width: "6px",
              background: "transparent",
            },
            "&::-webkit-scrollbar-track": {
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: "4px",
              transition: "background 0.2s ease",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "rgba(255, 255, 255, 0.4)",
            },
          }}
        >
          {renderContent()}
        </Box>

      </Box>
    </Box>
  );
}

export default SettingUI;
