import React, { useState, useEffect, useCallback, useRef } from "react";
import "./HeartAffinity.css";
import { UserInfo } from "@/services/auth-service";
import { wsService } from "@/services/websocket-service";
import { useWebSocket } from "@/context/websocket-context";
// 导入所有6张爱心动画视频
import love1Video from "/images/always/love_1.webm";
import love2Video from "/images/always/love_2.webm";
import love3Video from "/images/always/love_3.webm";
import love4Video from "/images/always/love_4.webm";
import love5Video from "/images/always/love_5.webm";
import love6Video from "/images/always/love_6.webm";
import heartValueVideo from "/images/always/heart_value.webm";
import siFullIcon from "/images/always/SI_full_icon.png";
import signalLowIcon from "/images/always/signal-low_icon.png";

// 爱心动画视频数组，分为上升和下降
const loveUpVideos = [love1Video, love2Video, love3Video]; // 好感度上升：1-3
const loveDownVideos = [love4Video, love5Video, love6Video]; // 好感度下降：4-6

// 好感度等级名称映射
function getAffinityLevelName(level?: string): string | null {
  if (!level) return null;
  const levelMap: Record<string, string> = {
    hatred: '敌对',
    hostile: '敌对',
    indifferent: '陌生',
    neutral: '陌生',
    friendly: '朋友',
    close: '亲近',
    devoted: '知己',
    // 新等级系统
    stranger: '陌生',
    acquaintance: '认识',
    friend: '朋友',
    soulmate: '知己',
  };
  return levelMap[level.toLowerCase()] || level;
}

interface HeartAffinityProps {
  websocket?: WebSocket | null;
  debug?: boolean;
  onAffinityChange?: (affinity: number, level: string) => void;
  user?: UserInfo | null;
  userId?: string;
  username?: string;
  isAuthenticated?: boolean;
}

const HeartAffinity: React.FC<HeartAffinityProps> = ({
  websocket,
  debug = false,
  onAffinityChange,
  user,
  userId,
  username,
  isAuthenticated,
}) => {
  console.log("[HeartAffinity] Component mounted");
  console.log("[HeartAffinity] 用户信息:", {
    userId,
    username,
    isAuthenticated,
  });

  // 获取WebSocket状态和重新连接方法
  const { wsState, reconnect } = useWebSocket();

  // 如果用户信息还在加载中（空字符串），不进行任何操作
  const isUserInfoLoading = userId === "" || username === "";
  if (isUserInfoLoading) {
    console.log("[HeartAffinity] 用户信息加载中，等待认证完成...");
  }

  // 状态管理
  const [affinity, setAffinity] = useState<number | null>(null); // 初始为null，等待服务器数据
  const [level, setLevel] = useState<string>("neutral"); // 默认级别为中立
  const [showMilestone, setShowMilestone] = useState<boolean>(false);
  const [milestone, setMilestone] = useState<string | null>(null);
  const [showExpression, setShowExpression] = useState<boolean>(false);
  const [expression, setExpression] = useState<{
    name: string;
    intensity: number;
  } | null>(null);
  const [heartbeat, setHeartbeat] = useState<boolean>(false); // 控制心跳动画
  const [showAffinityUp, setShowAffinityUp] = useState<boolean>(false); // 控制好感度上升动画
  const [affinityIncrease, setAffinityIncrease] = useState<number | null>(null); // 好感度增加数值
  const [dataReceived, setDataReceived] = useState<boolean>(false); // 是否已收到好感度数据
  const [currentLoveVideo, setCurrentLoveVideo] = useState<string>(love1Video); // 当前选择的爱心动画视频
  const [heartRate, setHeartRate] = useState<number>(60); // 心率，每分钟心跳次数（默认60）
  const videoRef = useRef<HTMLVideoElement>(null); // 心率视频的引用

  // 判断WebSocket是否连接
  const isWsConnected = wsState === "OPEN";

  // 根据好感度变化方向选择爱心动画视频
  const selectLoveVideo = useCallback((isIncrease: boolean) => {
    const targetVideos = isIncrease ? loveUpVideos : loveDownVideos;
    const randomIndex = Math.floor(Math.random() * targetVideos.length);
    const selectedVideo = targetVideos[randomIndex];
    setCurrentLoveVideo(selectedVideo);

    const videoNumber = isIncrease ? randomIndex + 1 : randomIndex + 4;
    const direction = isIncrease ? "上升" : "下降";
    console.log(
      `[HeartAffinity] 好感度${direction}，选择爱心动画: love_${videoNumber}.webm`
    );
    return selectedVideo;
  }, []);

  // 根据好感度计算心率
  const calculateHeartRate = useCallback((affinityValue: number) => {
    // 好感度范围通常是0-100，心率范围设为50-120 BPM
    const minHeartRate = 50;
    const maxHeartRate = 120;
    const rate = minHeartRate + (affinityValue / 100) * (maxHeartRate - minHeartRate);
    return Math.max(minHeartRate, Math.min(maxHeartRate, rate));
  }, []);

  // 获取心跳动画持续时间（秒）
  const getHeartbeatDuration = useCallback(() => {
    // 心率转换为动画持续时间：60 BPM = 1秒一次心跳
    return 60 / heartRate;
  }, [heartRate]);

  // 获取心跳动画强度（基于好感度）
  const getHeartbeatIntensity = useCallback(() => {
    if (affinity === null) return 1.05;

    // 好感度越高，心跳越明显（1.05 到 1.15 的范围）
    const baseScale = 1.05;
    const maxScale = 1.15;
    const intensity = baseScale + (affinity / 100) * (maxScale - baseScale);
    return Math.min(maxScale, intensity);
  }, [affinity]);

  // 控制心率视频播放速度
  useEffect(() => {
    if (videoRef.current) {
      // 根据心率调整播放速度
      // 心率60 BPM = 正常播放速度(1.0)
      // 心率越高，播放越快
      const playbackRate = heartRate / 60;
      videoRef.current.playbackRate = Math.max(0.5, Math.min(2.0, playbackRate));

      console.log(`[HeartAffinity] 心率视频播放速度调整为: ${playbackRate.toFixed(2)}x (心率: ${heartRate.toFixed(1)} BPM)`);
    }
  }, [heartRate]);

  // 处理视频加载完成
  const handleVideoLoaded = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.warn('[HeartAffinity] 视频自动播放失败:', error);
      });
      console.log('[HeartAffinity] 心率视频已加载并开始播放');
    }
  }, []);

  // 使用ref存储最新状态，避免闭包问题
  const affinityRef = useRef<number | null>(affinity);
  const levelRef = useRef<string>(level);
  const wsConnectedRef = useRef<boolean>(isWsConnected);
  const dataReceivedRef = useRef<boolean>(dataReceived);

  // 更新ref值
  useEffect(() => {
    affinityRef.current = affinity;
    levelRef.current = level;
    wsConnectedRef.current = isWsConnected;
    dataReceivedRef.current = dataReceived;
  }, [affinity, level, isWsConnected, dataReceived]);

  // 轮询定时器ref
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  // 重试计数器ref
  const retryCountRef = useRef<number>(0);
  // 最大重试次数
  const MAX_RETRIES = 5;
  // 轮询间隔（毫秒）
  const POLLING_INTERVAL = 10000; // 10秒

  // 请求初始好感度数据的函数
  const requestAffinityData = useCallback(() => {
    // 检查WebSocket服务连接状态
    const wsInstance = wsService.getWebSocketInstance();
    if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) {
      console.warn("[HeartAffinity] 无法请求好感度数据：WebSocket未连接");
      return false;
    }

    try {
      console.log(
        "[HeartAffinity] 请求好感度数据 (重试次数:",
        retryCountRef.current,
        ")"
      );
      console.log("[HeartAffinity] 当前用户信息:", {
        userId,
        username,
        isAuthenticated,
      });

      // 构建包含用户信息的基础请求数据
      const baseRequest = {
        user_id: userId || "default_user",
        username: username || "访客",
        authenticated: isAuthenticated || false,
      };

      // 尝试不同格式的请求，都包含用户信息
      const requests = [
        { type: "get-affinity", ...baseRequest },
        { action: "get-affinity", ...baseRequest },
        { command: "get-affinity", ...baseRequest },
        { cmd: "get-affinity", ...baseRequest },
        { type: "get_affinity", ...baseRequest },
        { action: "get_affinity", ...baseRequest },
        { command: "get_affinity", ...baseRequest },
        { cmd: "get_affinity", ...baseRequest },
        // 添加更多可能的格式
        { method: "get-affinity", ...baseRequest },
        { method: "get_affinity", ...baseRequest },
        { request: "affinity", ...baseRequest },
        { query: "affinity", ...baseRequest },
        { get: "affinity", ...baseRequest },
        // HeartAffinity专用格式
        { type: "HeartAffinity", action: "get", ...baseRequest },
        { type: "heartaffinity", action: "get", ...baseRequest },
      ];

      // 根据重试次数选择不同的请求格式
      const requestIndex = retryCountRef.current % requests.length;
      const request = requests[requestIndex];

      console.log(
        `[HeartAffinity] 尝试请求格式 ${requestIndex + 1}/${requests.length}:`,
        request
      );

      // 使用WebSocket服务发送消息
      wsService.sendMessage(request);

      return true;
    } catch (error) {
      console.error("[HeartAffinity] 请求好感度数据时出错:", error);
      return false;
    }
  }, [userId, username, isAuthenticated]);

  // 开始轮询
  const startPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
    }

    pollingTimerRef.current = setInterval(() => {
      // 只有在已连接但未收到数据时才继续轮询
      if (wsConnectedRef.current && !dataReceivedRef.current) {
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          requestAffinityData();
        } else if (retryCountRef.current === MAX_RETRIES) {
          console.warn("[HeartAffinity] 达到最大重试次数，停止轮询");
          retryCountRef.current++; // 增加计数器，避免再次显示警告
        }
      } else if (dataReceivedRef.current) {
        // 如果已收到数据，停止轮询
        if (pollingTimerRef.current) {
          clearInterval(pollingTimerRef.current);
          pollingTimerRef.current = null;
        }
      }
    }, POLLING_INTERVAL);

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [requestAffinityData]);

  // 监听用户认证状态变化，强制刷新好感度数据
  useEffect(() => {
    // 跳过加载状态
    if (isUserInfoLoading) {
      console.log("[HeartAffinity] 用户信息加载中，跳过认证状态检查");
      return;
    }

    const wsInstance = wsService.getWebSocketInstance();
    if (
      userId &&
      isAuthenticated &&
      wsInstance &&
      wsInstance.readyState === WebSocket.OPEN
    ) {
      console.log("[HeartAffinity] 用户认证状态变化，强制请求好感度数据:", {
        userId,
        isAuthenticated,
      });

      // 重置状态
      setDataReceived(false);
      retryCountRef.current = 0;

      // 强制请求新用户的好感度数据
      setTimeout(() => {
        requestAffinityData();
      }, 1000); // 延迟1秒确保后端已处理用户认证
    }
  }, [userId, isAuthenticated, requestAffinityData, isUserInfoLoading]);

  // 监听WebSocket服务连接状态
  useEffect(() => {
    // 跳过加载状态
    if (isUserInfoLoading) {
      console.log("[HeartAffinity] 用户信息加载中，跳过WebSocket连接处理");
      return;
    }

    console.log("[HeartAffinity] 订阅WebSocket服务状态变化");

    // 订阅WebSocket服务的状态变化
    const stateSubscription = wsService.onStateChange((state) => {
      console.log("[HeartAffinity] WebSocket状态变化:", state);
      const isConnected = state === "OPEN";

      if (isConnected) {
        console.log("[HeartAffinity] WebSocket连接已打开");
        retryCountRef.current = 0; // 重置重试计数器

        // 连接建立后，等待用户认证信息再请求好感度数据
        if (userId && isAuthenticated && !isUserInfoLoading) {
          console.log("[HeartAffinity] 连接建立且用户已认证，请求好感度数据");
          setTimeout(() => {
            requestAffinityData();
          }, 1500); // 延迟确保后端处理完用户认证
        } else {
          console.log(
            "[HeartAffinity] 连接建立但用户未认证或信息加载中，等待认证后请求数据"
          );
        }

        // 开始轮询（如果需要）
        startPolling();
      } else {
        console.log("[HeartAffinity] WebSocket连接已关闭或出错");

        // 清除轮询定时器
        if (pollingTimerRef.current) {
          clearInterval(pollingTimerRef.current);
          pollingTimerRef.current = null;
        }
      }
    });

    // 检查当前连接状态
    const currentState = wsService.getCurrentState();
    const isCurrentlyConnected = currentState === "OPEN";

    // 如果连接已经打开且用户信息已加载，立即请求数据并开始轮询
    if (
      isCurrentlyConnected &&
      !isUserInfoLoading &&
      userId &&
      isAuthenticated
    ) {
      console.log(
        "[HeartAffinity] WebSocket已连接且用户已认证，立即请求好感度数据"
      );
      requestAffinityData();
      startPolling();
    }

    // 清理函数
    return () => {
      stateSubscription.unsubscribe();
      console.log("[HeartAffinity] 已取消WebSocket状态订阅");

      // 清除轮询定时器
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [
    requestAffinityData,
    startPolling,
    isUserInfoLoading,
    userId,
    isAuthenticated,
  ]);

  // 处理WebSocket消息的回调函数
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        // 尝试解析JSON
        let data;
        try {
          data = JSON.parse(event.data);
        } catch (parseError) {
          console.warn("[HeartAffinity] 消息不是有效的JSON格式:", event.data);
          return;
        }

        console.log("[HeartAffinity] 收到消息:", data);

        // 尝试提取好感度数据，支持多种格式
        let newAffinity: number | null = null;
        let newLevel: string | null = null;
        let messageType: string | null = null;

        // 检查是否包含好感度数据 - 优先处理 HeartAffinity 消息格式
        if (
          // 标准好感度消息类型 (HeartAffinity)
          data.type === "HeartAffinity" ||
          data.type === "heartaffinity" ||
          data.type === "heart-affinity" ||
          data.type === "heart_affinity" ||
          // 好感度更新消息
          data.type === "affinity-update" ||
          data.type === "affinity_update" ||
          data.action === "affinity-update" ||
          data.action === "affinity_update" ||
          data.event === "affinity-update" ||
          data.event === "affinity_update" ||
          // 好感度数据响应
          data.type === "affinity-data" ||
          data.type === "affinity_data" ||
          data.action === "affinity-data" ||
          data.action === "affinity_data" ||
          data.response_to === "get-affinity" ||
          data.response_to === "get_affinity" ||
          // 其他可能的类型
          data.type === "affinity" ||
          data.action === "affinity" ||
          data.event === "affinity"
        ) {
          messageType = "affinity-data";
          // 优先从 HeartAffinity 标准字段提取数据
          newAffinity =
            data.HeartAffinity ??
            data.heartAffinity ??
            data.heart_affinity ??
            data.affinity ??
            data.value ??
            data.score ??
            data.level_value ??
            data.affinity_value;
          newLevel =
            data.level ??
            data.level_name ??
            data.affinity_level ??
            data.affinityLevel;

          console.log("[HeartAffinity] 提取的好感度数据:", {
            raw: data,
            extractedAffinity: newAffinity,
            extractedLevel: newLevel,
            messageType: data.type,
            returnedUserId: data.user_id,
            expectedUserId: userId,
            userIdMismatch: data.user_id !== userId,
          });

          // 检查用户ID不匹配的情况
          if (data.user_id && data.user_id !== userId) {
            console.warn("[HeartAffinity] ⚠️ 后端返回的用户ID与前端不匹配!", {
              backend: data.user_id,
              frontend: userId,
              authenticated: isAuthenticated,
            });
          }
        }
        // 里程碑事件
        else if (
          data.type === "affinity-milestone" ||
          data.type === "affinity_milestone" ||
          data.event === "affinity-milestone" ||
          data.event === "affinity_milestone"
        ) {
          messageType = "milestone";
          const milestoneText = data.milestone || data.text || data.message;
          const milestoneLevel = data.level || data.affinity_level;

          if (milestoneText) {
            // 根据等级生成庆祝文案
            const levelName = getAffinityLevelName(milestoneLevel);
            const celebrationText = levelName
              ? `✦ ${milestoneText}（亲近度：${levelName}）`
              : `✦ ${milestoneText}`;

            console.log("[HeartAffinity] 达成里程碑:", {
              milestone: celebrationText,
              level: milestoneLevel,
            });

            setMilestone(celebrationText);
            setShowMilestone(true);
            setTimeout(() => {
              console.log("[HeartAffinity] 隐藏里程碑通知");
              setShowMilestone(false);
            }, 5000);
          }
        }
        // 表情事件
        else if (
          data.type === "emotion-expression" ||
          data.type === "emotion_expression" ||
          data.event === "emotion-expression" ||
          data.event === "emotion_expression" ||
          data.type === "expression" ||
          data.event === "expression"
        ) {
          messageType = "expression";
          const expressionName = data.expression || data.emotion || data.name;
          const expressionIntensity =
            data.intensity || data.value || data.strength || 0.5;

          if (expressionName) {
            console.log("[HeartAffinity] 更新表情:", {
              expression: expressionName,
              intensity: expressionIntensity,
            });

            setExpression({
              name: expressionName,
              intensity: expressionIntensity,
            });
            setShowExpression(true);
            setTimeout(() => {
              console.log("[HeartAffinity] 隐藏表情通知");
              setShowExpression(false);
            }, 3000);
          }
        }
        // 尝试从其他消息格式中提取好感度信息
        else if (
          data.affinity !== undefined ||
          data.level !== undefined ||
          data.HeartAffinity !== undefined ||
          data.heartAffinity !== undefined ||
          data.heart_affinity !== undefined
        ) {
          messageType = "generic-affinity";
          console.log("[HeartAffinity] 从其他消息中提取好感度信息:", data);

          newAffinity =
            data.HeartAffinity ??
            data.heartAffinity ??
            data.heart_affinity ??
            data.affinity;
          newLevel = data.level ?? data.affinityLevel ?? data.affinity_level;
        }
        // 检查是否是包含嵌套数据的消息
        else if (data.data && typeof data.data === "object") {
          console.log("[HeartAffinity] 检查嵌套数据:", data.data);

          // 尝试从嵌套数据中提取好感度信息
          if (
            data.data.affinity !== undefined ||
            data.data.HeartAffinity !== undefined ||
            data.data.heartAffinity !== undefined ||
            data.data.heart_affinity !== undefined
          ) {
            messageType = "nested-data";
            newAffinity =
              data.data.HeartAffinity ??
              data.data.heartAffinity ??
              data.data.heart_affinity ??
              data.data.affinity;
            newLevel =
              data.data.level ??
              data.data.affinityLevel ??
              data.data.affinity_level;
          }
        }
        // 特殊处理：检查消息中是否直接包含 HeartAffinity 字段作为顶级属性
        else if (
          typeof data === "object" &&
          Object.keys(data).some(
            (key) =>
              key.toLowerCase().includes("heartaffinity") ||
              key.toLowerCase().includes("affinity")
          )
        ) {
          console.log(
            "[HeartAffinity] 检查包含affinity关键字的字段:",
            Object.keys(data)
          );

          // 查找包含 affinity 关键字的字段
          const affinityKey = Object.keys(data).find(
            (key) =>
              key.toLowerCase().includes("heartaffinity") ||
              (key.toLowerCase().includes("affinity") &&
                !key.toLowerCase().includes("level"))
          );
          const levelKey =
            Object.keys(data).find(
              (key) =>
                key.toLowerCase().includes("level") &&
                key.toLowerCase().includes("affinity")
            ) ?? "level";

          if (affinityKey && data[affinityKey] !== undefined) {
            messageType = "field-search";
            newAffinity = data[affinityKey];
            newLevel = data[levelKey] ?? data.level;

            console.log("[HeartAffinity] 通过字段搜索找到好感度:", {
              affinityKey,
              levelKey,
              affinity: newAffinity,
              level: newLevel,
            });
          }
        }

        // 如果提取到好感度数据，更新状态
        if (newAffinity !== null && newAffinity !== undefined) {
          // 确保好感度是有效数值
          const affinityNumber =
            typeof newAffinity === "number"
              ? newAffinity
              : parseFloat(String(newAffinity));

          if (isNaN(affinityNumber)) {
            console.warn("[HeartAffinity] 好感度数值无效:", newAffinity);
            return;
          }

          const hasChanged =
            affinityNumber !== affinityRef.current ||
            (newLevel && newLevel !== levelRef.current);

          console.log("[HeartAffinity] 好感度数据:", {
            messageType,
            old: affinityRef.current,
            new: affinityNumber,
            oldLevel: levelRef.current,
            newLevel: newLevel || levelRef.current,
            hasChanged,
          });

          if (hasChanged) {
            console.log("[HeartAffinity] 更新好感度:", {
              old: affinityRef.current,
              new: affinityNumber,
              level: newLevel || levelRef.current,
            });

            setAffinity(affinityNumber);
            if (newLevel) {
              setLevel(newLevel);
            }

            // 持久化好感度数据到 localStorage，供 greeting 上下文使用
            localStorage.setItem('ling_affinity', String(affinityNumber));
            if (newLevel) {
              localStorage.setItem('ling_affinity_level', newLevel);
            }

            // 根据新的好感度更新心率
            const newHeartRate = calculateHeartRate(affinityNumber);
            setHeartRate(newHeartRate);
            const heartbeatDuration = 60 / newHeartRate;
            const heartbeatIntensity = 1.05 + (affinityNumber / 100) * (1.15 - 1.05);
            console.log(`[HeartAffinity] 心率更新: ${newHeartRate.toFixed(1)} BPM (好感度: ${affinityNumber})`);
            console.log(`[HeartAffinity] 心跳动画: 持续时间 ${heartbeatDuration.toFixed(2)}s, 强度 ${heartbeatIntensity.toFixed(3)}`);

            // 检查好感度变化方向
            const isAffinityIncrease =
              affinityRef.current !== null &&
              affinityNumber > affinityRef.current;

            const isAffinityDecrease =
              affinityRef.current !== null &&
              affinityNumber < affinityRef.current;

            if (isAffinityIncrease && affinityRef.current !== null) {
              // 好感度上升时显示love动画和数字增加动效
              const increaseAmount = affinityNumber - affinityRef.current;
              console.log(
                "[HeartAffinity] 好感度上升，显示love动画和数字增加动效",
                {
                  increase: increaseAmount,
                  currentAffinity: affinityRef.current,
                  newAffinity: affinityNumber,
                  showAffinityUp: true,
                }
              );
              setAffinityIncrease(increaseAmount);
              // 选择好感度上升的爱心动画视频（1-3）
              selectLoveVideo(true);
              setShowAffinityUp(true);
              setTimeout(() => {
                setShowAffinityUp(false);
                setAffinityIncrease(null);
                console.log("[HeartAffinity] 动画隐藏");
              }, 3000); // 3秒后隐藏
            } else if (isAffinityDecrease && affinityRef.current !== null) {
              // 好感度下降时显示love动画和数字减少动效
              const decreaseAmount = affinityRef.current - affinityNumber;
              console.log(
                "[HeartAffinity] 好感度下降，显示love动画和数字减少动效",
                {
                  decrease: decreaseAmount,
                  currentAffinity: affinityRef.current,
                  newAffinity: affinityNumber,
                  showAffinityUp: true,
                }
              );
              setAffinityIncrease(-decreaseAmount); // 负数表示下降
              // 选择好感度下降的爱心动画视频（4-6）
              selectLoveVideo(false);
              setShowAffinityUp(true);
              setTimeout(() => {
                setShowAffinityUp(false);
                setAffinityIncrease(null);
                console.log("[HeartAffinity] 动画隐藏");
              }, 3000); // 3秒后隐藏
            } else {
              // 好感度无变化时显示心跳动画
              setHeartbeat(true);
              setTimeout(() => setHeartbeat(false), 1000);
            }

            // 回调（仅在有变化时）
            if (onAffinityChange) {
              onAffinityChange(affinityNumber, newLevel || level);
            }
          }

          // 标记已收到数据（无论是否变化）
          setDataReceived(true);

          // 重置重试计数器
          retryCountRef.current = 0;
        }
      } catch (error) {
        console.error("[HeartAffinity] 处理消息时出错:", error);
        console.error("[HeartAffinity] 原始消息:", event.data);
      }
    },
    [onAffinityChange, level, calculateHeartRate, selectLoveVideo]
  );

  // 直接订阅WebSocket服务的消息流（解决前后端分离版本消息接收问题）
  useEffect(() => {
    console.log("[HeartAffinity] 订阅WebSocket服务消息流");

    // 订阅WebSocket服务的消息流
    const subscription = wsService.onMessage((message: any) => {
      // 将WebSocket服务消息转换为MessageEvent格式
      const event = {
        data: typeof message === "string" ? message : JSON.stringify(message),
      } as MessageEvent;
      handleMessage(event);
    });

    // 同时保留全局消息处理器作为备用（用于兼容）
    const handleGlobalMessage = (message: any) => {
      const event = {
        data: typeof message === "string" ? message : JSON.stringify(message),
      } as MessageEvent;
      handleMessage(event);
    };

    // 注册全局消息处理函数（备用）
    if (window) {
      (window as any).affinityMessageHandler = handleGlobalMessage;
      console.log("[HeartAffinity] 已注册全局消息处理器（备用）");
    }

    return () => {
      // 取消WebSocket服务消息订阅
      subscription.unsubscribe();
      console.log("[HeartAffinity] 已取消WebSocket服务消息订阅");

      // 清理全局消息处理函数
      if (window && (window as any).affinityMessageHandler) {
        (window as any).affinityMessageHandler = undefined;
        console.log("[HeartAffinity] 已清理全局消息处理器");
      }
    };
  }, [handleMessage]);

  // 处理信号图标点击事件
  const handleSignalIconClick = useCallback((event: React.MouseEvent) => {
    // 阻止事件冒泡
    event.preventDefault();
    event.stopPropagation();

    try {
      if (reconnect && typeof reconnect === 'function') {
        reconnect();
      }
    } catch (error) {
      console.error("[HeartAffinity] 重新连接时出错:", error);
    }
  }, [reconnect]);

  // 根据好感度级别获取心形颜色
  const getHeartColor = (): string => {
    switch (level.toLowerCase()) {
      case "hatred":
      case "hostile":
        return "#ff4d4d"; // 红色
      case "indifferent":
        return "#ff9966"; // 橙色
      case "neutral":
        return "#ef4444"; // 默认红色（与截图一致）
      case "friendly":
        return "#40c057"; // 绿色
      case "close":
        return "#20c997"; // 青色
      case "devoted":
        return "#7950f2"; // 紫色
      default:
        return "#ef4444"; // 默认红色
    }
  };

  return (
    <div className="heart-affinity-display">
      {/* 信号状态图标 */}
      <img
        src={wsState === "OPEN" ? siFullIcon : signalLowIcon}
        alt="Connection Status"
        className="signal-icon"
        style={{
          width: "16px",
          height: "16px",
          marginRight: "8px",
          cursor: "pointer",
          userSelect: "none",
          pointerEvents: "auto",
          zIndex: 99999,
          position: "relative",
        } as React.CSSProperties}
        onClick={handleSignalIconClick}
        title={wsState === "OPEN" ? "连接正常" : "点击重新连接"}
      />

      {/* 心形视频 */}
      <video
        ref={videoRef}
        src={heartValueVideo}
        className={`heart-icon ${heartbeat ? "heart-beat" : ""}`}
        style={{
          opacity: wsState === "OPEN" ? 1 : 0.5, // 未连接时半透明
          animationDuration: `${getHeartbeatDuration()}s`, // 动态调整心跳速度
          backgroundColor: 'transparent', // 透明背景
          // @ts-ignore - CSS变量
          '--heartbeat-scale': getHeartbeatIntensity(),
        }}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload nofullscreen noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
        onLoadedData={handleVideoLoaded}
        onError={(e) => console.error('[HeartAffinity] 视频加载错误:', e)}
      />

      {/* 好感度数值 */}
      <div className="heart-affinity-value">
        {affinity !== null ? affinity : "?"}
      </div>

      {/* 里程碑通知 */}
      {showMilestone && milestone && (
        <div className="milestone-notification">
          <span>🎉 {milestone}</span>
        </div>
      )}

      {/* 表情通知 */}
      {showExpression && expression && (
        <div className="expression-notification">
          <span>
            {expression.name}
            <span className="intensity">
              {"★".repeat(Math.round(expression.intensity * 5))}
            </span>
          </span>
        </div>
      )}

      {/* 好感度上升动画 */}
      {showAffinityUp && (
        <div className="affinity-up-animation">
          <video
            src={currentLoveVideo}
            className="love-animation"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              backgroundColor: "transparent",
            }}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            controlsList="nodownload nofullscreen noremoteplayback"
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      )}

      {/* 数字变化动效 */}
      {showAffinityUp && affinityIncrease !== null && (
        <div
          className={`affinity-number-change ${affinityIncrease >= 0 ? 'increase' : 'decrease'}`}
        >
          {affinityIncrease >= 0 ? '+' : ''}{Math.round(affinityIncrease)}
        </div>
      )}
    </div>
  );
};

export default HeartAffinity;
