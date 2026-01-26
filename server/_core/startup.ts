/**
 * 优化的应用启动模块
 * 
 * 改进内容:
 * 1. 更好的错误处理和日志记录
 * 2. 优化的端口查找逻辑
 * 3. 健康检查
 * 4. 优雅关闭
 * 5. 启动性能监控
 */

import { type Express } from "express";
import { type Server } from "http";
import net from "net";

interface StartupOptions {
  preferredPort?: number;
  maxPortAttempts?: number;
  healthCheckInterval?: number;
  gracefulShutdownTimeout?: number;
}

const DEFAULT_OPTIONS: Required<StartupOptions> = {
  preferredPort: 3000,
  maxPortAttempts: 20,
  healthCheckInterval: 30000, // 30 seconds
  gracefulShutdownTimeout: 10000, // 10 seconds
};

/**
 * 检查端口是否可用
 */
function isPortAvailable(port: number, timeout = 1000): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    const onError = () => {
      server.close();
      resolve(false);
    };

    const onListening = () => {
      server.close();
      resolve(true);
    };

    server.once("error", onError);
    server.once("listening", onListening);

    const timer = setTimeout(() => {
      server.close();
      resolve(false);
    }, timeout);

    server.listen(port, () => {
      clearTimeout(timer);
      onListening();
    });
  });
}

/**
 * 查找可用的端口
 */
async function findAvailablePort(
  startPort: number,
  maxAttempts: number
): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(
    `No available port found in range ${startPort}-${startPort + maxAttempts - 1}`
  );
}

/**
 * 启动服务器
 */
export async function startServer(
  app: Express,
  server: Server,
  options: StartupOptions = {}
): Promise<{ port: number; server: Server }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  console.log("[Startup] Starting application...");
  const startTime = Date.now();

  try {
    // 查找可用端口
    console.log(`[Startup] Looking for available port starting from ${opts.preferredPort}...`);
    const port = await findAvailablePort(opts.preferredPort, opts.maxPortAttempts);

    if (port !== opts.preferredPort) {
      console.warn(
        `[Startup] Port ${opts.preferredPort} is busy, using port ${port} instead`
      );
    }

    // 启动服务器
    return new Promise((resolve, reject) => {
      const onError = (error: Error) => {
        console.error("[Startup] Server error:", error);
        reject(error);
      };

      const onListening = () => {
        const duration = Date.now() - startTime;
        console.log(`[Startup] ✅ Server running on http://localhost:${port}/`);
        console.log(`[Startup] Startup time: ${duration}ms`);

        // 移除错误监听器
        server.removeListener("error", onError);

        // 设置健康检查
        setupHealthCheck(server, opts.healthCheckInterval);

        // 设置优雅关闭
        setupGracefulShutdown(server, opts.gracefulShutdownTimeout);

        resolve({ port, server });
      };

      server.once("error", onError);
      server.once("listening", onListening);

      // 添加超时保护
      const timeout = setTimeout(() => {
        server.removeListener("error", onError);
        server.removeListener("listening", onListening);
        reject(new Error("Server startup timeout"));
      }, 30000); // 30 seconds timeout

      server.listen(port, () => {
        clearTimeout(timeout);
      });
    });
  } catch (error) {
    console.error("[Startup] Failed to start server:", error);
    throw error;
  }
}

/**
 * 设置健康检查
 */
function setupHealthCheck(server: Server, interval: number): void {
  let lastCheckTime = Date.now();
  let checkCount = 0;

  const healthCheckTimer = setInterval(() => {
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckTime;

    checkCount++;

    // 如果检查间隔异常长，可能表示事件循环被阻塞
    if (timeSinceLastCheck > interval * 1.5) {
      console.warn(
        `[Health] Event loop may be blocked. Expected interval: ${interval}ms, actual: ${timeSinceLastCheck}ms`
      );
    }

    lastCheckTime = now;

    // 定期打印内存使用情况
    if (checkCount % 2 === 0) {
      const memUsage = process.memoryUsage();
      console.log(
        `[Health] Memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
      );
    }
  }, interval);

  // 防止定时器阻止进程退出
  healthCheckTimer.unref();
}

/**
 * 设置优雅关闭
 */
function setupGracefulShutdown(server: Server, timeout: number): void {
  const signals = ["SIGTERM", "SIGINT"];

  signals.forEach((signal) => {
    process.on(signal, () => {
      console.log(`[Shutdown] Received ${signal}, starting graceful shutdown...`);

      const shutdownTimer = setTimeout(() => {
        console.error("[Shutdown] Graceful shutdown timeout, forcing exit");
        process.exit(1);
      }, timeout);

      server.close(() => {
        clearTimeout(shutdownTimer);
        console.log("[Shutdown] ✅ Server closed gracefully");
        process.exit(0);
      });

      // 停止接受新连接
      server.close();
    });
  });
}

/**
 * 监控应用性能
 */
export function setupPerformanceMonitoring(): void {
  // 监控未捕获的异常
  process.on("uncaughtException", (error) => {
    console.error("[Error] Uncaught exception:", error);
    process.exit(1);
  });

  // 监控未处理的 Promise 拒绝
  process.on("unhandledRejection", (reason, promise) => {
    console.error("[Error] Unhandled rejection at:", promise, "reason:", reason);
  });

  // 监控内存泄漏
  const initialMemory = process.memoryUsage().heapUsed;
  let checkCount = 0;

  setInterval(() => {
    checkCount++;
    const currentMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = currentMemory - initialMemory;

    // 每10分钟检查一次
    if (checkCount % 20 === 0) {
      const growthMB = Math.round(memoryGrowth / 1024 / 1024);
      console.log(`[Performance] Memory growth since startup: ${growthMB}MB`);

      // 如果内存增长超过 500MB，发出警告
      if (growthMB > 500) {
        console.warn(
          `[Performance] ⚠️  High memory growth detected: ${growthMB}MB`
        );
      }
    }
  }, 30000); // 每 30 秒检查一次
}
