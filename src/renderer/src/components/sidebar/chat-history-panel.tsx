/* eslint-disable function-paren-newline */
/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable no-trailing-spaces */
/* eslint-disable no-nested-ternary */
/* eslint-disable import/order */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable react/require-default-props */
import React, { useEffect } from 'react';
import { Box, Spinner, Flex, Text, Icon } from '@chakra-ui/react';
import { sidebarStyles, chatPanelStyles } from './sidebar-styles';
import { MainContainer, ChatContainer, MessageList as ChatMessageList, Message as ChatMessage, Avatar as ChatAvatar } from '@chatscope/chat-ui-kit-react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { useChatHistory } from '@/context/chat-history-context';
import { Global } from '@emotion/react';
import { useConfig } from '@/context/character-config-context';
import { useWebSocket } from '@/context/websocket-context';
import { FaTools, FaCheck, FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

// Main component
function ChatHistoryPanel(): JSX.Element {
  const { t } = useTranslation();
  const { messages } = useChatHistory(); // Get messages directly from context
  const { confName } = useConfig();
  const { baseUrl } = useWebSocket();
  const userName = "Me";

  // 修改样式以匹配图片效果：浅灰背景、左右气泡、滚动条
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .cs-main-container { height: 100% !important; background: transparent !important; border: none !important; }
      .cs-chat-container { height: 100% !important; background: transparent !important; display: flex !important; flex-direction: column !important; }
      .cs-message-list { 
        flex: 1 !important; 
        height: auto !important; 
        max-height: 100% !important; 
        background: transparent !important; 
        padding: 20px 24px !important; 
        overflow-y: auto !important;
        overflow-x: hidden !important; 
      }
      .cs-message__content { background-color: rgba(255, 255, 255, 0.95) !important; color: #222 !important; border-radius: 12px !important; }
      .cs-message--outgoing .cs-message__content { background-color: rgba(80, 80, 80, 0.9) !important; color: #fff !important; }
      .cs-virtual-list { 
        overflow: visible !important; 
        height: auto !important;
        min-height: 100% !important;
      }
      /* 滚动条样式 */
      .cs-message-list::-webkit-scrollbar { width: 6px; }
      .cs-message-list::-webkit-scrollbar-track { background: rgba(0,0,0,0.15); border-radius: 4px; }
      .cs-message-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.35); border-radius: 4px; }
      .cs-message-list::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.5); }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const validMessages = messages.filter((msg) => msg.content || // Keep messages with content
     (msg.type === 'tool_call_status' && msg.status === 'running') || // Keep running tools
     (msg.type === 'tool_call_status' && msg.status === 'completed') || // Keep completed tools
     (msg.type === 'tool_call_status' && msg.status === 'error'), // Keep error tools
  );

  // 检查AI消息是否包含音乐生成相关内容
  const isAIMessageWithMusic = (msg: any): boolean => {
    if (msg.role !== 'ai' || !msg.content) return false;

    const content = msg.content.toLowerCase();
    return content.includes('音乐生成') ||
           content.includes('音乐已生成') ||
           content.includes('suno') ||
           content.includes('music generated') ||
           content.includes('音乐播放') ||
           (content.includes('音乐') && (content.includes('生成') || content.includes('播放')));
  };

  return (
    <Box
      h="100%"
      maxH="100%"
      overflow="hidden"
      bg="transparent"
      display="flex"
      flexDirection="column"
    >
      <Global styles={chatPanelStyles} />
      <MainContainer>
        <ChatContainer>
          <ChatMessageList>
            {validMessages.length === 0 ? (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100%"
                color="whiteAlpha.500"
                fontSize="sm"
              >
                {t('sidebar.noMessages')}
              </Box>
            ) : (
              validMessages.map((msg, index) => {
                // Check if it's a tool call message
                if (msg.type === 'tool_call_status') {
                  return (
                    // Render Tool Call Indicator using msg properties
                    <Flex
                      key={msg.id} // Use tool_id as key
                      {...sidebarStyles.toolCallIndicator.container}
                      alignItems="center"
                    >
                      <Icon
                        as={FaTools}
                        {...sidebarStyles.toolCallIndicator.icon}
                      />
                      <Text {...sidebarStyles.toolCallIndicator.text}>
                        {/* {msg.tool_name}: {msg.status === 'running' ? 'Running...' : msg.content} */}
                        {msg.status === "running" ? `${msg.name} is using tool ${msg.tool_name}` : `${msg.name} used tool ${msg.tool_name}`}
                      </Text>
                      {/* Show spinner if running, checkmark if completed, maybe error icon? */}
                      {msg.status === "running" && (
                        <Spinner
                          size="xs"
                          color={sidebarStyles.toolCallIndicator.spinner.color}
                          ml={sidebarStyles.toolCallIndicator.spinner.ml}
                        />
                      )}
                      {msg.status === "completed" && (
                        <Icon
                          as={FaCheck}
                          {...sidebarStyles.toolCallIndicator.completedIcon}
                        />
                      )}
                      {/* Optional: Add an error icon */}
                      {msg.status === "error" && (
                        <Icon
                          as={FaTimes}
                          {...sidebarStyles.toolCallIndicator.errorIcon}
                        />
                      )}
                    </Flex>
                  );
                }

                // Render Standard Chat Message (human or ai text)
                const chatMessage = (
                  <ChatMessage
                    key={msg.id}
                    model={{
                      message: msg.content,
                      sentTime: msg.timestamp,
                      sender: msg.role === 'ai'
                        ? (msg.name || confName || 'AI')
                        : userName,
                      direction: msg.role === 'ai' ? 'incoming' : 'outgoing',
                      position: 'single',
                    }}
                    avatarPosition={msg.role === 'ai' ? 'tl' : 'tr'}
                    avatarSpacer={false}
                  >
                    <ChatAvatar>
                      {msg.role === 'ai' ? (
                        <img
                          src={msg.avatar ? `${baseUrl}/avatars/${msg.avatar}` : '/favicon.ico'}
                          alt="avatar"
                          style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const fallbackName = msg.name || confName || 'A';
                            target.outerHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; border-radius: 50%; background-color: var(--chakra-colors-blue-500); color: white; font-size: 14px;">${fallbackName[0].toUpperCase()}</div>`;
                          }}
                        />
                      ) : (
                        userName[0].toUpperCase()
                      )}
                    </ChatAvatar>
                  </ChatMessage>
                );

                // 如果是包含音乐的AI消息，添加音乐控制器
                if (isAIMessageWithMusic(msg)) {
                  return (
                    <Box key={`${msg.id}-with-music`}>
                      {chatMessage}
                    </Box>
                  );
                }

                return chatMessage;
              })
            )}
          </ChatMessageList>
        </ChatContainer>
      </MainContainer>
    </Box>
  );
}

export default ChatHistoryPanel;
