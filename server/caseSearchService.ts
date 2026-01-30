/**
 * 案例检索系统服务
 * 
 * 功能：
 * 1. 案例要素提取
 * 2. 智能检索
 * 3. 相似案例推荐
 * 4. 法律意见生成
 */

export interface LegalCase {
  id: string;
  caseNumber: string; // 案号
  caseName: string; // 案由
  court: string; // 审理法院
  caseType: CaseType; // 案件类型
  trialProcedure: TrialProcedure; // 审理程序
  judgmentDate: string; // 判决日期
  parties: {
    plaintiff: string[]; // 原告
    defendant: string[]; // 被告
    thirdParty?: string[]; // 第三人
  };
  facts: string; // 案件事实
  claims: string[]; // 诉讼请求
  defenses: string[]; // 答辩意见
  evidence: string[]; // 证据列表
  courtOpinion: string; // 法院认为
  judgment: string; // 判决结果
  legalBasis: string[]; // 法律依据
  keywords: string[]; // 关键词
  fullText: string; // 全文
  similarity?: number; // 相似度（检索结果）
}

export type CaseType = 
  | 'civil' // 民事
  | 'criminal' // 刑事
  | 'administrative' // 行政
  | 'enforcement' // 执行
  | 'national_compensation'; // 国家赔偿

export type TrialProcedure =
  | 'first_instance' // 一审
  | 'second_instance' // 二审
  | 'retrial' // 再审
  | 'execution'; // 执行

export interface CaseElements {
  caseType: CaseType;
  caseName: string;
  parties: {
    plaintiff: string[];
    defendant: string[];
  };
  disputeFocus: string[]; // 争议焦点
  legalRelation: string; // 法律关系
  keyFacts: string[]; // 关键事实
  legalIssues: string[]; // 法律问题
  appliedLaws: string[]; // 适用法律
}

export interface SearchQuery {
  keywords?: string[]; // 关键词
  caseType?: CaseType; // 案件类型
  caseName?: string; // 案由
  court?: string; // 法院
  dateRange?: {
    start: string;
    end: string;
  };
  legalBasis?: string[]; // 法律依据
  parties?: string[]; // 当事人
  fullText?: string; // 全文检索
}

export interface SearchResult {
  cases: LegalCase[];
  total: number;
  page: number;
  pageSize: number;
  aggregations?: {
    byCaseType: Record<CaseType, number>;
    byCourt: Record<string, number>;
    byYear: Record<string, number>;
  };
}

export interface LegalOpinion {
  caseId: string;
  query: string;
  similarCases: LegalCase[];
  analysis: {
    factComparison: string; // 事实对比
    legalAnalysis: string; // 法律分析
    precedentValue: string; // 判例价值
    riskAssessment: string; // 风险评估
  };
  suggestions: string[]; // 建议
  references: string[]; // 参考文献
  generatedAt: string;
}

export class CaseSearchService {
  /**
   * 提取案例要素
   */
  extractCaseElements(caseText: string): CaseElements {
    // 简化的要素提取逻辑
    // 实际应用中应使用NLP技术进行更精确的提取
    
    const elements: CaseElements = {
      caseType: 'civil',
      caseName: '',
      parties: {
        plaintiff: [],
        defendant: [],
      },
      disputeFocus: [],
      legalRelation: '',
      keyFacts: [],
      legalIssues: [],
      appliedLaws: [],
    };

    // 提取案件类型
    if (caseText.includes('刑事') || caseText.includes('犯罪')) {
      elements.caseType = 'criminal';
    } else if (caseText.includes('行政')) {
      elements.caseType = 'administrative';
    }

    // 提取案由
    const caseNameMatch = caseText.match(/(.{2,10}?)纠纷|(.{2,10}?)案/);
    if (caseNameMatch) {
      elements.caseName = caseNameMatch[0];
    }

    // 提取当事人
    const plaintiffMatch = caseText.match(/原告[：:](.*?)(?=[，。\n])/g);
    if (plaintiffMatch) {
      elements.parties.plaintiff = plaintiffMatch.map(m => 
        m.replace(/原告[：:]/, '').trim()
      );
    }

    const defendantMatch = caseText.match(/被告[：:](.*?)(?=[，。\n])/g);
    if (defendantMatch) {
      elements.parties.defendant = defendantMatch.map(m => 
        m.replace(/被告[：:]/, '').trim()
      );
    }

    // 提取法律依据
    const lawMatch = caseText.match(/《.*?》第.*?条/g);
    if (lawMatch) {
      elements.appliedLaws = [...new Set(lawMatch)];
    }

    // 提取关键事实（简化版）
    const sentences = caseText.split(/[。！？]/);
    elements.keyFacts = sentences
      .filter(s => s.length > 20 && s.length < 200)
      .slice(0, 5);

    return elements;
  }

  /**
   * 搜索案例
   */
  searchCases(query: SearchQuery): SearchResult {
    // 模拟案例数据
    const mockCases: LegalCase[] = [
      {
        id: '1',
        caseNumber: '(2023)京0105民初12345号',
        caseName: '买卖合同纠纷',
        court: '北京市朝阳区人民法院',
        caseType: 'civil',
        trialProcedure: 'first_instance',
        judgmentDate: '2023-06-15',
        parties: {
          plaintiff: ['张三'],
          defendant: ['李四'],
        },
        facts: '原告张三与被告李四于2022年10月签订买卖合同，约定被告向原告购买货物，总价款50万元。合同签订后，原告依约交付货物，但被告未按约定支付货款。',
        claims: ['要求被告支付货款50万元', '要求被告支付违约金5万元', '要求被告承担诉讼费用'],
        defenses: ['货物存在质量问题', '未收到全部货物'],
        evidence: ['买卖合同', '交货单', '银行转账记录'],
        courtOpinion: '本院认为，原被告之间的买卖合同合法有效，双方应按约履行。被告未按约支付货款，构成违约。',
        judgment: '被告李四于本判决生效之日起十日内向原告张三支付货款50万元及违约金5万元。',
        legalBasis: ['《中华人民共和国民法典》第509条', '《中华人民共和国民法典》第577条'],
        keywords: ['买卖合同', '违约', '货款', '违约金'],
        fullText: '原告张三与被告李四买卖合同纠纷一案...',
        similarity: 0.95,
      },
      {
        id: '2',
        caseNumber: '(2023)京0108民初23456号',
        caseName: '买卖合同纠纷',
        court: '北京市海淀区人民法院',
        caseType: 'civil',
        trialProcedure: 'first_instance',
        judgmentDate: '2023-08-20',
        parties: {
          plaintiff: ['王五'],
          defendant: ['赵六'],
        },
        facts: '原告王五与被告赵六签订买卖合同，约定被告向原告购买设备，总价款100万元。被告支付定金20万元后，拒绝支付剩余款项。',
        claims: ['要求被告支付剩余货款80万元', '要求被告支付违约金10万元'],
        defenses: ['设备不符合约定标准', '原告未提供合格证明'],
        evidence: ['买卖合同', '定金收据', '设备检验报告'],
        courtOpinion: '本院认为，原告提供的设备符合合同约定，被告应按约支付剩余款项。',
        judgment: '被告赵六于本判决生效之日起十日内向原告王五支付货款80万元及违约金10万元。',
        legalBasis: ['《中华人民共和国民法典》第509条', '《中华人民共和国民法典》第577条'],
        keywords: ['买卖合同', '违约', '定金', '设备'],
        fullText: '原告王五与被告赵六买卖合同纠纷一案...',
        similarity: 0.88,
      },
    ];

    // 简单的筛选逻辑
    let filteredCases = mockCases;

    if (query.caseType) {
      filteredCases = filteredCases.filter(c => c.caseType === query.caseType);
    }

    if (query.caseName) {
      filteredCases = filteredCases.filter(c => 
        c.caseName.includes(query.caseName!)
      );
    }

    if (query.keywords && query.keywords.length > 0) {
      filteredCases = filteredCases.filter(c =>
        query.keywords!.some(keyword =>
          c.keywords.includes(keyword) ||
          c.fullText.includes(keyword)
        )
      );
    }

    // 计算聚合统计
    const aggregations = {
      byCaseType: {} as Record<CaseType, number>,
      byCourt: {} as Record<string, number>,
      byYear: {} as Record<string, number>,
    };

    filteredCases.forEach(c => {
      // 按案件类型
      aggregations.byCaseType[c.caseType] = 
        (aggregations.byCaseType[c.caseType] || 0) + 1;
      
      // 按法院
      aggregations.byCourt[c.court] = 
        (aggregations.byCourt[c.court] || 0) + 1;
      
      // 按年份
      const year = c.judgmentDate.split('-')[0];
      aggregations.byYear[year] = 
        (aggregations.byYear[year] || 0) + 1;
    });

    return {
      cases: filteredCases,
      total: filteredCases.length,
      page: 1,
      pageSize: 10,
      aggregations,
    };
  }

  /**
   * 查找相似案例
   */
  findSimilarCases(caseElements: CaseElements, limit: number = 5): LegalCase[] {
    // 使用搜索功能查找相似案例
    const searchResult = this.searchCases({
      caseType: caseElements.caseType,
      caseName: caseElements.caseName,
      keywords: caseElements.keyFacts.slice(0, 3),
    });

    return searchResult.cases.slice(0, limit);
  }

  /**
   * 生成法律意见
   */
  generateLegalOpinion(params: {
    caseId: string;
    query: string;
    caseElements: CaseElements;
  }): LegalOpinion {
    const { caseId, query, caseElements } = params;

    // 查找相似案例
    const similarCases = this.findSimilarCases(caseElements, 3);

    // 生成分析
    const analysis = {
      factComparison: this.generateFactComparison(caseElements, similarCases),
      legalAnalysis: this.generateLegalAnalysis(caseElements, similarCases),
      precedentValue: this.generatePrecedentValue(similarCases),
      riskAssessment: this.generateRiskAssessment(caseElements, similarCases),
    };

    // 生成建议
    const suggestions = this.generateSuggestions(caseElements, similarCases);

    // 生成参考文献
    const references = similarCases.map(c => 
      `${c.caseNumber} ${c.caseName} ${c.court} (${c.judgmentDate})`
    );

    return {
      caseId,
      query,
      similarCases,
      analysis,
      suggestions,
      references,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * 生成事实对比
   */
  private generateFactComparison(
    caseElements: CaseElements,
    similarCases: LegalCase[]
  ): string {
    let comparison = `本案与检索到的${similarCases.length}个相似案例在事实方面的对比：\n\n`;
    
    comparison += `**本案关键事实**：\n`;
    caseElements.keyFacts.forEach((fact, idx) => {
      comparison += `${idx + 1}. ${fact}\n`;
    });
    
    comparison += `\n**相似案例共同特征**：\n`;
    comparison += `- 案由相同或相近（${caseElements.caseName}）\n`;
    comparison += `- 法律关系类似\n`;
    comparison += `- 争议焦点相似\n`;
    
    return comparison;
  }

  /**
   * 生成法律分析
   */
  private generateLegalAnalysis(
    caseElements: CaseElements,
    similarCases: LegalCase[]
  ): string {
    let analysis = `**适用法律**：\n`;
    
    // 统计相似案例中最常用的法律依据
    const lawFrequency: Record<string, number> = {};
    similarCases.forEach(c => {
      c.legalBasis.forEach(law => {
        lawFrequency[law] = (lawFrequency[law] || 0) + 1;
      });
    });
    
    const commonLaws = Object.entries(lawFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    commonLaws.forEach(([law, count]) => {
      analysis += `- ${law}（${count}个案例适用）\n`;
    });
    
    analysis += `\n**法律适用建议**：\n`;
    analysis += `根据相似案例的判决，本案应重点关注上述法律条款的适用。\n`;
    
    return analysis;
  }

  /**
   * 生成判例价值
   */
  private generatePrecedentValue(similarCases: LegalCase[]): string {
    let value = `**判例参考价值**：\n\n`;
    
    value += `检索到${similarCases.length}个高度相似案例，均为生效判决，具有较高的参考价值。\n\n`;
    
    similarCases.forEach((c, idx) => {
      value += `${idx + 1}. ${c.caseNumber}\n`;
      value += `   - 法院：${c.court}\n`;
      value += `   - 判决日期：${c.judgmentDate}\n`;
      value += `   - 相似度：${((c.similarity || 0) * 100).toFixed(0)}%\n`;
      value += `   - 判决要点：${c.judgment.substring(0, 100)}...\n\n`;
    });
    
    return value;
  }

  /**
   * 生成风险评估
   */
  private generateRiskAssessment(
    caseElements: CaseElements,
    similarCases: LegalCase[]
  ): string {
    let assessment = `**风险评估**：\n\n`;
    
    // 统计判决结果
    const supportPlaintiff = similarCases.filter(c => 
      c.judgment.includes('支持') || c.judgment.includes('原告')
    ).length;
    
    const supportRate = (supportPlaintiff / similarCases.length * 100).toFixed(0);
    
    assessment += `根据相似案例分析：\n`;
    assessment += `- 原告胜诉率约${supportRate}%\n`;
    assessment += `- 主要风险点：证据充分性、法律适用准确性\n`;
    assessment += `- 建议：补强关键证据，明确法律依据\n`;
    
    return assessment;
  }

  /**
   * 生成建议
   */
  private generateSuggestions(
    caseElements: CaseElements,
    similarCases: LegalCase[]
  ): string[] {
    const suggestions: string[] = [];
    
    suggestions.push('补充收集与相似案例中关键证据类似的材料');
    suggestions.push('重点关注法院在相似案例中的裁判要点');
    suggestions.push('准备针对常见抗辩理由的应对方案');
    suggestions.push('考虑引用相似案例作为判例参考');
    
    if (caseElements.appliedLaws.length > 0) {
      suggestions.push(`重点研究${caseElements.appliedLaws[0]}的适用条件`);
    }
    
    return suggestions;
  }

  /**
   * 获取案件类型名称
   */
  getCaseTypeName(caseType: CaseType): string {
    const names: Record<CaseType, string> = {
      civil: '民事',
      criminal: '刑事',
      administrative: '行政',
      enforcement: '执行',
      national_compensation: '国家赔偿',
    };
    return names[caseType];
  }

  /**
   * 获取审理程序名称
   */
  getTrialProcedureName(procedure: TrialProcedure): string {
    const names: Record<TrialProcedure, string> = {
      first_instance: '一审',
      second_instance: '二审',
      retrial: '再审',
      execution: '执行',
    };
    return names[procedure];
  }
}

// 导出单例
export const caseSearchService = new CaseSearchService();
