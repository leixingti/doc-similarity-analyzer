import { db } from "./db";
import { cases, managedDocuments, documentTags, documentVersions } from "./documentManagementSchema";
import { eq, and, like, or, desc, asc, inArray } from "drizzle-orm";
import type { InsertCase, InsertManagedDocument, InsertDocumentTag, InsertDocumentVersion } from "./documentManagementSchema";

// ==================== 案件管理 ====================

// 创建案件
export async function createCase(caseData: InsertCase) {
  const [newCase] = await db.insert(cases).values(caseData);
  return newCase;
}

// 获取用户的所有案件
export async function getUserCases(userId: number, filters?: {
  caseType?: string;
  caseStatus?: string;
  search?: string;
}) {
  let query = db.select().from(cases).where(eq(cases.userId, userId));

  if (filters?.caseType) {
    query = query.where(eq(cases.caseType, filters.caseType));
  }

  if (filters?.caseStatus) {
    query = query.where(eq(cases.caseStatus, filters.caseStatus));
  }

  if (filters?.search) {
    query = query.where(
      or(
        like(cases.caseName, `%${filters.search}%`),
        like(cases.caseNumber, `%${filters.search}%`),
        like(cases.plaintiff, `%${filters.search}%`),
        like(cases.defendant, `%${filters.search}%`)
      )
    );
  }

  return query.orderBy(desc(cases.createdAt));
}

// 获取案件详情
export async function getCaseById(caseId: number, userId: number) {
  const [caseData] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, caseId), eq(cases.userId, userId)));
  
  return caseData;
}

// 更新案件
export async function updateCase(caseId: number, userId: number, updates: Partial<InsertCase>) {
  await db
    .update(cases)
    .set(updates)
    .where(and(eq(cases.id, caseId), eq(cases.userId, userId)));
  
  return getCaseById(caseId, userId);
}

// 删除案件
export async function deleteCase(caseId: number, userId: number) {
  // 先删除关联的文档
  await db
    .delete(managedDocuments)
    .where(and(eq(managedDocuments.caseId, caseId), eq(managedDocuments.userId, userId)));
  
  // 再删除案件
  await db
    .delete(cases)
    .where(and(eq(cases.id, caseId), eq(cases.userId, userId)));
}

// 获取案件统计
export async function getCaseStatistics(userId: number) {
  const allCases = await db.select().from(cases).where(eq(cases.userId, userId));
  
  const statistics = {
    total: allCases.length,
    byType: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
  };

  allCases.forEach(c => {
    statistics.byType[c.caseType] = (statistics.byType[c.caseType] || 0) + 1;
    statistics.byStatus[c.caseStatus] = (statistics.byStatus[c.caseStatus] || 0) + 1;
  });

  return statistics;
}

// ==================== 文档管理 ====================

// 创建文档
export async function createDocument(documentData: InsertManagedDocument) {
  const [newDocument] = await db.insert(managedDocuments).values(documentData);
  
  // 创建版本记录
  await createDocumentVersion({
    documentId: newDocument.insertId,
    version: 1,
    fileName: documentData.fileName,
    filePath: documentData.filePath,
    fileSize: documentData.fileSize,
    changeDescription: "初始版本",
    changedBy: documentData.userId,
  });
  
  return newDocument;
}

// 获取用户的所有文档
export async function getUserDocuments(userId: number, filters?: {
  caseId?: number;
  documentType?: string;
  category?: string;
  tags?: string[];
  search?: string;
  onlyLatest?: boolean;
}) {
  let conditions = [eq(managedDocuments.userId, userId)];

  if (filters?.caseId) {
    conditions.push(eq(managedDocuments.caseId, filters.caseId));
  }

  if (filters?.documentType) {
    conditions.push(eq(managedDocuments.documentType, filters.documentType));
  }

  if (filters?.category) {
    conditions.push(eq(managedDocuments.category, filters.category));
  }

  if (filters?.onlyLatest !== false) {
    conditions.push(eq(managedDocuments.isLatest, true));
  }

  if (filters?.search) {
    conditions.push(
      or(
        like(managedDocuments.fileName, `%${filters.search}%`),
        like(managedDocuments.content, `%${filters.search}%`),
        like(managedDocuments.description, `%${filters.search}%`)
      )
    );
  }

  return db
    .select()
    .from(managedDocuments)
    .where(and(...conditions))
    .orderBy(desc(managedDocuments.updatedAt));
}

// 获取文档详情
export async function getDocumentById(documentId: number, userId: number) {
  const [document] = await db
    .select()
    .from(managedDocuments)
    .where(and(eq(managedDocuments.id, documentId), eq(managedDocuments.userId, userId)));
  
  return document;
}

// 更新文档
export async function updateDocument(documentId: number, userId: number, updates: Partial<InsertManagedDocument>) {
  await db
    .update(managedDocuments)
    .set(updates)
    .where(and(eq(managedDocuments.id, documentId), eq(managedDocuments.userId, userId)));
  
  return getDocumentById(documentId, userId);
}

// 删除文档
export async function deleteDocument(documentId: number, userId: number) {
  // 删除版本历史
  await db
    .delete(documentVersions)
    .where(eq(documentVersions.documentId, documentId));
  
  // 删除文档
  await db
    .delete(managedDocuments)
    .where(and(eq(managedDocuments.id, documentId), eq(managedDocuments.userId, userId)));
}

// 获取文档统计
export async function getDocumentStatistics(userId: number, caseId?: number) {
  let conditions = [eq(managedDocuments.userId, userId)];
  
  if (caseId) {
    conditions.push(eq(managedDocuments.caseId, caseId));
  }

  const allDocuments = await db
    .select()
    .from(managedDocuments)
    .where(and(...conditions));
  
  const statistics = {
    total: allDocuments.length,
    byType: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
    totalSize: 0,
  };

  allDocuments.forEach(doc => {
    if (doc.documentType) {
      statistics.byType[doc.documentType] = (statistics.byType[doc.documentType] || 0) + 1;
    }
    if (doc.category) {
      statistics.byCategory[doc.category] = (statistics.byCategory[doc.category] || 0) + 1;
    }
    statistics.totalSize += doc.fileSize;
  });

  return statistics;
}

// ==================== 标签管理 ====================

// 创建标签
export async function createTag(tagData: InsertDocumentTag) {
  const [newTag] = await db.insert(documentTags).values(tagData);
  return newTag;
}

// 获取用户的所有标签
export async function getUserTags(userId: number) {
  return db
    .select()
    .from(documentTags)
    .where(eq(documentTags.userId, userId))
    .orderBy(asc(documentTags.name));
}

// 删除标签
export async function deleteTag(tagId: number, userId: number) {
  await db
    .delete(documentTags)
    .where(and(eq(documentTags.id, tagId), eq(documentTags.userId, userId)));
}

// ==================== 版本管理 ====================

// 创建文档版本
export async function createDocumentVersion(versionData: InsertDocumentVersion) {
  const [newVersion] = await db.insert(documentVersions).values(versionData);
  return newVersion;
}

// 获取文档的所有版本
export async function getDocumentVersions(documentId: number) {
  return db
    .select()
    .from(documentVersions)
    .where(eq(documentVersions.documentId, documentId))
    .orderBy(desc(documentVersions.version));
}

// 创建新版本（上传新文件）
export async function createNewDocumentVersion(
  documentId: number,
  userId: number,
  newFilePath: string,
  newFileSize: number,
  changeDescription: string
) {
  const document = await getDocumentById(documentId, userId);
  if (!document) {
    throw new Error("Document not found");
  }

  const newVersion = document.version + 1;

  // 更新文档为新版本
  await db
    .update(managedDocuments)
    .set({
      filePath: newFilePath,
      fileSize: newFileSize,
      version: newVersion,
      updatedAt: new Date(),
    })
    .where(eq(managedDocuments.id, documentId));

  // 创建版本记录
  await createDocumentVersion({
    documentId,
    version: newVersion,
    fileName: document.fileName,
    filePath: newFilePath,
    fileSize: newFileSize,
    changeDescription,
    changedBy: userId,
  });

  return getDocumentById(documentId, userId);
}

// ==================== 分类管理 ====================

// 获取所有文档类型
export async function getDocumentTypes(userId: number) {
  const documents = await db
    .select({ documentType: managedDocuments.documentType })
    .from(managedDocuments)
    .where(and(
      eq(managedDocuments.userId, userId),
      eq(managedDocuments.isLatest, true)
    ))
    .groupBy(managedDocuments.documentType);

  return documents
    .map(d => d.documentType)
    .filter(Boolean) as string[];
}

// 获取所有分类
export async function getCategories(userId: number) {
  const documents = await db
    .select({ category: managedDocuments.category })
    .from(managedDocuments)
    .where(and(
      eq(managedDocuments.userId, userId),
      eq(managedDocuments.isLatest, true)
    ))
    .groupBy(managedDocuments.category);

  return documents
    .map(d => d.category)
    .filter(Boolean) as string[];
}

// 自动分类文档（基于文件名和内容）
export function autoClassifyDocument(fileName: string, content?: string): {
  documentType?: string;
  category?: string;
} {
  const lowerFileName = fileName.toLowerCase();
  const lowerContent = content?.toLowerCase() || "";

  let documentType: string | undefined;
  let category: string | undefined;

  // 根据文件名判断文档类型
  if (lowerFileName.includes("起诉状") || lowerContent.includes("起诉状")) {
    documentType = "起诉状";
    category = "诉讼文书";
  } else if (lowerFileName.includes("答辩状") || lowerContent.includes("答辩状")) {
    documentType = "答辩状";
    category = "诉讼文书";
  } else if (lowerFileName.includes("合同") || lowerContent.includes("合同")) {
    documentType = "合同";
    category = "合同文件";
  } else if (lowerFileName.includes("证据") || lowerContent.includes("证据")) {
    documentType = "证据材料";
    category = "证据文件";
  } else if (lowerFileName.includes("律师函") || lowerContent.includes("律师函")) {
    documentType = "律师函";
    category = "往来函件";
  } else if (lowerFileName.includes("代理词") || lowerContent.includes("代理词")) {
    documentType = "代理词";
    category = "诉讼文书";
  } else if (lowerFileName.includes("法律意见") || lowerContent.includes("法律意见")) {
    documentType = "法律意见书";
    category = "法律文书";
  }

  return { documentType, category };
}
