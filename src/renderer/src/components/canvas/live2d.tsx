/* eslint-disable no-shadow */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { memo, useRef, useEffect } from "react";
import { useLive2DConfig } from "@/context/live2d-config-context";
import { useIpcHandlers } from "@/hooks/utils/use-ipc-handlers";
import { useInterrupt } from "@/hooks/utils/use-interrupt";
import { useAudioTask } from "@/hooks/utils/use-audio-task";
import { useLive2DModel } from "@/hooks/canvas/use-live2d-model";
import { useLive2DResize } from "@/hooks/canvas/use-live2d-resize";
import { useAiState, AiStateEnum } from "@/context/ai-state-context";
import { useLive2DExpression } from "@/hooks/canvas/use-live2d-expression";
import { useForceIgnoreMouse } from "@/hooks/utils/use-force-ignore-mouse";
import { useMode } from "@/context/mode-context";
// Use the 32x32 custom cursor images
const handCursor = `${window.location.origin}/hand.png`;
const dragCursor = `${window.location.origin}/Vector.png`;

interface Live2DProps {
  showSidebar?: boolean;
}

export const Live2D = memo(({ showSidebar }: Live2DProps): JSX.Element => {
  const { forceIgnoreMouse } = useForceIgnoreMouse();
  const { modelInfo } = useLive2DConfig();
  const { mode } = useMode();
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const { aiState } = useAiState();
  const { resetExpression } = useLive2DExpression();
  const isPet = mode === "pet";

  // Get canvasRef from useLive2DResize
  const { canvasRef } = useLive2DResize({
    containerRef: internalContainerRef,
    modelInfo,
    showSidebar,
  });

  // Pass canvasRef to useLive2DModel
  const { isDragging, isHoveringModel, handlers, resetToInitialPosition } =
    useLive2DModel({
      modelInfo,
      canvasRef,
    });

  // Setup hooks
  useIpcHandlers();
  useInterrupt();
  useAudioTask();

  // Reset expression to default when AI state becomes idle
  useEffect(() => {
    if (aiState === AiStateEnum.IDLE) {
      const lappAdapter = (window as any).getLAppAdapter?.();
      if (lappAdapter) {
        resetExpression(lappAdapter, modelInfo);
      }
    }
  }, [aiState, modelInfo, resetExpression]);

  // Expose resetToInitialPosition for console testing and external use
  useEffect(() => {
    (window as any).resetToInitialPosition = resetToInitialPosition;
    console.log("[Debug] resetToInitialPosition function exposed to window.");

    return () => {
      delete (window as any).resetToInitialPosition;
      console.log(
        "[Debug] resetToInitialPosition function removed from window."
      );
    };
  }, [resetToInitialPosition]);

  // Expose setExpression for console testing
  // useEffect(() => {
  //   const testSetExpression = (expressionValue: string | number) => {
  //     const lappAdapter = (window as any).getLAppAdapter?.();
  //     if (lappAdapter) {
  //       setExpression(expressionValue, lappAdapter, `[Console Test] Set expression to: ${expressionValue}`);
  //     } else {
  //       console.error('[Console Test] LAppAdapter not found.');
  //     }
  //   };

  //   // Expose the function to the window object
  //   (window as any).testSetExpression = testSetExpression;
  //   console.log('[Debug] testSetExpression function exposed to window.');

  //   // Cleanup function to remove the function from window when the component unmounts
  //   return () => {
  //     delete (window as any).testSetExpression;
  //     console.log('[Debug] testSetExpression function removed from window.');
  //   };
  // }, [setExpression]);

  const handlePointerDown = (e: React.PointerEvent) => {
    handlers.onMouseDown(e);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isPet) {
      return;
    }

    e.preventDefault();
    console.log(
      "[ContextMenu] (Pet Mode) Right-click detected, requesting menu..."
    );
    window.api?.showContextMenu?.();
  };

  // Create custom cursor style
  const getCursorStyle = () => {
    if (isDragging) {
      console.log('Cursor: custom drag', dragCursor);
      // Use the 32x32 custom drag cursor with hotspot at center
      return `url("${dragCursor}") 16 16, grabbing`;
    } else if (isHoveringModel) {
      console.log('Cursor: custom hand', handCursor);
      // Use the 32x32 custom hand cursor with hotspot at center
      return `url("${handCursor}") 16 16, grab`;
    } else {
      return "default";
    }
  };

  return (
    <div
      ref={internalContainerRef} // Ref for useLive2DResize if it observes this element
      id="live2d-internal-wrapper"
      style={{
        width: "100%",
        height: "100%",
        pointerEvents: isPet && forceIgnoreMouse ? "none" : "auto",
        overflow: "hidden",
        position: "relative",
        cursor: getCursorStyle(),
      }}
      onPointerDown={handlePointerDown}
      onContextMenu={handleContextMenu}
      {...handlers}
    >
      <canvas
        id="canvas"
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          pointerEvents: isPet && forceIgnoreMouse ? "none" : "auto",
          display: "block",
          cursor: getCursorStyle(),
        }}
      />
    </div>
  );
});

Live2D.displayName = "Live2D";

export { useInterrupt, useAudioTask };
