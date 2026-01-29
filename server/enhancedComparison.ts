/**
 * 增强版文档对比服务
 * 场景4：多版本合同/文书的差异比对（增强）
 * 
 * 新增功能：
 * 1. 长文档智能分段
 * 2. 条款级对比
 * 3. 条款冲突检测
 * 4. 修改历史追踪
 * 5. 关键条款变化预警
 */

import * as Diff from 'diff';
import type { VersionComparisonResult } from './versionComparison';

export interface ClauseSegment {
  id: string;
  title: string;
  content: string;
  startLine: number;
  endLine: number;
  level: number; // 条款层级：1=一级条款，2=二级条款，以此类推
}

export interface ClauseComparison {
  clause1?: ClauseSegment;
  clause2?: ClauseSegment;
  changeType: 'added' | 'deleted' | 'modified' | 'unchanged';
  changes: Array<{
    type: 'added' | 'deleted' | 'modified';
    oldContent?: string;
    newContent?: string;
  }>;
  similarity: number; // 相似度 0-100
}

export interface ClauseConflict {
  type: '逻辑冲突' | '内容矛盾' | '时间冲突' | '金额冲突' | '权利义务冲突';
  severity: 'critical' | 'warning' | 'info';
  clause1: {
    title: string;
    content: string;
    lineNumber: number;
  };
  clause2: {
    title: string;
    content: string;
    lineNumber: number;
  };
  description: string;
  suggestion: string;
}

export interface KeyClauseAlert {
  clauseTitle: string;
  changeType: 'added' | 'deleted' | 'modified';
  category: '金额' | '日期' | '违约责任' | '权利义务' | '争议解决' | '其他';
  oldValue?: string;
  newValue?: string;
  riskLevel: 'high' | 'medium' | 'low';
  description: string;
}

export interface EnhancedComparisonResult extends VersionComparisonResult {
  // 条款级对比
  clauseComparisons: ClauseComparison[];
  // 条款冲突
  clauseConflicts: ClauseConflict[];
  // 关键条款变化预警
  keyClauseAlerts: KeyClauseAlert[];
  // 分段信息
  segments: {
    version1: ClauseSegment[];
    version2: ClauseSegment[];
  };
}

/**
 * 智能分段：将文档按条款分段
 */
export function segmentDocument(content: string): ClauseSegment[] {
  const lines = content.split('\n');
  const segments: ClauseSegment[] = [];
  
  // 常见的条款标题模式
  const clausePatterns = [
    /^第[一二三四五六七八九十百千万\d]+条\s+(.+)$/,  // 第一条 标题
    /^[一二三四五六七八九十]、\s*(.+)$/,  // 一、标题
    /^\d+\.\s+(.+)$/,  // 1. 标题
    /^\d+\.\d+\s+(.+)$/,  // 1.1 标题
    /^（[一二三四五六七八九十]+）\s*(.+)$/,  // （一）标题
    /^\([一二三四五六七八九十\d]+\)\s*(.+)$/,  // (1)标题
  ];

  let currentSegment: ClauseSegment | null = null;
  let segmentId = 0;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // 检查是否是条款标题
    let isClauseTitle = false;
    let clauseTitle = '';
    let clauseLevel = 1;

    for (let i = 0; i < clausePatterns.length; i++) {
      const match = trimmedLine.match(clausePatterns[i]);
      if (match) {
        isClauseTitle = true;
        clauseTitle = match[1] || trimmedLine;
        clauseLevel = i + 1;
        break;
      }
    }

    if (isClauseTitle) {
      // 保存上一个段落
      if (currentSegment) {
        currentSegment.endLine = index;
        segments.push(currentSegment);
      }

      // 开始新段落
      currentSegment = {
        id: `clause-${++segmentId}`,
        title: clauseTitle,
        content: line,
        startLine: index + 1,
        endLine: index + 1,
        level: clauseLevel
      };
    } else if (currentSegment && trimmedLine) {
      // 添加到当前段落
      currentSegment.content += '\n' + line;
      currentSegment.endLine = index + 1;
    }
  });

  // 保存最后一个段落
  if (currentSegment) {
    segments.push(currentSegment);
  }

  // 如果没有识别到任何条款，将整个文档作为一个段落
  if (segments.length === 0) {
    segments.push({
      id: 'clause-1',
      title: '全文',
      content: content,
      startLine: 1,
      endLine: lines.length,
      level: 1
    });
  }

  return segments;
}

/**
 * 条款级对比
 */
export function compareClausesfunction compareClause(clause1: ClauseSegment, clause2: ClauseSegment): ClauseComparison {
  const diff = Diff.diffWords(clause1.content, clause2.content);
  
  const changes: ClauseComparison['changes'] = [];
  let addedCount = 0;
  let deletedCount = 0;
  let unchangedCount = 0;

  diff.forEach(part => {
    if (part.added) {
      changes.push({
        type: 'added',
        newContent: part.value
      });
      addedCount += part.value.length;
    } else if (part.removed) {
      changes.push({
        type: 'deleted',
        oldContent: part.value
      });
      deletedCount += part.value.length;
    } else {
      unchangedCount += part.value.length;
    }
  });

  const totalLength = clause1.content.length + clause2.content.length;
  const similarity = totalLength > 0 
    ? Math.round((unchangedCount * 2 / totalLength) * 100) 
    : 100;

  let changeType: ClauseComparison['changeType'];
  if (similarity > 90) {
    changeType = 'unchanged';
  } else if (addedCount > 0 && deletedCount > 0) {
    changeType = 'modified';
  } else if (addedCount > 0) {
    changeType = 'added';
  } else {
    changeType = 'deleted';
  }

  return {
    clause1,
    clause2,
    changeType,
    changes,
    similarity
  };
}

/**
 * 批量对比条款
 */
export function compareClauses(
  segments1: ClauseSegment[],
  segments2: ClauseSegment[]
): ClauseComparison[] {
  const comparisons: ClauseComparison[] = [];
  
  // 简单的匹配策略：按标题匹配
  const matched = new Set<string>();
  
  segments1.forEach(seg1 => {
    const seg2 = segments2.find(s => s.title === seg1.title && !matched.has(s.id));
    
    if (seg2) {
      matched.add(seg2.id);
      comparisons.push(compareClause(seg1, seg2));
    } else {
      // 条款被删除
      comparisons.push({
        clause1: seg1,
        changeType: 'deleted',
        changes: [{
          type: 'deleted',
          oldContent: seg1.content
        }],
        similarity: 0
      });
    }
  });

  // 查找新增的条款
  segments2.forEach(seg2 => {
    if (!matched.has(seg2.id)) {
      comparisons.push({
        clause2: seg2,
        changeType: 'added',
        changes: [{
          type: 'added',
          newContent: seg2.content
        }],
        similarity: 0
      });
    }
  });

  return comparisons;
}

/**
 * 检测条款冲突
 */
export function detectClauseConflicts(
  segments: ClauseSegment[]
): ClauseConflict[] {
  const conflicts: ClauseConflict[] = [];

  // 提取所有金额
  const amountPattern = /(?:人民币|美元|欧元)?\s*\d+(?:,\d{3})*(?:\.\d+)?\s*(?:元|万元|亿元|USD|EUR)/gi;
  const amounts = new Map<string, Array<{ clause: ClauseSegment; amount: string }>>();

  segments.forEach(segment => {
    const matches = segment.content.match(amountPattern);
    if (matches) {
      matches.forEach(match => {
        const key = match.replace(/\s/g, '');
        if (!amounts.has(key)) {
          amounts.set(key, []);
        }
        amounts.get(key)!.push({ clause: segment, amount: match });
      });
    }
  });

  // 检测金额冲突
  // 查找"总价款"、"合同金额"等关键词
  const totalAmountKeywords = ['总价款', '合同金额', '合同总价', '总金额', '总费用'];
  const totalAmountClauses: Array<{ clause: ClauseSegment; amount: string }> = [];

  segments.forEach(segment => {
    const hasTotalKeyword = totalAmountKeywords.some(keyword => 
      segment.content.includes(keyword)
    );
    
    if (hasTotalKeyword) {
      const matches = segment.content.match(amountPattern);
      if (matches) {
        totalAmountClauses.push({
          clause: segment,
          amount: matches[0]
        });
      }
    }
  });

  // 如果有多个不同的总金额，报告冲突
  if (totalAmountClauses.length > 1) {
    const uniqueAmounts = [...new Set(totalAmountClauses.map(t => t.amount.replace(/\s/g, '')))];
    if (uniqueAmounts.length > 1) {
      conflicts.push({
        type: '金额冲突',
        severity: 'critical',
        clause1: {
          title: totalAmountClauses[0].clause.title,
          content: totalAmountClauses[0].clause.content,
          lineNumber: totalAmountClauses[0].clause.startLine
        },
        clause2: {
          title: totalAmountClauses[1].clause.title,
          content: totalAmountClauses[1].clause.content,
          lineNumber: totalAmountClauses[1].clause.startLine
        },
        description: `合同中出现了多个不同的总价款：${uniqueAmounts.join(' 和 ')}`,
        suggestion: '请核实并统一合同总价款，避免执行争议'
      });
    }
  }

  // 检测日期冲突
  const datePattern = /\d{4}年\d{1,2}月\d{1,2}日/g;
  const deliveryDateKeywords = ['交付日期', '完成日期', '履行期限', '交付时间'];
  const deliveryDates: Array<{ clause: ClauseSegment; date: string }> = [];

  segments.forEach(segment => {
    const hasDeliveryKeyword = deliveryDateKeywords.some(keyword =>
      segment.content.includes(keyword)
    );

    if (hasDeliveryKeyword) {
      const matches = segment.content.match(datePattern);
      if (matches) {
        deliveryDates.push({
          clause: segment,
          date: matches[0]
        });
      }
    }
  });

  // 如果有多个不同的交付日期，报告冲突
  if (deliveryDates.length > 1) {
    const uniqueDates = [...new Set(deliveryDates.map(d => d.date))];
    if (uniqueDates.length > 1) {
      conflicts.push({
        type: '时间冲突',
        severity: 'critical',
        clause1: {
          title: deliveryDates[0].clause.title,
          content: deliveryDates[0].clause.content,
          lineNumber: deliveryDates[0].clause.startLine
        },
        clause2: {
          title: deliveryDates[1].clause.title,
          content: deliveryDates[1].clause.content,
          lineNumber: deliveryDates[1].clause.startLine
        },
        description: `合同中出现了多个不同的交付日期：${uniqueDates.join(' 和 ')}`,
        suggestion: '请核实并统一交付日期，避免履行争议'
      });
    }
  }

  // 检测权利义务冲突
  // 查找矛盾的表述，如"甲方有权"和"甲方无权"
  const contradictionPatterns = [
    { positive: /有权|可以|应当|必须/g, negative: /无权|不得|不应|禁止/g },
  ];

  segments.forEach((seg1, i) => {
    segments.slice(i + 1).forEach(seg2 => {
      // 检查是否涉及同一主体
      const subjects = ['甲方', '乙方', '丙方', '买方', '卖方', '委托方', '受托方'];
      
      for (const subject of subjects) {
        if (seg1.content.includes(subject) && seg2.content.includes(subject)) {
          // 检查是否有矛盾表述
          for (const pattern of contradictionPatterns) {
            const hasPositive1 = pattern.positive.test(seg1.content);
            const hasNegative1 = pattern.negative.test(seg1.content);
            const hasPositive2 = pattern.positive.test(seg2.content);
            const hasNegative2 = pattern.negative.test(seg2.content);

            if ((hasPositive1 && hasNegative2) || (hasNegative1 && hasPositive2)) {
              conflicts.push({
                type: '权利义务冲突',
                severity: 'warning',
                clause1: {
                  title: seg1.title,
                  content: seg1.content,
                  lineNumber: seg1.startLine
                },
                clause2: {
                  title: seg2.title,
                  content: seg2.content,
                  lineNumber: seg2.startLine
                },
                description: `关于"${subject}"的权利义务存在矛盾表述`,
                suggestion: '请核实并统一权利义务约定，避免理解歧义'
              });
            }
          }
        }
      }
    });
  });

  return conflicts;
}

/**
 * 生成关键条款变化预警
 */
export function generateKeyClauseAlerts(
  clauseComparisons: ClauseComparison[]
): KeyClauseAlert[] {
  const alerts: KeyClauseAlert[] = [];

  // 关键条款关键词
  const keyClauseKeywords = {
    '金额': ['价款', '金额', '费用', '价格', '报酬'],
    '日期': ['日期', '期限', '时间', '交付', '完成'],
    '违约责任': ['违约', '违约金', '赔偿', '责任'],
    '权利义务': ['权利', '义务', '有权', '应当', '必须'],
    '争议解决': ['争议', '仲裁', '诉讼', '管辖']
  };

  clauseComparisons.forEach(comparison => {
    if (comparison.changeType === 'unchanged') return;

    // 检查是否是关键条款
    for (const [category, keywords] of Object.entries(keyClauseKeywords)) {
      const clause = comparison.clause1 || comparison.clause2;
      if (!clause) continue;

      const isKeyClause = keywords.some(keyword => 
        clause.title.includes(keyword) || clause.content.includes(keyword)
      );

      if (isKeyClause) {
        // 提取变化的具体值
        let oldValue: string | undefined;
        let newValue: string | undefined;

        if (category === '金额') {
          const amountPattern = /(?:人民币|美元)?\s*\d+(?:,\d{3})*(?:\.\d+)?\s*(?:元|万元|亿元|USD)/gi;
          if (comparison.clause1) {
            const match = comparison.clause1.content.match(amountPattern);
            oldValue = match ? match[0] : undefined;
          }
          if (comparison.clause2) {
            const match = comparison.clause2.content.match(amountPattern);
            newValue = match ? match[0] : undefined;
          }
        } else if (category === '日期') {
          const datePattern = /\d{4}年\d{1,2}月\d{1,2}日/g;
          if (comparison.clause1) {
            const match = comparison.clause1.content.match(datePattern);
            oldValue = match ? match[0] : undefined;
          }
          if (comparison.clause2) {
            const match = comparison.clause2.content.match(datePattern);
            newValue = match ? match[0] : undefined;
          }
        }

        let description = '';
        if (comparison.changeType === 'added') {
          description = `新增关键条款："${clause.title}"`;
        } else if (comparison.changeType === 'deleted') {
          description = `删除关键条款："${clause.title}"`;
        } else {
          description = `修改关键条款："${clause.title}"`;
          if (oldValue && newValue && oldValue !== newValue) {
            description += `，从"${oldValue}"变更为"${newValue}"`;
          }
        }

        alerts.push({
          clauseTitle: clause.title,
          changeType: comparison.changeType,
          category: category as KeyClauseAlert['category'],
          oldValue,
          newValue,
          riskLevel: comparison.changeType === 'deleted' || (category === '金额' || category === '日期') ? 'high' : 'medium',
          description
        });

        break; // 一个条款只报告一次
      }
    }
  });

  return alerts;
}
