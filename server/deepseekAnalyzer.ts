import { invokeLLM } from "./_core/llm";

/**
 * DeepSeek AI分析引擎
 * 使用AI进行深度语义分析
 */

export interface DeepSeekAnalysisResult {
  overallSimilarity: number;
  summary: string;
  details: {
    semanticSimilarity: number;
    structuralSimilarity: number;
    styleSimilarity: number;
    topicSimilarity: number;
    toneSimilarity: number;
    vocabularySimilarity: number;
  };
  riskLevel: 'high' | 'medium' | 'low';
  riskDescription: string;
  recommendations: string[];
  segments: Array<{
    doc1Segment: string;
    doc2Segment: string;
    similarity: number;
    reason: string;
  }>;
}

/**
 * 使用DeepSeek AI分析文档相似度
 */
export async function analyzeWithDeepSeek(text1: string, text2: string): Promise<DeepSeekAnalysisResult> {
  // 限制文本长度以避免token超限
  const maxLength = 3000;
  const truncatedText1 = text1.length > maxLength ? text1.substring(0, maxLength) + '...' : text1;
  const truncatedText2 = text2.length > maxLength ? text2.substring(0, maxLength) + '...' : text2;

  const prompt = `你是一个专业的文档相似度分析专家。请详细分析以下两个文档的相似度。

文档A:
${truncatedText1}

文档B:
${truncatedText2}

请从以下9个维度进行分析，并以JSON格式返回结果：

1. **整体相似度** (overallSimilarity): 0-100的数值
2. **语义相似度** (semanticSimilarity): 0-100的数值
3. **结构相似度** (structuralSimilarity): 0-100的数值
4. **风格相似度** (styleSimilarity): 0-100的数值
5. **主题相似度** (topicSimilarity): 0-100的数值
6. **语气相似度** (toneSimilarity): 0-100的数值
7. **词汇相似度** (vocabularySimilarity): 0-100的数值
8. **风险等级** (riskLevel): "high" | "medium" | "low"
9. **风险说明** (riskDescription): 详细说明相似度带来的风险

此外，请提供：
- **分析摘要** (summary): 100-200字的详细分析总结
- **改进建议** (recommendations): 3-5条具体的改进建议（数组）
- **相似片段** (segments): 提取3-5个最相似的片段对，每个包含：
  - doc1Segment: 文档A的片段
  - doc2Segment: 文档B的片段
  - similarity: 相似度（0-100）
  - reason: 相似原因说明

请确保返回的是有效的JSON格式。`;

  try {
    const response = await invokeLLM({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "你是一个专业的文档相似度分析专家，擅长从多个维度分析文档的相似性。" },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_object"
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('DeepSeek API returned empty response');
    }

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const result = JSON.parse(contentStr);

    return {
      overallSimilarity: result.overallSimilarity,
      summary: result.summary,
      details: {
        semanticSimilarity: result.semanticSimilarity,
        structuralSimilarity: result.structuralSimilarity,
        styleSimilarity: result.styleSimilarity,
        topicSimilarity: result.topicSimilarity,
        toneSimilarity: result.toneSimilarity,
        vocabularySimilarity: result.vocabularySimilarity,
      },
      riskLevel: result.riskLevel,
      riskDescription: result.riskDescription,
      recommendations: result.recommendations,
      segments: result.segments
    };
  } catch (error) {
    console.error('[DeepSeekAnalyzer] Analysis error:', error);
    throw new Error('Failed to analyze with DeepSeek AI');
  }
}
