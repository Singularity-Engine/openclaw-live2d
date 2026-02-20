export const canvasStyles = {
  background: {
    container: {
      position: "relative",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      pointerEvents: "auto",
    },
    image: {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      objectFit: "cover",
      zIndex: 1,
    },
    video: {
      position: "absolute" as const,
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      objectFit: "cover" as const,
      zIndex: 1,
      transform: "scaleX(-1)" as const,
    },
  },
  canvas: {
    container: {
      position: "relative",
      width: "100%",
      height: "100%",
      zIndex: "1",
      pointerEvents: "auto",
    },
  },
  subtitle: {
    container: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -111%)",
      minHeight: "48px",
      width: "auto",
      maxWidth: "95vw", // 最大不超过95%视口宽度
      maxHeight: "120px", // 最多2行的高度
      backgroundColor: "rgba(255, 255, 255, 0.4)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(10px)",
      borderRadius: "36px",
      padding: "12px 24px",
      display: "block",
      opacity: 1,
      zIndex: 10,
      overflow: "hidden",
      boxSizing: "border-box",
      boxShadow: `
        0px 1px 0.5px 0px rgba(0, 0, 0, 0.25),
        0px 1px 0.5px 0px rgba(0, 0, 0, 0.25) inset,
        0px 0.5px 0px 0px rgba(255, 255, 255, 0.25) inset
      `,
    },
    text: {
      color: "rgba(0, 0, 0, 1)",
      fontFamily: "Source Han Sans CN, sans-serif",
      fontWeight: "500",
      fontSize: "24px", // 16px * 1.5
      lineHeight: "1.4",
      letterSpacing: "0%",
      textAlign: "center",
      opacity: 1,
    },
  },
  wsStatus: {
    container: {
      position: "relative",
      // top: '20px',
      // left: '20px',
      zIndex: 2,
      padding: "8px 16px",
      borderRadius: "20px",
      fontSize: "14px",
      fontWeight: "medium",
      color: "white",
      transition: "all 0.2s",
      cursor: "pointer",
      userSelect: "none",
      _hover: {
        opacity: 0.8,
      },
    },
  },
};
