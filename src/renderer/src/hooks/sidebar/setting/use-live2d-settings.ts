import { useState, useEffect } from 'react';
import { ModelInfo, useLive2DConfig } from '@/context/live2d-config-context';

export const useLive2dSettings = () => {
  const Live2DConfigContext = useLive2DConfig();

  const initialModelInfo: ModelInfo = {
    url: '',
    kScale: 0.5,
    initialXshift: 0,
    initialYshift: 0,
    emotionMap: {},
    scrollToResize: true,
  };

  const [modelInfo, setModelInfoState] = useState<ModelInfo>(
    Live2DConfigContext?.modelInfo || initialModelInfo,
  );

  useEffect(() => {
    if (Live2DConfigContext?.modelInfo) {
      setModelInfoState(Live2DConfigContext.modelInfo);
    }
  }, [Live2DConfigContext?.modelInfo]);

  useEffect(() => {
    if (Live2DConfigContext && modelInfo) {
      Live2DConfigContext.setModelInfo(modelInfo);
    }
  }, [modelInfo.pointerInteractive, modelInfo.scrollToResize]);

  const handleInputChange = (key: keyof ModelInfo, value: ModelInfo[keyof ModelInfo]): void => {
    setModelInfoState((prev) => ({ ...prev, [key]: value }));
  };

  return {
    modelInfo,
    handleInputChange,
  };
};
