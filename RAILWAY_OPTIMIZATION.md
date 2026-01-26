# Railway 平台部署优化指南

## 1. Railway 平台特性分析

### 1.1 平台特点

**Railway** 是一个现代化的云部署平台，具有以下特点：

- **容器化部署**: 使用 Docker 容器化应用，支持自动构建和部署。
- **环境变量管理**: 支持通过 Web UI 管理环境变量，无需修改代码。
- **自动扩展**: 支持自动扩展和负载均衡。
- **数据库支持**: 原生支持 PostgreSQL、MySQL、MongoDB 等数据库。
- **实时日志**: 提供实时日志查看和监控。
- **自动 HTTPS**: 自动配置 SSL/TLS 证书。

### 1.2 部署要求

- **Dockerfile**: 应用必须包含 Dockerfile，用于构建容器镜像。
- **端口配置**: 应用必须监听环境变量 `PORT` 指定的端口（默认 3000）。
- **健康检查**: 建议实现健康检查端点，用于监控应用状态。
- **日志输出**: 应用应该将日志输出到 stdout/stderr，而不是文件。
- **环境变量**: 应用应该支持通过环境变量配置所有敏感信息。

## 2. 应用配置优化

### 2.1 环境变量配置

创建 `.env.example` 文件，列出所有必需的环境变量：

```bash
# 服务器配置
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# 数据库配置
DATABASE_URL=mysql://user:password@localhost:3306/dbname

# JWT 配置
JWT_SECRET=your-secret-key

# OAuth 配置
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret

# API 配置
FORGE_API_KEY=your-api-key
FORGE_API_BASE_URL=https://api.manus.im

# 文件上传配置
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=/tmp/uploads

# 日志配置
LOG_LEVEL=info
```

### 2.2 优化 package.json

确保 `package.json` 中的脚本正确配置：

```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx watch server/_core/index.ts",
    "build": "vite build && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc --noEmit",
    "format": "prettier --write .",
    "test": "vitest run"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### 2.3 创建 railway.json

创建 `railway.json` 文件，配置 Railway 特定的设置：

```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "npm run start",
    "restartPolicyMaxRetries": 5,
    "restartPolicyWindow": 600
  }
}
```

## 3. Docker 配置优化

### 3.1 创建优化的 Dockerfile

```dockerfile
# 多阶段构建 - 第一阶段：构建
FROM node:22-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 多阶段构建 - 第二阶段：运行
FROM node:22-alpine

WORKDIR /app

# 安装 dumb-init 用于正确的信号处理
RUN apk add --no-cache dumb-init

# 从构建阶段复制 node_modules
COPY --from=builder /app/node_modules ./node_modules

# 从构建阶段复制构建输出
COPY --from=builder /app/dist ./dist

# 复制必要的文件
COPY package*.json ./
COPY drizzle ./drizzle

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# 暴露端口
EXPOSE 3000

# 使用 dumb-init 启动应用
ENTRYPOINT ["/usr/sbin/dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

### 3.2 创建 .dockerignore

```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.env.local
.DS_Store
dist
.vite
.manus-logs
```

### 3.3 优化构建性能

创建 `Dockerfile.optimized` 用于更快的构建：

```dockerfile
# 使用 pnpm 加快依赖安装
FROM node:22-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 pnpm-lock.yaml（如果使用 pnpm）
COPY pnpm-lock.yaml* ./
COPY package.json ./

# 使用 pnpm 安装依赖
RUN pnpm install --frozen-lockfile --prod

# 复制源代码
COPY . .

# 构建应用
RUN pnpm build

# 第二阶段
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

ENTRYPOINT ["/usr/sbin/dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

## 4. 数据库连接优化

### 4.1 连接池配置

```typescript
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";

const poolConnection = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "3306"),
  waitForConnections: true,
  connectionLimit: process.env.NODE_ENV === "production" ? 20 : 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
});

export const db = drizzle(poolConnection);

// 优雅关闭
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing database connection...");
  await poolConnection.end();
  process.exit(0);
});
```

### 4.2 数据库 URL 解析

```typescript
import { parse } from "url";

function parseDatabaseUrl(url: string) {
  const parsed = parse(url);
  const [user, password] = (parsed.auth || "").split(":");
  const [host, port] = (parsed.host || "").split(":");

  return {
    host: host || "localhost",
    port: parseInt(port || "3306"),
    user: user || "root",
    password: password || "",
    database: parsed.pathname?.slice(1) || "test",
  };
}

const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL || "");
```

## 5. 启动脚本和生产环境配置

### 5.1 优化的启动脚本

```typescript
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");

// 根据环境加载 .env 文件
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.join(projectRoot, ".env.local") });
  dotenv.config({ path: path.join(projectRoot, ".env") });
}

import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startServer, setupPerformanceMonitoring } from "./startup";
import logger from "./logger";

async function initializeApp() {
  const app = express();
  const server = createServer(app);

  // 设置性能监控
  setupPerformanceMonitoring();

  // 健康检查端点
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // 就绪检查端点
  app.get("/ready", async (req, res) => {
    try {
      // 检查数据库连接
      // await db.select().from(usersTable).limit(1);
      res.status(200).json({ status: "ready" });
    } catch (error) {
      res.status(503).json({ status: "not ready", error: (error as Error).message });
    }
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");

  // 使用优化的启动函数
  await startServer(app, server, {
    preferredPort,
    maxPortAttempts: 5, // Railway 环境下减少尝试次数
    healthCheckInterval: 30000,
    gracefulShutdownTimeout: 15000,
  });
}

initializeApp().catch((error) => {
  logger.fatal({ err: error }, "Failed to initialize application");
  process.exit(1);
});
```

### 5.2 生产环境日志配置

```typescript
import pino from "pino";

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  // 在生产环境中，pino 会自动输出到 stdout
});

export default logger;
```

## 6. Railway 特定优化

### 6.1 处理 Railway 的临时文件系统

Railway 使用临时文件系统，应用重启后文件会丢失。对于文件上传：

```typescript
// 使用 S3 或其他云存储
import { S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// 或使用 Railway 的数据卷
// 在 railway.json 中配置
{
  "volumes": {
    "/app/uploads": "uploads-volume"
  }
}
```

### 6.2 处理 Railway 的自动重启

Railway 可能会自动重启应用。确保应用能够优雅地处理：

```typescript
// 实现优雅关闭
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, starting graceful shutdown");
  
  // 停止接受新请求
  server.close(() => {
    logger.info("Server closed");
  });
  
  // 关闭数据库连接
  await db.close();
  
  // 清理资源
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, starting graceful shutdown");
  process.exit(0);
});
```

### 6.3 监控和日志

```typescript
// 定期输出健康状态
setInterval(() => {
  const memUsage = process.memoryUsage();
  logger.info(
    {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    },
    "Memory usage"
  );
}, 60000); // 每分钟输出一次
```

## 7. 部署检查清单

### 7.1 部署前检查

- [ ] 所有环境变量都在 `.env.example` 中列出
- [ ] `package.json` 中的 `engines` 字段指定了正确的 Node.js 版本
- [ ] Dockerfile 已创建并测试过
- [ ] `.dockerignore` 已创建
- [ ] 应用有健康检查端点 (`/health`)
- [ ] 应用有就绪检查端点 (`/ready`)
- [ ] 应用监听环境变量 `PORT` 指定的端口
- [ ] 所有敏感信息都通过环境变量配置
- [ ] 日志输出到 stdout/stderr
- [ ] 数据库迁移脚本已准备
- [ ] 应用实现了优雅关闭
- [ ] 构建时间不超过 15 分钟

### 7.2 部署步骤

1. **连接 Railway 项目**
   ```bash
   railway init
   ```

2. **配置环境变量**
   在 Railway 仪表板中设置所有必需的环境变量

3. **部署应用**
   ```bash
   railway up
   ```

4. **验证部署**
   - 检查应用日志
   - 访问健康检查端点
   - 测试关键功能

### 7.3 监控和维护

- **查看日志**
   ```bash
   railway logs
   ```

- **查看指标**
   在 Railway 仪表板中查看 CPU、内存、网络等指标

- **扩展应用**
   在 Railway 仪表板中配置副本数量

## 8. 常见问题和解决方案

### 问题 1: 应用启动超时

**原因**: 应用启动时间过长或依赖项加载缓慢

**解决方案**:
- 优化 Dockerfile，使用多阶段构建
- 减少启动时的初始化操作
- 使用 `npm ci` 而不是 `npm install` 加快依赖安装

### 问题 2: 内存不足

**原因**: 应用内存使用过高

**解决方案**:
- 检查内存泄漏
- 优化数据库查询
- 使用流式处理处理大文件
- 配置 Node.js 堆大小限制

### 问题 3: 数据库连接失败

**原因**: 数据库连接配置错误

**解决方案**:
- 验证 `DATABASE_URL` 环境变量
- 检查数据库防火墙规则
- 使用连接池而不是单个连接
- 实现重试逻辑

### 问题 4: 文件上传失败

**原因**: Railway 环境中没有持久化存储

**解决方案**:
- 使用 S3 或其他云存储服务
- 配置临时目录用于处理文件
- 实现异步文件处理

## 9. 性能优化建议

- **启用 gzip 压缩**: 减少网络传输大小
- **使用 CDN**: 加速静态资源传输
- **实现缓存**: 减少数据库查询
- **优化数据库索引**: 提升查询性能
- **使用连接池**: 提高数据库连接效率
- **监控性能指标**: 定期检查和优化

## 总结

通过遵循本指南，您可以确保应用在 Railway 平台上的顺利部署和高效运行。关键是要充分利用 Railway 提供的功能，同时遵循云原生应用的最佳实践。
