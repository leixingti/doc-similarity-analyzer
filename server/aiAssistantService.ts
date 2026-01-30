/**
 * AI助手服务
 * 
 * 功能：
 * 1. 合同条款智能生成
 * 2. 法律风险深度预测
 * 3. 智能法律问答
 * 4. 文档自动摘要
 */

export interface ContractClause {
  title: string;
  content: string;
  category: string;
  riskLevel: 'low' | 'medium' | 'high';
  suggestions: string[];
}

export interface RiskPrediction {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-100
  riskFactors: RiskFactor[];
  recommendations: string[];
  legalBasis: string[];
  precedents: string[];
}

export interface RiskFactor {
  factor: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string;
}

export interface LegalQA {
  question: string;
  answer: string;
  references: string[];
  relatedQuestions: string[];
  confidence: number; // 0-1
}

export interface DocumentSummary {
  title: string;
  summary: string;
  keyPoints: string[];
  parties: string[];
  dates: string[];
  amounts: string[];
  legalTerms: string[];
  wordCount: number;
}

export class AIAssistantService {
  /**
   * 生成合同条款
   */
  async generateContractClause(params: {
    contractType: string;
    clauseType: string;
    context?: string;
  }): Promise<ContractClause> {
    const { contractType, clauseType, context } = params;

    // 模拟AI生成
    // 实际应用中应调用DeepSeek API
    await new Promise(resolve => setTimeout(resolve, 1000));

    const clauses: Record<string, ContractClause> = {
      '违约责任': {
        title: '违约责任条款',
        content: `一、任何一方违反本合同约定，应当承担违约责任。

二、违约方应当赔偿守约方因此遭受的损失，包括但不限于直接损失、间接损失、合理的律师费、诉讼费等。

三、如一方延迟履行合同义务，每延迟一日，应按照合同总金额的0.5%向守约方支付违约金，但违约金总额不超过合同总金额的20%。

四、如一方根本违约，守约方有权解除合同，并要求违约方支付合同总金额30%的违约金。`,
        category: '违约与救济',
        riskLevel: 'medium',
        suggestions: [
          '建议明确具体的违约情形',
          '违约金比例可根据实际情况调整',
          '建议增加争议解决条款',
        ],
      },
      '保密条款': {
        title: '保密义务条款',
        content: `一、双方对在履行本合同过程中知悉的对方商业秘密、技术秘密及其他保密信息负有保密义务。

二、保密信息包括但不限于：技术资料、商业计划、客户信息、财务数据、经营策略等。

三、保密期限自本合同签订之日起至合同终止后三年。

四、未经对方书面同意，任何一方不得向第三方披露、使用保密信息。

五、违反保密义务的一方应承担违约责任，并赔偿对方因此遭受的全部损失。`,
        category: '保密与知识产权',
        riskLevel: 'high',
        suggestions: [
          '建议明确保密信息的具体范围',
          '建议增加保密信息的使用限制',
          '建议约定保密信息的返还或销毁义务',
        ],
      },
      '争议解决': {
        title: '争议解决条款',
        content: `一、因本合同引起的或与本合同有关的任何争议，双方应首先通过友好协商解决。

二、协商不成的，任何一方均可向合同签订地人民法院提起诉讼。

三、在争议解决期间，除争议事项外，双方应继续履行本合同其他条款。

四、因诉讼产生的合理费用（包括但不限于律师费、诉讼费、保全费等）由败诉方承担。`,
        category: '争议解决',
        riskLevel: 'low',
        suggestions: [
          '可考虑选择仲裁方式解决争议',
          '建议明确管辖法院',
          '建议约定适用法律',
        ],
      },
    };

    return clauses[clauseType] || clauses['违约责任'];
  }

  /**
   * 预测法律风险
   */
  async predictLegalRisk(params: {
    documentType: string;
    content: string;
    context?: string;
  }): Promise<RiskPrediction> {
    const { documentType, content } = params;

    // 模拟AI分析
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 分析风险因素
    const riskFactors: RiskFactor[] = [];

    // 检查关键条款
    if (!content.includes('违约责任') && !content.includes('违约金')) {
      riskFactors.push({
        factor: '缺少违约责任条款',
        severity: 'high',
        description: '合同中未明确约定违约责任，可能导致违约后难以追究责任',
        mitigation: '建议增加详细的违约责任条款，明确违约情形和违约金计算方式',
      });
    }

    if (!content.includes('争议解决') && !content.includes('管辖')) {
      riskFactors.push({
        factor: '缺少争议解决条款',
        severity: 'medium',
        description: '未约定争议解决方式和管辖法院，可能导致诉讼不便',
        mitigation: '建议增加争议解决条款，明确管辖法院或仲裁机构',
      });
    }

    if (!content.includes('保密') && documentType === '技术合同') {
      riskFactors.push({
        factor: '缺少保密条款',
        severity: 'high',
        description: '技术合同中未约定保密义务，可能导致商业秘密泄露',
        mitigation: '建议增加保密条款，明确保密范围、期限和违约责任',
      });
    }

    if (!content.includes('知识产权')) {
      riskFactors.push({
        factor: '知识产权归属不明',
        severity: 'medium',
        description: '未明确约定知识产权归属，可能引发权属争议',
        mitigation: '建议明确约定知识产权的归属和使用权限',
      });
    }

    // 计算风险分数
    const highRisks = riskFactors.filter(r => r.severity === 'high').length;
    const mediumRisks = riskFactors.filter(r => r.severity === 'medium').length;
    const lowRisks = riskFactors.filter(r => r.severity === 'low').length;

    const score = 100 - (highRisks * 25 + mediumRisks * 15 + lowRisks * 5);

    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (score >= 80) riskLevel = 'low';
    else if (score >= 60) riskLevel = 'medium';
    else if (score >= 40) riskLevel = 'high';
    else riskLevel = 'critical';

    return {
      riskLevel,
      score,
      riskFactors,
      recommendations: [
        '建议完善合同条款，补充缺失的重要条款',
        '建议由专业律师审查合同',
        '建议保留合同签订和履行的相关证据',
        '建议定期评估合同履行情况',
      ],
      legalBasis: [
        '《中华人民共和国民法典》第509条',
        '《中华人民共和国民法典》第577条',
        '《中华人民共和国民法典》第584条',
      ],
      precedents: [
        '(2023)京民终123号 - 违约责任认定',
        '(2023)沪民终456号 - 保密义务违反',
      ],
    };
  }

  /**
   * 智能法律问答
   */
  async answerLegalQuestion(question: string): Promise<LegalQA> {
    // 模拟AI回答
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 简单的问答匹配
    const qaDatabase: Record<string, LegalQA> = {
      '违约金': {
        question: '违约金的上限是多少？',
        answer: `根据《中华人民共和国民法典》第585条的规定，约定的违约金低于造成的损失的，人民法院或者仲裁机构可以根据当事人的请求予以增加；约定的违约金过分高于造成的损失的，人民法院或者仲裁机构可以根据当事人的请求予以适当减少。

司法实践中，一般认为违约金超过实际损失的30%即可认定为"过分高于造成的损失"，但这不是绝对标准，需要根据具体案情综合判断。

建议：
1. 违约金约定应合理，一般不超过合同总金额的20%-30%
2. 可以约定违约金的计算方式，如按日计算
3. 建议同时约定损失赔偿条款作为补充`,
        references: [
          '《中华人民共和国民法典》第585条',
          '《最高人民法院关于适用<中华人民共和国合同法>若干问题的解释(二)》第29条',
        ],
        relatedQuestions: [
          '违约金和损失赔偿可以同时主张吗？',
          '如何计算实际损失？',
          '违约金条款无效的情形有哪些？',
        ],
        confidence: 0.95,
      },
      '合同效力': {
        question: '什么情况下合同无效？',
        answer: `根据《中华人民共和国民法典》第144条、第146条、第153条、第154条的规定，以下情况合同无效：

1. 无民事行为能力人订立的合同（第144条）
2. 行为人与相对人以虚假的意思表示订立的合同（第146条）
3. 违反法律、行政法规的强制性规定的合同（第153条）
4. 违背公序良俗的合同（第153条）
5. 行为人与相对人恶意串通，损害他人合法权益的合同（第154条）

无效合同自始无效，不具有法律约束力。

建议：
1. 签订合同前核实对方的民事行为能力
2. 确保合同内容合法合规
3. 避免违反公序良俗
4. 保留合同签订的相关证据`,
        references: [
          '《中华人民共和国民法典》第144条',
          '《中华人民共和国民法典》第146条',
          '《中华人民共和国民法典》第153条',
          '《中华人民共和国民法典》第154条',
        ],
        relatedQuestions: [
          '合同无效后如何处理？',
          '可撤销合同与无效合同的区别？',
          '如何确定强制性规定？',
        ],
        confidence: 0.98,
      },
    };

    // 查找匹配的问题
    for (const [key, qa] of Object.entries(qaDatabase)) {
      if (question.includes(key)) {
        return qa;
      }
    }

    // 默认回答
    return {
      question,
      answer: '抱歉，我暂时无法回答这个问题。建议您咨询专业律师或查阅相关法律法规。',
      references: [],
      relatedQuestions: [
        '如何查找相关法律法规？',
        '如何选择合适的律师？',
      ],
      confidence: 0.3,
    };
  }

  /**
   * 生成文档摘要
   */
  async generateDocumentSummary(params: {
    title: string;
    content: string;
    documentType?: string;
  }): Promise<DocumentSummary> {
    const { title, content, documentType } = params;

    // 模拟AI分析
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 提取关键信息
    const parties: string[] = [];
    const dates: string[] = [];
    const amounts: string[] = [];
    const legalTerms: string[] = [];

    // 提取当事人
    const partyMatches = content.match(/(?:甲方|乙方|原告|被告|申请人|被申请人)[：:](.*?)(?=[，。\n])/g);
    if (partyMatches) {
      parties.push(...partyMatches.map(m => m.replace(/(?:甲方|乙方|原告|被告|申请人|被申请人)[：:]/, '').trim()));
    }

    // 提取日期
    const dateMatches = content.match(/\d{4}年\d{1,2}月\d{1,2}日/g);
    if (dateMatches) {
      dates.push(...dateMatches);
    }

    // 提取金额
    const amountMatches = content.match(/\d+(?:\.\d+)?(?:元|万元|亿元)/g);
    if (amountMatches) {
      amounts.push(...amountMatches);
    }

    // 提取法律术语
    const termMatches = content.match(/《.*?》第.*?条/g);
    if (termMatches) {
      legalTerms.push(...new Set(termMatches));
    }

    // 生成摘要
    const sentences = content.split(/[。！？]/);
    const keyPoints = sentences
      .filter(s => s.length > 20 && s.length < 200)
      .slice(0, 5);

    const summary = `本文档为${documentType || '法律文书'}，标题为"${title}"。` +
      `涉及${parties.length > 0 ? parties.join('、') : '相关当事人'}。` +
      `${amounts.length > 0 ? `涉及金额${amounts[0]}等。` : ''}` +
      `文档共计${content.length}字。`;

    return {
      title,
      summary,
      keyPoints,
      parties: [...new Set(parties)],
      dates: [...new Set(dates)],
      amounts: [...new Set(amounts)],
      legalTerms,
      wordCount: content.length,
    };
  }

  /**
   * 批量生成合同条款
   */
  async batchGenerateClauses(params: {
    contractType: string;
    clauseTypes: string[];
  }): Promise<ContractClause[]> {
    const { contractType, clauseTypes } = params;

    const clauses: ContractClause[] = [];

    for (const clauseType of clauseTypes) {
      const clause = await this.generateContractClause({
        contractType,
        clauseType,
      });
      clauses.push(clause);
    }

    return clauses;
  }

  /**
   * 获取风险等级描述
   */
  getRiskLevelDescription(level: string): string {
    const descriptions: Record<string, string> = {
      low: '风险较低，合同条款基本完善',
      medium: '存在一定风险，建议补充相关条款',
      high: '风险较高，存在重要条款缺失',
      critical: '风险极高，强烈建议由专业律师审查',
    };
    return descriptions[level] || '未知风险等级';
  }

  /**
   * 获取风险等级颜色
   */
  getRiskLevelColor(level: string): string {
    const colors: Record<string, string> = {
      low: 'green',
      medium: 'yellow',
      high: 'orange',
      critical: 'red',
    };
    return colors[level] || 'gray';
  }
}

// 导出单例
export const aiAssistantService = new AIAssistantService();
