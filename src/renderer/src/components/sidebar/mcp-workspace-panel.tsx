import React, { useCallback, useState, useEffect } from "react";
import { Box, Text } from "@chakra-ui/react";
import { useMCPWorkspace } from "@/context/mcp-workspace-context";
import { formatDistanceToNow } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { mcpMusicManager, MCPMusicInfo } from "@/utils/mcp-music-manager";
import { MusicPlayerController } from "@/components/music/MusicPlayerController";

export const MCPWorkspacePanel: React.FC = () => {
  const { workspaceData, sessionHistory, isActive, clearSessionHistory } =
    useMCPWorkspace();
  const { i18n, t } = useTranslation();

  // 音乐播放状态
  const [currentMusicInfo, setCurrentMusicInfo] = useState<MCPMusicInfo | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  const locale = i18n.language === "zh" ? zhCN : enUS;

  // 检查会话是否包含音乐生成
  const hasMusicGeneration = useCallback((session: any) => {
    if (!session.tool_results) return false;
    return session.tool_results.some((result: any) =>
      result.name === 'suno-generate-music-with-stream' &&
      result.status === 'completed' &&
      result.result &&
      result.result.includes('音乐生成并获取流式URL成功')
    );
  }, []);

  // 监听音乐播放状态
  useEffect(() => {
    const updateMusicStatus = () => {
      const playing = mcpMusicManager.isPlayingMusic();
      const musicInfo = mcpMusicManager.getCurrentPlayingInfo();
      setIsPlayingMusic(playing);
      setCurrentMusicInfo(musicInfo);
    };

    // 定期检查音乐播放状态
    const interval = setInterval(updateMusicStatus, 1000);
    updateMusicStatus(); // 立即检查一次

    return () => clearInterval(interval);
  }, []);

  // Parse tool result - 使用 useCallback 优化性能
  const parseToolResult = useCallback(
    (result: any): { parsedResult: any; resultType: string } => {
      if (!result) {
        return { parsedResult: "", resultType: "text" };
      }

      // 如果是字符串，尝试解析
      if (typeof result === "string") {
        try {
          // 尝试解析 JSON
          const parsed = JSON.parse(result);

          // 检查标准格式: {response: {content: [...]}}
          if (parsed && parsed.response && parsed.response.content && Array.isArray(parsed.response.content)) {
            const hasImage = parsed.response.content.some((item: any) => item.type === "image");
            if (hasImage) {
              return { parsedResult: parsed, resultType: "image_response" };
            }
          }

          return { parsedResult: parsed, resultType: "json" };
        } catch {
          // 尝试解析Python元组格式: ('text', [ImageContent(...)])
          try {
            const pythonTupleMatch = result.match(/^\('([^']*)',\s*\[(.+)\]\)$/s);
            if (pythonTupleMatch) {
              const text = pythonTupleMatch[1];
              const contentStr = pythonTupleMatch[2];

              // 解析ImageContent对象
              const imageMatches = contentStr.matchAll(/ImageContent\(type='([^']+)',\s*data='([^']+)'/g);
              const content = [];

              if (text) {
                content.push({ type: 'text', text });
              }

              for (const match of imageMatches) {
                content.push({
                  type: match[1],
                  data: match[2],
                  mimeType: 'image/png'
                });
              }

              if (content.some((item: any) => item.type === 'image')) {
                return {
                  parsedResult: { response: { content } },
                  resultType: "image_response"
                };
              }
            }
          } catch (e) {
            console.error('[MCPWorkspace] Python元组解析失败:', e);
          }

          return { parsedResult: result, resultType: "text" };
        }
      }

      // 如果是对象，直接返回
      if (typeof result === "object") {
        // 检查标准格式
        if (result && result.response && result.response.content && Array.isArray(result.response.content)) {
          const hasImage = result.response.content.some((item: any) => item.type === "image");
          if (hasImage) {
            return { parsedResult: result, resultType: "image_response" };
          }
        }
        return { parsedResult: result, resultType: "json" };
      }

      // 其他类型转为字符串
      return { parsedResult: String(result), resultType: "text" };
    },
    []
  );

  // Format result for display - 使用 useCallback 缓存结果
  const formatResult = useCallback((result: any): string => {
    if (!result) return "";

    try {
      if (typeof result === "string") {
        return result;
      }
      if (typeof result === "object") {
        return JSON.stringify(result, null, 2);
      }
      return String(result);
    } catch (error) {
      console.error("[MCPWorkspace] 格式化结果错误:", error);
      return String(result);
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#4ade80"; // green
      case "error":
        return "#ef4444"; // red
      case "in_progress":
        return "#f59e0b"; // amber
      default:
        return "#6b7280"; // gray
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return t("mcp.status.completed");
      case "error":
        return t("mcp.status.error");
      case "in_progress":
        return t("mcp.status.inProgress");
      default:
        return t("mcp.status.unknown");
    }
  };

  // 渲染单个会话记录
  const renderSessionRecord = (session: any) => (
    <Box
      key={session.id}
      mb="4"
      p="3"
      bg="rgba(255, 255, 255, 0.05)"
      backdropFilter="blur(10px)"
      borderRadius="12px"
      border="1px solid rgba(255,255,255,0.1)"
    >
      {/* 用户查询 */}
      <Box mb="3">
        <Box display="flex" alignItems="center" gap="2" mb="2">
          <Box width="6px" height="6px" borderRadius="full" bg="#60a5fa" />
          <Text fontSize="sm" fontWeight="600" color="rgba(255, 255, 255, 0.9)">
            {t("mcp.workspace.userQuery")}
          </Text>
          <Text fontSize="xs" color="rgba(255, 255, 255, 0.5)">
            {formatDistanceToNow(new Date(session.timestamp), {
              addSuffix: true,
              locale,
            })}
          </Text>
        </Box>
        <Text
          color="rgba(255, 255, 255, 0.8)"
          fontSize="sm"
          lineHeight="1.4"
          pl="4"
        >
          {session.user_query || t("mcp.workspace.noQueryContent")}
        </Text>
      </Box>

      {/* 工具调用状态 */}
      {session.tool_calls && session.tool_calls.length > 0 && (
        <Box mb="3">
          <Box display="flex" alignItems="center" gap="2" mb="2">
            <Box width="6px" height="6px" borderRadius="full" bg="#f59e0b" />
            <Text
              fontSize="sm"
              fontWeight="600"
              color="rgba(255, 255, 255, 0.9)"
            >
              {t("mcp.workspace.toolCalls")}
            </Text>
          </Box>
          <Box display="flex" flexDirection="column" gap="2" pl="4">
            {session.tool_calls.map((tool: any, toolIndex: number) => (
              <Box
                key={`${tool.name}-${toolIndex}`}
                display="flex"
                alignItems="center"
                gap="2"
                p="2"
                bg="rgba(255, 255, 255, 0.05)"
                borderRadius="6px"
                border="1px solid rgba(255, 255, 255, 0.1)"
              >
                <Box
                  width="6px"
                  height="6px"
                  borderRadius="full"
                  bg={getStatusColor(tool.status)}
                  boxShadow={`0 0 6px ${getStatusColor(tool.status)}80`}
                />
                <Box flex="1" fontSize="xs" color="rgba(255, 255, 255, 0.8)">
                  {tool.name}
                </Box>
                <Box fontSize="xs" color="rgba(255, 255, 255, 0.6)">
                  {getStatusText(tool.status)}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* 工具结果 */}
      {session.tool_results && session.tool_results.length > 0 && (
        <Box mb="3">
          <Box display="flex" alignItems="center" gap="2" mb="2">
            <Box width="6px" height="6px" borderRadius="full" bg="#10b981" />
            <Text
              fontSize="sm"
              fontWeight="600"
              color="rgba(255, 255, 255, 0.9)"
            >
              {t("mcp.workspace.toolResults")}
            </Text>
          </Box>
          <Box
            maxHeight="400px"
            overflowY="auto"
            bg="rgba(255, 255, 255, 0.05)"
            borderRadius="8px"
            p="3"
            pl="4"
            border="1px solid rgba(255,255,255,0.1)"
            css={{
              "&::-webkit-scrollbar": { width: "4px" },
              "&::-webkit-scrollbar-track": {
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "2px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "rgba(255, 255, 255, 0.3)",
                borderRadius: "2px",
              },
            }}
          >
            {session.tool_results.map((result: any, resultIndex: number) => (
              <Box
                key={`result-${resultIndex}`}
                mb="2"
                pb="2"
                borderBottom={
                  resultIndex < session.tool_results.length - 1
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "none"
                }
              >
                <Box display="flex" alignItems="center" gap="2" mb="1">
                  <Box
                    width="4px"
                    height="4px"
                    borderRadius="full"
                    bg={getStatusColor(result.status)}
                  />
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="rgba(255, 255, 255, 0.9)"
                  >
                    {result.name}
                  </Text>
                </Box>
                <Box>
                  {(() => {
                    try {
                      const resultData = result.result || result.partial_result;
                      const { parsedResult, resultType } =
                        parseToolResult(resultData);

                      // 如果是图片响应，渲染图片和文本
                      if (resultType === "image_response") {
                        const responseData = parsedResult;
                        const content = responseData.response?.content || [];

                        return (
                          <Box>
                            {content.map((item: any, itemIndex: number) => {
                              if (item.type === "text") {
                                // 渲染文本内容
                                const textContent = item.text || "";

                                // 检查是否包含流式播放URL，并转换为可点击链接
                                const urlRegex = /流式播放URL:\s*(https?:\/\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=-]+)/g;
                                const urlMatches = [...textContent.matchAll(urlRegex)];

                                if (urlMatches.length > 0) {
                                  // 处理URL链接
                                  let processedContent = textContent;
                                  for (let i = urlMatches.length - 1; i >= 0; i--) {
                                    const match = urlMatches[i];
                                    const fullMatch = match[0];
                                    const url = match[1];
                                    const startIndex = match.index!;
                                    const endIndex = startIndex + fullMatch.length;
                                    const prefix = "流式播放URL: ";
                                    const replacement = `${prefix}__URL_PLACEHOLDER_${i}__`;
                                    processedContent = processedContent.substring(0, startIndex) +
                                                     replacement +
                                                     processedContent.substring(endIndex);
                                  }

                                  const parts = processedContent.split(/(__URL_PLACEHOLDER_\d+__)/);
                                  return (
                                    <Box
                                      key={itemIndex}
                                      fontSize="xs"
                                      color="rgba(255, 255, 255, 0.8)"
                                      fontFamily="'Courier New', monospace"
                                      whiteSpace="pre-wrap"
                                      lineHeight="1.3"
                                      mb="2"
                                    >
                                      {parts.map((part, partIndex) => {
                                        const placeholderMatch = part.match(/__URL_PLACEHOLDER_(\d+)__/);
                                        if (placeholderMatch) {
                                          const urlIndex = parseInt(placeholderMatch[1]);
                                          const url = urlMatches[urlIndex][1];
                                          return (
                                            <Box
                                              key={partIndex}
                                              as="a"
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              color="#60a5fa"
                                              textDecoration="underline"
                                              _hover={{ color: "#93c5fd" }}
                                              cursor="pointer"
                                              display="inline"
                                            >
                                              {url}
                                            </Box>
                                          );
                                        }
                                        return part;
                                      })}
                                    </Box>
                                  );
                                }

                                return (
                                  <Box
                                    key={itemIndex}
                                    fontSize="xs"
                                    color="rgba(255, 255, 255, 0.8)"
                                    fontFamily="'Courier New', monospace"
                                    whiteSpace="pre-wrap"
                                    lineHeight="1.3"
                                    mb="2"
                                  >
                                    {textContent}
                                  </Box>
                                );
                              } else if (item.type === "image") {
                                // 渲染图片
                                const imageData = item.data;
                                const mimeType = item.mimeType || "image/png";
                                const imageSrc = `data:${mimeType};base64,${imageData}`;

                                return (
                                  <Box
                                    key={itemIndex}
                                    mt="2"
                                    mb="2"
                                    borderRadius="8px"
                                    overflow="hidden"
                                    border="1px solid rgba(255, 255, 255, 0.2)"
                                    bg="rgba(255, 255, 255, 0.05)"
                                  >
                                    <Box
                                      as="img"
                                      src={imageSrc}
                                      alt="Generated Image"
                                      maxWidth="100%"
                                      maxHeight="300px"
                                      objectFit="contain"
                                      cursor="pointer"
                                      _hover={{
                                        transform: "scale(1.02)",
                                        transition: "transform 0.2s ease"
                                      }}
                                      onClick={() => {
                                        // 点击图片时在新窗口中打开
                                        const newWindow = window.open();
                                        if (newWindow) {
                                          newWindow.document.write(`
                                            <html>
                                              <head><title>Generated Image</title></head>
                                              <body style="margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #000;">
                                                <img src="${imageSrc}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
                                              </body>
                                            </html>
                                          `);
                                          newWindow.document.close();
                                        }
                                      }}
                                    />
                                    <Box p="2" fontSize="xs" color="rgba(255, 255, 255, 0.6)">
                                      📷 点击查看大图
                                    </Box>
                                  </Box>
                                );
                              }
                              return null;
                            })}
                          </Box>
                        );
                      }

                      // 普通文本或JSON内容
                      let content: string;
                      if (resultType === "json") {
                        content = JSON.stringify(parsedResult, null, 2);
                      } else {
                        content = String(parsedResult);
                      }

                      // 检查是否包含流式播放URL，并转换为可点击链接
                      const urlRegex = /流式播放URL:\s*(https?:\/\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=-]+)/g;
                      const urlMatches = [...content.matchAll(urlRegex)];

                      if (urlMatches.length > 0) {
                        // 从后往前替换，避免索引偏移问题
                        let processedContent = content;
                        for (let i = urlMatches.length - 1; i >= 0; i--) {
                          const match = urlMatches[i];
                          const fullMatch = match[0]; // 完整匹配 "流式播放URL: https://..."
                          const url = match[1]; // 提取的URL
                          const startIndex = match.index!;
                          const endIndex = startIndex + fullMatch.length;

                          // 构建替换内容：保留前缀，URL变成占位符
                          const prefix = "流式播放URL: ";
                          const replacement = `${prefix}__URL_PLACEHOLDER_${i}__`;

                          processedContent = processedContent.substring(0, startIndex) +
                                           replacement +
                                           processedContent.substring(endIndex);
                        }

                        // 分割内容并替换占位符
                        const parts = processedContent.split(/(__URL_PLACEHOLDER_\d+__)/);
                        return (
                          <Box
                            fontSize="xs"
                            color="rgba(255, 255, 255, 0.8)"
                            fontFamily="'Courier New', monospace"
                            whiteSpace="pre-wrap"
                            lineHeight="1.3"
                          >
                            {parts.map((part, index) => {
                              // 检查是否是URL占位符
                              const placeholderMatch = part.match(/__URL_PLACEHOLDER_(\d+)__/);
                              if (placeholderMatch) {
                                const urlIndex = parseInt(placeholderMatch[1]);
                                const url = urlMatches[urlIndex][1];
                                return (
                                  <Box
                                    key={index}
                                    as="a"
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    color="#60a5fa"
                                    textDecoration="underline"
                                    _hover={{ color: "#93c5fd" }}
                                    cursor="pointer"
                                    display="inline"
                                  >
                                    {url}
                                  </Box>
                                );
                              }
                              return part;
                            })}
                          </Box>
                        );
                      }

                      return (
                        <Box
                          fontSize="xs"
                          color="rgba(255, 255, 255, 0.8)"
                          fontFamily="'Courier New', monospace"
                          whiteSpace="pre-wrap"
                          lineHeight="1.3"
                        >
                          {content}
                        </Box>
                      );
                    } catch (error) {
                      console.error("[MCPWorkspace] 渲染工具结果错误:", error);
                      return (
                        <Box
                          fontSize="xs"
                          color="rgba(255, 255, 255, 0.8)"
                          fontFamily="'Courier New', monospace"
                          whiteSpace="pre-wrap"
                          lineHeight="1.3"
                        >
                          {formatResult(result.result || result.partial_result)}
                        </Box>
                      );
                    }
                  })()}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* AI回答 */}
      <Box>
        <Box display="flex" alignItems="center" gap="2" mb="2">
          <Box width="6px" height="6px" borderRadius="full" bg="#8b5cf6" />
          <Text fontSize="sm" fontWeight="600" color="rgba(255, 255, 255, 0.9)">
            {t("mcp.workspace.aiAnswer")}
          </Text>
        </Box>
        <Box
          pl="4"
          p="3"
          bg="rgba(255, 255, 255, 0.05)"
          borderRadius="8px"
          border="1px solid rgba(255,255,255,0.1)"
        >
          <Text
            color="rgba(255, 255, 255, 0.8)"
            fontSize="sm"
            lineHeight="1.4"
            whiteSpace="pre-wrap"
            wordBreak="break-word"
          >
            {(() => {
              if (session.final_answer) {
                return session.final_answer;
              }
              if (session.partial_answer) {
                return session.partial_answer;
              }
              return session.status === "completed"
                ? t("mcp.workspace.processingComplete")
                : t("mcp.workspace.processing");
            })()}
          </Text>

          {/* 如果当前会话包含音乐生成，显示音乐播放器 */}
          {hasMusicGeneration(session) && currentMusicInfo && (
            <Box mt="3">
              <MusicPlayerController size="sm" />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );

  if (!isActive || (sessionHistory.length === 0 && !workspaceData)) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        height="100%"
        justifyContent="center"
        alignItems="center"
        color="rgba(255, 255, 255, 0.6)"
        fontSize="sm"
      >
        <Box mb="2">🤖</Box>
        <Box textAlign="center">{t("mcp.workspace.waitingForData")}</Box>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      overflowY="auto"
      ml="30px"
      mr="16px"
      css={{
        "&::-webkit-scrollbar": { width: "6px" },
        "&::-webkit-scrollbar-track": {
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "4px",
        },
        "&::-webkit-scrollbar-thumb": {
          background: "rgba(255, 255, 255, 0.3)",
          borderRadius: "4px",
        },
        "&::-webkit-scrollbar-thumb:hover": {
          background: "rgba(255, 255, 255, 0.4)",
        },
      }}
    >
      {/* 标题和清除按钮 */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        p="4"
        borderBottom="1px solid rgba(255, 255, 255, 0.1)"
        mb="4"
        flexShrink={0}
      >
        <Text color="rgba(255, 255, 255, 0.9)" fontWeight="600" fontSize="lg">
          {t("mcp.workspace.title")}
        </Text>
        {sessionHistory.length > 0 && (
          <Box
            as="button"
            onClick={clearSessionHistory}
            color="rgba(255, 255, 255, 0.6)"
            fontSize="xs"
            _hover={{ color: "rgba(255, 255, 255, 0.8)" }}
            bg="rgba(255, 255, 255, 0.1)"
            px="2"
            py="1"
            borderRadius="4px"
            border="1px solid rgba(255, 255, 255, 0.2)"
          >
            {t("mcp.workspace.clearHistory")}
          </Box>
        )}
      </Box>


      {/* 会话历史记录 */}
      <Box flex="1" pb="4">
        {/* 显示当前会话（如果有） */}
        {workspaceData && workspaceData.user_query && (
          <Box mb="4">
            <Text
              color="rgba(255, 255, 255, 0.7)"
              fontSize="sm"
              fontWeight="600"
              mb="2"
              px="2"
            >
              {t("mcp.workspace.currentSession")}
            </Text>
            {renderSessionRecord({
              id: "current",
              timestamp: workspaceData.timestamp,
              user_query: workspaceData.user_query,
              status: workspaceData.status,
              tool_calls: workspaceData.tool_calls,
              tool_results: workspaceData.tool_results,
              final_answer: workspaceData.final_answer,
              partial_answer: workspaceData.partial_answer,
            })}
          </Box>
        )}

        {/* 显示历史会话 */}
        {sessionHistory.length > 0 && (
          <Box>
            <Text
              color="rgba(255, 255, 255, 0.7)"
              fontSize="sm"
              fontWeight="600"
              mb="2"
              px="2"
            >
              {t("mcp.workspace.historySessions")} ({sessionHistory.length})
            </Text>
            {sessionHistory
              .slice()
              .reverse() // 最新的在上面
              .map((session) => renderSessionRecord(session))}
          </Box>
        )}

        {/* 空状态提示 */}
        {sessionHistory.length === 0 && !workspaceData && (
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            height="200px"
            color="rgba(255, 255, 255, 0.6)"
            fontSize="sm"
            textAlign="center"
          >
            <Box mb="2" fontSize="2xl">
              💬
            </Box>
            <Box>{t("mcp.workspace.noRecords")}</Box>
            <Box mt="1" fontSize="xs" color="rgba(255, 255, 255, 0.4)">
              {t("mcp.workspace.noRecordsDesc")}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MCPWorkspacePanel;
