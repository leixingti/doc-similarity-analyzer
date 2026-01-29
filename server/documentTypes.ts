/**
 * 律师专用文档类型配置
 * 定义不同文档类型的关键字段和风险等级
 */

export interface DocumentType {
  value: string;
  label: string;
  keywords: KeywordConfig[];
}

export interface KeywordConfig {
  pattern: string | RegExp;
  riskLevel: 'high' | 'medium' | 'low';
  category: string;
  description: string;
}

/**
 * 文档类型配置
 */
export const DOCUMENT_TYPES: DocumentType[] = [
  {
    value: 'contract',
    label: '合同协议',
    keywords: [
      // 高风险关键字
      { pattern: /(?:人民币|美元|欧元|港币)?\s*\d+(?:,\d{3})*(?:\.\d+)?\s*(?:元|万元|亿元|USD|EUR|HKD)/gi, riskLevel: 'high', category: '金额', description: '合同金额变化' },
      { pattern: /\d{4}年\d{1,2}月\d{1,2}日/g, riskLevel: 'high', category: '日期', description: '重要日期变化' },
      { pattern: /违约(?:金|责任)/gi, riskLevel: 'high', category: '违约责任', description: '违约条款变化' },
      { pattern: /(?:赔偿|补偿)(?:金额|责任|范围)/gi, riskLevel: 'high', category: '赔偿责任', description: '赔偿条款变化' },
      { pattern: /(?:解除|终止)(?:合同|协议)/gi, riskLevel: 'high', category: '解除条款', description: '合同解除条件变化' },
      { pattern: /(?:管辖|仲裁|诉讼)/gi, riskLevel: 'high', category: '争议解决', description: '争议解决方式变化' },
      
      // 中风险关键字
      { pattern: /(?:交付|履行)(?:期限|时间|日期)/gi, riskLevel: 'medium', category: '履行期限', description: '履行期限变化' },
      { pattern: /付款(?:方式|条件|时间)/gi, riskLevel: 'medium', category: '付款条件', description: '付款条件变化' },
      { pattern: /(?:陈述|保证|承诺)/gi, riskLevel: 'medium', category: '陈述与保证', description: '陈述与保证条款变化' },
      { pattern: /(?:知识产权|专利|商标|著作权)/gi, riskLevel: 'medium', category: '知识产权', description: '知识产权条款变化' },
      { pattern: /保密(?:义务|期限|范围)/gi, riskLevel: 'medium', category: '保密义务', description: '保密条款变化' },
      
      // 低风险关键字
      { pattern: /(?:通知|联系)(?:地址|方式)/gi, riskLevel: 'low', category: '通知方式', description: '通知方式变化' },
      { pattern: /(?:附件|附录)/gi, riskLevel: 'low', category: '附件', description: '附件变化' },
    ]
  },
  {
    value: 'charter',
    label: '公司章程',
    keywords: [
      // 高风险关键字
      { pattern: /(?:注册资本|实缴资本)\s*(?:人民币)?\s*\d+(?:,\d{3})*(?:\.\d+)?\s*(?:元|万元|亿元)/gi, riskLevel: 'high', category: '注册资本', description: '注册资本变化' },
      { pattern: /股权(?:比例|结构|分配)/gi, riskLevel: 'high', category: '股权结构', description: '股权结构变化' },
      { pattern: /(?:表决权|投票权)(?:比例)?/gi, riskLevel: 'high', category: '表决权', description: '表决权变化' },
      { pattern: /董事会(?:人数|组成|职权)/gi, riskLevel: 'high', category: '董事会', description: '董事会条款变化' },
      { pattern: /股东会(?:职权|召集|表决)/gi, riskLevel: 'high', category: '股东会', description: '股东会条款变化' },
      { pattern: /(?:利润|股利)分配/gi, riskLevel: 'high', category: '利润分配', description: '利润分配条款变化' },
      
      // 中风险关键字
      { pattern: /监事(?:会)?(?:人数|组成|职权)/gi, riskLevel: 'medium', category: '监事会', description: '监事会条款变化' },
      { pattern: /(?:经营范围|业务范围)/gi, riskLevel: 'medium', category: '经营范围', description: '经营范围变化' },
      { pattern: /(?:法定代表人|总经理)(?:任免|职权)/gi, riskLevel: 'medium', category: '高管职权', description: '高管职权变化' },
      
      // 低风险关键字
      { pattern: /(?:公司|企业)(?:名称|地址)/gi, riskLevel: 'low', category: '基本信息', description: '基本信息变化' },
    ]
  },
  {
    value: 'litigation',
    label: '诉讼文书',
    keywords: [
      // 高风险关键字
      { pattern: /诉讼请求/gi, riskLevel: 'high', category: '诉讼请求', description: '诉讼请求变化' },
      { pattern: /(?:赔偿|补偿)(?:金额)?\s*(?:人民币)?\s*\d+(?:,\d{3})*(?:\.\d+)?\s*(?:元|万元|亿元)/gi, riskLevel: 'high', category: '赔偿金额', description: '赔偿金额变化' },
      { pattern: /(?:管辖|受理)(?:法院|机关)/gi, riskLevel: 'high', category: '管辖法院', description: '管辖法院变化' },
      { pattern: /(?:证据|证明)/gi, riskLevel: 'high', category: '证据', description: '证据材料变化' },
      
      // 中风险关键字
      { pattern: /事实(?:与|和)理由/gi, riskLevel: 'medium', category: '事实理由', description: '事实与理由变化' },
      { pattern: /(?:法律|法规)(?:依据|规定)/gi, riskLevel: 'medium', category: '法律依据', description: '法律依据变化' },
      { pattern: /(?:原告|被告|第三人)/gi, riskLevel: 'medium', category: '当事人', description: '当事人信息变化' },
      
      // 低风险关键字
      { pattern: /(?:案号|立案)/gi, riskLevel: 'low', category: '案件信息', description: '案件信息变化' },
    ]
  },
  {
    value: 'nda',
    label: '保密协议',
    keywords: [
      // 高风险关键字
      { pattern: /保密(?:信息|内容|范围)/gi, riskLevel: 'high', category: '保密范围', description: '保密范围变化' },
      { pattern: /保密期限\s*(?:为|：)?\s*\d+\s*(?:年|月|日)/gi, riskLevel: 'high', category: '保密期限', description: '保密期限变化' },
      { pattern: /违约(?:金|责任)\s*(?:人民币)?\s*\d+(?:,\d{3})*(?:\.\d+)?\s*(?:元|万元|亿元)/gi, riskLevel: 'high', category: '违约责任', description: '违约责任变化' },
      { pattern: /(?:竞业|同业)(?:限制|禁止)/gi, riskLevel: 'high', category: '竞业限制', description: '竞业限制条款变化' },
      
      // 中风险关键字
      { pattern: /(?:披露|使用|传播)(?:限制|禁止)/gi, riskLevel: 'medium', category: '使用限制', description: '使用限制变化' },
      { pattern: /(?:返还|销毁)(?:义务|要求)/gi, riskLevel: 'medium', category: '返还义务', description: '返还义务变化' },
      
      // 低风险关键字
      { pattern: /(?:保密|披露)(?:方|人)/gi, riskLevel: 'low', category: '当事人', description: '当事人信息变化' },
    ]
  },
  {
    value: 'other',
    label: '其他文档',
    keywords: [
      // 通用高风险关键字
      { pattern: /(?:人民币|美元)?\s*\d+(?:,\d{3})*(?:\.\d+)?\s*(?:元|万元|亿元|USD)/gi, riskLevel: 'high', category: '金额', description: '金额变化' },
      { pattern: /\d{4}年\d{1,2}月\d{1,2}日/g, riskLevel: 'high', category: '日期', description: '日期变化' },
      { pattern: /(?:责任|义务|权利)/gi, riskLevel: 'medium', category: '权利义务', description: '权利义务变化' },
    ]
  }
];

/**
 * 获取文档类型配置
 */
export function getDocumentTypeConfig(documentType: string): DocumentType | undefined {
  return DOCUMENT_TYPES.find(dt => dt.value === documentType);
}

/**
 * 获取所有文档类型列表
 */
export function getAllDocumentTypes() {
  return DOCUMENT_TYPES.map(dt => ({
    value: dt.value,
    label: dt.label
  }));
}
