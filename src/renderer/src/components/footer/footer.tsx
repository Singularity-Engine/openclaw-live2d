/* eslint-disable react/require-default-props */
import { Box, Textarea, IconButton, HStack, Image } from "@chakra-ui/react";
import { BsMicFill, BsMicMuteFill, BsPaperclip } from "react-icons/bs";
// import radioPlayIcon from "../../assets/radio_play.png";
import { IoHandRightSharp } from "react-icons/io5";
import { FiChevronDown } from "react-icons/fi";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { InputGroup } from "@/components/ui/input-group";
import { footerStyles } from "./footer-styles";
// import AIStateIndicator from './ai-state-indicator';
import { useFooter } from "@/hooks/footer/use-footer";
import { useBgUrl } from "@/context/bgurl-context";
import { useAiState } from "@/context/ai-state-context";
import { useInterrupt } from "@/hooks/utils/use-interrupt";
import cameraIcon from "../../../images/always/camera_icon.png";

// Type definitions
interface FooterProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

interface ToggleButtonProps {
  isCollapsed: boolean;
  onToggle?: () => void;
}

interface ActionButtonsProps {
  micOn: boolean;
  onMicToggle: () => void;
  onInterrupt: () => void;
}

interface MessageInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onCompositionStart: () => void;
  onCompositionEnd: () => void;
}

// Reusable components
const ToggleButton = memo(({ isCollapsed, onToggle }: ToggleButtonProps) => (
  <Box
    {...footerStyles.footer.toggleButton}
    onClick={onToggle}
    color="whiteAlpha.500"
    style={{
      transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)",
    }}
  >
    <FiChevronDown />
  </Box>
));

ToggleButton.displayName = "ToggleButton";

const ActionButtons = memo(
  ({ micOn, onMicToggle, onInterrupt }: ActionButtonsProps) => (
    <HStack gap={2}>
      <IconButton
        bg={micOn ? "green.500" : "red.500"}
        {...footerStyles.footer.actionButton}
        onClick={onMicToggle}
      >
        {micOn ? <BsMicFill /> : <BsMicMuteFill />}
      </IconButton>
      <IconButton
        aria-label="Raise hand"
        bg="yellow.500"
        {...footerStyles.footer.actionButton}
        onClick={onInterrupt}
      >
        <IoHandRightSharp size="24" />
      </IconButton>
    </HStack>
  )
);

ActionButtons.displayName = "ActionButtons";

const MessageInput = memo(
  ({
    value,
    onChange,
    onKeyDown,
    onCompositionStart,
    onCompositionEnd,
  }: MessageInputProps) => {
    const { t } = useTranslation();

    return (
      <InputGroup flex={1}>
        <Box
          position="relative"
          width="100%"
          display="flex"
          alignItems="center"
          gap="3"
        >
          {/* 左侧麦克风按钮（玻璃） — 功能由父级传入的 useFooter 钩子处理 */}
          {/* 功能绑定在父组件中，通过克隆元素或放置在父级。为保持样式不变，这里仅渲染占位，实际按钮在父级渲染 */}

          <Box {...footerStyles.footer.inputContainer}>
            <IconButton
              aria-label="Attach file"
              variant="ghost"
              {...footerStyles.footer.attachButton}
            >
              <BsPaperclip size="16" />
            </IconButton>
            <Textarea
              value={value}
              onChange={onChange}
              onKeyDown={onKeyDown}
              onCompositionStart={onCompositionStart}
              onCompositionEnd={onCompositionEnd}
              placeholder={t("footer.typeYourMessage")}
              {...footerStyles.footer.input}
            />
            {/* 液体高光覆盖层 */}
            <Box {...footerStyles.footer.inputOverlay} />
          </Box>
        </Box>
      </InputGroup>
    );
  }
);

MessageInput.displayName = "MessageInput";

// Main component
function Footer({ isCollapsed = false }: FooterProps): JSX.Element {
  const {
    inputValue,
    handleInputChange,
    handleKeyPress,
    handleCompositionStart,
    handleCompositionEnd,
    handleMicToggle,
    micOn,
  } = useFooter();
  const { useCameraBackground, setUseCameraBackground } = useBgUrl();
  const { isThinkingSpeaking, aiState, isListening } = useAiState();

  // 确保按钮文本逻辑更加可靠
  const buttonText = isThinkingSpeaking ? "STOP" : "Send";
  const buttonBg = isThinkingSpeaking ? "#00000040" : "transparent";
  const buttonHoverBg = isThinkingSpeaking
    ? "#00000060"
    : "rgba(186,186,186,0.05)";

  // 调试当前状态
  console.log(
    "Footer render - AI State:",
    aiState,
    "isThinkingSpeaking:",
    isThinkingSpeaking,
    "buttonText:",
    buttonText,
    "micOn:",
    micOn,
    "isListening:",
    isListening
  );
  const { interrupt } = useInterrupt();

  return (
    <Box
      {...footerStyles.footer.container(isCollapsed)}
      maxWidth="none"
      width="100%"
      px={1}
    >
      <HStack width="100%" justify="space-between">
        {/* 左侧麦克风（玻璃样式）绑定真实功能 */}
        <IconButton
          aria-label="Mic"
          {...footerStyles.footer.micButton}
          onClick={handleMicToggle}
          ml={-2}
        >
          {(() => {
            if (!micOn) {
              // 麦克风禁用状态（默认状态）
              return <BsMicMuteFill />;
            } else if (micOn && isListening) {
              // 麦克风启用且检测到语音
              return (
                <Image
                  src="/radio_play.png"
                  alt="Speaking detected"
                  width="20px"
                  height="20px"
                />
              );
            } else {
              // 麦克风启用但没有检测到语音
              return <BsMicFill />;
            }
          })()}
        </IconButton>

        {/* 中间区域：输入框和右侧按钮组合 */}
        <HStack flex={1} gap={3} mx={2}>
          {/* 输入框 */}
          <MessageInput
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
          />

          {/* 发送/停止按钮 */}
          <IconButton
            aria-label={buttonText}
            {...footerStyles.footer.sendButton}
            {...(isThinkingSpeaking && {
              bg: "white",
              color: "black",
              _hover: { bg: "gray.100" },
            })}
            onClick={() => {
              if (isThinkingSpeaking) {
                interrupt();
              } else {
                handleKeyPress({
                  key: "Enter",
                  preventDefault: () => {},
                  shiftKey: false,
                } as any);
              }
            }}
          >
            {isThinkingSpeaking ? (
              buttonText || "STOP"
            ) : (
              <Image
                src="/send.png"
                alt="Send"
                width="40px"
                height="23px"
                objectFit="contain"
                maxWidth="100%"
                maxHeight="100%"
              />
            )}
          </IconButton>

          {/* 相机按钮 */}
          <IconButton
            aria-label="Toggle Camera Background"
            {...footerStyles.footer.cameraButton}
            onClick={() => setUseCameraBackground(!useCameraBackground)}
            mr={-2}
          >
            <Image
              src={cameraIcon}
              alt="Camera"
              width="40px"
              height="38px"
              borderRadius="24px"
            />
          </IconButton>
        </HStack>
      </HStack>
    </Box>
  );
}

export default Footer;
