import React, { useState, useEffect, useRef } from "react";
import { Box, Text, Flex, IconButton } from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";
import { FaPlay, FaPause, FaMusic } from "react-icons/fa";
import { mcpMusicManager, MCPMusicInfo } from "@/utils/mcp-music-manager";
import { useTranslation } from "react-i18next";

interface MusicPlayerControllerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const MusicPlayerController: React.FC<MusicPlayerControllerProps> = ({
  className = "",
  size = "md",
}) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMusic, setCurrentMusic] = useState<MCPMusicInfo | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout>();

  // 尺寸配置
  const sizeConfig = {
    sm: {
      iconSize: "14px",
      fontSize: "xs",
      height: "32px",
      padding: "6px",
    },
    md: {
      iconSize: "16px",
      fontSize: "sm",
      height: "40px",
      padding: "8px",
    },
    lg: {
      iconSize: "18px",
      fontSize: "md",
      height: "48px",
      padding: "10px",
    },
  };

  const config = sizeConfig[size];

  // 监听音乐播放状态
  useEffect(() => {
    const checkMusicStatus = () => {
      const playing = mcpMusicManager.isPlayingMusic();
      const musicInfo = mcpMusicManager.getCurrentPlayingInfo();
      const currentVolume = mcpMusicManager.getVolume();

      setIsPlaying(playing);
      setCurrentMusic(musicInfo);
      setVolume(currentVolume);

      // 获取当前播放时间和总时长
      if (playing) {
        const audio = mcpMusicManager.getCurrentAudioElement();
        if (audio) {
          const audioCurrentTime = audio.currentTime;
          const audioDuration = audio.duration;

          // 拖拽时不更新当前时间，避免覆盖拖拽进度
          if (!isDragging) {
            // 确保时间值是有效的数字
            setCurrentTime(isFinite(audioCurrentTime) ? audioCurrentTime : 0);
          }

          // 检查是否为流式音频
          const isStreamingAudio =
            !isFinite(audioDuration) || audioDuration === 0;
          setIsStreaming(isStreamingAudio);

          if (isStreamingAudio) {
            // 流式音频：将当前播放时间作为"总时长"显示
            setDuration(isFinite(audioCurrentTime) ? audioCurrentTime : 0);
          } else {
            // 普通音频：使用真实的总时长
            setDuration(isFinite(audioDuration) ? audioDuration : 0);
          }
        }
      } else {
        if (!isDragging) {
          setCurrentTime(0);
        }
        setDuration(0);
      }
    };

    // 立即检查一次
    checkMusicStatus();

    // 定期检查状态（更频繁的检查）
    intervalRef.current = setInterval(checkMusicStatus, 500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isDragging]);

  // 播放/暂停控制
  const handlePlayPause = async () => {
    if (!currentMusic) {
      console.log("[MusicPlayerController] 没有音乐信息，无法播放");
      return;
    }

    if (isPlaying) {
      mcpMusicManager.pauseCurrentMusic();
      setIsPlaying(false);
    } else {
      mcpMusicManager.resumeCurrentMusic();
      // 等待播放操作完成后更新状态
      setTimeout(() => {
        const newPlaying = mcpMusicManager.isPlayingMusic();
        setIsPlaying(newPlaying);
      }, 200);
    }
  };

  // 进度控制
  const handleSeek = (newTime: number) => {
    const audio = mcpMusicManager.getCurrentAudioElement();
    if (audio && !isNaN(newTime)) {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // 处理拖拽开始
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration > 0 && !isStreaming) {
      setIsDragging(true);
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const progress = Math.max(0, Math.min(1, clickX / rect.width));
      const newTime = progress * duration;
      setDragTime(newTime);
    }
  };

  // 处理拖拽移动
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && duration > 0) {
      const progressBar = document.querySelector(
        "[data-progress-bar]"
      ) as HTMLElement;
      if (progressBar) {
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const progress = Math.max(0, Math.min(1, clickX / rect.width));
        const newTime = progress * duration;
        setDragTime(newTime);
      }
    }
  };

  // 处理拖拽结束
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      handleSeek(dragTime);
      // 延迟一点更新当前时间，确保音频跳转完成
      setTimeout(() => {
        setCurrentTime(dragTime);
      }, 100);
    }
  };

  // 添加全局事件监听器
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragTime, duration]);

  // 格式化时间
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 如果没有音乐，不显示控制器
  if (!currentMusic) {
    return null;
  }

  return (
    <Box
      className={className}
      bg="#00000066"
      opacity="0.54"
      borderRadius="36px"
      boxShadow="2px 4px 3px 0px #00000040, 2px 2px 3px 0px #00000040 inset, 0.5px 0.5px 0.5px 0px #FFFFFF40 inset"
      p={config.padding}
      minH={config.height}
      transition="all 0.3s ease"
      _hover={{
        opacity: "0.7",
      }}
    >
      <Flex alignItems="center" gap="2">
        {/* 音乐图标和标题 */}
        <Flex alignItems="center" gap="2" flex="1" minW="0">
          <Box
            p="1"
            bg="rgba(139, 92, 246, 0.2)"
            borderRadius="6px"
            color="#8b5cf6"
          >
            <FaMusic size="20px" />
          </Box>

          <Box flex="1" minW="0">
            {isPlaying ? (
              // 播放时显示标题和时间
              <Box w="100%">
                <Text
                  fontSize="lg"
                  fontWeight="600"
                  color="rgba(255, 255, 255, 0.9)"
                  truncate
                  mb="1"
                >
                  {currentMusic.title}
                </Text>

                {/* 进度条区域 */}
                <Box mb="1">
                  <Box
                    data-progress-bar
                    position="relative"
                    h="4px"
                    bg="rgba(255, 255, 255, 0.2)"
                    borderRadius="2px"
                    cursor={isStreaming ? "default" : "pointer"}
                    py="4px"
                    my="-4px"
                    onMouseDown={!isStreaming ? handleMouseDown : undefined}
                    onClick={(e) => {
                      if (!isDragging && duration > 0 && !isStreaming) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const progress = Math.max(
                          0,
                          Math.min(1, clickX / rect.width)
                        );
                        const newTime = progress * duration;
                        handleSeek(newTime);
                      }
                    }}
                    _hover={{
                      "& > div:first-of-type": {
                        h: "6px",
                      },
                      "& > div:last-child": {
                        opacity: "1",
                      },
                    }}
                  >
                    {/* 进度条填充 */}
                    <Box
                      position="absolute"
                      left="0"
                      top="50%"
                      transform="translateY(-50%)"
                      h="4px"
                      bg="linear-gradient(90deg, #8b5cf6, #a855f7)"
                      borderRadius="2px"
                      w={
                        isStreaming
                          ? "100%"
                          : duration > 0
                            ? `${((isDragging ? dragTime : currentTime) / duration) * 100}%`
                            : "0%"
                      }
                      transition={
                        isDragging
                          ? "height 0.2s ease"
                          : "height 0.2s ease, width 0.1s ease"
                      }
                      boxShadow="0 0 4px rgba(139, 92, 246, 0.6)"
                    />

                    {/* 进度指示器 */}
                    {duration > 0 && !isStreaming && (
                      <Box
                        position="absolute"
                        left={`${((isDragging ? dragTime : currentTime) / duration) * 100}%`}
                        top="50%"
                        transform="translate(-50%, -50%)"
                        w="12px"
                        h="12px"
                        bg="#8b5cf6"
                        borderRadius="50%"
                        border="2px solid rgba(255, 255, 255, 0.9)"
                        boxShadow="0 2px 4px rgba(0, 0, 0, 0.3)"
                        opacity={isDragging ? "1" : "0"}
                        transition="opacity 0.2s ease"
                        cursor="grab"
                        _active={{
                          cursor: "grabbing",
                        }}
                      />
                    )}
                  </Box>
                </Box>

                <Flex justifyContent="space-between">
                  <Text
                    fontSize="xs"
                    color={
                      isDragging
                        ? "rgba(139, 92, 246, 0.9)"
                        : "rgba(255, 255, 255, 0.6)"
                    }
                    transition="color 0.2s ease"
                  >
                    {formatTime(isDragging ? dragTime : currentTime)}
                  </Text>
                  <Text fontSize="xs" color="rgba(255, 255, 255, 0.6)">
                    {formatTime(duration)}
                  </Text>
                </Flex>
              </Box>
            ) : (
              // 未播放时显示标题
              <Text
                fontSize="lg"
                fontWeight="600"
                color="rgba(255, 255, 255, 0.9)"
                truncate
              >
                {currentMusic.title}
              </Text>
            )}
          </Box>
        </Flex>

        {/* 播放控制按钮 */}
        <Flex gap="1">
          <Tooltip content={isPlaying ? "暂停" : "播放"}>
            <IconButton
              aria-label={isPlaying ? "pause" : "play"}
              size="sm"
              variant="ghost"
              color="rgba(255, 255, 255, 0.8)"
              w="54px"
              h="55px"
              bg="#5C5C5C66"
              borderRadius="36px"
              opacity="1"
              boxShadow="2px 4px 3px 0px #00000040, 2px 2px 3px 0px #00000040 inset, 0.5px 0.5px 0.5px 0px #FFFFFF40 inset"
              _hover={{
                color: "#8b5cf6",
                bg: "rgba(139, 92, 246, 0.1)",
              }}
              onClick={handlePlayPause}
            >
              {isPlaying ? <FaPause size="18px" /> : <FaPlay size="18px" />}
            </IconButton>
          </Tooltip>
        </Flex>
      </Flex>
    </Box>
  );
};

export default MusicPlayerController;
