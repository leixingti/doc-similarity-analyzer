/**
 * 合同智能审核引擎
 * 场景1：复杂商事合同起草/审核
 */

export interface ContractReviewResult {
  // 必备条款检查
  missingClauses: MissingClause[];
  // 模糊表述识别
  ambiguousTerms: AmbiguousTerm[];
  // 风险条款标注
  riskClauses: RiskClause[];
  // 条款冲突检测
  conflicts: ClauseConflict[];
  // 合规性问题
  complianceIssues: ComplianceIssue[];
  // 优化建议
  suggestions: Suggestion[];
  // 总体评分
  overallScore: number;
}

export interface MissingClause {
  title: string;
  description: string;
  importance: 'critical' | 'important' | 'recommended';
  template?: string;
  relatedLaws?: string[];
}

export interface AmbiguousTerm {
  term: string;
  context: string;
  lineNumber: number;
  reason: string;
  suggestion: string;
}

export interface RiskClause {
  title: string;
  content: string;
  lineNumber: number;
  riskLevel: 'high' | 'medium' | 'low';
  riskType: '无限责任' | '单方解除权' | '不对等条款' | '模糊约定' | '其他';
  description: string;
  suggestion: string;
}

export interface ClauseConflict {
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
  conflictType: '逻辑冲突' | '内容矛盾' | '时间冲突' | '金额冲突';
  description: string;
  suggestion: string;
}

export interface ComplianceIssue {
  clause: string;
  lineNumber: number;
  law: string;
  description: string;
  severity: 'critical' | 'warning';
  suggestion: string;
}

export interface Suggestion {
  type: 'add' | 'modify' | 'delete';
  target: string;
  reason: string;
  content?: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * 合同类型配置
 */
export const CONTRACT_TYPES = {
  '商事合同': {
    requiredClauses: [
      {
        title: '合同标的',
        keywords: ['标的', '货物', '服务', '工程', '产品'],
        importance: 'critical' as const,
        template: '本合同标的为：【具体描述标的物或服务内容】'
      },
      {
        title: '价款或报酬',
        keywords: ['价款', '报酬', '金额', '费用', '价格'],
        importance: 'critical' as const,
        template: '合同总价款为人民币【金额】元（大写：【大写金额】）'
      },
      {
        title: '履行期限',
        keywords: ['期限', '交付', '完成时间', '履行时间'],
        importance: 'critical' as const,
        template: '履行期限：自【起始日期】至【终止日期】'
      },
      {
        title: '履行地点和方式',
        keywords: ['履行地点', '交付地点', '履行方式'],
        importance: 'important' as const,
        template: '履行地点：【具体地点】；履行方式：【具体方式】'
      },
      {
        title: '违约责任',
        keywords: ['违约', '违约责任', '违约金', '赔偿'],
        importance: 'critical' as const,
        template: '任何一方违约，应向守约方支付违约金【金额或比例】，并赔偿因此造成的全部损失'
      },
      {
        title: '争议解决',
        keywords: ['争议', '仲裁', '诉讼', '管辖'],
        importance: 'important' as const,
        template: '因本合同引起的争议，由【仲裁委员会/法院】管辖'
      }
    ],
    riskKeywords: [
      {
        pattern: /无限.*?责任|不限.*?责任/gi,
        riskType: '无限责任' as const,
        description: '条款约定了无限责任，可能导致承担过重的责任'
      },
      {
        pattern: /单方.*?解除|任意.*?解除/gi,
        riskType: '单方解除权' as const,
        description: '对方享有单方解除权，可能导致合同不稳定'
      },
      {
        pattern: /不得.*?追究|免除.*?责任/gi,
        riskType: '不对等条款' as const,
        description: '存在免责或限制责任条款，可能对己方不利'
      }
    ]
  },
  '劳动合同': {
    requiredClauses: [
      {
        title: '工作内容和工作地点',
        keywords: ['工作内容', '岗位', '工作地点'],
        importance: 'critical' as const,
        template: '工作内容：【岗位名称及职责】；工作地点：【具体地点】'
      },
      {
        title: '工作时间和休息休假',
        keywords: ['工作时间', '休息', '休假'],
        importance: 'critical' as const,
        template: '工作时间：【具体工作时间】；休息休假：按国家规定执行'
      },
      {
        title: '劳动报酬',
        keywords: ['工资', '报酬', '薪资'],
        importance: 'critical' as const,
        template: '月工资为人民币【金额】元，每月【日期】发放'
      },
      {
        title: '社会保险',
        keywords: ['社保', '社会保险', '五险一金'],
        importance: 'critical' as const,
        template: '用人单位依法为劳动者缴纳社会保险'
      },
      {
        title: '劳动保护和劳动条件',
        keywords: ['劳动保护', '劳动条件', '安全'],
        importance: 'important' as const,
        template: '用人单位为劳动者提供必要的劳动保护和劳动条件'
      }
    ],
    riskKeywords: [
      {
        pattern: /不缴纳.*?社保|自行缴纳.*?社保/gi,
        riskType: '不对等条款' as const,
        description: '约定不缴纳社保或由劳动者自行缴纳，违反法律强制性规定'
      },
      {
        pattern: /自愿放弃|不要求.*?加班费/gi,
        riskType: '不对等条款' as const,
        description: '约定放弃法定权利，可能无效'
      }
    ]
  },
  '房地产合同': {
    requiredClauses: [
      {
        title: '房屋基本信息',
        keywords: ['房屋', '位置', '面积', '产权证号'],
        importance: 'critical' as const,
        template: '房屋坐落于【地址】，建筑面积【面积】平方米，产权证号【证号】'
      },
      {
        title: '交易价款',
        keywords: ['价款', '总价', '房价'],
        importance: 'critical' as const,
        template: '房屋总价款为人民币【金额】元（大写：【大写金额】）'
      },
      {
        title: '付款方式',
        keywords: ['付款', '首付', '按揭', '贷款'],
        importance: 'critical' as const,
        template: '买方应于【日期】前支付首付款【金额】元'
      },
      {
        title: '交房时间',
        keywords: ['交房', '交付', '交屋'],
        importance: 'critical' as const,
        template: '卖方应于【日期】前将房屋交付买方'
      },
      {
        title: '产权过户',
        keywords: ['过户', '产权转移', '办理过户'],
        importance: 'important' as const,
        template: '双方应于【日期】前共同办理产权过户手续'
      }
    ],
    riskKeywords: [
      {
        pattern: /不办理.*?过户|不转移.*?产权/gi,
        riskType: '不对等条款' as const,
        description: '约定不办理产权过户，存在重大法律风险'
      },
      {
        pattern: /一房多卖|重复抵押/gi,
        riskType: '其他' as const,
        description: '可能存在一房多卖或重复抵押风险'
      }
    ]
  },
  '金融合同': {
    requiredClauses: [
      {
        title: '借款金额',
        keywords: ['借款', '贷款', '金额', '额度'],
        importance: 'critical' as const,
        template: '借款金额为人民币【金额】元（大写：【大写金额】）'
      },
      {
        title: '利率',
        keywords: ['利率', '利息', '费率'],
        importance: 'critical' as const,
        template: '年利率为【百分比】%，按【计息方式】计息'
      },
      {
        title: '借款期限',
        keywords: ['期限', '借款期限', '还款期限'],
        importance: 'critical' as const,
        template: '借款期限为【期限】，自【起始日】至【结束日】'
      },
      {
        title: '还款方式',
        keywords: ['还款', '还本付息', '分期'],
        importance: 'critical' as const,
        template: '还款方式为【还款方式】，每月【日期】还款'
      },
      {
        title: '担保方式',
        keywords: ['担保', '抵押', '质押', '保证'],
        importance: 'important' as const,
        template: '担保方式为【担保方式】，担保物为【担保物】'
      }
    ],
    riskKeywords: [
      {
        pattern: /高利贷|利率.*?36%/gi,
        riskType: '不对等条款' as const,
        description: '利率超过法定上限，超过部分可能无效'
      },
      {
        pattern: /复利|利滚利/gi,
        riskType: '其他' as const,
        description: '复利约定可能存在法律风险'
      }
    ]
  },
  '互联网合同': {
    requiredClauses: [
      {
        title: '服务内容',
        keywords: ['服务', '功能', '产品'],
        importance: 'critical' as const,
        template: '服务内容包括：【具体服务内容】'
      },
      {
        title: '数据安全与隐私',
        keywords: ['数据', '隐私', '个人信息'],
        importance: 'critical' as const,
        template: '双方应遵守《个人信息保护法》和《数据安全法》的相关规定'
      },
      {
        title: '知识产权',
        keywords: ['知识产权', '著作权', '专利'],
        importance: 'important' as const,
        template: '【知识产权归属约定】'
      },
      {
        title: '服务水平协议(SLA)',
        keywords: ['SLA', '服务水平', '可用性', '响应时间'],
        importance: 'important' as const,
        template: '服务可用性不低于【百分比】%，响应时间不超过【时间】'
      }
    ],
    riskKeywords: [
      {
        pattern: /不承担.*?数据.*?责任|数据.*?丢失.*?免责/gi,
        riskType: '不对等条款' as const,
        description: '数据丢失免责条款可能对用户不利'
      },
      {
        pattern: /单方.*?修改|任意.*?修改/gi,
        riskType: '单方解除权' as const,
        description: '单方修改条款可能导致合同不稳定'
      }
    ]
  },
  '制造业合同': {
    requiredClauses: [
      {
        title: '产品规格',
        keywords: ['规格', '标准', '技术参数'],
        importance: 'critical' as const,
        template: '产品应符合【标准】，具体规格为【规格】'
      },
      {
        title: '质量标准',
        keywords: ['质量', '验收', '检验'],
        importance: 'critical' as const,
        template: '产品质量应符合【质量标准】，验收方式为【验收方式】'
      },
      {
        title: '交货期限',
        keywords: ['交货', '交付', '交货期'],
        importance: 'critical' as const,
        template: '交货期限为【期限】，交货地点为【地点】'
      },
      {
        title: '质保期',
        keywords: ['质保', '保修', '保证期'],
        importance: 'important' as const,
        template: '质保期为【期限】，自验收合格之日起计算'
      }
    ],
    riskKeywords: [
      {
        pattern: /不负责.*?质量|免除.*?质量.*?责任/gi,
        riskType: '不对等条款' as const,
        description: '质量问题免责条款可能对买方不利'
      }
    ]
  },
  '建筑工程合同': {
    requiredClauses: [
      {
        title: '工程范围',
        keywords: ['工程范围', '工程内容', '施工范围'],
        importance: 'critical' as const,
        template: '工程范围包括：【具体工程内容】'
      },
      {
        title: '工期',
        keywords: ['工期', '工程期限', '竣工日期'],
        importance: 'critical' as const,
        template: '工期为【天数】日历天，自【开工日】至【竣工日】'
      },
      {
        title: '工程造价',
        keywords: ['造价', '工程款', '合同价款'],
        importance: 'critical' as const,
        template: '工程总造价为人民币【金额】元（大写：【大写金额】）'
      },
      {
        title: '工程质量',
        keywords: ['质量', '质量标准', '验收标准'],
        importance: 'critical' as const,
        template: '工程质量应符合【质量标准】，验收标准为【验收标准】'
      },
      {
        title: '安全生产',
        keywords: ['安全', '安全生产', '安全措施'],
        importance: 'important' as const,
        template: '承包人应采取必要的安全防护措施，确保施工安全'
      }
    ],
    riskKeywords: [
      {
        pattern: /工期顺延.*?不赔|不承担.*?延期.*?责任/gi,
        riskType: '不对等条款' as const,
        description: '工期延误免责条款可能对发包方不利'
      },
      {
        pattern: /不负责.*?安全事故/gi,
        riskType: '不对等条款' as const,
        description: '安全事故免责条款可能违反法律强制性规定'
      }
    ]
  },
  '知识产权合同': {
    requiredClauses: [
      {
        title: '知识产权内容',
        keywords: ['专利', '商标', '著作权', '商业秘密'],
        importance: 'critical' as const,
        template: '知识产权内容包括：【具体内容】'
      },
      {
        title: '权利范围',
        keywords: ['权利', '使用范围', '授权范围'],
        importance: 'critical' as const,
        template: '授权范围为：【具体范围】'
      },
      {
        title: '授权方式',
        keywords: ['授权', '独占许可', '普通许可'],
        importance: 'critical' as const,
        template: '授权方式为【独占/普通】许可'
      },
      {
        title: '许可费用',
        keywords: ['许可费', '特许权使用费', '费用'],
        importance: 'important' as const,
        template: '许可费用为人民币【金额】元'
      },
      {
        title: '保密义务',
        keywords: ['保密', '保密义务', '商业秘密'],
        importance: 'important' as const,
        template: '双方应对商业秘密承担保密义务，保密期限为【期限】'
      }
    ],
    riskKeywords: [
      {
        pattern: /无限.*?授权|永久.*?使用/gi,
        riskType: '不对等条款' as const,
        description: '无限期授权可能对授权方不利'
      },
      {
        pattern: /不承担.*?侵权.*?责任/gi,
        riskType: '不对等条款' as const,
        description: '侵权责任免除条款可能对受让方不利'
      }
    ]
  },
  '劳务合同': {
    requiredClauses: [
      {
        title: '劳务内容',
        keywords: ['劳务', '工作内容', '服务内容'],
        importance: 'critical' as const,
        template: '劳务内容为：【具体劳务内容】'
      },
      {
        title: '劳务报酬',
        keywords: ['报酬', '工资', '费用'],
        importance: 'critical' as const,
        template: '劳务报酬为人民币【金额】元，按【支付方式】支付'
      },
      {
        title: '劳务期限',
        keywords: ['期限', '工作时间'],
        importance: 'critical' as const,
        template: '劳务期限为【期限】，自【起始日】至【结束日】'
      },
      {
        title: '劳动保护',
        keywords: ['劳动保护', '安全', '保险'],
        importance: 'important' as const,
        template: '发包方应为劳务人员提供必要的劳动保护和安全保障'
      }
    ],
    riskKeywords: [
      {
        pattern: /不购买.*?保险|自行.*?保险/gi,
        riskType: '不对等条款' as const,
        description: '不购买保险可能存在法律风险'
      }
    ]
  },
  '服务合同': {
    requiredClauses: [
      {
        title: '服务内容',
        keywords: ['服务', '服务内容', '服务范围'],
        importance: 'critical' as const,
        template: '服务内容包括：【具体服务内容】'
      },
      {
        title: '服务标准',
        keywords: ['服务标准', '服务质量', '服务要求'],
        importance: 'important' as const,
        template: '服务应符合【服务标准】'
      },
      {
        title: '服务费用',
        keywords: ['费用', '服务费', '价款'],
        importance: 'critical' as const,
        template: '服务费用为人民币【金额】元'
      },
      {
        title: '服务期限',
        keywords: ['服务期限', '服务时间'],
        importance: 'critical' as const,
        template: '服务期限为【期限】'
      }
    ],
    riskKeywords: [
      {
        pattern: /不保证.*?服务.*?质量/gi,
        riskType: '不对等条款' as const,
        description: '服务质量不保证条款可能对客户不利'
      }
    ]
  }
};

/**
 * 模糊表述模式
 */
const AMBIGUOUS_PATTERNS = [
  {
    pattern: /尽快|尽早|及时|立即|马上/gi,
    reason: '时间表述模糊，容易产生争议',
    suggestion: '建议明确具体的时间期限，如"3个工作日内"、"收到通知后24小时内"等'
  },
  {
    pattern: /适当|合理|相当|一定/gi,
    reason: '程度表述模糊，标准不明确',
    suggestion: '建议明确具体的标准或数值范围'
  },
  {
    pattern: /可能|或许|大概|约|左右/gi,
    reason: '不确定性表述，缺乏明确性',
    suggestion: '建议使用确定性表述，或明确约定误差范围'
  },
  {
    pattern: /相关|有关|相应/gi,
    reason: '指代不明确，容易产生歧义',
    suggestion: '建议明确具体指代的内容'
  },
  {
    pattern: /等|之类|诸如此类/gi,
    reason: '列举不完整，范围不明确',
    suggestion: '建议完整列举或明确"等"的范围'
  }
];

/**
 * 审核合同
 */
export async function reviewContract(
  content: string,
  contractType: keyof typeof CONTRACT_TYPES = '商事合同'
): Promise<ContractReviewResult> {
  const lines = content.split('\n');
  const config = CONTRACT_TYPES[contractType];

  // 1. 检查必备条款
  const missingClauses = checkRequiredClauses(content, config.requiredClauses);

  // 2. 识别模糊表述
  const ambiguousTerms = findAmbiguousTerms(lines);

  // 3. 标注风险条款
  const riskClauses = findRiskClauses(lines, config.riskKeywords);

  // 4. 检测条款冲突
  const conflicts = detectConflicts(lines);

  // 5. 检查合规性
  const complianceIssues = checkCompliance(lines, contractType);

  // 6. 生成优化建议
  const suggestions = generateSuggestions(
    missingClauses,
    ambiguousTerms,
    riskClauses,
    conflicts,
    complianceIssues
  );

  // 7. 计算总体评分
  const overallScore = calculateScore(
    missingClauses,
    ambiguousTerms,
    riskClauses,
    conflicts,
    complianceIssues
  );

  return {
    missingClauses,
    ambiguousTerms,
    riskClauses,
    conflicts,
    complianceIssues,
    suggestions,
    overallScore
  };
}

/**
 * 检查必备条款
 */
function checkRequiredClauses(
  content: string,
  requiredClauses: typeof CONTRACT_TYPES['商事合同']['requiredClauses']
): MissingClause[] {
  const missing: MissingClause[] = [];

  for (const clause of requiredClauses) {
    const found = clause.keywords.some(keyword => 
      content.includes(keyword)
    );

    if (!found) {
      missing.push({
        title: clause.title,
        description: `合同中未发现"${clause.title}"相关条款`,
        importance: clause.importance,
        template: clause.template,
        relatedLaws: []
      });
    }
  }

  return missing;
}

/**
 * 识别模糊表述
 */
function findAmbiguousTerms(lines: string[]): AmbiguousTerm[] {
  const ambiguous: AmbiguousTerm[] = [];

  lines.forEach((line, index) => {
    for (const pattern of AMBIGUOUS_PATTERNS) {
      const matches = line.match(pattern.pattern);
      if (matches) {
        matches.forEach(match => {
          ambiguous.push({
            term: match,
            context: line,
            lineNumber: index + 1,
            reason: pattern.reason,
            suggestion: pattern.suggestion
          });
        });
      }
    }
  });

  return ambiguous;
}

/**
 * 标注风险条款
 */
function findRiskClauses(
  lines: string[],
  riskKeywords: typeof CONTRACT_TYPES['商事合同']['riskKeywords']
): RiskClause[] {
  const risks: RiskClause[] = [];

  lines.forEach((line, index) => {
    for (const risk of riskKeywords) {
      const matches = line.match(risk.pattern);
      if (matches) {
        risks.push({
          title: risk.riskType,
          content: line,
          lineNumber: index + 1,
          riskLevel: 'high',
          riskType: risk.riskType,
          description: risk.description,
          suggestion: '建议重新评估该条款，考虑修改或删除'
        });
      }
    }
  });

  return risks;
}

/**
 * 检测条款冲突
 */
function detectConflicts(lines: string[]): ClauseConflict[] {
  const conflicts: ClauseConflict[] = [];

  // 检测金额冲突
  const amountPattern = /(?:人民币|美元)?\s*\d+(?:,\d{3})*(?:\.\d+)?\s*(?:元|万元|亿元|USD)/gi;
  const amounts: Array<{ amount: string; line: string; lineNumber: number }> = [];

  lines.forEach((line, index) => {
    const matches = line.match(amountPattern);
    if (matches) {
      matches.forEach(match => {
        amounts.push({ amount: match, line, lineNumber: index + 1 });
      });
    }
  });

  // 检测日期冲突
  const datePattern = /\d{4}年\d{1,2}月\d{1,2}日/g;
  const dates: Array<{ date: string; line: string; lineNumber: number }> = [];

  lines.forEach((line, index) => {
    const matches = line.match(datePattern);
    if (matches) {
      matches.forEach(match => {
        dates.push({ date: match, line, lineNumber: index + 1 });
      });
    }
  });

  // 简单的冲突检测逻辑（实际应用中需要更复杂的语义分析）
  // 这里只是示例，检测是否有多个不同的总金额
  const totalAmountPattern = /(?:总|合同).*?(?:价款|金额|费用)/i;
  const totalAmounts = amounts.filter(a => totalAmountPattern.test(a.line));
  
  if (totalAmounts.length > 1) {
    const uniqueAmounts = [...new Set(totalAmounts.map(a => a.amount))];
    if (uniqueAmounts.length > 1) {
      conflicts.push({
        clause1: {
          title: '合同总价款',
          content: totalAmounts[0].line,
          lineNumber: totalAmounts[0].lineNumber
        },
        clause2: {
          title: '合同总价款',
          content: totalAmounts[1].line,
          lineNumber: totalAmounts[1].lineNumber
        },
        conflictType: '金额冲突',
        description: '合同中出现了多个不同的总价款金额',
        suggestion: '请核实并统一合同总价款'
      });
    }
  }

  return conflicts;
}

/**
 * 检查合规性
 */
function checkCompliance(lines: string[], contractType: string): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];

  // 检查是否有违反法律强制性规定的条款
  const illegalPatterns = [
    {
      pattern: /排除.*?法律适用|不适用.*?法律/gi,
      law: '《合同法》第52条',
      description: '约定排除法律适用，可能导致合同无效',
      severity: 'critical' as const
    },
    {
      pattern: /免除.*?故意|免除.*?重大过失/gi,
      law: '《合同法》第53条',
      description: '免除故意或重大过失责任的条款无效',
      severity: 'critical' as const
    }
  ];

  lines.forEach((line, index) => {
    for (const illegal of illegalPatterns) {
      if (illegal.pattern.test(line)) {
        issues.push({
          clause: line,
          lineNumber: index + 1,
          law: illegal.law,
          description: illegal.description,
          severity: illegal.severity,
          suggestion: '建议删除或修改该条款，以符合法律规定'
        });
      }
    }
  });

  return issues;
}

/**
 * 生成优化建议
 */
function generateSuggestions(
  missingClauses: MissingClause[],
  ambiguousTerms: AmbiguousTerm[],
  riskClauses: RiskClause[],
  conflicts: ClauseConflict[],
  complianceIssues: ComplianceIssue[]
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // 针对缺失条款的建议
  missingClauses.forEach(clause => {
    suggestions.push({
      type: 'add',
      target: clause.title,
      reason: clause.description,
      content: clause.template,
      priority: clause.importance === 'critical' ? 'high' : 'medium'
    });
  });

  // 针对模糊表述的建议
  ambiguousTerms.slice(0, 5).forEach(term => {
    suggestions.push({
      type: 'modify',
      target: `第${term.lineNumber}行："${term.term}"`,
      reason: term.reason,
      content: term.suggestion,
      priority: 'medium'
    });
  });

  // 针对风险条款的建议
  riskClauses.forEach(risk => {
    suggestions.push({
      type: 'modify',
      target: `第${risk.lineNumber}行：${risk.title}`,
      reason: risk.description,
      content: risk.suggestion,
      priority: risk.riskLevel === 'high' ? 'high' : 'medium'
    });
  });

  // 针对条款冲突的建议
  conflicts.forEach(conflict => {
    suggestions.push({
      type: 'modify',
      target: `第${conflict.clause1.lineNumber}行和第${conflict.clause2.lineNumber}行`,
      reason: conflict.description,
      content: conflict.suggestion,
      priority: 'high'
    });
  });

  // 针对合规性问题的建议
  complianceIssues.forEach(issue => {
    suggestions.push({
      type: issue.severity === 'critical' ? 'delete' : 'modify',
      target: `第${issue.lineNumber}行`,
      reason: issue.description,
      content: issue.suggestion,
      priority: 'high'
    });
  });

  return suggestions;
}

/**
 * 计算总体评分
 */
function calculateScore(
  missingClauses: MissingClause[],
  ambiguousTerms: AmbiguousTerm[],
  riskClauses: RiskClause[],
  conflicts: ClauseConflict[],
  complianceIssues: ComplianceIssue[]
): number {
  let score = 100;

  // 缺失必备条款扣分
  const criticalMissing = missingClauses.filter(c => c.importance === 'critical').length;
  const importantMissing = missingClauses.filter(c => c.importance === 'important').length;
  score -= criticalMissing * 15;
  score -= importantMissing * 5;

  // 模糊表述扣分
  score -= Math.min(ambiguousTerms.length * 2, 20);

  // 风险条款扣分
  const highRisks = riskClauses.filter(r => r.riskLevel === 'high').length;
  score -= highRisks * 10;

  // 条款冲突扣分
  score -= conflicts.length * 10;

  // 合规性问题扣分
  const criticalIssues = complianceIssues.filter(i => i.severity === 'critical').length;
  score -= criticalIssues * 20;

  return Math.max(score, 0);
}

/**
 * 获取支持的合同类型列表
 */
export function getSupportedContractTypes() {
  return Object.keys(CONTRACT_TYPES).map(type => ({
    value: type,
    label: type
  }));
}
