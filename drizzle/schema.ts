import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float, json } from "drizzle-orm/mysql-core";

/**
 * 用户表 - 核心认证表
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 文档表 - 存储上传的文档信息
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("originalName", { length: 255 }).notNull(),
  fileType: varchar("fileType", { length: 50 }).notNull(), // docx, pdf, txt, pptx, xlsx, md, html
  fileSize: int("fileSize").notNull(), // 字节数
  fileKey: varchar("fileKey", { length: 500 }).notNull(), // S3存储键
  fileUrl: text("fileUrl").notNull(), // S3访问URL
  extractedText: text("extractedText"), // 提取的文本内容
  metadata: json("metadata"), // { pages, words, characters }
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * 分析任务表 - 存储分析任务信息
 */
export const analysisTasks = mysqlTable("analysisTasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  taskName: varchar("taskName", { length: 255 }).notNull(),
  documentIds: json("documentIds").notNull(), // [doc1Id, doc2Id, ...]
  analysisMode: mysqlEnum("analysisMode", ["traditional", "deepseek"]).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  overallSimilarity: float("overallSimilarity"), // 0-100
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type AnalysisTask = typeof analysisTasks.$inferSelect;
export type InsertAnalysisTask = typeof analysisTasks.$inferInsert;

/**
 * 分析结果表 - 存储详细的分析结果
 */
export const analysisResults = mysqlTable("analysisResults", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull().unique(),
  overallSimilarity: float("overallSimilarity").notNull(), // 0-100
  summary: text("summary"), // AI生成的分析摘要
  details: json("details"), // { semanticSimilarity, structuralSimilarity, styleSimilarity, ... }
  pairwiseResults: json("pairwiseResults"), // 两两对比的详细结果
  riskLevel: mysqlEnum("riskLevel", ["high", "medium", "low"]),
  riskDescription: text("riskDescription"),
  recommendations: json("recommendations"), // 改进建议数组
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalysisResult = typeof analysisResults.$inferSelect;
export type InsertAnalysisResult = typeof analysisResults.$inferInsert;

/**
 * 相似片段表 - 存储相似的文本片段
 */
export const similaritySegments = mysqlTable("similaritySegments", {
  id: int("id").autoincrement().primaryKey(),
  resultId: int("resultId").notNull(),
  doc1Id: int("doc1Id").notNull(),
  doc2Id: int("doc2Id").notNull(),
  doc1Segment: text("doc1Segment").notNull(), // 文档1的片段
  doc2Segment: text("doc2Segment").notNull(), // 文档2的片段
  similarity: float("similarity").notNull(), // 0-100
  reason: text("reason"), // 相似原因说明
  position: json("position"), // { doc1: { start, end }, doc2: { start, end } }
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SimilaritySegment = typeof similaritySegments.$inferSelect;
export type InsertSimilaritySegment = typeof similaritySegments.$inferInsert;

/**
 * 用户偏好设置表 - 存储用户的个性化设置
 */
export const userPreferences = mysqlTable("userPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  similarityThresholds: json("similarityThresholds").notNull(), // { high: 80, medium: 50, low: 20 }
  defaultAnalysisMode: mysqlEnum("defaultAnalysisMode", ["traditional", "deepseek"]).default("traditional").notNull(),
  autoSaveResults: int("autoSaveResults").default(1).notNull(), // boolean
  emailNotifications: int("emailNotifications").default(0).notNull(), // boolean
  language: varchar("language", { length: 10 }).default("zh-CN").notNull(),
  theme: mysqlEnum("theme", ["light", "dark", "auto"]).default("auto").notNull(),
  displayOptions: json("displayOptions"), // { showDetailedMetrics, showVisualization, defaultChartType }
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;
