import { useCallback } from 'react';
import { useLive2DExpression } from './use-live2d-expression';
import { useLive2DConfig } from '@/context/live2d-config-context';

/**
 * Custom hook for handling wave gestures on Live2D model
 * Uses the existing expression system with keywords like [zuoshou] and [youshou]
 */
export const useWaveGesture = () => {
  const { setExpression, resetExpression } = useLive2DExpression();
  const { modelInfo } = useLive2DConfig();

  /**
   * Trigger wave gesture using the expression system
   * @param side - 'left' or 'right' to specify which hand to wave
   */
  const triggerWave = useCallback((side: 'left' | 'right') => {
    try {
      const motionGroupName = side === 'left' ? 'zuoshou' : 'youshou';
      console.log(`[Wave Gesture] ============ START ${side.toUpperCase()} WAVE ============`);
      console.log(`[Wave Gesture] Triggering ${side} hand wave with motion group: ${motionGroupName}`);

      const adapter = (window as any).getLAppAdapter?.();
      if (!adapter) {
        console.error('[Wave Gesture] ❌ LAppAdapter not found on window object');
        console.log('[Wave Gesture] Available window methods:', Object.keys(window).filter(k => k.includes('App') || k.includes('live2d')));
        return;
      }
      console.log('[Wave Gesture] ✅ LAppAdapter found');

      const model = adapter.getModel();
      if (!model) {
        console.error('[Wave Gesture] ❌ Model not found from adapter');
        console.log('[Wave Gesture] Adapter methods:', Object.getOwnPropertyNames(adapter));
        return;
      }
      console.log('[Wave Gesture] ✅ Model found');

      // Check if model has the startRandomMotion method
      if (typeof model.startRandomMotion !== 'function') {
        console.error('[Wave Gesture] ❌ Model does not have startRandomMotion method');
        console.log('[Wave Gesture] Model methods:', Object.getOwnPropertyNames(model));
        return;
      }
      console.log('[Wave Gesture] ✅ startRandomMotion method available');

      // Try to get available motion groups
      try {
        const motionGroups = model._motionManager?._motionGroups || model.motionManager?._motionGroups;
        if (motionGroups) {
          console.log('[Wave Gesture] Available motion groups:', Object.keys(motionGroups));
        }
      } catch (e) {
        console.log('[Wave Gesture] Could not read motion groups');
      }

      // Simple approach: just try to trigger the motion
      try {
        console.log(`[Wave Gesture] Calling startRandomMotion("${motionGroupName}", 3)`);
        const result = model.startRandomMotion(motionGroupName, 3);
        console.log(`[Wave Gesture] Motion start result type: ${typeof result}, value: ${result}`);

        if (result) {
          console.log(`[Wave Gesture] ✅ Successfully triggered motion: ${motionGroupName}`);
        } else {
          console.warn(`[Wave Gesture] ❌ Failed to trigger ${motionGroupName}, trying fallbacks...`);

          // Try with different priority
          console.log('[Wave Gesture] Trying with priority 3...');
          const result2 = model.startRandomMotion(motionGroupName, 3);
          if (result2) {
            console.log(`[Wave Gesture] ✅ Success with priority 3: ${motionGroupName}`);
            return;
          }

          // Try Idle motion as fallback
          console.log('[Wave Gesture] Trying fallback Idle motion...');
          const fallbackResult = model.startRandomMotion('Idle', 1);
          if (fallbackResult) {
            console.log(`[Wave Gesture] ✅ Triggered fallback Idle motion for ${side} wave`);
          } else {
            console.warn('[Wave Gesture] ❌ Fallback Idle motion also failed');
          }
        }
      } catch (error) {
        console.error('[Wave Gesture] Error starting motion:', error);
      }

      console.log(`[Wave Gesture] ============ END ${side.toUpperCase()} WAVE ============`);
    } catch (error) {
      console.error('[Wave Gesture] Error triggering wave motion:', error);
    }
  }, [modelInfo]);

  /**
   * Trigger left hand wave
   */
  const triggerLeftWave = useCallback(() => {
    triggerWave('left');
  }, [triggerWave]);

  /**
   * Trigger right hand wave
   */
  const triggerRightWave = useCallback(() => {
    triggerWave('right');
  }, [triggerWave]);

  /**
   * Reset hand gestures to default state
   */
  const resetHandGestures = useCallback(() => {
    try {
      console.log('[Wave Gesture] Resetting hand gestures to default');

      const adapter = (window as any).getLAppAdapter?.();
      if (!adapter) {
        console.warn('[Wave Gesture] LAppAdapter not found for reset');
        return;
      }

      const model = adapter.getModel();
      if (!model) {
        console.warn('[Wave Gesture] Model not found for reset');
        return;
      }

      // Simple reset approach - don't interfere with normal motion system
      try {
        // Only reset expression, let the motion system handle itself naturally
        console.log('[Wave Gesture] Simple reset: letting motion system handle naturally');

        // Optional: gently start an idle motion with normal priority
        setTimeout(() => {
          try {
            const result = model.startRandomMotion('Idle', 1); // Low priority, won't force
            console.log('[Wave Gesture] Gentle Idle reset result:', result ? 'success' : 'no override needed');
          } catch (error) {
            console.debug('[Wave Gesture] Gentle reset failed:', error);
          }
        }, 150); // 减少等待时间，更快重置

      } catch (error) {
        console.warn('[Wave Gesture] Motion reset failed:', error);
      }

      // Reset to default expression
      setTimeout(() => {
        try {
          resetExpression(adapter, modelInfo);
          console.log('[Wave Gesture] ✅ Expression reset to default');
        } catch (error) {
          console.error('[Wave Gesture] Failed to reset expression:', error);
        }
      }, 50);

    } catch (error) {
      console.error('[Wave Gesture] Error resetting hand gestures:', error);
    }
  }, [resetExpression, modelInfo]);

  /**
   * Trigger goodbye gesture when closing panel
   * @param side - which side panel is being closed ('left' | 'right')
   */
  const triggerGoodbyeGesture = useCallback((side: 'left' | 'right') => {
    try {
      console.log(`[Wave Gesture] ============ START GOODBYE ${side.toUpperCase()} ============`);

      // For goodbye, use the same hand's goodbye motion (reverse animation back to default)
      const motionGroupName = side === 'left' ? 'youshou_goodbye' : 'zuoshou_goodbye'; // 左侧面板关闭时用右手告别动作
      console.log(`[Wave Gesture] Triggering goodbye ${side} with motion group: ${motionGroupName}`);

      const adapter = (window as any).getLAppAdapter?.();
      if (!adapter) {
        console.warn('[Wave Gesture] LAppAdapter not found for goodbye');
        return;
      }

      const model = adapter.getModel();
      if (!model) {
        console.warn('[Wave Gesture] Model not found for goodbye');
        return;
      }

      // Trigger a brief goodbye wave
      try {
        console.log(`[Wave Gesture] Calling startRandomMotion("${motionGroupName}", 3) for goodbye`);
        const result = model.startRandomMotion(motionGroupName, 3);
        console.log(`[Wave Gesture] Goodbye motion result: ${result}`);

        if (result) {
          console.log(`[Wave Gesture] ✅ Successfully triggered goodbye: ${motionGroupName}`);

          // After goodbye wave, return to default state
          setTimeout(() => {
            resetHandGestures();
          }, 500); // Let the goodbye wave complete (0.8s ÷ 2.0 speed = 0.4s + buffer)
        } else {
          console.warn(`[Wave Gesture] ❌ Failed to trigger goodbye ${motionGroupName}`);
          // Fallback to normal reset
          resetHandGestures();
        }
      } catch (error) {
        console.error('[Wave Gesture] Error starting goodbye motion:', error);
        resetHandGestures();
      }

      console.log(`[Wave Gesture] ============ END GOODBYE ${side.toUpperCase()} ============`);
    } catch (error) {
      console.error('[Wave Gesture] Error triggering goodbye gesture:', error);
      resetHandGestures(); // Fallback
    }
  }, [resetHandGestures]);

  return {
    triggerWave,
    triggerLeftWave,
    triggerRightWave,
    resetHandGestures,
    triggerGoodbyeGesture,
  };
};