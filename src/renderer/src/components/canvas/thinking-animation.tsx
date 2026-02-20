import { Box, Text } from '@chakra-ui/react';
import { memo, useState, useEffect, useRef } from 'react';
const questionVideo = '/images/always/question.webm';

const animationStyles = `
  .subtitle-stage {
    position: relative;
    width: 100%;
    min-height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* 主容器 - 统一的变形元素 */
  .morphing-container {
    position: relative;
    display: block;
    /* 玻璃态材质 */
    background: rgba(255, 255, 255, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow:
      0px 1px 0.5px 0px rgba(0, 0, 0, 0.25),
      0px 1px 0.5px 0px rgba(0, 0, 0, 0.25) inset,
      0px 0.5px 0px 0px rgba(255, 255, 255, 0.25) inset;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    /* 初始状态：思考圆形 */
    width: 56px;
    height: 56px;
    min-height: 56px;
    border-radius: 50%;
    padding: 0;
    /* 平滑过渡 */
    transition:
      width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
      border-radius 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
      padding 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s,
      min-height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    will-change: width, border-radius;
  }

  /* 思考阶段 - 脉冲效果 */
  .morphing-container.thinking {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    overflow: hidden;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0.9;
    }
    50% {
      transform: scale(1.05);
      opacity: 1;
    }
  }

  /* 展开阶段 - 拉伸成字幕框 */
  .morphing-container.expanding,
  .morphing-container.expanded {
    border-radius: 36px;
    padding: 12px 24px;
    min-height: 48px;
    max-height: 120px; /* 允许最多2行的高度 */
    height: auto;
    animation: none;
    overflow: hidden; /* 确保超出内容被隐藏 */
    max-width: 95vw;
  }

  /* 视频图标容器 */
  .icon-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 1;
    transition: opacity 0.3s ease-out;
  }

  /* 展开时隐藏图标 */
  .morphing-container.expanding .icon-container,
  .morphing-container.expanded .icon-container {
    opacity: 0;
    pointer-events: none;
  }

  /* 字幕文本 - 基础样式 */
  .subtitle-content {
    color: rgba(0, 0, 0, 1);
    font-family: "Source Han Sans CN", sans-serif;
    font-weight: 500;
    font-size: 24px;
    line-height: 1.4;
    letter-spacing: 0%;
    text-align: center;
    /* 初始隐藏 */
    opacity: 0;
    transform: translateY(5px);
    transition:
      opacity 0.4s ease-in 0.3s,
      transform 0.4s ease-out 0.3s;
  }

  /* 单行模式 - 优先使用 */
  .subtitle-content.single-line {
    white-space: nowrap;
    overflow: hidden;
  }

  /* 多行模式 - 只在必要时使用 */
  .subtitle-content.multi-line {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  /* 展开时显示文本 */
  .morphing-container.expanding .subtitle-content,
  .morphing-container.expanded .subtitle-content {
    opacity: 1;
    transform: translateY(0);
  }

  /* 思考时确保文本完全不可见 */
  .morphing-container.thinking .subtitle-content {
    opacity: 0;
    transform: translateY(5px);
    transition: none;
  }
`;

interface ThinkingAnimationProps {
  phase?: 'thinking' | 'insight' | 'subtitle';
  text?: string;
  thinkingDuration?: number;
  onAnimationComplete?: () => void;
  onExpandingComplete?: () => void;
}

const ThinkingAnimation = memo(({
  phase = 'thinking',
  text,
  onAnimationComplete,
  onExpandingComplete
}: ThinkingAnimationProps): JSX.Element => {
  // 内部动画状态：thinking -> expanding -> expanded
  const [animationState, setAnimationState] = useState<'thinking' | 'expanding' | 'expanded'>('thinking');
  const [displayText, setDisplayText] = useState<string>('');
  const [targetWidth, setTargetWidth] = useState<number>(56);
  const [useMultiLine, setUseMultiLine] = useState<boolean>(false); // 是否需要多行显示

  const animationLockRef = useRef<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 精确测量文本宽度
  const measureTextWidth = (text: string): number => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const context = canvasRef.current.getContext('2d');
    if (context) {
      context.font = '500 24px "Source Han Sans CN", sans-serif';
      const fullWidth = Math.ceil(context.measureText(text).width);
      return fullWidth;
    }
    return 200; // 降级默认值
  };

  // 执行展开动画
  useEffect(() => {
    if (phase === 'thinking') {
      // 重置到思考状态
      setAnimationState('thinking');
      setDisplayText('');
      setTargetWidth(56);
      animationLockRef.current = false;
    } else if ((phase === 'insight' || phase === 'subtitle') && !animationLockRef.current) {
      // 开始展开动画
      animationLockRef.current = true;

      // 计算目标宽度 - 优先单行显示
      const textWidth = text ? measureTextWidth(text) : 200;
      const screenWidth = window.innerWidth;
      const maxContainerWidth = screenWidth * 0.95; // 容器最大宽度

      // 判断是否需要多行显示
      const needMultiLine = textWidth + 48 > maxContainerWidth;

      if (needMultiLine) {
        // 文本太长，需要多行显示，容器占满
        setTargetWidth(maxContainerWidth);
        setUseMultiLine(true);
      } else {
        // 文本可以单行显示
        setTargetWidth(textWidth + 48);
        setUseMultiLine(false);
      }

      setDisplayText(text || '');
      setAnimationState('expanding');

      // 300ms后通知可以播放音频（展开动画进行到一半）
      const audioTimeout = setTimeout(() => {
        if (onExpandingComplete) {
          onExpandingComplete();
        }
      }, 300);

      // 600ms后动画完成
      const completeTimeout = setTimeout(() => {
        setAnimationState('expanded');
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 600);

      return () => {
        clearTimeout(audioTimeout);
        clearTimeout(completeTimeout);
      };
    } else if (phase === 'subtitle') {
      // 静态显示模式 - 直接更新文本
      if (text && text !== displayText) {
        const textWidth = measureTextWidth(text);
        const screenWidth = window.innerWidth;
        const maxContainerWidth = screenWidth * 0.95;

        const needMultiLine = textWidth + 48 > maxContainerWidth;

        if (needMultiLine) {
          setTargetWidth(maxContainerWidth);
          setUseMultiLine(true);
        } else {
          setTargetWidth(textWidth + 48);
          setUseMultiLine(false);
        }

        setDisplayText(text);
        setAnimationState('expanded');
      }
    }
  }, [phase, text, onAnimationComplete, onExpandingComplete]);

  return (
    <>
      <style>{animationStyles}</style>
      <Box className="subtitle-stage">
        <Box
          className={`morphing-container ${animationState}`}
          style={{
            width: animationState === 'thinking' ? '56px' : `${targetWidth}px`,
          }}
        >
          {/* 思考图标 */}
          <Box className="icon-container">
            <video
              src={questionVideo}
              width="36px"
              height="36px"
              autoPlay
              loop
              muted
              playsInline
              style={{
                backgroundColor: 'transparent',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
              disablePictureInPicture
              disableRemotePlayback
              controlsList="nodownload nofullscreen noremoteplayback"
              onContextMenu={(e) => e.preventDefault()}
            />
          </Box>

          {/* 字幕文本 */}
          <Text
            className={useMultiLine ? "subtitle-content multi-line" : "subtitle-content single-line"}
          >
            {displayText}
          </Text>
        </Box>
      </Box>
    </>
  );
});

ThinkingAnimation.displayName = 'ThinkingAnimation';

export default ThinkingAnimation;
