/**
 * 登录要求弹窗组件
 * 当用户未认证时显示，要求用户登录才能使用数字人功能
 */

import React from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  Flex,
  Icon,
} from '@chakra-ui/react';
import { FiUser, FiLock } from 'react-icons/fi';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginRequiredModal({
  isOpen,
  onClose,
}: LoginRequiredModalProps) {
  return (
    <DialogRoot open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        maxWidth="md"
        backdrop={true}
        bg="rgba(20, 20, 30, 0.95)"
        backdropFilter="blur(20px) saturate(180%)"
        border="1px solid rgba(255, 255, 255, 0.2)"
        borderRadius="16px"
        boxShadow="0 20px 60px rgba(0, 0, 0, 0.4)"
      >
        <DialogHeader>
          <Flex align="center" gap="3">
            <Box
              p="2"
              bg="rgba(59, 130, 246, 0.2)"
              borderRadius="full"
              border="1px solid rgba(59, 130, 246, 0.3)"
            >
              <Icon as={FiLock} boxSize="5" color="blue.300" />
            </Box>
            <DialogTitle
              fontSize="xl"
              fontWeight="600"
              color="white"
            >
              需要登录
            </DialogTitle>
          </Flex>
        </DialogHeader>

        <DialogBody>
          <VStack spacing="4" align="stretch">
            <Box
              p="4"
              bg="rgba(255, 193, 7, 0.1)"
              border="1px solid rgba(255, 193, 7, 0.3)"
              borderRadius="12px"
            >
              <Flex align="center" gap="3" mb="2">
                <Icon as={FiUser} boxSize="4" color="yellow.400" />
                <Text fontSize="sm" fontWeight="500" color="yellow.200">
                  认证提醒
                </Text>
              </Flex>
              <DialogDescription
                fontSize="sm"
                color="rgba(255, 255, 255, 0.8)"
                lineHeight="1.6"
              >
                您需要登录才能使用数字人功能。请确保您的账户具有相应的访问权限。
              </DialogDescription>
            </Box>

            <Box
              p="4"
              bg="rgba(255, 255, 255, 0.05)"
              borderRadius="12px"
              border="1px solid rgba(255, 255, 255, 0.1)"
            >
              <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)" mb="2">
                登录后您可以：
              </Text>
              <VStack spacing="1" align="start">
                <Text fontSize="sm" color="rgba(255, 255, 255, 0.6)">
                  • 与AI数字人进行对话交互
                </Text>
                <Text fontSize="sm" color="rgba(255, 255, 255, 0.6)">
                  • 使用Live2D角色动画功能
                </Text>
                <Text fontSize="sm" color="rgba(255, 255, 255, 0.6)">
                  • 保存和管理聊天历史记录
                </Text>
                <Text fontSize="sm" color="rgba(255, 255, 255, 0.6)">
                  • 自定义角色设置和背景
                </Text>
              </VStack>
            </Box>
          </VStack>
        </DialogBody>

        <DialogFooter>
          <Flex gap="3" width="100%" justify="center">
            <Button
              onClick={onClose}
              bg="rgba(255, 255, 255, 0.08)"
              backdropFilter="blur(20px) saturate(180%)"
              border="1px solid rgba(255, 255, 255, 0.2)"
              color="rgba(255, 255, 255, 0.9)"
              borderRadius="12px"
              px="6"
              py="3"
              fontSize="sm"
              fontWeight="500"
              _hover={{
                bg: "rgba(255, 255, 255, 0.12)",
                borderColor: "rgba(255, 255, 255, 0.3)",
                transform: "translateY(-1px)",
                boxShadow: "0 8px 25px rgba(0, 0, 0, 0.2)",
              }}
              _active={{
                transform: "translateY(0)",
                bg: "rgba(255, 255, 255, 0.06)",
              }}
              transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              _before={{
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
                borderRadius: "12px",
                pointerEvents: "none",
              }}
            >
              我知道了
            </Button>
          </Flex>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}