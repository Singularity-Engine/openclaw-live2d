import React, { useState, useEffect } from "react";
import { Box, Flex, Text, Button, Input } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => void;
  currentName?: string;
  title?: string;
}

const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentName = "",
  title,
}) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(currentName);

  useEffect(() => {
    if (isOpen) {
      setInputValue(currentName);
    }
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  const displayTitle = title || t("common.inputYourName", "Input Your Name:");

  const handleConfirm = () => {
    if (inputValue.trim()) {
      onConfirm(inputValue.trim());
      onClose();
    }
  };

  const handleCancel = () => {
    setInputValue(currentName);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    } else if (e.key === "Escape") {
      handleCancel();
    }
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
      backdropFilter="blur(4px)"
      display="flex"
      alignItems="flex-start"
      justifyContent="center"
      paddingTop="30vh"
      zIndex={10000}
      onClick={handleBackdropClick}
    >
      <Box
        width="499px"
        height="auto"
        opacity={1}
        borderRadius="12px"
        padding="16px"
        gap="16px"
        background="rgba(255, 255, 255, 0.2)"
        boxShadow={`
          2px 4px 3px 0px rgba(0, 0, 0, 0.25),
          2px 4px 3px 0px rgba(0, 0, 0, 0.25) inset,
          0.5px 0.5px 0.5px 0px rgba(255, 255, 255, 1)
        `}
        display="flex"
        flexDirection="column"
        onClick={handleModalClick}
      >
        {/* 标题 */}
        <Text
          width="183.2890625px"
          height="23px"
          opacity={1}
          fontFamily="Source Han Sans CN"
          fontWeight="400"
          fontSize="16px"
          lineHeight="100%"
          letterSpacing="0%"
          color="rgba(255, 255, 255, 1)"
          marginBottom="12px"
        >
          {displayTitle}
        </Text>

        {/* 输入框 */}
        <Input
          height="45px"
          opacity={1}
          borderRadius="12px"
          boxShadow="2px 4px 3px 0px rgba(0, 0, 0, 0.25), 0px 0.5px 0.5px 0px rgba(0, 0, 0, 0.25) inset"
          border="none"
          padding="12px"
          fontSize="14px"
          fontFamily="Source Han Sans CN"
          color="rgba(0, 0, 0, 0.8)"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder={t("common.enterName", "Enter name...")}
          autoFocus
          _focus={{
            boxShadow:
              "2px 4px 3px 0px rgba(0, 0, 0, 0.25), 0px 0.5px 0.5px 0px rgba(0, 0, 0, 0.25) inset, 0 0 0 2px rgba(66, 153, 225, 0.6)",
            outline: "none",
          }}
          _placeholder={{
            color: "rgba(0, 0, 0, 0.4)",
          }}
          marginBottom="16px"
        />

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
            isDisabled={!inputValue.trim()}
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

export default RenameModal;
