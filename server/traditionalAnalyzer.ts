/**
 * 传统相似度分析引擎
 * 实现余弦相似度、Jaccard相似度、TF-IDF等算法
 */

export interface AnalysisResult {
  overallSimilarity: number; // 0-100
  details: {
    cosineSimilarity: number;
    jaccardSimilarity: number;
    tfidfSimilarity: number;
  };
  segments: Array<{
    doc1Segment: string;
    doc2Segment: string;
    similarity: number;
    reason: string;
  }>;
}

/**
 * 文本预处理：分词、去停用词、小写化
 */
function preprocessText(text: string): string[] {
  // 简单分词（按空格和标点符号）
  const words = text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
    .split(/\s+/)
    .filter((w: string) => w.length > 1);
  
  return words;
}

/**
 * 计算余弦相似度
 */
function cosineSimilarity(text1: string, text2: string): number {
  const words1 = preprocessText(text1);
  const words2 = preprocessText(text2);
  
  // 构建词频向量
  const allWords = Array.from(new Set([...words1, ...words2]));
  const vector1 = allWords.map(word => words1.filter(w => w === word).length);
  const vector2 = allWords.map(word => words2.filter(w => w === word).length);
  
  // 计算点积
  const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
  
  // 计算模长
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  
  return (dotProduct / (magnitude1 * magnitude2)) * 100;
}

/**
 * 计算Jaccard相似度
 */
function jaccardSimilarity(text1: string, text2: string): number {
  const words1 = new Set(preprocessText(text1));
  const words2 = new Set(preprocessText(text2));
  
  const intersection = new Set(Array.from(words1).filter(w => words2.has(w)));
  const union = new Set([...Array.from(words1), ...Array.from(words2)]);
  
  if (union.size === 0) return 0;
  
  return (intersection.size / union.size) * 100;
}

/**
 * 计算TF-IDF相似度
 */
function tfidfSimilarity(text1: string, text2: string): number {
  const words1 = preprocessText(text1);
  const words2 = preprocessText(text2);
  
  // 简化版TF-IDF：只考虑词频
  const allWords = Array.from(new Set([...words1, ...words2]));
  
  // 计算TF
  const tf1 = allWords.map(word => {
    const count = words1.filter(w => w === word).length;
    return count / words1.length;
  });
  
  const tf2 = allWords.map(word => {
    const count = words2.filter(w => w === word).length;
    return count / words2.length;
  });
  
  // 计算余弦相似度
  const dotProduct = tf1.reduce((sum, val, i) => sum + val * tf2[i], 0);
  const magnitude1 = Math.sqrt(tf1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(tf2.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  
  return (dotProduct / (magnitude1 * magnitude2)) * 100;
}

/**
 * 提取相似片段
 */
function extractSimilarSegments(text1: string, text2: string): Array<{
  doc1Segment: string;
  doc2Segment: string;
  similarity: number;
  reason: string;
}> {
  const segments: Array<{
    doc1Segment: string;
    doc2Segment: string;
    similarity: number;
    reason: string;
  }> = [];
  
  // 将文本分成句子
  const sentences1 = text1.split(/[。！？\.\!\?]+/).filter(s => s.trim().length > 10);
  const sentences2 = text2.split(/[。！？\.\!\?]+/).filter(s => s.trim().length > 10);
  
  // 对比每对句子
  for (const s1 of sentences1) {
    for (const s2 of sentences2) {
      const similarity = cosineSimilarity(s1, s2);
      
      if (similarity > 60) { // 相似度阈值
        let reason = '';
        if (similarity >= 90) {
          reason = '文本内容几乎完全一致，可能存在直接复制';
        } else if (similarity >= 70) {
          reason = '文本内容高度相似，表达方式基本相同';
        } else {
          reason = '文本内容部分相似，存在一定程度的重叠';
        }
        
        segments.push({
          doc1Segment: s1.trim(),
          doc2Segment: s2.trim(),
          similarity,
          reason
        });
      }
    }
  }
  
  // 按相似度排序，取前10个
  return segments.sort((a, b) => b.similarity - a.similarity).slice(0, 10);
}

/**
 * 执行传统算法分析
 */
export async function analyzeTraditional(text1: string, text2: string): Promise<AnalysisResult> {
  // 计算三种相似度
  const cosine = cosineSimilarity(text1, text2);
  const jaccard = jaccardSimilarity(text1, text2);
  const tfidf = tfidfSimilarity(text1, text2);
  
  // 综合相似度（加权平均）
  const overallSimilarity = (cosine * 0.4 + jaccard * 0.3 + tfidf * 0.3);
  
  // 提取相似片段
  const segments = extractSimilarSegments(text1, text2);
  
  return {
    overallSimilarity: Math.round(overallSimilarity * 10) / 10,
    details: {
      cosineSimilarity: Math.round(cosine * 10) / 10,
      jaccardSimilarity: Math.round(jaccard * 10) / 10,
      tfidfSimilarity: Math.round(tfidf * 10) / 10,
    },
    segments
  };
}
