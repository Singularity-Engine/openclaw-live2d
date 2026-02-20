import {
  createContext,
  useState,
  useMemo,
  useContext,
  memo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { filterDisplayText } from "@/utils/text-filter";

/**
 * Subtitle context state interface
 * @interface SubtitleState
 */
interface SubtitleState {
  /** Current subtitle text */
  subtitleText: string;

  /** Set subtitle text */
  setSubtitleText: (text: string) => void;

  /** Whether to show subtitle */
  showSubtitle: boolean;

  /** Toggle subtitle visibility */
  setShowSubtitle: (show: boolean) => void;
}

/**
 * Default values and constants
 */
const DEFAULT_SUBTITLE = {
  text:
    "Hi, I'm some random AI VTuber. Who the hell are ya? " +
    "Ahh, you must be amazed by my awesomeness, right? right?",
};

/**
 * Create the subtitle context
 */
export const SubtitleContext = createContext<SubtitleState | null>(null);

/**
 * Subtitle Provider Component
 * Manages the subtitle display text state
 *
 * @param {Object} props - Provider props
 * @param {React.ReactNode} props.children - Child components
 */
export const SubtitleProvider = memo(
  ({ children }: { children: React.ReactNode }) => {
    // State management
    const [subtitleText, setSubtitleText] = useState<string>(
      DEFAULT_SUBTITLE.text
    );
    const [showSubtitle, setShowSubtitle] = useState<boolean>(true);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 包装的setSubtitleText函数，添加过滤和5秒自动隐藏逻辑
    const setSubtitleTextWithAutoHide = useCallback((text: string) => {
      // 过滤掉表情标签
      const filteredText = filterDisplayText(text);
      setSubtitleText(filteredText);

      // 清除之前的定时器
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      // 如果有文本内容，10秒后自动隐藏
      if (filteredText && filteredText.trim()) {
        hideTimeoutRef.current = setTimeout(() => {
          setSubtitleText("");
        }, 10000); // 10秒后隐藏
      }
    }, []);

    // 清理定时器
    useEffect(() => {
      return () => {
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }
      };
    }, []);

    // Memoized context value
    const contextValue = useMemo(
      () => ({
        subtitleText,
        setSubtitleText: setSubtitleTextWithAutoHide,
        showSubtitle,
        setShowSubtitle,
      }),
      [subtitleText, showSubtitle, setSubtitleTextWithAutoHide]
    );

    return (
      <SubtitleContext.Provider value={contextValue}>
        {children}
      </SubtitleContext.Provider>
    );
  }
);

/**
 * Custom hook to use the subtitle context
 * @throws {Error} If used outside of SubtitleProvider
 */
export function useSubtitle() {
  const context = useContext(SubtitleContext);

  if (!context) {
    throw new Error("useSubtitle must be used within a SubtitleProvider");
  }

  return context;
}
