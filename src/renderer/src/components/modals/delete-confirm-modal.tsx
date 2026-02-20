import React from "react";
import { Box, Flex, Text, Button } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const displayMessage =
    message ||
    t(
      "chatHistory.deleteConfirmMessage",
      "Are you sure you want to delete the conversation?"
    );

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  // 阻止点击事件冒泡
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // 点击背景关闭
  const handleBackdropClick = () => {
    onClose();
  };

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      width="100vw"
      height="100vh"
      backgroundColor="rgba(7, 7, 7, 0.8)"
      backdropFilter="blur(5px)"
      display="flex"
      alignItems="flex-start"
      justifyContent="center"
      paddingTop="30vh"
      zIndex={10000}
      onClick={handleBackdropClick}
    >
      <Box
        width="458px"
        minHeight="96px"
        opacity={1}
        borderRadius="12px"
        paddingTop="20px"
        paddingRight="8px"
        paddingBottom="8px"
        paddingLeft="20px"
        gap="16px"
        background="rgba(255, 255, 255, 0.2)"
        boxShadow={`
          2px 4px 3px 0px rgba(0, 0, 0, 0.25),
          2px 4px 3px 0px rgba(0, 0, 0, 0.25) inset,
          0.5px 0.5px 0.5px 0px rgba(255, 255, 255, 1)
        `}
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        onClick={handleModalClick}
      >
        {/* 消息文本 */}
        <Box flex="1" display="flex" alignItems="center" minHeight="16px">
          <Text
            width="100%"
            opacity={1}
            fontFamily="Source Han Sans CN"
            fontWeight="400"
            fontSize="16px"
            lineHeight="120%"
            letterSpacing="0%"
            color="rgba(255, 255, 255, 0.9)"
            whiteSpace="pre-wrap"
            wordBreak="break-word"
          >
            {displayMessage}
          </Text>
        </Box>

        {/* 按钮组 */}
        <Flex
          width="176px"
          height="30px"
          opacity={1}
          gap="8px"
          alignSelf="flex-end"
        >
          {/* OK 按钮 */}
          <Button
            width="84px"
            height="30px"
            opacity={1}
            borderRadius="24px"
            gap="8px"
            padding="8px"
            background="rgba(206, 206, 206, 0.4)"
            boxShadow={`
              2px 2px 3px 0px rgba(0, 0, 0, 0.25),
              2px 2px 3px 0px rgba(0, 0, 0, 0.25) inset,
              0.5px 0.5px 0.5px 0px rgba(255, 255, 255, 1) inset
            `}
            color="rgba(255, 255, 255, 0.9)"
            fontFamily="Source Han Sans CN"
            fontWeight="400"
            fontSize="14px"
            lineHeight="100%"
            letterSpacing="0%"
            _hover={{
              background: "rgba(206, 206, 206, 0.6)",
            }}
            onClick={handleConfirm}
          >
            {t("common.ok", "OK")}
          </Button>

          {/* Cancel 按钮 */}
          <Button
            width="84px"
            height="30px"
            opacity={1}
            borderRadius="24px"
            gap="8px"
            padding="8px"
            background="rgba(116, 116, 116, 0.4)"
            boxShadow={`
              2px 2px 3px 0px rgba(0, 0, 0, 0.25),
              2px 2px 3px 0px rgba(0, 0, 0, 0.25) inset,
              0.5px 0.5px 0.5px 0px rgba(255, 255, 255, 1) inset
            `}
            color="rgba(255, 255, 255, 0.9)"
            fontFamily="Source Han Sans CN"
            fontWeight="400"
            fontSize="14px"
            lineHeight="100%"
            letterSpacing="0%"
            _hover={{
              background: "rgba(116, 116, 116, 0.6)",
            }}
            onClick={handleCancel}
          >
            {t("common.cancel", "Cancel")}
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default DeleteConfirmModal;
