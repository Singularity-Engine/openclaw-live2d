import { Box, Text } from '@chakra-ui/react';
import { memo, useState, useEffect, useRef } from 'react';
import { canvasStyles } from './canvas-styles';
import { useSubtitleDisplay } from '@/hooks/canvas/use-subtitle-display';
import { useSubtitle } from '@/context/subtitle-context';
import ThinkingAnimation from './thinking-animation';

// 字幕样式
const subtitleStyles = `
  .subtitle-text.single-line {
    white-space: nowrap;
    overflow: hidden;
  }

  .subtitle-text.multi-line {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    word-break: break-word;
    overflow-wrap: break-word;
  }
`;

// Type definitions
interface SubtitleTextProps {
  text: string
  onCanPlayAudioChange?: (canPlay: boolean) => void;
}

// Reusable components
const SubtitleText = memo(({ text, onCanPlayAudioChange }: SubtitleTextProps) => {
  const [animationPhase, setAnimationPhase] = useState<'thinking' | 'insight' | 'subtitle'>('thinking');
  const [useAnimation, setUseAnimation] = useState<boolean>(false);
  const [useMultiLine, setUseMultiLine] = useState<boolean>(false);

  const previousTextRef = useRef<string>('');
  const animationStartedRef = useRef<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isThinking = text === 'Thinking...';
  const hasContent = text && text.trim() !== '';

  // 测量文本宽度判断是否需要多行
  const measureTextWidth = (text: string): number => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const context = canvasRef.current.getContext('2d');
    if (context) {
      context.font = '500 24px "Source Han Sans CN", sans-serif';
      return Math.ceil(context.measureText(text).width);
    }
    return 200;
  };

  useEffect(() => {
    // 检查是否需要多行显示
    if (hasContent && !isThinking) {
      const textWidth = measureTextWidth(text);
      const maxWidth = window.innerWidth * 0.95 - 48;
      setUseMultiLine(textWidth > maxWidth);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, hasContent, isThinking]);

  useEffect(() => {
    const previousText = previousTextRef.current;

    if (isThinking) {
      // 思考状态：显示思考动画
      if (!animationStartedRef.current) {
        setAnimationPhase('thinking');
        setUseAnimation(true);
        console.log('[Subtitle] 进入thinking状态');
      }
    } else if (hasContent && previousText === 'Thinking...') {
      // 从thinking转为真实内容：启动展开动画
      if (!animationStartedRef.current) {
        animationStartedRef.current = true;
        setAnimationPhase('insight');
        setUseAnimation(true);
        console.log('[Subtitle] 启动展开动画');
      }
    } else if (!hasContent && !isThinking) {
      // 完全空白：重置所有状态
      setAnimationPhase('thinking');
      setUseAnimation(false);
      animationStartedRef.current = false;
      console.log('[Subtitle] 重置状态');
    }

    previousTextRef.current = text;
  }, [text, isThinking, hasContent]);

  // 展开动画完成回调
  const handleExpandingComplete = () => {
    console.log('[Subtitle] 展开动画进行中，允许播放音频');
    onCanPlayAudioChange?.(true);
  };

  // 动画完全完成回调
  const handleAnimationComplete = () => {
    console.log('[Subtitle] 动画完成，切换到subtitle模式');
    setAnimationPhase('subtitle');
  };

  // 使用动画组件（思考中 或 动画已启动）
  if (useAnimation && (isThinking || animationStartedRef.current)) {
    return (
      <ThinkingAnimation
        phase={animationPhase}
        text={hasContent && !isThinking ? text : undefined}
        onAnimationComplete={handleAnimationComplete}
        onExpandingComplete={handleExpandingComplete}
      />
    );
  }

  // Fallback：普通字幕框（只在直接显示内容时使用，不经过thinking）
  if (hasContent) {
    return (
      <>
        <style>{subtitleStyles}</style>
        <Box {...canvasStyles.subtitle.container}>
          <Text
            {...canvasStyles.subtitle.text}
            className={useMultiLine ? "subtitle-text multi-line" : "subtitle-text single-line"}
          >
            {text}
          </Text>
        </Box>
      </>
    );
  }

  // 完全空白
  return null;
});

SubtitleText.displayName = 'SubtitleText';

// Main component
const Subtitle = memo((): JSX.Element | null => {
  const { subtitleText, isLoaded } = useSubtitleDisplay();
  const { showSubtitle } = useSubtitle();

  if (!isLoaded || !subtitleText || !showSubtitle) return null;

  return <SubtitleText text={subtitleText} />;
});

Subtitle.displayName = 'Subtitle';

export default Subtitle;
