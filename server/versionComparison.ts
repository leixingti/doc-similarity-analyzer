import * as Diff from 'diff';
import { analyzeChangesRisk, generateRiskStatistics, generateRiskSummary, type ChangeWithRisk } from './riskAnalyzer';
import { getAllDocumentTypes } from './documentTypes';
import { generateChangeSummary } from './changeSummaryGenerator';
import { detectAllSubtleChanges, generateSubtleChangeReport, type SubtleChange } from './subtleChangeDetector';

export interface VersionComparisonResult {
  version1: {
    documentId: number;
    filename: string;
    content: string;
  };
  version2: {
    documentId: number;
    filename: string;
    content: string;
  };
  statistics: {
    totalLines: number;
    addedLines: number;
    deletedLines: number;
    modifiedLines: number;
    unchangedLines: number;
    modificationRate: number; // 修改率百分比
  };
  changes: Array<{
    type: 'added' | 'deleted' | 'modified' | 'unchanged';
    lineNumber: number;
    oldContent?: string;
    newContent?: string;
    context?: string;
    riskAnalysis?: {
      riskLevel: 'high' | 'medium' | 'low';
      category: string;
      description: string;
      matchedKeyword: string;
    };
  }>;
  changeLevel: 'minimal' | 'light' | 'moderate' | 'significant'; // 变化程度
  documentType?: string; // 文档类型
  riskStatistics?: {
    totalChanges: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    noRisk: number;
    riskCategories: Array<{ category: string; count: number }>;
  };
  riskSummary?: string; // 风险摘要
  aiSummary?: string; // AI生成的变化摘要
  subtleChanges?: SubtleChange[]; // 细微变化列表
  subtleChangeReport?: string; // 细微变化报告
}

/**
 * 对比两个文档版本
 */
export async function compareDocumentVersions(
  doc1Content: string,
  doc2Content: string,
  doc1Info: { id: number; filename: string },
  doc2Info: { id: number; filename: string },
  documentType: string = 'other'
): Promise<VersionComparisonResult> {
  // 按行分割文本
  const lines1 = doc1Content.split('\n');
  const lines2 = doc2Content.split('\n');

  // 使用diff库计算差异
  const diffResult = Diff.diffLines(doc1Content, doc2Content);

  // 统计变化
  let addedLines = 0;
  let deletedLines = 0;
  let unchangedLines = 0;
  const changes: VersionComparisonResult['changes'] = [];
  let currentLineNumber = 0;

  diffResult.forEach((part) => {
    const lines = part.value.split('\n').filter(line => line.length > 0 || part.value.endsWith('\n'));
    
    if (part.added) {
      addedLines += lines.length;
      lines.forEach((line, index) => {
        changes.push({
          type: 'added',
          lineNumber: currentLineNumber + index + 1,
          newContent: line,
        });
      });
      currentLineNumber += lines.length;
    } else if (part.removed) {
      deletedLines += lines.length;
      lines.forEach((line, index) => {
        changes.push({
          type: 'deleted',
          lineNumber: currentLineNumber + index + 1,
          oldContent: line,
        });
      });
    } else {
      unchangedLines += lines.length;
      currentLineNumber += lines.length;
    }
  });

  // 计算修改的行数（同时有删除和添加的视为修改）
  const modifiedLines = Math.min(addedLines, deletedLines);
  const pureAddedLines = addedLines - modifiedLines;
  const pureDeletedLines = deletedLines - modifiedLines;

  const totalLines = Math.max(lines1.length, lines2.length);
  const changedLines = pureAddedLines + pureDeletedLines + modifiedLines;
  const modificationRate = totalLines > 0 ? (changedLines / totalLines) * 100 : 0;

  // 确定变化程度
  let changeLevel: VersionComparisonResult['changeLevel'];
  if (modificationRate < 5) {
    changeLevel = 'minimal'; // 微小变化
  } else if (modificationRate < 20) {
    changeLevel = 'light'; // 轻度变化
  } else if (modificationRate < 50) {
    changeLevel = 'moderate'; // 中度变化
  } else {
    changeLevel = 'significant'; // 重大变化
  }

  // 进行风险分析
  const changesWithRisk = analyzeChangesRisk(changes, documentType);
  const riskStatistics = generateRiskStatistics(changesWithRisk);
  const riskSummary = generateRiskSummary(changesWithRisk);
  
  // 生成AI变化摘要（异步，不阻塞主流程）
  let aiSummary: string | undefined;
  try {
    aiSummary = await generateChangeSummary(
      changesWithRisk,
      documentType,
      doc1Info.filename,
      doc2Info.filename
    );
  } catch (error) {
    console.error('Failed to generate AI summary:', error);
  }

  // 检测细微变化
  const subtleChanges = detectAllSubtleChanges(doc1Content, doc2Content);
  const subtleChangeReport = generateSubtleChangeReport(subtleChanges);

  return {
    version1: {
      documentId: doc1Info.id,
      filename: doc1Info.filename,
      content: doc1Content,
    },
    version2: {
      documentId: doc2Info.id,
      filename: doc2Info.filename,
      content: doc2Content,
    },
    statistics: {
      totalLines,
      addedLines: pureAddedLines,
      deletedLines: pureDeletedLines,
      modifiedLines,
      unchangedLines,
      modificationRate: Math.round(modificationRate * 100) / 100,
    },
    changes: changesWithRisk,
    changeLevel,
    documentType,
    riskStatistics,
    riskSummary,
    aiSummary,
    subtleChanges,
    subtleChangeReport,
  };
}

/**
 * 批量对比多个版本
 */
export async function compareMultipleVersions(
  versions: Array<{ id: number; filename: string; content: string }>
): Promise<Array<{ from: number; to: number; result: VersionComparisonResult }>> {
  const results: Array<{ from: number; to: number; result: VersionComparisonResult }> = [];

  for (let i = 0; i < versions.length - 1; i++) {
    const result = await compareDocumentVersions(
      versions[i].content,
      versions[i + 1].content,
      { id: versions[i].id, filename: versions[i].filename },
      { id: versions[i + 1].id, filename: versions[i + 1].filename }
    );
    results.push({
      from: versions[i].id,
      to: versions[i + 1].id,
      result,
    });
  }

  return results;
}
