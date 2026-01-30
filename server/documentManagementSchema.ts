import { mysqlTable, varchar, text, timestamp, int, boolean, index } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// 案件表
export const cases = mysqlTable("cases", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  caseNumber: varchar("case_number", { length: 100 }).notNull(), // 案号
  caseName: varchar("case_name", { length: 255 }).notNull(), // 案件名称
  caseType: varchar("case_type", { length: 50 }).notNull(), // 案件类型：民事、刑事、行政等
  caseStatus: varchar("case_status", { length: 50 }).notNull().default("进行中"), // 案件状态
  court: varchar("court", { length: 255 }), // 法院
  judge: varchar("judge", { length: 100 }), // 法官
  plaintiff: text("plaintiff"), // 原告/申请人
  defendant: text("defendant"), // 被告/被申请人
  caseAmount: varchar("case_amount", { length: 100 }), // 案件标的额
  filingDate: timestamp("filing_date"), // 立案日期
  trialDate: timestamp("trial_date"), // 开庭日期
  closingDate: timestamp("closing_date"), // 结案日期
  description: text("description"), // 案件描述
  notes: text("notes"), // 备注
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  caseNumberIdx: index("case_number_idx").on(table.caseNumber),
  caseTypeIdx: index("case_type_idx").on(table.caseType),
}));

// 文档表
export const managedDocuments = mysqlTable("managed_documents", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  caseId: int("case_id"), // 关联案件ID（可选）
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(), // 文件类型：docx, pdf, txt等
  fileSize: int("file_size").notNull(), // 文件大小（字节）
  filePath: varchar("file_path", { length: 500 }).notNull(), // 文件存储路径
  documentType: varchar("document_type", { length: 100 }), // 文档类型：合同、起诉状、证据等
  category: varchar("category", { length: 100 }), // 分类
  tags: text("tags"), // 标签（JSON数组）
  content: text("content"), // 文档内容（用于全文检索）
  version: int("version").notNull().default(1), // 版本号
  parentId: int("parent_id"), // 父文档ID（用于版本控制）
  isLatest: boolean("is_latest").notNull().default(true), // 是否最新版本
  description: text("description"), // 文档描述
  notes: text("notes"), // 备注
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  caseIdIdx: index("case_id_idx").on(table.caseId),
  documentTypeIdx: index("document_type_idx").on(table.documentType),
  categoryIdx: index("category_idx").on(table.category),
  parentIdIdx: index("parent_id_idx").on(table.parentId),
  isLatestIdx: index("is_latest_idx").on(table.isLatest),
}));

// 标签表
export const documentTags = mysqlTable("document_tags", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 20 }), // 标签颜色
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  nameIdx: index("name_idx").on(table.name),
}));

// 文档版本历史表
export const documentVersions = mysqlTable("document_versions", {
  id: int("id").primaryKey().autoincrement(),
  documentId: int("document_id").notNull(), // 文档ID
  version: int("version").notNull(), // 版本号
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: int("file_size").notNull(),
  changeDescription: text("change_description"), // 变更说明
  changedBy: int("changed_by").notNull(), // 修改人
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  documentIdIdx: index("document_id_idx").on(table.documentId),
  versionIdx: index("version_idx").on(table.version),
}));

// Zod schemas
export const insertCaseSchema = createInsertSchema(cases);
export const selectCaseSchema = createSelectSchema(cases);
export const insertManagedDocumentSchema = createInsertSchema(managedDocuments);
export const selectManagedDocumentSchema = createSelectSchema(managedDocuments);
export const insertDocumentTagSchema = createInsertSchema(documentTags);
export const selectDocumentTagSchema = createSelectSchema(documentTags);
export const insertDocumentVersionSchema = createInsertSchema(documentVersions);
export const selectDocumentVersionSchema = createSelectSchema(documentVersions);

export type Case = z.infer<typeof selectCaseSchema>;
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type ManagedDocument = z.infer<typeof selectManagedDocumentSchema>;
export type InsertManagedDocument = z.infer<typeof insertManagedDocumentSchema>;
export type DocumentTag = z.infer<typeof selectDocumentTagSchema>;
export type InsertDocumentTag = z.infer<typeof insertDocumentTagSchema>;
export type DocumentVersion = z.infer<typeof selectDocumentVersionSchema>;
export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;
