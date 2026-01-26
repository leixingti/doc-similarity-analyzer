/**
 * 优化的数据库连接模块
 * 
 * 特性:
 * - 连接池管理
 * - 自动重连
 * - 性能监控
 * - 优雅关闭
 * - Railway 兼容性
 */

import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import logger from "./_core/logger";
import { 
  InsertUser, users,
  documents, InsertDocument, Document,
  analysisTasks, InsertAnalysisTask, AnalysisTask,
  analysisResults, InsertAnalysisResult, AnalysisResult,
  similaritySegments, InsertSimilaritySegment, SimilaritySegment
} from "../drizzle/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

// 数据库连接池
let pool: mysql.Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

// 解析 DATABASE_URL
function parseDatabaseUrl(url: string) {
  const urlObj = new URL(url);
  return {
    host: urlObj.hostname || "localhost",
    user: urlObj.username || "root",
    password: urlObj.password || "",
    database: urlObj.pathname?.slice(1) || "test",
    port: parseInt(urlObj.port || "3306"),
  };
}

// 连接池配置
const getPoolConfig = () => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isProduction = process.env.NODE_ENV === "production";

  // 优先使用 DATABASE_URL
  let dbConfig = {
    host: "localhost",
    user: "root",
    password: "",
    database: "test",
    port: 3306,
  };

  if (process.env.DATABASE_URL) {
    try {
      dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("Failed to parse DATABASE_URL, using individual env vars");
    }
  } else {
    dbConfig = {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "test",
      port: parseInt(process.env.DB_PORT || "3306"),
    };
  }

  return {
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: isProduction ? 20 : isDevelopment ? 5 : 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelayMs: 0,
    maxIdle: 8,
    idleTimeout: 60000,
    connectionTimeout: 10000,
  };
};

/**
 * 初始化数据库连接池
 */
export async function initializeDatabase() {
  try {
    // 如果已经初始化，直接返回
    if (pool && db) {
      logger.debug("Database already initialized");
      return { pool, db };
    }

    const config = getPoolConfig();

    logger.info(
      {
        host: config.host,
        database: config.database,
        connectionLimit: config.connectionLimit,
      },
      "Initializing database connection pool"
    );

    // 创建连接池
    pool = await mysql.createPool(config);

    // 测试连接
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    logger.info("Database connection pool initialized successfully");

    // 创建 Drizzle ORM 实例
    db = drizzle(pool);

    // 设置优雅关闭处理
    setupGracefulShutdown();

    // 启动性能监控
    startPerformanceMonitoring();

    return { pool, db };
  } catch (error) {
    logger.error({ error }, "Failed to initialize database");
    throw error;
  }
}

/**
 * 获取数据库实例
 */
export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call initializeDatabase() first.");
  }
  return db;
}

/**
 * 获取连接池
 */
export function getPool() {
  if (!pool) {
    throw new Error("Database pool not initialized. Call initializeDatabase() first.");
  }
  return pool;
}

/**
 * 设置优雅关闭
 */
function setupGracefulShutdown() {
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, closing database connection...`);

    if (pool) {
      try {
        await pool.end();
        logger.info("Database connection pool closed");
      } catch (error) {
        logger.error({ error }, "Error closing database connection pool");
      }
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

/**
 * 启动性能监控
 */
function startPerformanceMonitoring() {
  // 定期输出连接池状态
  setInterval(() => {
    if (!pool) return;

    const stats = (pool as any)._connectionHandles?.length || 0;
    const queueLength = (pool as any)._queue?.length || 0;

    logger.debug(
      {
        activeConnections: stats,
        queuedRequests: queueLength,
      },
      "Connection pool status"
    );
  }, 60000); // 每分钟输出一次
}

/**
 * 执行数据库查询，带重试逻辑
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // 如果是连接错误，尝试重连
      if (
        lastError.message.includes("ECONNREFUSED") ||
        lastError.message.includes("PROTOCOL_CONNECTION_LOST")
      ) {
        logger.warn(
          { attempt, maxRetries, error: lastError.message },
          "Database connection error, retrying..."
        );

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
          continue;
        }
      }

      throw error;
    }
  }

  throw lastError || new Error("Unknown error");
}

// ==================== 用户相关 ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const dbInstance = getDb();

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await executeWithRetry(async () => {
      await dbInstance.insert(users).values(values).onDuplicateKeyUpdate({
        set: updateSet,
      });
    });
  } catch (error) {
    logger.error({ error, user: user.openId }, "Failed to upsert user");
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const dbInstance = getDb();

  try {
    const result = await executeWithRetry(async () => {
      return await dbInstance
        .select()
        .from(users)
        .where(eq(users.openId, openId))
        .limit(1);
    });

    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    logger.error({ error, openId }, "Failed to get user by openId");
    return undefined;
  }
}

export async function getUserById(id: number) {
  const dbInstance = getDb();

  try {
    const result = await executeWithRetry(async () => {
      return await dbInstance
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
    });

    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    logger.error({ error, id }, "Failed to get user by id");
    return undefined;
  }
}

// ==================== 文档相关 ====================

export async function createDocument(doc: InsertDocument): Promise<number> {
  const dbInstance = getDb();

  try {
    const result = await executeWithRetry(async () => {
      return await dbInstance.insert(documents).values(doc);
    });

    return Number(result[0].insertId);
  } catch (error) {
    logger.error({ error }, "Failed to create document");
    throw error;
  }
}

export async function getDocumentById(id: number): Promise<Document | null> {
  const dbInstance = getDb();

  try {
    const result = await executeWithRetry(async () => {
      return await dbInstance
        .select()
        .from(documents)
        .where(eq(documents.id, id))
        .limit(1);
    });

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    logger.error({ error, id }, "Failed to get document");
    return null;
  }
}

export async function getUserDocuments(userId: number): Promise<Document[]> {
  const dbInstance = getDb();

  try {
    return await executeWithRetry(async () => {
      return await dbInstance
        .select()
        .from(documents)
        .where(eq(documents.userId, userId))
        .orderBy(desc(documents.createdAt));
    });
  } catch (error) {
    logger.error({ error, userId }, "Failed to get user documents");
    return [];
  }
}

// ==================== 分析任务相关 ====================

export async function createAnalysisTask(task: InsertAnalysisTask): Promise<number> {
  const dbInstance = getDb();

  try {
    const result = await executeWithRetry(async () => {
      return await dbInstance.insert(analysisTasks).values(task);
    });

    return Number(result[0].insertId);
  } catch (error) {
    logger.error({ error }, "Failed to create analysis task");
    throw error;
  }
}

export async function getAnalysisTaskById(id: number): Promise<AnalysisTask | null> {
  const dbInstance = getDb();

  try {
    const result = await executeWithRetry(async () => {
      return await dbInstance
        .select()
        .from(analysisTasks)
        .where(eq(analysisTasks.id, id))
        .limit(1);
    });

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    logger.error({ error, id }, "Failed to get analysis task");
    return null;
  }
}

export async function getUserAnalysisTasks(userId: number): Promise<AnalysisTask[]> {
  const dbInstance = getDb();

  try {
    return await executeWithRetry(async () => {
      return await dbInstance
        .select()
        .from(analysisTasks)
        .where(eq(analysisTasks.userId, userId))
        .orderBy(desc(analysisTasks.createdAt));
    });
  } catch (error) {
    logger.error({ error, userId }, "Failed to get user analysis tasks");
    return [];
  }
}

export async function updateAnalysisTask(
  id: number,
  updates: Partial<AnalysisTask>
): Promise<void> {
  const dbInstance = getDb();

  try {
    await executeWithRetry(async () => {
      await dbInstance.update(analysisTasks).set(updates).where(eq(analysisTasks.id, id));
    });
  } catch (error) {
    logger.error({ error, id }, "Failed to update analysis task");
    throw error;
  }
}

// ==================== 分析结果相关 ====================

export async function createAnalysisResult(result: InsertAnalysisResult): Promise<number> {
  const dbInstance = getDb();

  try {
    const insertResult = await executeWithRetry(async () => {
      return await dbInstance.insert(analysisResults).values(result);
    });

    return Number(insertResult[0].insertId);
  } catch (error) {
    logger.error({ error }, "Failed to create analysis result");
    throw error;
  }
}

export async function getAnalysisResultByTaskId(taskId: number): Promise<AnalysisResult | null> {
  const dbInstance = getDb();

  try {
    const result = await executeWithRetry(async () => {
      return await dbInstance
        .select()
        .from(analysisResults)
        .where(eq(analysisResults.taskId, taskId))
        .limit(1);
    });

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    logger.error({ error, taskId }, "Failed to get analysis result");
    return null;
  }
}

// ==================== 相似片段相关 ====================

export async function createSimilaritySegments(segments: InsertSimilaritySegment[]): Promise<void> {
  const dbInstance = getDb();

  if (segments.length === 0) return;

  try {
    await executeWithRetry(async () => {
      await dbInstance.insert(similaritySegments).values(segments);
    });
  } catch (error) {
    logger.error({ error, count: segments.length }, "Failed to create similarity segments");
    throw error;
  }
}

export async function getSimilaritySegmentsByResultId(
  resultId: number
): Promise<SimilaritySegment[]> {
  const dbInstance = getDb();

  try {
    return await executeWithRetry(async () => {
      return await dbInstance
        .select()
        .from(similaritySegments)
        .where(eq(similaritySegments.resultId, resultId))
        .orderBy(desc(similaritySegments.similarity));
    });
  } catch (error) {
    logger.error({ error, resultId }, "Failed to get similarity segments");
    return [];
  }
}

// ==================== 统计相关 ====================

export async function getAnalysisStatistics(userId: number): Promise<{
  totalCount: number;
  avgSimilarity: number;
  maxSimilarity: number;
  minSimilarity: number;
}> {
  const dbInstance = getDb();

  try {
    const result = await executeWithRetry(async () => {
      return await dbInstance
        .select({
          totalCount: sql<number>`COUNT(*)`,
          avgSimilarity: sql<number>`AVG(${analysisTasks.similarity})`,
          maxSimilarity: sql<number>`MAX(${analysisTasks.similarity})`,
          minSimilarity: sql<number>`MIN(${analysisTasks.similarity})`,
        })
        .from(analysisTasks)
        .where(
          and(eq(analysisTasks.userId, userId), eq(analysisTasks.status, "completed"))
        );
    });

    return {
      totalCount: Number(result[0]?.totalCount || 0),
      avgSimilarity: Number(result[0]?.avgSimilarity || 0),
      maxSimilarity: Number(result[0]?.maxSimilarity || 0),
      minSimilarity: Number(result[0]?.minSimilarity || 0),
    };
  } catch (error) {
    logger.error({ error, userId }, "Failed to get analysis statistics");
    return { totalCount: 0, avgSimilarity: 0, maxSimilarity: 0, minSimilarity: 0 };
  }
}

export default {
  initializeDatabase,
  getDb,
  getPool,
  executeWithRetry,
  upsertUser,
  getUserByOpenId,
  getUserById,
  createDocument,
  getDocumentById,
  getUserDocuments,
  createAnalysisTask,
  getAnalysisTaskById,
  getUserAnalysisTasks,
  updateAnalysisTask,
  createAnalysisResult,
  getAnalysisResultByTaskId,
  createSimilaritySegments,
  getSimilaritySegmentsByResultId,
  getAnalysisStatistics,
};
