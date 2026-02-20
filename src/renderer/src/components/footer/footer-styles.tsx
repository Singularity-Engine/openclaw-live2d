import { SystemStyleObject } from "@chakra-ui/react";

interface FooterStyles {
  container: (isCollapsed: boolean) => SystemStyleObject;
  inputContainer: SystemStyleObject;
  toggleButton: SystemStyleObject;
  actionButton: SystemStyleObject;
  input: SystemStyleObject;
  attachButton: SystemStyleObject;
  inputOverlay: SystemStyleObject;
  micButton: SystemStyleObject;
  cameraButton: SystemStyleObject;
  sendButton: SystemStyleObject;
}

interface AIIndicatorStyles {
  container: SystemStyleObject;
  text: SystemStyleObject;
}

export const footerStyles: {
  footer: FooterStyles;
  aiIndicator: AIIndicatorStyles;
} = {
  footer: {
    container: () => ({
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      height: "100%",
      position: "relative",
      overflow: "visible",
      width: "100%",
      maxWidth: "none",
      mx: 0,
      px: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }),
    inputContainer: {
      position: "relative",
      flex: 1,
    },
    toggleButton: {
      height: "24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      color: "whiteAlpha.700",
      _hover: { color: "white" },
      bg: "transparent",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    actionButton: {
      borderRadius: "12px",
      width: "50px",
      height: "50px",
      minW: "50px",
    },
    input: {
      // Updated glassmorphism style
      bg: "rgba(255, 255, 255, 1)",
      border: "1px solid rgba(255, 255, 255, 0.35)",
      height: "48px",
      borderRadius: "28px",
      fontSize: "15px",
      pl: "12",
      pr: "16",
      color: "rgba(20,20,30,0.9)",
      boxShadow:
        "0px 0.5px 0.5px 0px rgba(0, 0, 0, 0.25), 0px 0.5px 0.5px 0px rgba(0, 0, 0, 0.25) inset",
      backdropFilter: "blur(20px) saturate(160%)",
      _placeholder: {
        color: "rgba(20,20,30,0.5)",
      },
      _focus: {
        border: "1px solid rgba(255, 255, 255, 0.5)",
        bg: "rgba(255, 255, 255, 1)",
        boxShadow:
          "0px 0.5px 0.5px 0px rgba(0, 0, 0, 0.25), 0px 0.5px 0.5px 0px rgba(0, 0, 0, 0.25) inset",
      },
      resize: "none",
      minHeight: "48px",
      maxHeight: "48px",
      py: "0",
      display: "flex",
      alignItems: "center",
      paddingTop: "12px",
      lineHeight: "1.4",
      width: "100%",
    },
    attachButton: {
      position: "absolute",
      left: "8px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "whiteAlpha.700",
      zIndex: 2,
      _hover: {
        bg: "transparent",
        color: "white",
      },
    },
    inputOverlay: {
      position: "absolute",
      inset: 0,
      borderRadius: "inherit",
      pointerEvents: "none",
      opacity: 0.45,
      background:
        "radial-gradient(60px 20px at 30% 50%, rgba(64,224,208,0.35) 0%, rgba(64,224,208,0.0) 70%), radial-gradient(60px 20px at 70% 50%, rgba(64,224,208,0.35) 0%, rgba(64,224,208,0.0) 70%)",
      filter: "blur(8px)",
    },
    micButton: {
      width: "48px",
      height: "48px",
      minW: "48px",
      borderRadius: "16px",
      bg: "rgba(205, 235, 234, 0.26)",
      border: "1px solid rgba(255,255,255,0.35)",
      color: "rgba(0, 107, 157, 1)",
      boxShadow:
        "0px 1px 1px 0px rgba(0, 0, 0, 0.25), 0px 1px 0.5px 0px rgba(0, 0, 0, 0.25) inset",
      backdropFilter: "blur(20px) saturate(160%)",
      _hover: {
        bg: "rgba(205, 235, 234, 0.4)",
        color: "rgba(0, 107, 157, 1)",
      },
    },
    cameraButton: {
      width: "46.56103515625px",
      height: "45.243896484375px",
      minW: "46.56103515625px",
      borderRadius: "24px",
      background:
        "linear-gradient(134.61deg, rgba(235, 243, 255, 0.26) 15.11%, rgba(225, 250, 255, 0.26) 51.8%, rgba(217, 254, 244, 0.26) 88.48%)",
      border: "1px solid rgba(255,255,255,0.35)",
      boxShadow:
        "0px 1px 1px 0px rgba(0, 0, 0, 0.25), 0px 1px 0.5px 0px rgba(0, 0, 0, 0.25) inset",
      backdropFilter: "blur(20px) saturate(160%)",
      opacity: 1,
    },
    sendButton: {
      borderRadius: "18px",
      height: "48px",
      width: "80px",
      border: "1px solid rgba(255,255,255,0.35)",
      bg: "rgba(255, 186, 11, 0.26)",
      boxShadow:
        "0px 1px 1px 0px rgba(0, 0, 0, 0.25), 0px 1px 0.5px 0px rgba(0, 0, 0, 0.25) inset",
      backdropFilter: "blur(12px) saturate(160%)",
      fontSize: "13px",
      fontWeight: "700",
      color: "rgba(20,20,30,0.9)",
      _hover: {
        bg: "rgba(255, 186, 11, 0.6)",
      },
    },
  },
  aiIndicator: {
    container: {
      bg: "#7C5CFF",
      color: "white",
      width: "110px",
      height: "30px",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
      overflow: "hidden",
    },
    text: {
      fontSize: "12px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
  },
};
