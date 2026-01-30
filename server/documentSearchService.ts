import { db } from "./db";
import { managedDocuments, cases } from "./documentManagementSchema";
import { eq, and, like, or, desc, sql, inArray } from "drizzle-orm";

// 全文检索接口
export interface SearchOptions {
  userId: number;
  query: string;
  filters?: {
    caseId?: number;
    documentType?: string;
    category?: string;
    tags?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    fileType?: string;
  };
  sortBy?: "relevance" | "date" | "size" | "name";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

// 搜索结果接口
export interface SearchResult {
  document: any;
  relevanceScore: number;
  highlights: string[];
  caseInfo?: any;
}

// 全文检索
export async function searchDocuments(options: SearchOptions): Promise<{
  results: SearchResult[];
  total: number;
  facets: {
    documentTypes: Record<string, number>;
    categories: Record<string, number>;
    fileTypes: Record<string, number>;
  };
}> {
  const { userId, query, filters, sortBy = "relevance", sortOrder = "desc", limit = 20, offset = 0 } = options;

  // 构建基础查询条件
  let conditions = [eq(managedDocuments.userId, userId), eq(managedDocuments.isLatest, true)];

  // 应用过滤器
  if (filters?.caseId) {
    conditions.push(eq(managedDocuments.caseId, filters.caseId));
  }

  if (filters?.documentType) {
    conditions.push(eq(managedDocuments.documentType, filters.documentType));
  }

  if (filters?.category) {
    conditions.push(eq(managedDocuments.category, filters.category));
  }

  if (filters?.fileType) {
    conditions.push(eq(managedDocuments.fileType, filters.fileType));
  }

  if (filters?.dateFrom) {
    conditions.push(sql`${managedDocuments.createdAt} >= ${filters.dateFrom}`);
  }

  if (filters?.dateTo) {
    conditions.push(sql`${managedDocuments.createdAt} <= ${filters.dateTo}`);
  }

  // 全文搜索条件
  const searchCondition = or(
    like(managedDocuments.fileName, `%${query}%`),
    like(managedDocuments.content, `%${query}%`),
    like(managedDocuments.description, `%${query}%`),
    like(managedDocuments.notes, `%${query}%`)
  );

  conditions.push(searchCondition);

  // 执行查询
  const documents = await db
    .select()
    .from(managedDocuments)
    .where(and(...conditions))
    .orderBy(
      sortBy === "date" ? (sortOrder === "asc" ? managedDocuments.createdAt : desc(managedDocuments.createdAt)) :
      sortBy === "size" ? (sortOrder === "asc" ? managedDocuments.fileSize : desc(managedDocuments.fileSize)) :
      sortBy === "name" ? (sortOrder === "asc" ? managedDocuments.fileName : desc(managedDocuments.fileName)) :
      desc(managedDocuments.updatedAt)
    )
    .limit(limit)
    .offset(offset);

  // 获取案件信息
  const caseIds = documents.map(d => d.caseId).filter(Boolean) as number[];
  const caseInfoMap = new Map();
  
  if (caseIds.length > 0) {
    const caseInfos = await db
      .select()
      .from(cases)
      .where(inArray(cases.id, caseIds));
    
    caseInfos.forEach(c => caseInfoMap.set(c.id, c));
  }

  // 计算相关性得分和高亮
  const results: SearchResult[] = documents.map(doc => {
    const relevanceScore = calculateRelevanceScore(doc, query);
    const highlights = extractHighlights(doc, query);
    const caseInfo = doc.caseId ? caseInfoMap.get(doc.caseId) : undefined;

    return {
      document: doc,
      relevanceScore,
      highlights,
      caseInfo,
    };
  });

  // 按相关性排序（如果需要）
  if (sortBy === "relevance") {
    results.sort((a, b) => sortOrder === "asc" ? a.relevanceScore - b.relevanceScore : b.relevanceScore - a.relevanceScore);
  }

  // 获取总数
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(managedDocuments)
    .where(and(...conditions));

  // 计算facets（分面统计）
  const allDocuments = await db
    .select()
    .from(managedDocuments)
    .where(and(...conditions));

  const facets = {
    documentTypes: {} as Record<string, number>,
    categories: {} as Record<string, number>,
    fileTypes: {} as Record<string, number>,
  };

  allDocuments.forEach(doc => {
    if (doc.documentType) {
      facets.documentTypes[doc.documentType] = (facets.documentTypes[doc.documentType] || 0) + 1;
    }
    if (doc.category) {
      facets.categories[doc.category] = (facets.categories[doc.category] || 0) + 1;
    }
    if (doc.fileType) {
      facets.fileTypes[doc.fileType] = (facets.fileTypes[doc.fileType] || 0) + 1;
    }
  });

  return {
    results,
    total: count,
    facets,
  };
}

// 计算相关性得分
function calculateRelevanceScore(document: any, query: string): number {
  let score = 0;
  const lowerQuery = query.toLowerCase();

  // 文件名匹配（权重最高）
  if (document.fileName?.toLowerCase().includes(lowerQuery)) {
    score += 10;
  }

  // 描述匹配
  if (document.description?.toLowerCase().includes(lowerQuery)) {
    score += 5;
  }

  // 内容匹配
  if (document.content?.toLowerCase().includes(lowerQuery)) {
    const occurrences = (document.content.toLowerCase().match(new RegExp(lowerQuery, 'g')) || []).length;
    score += Math.min(occurrences, 10); // 最多加10分
  }

  // 备注匹配
  if (document.notes?.toLowerCase().includes(lowerQuery)) {
    score += 3;
  }

  return score;
}

// 提取高亮片段
function extractHighlights(document: any, query: string, maxHighlights: number = 3): string[] {
  const highlights: string[] = [];
  const lowerQuery = query.toLowerCase();

  // 从文件名提取
  if (document.fileName?.toLowerCase().includes(lowerQuery)) {
    highlights.push(`文件名: ${highlightText(document.fileName, query)}`);
  }

  // 从描述提取
  if (document.description?.toLowerCase().includes(lowerQuery)) {
    highlights.push(`描述: ${highlightText(document.description, query, 100)}`);
  }

  // 从内容提取
  if (document.content?.toLowerCase().includes(lowerQuery)) {
    const contentHighlight = extractContentHighlight(document.content, query);
    if (contentHighlight) {
      highlights.push(`内容: ${contentHighlight}`);
    }
  }

  return highlights.slice(0, maxHighlights);
}

// 高亮文本
function highlightText(text: string, query: string, maxLength: number = 200): string {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return text;

  const start = Math.max(0, index - 50);
  const end = Math.min(text.length, index + query.length + 50);
  
  let snippet = text.substring(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";

  // 用<mark>标签包裹匹配的文本
  const regex = new RegExp(`(${query})`, 'gi');
  snippet = snippet.replace(regex, '<mark>$1</mark>');

  return snippet;
}

// 从内容中提取高亮片段
function extractContentHighlight(content: string, query: string): string | null {
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerContent.indexOf(lowerQuery);

  if (index === -1) return null;

  const start = Math.max(0, index - 100);
  const end = Math.min(content.length, index + query.length + 100);
  
  let snippet = content.substring(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";

  const regex = new RegExp(`(${query})`, 'gi');
  snippet = snippet.replace(regex, '<mark>$1</mark>');

  return snippet;
}

// 高级搜索（支持多个关键词、布尔运算）
export async function advancedSearch(options: {
  userId: number;
  keywords: string[];
  operator: "AND" | "OR";
  filters?: SearchOptions["filters"];
  sortBy?: SearchOptions["sortBy"];
  sortOrder?: SearchOptions["sortOrder"];
  limit?: number;
  offset?: number;
}): Promise<{
  results: SearchResult[];
  total: number;
}> {
  const { userId, keywords, operator, filters, sortBy, sortOrder, limit, offset } = options;

  if (operator === "AND") {
    // AND运算：所有关键词都必须匹配
    let conditions = [eq(managedDocuments.userId, userId), eq(managedDocuments.isLatest, true)];

    keywords.forEach(keyword => {
      conditions.push(
        or(
          like(managedDocuments.fileName, `%${keyword}%`),
          like(managedDocuments.content, `%${keyword}%`),
          like(managedDocuments.description, `%${keyword}%`)
        )
      );
    });

    // 应用过滤器
    if (filters?.caseId) conditions.push(eq(managedDocuments.caseId, filters.caseId));
    if (filters?.documentType) conditions.push(eq(managedDocuments.documentType, filters.documentType));
    if (filters?.category) conditions.push(eq(managedDocuments.category, filters.category));

    const documents = await db
      .select()
      .from(managedDocuments)
      .where(and(...conditions))
      .limit(limit || 20)
      .offset(offset || 0);

    const results: SearchResult[] = documents.map(doc => ({
      document: doc,
      relevanceScore: keywords.reduce((score, kw) => score + calculateRelevanceScore(doc, kw), 0),
      highlights: keywords.flatMap(kw => extractHighlights(doc, kw, 1)),
    }));

    return {
      results,
      total: documents.length,
    };
  } else {
    // OR运算：任意关键词匹配即可
    const query = keywords.join(" ");
    return searchDocuments({
      userId,
      query,
      filters,
      sortBy,
      sortOrder,
      limit,
      offset,
    });
  }
}

// 相关文档推荐
export async function getRelatedDocuments(documentId: number, userId: number, limit: number = 5): Promise<any[]> {
  const document = await db
    .select()
    .from(managedDocuments)
    .where(and(eq(managedDocuments.id, documentId), eq(managedDocuments.userId, userId)))
    .limit(1);

  if (document.length === 0) return [];

  const doc = document[0];

  // 基于案件ID、文档类型、分类查找相关文档
  const conditions = [
    eq(managedDocuments.userId, userId),
    eq(managedDocuments.isLatest, true),
    sql`${managedDocuments.id} != ${documentId}`,
  ];

  if (doc.caseId) {
    conditions.push(eq(managedDocuments.caseId, doc.caseId));
  } else if (doc.documentType) {
    conditions.push(eq(managedDocuments.documentType, doc.documentType));
  } else if (doc.category) {
    conditions.push(eq(managedDocuments.category, doc.category));
  }

  return db
    .select()
    .from(managedDocuments)
    .where(and(...conditions))
    .limit(limit);
}
