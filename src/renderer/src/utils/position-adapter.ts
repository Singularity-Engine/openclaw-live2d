/**
 * 屏幕尺寸自适应位置计算工具
 * 解决不同屏幕尺寸和DPI下Live2D模型位置不一致的问题
 */

// 参考屏幕尺寸（基于你的大屏幕电脑设置）
const REFERENCE_SCREEN = {
  width: 1920,
  height: 1080
};

/**
 * 计算屏幕尺寸和DPI双重自适应的位置
 * 确保在不同屏幕尺寸和DPI下都能保持一致的视觉位置
 * @param initialXshift 原始X轴像素位移（基于参考屏幕）
 * @param initialYshift 原始Y轴像素位移（基于参考屏幕）
 * @returns Live2D坐标系位移 {x, y}
 */
export function calculateVisualConsistentPosition(
  initialXshift: number,
  initialYshift: number
) {
  // 获取Canvas元素的逻辑显示尺寸（不受DPI影响）
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.warn('[Visual Consistent Position] Canvas not found');
    return {
      x: 0, y: 0,
      adaptedXshift: initialXshift,
      adaptedYshift: initialYshift,
      ratios: { widthRatio: 1, heightRatio: 1 }
    };
  }

  // 使用Canvas的clientWidth/clientHeight（逻辑像素尺寸）
  const currentWidth = canvas.clientWidth;
  const currentHeight = canvas.clientHeight;

  // 计算当前屏幕相对于参考屏幕的比例
  const widthRatio = currentWidth / REFERENCE_SCREEN.width;
  const heightRatio = currentHeight / REFERENCE_SCREEN.height;

  // 根据屏幕比例调整位移值，保持视觉一致性
  const adaptedXshift = initialXshift * widthRatio;
  const adaptedYshift = initialYshift * heightRatio;

  // 转换为Live2D坐标系（标准化坐标 [-1, 1]）
  const xShift = (adaptedXshift / (currentWidth / 2));
  const yShift = (adaptedYshift / (currentHeight / 2));

  console.log(`[Visual Consistent Position]
    原始位移: x=${initialXshift}, y=${initialYshift}
    当前Canvas: ${currentWidth}x${currentHeight}
    参考尺寸: ${REFERENCE_SCREEN.width}x${REFERENCE_SCREEN.height}
    缩放比例: ${widthRatio.toFixed(3)}x${heightRatio.toFixed(3)}
    适配位移: x=${adaptedXshift.toFixed(1)}, y=${adaptedYshift.toFixed(1)}
    Live2D坐标: x=${xShift.toFixed(3)}, y=${yShift.toFixed(3)}
    DPI: ${window.devicePixelRatio}`);

  return {
    x: xShift,
    y: yShift,
    adaptedXshift,
    adaptedYshift,
    ratios: { widthRatio, heightRatio }
  };
}

/**
 * DPI自适应位置计算，基于Canvas逻辑尺寸确保视觉一致性
 */
export function calculateDPIAdaptivePosition(
  initialXshift: number,
  initialYshift: number
) {
  return calculateVisualConsistentPosition(initialXshift, initialYshift);
}

/**
 * 获取屏幕中心位置对应的Live2D坐标
 * @returns Live2D坐标系中的中心位置 {x: 0, y: 0}
 */
export function getCenterPosition() {
  return { x: 0, y: 0 };
}

/**
 * 测试工具：模拟不同屏幕尺寸的位置计算结果
 * 在浏览器控制台中使用：window.testScreenSizes(0, 550)
 */
if (typeof window !== 'undefined') {
  (window as any).testScreenSizes = function(x: number, y: number) {
    console.log(`\n=== 屏幕尺寸适配测试 ===`);
    console.log(`输入位移: x=${x}, y=${y}`);

    // 常见屏幕尺寸测试
    const testScreens = [
      { name: '大屏幕 (你的)', width: 1920, height: 1080 },
      { name: '小笔记本', width: 1366, height: 768 },
      { name: '小屏幕', width: 1280, height: 720 },
      { name: '平板横屏', width: 1024, height: 768 },
    ];

    testScreens.forEach(screen => {
      // 模拟不同屏幕尺寸
      const widthRatio = screen.width / 1920;
      const heightRatio = screen.height / 1080;
      const adaptedX = x * widthRatio;
      const adaptedY = y * heightRatio;
      const live2dX = adaptedX / (screen.width / 2);
      const live2dY = adaptedY / (screen.height / 2);

      console.log(`${screen.name} (${screen.width}x${screen.height}):
        比例: ${widthRatio.toFixed(3)}x${heightRatio.toFixed(3)}
        适配位移: x=${adaptedX.toFixed(1)}, y=${adaptedY.toFixed(1)}
        Live2D坐标: x=${live2dX.toFixed(3)}, y=${live2dY.toFixed(3)}`);
    });

    return testScreens;
  };

  (window as any).getCurrentScreenInfo = function() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (canvas) {
      console.log(`当前Canvas信息:
        逻辑尺寸: ${canvas.clientWidth}x${canvas.clientHeight}
        物理尺寸: ${canvas.width}x${canvas.height}
        DPI: ${window.devicePixelRatio}
        窗口尺寸: ${window.innerWidth}x${window.innerHeight}`);
    }
  };
}


