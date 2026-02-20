"use client";

/* eslint-disable no-shadow */
// import { StrictMode } from 'react';
import {
  Box,
  Flex,
  ChakraProvider,
  defaultSystem,
  IconButton,
  Text,
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { FiX, FiChevronRight, FiChevronLeft } from "react-icons/fi";
import type { JSX } from "react/jsx-runtime";
import SettingUI from "./components/sidebar/setting/setting-ui";
import { AiStateProvider } from "./context/ai-state-context";
import { Live2DConfigProvider } from "./context/live2d-config-context";
import { SubtitleProvider } from "./context/subtitle-context";
import { BgUrlProvider } from "./context/bgurl-context";
import WebSocketHandler from "./services/websocket-handler";
import { CameraProvider } from "./context/camera-context";
import { ChatHistoryProvider } from "./context/chat-history-context";
import { CharacterConfigProvider } from "./context/character-config-context";
import { Toaster } from "./components/ui/toaster";
import { VADProvider } from "./context/vad-context";
import { Live2D } from "./components/canvas/live2d";
import TitleBar from "./components/electron/title-bar";
import { InputSubtitle } from "./components/electron/input-subtitle";
import { ProactiveSpeakProvider } from "./context/proactive-speak-context";
import { ScreenCaptureProvider } from "./context/screen-capture-context";
import { useTranslation } from "react-i18next";
import { GroupProvider } from "./context/group-context";
import { BrowserProvider } from "./context/browser-context";
import { MCPWorkspaceProvider } from "./context/mcp-workspace-context";
import { AuthProvider } from "./context/auth-context";
import { UIProvider } from "./context/ui-context";
import Footer from "./components/footer/footer";
// eslint-disable-next-line import/no-extraneous-dependencies, import/newline-after-import
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import Background from "./components/canvas/background";
import Subtitle from "./components/canvas/subtitle";
import { ModeProvider, useMode } from "./context/mode-context";
import ChatHistoryPanel from "./components/sidebar/chat-history-panel";
import MCPWorkspacePanel from "./components/sidebar/mcp-workspace-panel";
import AffinityDisplay from "./components/affinity/AffinityDisplay";
import { useMCPWorkspace } from "./context/mcp-workspace-context";
import ChatHistoryListModal from "./components/modals/chat-history-list-modal";
import WelcomeModal from "./components/modals/welcome-modal";
import homeMenuIcon from "../images/always/homemenu_icon.png";
import { useWaveGesture } from "./hooks/canvas/use-wave-gesture";
import { useAuth } from "./context/auth-context";
import { useUI } from "./context/ui-context";
import CreditsDisplay from "./components/billing/CreditsDisplay";
import PricingOverlay from "./components/billing/PricingOverlay";
import RelationshipCard from "./components/share/RelationshipCard";

function AppContent(): JSX.Element {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [mcpOpen, setMcpOpen] = useState(false);
  const { chatHistoryListOpen, setChatHistoryListOpen, pricingOpen, setPricingOpen } = useUI();
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [relationshipCardOpen, setRelationshipCardOpen] = useState(false);
  const [relationshipData, setRelationshipData] = useState<any>(null);
  const { setAutoOpenCallback } = useMCPWorkspace();
  const { t } = useTranslation();
  const { triggerLeftWave, triggerRightWave, resetHandGestures, triggerGoodbyeGesture } = useWaveGesture();
  const { isAuthenticated, isLoading } = useAuth();

  // 注册关系卡片全局处理器
  useEffect(() => {
    (window as any).showRelationshipCard = (data: any) => {
      setRelationshipData(data);
      setRelationshipCardOpen(true);
    };
    return () => {
      delete (window as any).showRelationshipCard;
    };
  }, []);

  // 首次访问显示欢迎弹窗，回访用户直接进入聊天
  useEffect(() => {
    const visitCount = parseInt(localStorage.getItem('ling_visit_count') || '0', 10);
    const newCount = visitCount + 1;
    localStorage.setItem('ling_visit_count', String(newCount));
    console.log('🎯 [WelcomeModal] 访问次数:', newCount);

    // 只有首次访问（或清除过 localStorage）才显示欢迎弹窗
    if (visitCount === 0) {
      setWelcomeModalOpen(true);
    }
  }, []);


  // 设置MCP工作区自动弹出回调
  useEffect(() => {
    setAutoOpenCallback(() => {
      console.log("MCP Workspace: Auto-opening MCP panel");
      resetHandGestures(); // 重置之前的手势
      setMcpOpen(true);
    });
  }, [setAutoOpenCallback, resetHandGestures]);

  // 允许 ESC 关闭抽屉/设置
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (settingsOpen) setSettingsOpen(false);
        if (historyOpen) {
          setHistoryOpen(false);
          triggerGoodbyeGesture('left'); // 左侧面板关闭时触发告别手势
        }
        if (mcpOpen) {
          setMcpOpen(false);
          triggerGoodbyeGesture('right'); // 右侧面板关闭时触发告别手势
        }
        if (chatHistoryListOpen) setChatHistoryListOpen(false);
        if (pricingOpen) setPricingOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [settingsOpen, historyOpen, mcpOpen, chatHistoryListOpen, pricingOpen, triggerGoodbyeGesture]);
  const { mode } = useMode();
  const isElectron = window.api !== undefined;
  const live2dContainerRef = useRef<HTMLDivElement>(null);

  // Layout constants
  const GAP = 16; // panel spacing to digital-human container border
  const HANDLE_OVERLAP = 12; // how much the handle sticks out

  useEffect(() => {
    const handleResize = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  document.documentElement.style.height = "100%";
  document.body.style.height = "100%";
  document.documentElement.style.position = "fixed";
  document.body.style.position = "fixed";
  document.documentElement.style.width = "100%";
  document.body.style.width = "100%";

  // Define base style properties shared across modes/breakpoints
  const live2dBaseStyle = {
    position: "absolute" as const,
    overflow: "hidden",
    transition: "all 0.3s ease-in-out",
    pointerEvents: "auto" as const,
  };

  const getFixedLive2DWindowStyle = () => ({
    ...live2dBaseStyle,
    top: isElectron ? "30px" : "0px",
    height: isElectron ? "calc(100% - 30px)" : "100%",
    zIndex: 1000,
    left: "0px",
    width: "100%",
    borderRadius: "12px 12px 0 0",
  });

  // Define styles specifically for the "pet" mode
  const live2dPetStyle = {
    ...live2dBaseStyle,
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    zIndex: 15,
  };




  return (
    <>
      {/* Conditional Rendering of Window UI */}
      {mode === "window" && (
        <>
          {isElectron && <TitleBar />}
          <Flex
            direction="column"
            height="100vh"
            position="relative"
            overflow="hidden"
            padding="20px"
            boxSizing="border-box"
            gap="20px"
          >
            {/* Digital Human Content Area */}
            <Box
              flex="1"
              position="relative"
              overflow="hidden"
              bg="rgba(0, 0, 0, 0.2)"
              borderRadius="12px"
              border="1px solid rgba(255, 255, 255, 0.1)"
            >
              <Background />

              {settingsOpen && (
                <Box
                  position="absolute"
                  top="0"
                  left="0"
                  width="480px"
                  height="100%"
                  zIndex={1200}
                  borderRadius="12px 0 0 12px"
                  overflow="visible"
                >
                  <SettingUI onClose={() => setSettingsOpen(false)} />
                </Box>
              )}

              <Box
                ref={live2dContainerRef}
                {...getFixedLive2DWindowStyle()}
                left="0px"
                width="100%"
              >
                <Box position="relative" width="100%" height="100%">
                  <Live2D />
                  {/* 透明点击层：无遮罩，仅用于点击外部关闭抽屉 */}
                  <Box
                    position="absolute"
                    inset={0}
                    bg="transparent"
                    pointerEvents={
                      historyOpen || mcpOpen || settingsOpen ? "auto" : "none"
                    }
                    zIndex={900}
                    onClick={() => {
                      if (historyOpen) {
                        setHistoryOpen(false);
                        triggerGoodbyeGesture('left'); // 左侧面板关闭时触发告别手势
                      }
                      if (mcpOpen) {
                        setMcpOpen(false);
                        triggerGoodbyeGesture('right'); // 右侧面板关闭时触发告别手势
                      }
                      if (settingsOpen) setSettingsOpen(false);
                    }}
                  />

                  {/* 顶部左侧：设置（放入同一 stacking context，确保可点；低于抽屉） */}
                  <Box
                    position="absolute"
                    top="20px"
                    left="20px"
                    zIndex={1250}
                    display="flex"
                    gap="2"
                  >
                    <IconButton
                      aria-label="Settings"
                      size="sm"
                      bg="transparent"
                      color="white"
                      borderRadius="full"
                      onClick={() => setSettingsOpen(!settingsOpen)}
                      _hover={{
                        bg: "rgba(59, 130, 246, 0.2)",
                        borderColor: "rgba(59, 130, 246, 0.4)",
                        transform: "scale(1.05)",
                      }}
                      transition="all 0.2s"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0 1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                    </IconButton>
                    <IconButton
                      aria-label="Chat History List"
                      size="sm"
                      bg="transparent"
                      color="white"
                      borderRadius="full"
                      onClick={() =>
                        setChatHistoryListOpen(!chatHistoryListOpen)
                      }
                      _hover={{
                        bg: "rgba(59, 130, 246, 0.2)",
                        borderColor: "rgba(59, 130, 246, 0.4)",
                        transform: "scale(1.05)",
                      }}
                      transition="all 0.2s"
                      padding="0"
                      minWidth="32px"
                      height="32px"
                    >
                      <img
                        src={homeMenuIcon}
                        alt="menu"
                        style={{
                          width: "16px",
                          height: "16px",
                          objectFit: "contain",
                        }}
                      />
                    </IconButton>
                    <CreditsDisplay />
                  </Box>
                  {/* 左侧聊天历史面板（在数字人区域内滑出） */}
                  <Box
                    position="absolute"
                    top="10%"
                    left={`${GAP}px`}
                    width="35%"
                    maxWidth="461px"
                    minWidth="320px"
                    height="80%"
                    bg="rgba(255, 255, 255, 0.08)"
                    backdropFilter="blur(20px) saturate(180%)"
                    borderRadius="24px"
                    border="1px solid rgba(255, 255, 255, 0.2)"
                    transition="transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
                    transform={
                      historyOpen
                        ? "translateY(0)"
                        : `translateY(0) translateX(calc(-100% - ${GAP}px))`
                    }
                    zIndex={1000}
                    boxShadow="0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                    paddingLeft="7px"
                    paddingRight="7px"
                    paddingTop="20px"
                    paddingBottom="20px"
                    gap="38px"
                    overflow="hidden"
                    _before={{
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background:
                        "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
                      borderRadius: "24px",
                      pointerEvents: "none",
                    }}
                  >
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb="3"
                      position="relative"
                      zIndex={1}
                    >
                      <Box
                        fontWeight="600"
                        fontSize="xl"
                        color="rgba(255, 255, 255, 0.9)"
                        ml={"10px"}
                      >
                        Chat List
                      </Box>
                    </Box>
                    <Box
                      position="absolute"
                      inset="56px 0 20px 0"
                      overflow="hidden"
                      zIndex={1}
                    >
                      <ChatHistoryPanel />
                    </Box>
                  </Box>

                  {/* 右侧 MCP 结果面板（浅灰卡片风，与截图一致） */}
                  <Box
                    position="absolute"
                    top="10%"
                    right={`${GAP}px`}
                    width="35%"
                    maxWidth="458px"
                    minWidth="320px"
                    height="80%"
                    bg="rgba(255, 255, 255, 0.08)"
                    backdropFilter="blur(20px) saturate(180%)"
                    borderRadius="24px"
                    border="1px solid rgba(255, 255, 255, 0.2)"
                    transition="transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
                    transform={
                      mcpOpen
                        ? "translateY(0)"
                        : `translateY(0) translateX(calc(100% + ${GAP}px))`
                    }
                    zIndex={1000}
                    boxShadow="0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                    paddingLeft="15px"
                    paddingRight="15px"
                    paddingTop="20px"
                    paddingBottom="20px"
                    gap="16px"
                    overflow="hidden"
                    _before={{
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background:
                        "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
                      borderRadius: "24px",
                      pointerEvents: "none",
                    }}
                  >
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb="3"
                      position="relative"
                      zIndex={1}
                    >
                      <Box
                        width="129px"
                        height="35px"
                        opacity={1}
                        fontFamily="Source Han Sans CN"
                        fontWeight="500"
                        fontSize="24px"
                        lineHeight="100%"
                        letterSpacing="0%"
                        color="rgba(255, 255, 255, 0.9)"
                        ml={"8px"}
                        display="flex"
                        alignItems="center"
                        justifyContent="flex-start"
                      >
{t("mcp.result")}
                      </Box>
                      <Box display="flex" alignItems="center" gap="2">
                        <Box
                          width="20px"
                          height="20px"
                          borderRadius="full"
                          bg="#4ade80"
                          boxShadow="0 0 8px rgba(74, 222, 128, 0.6)"
                        />
                        <Box
                          color="rgba(255, 255, 255, 0.8)"
                          width="48px"
                          height="23px"
                          opacity={1}
                          fontFamily="Source Han Sans CN"
                          fontWeight="500"
                          fontSize="16px"
                          lineHeight="100%"
                          letterSpacing="0%"
                          display="flex"
                          alignItems="center"
                          justifyContent="flex-start"
                        >
                          linked
                        </Box>
                      </Box>
                    </Box>
                    <Box
                      position="absolute"
                      inset="56px 0 20px 0"
                      overflow="hidden"
                      zIndex={1}
                    >
                      <MCPWorkspacePanel />
                    </Box>
                  </Box>

                  {/* 历史面板打开按钮 - 仅在面板关闭时显示 */}
                  {!historyOpen && (
                    <Box
                      position="absolute"
                      top="50%"
                      left={`-${HANDLE_OVERLAP}px`}
                      transform="translateY(-50%)"
                      width="28px"
                      height="64px"
                      bg="rgba(255, 255, 255, 0.08)"
                      backdropFilter="blur(20px) saturate(180%)"
                      border="1px solid rgba(255, 255, 255, 0.2)"
                      borderRadius="0 12px 12px 0"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="rgba(255, 255, 255, 0.9)"
                      cursor="pointer"
                      zIndex={1000}
                      boxShadow="0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                      _hover={{
                        bg: "rgba(255, 255, 255, 0.12)",
                        transform:
                          "translateY(-50%) translateX(2px) scale(1.02)",
                        boxShadow:
                          "0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                      }}
                      transition="all 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
                      onClick={() => {
                        resetHandGestures(); // 先重置之前的手势
                        setTimeout(() => {
                          triggerRightWave(); // 左侧面板应该触发右手挥手
                        }, 20);
                        setTimeout(() => {
                          setHistoryOpen(true); // 延迟0.1秒后打开面板
                        }, 100);
                      }}
                      _before={{
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background:
                          "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
                        borderRadius: "0 12px 12px 0",
                        pointerEvents: "none",
                      }}
                    >
                      <FiChevronRight size={16} />
                    </Box>
                  )}

                  {/* MCP面板打开按钮 - 仅在面板关闭时显示 */}
                  {!mcpOpen && (
                    <Box
                      position="absolute"
                      top="50%"
                      right={`-${HANDLE_OVERLAP}px`}
                      transform="translateY(-50%)"
                      width="28px"
                      height="64px"
                      bg="rgba(255, 255, 255, 0.08)"
                      backdropFilter="blur(20px) saturate(180%)"
                      border="1px solid rgba(255, 255, 255, 0.2)"
                      borderRadius="12px 0 0 12px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="rgba(255, 255, 255, 0.9)"
                      cursor="pointer"
                      zIndex={1000}
                      boxShadow="0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                      _hover={{
                        bg: "rgba(255, 255, 255, 0.12)",
                        transform:
                          "translateY(-50%) translateX(-2px) scale(1.02)",
                        boxShadow:
                          "0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                      }}
                      transition="all 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
                      onClick={() => {
                        resetHandGestures(); // 先重置之前的手势
                        setTimeout(() => {
                          triggerLeftWave(); // 右侧面板应该触发左手挥手
                        }, 20);
                        setTimeout(() => {
                          setMcpOpen(true); // 延迟0.1秒后打开面板
                        }, 100);
                      }}
                      _before={{
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background:
                          "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
                        borderRadius: "12px 0 0 12px",
                        pointerEvents: "none",
                      }}
                    >
                      <FiChevronLeft size={16} />
                    </Box>
                  )}

                </Box>
              </Box>

              {/* 移除上方旧的设置按钮区，已在容器内重新渲染（zIndex 950），避免被透明点击层截获 */}

              {settingsOpen && (
                <Box position="absolute" top="20px" left="280px" zIndex={25}>
                  <IconButton
                    aria-label="Close Settings"
                    size="sm"
                    bg="rgba(20, 20, 30, 0.8)"
                    color="white"
                    borderRadius="full"
                    border="1px solid rgba(255,255,255,0.1)"
                    onClick={() => setSettingsOpen(false)}
                    _hover={{
                      bg: "rgba(239, 68, 68, 0.2)",
                      borderColor: "rgba(239, 68, 68, 0.4)",
                      transform: "scale(1.05)",
                    }}
                    transition="all 0.2s"
                    backdropFilter="blur(10px)"
                  >
                    <FiX />
                  </IconButton>
                </Box>
              )}

              {/* 好感度显示组件 */}
              <AffinityDisplay />

              {/* 字幕组件 */}
              <Box
                position="absolute"
                bottom="50px"
                left="50%"
                transform="translateX(-50%)"
                zIndex={1100}
                width="60%"
              >
                <Subtitle />
              </Box>

              {/* Welcome Modal */}
              <WelcomeModal
                isOpen={welcomeModalOpen}
                onClose={() => setWelcomeModalOpen(false)}
              />
            </Box>

            {/* Input Area */}
            <Box
              width="100%"
              height="100px"
              bg="transparent"
              zIndex={10}
              borderRadius="12px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Box width="100%">
                <Footer isCollapsed={false} />
              </Box>
            </Box>
          </Flex>
        </>
      )}

      {/* Conditional Rendering of Pet Mode UI */}
      {mode === "pet" && (
        <>
          <Box ref={live2dContainerRef} {...live2dPetStyle}>
            <Box position="relative" width="100%" height="100%">
              <Live2D />
            </Box>
          </Box>
          <InputSubtitle />
          <Box
            position="fixed"
            bottom="50px"
            left="50%"
            transform="translateX(-50%)"
            zIndex={1100}
            width="60%"
          >
            <Subtitle />
          </Box>
        </>
      )}

      {/* Chat History List Modal */}
      <ChatHistoryListModal
        isOpen={chatHistoryListOpen}
        onClose={() => setChatHistoryListOpen(false)}
        onOpenChatList={() => {
          setHistoryOpen(true);
          resetHandGestures();
        }}
      />

      {/* Pricing Overlay */}
      <PricingOverlay
        isOpen={pricingOpen}
        onClose={() => setPricingOpen(false)}
      />

      {/* Relationship Card */}
      {relationshipData && (
        <RelationshipCard
          isOpen={relationshipCardOpen}
          onClose={() => setRelationshipCardOpen(false)}
          data={relationshipData}
        />
      )}
    </>
  );
}

function App(): JSX.Element {
  return (
    <ChakraProvider value={defaultSystem}>
      <ModeProvider>
        <AppWithGlobalStyles />
      </ModeProvider>
    </ChakraProvider>
  );
}

function AppWithGlobalStyles(): JSX.Element {
  return (
    <>
      <AuthProvider>
        <UIProvider>
          <CameraProvider>
            <ScreenCaptureProvider>
              <CharacterConfigProvider>
                <ChatHistoryProvider>
                  <AiStateProvider>
                    <ProactiveSpeakProvider>
                      <Live2DConfigProvider>
                        <SubtitleProvider>
                          <VADProvider>
                            <BgUrlProvider>
                              <GroupProvider>
                                <BrowserProvider>
                                  <MCPWorkspaceProvider>
                                    <WebSocketHandler>
                                      <Toaster />
                                      <AppContent />
                                    </WebSocketHandler>
                                  </MCPWorkspaceProvider>
                                </BrowserProvider>
                              </GroupProvider>
                            </BgUrlProvider>
                          </VADProvider>
                        </SubtitleProvider>
                      </Live2DConfigProvider>
                    </ProactiveSpeakProvider>
                  </AiStateProvider>
                </ChatHistoryProvider>
              </CharacterConfigProvider>
            </ScreenCaptureProvider>
          </CameraProvider>
        </UIProvider>
      </AuthProvider>
    </>
  );
}

export default App;
