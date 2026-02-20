import React, { useState, useRef, useCallback } from "react";
import { Box, Text, IconButton } from "@chakra-ui/react";
import { FiX, FiShare2 } from "react-icons/fi";
import { useTranslation } from "react-i18next";

interface RelationshipData {
  memoriesCount: number;
  affinityLevel: string;
  affinityValue: number;
  topTopics: string[];
  daysTogether: number;
  summary: string;
}

interface RelationshipCardProps {
  isOpen: boolean;
  onClose: () => void;
  data: RelationshipData;
}

export default function RelationshipCard({
  isOpen,
  onClose,
  data,
}: RelationshipCardProps) {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;

    setCopying(true);
    try {
      // Use html2canvas if available, otherwise fallback to clipboard text
      const html2canvas = (window as any).html2canvas;
      if (html2canvas) {
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: null,
          scale: 2,
        });
        canvas.toBlob((blob: Blob | null) => {
          if (blob) {
            const item = new ClipboardItem({ "image/png": blob });
            navigator.clipboard.write([item]);
          }
        });
      } else {
        // Fallback: copy text summary
        const text = `${t("relationship.title")}\n\n${data.summary}\n\nsngxai.com`;
        await navigator.clipboard.writeText(text);
      }
    } catch (err) {
      console.error("Failed to share:", err);
    } finally {
      setTimeout(() => setCopying(false), 1500);
    }
  }, [data, t]);

  if (!isOpen) return null;

  const levelName =
    t(`affinity.levelName.${data.affinityLevel}`) || data.affinityLevel;

  return (
    <>
      {/* 背景遮罩 */}
      <Box
        position="fixed"
        inset="0"
        bg="rgba(0, 0, 0, 0.6)"
        backdropFilter="blur(12px)"
        zIndex={2000}
        onClick={onClose}
      />

      {/* 卡片容器 */}
      <Box
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        zIndex={2001}
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap="16px"
      >
        {/* 可截图的卡片区域 */}
        <Box
          ref={cardRef}
          width="340px"
          bg="linear-gradient(145deg, #1a1025 0%, #0d0a1a 50%, #15102a 100%)"
          borderRadius="24px"
          border="1px solid rgba(139, 92, 246, 0.3)"
          boxShadow="0 20px 60px rgba(0, 0, 0, 0.5), 0 0 80px rgba(139, 92, 246, 0.1)"
          p="28px"
          position="relative"
          overflow="hidden"
          _before={{
            content: '""',
            position: "absolute",
            top: "-50%",
            right: "-50%",
            width: "100%",
            height: "100%",
            background:
              "radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        >
          {/* 标题 */}
          <Text
            fontSize="20px"
            fontWeight="700"
            color="rgba(255, 255, 255, 0.95)"
            mb="20px"
            position="relative"
            zIndex={1}
          >
            {t("relationship.title")}
          </Text>

          {/* 数据行 */}
          <Box
            display="flex"
            flexDirection="column"
            gap="12px"
            mb="20px"
            position="relative"
            zIndex={1}
          >
            <DataRow
              emoji="🧠"
              text={t("relationship.memoriesCount", {
                count: data.memoriesCount,
              })}
            />
            <DataRow
              emoji="💜"
              text={t("relationship.affinityLevel", { level: levelName })}
            />
            <DataRow
              emoji="⭐"
              text={t("relationship.topTopics", {
                topics: data.topTopics.join("、"),
              })}
            />
            <DataRow
              emoji="📅"
              text={t("relationship.daysTogether", {
                days: data.daysTogether,
              })}
            />
          </Box>

          {/* AI 生成的总结 */}
          <Box
            bg="rgba(255, 255, 255, 0.04)"
            borderRadius="16px"
            border="1px solid rgba(255, 255, 255, 0.08)"
            p="16px"
            mb="16px"
            position="relative"
            zIndex={1}
          >
            <Text
              fontSize="14px"
              color="rgba(255, 255, 255, 0.75)"
              lineHeight="1.6"
              fontStyle="italic"
            >
              "{data.summary}"
            </Text>
          </Box>

          {/* 底部品牌 */}
          <Text
            fontSize="12px"
            color="rgba(255, 255, 255, 0.3)"
            textAlign="center"
            position="relative"
            zIndex={1}
          >
            sngxai.com
          </Text>
        </Box>

        {/* 操作按钮 */}
        <Box display="flex" gap="12px">
          <IconButton
            aria-label="Share"
            bg="rgba(139, 92, 246, 0.6)"
            color="white"
            borderRadius="full"
            size="lg"
            onClick={handleShare}
            _hover={{
              bg: "rgba(139, 92, 246, 0.8)",
              transform: "scale(1.05)",
            }}
            transition="all 0.2s"
          >
            <FiShare2 size={20} />
          </IconButton>
          <IconButton
            aria-label="Close"
            bg="rgba(255, 255, 255, 0.1)"
            color="white"
            borderRadius="full"
            size="lg"
            onClick={onClose}
            _hover={{
              bg: "rgba(255, 255, 255, 0.2)",
              transform: "scale(1.05)",
            }}
            transition="all 0.2s"
          >
            <FiX size={20} />
          </IconButton>
        </Box>
      </Box>
    </>
  );
}

function DataRow({ emoji, text }: { emoji: string; text: string }) {
  return (
    <Box display="flex" alignItems="center" gap="10px">
      <Text fontSize="16px">{emoji}</Text>
      <Text fontSize="14px" color="rgba(255, 255, 255, 0.8)" fontWeight="500">
        {text}
      </Text>
    </Box>
  );
}
