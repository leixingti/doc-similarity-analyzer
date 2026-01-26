# 后端 API 和数据库查询优化指南

## 概述

本文档提供了后端 API 和数据库查询的优化策略，旨在提升应用的性能、可靠性和可维护性。

## 1. 数据库查询优化

### 问题
未优化的数据库查询可能导致性能瓶颈，特别是在处理大量数据时。

### 解决方案

#### 1.1 使用索引

```typescript
// 在 Drizzle ORM 中定义索引
import { index } from "drizzle-orm";

export const usersTable = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").unique().notNull(),
    name: text("name").notNull(),
    role: text("role").default("user"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    emailIdx: index("email_idx").on(table.email),
    roleIdx: index("role_idx").on(table.role),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
  })
);
```

#### 1.2 避免 N+1 查询问题

```typescript
// ❌ 不好: N+1 查询
async function getDocumentsWithAnalysis() {
  const documents = await db.select().from(documentsTable);
  
  // 这会导致 N 次额外查询
  const results = await Promise.all(
    documents.map((doc) =>
      db.select().from(analysisTable).where(eq(analysisTable.documentId, doc.id))
    )
  );
  
  return documents.map((doc, i) => ({ ...doc, analysis: results[i] }));
}

// ✅ 好: 使用 JOIN
async function getDocumentsWithAnalysis() {
  return db
    .select()
    .from(documentsTable)
    .leftJoin(analysisTable, eq(documentsTable.id, analysisTable.documentId));
}
```

#### 1.3 使用分页

```typescript
// 分页查询
async function getDocuments(page: number = 1, pageSize: number = 20) {
  const offset = (page - 1) * pageSize;
  
  const [documents, totalCount] = await Promise.all([
    db
      .select()
      .from(documentsTable)
      .limit(pageSize)
      .offset(offset)
      .orderBy(desc(documentsTable.createdAt)),
    db.select({ count: count() }).from(documentsTable),
  ]);
  
  return {
    documents,
    total: totalCount[0].count,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount[0].count / pageSize),
  };
}
```

#### 1.4 选择性查询字段

```typescript
// ❌ 不好: 查询所有字段
async function getUserList() {
  return db.select().from(usersTable);
}

// ✅ 好: 只查询需要的字段
async function getUserList() {
  return db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
    })
    .from(usersTable);
}
```

#### 1.5 使用查询缓存

```typescript
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 300 }); // 5 分钟缓存

async function getCachedDocuments(userId: string) {
  const cacheKey = `documents:${userId}`;
  
  // 检查缓存
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // 查询数据库
  const documents = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.userId, userId));
  
  // 保存到缓存
  cache.set(cacheKey, documents);
  
  return documents;
}

// 在更新/删除后清除缓存
async function deleteDocument(documentId: string) {
  await db.delete(documentsTable).where(eq(documentsTable.id, documentId));
  
  // 清除相关缓存
  cache.flushAll();
}
```

## 2. API 响应优化

### 问题
API 响应可能包含不必要的数据，导致网络传输缓慢。

### 解决方案

#### 2.1 响应压缩

```typescript
import compression from "compression";

app.use(compression());
```

#### 2.2 字段过滤

```typescript
// 创建一个工具函数来过滤响应字段
function filterFields(data: any, fields: string[]) {
  if (Array.isArray(data)) {
    return data.map((item) =>
      fields.reduce((acc, field) => {
        acc[field] = item[field];
        return acc;
      }, {} as any)
    );
  }
  
  return fields.reduce((acc, field) => {
    acc[field] = data[field];
    return acc;
  }, {} as any);
}

// 在 tRPC 中使用
export const documentRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const documents = await db.select().from(documentsTable);
    
    // 只返回必要的字段
    return filterFields(documents, ["id", "name", "createdAt"]);
  }),
});
```

#### 2.3 异步处理

```typescript
// 对于耗时的操作，使用后台任务
import Bull from "bull";

const analysisQueue = new Bull("analysis");

export const analysisRouter = router({
  startAnalysis: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ input }) => {
      // 立即返回，不等待分析完成
      await analysisQueue.add({ documentId: input.documentId });
      
      return { status: "queued", documentId: input.documentId };
    }),

  getAnalysisStatus: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .query(async ({ input }) => {
      const analysis = await db
        .select()
        .from(analysisTable)
        .where(eq(analysisTable.documentId, input.documentId));
      
      return analysis[0] || { status: "pending" };
    }),
});

// 后台处理
analysisQueue.process(async (job) => {
  const { documentId } = job.data;
  
  // 执行分析
  const result = await performAnalysis(documentId);
  
  // 保存结果
  await db.insert(analysisTable).values({
    documentId,
    result,
    status: "complete",
  });
});
```

## 3. 速率限制

### 问题
恶意用户可能会通过大量请求来攻击应用。

### 解决方案

```typescript
import rateLimit from "express-rate-limit";

// 创建速率限制中间件
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 最多 100 个请求
  message: "您的请求过于频繁，请稍后再试",
  standardHeaders: true, // 返回速率限制信息到 `RateLimit-*` 头
  legacyHeaders: false, // 禁用 `X-RateLimit-*` 头
});

// 应用到所有路由
app.use(limiter);

// 或应用到特定路由
app.post("/api/upload", limiter, uploadHandler);

// 创建更严格的限制用于登录
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 15 分钟内最多 5 次登录尝试
  skipSuccessfulRequests: true, // 成功的请求不计入限制
});

app.post("/api/login", loginLimiter, loginHandler);
```

## 4. 错误处理和日志

### 问题
错误处理不当可能导致信息泄露或调试困难。

### 解决方案

```typescript
import logger from "./logger";

// 创建自定义错误类
class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
  }
}

// 全局错误处理中间件
app.use((err: Error, req: Express.Request, res: Express.Response, next: Function) => {
  if (err instanceof AppError) {
    logger.error(
      {
        code: err.code,
        message: err.message,
        path: req.path,
        method: req.method,
      },
      "Application Error"
    );
    
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  } else {
    logger.error(
      {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
      },
      "Unexpected Error"
    );
    
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "发生了一个错误",
      },
    });
  }
});

// 在 tRPC 中使用
export const documentRouter = router({
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const document = await db
          .select()
          .from(documentsTable)
          .where(eq(documentsTable.id, input.id));
        
        if (!document[0]) {
          throw new AppError("文档不存在", "NOT_FOUND", 404);
        }
        
        if (document[0].userId !== ctx.user.id) {
          throw new AppError("您没有权限删除此文档", "FORBIDDEN", 403);
        }
        
        await db.delete(documentsTable).where(eq(documentsTable.id, input.id));
        
        logger.info({ documentId: input.id, userId: ctx.user.id }, "Document deleted");
        
        return { success: true };
      } catch (error) {
        logger.error({ error, documentId: input.id }, "Failed to delete document");
        throw error;
      }
    }),
});
```

## 5. 连接池管理

### 问题
数据库连接管理不当可能导致连接泄漏或性能问题。

### 解决方案

```typescript
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

// 创建连接池
const poolConnection = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // 最多 10 个连接
  queueLimit: 0, // 无限等待队列
});

export const db = drizzle(poolConnection);

// 优雅关闭
process.on("SIGTERM", async () => {
  await poolConnection.end();
  process.exit(0);
});
```

## 6. 批量操作

### 问题
逐个插入/更新数据可能很慢。

### 解决方案

```typescript
// ❌ 不好: 逐个插入
async function importDocuments(documents: Document[]) {
  for (const doc of documents) {
    await db.insert(documentsTable).values(doc);
  }
}

// ✅ 好: 批量插入
async function importDocuments(documents: Document[]) {
  await db.insert(documentsTable).values(documents);
}

// 对于非常大的批次，分批处理
async function importLargeDataset(documents: Document[], batchSize: number = 1000) {
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    await db.insert(documentsTable).values(batch);
  }
}
```

## 7. 监控和性能指标

### 问题
无法了解 API 的性能瓶颈。

### 解决方案

```typescript
import { performance } from "perf_hooks";

// 创建性能监控中间件
app.use((req, res, next) => {
  const start = performance.now();
  
  res.on("finish", () => {
    const duration = performance.now() - start;
    
    logger.info(
      {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration.toFixed(2)}ms`,
      },
      "API Request"
    );
    
    // 记录慢查询
    if (duration > 1000) {
      logger.warn(
        {
          method: req.method,
          path: req.path,
          duration: `${duration.toFixed(2)}ms`,
        },
        "Slow API Request"
      );
    }
  });
  
  next();
});

// 监控数据库查询
const originalQuery = db.query.bind(db);
db.query = function(...args: any[]) {
  const start = performance.now();
  
  return originalQuery(...args).then((result: any) => {
    const duration = performance.now() - start;
    
    if (duration > 100) {
      logger.warn(
        {
          query: args[0],
          duration: `${duration.toFixed(2)}ms`,
        },
        "Slow Database Query"
      );
    }
    
    return result;
  });
};
```

## 总结

通过实施这些优化策略，您可以显著提升后端 API 的性能、可靠性和可维护性。关键是要定期监控性能指标，并根据实际情况进行调整。
