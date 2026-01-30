/**
 * 证据管理服务
 * 
 * 功能：
 * 1. 证据分类和标注
 * 2. 证据清单生成
 * 3. 质证材料生成
 * 4. 证据链分析
 */

export interface Evidence {
  id: string;
  name: string;
  type: EvidenceType;
  category: EvidenceCategory;
  description: string;
  source: string;
  obtainDate: string;
  obtainMethod: string;
  relevance: 'high' | 'medium' | 'low';
  authenticity: 'verified' | 'unverified' | 'disputed';
  legality: 'legal' | 'questionable' | 'illegal';
  tags: string[];
  relatedFacts: string[];
  notes: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
}

export type EvidenceType = 
  | 'documentary' // 书证
  | 'physical' // 物证
  | 'audio_visual' // 视听资料
  | 'electronic' // 电子数据
  | 'witness' // 证人证言
  | 'statement' // 当事人陈述
  | 'appraisal' // 鉴定意见
  | 'inspection' // 勘验笔录
  | 'other'; // 其他

export type EvidenceCategory =
  | 'contract' // 合同类
  | 'financial' // 财务类
  | 'communication' // 通讯类
  | 'identity' // 身份类
  | 'property' // 财产类
  | 'behavior' // 行为类
  | 'other'; // 其他

export interface EvidenceList {
  caseNumber: string;
  caseName: string;
  party: string; // 提交方
  generateDate: string;
  evidences: Evidence[];
  summary: {
    totalCount: number;
    byType: Record<EvidenceType, number>;
    byCategory: Record<EvidenceCategory, number>;
  };
}

export interface CrossExaminationMaterial {
  evidenceId: string;
  evidenceName: string;
  opponentClaim: string;
  ourPosition: 'admit' | 'deny' | 'partial_admit' | 'no_comment';
  reasons: string[];
  counterEvidence?: string[];
  legalBasis?: string[];
  notes: string;
}

export interface EvidenceChain {
  fact: string; // 待证事实
  evidences: Evidence[];
  strength: 'strong' | 'medium' | 'weak';
  gaps: string[]; // 证据链缺口
  suggestions: string[]; // 补强建议
}

export class EvidenceManagementService {
  /**
   * 分类证据
   */
  classifyEvidence(evidence: Partial<Evidence>): { type: EvidenceType; category: EvidenceCategory; confidence: number } {
    const { name = '', description = '', fileType = '' } = evidence;
    const text = `${name} ${description}`.toLowerCase();

    // 证据类型识别
    let type: EvidenceType = 'other';
    let typeConfidence = 0.5;

    if (fileType && ['jpg', 'jpeg', 'png', 'mp4', 'avi', 'mp3', 'wav'].includes(fileType.toLowerCase())) {
      type = 'audio_visual';
      typeConfidence = 0.9;
    } else if (fileType && ['pdf', 'doc', 'docx', 'txt'].includes(fileType.toLowerCase())) {
      type = 'documentary';
      typeConfidence = 0.7;
    } else if (text.includes('电子') || text.includes('邮件') || text.includes('微信') || text.includes('短信')) {
      type = 'electronic';
      typeConfidence = 0.85;
    } else if (text.includes('证人') || text.includes('证言')) {
      type = 'witness';
      typeConfidence = 0.9;
    } else if (text.includes('鉴定') || text.includes('评估')) {
      type = 'appraisal';
      typeConfidence = 0.9;
    } else if (text.includes('勘验') || text.includes('现场')) {
      type = 'inspection';
      typeConfidence = 0.85;
    }

    // 证据类别识别
    let category: EvidenceCategory = 'other';
    let categoryConfidence = 0.5;

    if (text.includes('合同') || text.includes('协议') || text.includes('约定')) {
      category = 'contract';
      categoryConfidence = 0.9;
    } else if (text.includes('发票') || text.includes('收据') || text.includes('转账') || text.includes('银行') || text.includes('财务')) {
      category = 'financial';
      categoryConfidence = 0.9;
    } else if (text.includes('微信') || text.includes('短信') || text.includes('邮件') || text.includes('通话')) {
      category = 'communication';
      categoryConfidence = 0.9;
    } else if (text.includes('身份证') || text.includes('营业执照') || text.includes('户口') || text.includes('护照')) {
      category = 'identity';
      categoryConfidence = 0.9;
    } else if (text.includes('房产') || text.includes('车辆') || text.includes('财产') || text.includes('资产')) {
      category = 'property';
      categoryConfidence = 0.85;
    }

    const confidence = (typeConfidence + categoryConfidence) / 2;

    return { type, category, confidence };
  }

  /**
   * 生成证据清单
   */
  generateEvidenceList(params: {
    caseNumber: string;
    caseName: string;
    party: string;
    evidences: Evidence[];
  }): EvidenceList {
    const { caseNumber, caseName, party, evidences } = params;

    // 统计信息
    const byType: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    evidences.forEach(evidence => {
      byType[evidence.type] = (byType[evidence.type] || 0) + 1;
      byCategory[evidence.category] = (byCategory[evidence.category] || 0) + 1;
    });

    return {
      caseNumber,
      caseName,
      party,
      generateDate: new Date().toISOString(),
      evidences: evidences.sort((a, b) => {
        // 按类型和序号排序
        if (a.type !== b.type) {
          return a.type.localeCompare(b.type);
        }
        return a.name.localeCompare(b.name);
      }),
      summary: {
        totalCount: evidences.length,
        byType: byType as Record<EvidenceType, number>,
        byCategory: byCategory as Record<EvidenceCategory, number>,
      },
    };
  }

  /**
   * 生成质证材料
   */
  generateCrossExaminationMaterial(params: {
    evidence: Evidence;
    opponentClaim: string;
    ourAnalysis: string;
  }): CrossExaminationMaterial {
    const { evidence, opponentClaim, ourAnalysis } = params;

    // 分析我方立场
    let position: CrossExaminationMaterial['ourPosition'] = 'no_comment';
    const analysisLower = ourAnalysis.toLowerCase();

    if (analysisLower.includes('认可') || analysisLower.includes('承认') || analysisLower.includes('同意')) {
      position = 'admit';
    } else if (analysisLower.includes('否认') || analysisLower.includes('不认可') || analysisLower.includes('反对')) {
      position = 'deny';
    } else if (analysisLower.includes('部分') || analysisLower.includes('有条件')) {
      position = 'partial_admit';
    }

    // 提取理由
    const reasons: string[] = [];
    
    // 真实性质疑
    if (evidence.authenticity === 'disputed') {
      reasons.push('对该证据的真实性存在异议');
    }
    
    // 合法性质疑
    if (evidence.legality === 'questionable' || evidence.legality === 'illegal') {
      reasons.push('该证据的取得方式存在合法性问题');
    }
    
    // 关联性质疑
    if (evidence.relevance === 'low') {
      reasons.push('该证据与本案待证事实缺乏关联性');
    }

    // 从分析中提取更多理由
    const sentences = ourAnalysis.split(/[。！？]/);
    sentences.forEach(sentence => {
      if (sentence.trim() && 
          (sentence.includes('因为') || 
           sentence.includes('由于') || 
           sentence.includes('理由') ||
           sentence.includes('原因'))) {
        reasons.push(sentence.trim());
      }
    });

    return {
      evidenceId: evidence.id,
      evidenceName: evidence.name,
      opponentClaim,
      ourPosition: position,
      reasons: reasons.length > 0 ? reasons : ['待补充具体理由'],
      counterEvidence: [],
      legalBasis: [],
      notes: ourAnalysis,
    };
  }

  /**
   * 分析证据链
   */
  analyzeEvidenceChain(params: {
    fact: string;
    evidences: Evidence[];
  }): EvidenceChain {
    const { fact, evidences } = params;

    // 筛选相关证据
    const relevantEvidences = evidences.filter(e => 
      e.relatedFacts.some(f => f.includes(fact) || fact.includes(f)) ||
      e.relevance === 'high'
    );

    // 评估证据链强度
    let strength: EvidenceChain['strength'] = 'weak';
    const gaps: string[] = [];
    const suggestions: string[] = [];

    if (relevantEvidences.length === 0) {
      strength = 'weak';
      gaps.push('缺少直接证据');
      suggestions.push('需要收集与该事实直接相关的证据');
    } else if (relevantEvidences.length === 1) {
      strength = 'weak';
      gaps.push('证据数量不足，缺少相互印证');
      suggestions.push('建议补充其他类型的证据以形成证据链');
    } else {
      // 检查证据类型多样性
      const types = new Set(relevantEvidences.map(e => e.type));
      
      if (types.size === 1) {
        strength = 'medium';
        gaps.push('证据类型单一');
        suggestions.push('建议补充其他类型的证据以增强证明力');
      } else if (types.size >= 3) {
        strength = 'strong';
      } else {
        strength = 'medium';
      }

      // 检查证据真实性
      const unverified = relevantEvidences.filter(e => e.authenticity !== 'verified');
      if (unverified.length > 0) {
        gaps.push(`有${unverified.length}份证据未经核实`);
        suggestions.push('建议对未核实的证据进行公证或鉴定');
      }

      // 检查证据合法性
      const questionable = relevantEvidences.filter(e => e.legality !== 'legal');
      if (questionable.length > 0) {
        gaps.push(`有${questionable.length}份证据存在合法性问题`);
        suggestions.push('建议审查证据取得方式的合法性');
        if (strength === 'strong') strength = 'medium';
      }
    }

    // 检查关键证据类型
    const hasDocumentary = relevantEvidences.some(e => e.type === 'documentary');
    const hasElectronic = relevantEvidences.some(e => e.type === 'electronic');
    const hasWitness = relevantEvidences.some(e => e.type === 'witness');

    if (!hasDocumentary && fact.includes('合同')) {
      gaps.push('缺少书面合同等书证');
      suggestions.push('建议提供书面合同或协议');
    }

    if (!hasElectronic && (fact.includes('通知') || fact.includes('沟通'))) {
      gaps.push('缺少电子通讯记录');
      suggestions.push('建议提供微信、邮件等电子证据');
    }

    if (!hasWitness && fact.includes('口头')) {
      gaps.push('缺少证人证言');
      suggestions.push('建议提供相关证人证言');
    }

    return {
      fact,
      evidences: relevantEvidences,
      strength,
      gaps: gaps.length > 0 ? gaps : ['证据链完整'],
      suggestions: suggestions.length > 0 ? suggestions : ['当前证据链较为完整，建议继续保持'],
    };
  }

  /**
   * 获取证据类型中文名称
   */
  getEvidenceTypeName(type: EvidenceType): string {
    const names: Record<EvidenceType, string> = {
      documentary: '书证',
      physical: '物证',
      audio_visual: '视听资料',
      electronic: '电子数据',
      witness: '证人证言',
      statement: '当事人陈述',
      appraisal: '鉴定意见',
      inspection: '勘验笔录',
      other: '其他',
    };
    return names[type] || type;
  }

  /**
   * 获取证据类别中文名称
   */
  getEvidenceCategoryName(category: EvidenceCategory): string {
    const names: Record<EvidenceCategory, string> = {
      contract: '合同类',
      financial: '财务类',
      communication: '通讯类',
      identity: '身份类',
      property: '财产类',
      behavior: '行为类',
      other: '其他',
    };
    return names[category] || category;
  }

  /**
   * 导出证据清单为Markdown格式
   */
  exportEvidenceListToMarkdown(list: EvidenceList): string {
    let markdown = `# 证据清单\n\n`;
    markdown += `**案号：** ${list.caseNumber}\n\n`;
    markdown += `**案由：** ${list.caseName}\n\n`;
    markdown += `**提交方：** ${list.party}\n\n`;
    markdown += `**生成日期：** ${new Date(list.generateDate).toLocaleDateString('zh-CN')}\n\n`;
    markdown += `---\n\n`;

    markdown += `## 证据统计\n\n`;
    markdown += `- **证据总数：** ${list.summary.totalCount}份\n\n`;

    markdown += `### 按类型统计\n\n`;
    Object.entries(list.summary.byType).forEach(([type, count]) => {
      markdown += `- ${this.getEvidenceTypeName(type as EvidenceType)}: ${count}份\n`;
    });
    markdown += `\n`;

    markdown += `### 按类别统计\n\n`;
    Object.entries(list.summary.byCategory).forEach(([category, count]) => {
      markdown += `- ${this.getEvidenceCategoryName(category as EvidenceCategory)}: ${count}份\n`;
    });
    markdown += `\n`;

    markdown += `---\n\n`;
    markdown += `## 证据明细\n\n`;

    list.evidences.forEach((evidence, index) => {
      markdown += `### 证据${index + 1}：${evidence.name}\n\n`;
      markdown += `| 项目 | 内容 |\n`;
      markdown += `|------|------|\n`;
      markdown += `| **证据类型** | ${this.getEvidenceTypeName(evidence.type)} |\n`;
      markdown += `| **证据类别** | ${this.getEvidenceCategoryName(evidence.category)} |\n`;
      markdown += `| **证据来源** | ${evidence.source} |\n`;
      markdown += `| **取得日期** | ${evidence.obtainDate} |\n`;
      markdown += `| **取得方式** | ${evidence.obtainMethod} |\n`;
      markdown += `| **关联性** | ${evidence.relevance === 'high' ? '高' : evidence.relevance === 'medium' ? '中' : '低'} |\n`;
      markdown += `| **真实性** | ${evidence.authenticity === 'verified' ? '已核实' : evidence.authenticity === 'unverified' ? '未核实' : '存疑'} |\n`;
      markdown += `| **合法性** | ${evidence.legality === 'legal' ? '合法' : evidence.legality === 'questionable' ? '存疑' : '非法'} |\n`;
      
      if (evidence.description) {
        markdown += `\n**证据说明：** ${evidence.description}\n`;
      }
      
      if (evidence.relatedFacts.length > 0) {
        markdown += `\n**待证事实：**\n`;
        evidence.relatedFacts.forEach(fact => {
          markdown += `- ${fact}\n`;
        });
      }
      
      if (evidence.tags.length > 0) {
        markdown += `\n**标签：** ${evidence.tags.join('、')}\n`;
      }
      
      if (evidence.notes) {
        markdown += `\n**备注：** ${evidence.notes}\n`;
      }
      
      markdown += `\n---\n\n`;
    });

    return markdown;
  }

  /**
   * 导出质证意见为Markdown格式
   */
  exportCrossExaminationToMarkdown(materials: CrossExaminationMaterial[]): string {
    let markdown = `# 质证意见\n\n`;
    markdown += `**生成日期：** ${new Date().toLocaleDateString('zh-CN')}\n\n`;
    markdown += `---\n\n`;

    materials.forEach((material, index) => {
      markdown += `## ${index + 1}. ${material.evidenceName}\n\n`;
      
      markdown += `**对方主张：** ${material.opponentClaim}\n\n`;
      
      const positionText = {
        admit: '认可',
        deny: '不认可',
        partial_admit: '部分认可',
        no_comment: '无异议',
      };
      markdown += `**我方意见：** ${positionText[material.ourPosition]}\n\n`;
      
      if (material.reasons.length > 0) {
        markdown += `**理由：**\n\n`;
        material.reasons.forEach((reason, idx) => {
          markdown += `${idx + 1}. ${reason}\n`;
        });
        markdown += `\n`;
      }
      
      if (material.counterEvidence && material.counterEvidence.length > 0) {
        markdown += `**反驳证据：**\n\n`;
        material.counterEvidence.forEach((evidence, idx) => {
          markdown += `${idx + 1}. ${evidence}\n`;
        });
        markdown += `\n`;
      }
      
      if (material.legalBasis && material.legalBasis.length > 0) {
        markdown += `**法律依据：**\n\n`;
        material.legalBasis.forEach((basis, idx) => {
          markdown += `${idx + 1}. ${basis}\n`;
        });
        markdown += `\n`;
      }
      
      if (material.notes) {
        markdown += `**补充说明：** ${material.notes}\n\n`;
      }
      
      markdown += `---\n\n`;
    });

    return markdown;
  }
}

// 导出单例
export const evidenceManagementService = new EvidenceManagementService();
