import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float, json, boolean } from "drizzle-orm/mysql-core";

/**
 * 用户表 - 核心认证表
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(), // 允许为null，支持邮箱注册
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(), // 邮箱必须唯一
  password: varchar("password", { length: 255 }), // 密码哈希
  emailVerified: boolean("emailVerified").default(false), // 邮箱是否已验证
  mustChangePassword: boolean("mustChangePassword").default(false), // 是否必须修改密码
  loginMethod: varchar("loginMethod", { length: 64 }), // oauth 或 email
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 邮箱验证码表 - 存储邮箱验证码
 */
export const emailVerifications = mysqlTable("emailVerifications", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(), // 6位验证码
  expiresAt: timestamp("expiresAt").notNull(), // 过期时间
  verified: boolean("verified").default(false), // 是否已验证
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailVerification = typeof emailVerifications.$inferSelect;
export type InsertEmailVerification = typeof emailVerifications.$inferInsert;

/**
 * 密码重置令牌表 - 存储密码重置令牌
 */
export const passwordResetTokens = mysqlTable("passwordResetTokens", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(), // 重置令牌
  expiresAt: timestamp("expiresAt").notNull(), // 过期时间（30分钟）
  used: boolean("used").default(false), // 是否已使用
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

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
  progress: float("progress").default(0), // 0-100
  overallSimilarity: float("overallSimilarity"), // 整体相似度 0-100
  similarity: float("similarity"), // 整体相似度 0-100 (备用)
  errorMessage: text("errorMessage"), // 错误信息
  summary: text("summary"), // AI生成的分析摘要
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
  overallSimilarity: float("overallSimilarity").notNull(), // 整体相似度 0-100
  summary: text("summary"), // 分析摘要
  details: json("details"), // 详细对比数据
  pairwiseResults: json("pairwiseResults"), // 文档对的对比结果
  riskLevel: mysqlEnum("riskLevel", ["high", "medium", "low"]), // 风险等级
  riskDescription: text("riskDescription"), // 风险描述
  recommendations: json("recommendations"), // 建议
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
  doc1Id: int("doc1Id").notNull(), // 文档1的ID
  doc2Id: int("doc2Id").notNull(), // 文档2的ID
  doc1Segment: text("doc1Segment").notNull(), // 文档1的片段
  doc2Segment: text("doc2Segment").notNull(), // 文档2的片段
  similarity: float("similarity").notNull(), // 片段相似度 0-100
  reason: text("reason"), // AI分析的相似原因
  position: json("position"), // 片段位置信息
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SimilaritySegment = typeof similaritySegments.$inferSelect;
export type InsertSimilaritySegment = typeof similaritySegments.$inferInsert;
