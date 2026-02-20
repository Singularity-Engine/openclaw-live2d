/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable no-trailing-spaces */
/* eslint-disable no-nested-ternary */
import React, { useState, useEffect, useRef } from "react";
import { Box, Flex, Text, Button } from "@chakra-ui/react";
import { FiX } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import { useChatHistory } from "@/context/chat-history-context";
import { useWebSocket } from "@/context/websocket-context";
import { HistoryInfo } from "@/context/websocket-context";
import { useTranslation } from "react-i18next";
import { toaster } from "@/components/ui/toaster";
import DeleteConfirmModal from "./delete-confirm-modal";
import RenameModal from "./rename-modal";
import chatIcon from "../../../images/always/chat_icon.png";
import menuIcon from "../../../images/always/menu_icon.png";
import moreIcon from "../../../images/always/more_icon.png";
import { filterDisplayText } from "@/utils/text-filter";

interface ChatHistoryListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChatList?: () => void;
}

interface HistoryItemProps {
  history: HistoryInfo;
  isSelected: boolean;
  onSelect: () => void;
  onPinToggle: (uid: string, isPinned: boolean) => void;
  onRename: (uid: string, newTitle: string) => void;
  onDelete: (uid: string) => void;
  isPinned: boolean;
  customTitle?: string;
  hasOpenDropdown: boolean;
  setHasOpenDropdown: (value: boolean) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({
  history,
  isSelected,
  onSelect,
  onPinToggle,
  onRename,
  onDelete,
  isPinned,
  customTitle,
  hasOpenDropdown,
  setHasOpenDropdown,
}) => {
  const { t } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setHasOpenDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      setHasOpenDropdown(true);
    } else {
      setHasOpenDropdown(false);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown, setHasOpenDropdown]);

  // 使用自定义标题或默认标题（优先使用后端返回的 custom_title）
  // 不再手动截断，让 CSS 的 text-overflow: ellipsis 处理
  // 对 latest_message.content 进行表情过滤
  const title =
    history.custom_title ||
    customTitle ||
    (history.latest_message?.content ? filterDisplayText(history.latest_message.content) : null) ||
    "No messages";

  // 简化时间显示格式（英文）
  const formatTimeShort = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    if (days < 30) return `${Math.floor(days / 7)}w`;
    if (days < 365) return `${Math.floor(days / 30)}mo`;
    return `${Math.floor(days / 365)}y`;
  };

  const timeStr = history.latest_message?.timestamp
    ? formatTimeShort(new Date(history.latest_message.timestamp))
    : formatTimeShort(new Date(history.timestamp || Date.now()));

  const handlePinToTop = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(false);
    setHasOpenDropdown(false);
    onPinToggle(history.uid, !isPinned);
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(false);
    setHasOpenDropdown(false);
    setShowRenameModal(true);
  };

  const handleRenameConfirm = (newTitle: string) => {
    if (newTitle && newTitle.trim() && newTitle.trim() !== title) {
      onRename(history.uid, newTitle.trim());
    }
    setShowRenameModal(false);
  };

  const handleRenameCancel = () => {
    setShowRenameModal(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(false);
    setHasOpenDropdown(false);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(history.uid);
    setShowDeleteConfirm(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <Flex
        width="100%"
        height="55px"
        bg={isPinned ? "rgba(223, 222, 222, 0.4)" : "rgba(104, 104, 104, 0.2)"}
        borderRadius="12px"
        padding="16px"
        gap="12px"
        marginBottom="8px"
        cursor="pointer"
        opacity={1}
        boxShadow={
          isPinned
            ? "0px 4px 4px 0px rgba(0, 0, 0, 0.25), 1px 1px 0.5px 0px rgba(0, 0, 0, 0.25) inset"
            : "0px 4px 4px 0px rgba(0, 0, 0, 0.25), 1px 1px 0.5px 0px rgba(0, 0, 0, 0.25) inset"
        }
        transition="all 0.2s ease-in-out"
        alignItems="center"
        justifyContent="space-between"
        _hover={
          hasOpenDropdown
            ? {}
            : {
                transform: "translateY(-1px)",
                boxShadow:
                  "0px 6px 6px 0px rgba(0, 0, 0, 0.3), 1px 1px 0.5px 0px rgba(0, 0, 0, 0.25) inset",
              }
        }
        onClick={hasOpenDropdown ? undefined : onSelect}
        pointerEvents={hasOpenDropdown ? "none" : "auto"}
      >
      {/* 左边：图标和标题 */}
      <Flex alignItems="center" flex="1" overflow="hidden" gap="8px">
        <Box
          width="20px"
          height="20px"
          opacity={1}
          borderRadius="3px"
          flexShrink={0}
        >
          <img
            src={chatIcon}
            alt="chat icon"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </Box>
        <Text
          fontFamily="Source Han Sans CN"
          fontWeight="400"
          fontSize="16px"
          lineHeight="150%"
          letterSpacing="0%"
          color="rgba(255, 255, 255, 0.9)"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          flex="1"
          minWidth="0"
        >
          {title}
        </Text>
      </Flex>

      {/* 右边：时间和更多选项 */}
      <Flex
        alignItems="center"
        gap="4px"
        flexShrink={0}
        position="relative"
        minWidth="50px"
      >
        <Text
          fontFamily="Source Han Sans CN"
          fontWeight="300"
          fontSize="12px"
          lineHeight="100%"
          letterSpacing="0%"
          color="rgba(255, 255, 255, 0.7)"
          whiteSpace="nowrap"
        >
          {timeStr}
        </Text>

        <Box position="relative" ref={dropdownRef} zIndex={1500}>
          <Button
            mr={"-14px"}
            variant="ghost"
            padding="4px"
            minWidth="50px"
            height="50px"
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            _hover={{
              bg: "rgba(255, 255, 255, 0.1)",
            }}
            pointerEvents="auto"
            borderRadius="4px"
          >
            <img
              src={moreIcon}
              alt="more options"
              style={{
                width: "16px",
                height: "16px",
                objectFit: "contain",
              }}
            />
          </Button>

          {/* 下拉菜单 - 简单解决方案 */}
          {showDropdown && (
            <Box
              position="absolute"
              top="20px"
              right="0"
              width="175px"
              height="148px"
              opacity={1}
              borderRadius="12px"
              gap="8px"
              padding="8px"
              bg="rgba(255, 255, 255, 0.4)"
              boxShadow="2px 4px 3px 0px rgba(0, 0, 0, 0.25), 2px 4px 3px 0px rgba(0, 0, 0, 0.25) inset, 0px 3px 2px 0px rgba(255, 255, 255, 1)"
              zIndex={2000}
              display="flex"
              flexDirection="column"
              pointerEvents="auto"
            >
              <Box
                width="159px"
                height="39px"
                opacity={1}
                borderRadius="6px"
                gap="8px"
                padding="8px"
                bg="rgba(206, 206, 206, 0.4)"
                boxShadow="2px 2px 3px 0px rgba(0, 0, 0, 0.25), 2px 2px 3px 0px rgba(0, 0, 0, 0.25) inset, 0.5px 0.5px 0.5px 0px rgba(255, 255, 255, 1) inset"
                cursor="pointer"
                display="flex"
                alignItems="center"
                onClick={handlePinToTop}
                _hover={{
                  bg: "rgba(206, 206, 206, 0.6)",
                }}
              >
                <Text
                  width="101px"
                  height="23px"
                  opacity={1}
                  fontFamily="Source Han Sans CN"
                  fontWeight="400"
                  fontSize="16px"
                  lineHeight="100%"
                  letterSpacing="0%"
                  color="rgba(255, 255, 255, 0.9)"
                >
                  {isPinned
                    ? t("chatHistory.unpin", "取消置顶")
                    : t("chatHistory.pinToTop")}
                </Text>
              </Box>
              <Box
                width="159px"
                height="39px"
                opacity={1}
                borderRadius="6px"
                gap="8px"
                padding="8px"
                bg="rgba(206, 206, 206, 0.4)"
                boxShadow="2px 2px 3px 0px rgba(0, 0, 0, 0.25), 2px 2px 3px 0px rgba(0, 0, 0, 0.25) inset, 0.5px 0.5px 0.5px 0px rgba(255, 255, 255, 1) inset"
                cursor="pointer"
                display="flex"
                alignItems="center"
                onClick={handleRename}
                _hover={{
                  bg: "rgba(206, 206, 206, 0.6)",
                }}
              >
                <Text
                  width="101px"
                  height="23px"
                  opacity={1}
                  fontFamily="Source Han Sans CN"
                  fontWeight="400"
                  fontSize="16px"
                  lineHeight="100%"
                  letterSpacing="0%"
                  color="rgba(255, 255, 255, 0.9)"
                >
                  {t("chatHistory.rename")}
                </Text>
              </Box>
              <Box
                width="159px"
                height="39px"
                opacity={1}
                borderRadius="6px"
                gap="8px"
                padding="8px"
                bg="rgba(206, 206, 206, 0.4)"
                boxShadow="2px 2px 3px 0px rgba(0, 0, 0, 0.25), 2px 2px 3px 0px rgba(0, 0, 0, 0.25) inset, 0.5px 0.5px 0.5px 0px rgba(255, 255, 255, 1) inset"
                cursor="pointer"
                display="flex"
                alignItems="center"
                onClick={handleDelete}
                _hover={{
                  bg: "rgba(206, 206, 206, 0.6)",
                }}
              >
                <Text
                  width="101px"
                  height="23px"
                  opacity={1}
                  fontFamily="Source Han Sans CN"
                  fontWeight="400"
                  fontSize="16px"
                  lineHeight="100%"
                  letterSpacing="0%"
                  color="rgba(255, 255, 255, 0.9)"
                >
                  {t("chatHistory.delete")}
                </Text>
              </Box>
            </Box>
          )}
        </Box>
      </Flex>
      </Flex>

      {/* 删除确认弹窗 */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        message={`${t("chatHistory.deleteConfirm", "确认删除此对话记录吗？")}\n\n${title}`}
      />

      {/* 重命名弹窗 */}
      <RenameModal
        isOpen={showRenameModal}
        onClose={handleRenameCancel}
        onConfirm={handleRenameConfirm}
        currentName={title}
        title={t("chatHistory.renamePrompt", "Enter new title:")}
      />
    </>
  );
};

const ChatHistoryListModal: React.FC<ChatHistoryListModalProps> = ({
  isOpen,
  onClose,
  onOpenChatList,
}) => {
  const { t } = useTranslation();
  const {
    historyList,
    currentHistoryUid,
    setHistoryList,
    setCurrentHistoryUid,
    setMessages,
  } = useChatHistory();
  const { wsService, sendMessage } = useWebSocket();
  const [hasOpenDropdown, setHasOpenDropdown] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭模态框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSelectHistory = async (uid: string) => {
    try {
      if (sendMessage) {
        sendMessage({
          type: "fetch-and-set-history",
          history_uid: uid,
        });
        setCurrentHistoryUid(uid);

        // 先打开Chat List界面
        if (onOpenChatList) {
          onOpenChatList();
        }

        // 然后关闭modal
        onClose();
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  const handlePinToggle = (uid: string, isPinned: boolean) => {
    if (sendMessage) {
      sendMessage({
        type: "pin-history",
        history_uid: uid,
        pinned: isPinned,
      });
    }
    
    console.log(`Requesting ${isPinned ? "pin" : "unpin"} for history ${uid}`);
  };

  const handleRename = (uid: string, newTitle: string) => {
    if (sendMessage) {
      sendMessage({
        type: "rename-history",
        history_uid: uid,
        new_title: newTitle,
      });
    }

    console.log(`Requesting rename for history ${uid} to: ${newTitle}`);
  };

  const handleDelete = (uid: string) => {
    if (uid === currentHistoryUid) {
      toaster.create({
        title: t("error.cannotDeleteCurrentHistory"),
        type: "warning",
        duration: 2000,
      });
      return;
    }

    if (sendMessage) {
      sendMessage({
        type: "delete-history",
        history_uid: uid,
      });
    }

    // 从本地状态中移除该历史记录
    setHistoryList(historyList.filter((history) => history.uid !== uid));

    toaster.create({
      title: t("notification.historyDeleteSuccess"),
      type: "success",
      duration: 2000,
    });
  };

  // 排序历史记录：置顶的在前，然后按时间排序（只使用后端返回的 is_pinned）
  const sortedHistoryList = [...historyList].sort((a, b) => {
    const aPinned = a.is_pinned || false;
    const bPinned = b.is_pinned || false;

    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;

    // 如果都是置顶或都不是置顶，按时间排序
    const aTime = new Date(a.timestamp || 0).getTime();
    const bTime = new Date(b.timestamp || 0).getTime();
    return bTime - aTime;
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Modal - 保持原视觉位置但使用响应式定位 */}
      <Box
        ref={modalRef}
        position="absolute"
        top="calc(2.5vh + 20px)"
        left="calc(4vw + 20px)"
        width="min(28vw, 470px)"
        height="min(65vh, 530px)"
        maxWidth="600px"
        maxHeight="700px"
        minWidth="350px"
        minHeight="400px"
        bg="rgba(172, 172, 172, 0.15)"
        borderRadius="24px"
        paddingLeft="7px"
        paddingRight="7px"
        paddingTop="20px"
        paddingBottom="20px"
        gap="38px"
        opacity={1}
        zIndex={1000}
        boxShadow="2px 4px 3px 0px rgba(0, 0, 0, 0.25), 2px 4px 4px 0px rgba(0, 0, 0, 0.25) inset"
        overflow="hidden"
      >
        {/* Header - 与chat list面板标题样式一致 */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb="3"
          position="relative"
          zIndex={1}
        >
          <Flex alignItems="center" gap="8px">
            <Box width="18px" height="14px" opacity={1} flexShrink={0}>
              <img
                src={menuIcon}
                alt="menu icon"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            </Box>
            <Box
              width="183.2890625px"
              height="27px"
              opacity={1}
              fontFamily="FZHei-B01S"
              fontWeight="400"
              fontSize="24px"
              lineHeight="100%"
              letterSpacing="0%"
              color="rgba(255, 255, 255, 0.9)"
            >
              Chat History List
            </Box>
          </Flex>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Close"
            onClick={onClose}
            color="rgba(255, 255, 255, 0.7)"
            _hover={{
              bg: "rgba(239, 68, 68, 0.2)",
              color: "white",
            }}
          >
            <FiX size={16} />
          </Button>
        </Box>

        {/* Content - 适应新尺寸的内容区域 */}
        <Box
          position="absolute"
          top="70px"
          bottom="20px"
          left="7px"
          right="7px"
          overflow="hidden"
          zIndex={1}
        >
          <Box
            height="100%"
            overflowY="auto"
            paddingRight="4px"
            css={{
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                background: "rgba(255,255,255,0.15)",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "rgba(255,255,255,0.35)",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                background: "rgba(255,255,255,0.5)",
              },
            }}
          >
            {sortedHistoryList.length === 0 ? (
              <Flex
                alignItems="center"
                justifyContent="center"
                height="200px"
                color="rgba(255, 255, 255, 0.5)"
              >
                <Text>{t("chatHistory.noHistory")}</Text>
              </Flex>
            ) : (
              sortedHistoryList.map((history) => (
                <HistoryItem
                  key={history.uid}
                  history={history}
                  isSelected={currentHistoryUid === history.uid}
                  onSelect={() => handleSelectHistory(history.uid)}
                  onPinToggle={handlePinToggle}
                  onRename={handleRename}
                  onDelete={handleDelete}
                  isPinned={history.is_pinned || false}
                  customTitle={undefined}
                  hasOpenDropdown={hasOpenDropdown}
                  setHasOpenDropdown={setHasOpenDropdown}
                />
              ))
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default ChatHistoryListModal;
