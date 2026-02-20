import { Box, Image } from '@chakra-ui/react';
import { memo, useEffect, useRef } from 'react';
import { canvasStyles } from './canvas-styles';
import { useCamera } from '@/context/camera-context';
import { useBgUrl } from '@/context/bgurl-context';

const Background = memo(({ children }: { children?: React.ReactNode }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    backgroundStream, isBackgroundStreaming, startBackgroundCamera, stopBackgroundCamera,
  } = useCamera();
  const { useCameraBackground, backgroundUrl } = useBgUrl();

  useEffect(() => {
    if (useCameraBackground) {
      startBackgroundCamera();
    } else {
      stopBackgroundCamera();
    }
  }, [useCameraBackground, startBackgroundCamera, stopBackgroundCamera]);

  useEffect(() => {
    if (videoRef.current && backgroundStream) {
      videoRef.current.srcObject = backgroundStream;
    }
  }, [backgroundStream]);

  return (
    <Box {...canvasStyles.background.container} bgGradient="linear(135deg, rgba(255,255,255,0.2) 0%, rgba(173,216,230,0.25) 30%, rgba(64,224,208,0.25) 50%, rgba(135,206,250,0.3) 70%, rgba(255,255,255,0.2) 100%)" backdropFilter="blur(4px)">
      {useCameraBackground ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            ...canvasStyles.background.video,
            display: isBackgroundStreaming ? 'block' : 'none',
            transform: 'scaleX(-1)',
          }}
        />
      ) : (
        <Image
          {...canvasStyles.background.image}
          src={backgroundUrl}
          alt="background"
        />
      )}
      {children}
    </Box>
  );
});

Background.displayName = 'Background';

export default Background;
