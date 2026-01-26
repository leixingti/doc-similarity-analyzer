import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..")

// 加载 .env.local 文件
dotenv.config({ path: path.join(projectRoot, ".env.local") });
// 备用：加载 .env 文件
dotenv.config({ path: path.join(projectRoot, ".env") });
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startServer, setupPerformanceMonitoring } from "./startup";
import logger from "./logger";
import { initializeDatabase } from "../db-optimized";

async function initializeApp() {
  // 初始化数据库
  await initializeDatabase();
  const app = express();
  const server = createServer(app);
  
  // 设置性能监控
  setupPerformanceMonitoring();
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
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

  // 健康检查端点
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // 就绪检查端点
  app.get("/ready", async (req, res) => {
    try {
      // 检查数据库连接
      const db = (await import("../db-optimized")).getDb();
      await db.select({ id: users.id }).from(users).limit(1);
      res.status(200).json({ status: "ready" });
    } catch (error) {
      res.status(503).json({ status: "not ready", error: (error as Error).message });
    }
  });
  
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
