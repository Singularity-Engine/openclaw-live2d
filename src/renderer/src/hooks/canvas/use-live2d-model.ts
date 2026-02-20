/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-use-before-define */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck
import { useEffect, useRef, useCallback, useState, RefObject } from "react";
import { ModelInfo } from "@/context/live2d-config-context";
import { updateModelConfig } from '../../../WebSDK/src/lappdefine';
import { LAppDelegate } from '../../../WebSDK/src/lappdelegate';
import { calculateVisualConsistentPosition } from '../../utils/position-adapter';
import { initializeLive2D } from '@cubismsdksamples/main';
import { useMode } from '@/context/mode-context';

interface UseLive2DModelProps {
  modelInfo: ModelInfo | undefined;
  canvasRef: RefObject<HTMLCanvasElement>;
}

interface Position {
  x: number;
  y: number;
}

// Thresholds for tap vs drag detection
const TAP_DURATION_THRESHOLD_MS = 200; // Max duration for a tap
const DRAG_DISTANCE_THRESHOLD_PX = 5; // Min distance to be considered a drag

function parseModelUrl(url: string): { baseUrl: string; modelDir: string; modelFileName: string } {
  try {
    const urlObj = new URL(url);
    const { pathname } = urlObj;

    const lastSlashIndex = pathname.lastIndexOf('/');
    if (lastSlashIndex === -1) {
      throw new Error('Invalid model URL format');
    }

    const fullFileName = pathname.substring(lastSlashIndex + 1);
    const modelFileName = fullFileName.replace('.model3.json', '');

    const secondLastSlashIndex = pathname.lastIndexOf('/', lastSlashIndex - 1);
    if (secondLastSlashIndex === -1) {
      throw new Error('Invalid model URL format');
    }

    const modelDir = pathname.substring(secondLastSlashIndex + 1, lastSlashIndex);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}${pathname.substring(0, secondLastSlashIndex + 1)}`;

    return { baseUrl, modelDir, modelFileName };
  } catch (error) {
    console.error('Error parsing model URL:', error);
    return { baseUrl: '', modelDir: '', modelFileName: '' };
  }
}

export const playAudioWithLipSync = (audioPath: string, modelIndex = 0): Promise<void> => new Promise((resolve, reject) => {
  const live2dManager = window.LAppLive2DManager?.getInstance();
  if (!live2dManager) {
    reject(new Error('Live2D manager not initialized'));
    return;
  }

  const fullPath = `/Resources/${audioPath}`;
  const audio = new Audio(fullPath);

  audio.addEventListener('canplaythrough', () => {
    const model = live2dManager.getModel(modelIndex);
    if (model) {
      if (model._wavFileHandler) {
        model._wavFileHandler.start(fullPath);
        audio.play();
      } else {
        reject(new Error('Wav file handler not available on model'));
      }
    } else {
      reject(new Error(`Model index ${modelIndex} not found`));
    }
  });

  audio.addEventListener('ended', () => {
    resolve();
  });

  audio.addEventListener('error', () => {
    reject(new Error(`Failed to load audio: ${fullPath}`));
  });

  audio.load();
});

export const useLive2DModel = ({
  modelInfo,
  canvasRef,
}: UseLive2DModelProps) => {
  const { mode } = useMode();
  const isPet = mode === 'pet';
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringModel, setIsHoveringModel] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const dragStartPos = useRef<Position>({ x: 0, y: 0 }); // Screen coordinates at drag start
  const modelStartPos = useRef<Position>({ x: 0, y: 0 }); // Model coordinates at drag start
  const modelPositionRef = useRef<Position>({ x: 0, y: 0 });
  const prevModelUrlRef = useRef<string | null>(null);
  const isHoveringModelRef = useRef(false);
  const hasUserDraggedRef = useRef(false); // Track if user has dragged the model
  const electronApi = (window as any).electron;

  // --- State for Tap vs Drag ---
  const mouseDownTimeRef = useRef<number>(0);
  const mouseDownPosRef = useRef<Position>({ x: 0, y: 0 }); // Screen coords at mousedown
  const isPotentialTapRef = useRef<boolean>(false); // Flag for ongoing potential tap/drag action
  // ---


  // --- State for Snap Back Animation ---
  const snapBackAnimationRef = useRef<number | null>(null);
  const snapBackStartTime = useRef<number>(0);
  const snapBackStartPos = useRef<Position>({ x: 0, y: 0 });
  const snapBackTargetPos = useRef<Position>({ x: 0, y: 0 });
  const SNAP_BACK_DURATION_MS = 500; // Duration for snap back animation
  // ---

  useEffect(() => {
    const currentUrl = modelInfo?.url;
    const sdkScale = (window as any).LAppDefine?.CurrentKScale;
    const modelScale = modelInfo?.kScale !== undefined ? Number(modelInfo.kScale) : undefined;

    const needsUpdate = currentUrl &&
                        (currentUrl !== prevModelUrlRef.current ||
                         (sdkScale !== undefined && modelScale !== undefined && sdkScale !== modelScale));

    // Always update global modelInfo for position offset access
    if (modelInfo) {
      (window as any).globalModelInfo = modelInfo;
      (window as any).hasUserDragged = hasUserDraggedRef.current;
      console.log('[Global ModelInfo] Updated:', {
        initialXshift: modelInfo.initialXshift,
        initialYshift: modelInfo.initialYshift
      });
    }

    if (needsUpdate) {
      prevModelUrlRef.current = currentUrl;
      hasUserDraggedRef.current = false; // Reset drag flag for new model

      try {
        const { baseUrl, modelDir, modelFileName } = parseModelUrl(currentUrl);

        if (baseUrl && modelDir) {
          updateModelConfig(baseUrl, modelDir, modelFileName, Number(modelInfo.kScale));

          setTimeout(() => {
            if ((window as any).LAppLive2DManager?.releaseInstance) {
              (window as any).LAppLive2DManager.releaseInstance();
            }
            initializeLive2D();
          }, 500);
        }
      } catch (error) {
        console.error('Error processing model URL:', error);
      }
    }
  }, [modelInfo?.url, modelInfo?.kScale, modelInfo?.initialXshift, modelInfo?.initialYshift]);

  const getModelPosition = useCallback(() => {
    const adapter = (window as any).getLAppAdapter?.();
    if (adapter) {
      const model = adapter.getModel();
      if (model && model._modelMatrix) {
        const matrix = model._modelMatrix.getArray();
        return {
          x: matrix[12],
          y: matrix[13],
        };
      }
    }
    return { x: 0, y: 0 };
  }, []);

  const setModelPosition = useCallback((x: number, y: number) => {
    const adapter = (window as any).getLAppAdapter?.();
    if (adapter) {
      const model = adapter.getModel();
      if (model && model._modelMatrix) {
        const matrix = model._modelMatrix.getArray();

        const newMatrix = [...matrix];
        newMatrix[12] = x;
        newMatrix[13] = y;

        model._modelMatrix.setMatrix(newMatrix);
        modelPositionRef.current = { x, y };
      }
    }
  }, []);

  // Smooth snap back animation function
  const animateSnapBack = useCallback((currentTime: number) => {
    const elapsed = currentTime - snapBackStartTime.current;
    const progress = Math.min(elapsed / SNAP_BACK_DURATION_MS, 1);
    
    // Easing function (ease-out cubic for nice snap back feel)
    const easeOutCubic = 1 - Math.pow(1 - progress, 3);
    
    const startPos = snapBackStartPos.current;
    const targetPos = snapBackTargetPos.current;
    
    // Interpolate position
    const currentX = startPos.x + (targetPos.x - startPos.x) * easeOutCubic;
    const currentY = startPos.y + (targetPos.y - startPos.y) * easeOutCubic;
    
    // Apply position to model
    const adapter = (window as any).getLAppAdapter?.();
    const model = adapter?.getModel();
    if (model && model._modelMatrix) {
      const matrix = model._modelMatrix.getArray();
      const newMatrix = [...matrix];
      newMatrix[12] = currentX;
      newMatrix[13] = currentY;
      model._modelMatrix.setMatrix(newMatrix);
      
      modelPositionRef.current = { x: currentX, y: currentY };
      setPosition({ x: currentX, y: currentY });
    }
    
    if (progress < 1) {
      // Continue animation
      snapBackAnimationRef.current = requestAnimationFrame(animateSnapBack);
    } else {
      // Animation complete
      snapBackAnimationRef.current = null;
      console.log('[Snap Back] Animation completed');
      
      // Reset the drag flag since we've returned to initial position
      hasUserDraggedRef.current = false;
      (window as any).hasUserDragged = false;
    }
  }, [setPosition]);

  // Reset model to initial position function with animation
  const resetToInitialPosition = useCallback((animated: boolean = true) => {
    if (!modelInfo || (modelInfo.initialXshift === 0 && modelInfo.initialYshift === 0)) {
      console.log('[Reset Position] No initial position offset to reset to');
      return;
    }

    try {
      const adapter = (window as any).getLAppAdapter?.();
      const model = adapter?.getModel();
      
      if (model && model._modelMatrix) {
        // 使用视觉一致性位置计算，确保在所有DPI下模型视觉位置一致
        const adaptivePos = calculateVisualConsistentPosition(
          Number(modelInfo.initialXshift || 0),
          Number(modelInfo.initialYshift || 0)
        );
        const xShift = adaptivePos.x;
        const yShift = adaptivePos.y;
        const targetPos = { x: xShift, y: -yShift };
        
        if (animated) {
          // Cancel any existing animation
          if (snapBackAnimationRef.current) {
            cancelAnimationFrame(snapBackAnimationRef.current);
          }
          
          // Set up animation
          const currentMatrix = model._modelMatrix.getArray();
          snapBackStartPos.current = { x: currentMatrix[12], y: currentMatrix[13] };
          snapBackTargetPos.current = targetPos;
          snapBackStartTime.current = performance.now();
          
          console.log(`[Snap Back] Starting animation from (${snapBackStartPos.current.x.toFixed(3)}, ${snapBackStartPos.current.y.toFixed(3)}) to (${targetPos.x.toFixed(3)}, ${targetPos.y.toFixed(3)})`);
          
          // Start animation
          snapBackAnimationRef.current = requestAnimationFrame(animateSnapBack);
        } else {
          // Immediate reset without animation
          const matrix = model._modelMatrix.getArray();
          const newMatrix = [...matrix];
          newMatrix[12] = xShift;
          newMatrix[13] = -yShift;
          model._modelMatrix.setMatrix(newMatrix);

          modelPositionRef.current = targetPos;
          setPosition(targetPos);

          hasUserDraggedRef.current = false;
          (window as any).hasUserDragged = false;

          console.log(`[Reset Position] Model reset to adaptive position: x=${xShift.toFixed(3)}, y=${(-yShift).toFixed(3)} (original: x=${modelInfo.initialXshift}, y=${modelInfo.initialYshift}, adapted: x=${adaptivePos.adaptedXshift.toFixed(1)}, y=${adaptivePos.adaptedYshift.toFixed(1)})`);
        }
      }
    } catch (error) {
      console.error('[Reset Position] Failed to reset model position:', error);
    }
  }, [modelInfo, setPosition, animateSnapBack]);

  // Apply initial position at multiple intervals to ensure it works
  useEffect(() => {
    if (!modelInfo || (modelInfo.initialXshift === 0 && modelInfo.initialYshift === 0)) {
      return;
    }

    const applyInitialPosition = () => {
      try {
        const adapter = (window as any).getLAppAdapter?.();
        const model = adapter?.getModel();
        const canvas = document.getElementById('canvas') as HTMLCanvasElement;
        
        if (model && model._modelMatrix && canvas) {
          const canvasWidth = canvas.clientWidth;
          const canvasHeight = canvas.clientHeight;
          
          if (canvasWidth > 0 && canvasHeight > 0) {
            // 使用视觉一致性位置计算，确保在所有DPI下模型视觉位置一致
            const adaptivePos = calculateVisualConsistentPosition(
              Number(modelInfo.initialXshift || 0),
              Number(modelInfo.initialYshift || 0)
            );
            const xShift = adaptivePos.x;
            const yShift = adaptivePos.y;

            console.log(`[Initial Position] Canvas: ${canvasWidth}x${canvasHeight}, Adaptive shift: x=${xShift.toFixed(3)}, y=${yShift.toFixed(3)} (original: x=${modelInfo.initialXshift}, y=${modelInfo.initialYshift}, ratios: ${adaptivePos.ratios.widthRatio.toFixed(3)}x${adaptivePos.ratios.heightRatio.toFixed(3)})`);
            
            const matrix = model._modelMatrix.getArray();
            const newMatrix = [...matrix];
            
            console.log(`[Initial Position] Original matrix position: x=${matrix[12]}, y=${matrix[13]}`);
            
            // Set absolute position
            newMatrix[12] = xShift;
            newMatrix[13] = -yShift; // Invert Y because Live2D coordinate system is different
            
            model._modelMatrix.setMatrix(newMatrix);
            console.log(`[Initial Position] Applied adaptive position: x=${xShift.toFixed(3)}, y=${(-yShift).toFixed(3)} (original: x=${modelInfo.initialXshift}, y=${modelInfo.initialYshift}, adapted: x=${adaptivePos.adaptedXshift.toFixed(1)}, y=${adaptivePos.adaptedYshift.toFixed(1)})`);
            
            // Update position state
            const newPos = getModelPosition();
            modelPositionRef.current = newPos;
            setPosition(newPos);
            
            return true; // Success
          }
        }
      } catch (error) {
        console.debug('Model not ready for initial position yet');
      }
      return false; // Failed
    };

    // Try multiple times with increasing delays
    const attempts = [500, 1000, 1500, 2000, 3000];
    const timers: NodeJS.Timeout[] = [];

    attempts.forEach((delay, index) => {
      const timer = setTimeout(() => {
        if (!hasUserDraggedRef.current && applyInitialPosition()) {
          console.log(`[Initial Position] Successfully applied on attempt ${index + 1}`);
          // Clear remaining timers
          timers.slice(index + 1).forEach(t => clearTimeout(t));
        }
      }, delay);
      timers.push(timer);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [modelInfo?.url, modelInfo?.initialXshift, modelInfo?.initialYshift, getModelPosition]);

  // Get model position after loading
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentPos = getModelPosition();
      modelPositionRef.current = currentPos;
      setPosition(currentPos);
    }, 500);

    return () => clearTimeout(timer);
  }, [modelInfo?.url, getModelPosition]);

  const getCanvasScale = useCallback(() => {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (!canvas) return { width: 1, height: 1, scale: 1 };

    const { width } = canvas;
    const { height } = canvas;
    const scale = width / canvas.clientWidth;

    return { width, height, scale };
  }, []);

  const screenToModelPosition = useCallback((screenX: number, screenY: number) => {
    const { width, height, scale } = getCanvasScale();

    const x = ((screenX * scale) / width) * 2 - 1;
    const y = -((screenY * scale) / height) * 2 + 1;

    return { x, y };
  }, [getCanvasScale]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    console.log('[MouseDown] Event triggered');
    const adapter = (window as any).getLAppAdapter?.();
    if (!adapter || !canvasRef.current) {
      console.log('[MouseDown] No adapter or canvas');
      return;
    }

    const model = adapter.getModel();
    const view = LAppDelegate.getInstance().getView();
    if (!view || !model) {
      console.log('[MouseDown] No view or model');
      return;
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left; // Screen X relative to canvas
    const y = e.clientY - rect.top; // Screen Y relative to canvas

    // --- Check if click is on model ---
    const scale = canvas.width / canvas.clientWidth;
    const scaledX = x * scale;
    const scaledY = y * scale;
    const modelX = view._deviceToScreen.transformX(scaledX);
    const modelY = view._deviceToScreen.transformY(scaledY);

    const hitAreaName = model.anyhitTest(modelX, modelY);
    const isHitOnModel = model.isHitOnModel(modelX, modelY);
    console.log('[MouseDown] Hit area:', hitAreaName, 'Is hit on model:', isHitOnModel);
    // --- End Check ---

    if (hitAreaName !== null || isHitOnModel) {
      console.log('[MouseDown] Hit detected, starting potential tap');
      // Record potential tap/drag start
      mouseDownTimeRef.current = Date.now();
      mouseDownPosRef.current = { x: e.clientX, y: e.clientY }; // Use clientX/Y for distance check
      isPotentialTapRef.current = true;
      setIsDragging(false); // Ensure dragging is false initially

      // Store initial model position IF drag starts later
      if (model._modelMatrix) {
        const matrix = model._modelMatrix.getArray();
        modelStartPos.current = { x: matrix[12], y: matrix[13] };
      }
    } else {
      console.log('[MouseDown] No hit detected');
    }
  }, [canvasRef, modelInfo]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const adapter = (window as any).getLAppAdapter?.();
    const view = LAppDelegate.getInstance().getView();
    const model = adapter?.getModel();

    // --- Start Drag Logic ---
    if (isPotentialTapRef.current && adapter && view && model && canvasRef.current) {
      const timeElapsed = Date.now() - mouseDownTimeRef.current;
      const deltaX = e.clientX - mouseDownPosRef.current.x;
      const deltaY = e.clientY - mouseDownPosRef.current.y;
      const distanceMoved = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Check if it's a drag (moved enough distance OR held long enough while moving slightly)
      if (distanceMoved > DRAG_DISTANCE_THRESHOLD_PX || (timeElapsed > TAP_DURATION_THRESHOLD_MS && distanceMoved > 1)) {
        isPotentialTapRef.current = false; // It's a drag, not a tap
        setIsDragging(true);

        // Set initial drag screen position using the position from mousedown
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        dragStartPos.current = {
          x: mouseDownPosRef.current.x - rect.left,
          y: mouseDownPosRef.current.y - rect.top,
        };
        // modelStartPos is already set in handleMouseDown
      }
    }
    // --- End Start Drag Logic ---

    // --- Continue Drag Logic ---
    if (isDragging && adapter && view && model && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left; // Current screen X relative to canvas
      const currentY = e.clientY - rect.top; // Current screen Y relative to canvas

      // Convert screen delta to model delta
      const scale = canvas.width / canvas.clientWidth;
      const startScaledX = dragStartPos.current.x * scale;
      const startScaledY = dragStartPos.current.y * scale;
      const startModelX = view._deviceToScreen.transformX(startScaledX);
      const startModelY = view._deviceToScreen.transformY(startScaledY);

      const currentScaledX = currentX * scale;
      const currentScaledY = currentY * scale;
      const currentModelX = view._deviceToScreen.transformX(currentScaledX);
      const currentModelY = view._deviceToScreen.transformY(currentScaledY);

      const dx = currentModelX - startModelX;
      const dy = currentModelY - startModelY;

      const newX = modelStartPos.current.x + dx;
      const newY = modelStartPos.current.y + dy;

      // Use the adapter's setModelPosition method if available, otherwise update matrix directly
      if (adapter.setModelPosition) {
        adapter.setModelPosition(newX, newY);
      } else if (model._modelMatrix) {
        const matrix = model._modelMatrix.getArray();
        const newMatrix = [...matrix];
        newMatrix[12] = newX;
        newMatrix[13] = newY;
        model._modelMatrix.setMatrix(newMatrix);
      }

      modelPositionRef.current = { x: newX, y: newY };
      setPosition({ x: newX, y: newY }); // Update React state if needed for UI feedback
    }
    // --- End Continue Drag Logic ---

    // --- Model Hover Logic (For cursor change and Pet mode) ---
    if (!isDragging && !isPotentialTapRef.current && adapter && view && model && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const scale = canvas.width / canvas.clientWidth;
      const scaledX = x * scale;
      const scaledY = y * scale;
      const modelX = view._deviceToScreen.transformX(scaledX);
      const modelY = view._deviceToScreen.transformY(scaledY);

      const currentHitState = model.anyhitTest(modelX, modelY) !== null || model.isHitOnModel(modelX, modelY);

      if (currentHitState !== isHoveringModelRef.current) {
        isHoveringModelRef.current = currentHitState;
        setIsHoveringModel(currentHitState);
        
        // When mouse enters model area, reset eye tracking to center (only if pointer interaction is enabled)
        if (currentHitState && model.setDragging && modelInfo?.pointerInteractive !== false) {
          model.setDragging(0, 0);
        }
        
        // Pet mode specific electron IPC
        if (isPet && electronApi) {
          electronApi.ipcRenderer.send('update-component-hover', 'live2d-model', currentHitState);
        }
      }

      // --- Eye Tracking Logic (Only when not hovering over model and pointer interaction is enabled) ---
      // Don't update eye tracking when mouse is over the model or during potential tap/click
      // This allows users to interact with the model without distracting eye movement
      // Only enable eye tracking when pointer interaction is enabled
      if (!isPotentialTapRef.current && !currentHitState && modelInfo?.pointerInteractive !== false) {
        // Convert screen coordinates to model coordinates for eye tracking
        // Model coordinates range from -1 to 1
        const canvasWidth = canvas.clientWidth;
        const canvasHeight = canvas.clientHeight;
        
        // Normalize mouse position to -1 to 1 range
        const normalizedX = (x / canvasWidth) * 2 - 1;
        const normalizedY = -((y / canvasHeight) * 2 - 1); // Invert Y axis for Live2D coordinate system
        
        // Set the drag manager to make the model look at the mouse
        if (model.setDragging) {
          model.setDragging(normalizedX, normalizedY);
        }
      }
      // --- End Eye Tracking Logic ---
    }
    // --- End Model Hover Logic ---
  }, [isPet, isDragging, electronApi, canvasRef, modelInfo]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    console.log('[MouseUp] Event triggered, isDragging:', isDragging, 'isPotentialTap:', isPotentialTapRef.current);
    const adapter = (window as any).getLAppAdapter?.();
    const model = adapter?.getModel();
    const view = LAppDelegate.getInstance().getView();

    if (isDragging) {
      // Finalize drag and trigger snap back to initial position
      setIsDragging(false);
      hasUserDraggedRef.current = true; // Mark that user has dragged the model
      (window as any).hasUserDragged = true; // Update global flag
      
      // Immediately snap back to initial position after drag ends
      console.log('[Drag End] Snapping back to initial position');
      resetToInitialPosition();
    } else if (isPotentialTapRef.current && adapter && model && view && canvasRef.current) {
      console.log('[MouseUp] Processing potential tap');
      // --- Tap Motion Logic ---
      const timeElapsed = Date.now() - mouseDownTimeRef.current;
      const deltaX = e.clientX - mouseDownPosRef.current.x;
      const deltaY = e.clientY - mouseDownPosRef.current.y;
      const distanceMoved = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Check if it qualifies as a tap (short duration, minimal movement)
      if (timeElapsed < TAP_DURATION_THRESHOLD_MS && distanceMoved < DRAG_DISTANCE_THRESHOLD_PX) {
        console.log('[Tap Detected] Time:', timeElapsed, 'Distance:', distanceMoved);
        // Always allow tap motion regardless of pointerInteractive setting
        const allowTapMotion = true;

        console.log('[Tap Motion] Model info:', modelInfo);
        // Check if tapMotions exists and has content
        const hasTapMotions = modelInfo?.tapMotions && Object.keys(modelInfo.tapMotions).length > 0;
        console.log('[Tap Motion] Has tap motions:', hasTapMotions);
        
        if (allowTapMotion && hasTapMotions) {
          // Use mouse down position for hit testing
          const canvas = canvasRef.current;
          const rect = canvas.getBoundingClientRect();
          const scale = canvas.width / canvas.clientWidth;
          const downX = (mouseDownPosRef.current.x - rect.left) * scale;
          const downY = (mouseDownPosRef.current.y - rect.top) * scale;
          const modelX = view._deviceToScreen.transformX(downX);
          const modelY = view._deviceToScreen.transformY(downY);

          const hitAreaName = model.anyhitTest(modelX, modelY);
          console.log('[Tap Motion] Hit area:', hitAreaName, 'Tap motions available:', modelInfo.tapMotions);
          console.log('[Tap Motion] Calling model.startTapMotion');
          // Trigger tap motion using the specific hit area name or null for general body tap
          const result = model.startTapMotion(hitAreaName, modelInfo.tapMotions);
          console.log('[Tap Motion] startTapMotion result:', result);
        } else if (allowTapMotion) {
          // If no specific tap motions are configured, try to trigger a default motion
          console.log('[Tap Motion] No specific tap motions, trying default motion');
          try {
            // Try to trigger any available motion as a fallback
            const result = model.startRandomMotion('TapBody', 3);
            console.log('[Tap Motion] Default motion result:', result);
          } catch (error) {
            console.log('[Tap Motion] Default motion failed:', error);
          }
        } else {
          console.log('[Tap Motion] Not allowed or no tap motions available. Allow:', allowTapMotion, 'TapMotions:', modelInfo?.tapMotions);
          console.log('[Tap Motion] pointerInteractive:', modelInfo?.pointerInteractive);
        }
      } else {
        console.log('[Tap Motion] Not a tap - Time:', timeElapsed, 'Distance:', distanceMoved);
      }
      // --- End Tap Motion Logic ---
    }

    // Reset potential tap flag regardless of outcome
    isPotentialTapRef.current = false;
  }, [isDragging, canvasRef, modelInfo, resetToInitialPosition]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      // If dragging and mouse leaves, treat it like a mouse up to end drag
      handleMouseUp({} as React.MouseEvent); // Pass a dummy event or adjust handleMouseUp signature
    }
    // Reset potential tap if mouse leaves before mouse up
    if (isPotentialTapRef.current) {
      isPotentialTapRef.current = false;
    }
    // Reset hover state
    if (isHoveringModelRef.current) {
      isHoveringModelRef.current = false;
      setIsHoveringModel(false);
      
      // Pet mode specific electron IPC
      if (isPet && electronApi) {
        electronApi.ipcRenderer.send('update-component-hover', 'live2d-model', false);
      }
    }

    // Reset eye tracking to center when mouse leaves (only if pointer interaction is enabled)
    const adapter = (window as any).getLAppAdapter?.();
    const model = adapter?.getModel();
    if (model && model.setDragging && modelInfo?.pointerInteractive !== false) {
      model.setDragging(0, 0); // Reset to center position
    }
  }, [isPet, isDragging, electronApi, handleMouseUp, modelInfo]);

  useEffect(() => {
    if (!isPet && electronApi && isHoveringModelRef.current) {
      isHoveringModelRef.current = false;
      setIsHoveringModel(false);
    }
  }, [isPet, electronApi]);

  // Clean up snap back animation on unmount
  useEffect(() => {
    return () => {
      if (snapBackAnimationRef.current) {
        cancelAnimationFrame(snapBackAnimationRef.current);
        snapBackAnimationRef.current = null;
        console.log('[Cleanup] Snap back animation cancelled');
      }
    };
  }, []);

  return {
    position,
    isDragging,
    isHoveringModel,
    resetToInitialPosition,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
    },
  };
};
