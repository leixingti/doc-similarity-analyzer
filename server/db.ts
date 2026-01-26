import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  documents, InsertDocument, Document,
  analysisTasks, InsertAnalysisTask, AnalysisTask,
  analysisResults, InsertAnalysisResult, AnalysisResult,
  similaritySegments, InsertSimilaritySegment, SimilaritySegment,
  userPreferences, InsertUserPreference, UserPreference
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== 用户相关 ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

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
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== 文档相关 ====================

export async function createDocument(doc: InsertDocument): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(documents).values(doc);
  return Number(result[0].insertId);
}

export async function getDocumentById(id: number): Promise<Document | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getDocumentsByIds(ids: number[]): Promise<Document[]> {
  const db = await getDb();
  if (!db || ids.length === 0) return [];

  const result = await db.select().from(documents).where(
    sql`${documents.id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`
  );
  return result;
}

export async function getUserDocuments(userId: number): Promise<Document[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(documents).where(eq(documents.userId, userId)).orderBy(desc(documents.createdAt));
}

// deleteDocument函数已移动到文件末尾，包含完整的关联删除逻辑

// ==================== 分析任务相关 ====================

export async function createAnalysisTask(task: InsertAnalysisTask): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(analysisTasks).values(task);
  return Number(result[0].insertId);
}

export async function getAnalysisTaskById(id: number): Promise<AnalysisTask | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(analysisTasks).where(eq(analysisTasks.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getUserAnalysisTasks(userId: number): Promise<AnalysisTask[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(analysisTasks).where(eq(analysisTasks.userId, userId)).orderBy(desc(analysisTasks.createdAt));
}

export async function updateAnalysisTask(id: number, updates: Partial<AnalysisTask>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(analysisTasks).set(updates).where(eq(analysisTasks.id, id));
}

// ==================== 分析结果相关 ====================

export async function createAnalysisResult(result: InsertAnalysisResult): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const insertResult = await db.insert(analysisResults).values(result);
  return Number(insertResult[0].insertId);
}

export async function getAnalysisResultByTaskId(taskId: number): Promise<AnalysisResult | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(analysisResults).where(eq(analysisResults.taskId, taskId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ==================== 相似片段相关 ====================

export async function createSimilaritySegments(segments: InsertSimilaritySegment[]): Promise<void> {
  const db = await getDb();
  if (!db || segments.length === 0) return;

  await db.insert(similaritySegments).values(segments);
}

export async function getSimilaritySegmentsByResultId(resultId: number): Promise<SimilaritySegment[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(similaritySegments).where(eq(similaritySegments.resultId, resultId)).orderBy(desc(similaritySegments.similarity));
}

// ==================== 用户偏好相关 ====================

export async function getUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const results = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  return results[0] || null;
}

export async function deleteDocument(documentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // 验证文档所有权
  const doc = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
  if (!doc[0] || doc[0].userId !== userId) {
    throw new Error('Document not found or access denied');
  }
  
  // 删除关联的分析任务和结果
  const tasks = await db.select().from(analysisTasks)
    .where(eq(analysisTasks.userId, userId));
  
  for (const task of tasks) {
    const docIds = task.documentIds as number[];
    if (docIds.includes(documentId)) {
      // 删除相似片段
      const results = await db.select().from(analysisResults)
        .where(eq(analysisResults.taskId, task.id));
      for (const result of results) {
        await db.delete(similaritySegments)
          .where(eq(similaritySegments.resultId, result.id));
      }
      // 删除分析结果
      await db.delete(analysisResults)
        .where(eq(analysisResults.taskId, task.id));
      // 删除任务
      await db.delete(analysisTasks)
        .where(eq(analysisTasks.id, task.id));
    }
  }
  
  // 删除文档
  await db.delete(documents).where(eq(documents.id, documentId));
}

export async function createUserPreferences(prefs: InsertUserPreference): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(userPreferences).values(prefs).onDuplicateKeyUpdate({
    set: {
      similarityThresholds: prefs.similarityThresholds,
      defaultAnalysisMode: prefs.defaultAnalysisMode,
      autoSaveResults: prefs.autoSaveResults,
      emailNotifications: prefs.emailNotifications,
      language: prefs.language,
      theme: prefs.theme,
      displayOptions: prefs.displayOptions,
      updatedAt: new Date(),
    }
  });
}

export async function updateUserPreferences(userId: number, updates: Partial<InsertUserPreference>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(userPreferences).set({ ...updates, updatedAt: new Date() }).where(eq(userPreferences.userId, userId));
}

// ==================== 历史记录和统计相关 ====================

export async function getAnalysisHistory(
  userId: number,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    minSimilarity?: number;
    maxSimilarity?: number;
  }
): Promise<AnalysisTask[]> {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(analysisTasks).where(eq(analysisTasks.userId, userId));

  const conditions = [eq(analysisTasks.userId, userId)];

  if (filters?.startDate) {
    conditions.push(gte(analysisTasks.createdAt, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(analysisTasks.createdAt, filters.endDate));
  }
  if (filters?.minSimilarity !== undefined) {
    conditions.push(gte(analysisTasks.overallSimilarity, filters.minSimilarity));
  }
  if (filters?.maxSimilarity !== undefined) {
    conditions.push(lte(analysisTasks.overallSimilarity, filters.maxSimilarity));
  }

  const result = await db.select().from(analysisTasks).where(and(...conditions)).orderBy(desc(analysisTasks.createdAt));
  return result;
}

export async function getAnalysisStatistics(userId: number): Promise<{
  totalCount: number;
  avgSimilarity: number;
  maxSimilarity: number;
  minSimilarity: number;
}> {
  const db = await getDb();
  if (!db) return { totalCount: 0, avgSimilarity: 0, maxSimilarity: 0, minSimilarity: 0 };

  const result = await db.select({
    totalCount: sql<number>`COUNT(*)`,
    avgSimilarity: sql<number>`AVG(${analysisTasks.overallSimilarity})`,
    maxSimilarity: sql<number>`MAX(${analysisTasks.overallSimilarity})`,
    minSimilarity: sql<number>`MIN(${analysisTasks.overallSimilarity})`,
  }).from(analysisTasks).where(
    and(
      eq(analysisTasks.userId, userId),
      eq(analysisTasks.status, 'completed')
    )
  );

  return {
    totalCount: Number(result[0]?.totalCount || 0),
    avgSimilarity: Number(result[0]?.avgSimilarity || 0),
    maxSimilarity: Number(result[0]?.maxSimilarity || 0),
    minSimilarity: Number(result[0]?.minSimilarity || 0),
  };
}
