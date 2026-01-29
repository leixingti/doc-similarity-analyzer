/**
 * 风险分析服务
 * 分析文档变化中的风险等级
 */

import { getDocumentTypeConfig, type KeywordConfig } from './documentTypes';

export interface RiskAnalysisResult {
  riskLevel: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  matchedKeyword: string;
}

export interface ChangeWithRisk {
  type: 'added' | 'deleted' | 'modified';
  lineNumber: number;
  oldContent?: string;
  newContent?: string;
  riskAnalysis?: RiskAnalysisResult;
}

/**
 * 分析单个变化的风险等级
 */
export function analyzeChangeRisk(
  change: { type: string; oldContent?: string; newContent?: string },
  documentType: string
): RiskAnalysisResult | undefined {
  const config = getDocumentTypeConfig(documentType);
  if (!config) return undefined;

  const content = change.newContent || change.oldContent || '';
  
  // 按风险等级排序，优先匹配高风险关键字
  const sortedKeywords = [...config.keywords].sort((a, b) => {
    const riskOrder = { high: 0, medium: 1, low: 2 };
    return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
  });

  for (const keyword of sortedKeywords) {
    const pattern = typeof keyword.pattern === 'string' 
      ? new RegExp(keyword.pattern, 'gi')
      : keyword.pattern;
    
    const match = content.match(pattern);
    if (match && match.length > 0) {
      return {
        riskLevel: keyword.riskLevel,
        category: keyword.category,
        description: keyword.description,
        matchedKeyword: match[0]
      };
    }
  }

  return undefined;
}

/**
 * 批量分析变化的风险等级
 */
export function analyzeChangesRisk(
  changes: Array<{ type: string; lineNumber: number; oldContent?: string; newContent?: string }>,
  documentType: string
): ChangeWithRisk[] {
  return changes.map(change => {
    const riskAnalysis = analyzeChangeRisk(change, documentType);
    return {
      ...change,
      type: change.type as 'added' | 'deleted' | 'modified',
      riskAnalysis
    };
  });
}

/**
 * 生成风险统计
 */
export function generateRiskStatistics(changesWithRisk: ChangeWithRisk[]) {
  const stats = {
    totalChanges: changesWithRisk.length,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    noRisk: 0,
    riskCategories: new Map<string, number>()
  };

  for (const change of changesWithRisk) {
    if (!change.riskAnalysis) {
      stats.noRisk++;
      continue;
    }

    switch (change.riskAnalysis.riskLevel) {
      case 'high':
        stats.highRisk++;
        break;
      case 'medium':
        stats.mediumRisk++;
        break;
      case 'low':
        stats.lowRisk++;
        break;
    }

    // 统计风险类别
    const category = change.riskAnalysis.category;
    stats.riskCategories.set(category, (stats.riskCategories.get(category) || 0) + 1);
  }

  return {
    ...stats,
    riskCategories: Array.from(stats.riskCategories.entries()).map(([category, count]) => ({
      category,
      count
    }))
  };
}

/**
 * 生成风险摘要文本
 */
export function generateRiskSummary(changesWithRisk: ChangeWithRisk[]): string {
  const stats = generateRiskStatistics(changesWithRisk);
  
  let summary = `本次文档修订共涉及 ${stats.totalChanges} 处变化`;
  
  if (stats.highRisk > 0) {
    summary += `，其中包含 ${stats.highRisk} 处高风险变化`;
  }
  
  if (stats.mediumRisk > 0) {
    summary += `，${stats.mediumRisk} 处中风险变化`;
  }
  
  if (stats.lowRisk > 0) {
    summary += `，${stats.lowRisk} 处低风险变化`;
  }
  
  summary += '。';
  
  // 列出主要风险类别
  if (stats.riskCategories.length > 0) {
    const topCategories = stats.riskCategories
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(c => `${c.category}(${c.count}处)`)
      .join('、');
    summary += `主要变化涉及：${topCategories}。`;
  }
  
  // 高风险提示
  if (stats.highRisk > 0) {
    summary += '\n\n⚠️ 请特别注意高风险变化，建议仔细审查相关条款。';
  }
  
  return summary;
}

/**
 * 提取高风险变化列表
 */
export function extractHighRiskChanges(changesWithRisk: ChangeWithRisk[]): ChangeWithRisk[] {
  return changesWithRisk.filter(change => 
    change.riskAnalysis && change.riskAnalysis.riskLevel === 'high'
  );
}
