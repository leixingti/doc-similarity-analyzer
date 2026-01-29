/**
 * AI变化摘要生成服务
 * 使用DeepSeek AI生成文档变化的自然语言摘要
 */

import type { ChangeWithRisk } from './riskAnalyzer';
import { extractHighRiskChanges } from './riskAnalyzer';

/**
 * 生成变化摘要
 */
export async function generateChangeSummary(
  changesWithRisk: ChangeWithRisk[],
  documentType: string,
  doc1Name: string,
  doc2Name: string
): Promise<string> {
  // 提取高风险变化
  const highRiskChanges = extractHighRiskChanges(changesWithRisk);
  
  // 如果没有高风险变化，返回简单摘要
  if (highRiskChanges.length === 0) {
    return generateSimpleSummary(changesWithRisk, documentType);
  }

  // 准备AI分析的数据
  const changesForAI = highRiskChanges.slice(0, 10).map(change => ({
    type: change.type,
    lineNumber: change.lineNumber,
    oldContent: change.oldContent?.substring(0, 200),
    newContent: change.newContent?.substring(0, 200),
    riskLevel: change.riskAnalysis?.riskLevel,
    category: change.riskAnalysis?.category,
    matchedKeyword: change.riskAnalysis?.matchedKeyword
  }));

  const documentTypeLabels: Record<string, string> = {
    'contract': '合同协议',
    'charter': '公司章程',
    'litigation': '诉讼文书',
    'nda': '保密协议',
    'other': '其他文档'
  };

  const prompt = `你是一位专业的法律文档分析助手。请分析以下文档变化，生成简洁专业的中文摘要。

文档类型：${documentTypeLabels[documentType] || documentType}
文档1：${doc1Name}
文档2：${doc2Name}
总变化数：${changesWithRisk.length}
高风险变化数：${highRiskChanges.length}

主要高风险变化：
${JSON.stringify(changesForAI, null, 2)}

请按以下格式输出摘要（不超过200字）：

1. 用一句话概括本次修订的主要目的或性质
2. 列出3-5个最关键的变化（突出金额、日期、责任等重要变化）
3. 如有高风险变化，提供简短的风险提示

要求：
- 使用专业但易懂的法律语言
- 突出重点，避免冗长
- 对于金额、日期等关键信息，明确指出变化前后的具体值
- 不要重复描述相同类型的变化`;

  try {
    // 调用DeepSeek API
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.warn('DEEPSEEK_API_KEY not configured, using simple summary');
      return generateSimpleSummary(changesWithRisk, documentType);
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的法律文档分析助手，擅长分析合同、协议等法律文档的变化，并生成简洁专业的摘要。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      console.error('DeepSeek API error:', response.statusText);
      return generateSimpleSummary(changesWithRisk, documentType);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim();
    
    if (summary) {
      return summary;
    }
    
    return generateSimpleSummary(changesWithRisk, documentType);
  } catch (error) {
    console.error('Error generating AI summary:', error);
    return generateSimpleSummary(changesWithRisk, documentType);
  }
}

/**
 * 生成简单摘要（不使用AI）
 */
function generateSimpleSummary(
  changesWithRisk: ChangeWithRisk[],
  documentType: string
): string {
  const highRiskChanges = extractHighRiskChanges(changesWithRisk);
  const addedCount = changesWithRisk.filter(c => c.type === 'added').length;
  const deletedCount = changesWithRisk.filter(c => c.type === 'deleted').length;
  const modifiedCount = changesWithRisk.filter(c => c.type === 'modified').length;

  let summary = `本次文档修订共涉及 ${changesWithRisk.length} 处变化`;
  
  if (addedCount > 0) summary += `，新增 ${addedCount} 处`;
  if (deletedCount > 0) summary += `，删除 ${deletedCount} 处`;
  if (modifiedCount > 0) summary += `，修改 ${modifiedCount} 处`;
  
  summary += '。';

  if (highRiskChanges.length > 0) {
    summary += `\n\n⚠️ 检测到 ${highRiskChanges.length} 处高风险变化，涉及：`;
    
    const categories = new Set(
      highRiskChanges
        .map(c => c.riskAnalysis?.category)
        .filter(Boolean)
    );
    
    summary += Array.from(categories).slice(0, 3).join('、');
    summary += '。建议仔细审查相关条款。';
  }

  return summary;
}
