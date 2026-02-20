import { Box, Text, IconButton } from "@chakra-ui/react";
import { FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useWelcomeModal } from "@/hooks/modals/use-welcome-modal";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const { t } = useTranslation();
  const { sendMessage } = useWelcomeModal();

  if (!isOpen) return null;

  const chips = [
    {
      labelKey: "welcome.chips.myName",
      message: null, // This chip just focuses the input
    },
    {
      labelKey: "welcome.chips.whatCanYouDo",
      message: t("welcome.chips.whatCanYouDo"),
    },
    {
      labelKey: "welcome.chips.tellStory",
      message: t("welcome.chips.tellStory"),
    },
  ];

  const handleChipClick = (message: string | null) => {
    onClose();
    if (message) {
      sendMessage(message);
    }
  };

  return (
    <>
      {/* 背景遮罩 */}
      <Box
        position="fixed"
        inset="0"
        bg="rgba(0, 0, 0, 0.5)"
        backdropFilter="blur(8px)"
        zIndex={1299}
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <Box
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        width="420px"
        maxWidth="90%"
        bg="rgba(255, 255, 255, 0.06)"
        backdropFilter="blur(24px) saturate(180%)"
        borderRadius="28px"
        border="1px solid rgba(255, 255, 255, 0.15)"
        boxShadow="0 12px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
        zIndex={1300}
        p="32px"
        textAlign="center"
        _before={{
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
          borderRadius: "28px",
          pointerEvents: "none",
        }}
      >
        {/* 关闭按钮 */}
        <IconButton
          aria-label="Close"
          position="absolute"
          top="16px"
          right="16px"
          size="xs"
          bg="rgba(255, 255, 255, 0.08)"
          color="rgba(255, 255, 255, 0.6)"
          borderRadius="full"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          _hover={{
            bg: "rgba(255, 255, 255, 0.15)",
            color: "rgba(255, 255, 255, 0.9)",
          }}
          transition="all 0.2s"
          zIndex={10}
          cursor="pointer"
        >
          <FiX size={14} />
        </IconButton>

        {/* 主标题 */}
        <Text
          fontSize="24px"
          fontWeight="700"
          color="rgba(255, 255, 255, 0.95)"
          mb="8px"
          lineHeight="1.3"
          position="relative"
          zIndex={1}
        >
          {t("welcome.title")}
        </Text>

        {/* 副标题 */}
        <Text
          fontSize="15px"
          fontWeight="400"
          color="rgba(255, 255, 255, 0.55)"
          mb="28px"
          position="relative"
          zIndex={1}
        >
          {t("welcome.subtitle")}
        </Text>

        {/* CTA 按钮 */}
        <Box
          as="button"
          width="100%"
          py="14px"
          bg="rgba(139, 92, 246, 0.6)"
          borderRadius="16px"
          border="1px solid rgba(139, 92, 246, 0.3)"
          color="white"
          fontSize="16px"
          fontWeight="600"
          cursor="pointer"
          transition="all 0.2s"
          position="relative"
          zIndex={1}
          _hover={{
            bg: "rgba(139, 92, 246, 0.8)",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 20px rgba(139, 92, 246, 0.3)",
          }}
          _active={{
            transform: "translateY(0)",
          }}
          onClick={onClose}
          mb="20px"
        >
          {t("welcome.getStarted")} →
        </Box>

        {/* 分隔线 */}
        <Box
          height="1px"
          bg="rgba(255, 255, 255, 0.08)"
          mb="16px"
          position="relative"
          zIndex={1}
        />

        {/* 建议 Chips */}
        <Box
          display="flex"
          gap="8px"
          justifyContent="center"
          flexWrap="wrap"
          position="relative"
          zIndex={1}
        >
          {chips.map((chip, index) => (
            <Box
              key={index}
              as="button"
              px="14px"
              py="8px"
              bg="rgba(255, 255, 255, 0.06)"
              borderRadius="20px"
              border="1px solid rgba(255, 255, 255, 0.12)"
              color="rgba(255, 255, 255, 0.75)"
              fontSize="13px"
              fontWeight="500"
              cursor="pointer"
              transition="all 0.2s"
              _hover={{
                bg: "rgba(255, 255, 255, 0.12)",
                color: "rgba(255, 255, 255, 0.95)",
                borderColor: "rgba(255, 255, 255, 0.25)",
              }}
              onClick={() => handleChipClick(chip.message)}
            >
              {t(chip.labelKey)}
            </Box>
          ))}
        </Box>
      </Box>
    </>
  );
}
