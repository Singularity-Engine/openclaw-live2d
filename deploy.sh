#!/bin/bash

set -e

# 配置变量 - 请根据实际情况修改
SERVER_IP="${DEPLOY_SERVER_IP:?Please set DEPLOY_SERVER_IP}"
SERVER_USER="${DEPLOY_SERVER_USER:?Please set DEPLOY_SERVER_USER}"
SSH_KEY="${DEPLOY_SSH_KEY:?Please set DEPLOY_SSH_KEY}"
REMOTE_PATH="${DEPLOY_REMOTE_PATH:-/home/$SERVER_USER/App/open-llm-vtuber-web}"
IMAGE_NAME="qdyqszr-web"
IMAGE_TAG="latest"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 开始部署 Open-LLM-VTuber Web 应用...${NC}"

# 检查必要文件
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}❌ 错误: Dockerfile 文件不存在${NC}"
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ 错误: docker-compose.yml 文件不存在${NC}"
    exit 1
fi

if [ ! -f "${SSH_KEY}" ]; then
    echo -e "${RED}❌ 错误: SSH密钥文件不存在: ${SSH_KEY}${NC}"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 错误: package.json 文件不存在${NC}"
    exit 1
fi

# 1. 加载环境变量并构建镜像
echo -e "${YELLOW}📦 加载环境变量并构建Docker镜像...${NC}"
if [ -f ".env.local" ]; then
    export $(grep -v '^#' .env.local | xargs)
    echo "已加载 .env.local 文件中的环境变量"
fi

# 为 VTuber 项目设置特定的构建参数
docker build \
    --build-arg VITE_API_URL="${VITE_API_URL:-http://localhost}" \
    --build-arg VITE_WS_URL="${VITE_WS_URL:-ws://localhost}" \
    -t ${IMAGE_NAME}:${IMAGE_TAG} .

# 2. 保存镜像
echo -e "${YELLOW}💾 保存镜像为tar包...${NC}"
docker save -o ${IMAGE_NAME}.tar ${IMAGE_NAME}:${IMAGE_TAG}

echo -e "${BLUE}📏 镜像包大小:${NC}"
ls -lh ${IMAGE_NAME}.tar

# 3. 测试SSH连接
echo -e "${YELLOW}🔑 测试SSH连接...${NC}"
ssh -i ${SSH_KEY} -o ConnectTimeout=10 ${SERVER_USER}@${SERVER_IP} "echo 'SSH连接成功'" || {
    echo -e "${RED}❌ SSH连接失败${NC}"
    rm ${IMAGE_NAME}.tar
    exit 1
}

# 4. 创建远程目录
echo -e "${YELLOW}📁 创建远程目录...${NC}"
ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP} "mkdir -p ${REMOTE_PATH}"

# 5. 上传文件
echo -e "${YELLOW}📤 上传文件到服务器...${NC}"
echo "上传镜像包..."
scp -i ${SSH_KEY} ${IMAGE_NAME}.tar ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/
echo "上传docker-compose.yml..."
scp -i ${SSH_KEY} docker-compose.yml ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/

# 上传必要文件
echo "上传 Dockerfile..."
scp -i ${SSH_KEY} Dockerfile ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/

# 上传环境文件（如果存在）
if [ -f ".env.local" ]; then
    echo "上传 .env.local 文件..."
    scp -i ${SSH_KEY} .env.local ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/
fi

if [ -f ".env.production" ]; then
    echo "上传 .env.production 文件..."
    scp -i ${SSH_KEY} .env.production ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/
fi

# 上传 package.json 用于版本信息
echo "上传 package.json..."
scp -i ${SSH_KEY} package.json ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/

# 6. 服务器部署
echo -e "${YELLOW}🔄 在服务器上部署服务...${NC}"
ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP} << EOF
    set -e
    cd ${REMOTE_PATH}

    echo "停止旧服务..."
    docker compose down 2>/dev/null || true

    echo "清理旧镜像..."
    docker rmi ${IMAGE_NAME}:${IMAGE_TAG} 2>/dev/null || true

    echo "加载新镜像..."
    docker load -i ${IMAGE_NAME}.tar

    echo "检查Docker网络..."
    if ! docker network inspect mcp_appnet >/dev/null 2>&1; then
        echo "创建Docker网络 mcp_appnet..."
        docker network create mcp_appnet
    fi

    echo "启动服务..."
    docker compose up -d

    echo "等待服务启动..."
    sleep 30

    echo "检查服务状态..."
    docker compose ps

    echo "显示服务日志（最近20行）..."
    docker compose logs --tail=20 open-llm-vtuber-web

    echo "测试服务健康状态..."
    if curl -f -s http://localhost:3001 > /dev/null; then
        echo "✅ 前端服务健康检查通过"
    else
        echo "⚠️  警告: 前端服务健康检查失败，查看完整日志..."
        docker compose logs open-llm-vtuber-web
    fi

    echo "清理镜像文件..."
    rm ${IMAGE_NAME}.tar

    echo "显示应用版本信息..."
    if [ -f "package.json" ]; then
        APP_VERSION=\$(grep '"version"' package.json | head -1 | awk -F: '{ print \$2 }' | sed 's/[",]//g' | tr -d ' ')
        echo "应用版本: \$APP_VERSION"
    fi

    echo "✅ 服务器部署完成！"
EOF

# 7. 清理本地文件
echo -e "${YELLOW}🧹 清理本地临时文件...${NC}"
rm ${IMAGE_NAME}.tar

echo -e "${GREEN}🎉 部署成功完成！${NC}"
echo -e "${BLUE}🌐 服务地址: http://${SERVER_IP}:3001${NC}"

# 8. 最终测试
echo -e "${YELLOW}🔍 执行最终连通性测试...${NC}"
sleep 5
if curl -f -s http://${SERVER_IP}:3001 > /dev/null; then
    echo -e "${GREEN}✅ 远程服务访问正常${NC}"
else
    echo -e "${YELLOW}⚠️  远程服务暂时无法访问，可能需要等待服务完全启动或检查防火墙设置${NC}"
    echo -e "${YELLOW}💡 正在检查服务状态...${NC}"
    ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP} "cd ${REMOTE_PATH} && docker compose ps && echo '--- 最近日志 ---' && docker compose logs --tail=10 open-llm-vtuber-web"
fi

echo -e "${BLUE}📚 部署后操作建议:${NC}"
echo -e "  - 检查服务状态: ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP} 'cd ${REMOTE_PATH} && docker compose ps'"
echo -e "  - 查看前端日志: ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP} 'cd ${REMOTE_PATH} && docker compose logs open-llm-vtuber-web'"
echo -e "  - 查看后端日志: ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP} 'cd ${REMOTE_PATH} && docker compose logs open-llm-vtuber-backend'"
echo -e "  - 重启服务: ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP} 'cd ${REMOTE_PATH} && docker compose restart'"
echo -e "  - 查看实时日志: ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP} 'cd ${REMOTE_PATH} && docker compose logs -f open-llm-vtuber-web'"
echo -e "  - 检查网络连接: ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP} 'cd ${REMOTE_PATH} && docker network ls && docker compose exec open-llm-vtuber-web ping backend'"

echo -e "${BLUE}🎮 VTuber 应用特别说明:${NC}"
echo -e "  - 确保后端服务正在运行"
echo -e "  - Live2D 模型需要通过后端接口获取"
echo -e "  - WebSocket 连接用于实时音频和控制通信"
echo -e "  - 如需调试，可检查浏览器控制台的 WebSocket 连接状态"