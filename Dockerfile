# 多阶段构建 - 第一阶段：构建
FROM node:22-alpine AS builder

WORKDIR /app

# 安装构建依赖
RUN apk add --no-cache python3 make g++

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package 文件和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 使用 pnpm 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm run build

# 多阶段构建 - 第二阶段：运行时
FROM node:22-alpine

WORKDIR /app

# 安装运行时依赖
RUN apk add --no-cache dumb-init curl

# 安装 pnpm
RUN npm install -g pnpm

# 从构建阶段复制 node_modules
COPY --from=builder /app/node_modules ./node_modules

# 从构建阶段复制构建输出
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# 复制必要的文件
COPY package.json pnpm-lock.yaml ./
COPY drizzle ./drizzle

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p /app/uploads && \
    chown -R nodejs:nodejs /app

USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 使用 dumb-init 启动应用以正确处理信号
ENTRYPOINT ["/usr/sbin/dumb-init", "--"]
CMD ["node", "dist/index.js"]
