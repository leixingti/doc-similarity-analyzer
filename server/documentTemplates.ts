/**
 * 文书模板库
 * 包含20+常用法律文书模板
 */

export interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  content: string;
  variables: string[];
  filenameTemplate: string;
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  // 1. 民事起诉状
  {
    id: 'civil_complaint',
    name: '民事起诉状',
    category: '诉讼文书',
    description: '民事诉讼起诉状模板',
    content: `# 民事起诉状

原告：{{plaintiff_name}}，{{plaintiff_gender}}，{{plaintiff_birth}}出生，{{plaintiff_nation}}族，{{plaintiff_occupation}}，住{{plaintiff_address}}，联系电话：{{plaintiff_phone}}。

被告：{{defendant_name}}，{{defendant_gender}}，{{defendant_birth}}出生，{{defendant_nation}}族，{{defendant_occupation}}，住{{defendant_address}}，联系电话：{{defendant_phone}}。

## 诉讼请求

{{#each claims}}
{{@index}}. {{this}}
{{/each}}

## 事实与理由

{{facts}}

综上所述，原告认为被告的行为已经严重侵害了原告的合法权益，为维护原告的合法权益，特依法向贵院提起诉讼，请求贵院依法判决支持原告的诉讼请求。

此致

{{court_name}}

原告：{{plaintiff_name}}
{{formatDate date}}`,
    variables: ['plaintiff_name', 'plaintiff_gender', 'plaintiff_birth', 'plaintiff_nation', 'plaintiff_occupation', 'plaintiff_address', 'plaintiff_phone', 'defendant_name', 'defendant_gender', 'defendant_birth', 'defendant_nation', 'defendant_occupation', 'defendant_address', 'defendant_phone', 'claims', 'facts', 'court_name', 'date'],
    filenameTemplate: '民事起诉状-{{plaintiff_name}}诉{{defendant_name}}.docx'
  },

  // 2. 民事答辩状
  {
    id: 'civil_answer',
    name: '民事答辩状',
    category: '诉讼文书',
    description: '民事诉讼答辩状模板',
    content: `# 民事答辩状

答辩人：{{defendant_name}}，{{defendant_gender}}，{{defendant_birth}}出生，{{defendant_nation}}族，{{defendant_occupation}}，住{{defendant_address}}，联系电话：{{defendant_phone}}。

原告：{{plaintiff_name}}，{{plaintiff_gender}}，住{{plaintiff_address}}。

答辩人因与原告{{case_cause}}一案，现就原告的起诉提出如下答辩意见：

## 答辩意见

{{#each defenses}}
{{@index}}. {{this}}
{{/each}}

## 事实与理由

{{facts}}

综上所述，原告的诉讼请求缺乏事实和法律依据，请求贵院依法驳回原告的诉讼请求。

此致

{{court_name}}

答辩人：{{defendant_name}}
{{formatDate date}}`,
    variables: ['defendant_name', 'defendant_gender', 'defendant_birth', 'defendant_nation', 'defendant_occupation', 'defendant_address', 'defendant_phone', 'plaintiff_name', 'plaintiff_gender', 'plaintiff_address', 'case_cause', 'defenses', 'facts', 'court_name', 'date'],
    filenameTemplate: '民事答辩状-{{defendant_name}}.docx'
  },

  // 3. 律师函
  {
    id: 'lawyer_letter',
    name: '律师函',
    category: '非诉文书',
    description: '律师函模板',
    content: `# 律师函

{{recipient_name}}：

{{law_firm_name}}接受{{client_name}}的委托，指派本律师就{{matter}}一事，致函贵方如下：

## 基本情况

{{background}}

## 法律分析

{{legal_analysis}}

## 律师意见

鉴于上述事实和法律规定，本律师郑重函告贵方：

{{#each demands}}
{{@index}}. {{this}}
{{/each}}

如贵方在收到本函后{{deadline}}日内仍未按上述要求履行相关义务，我方将依法采取进一步法律措施，由此产生的一切法律后果由贵方承担。

特此函告。

{{law_firm_name}}
律师：{{lawyer_name}}
{{formatDate date}}

联系电话：{{lawyer_phone}}
地址：{{law_firm_address}}`,
    variables: ['recipient_name', 'law_firm_name', 'client_name', 'matter', 'background', 'legal_analysis', 'demands', 'deadline', 'lawyer_name', 'date', 'lawyer_phone', 'law_firm_address'],
    filenameTemplate: '律师函-致{{recipient_name}}.docx'
  },

  // 4. 授权委托书
  {
    id: 'power_of_attorney',
    name: '授权委托书',
    category: '程序文书',
    description: '诉讼授权委托书模板',
    content: `# 授权委托书

委托人：{{client_name}}，{{client_gender}}，{{client_birth}}出生，{{client_nation}}族，{{client_occupation}}，住{{client_address}}，联系电话：{{client_phone}}。

受托人：{{lawyer_name}}，{{law_firm_name}}律师，联系电话：{{lawyer_phone}}。

{{#if lawyer2_name}}
受托人：{{lawyer2_name}}，{{law_firm_name}}律师，联系电话：{{lawyer2_phone}}。
{{/if}}

现委托上列受托人在我与{{opponent_name}}{{case_cause}}一案中，作为我的诉讼代理人。

## 代理权限

{{#if special_authorization}}
特别授权：{{authorization_scope}}
{{else}}
一般授权：代为调查取证、出庭应诉、查阅案卷材料。
{{/if}}

委托人：{{client_name}}（签字）
{{formatDate date}}`,
    variables: ['client_name', 'client_gender', 'client_birth', 'client_nation', 'client_occupation', 'client_address', 'client_phone', 'lawyer_name', 'law_firm_name', 'lawyer_phone', 'lawyer2_name', 'lawyer2_phone', 'opponent_name', 'case_cause', 'special_authorization', 'authorization_scope', 'date'],
    filenameTemplate: '授权委托书-{{client_name}}.docx'
  },

  // 5. 证据清单
  {
    id: 'evidence_list',
    name: '证据清单',
    category: '诉讼文书',
    description: '证据清单模板',
    content: `# 证据清单

案号：{{case_number}}
案由：{{case_cause}}
提交人：{{submitter}}

| 序号 | 证据名称 | 证据类型 | 证明目的 | 页数 | 备注 |
|------|---------|---------|---------|------|------|
{{#each evidences}}
| {{add @index 1}} | {{this.name}} | {{this.type}} | {{this.purpose}} | {{this.pages}} | {{this.note}} |
{{/each}}

以上证据材料共{{evidence_count}}份，{{total_pages}}页。

提交人：{{submitter}}
{{formatDate date}}`,
    variables: ['case_number', 'case_cause', 'submitter', 'evidences', 'evidence_count', 'total_pages', 'date'],
    filenameTemplate: '证据清单-{{case_number}}.docx'
  },

  // 6. 代理词
  {
    id: 'agency_statement',
    name: '代理词',
    category: '诉讼文书',
    description: '诉讼代理词模板',
    content: `# 代理词

审判长、审判员：

{{law_firm_name}}接受{{client_name}}的委托，指派我作为其诉讼代理人，参加本案诉讼活动。通过庭前准备和今天的庭审，代理人对本案有了全面的了解。现根据事实和法律，发表如下代理意见：

## 一、案件事实

{{facts}}

## 二、法律分析

{{#each legal_points}}
### {{@index}}. {{this.title}}

{{this.content}}

{{/each}}

## 三、代理意见

综上所述，代理人认为：

{{#each opinions}}
{{@index}}. {{this}}
{{/each}}

请求法庭依法支持我方的诉讼请求。

代理人：{{lawyer_name}}
{{law_firm_name}}
{{formatDate date}}`,
    variables: ['law_firm_name', 'client_name', 'facts', 'legal_points', 'opinions', 'lawyer_name', 'date'],
    filenameTemplate: '代理词-{{client_name}}.docx'
  },

  // 7. 法律意见书
  {
    id: 'legal_opinion',
    name: '法律意见书',
    category: '非诉文书',
    description: '法律意见书模板',
    content: `# 法律意见书

致：{{client_name}}

关于：{{matter}}

{{law_firm_name}}接受贵方委托，就{{matter}}事宜，经审查相关资料，现出具法律意见如下：

## 一、基本情况

{{background}}

## 二、法律分析

{{#each legal_issues}}
### {{@index}}. {{this.issue}}

#### 相关法律规定

{{this.laws}}

#### 分析意见

{{this.analysis}}

{{/each}}

## 三、法律意见

{{#each opinions}}
{{@index}}. {{this}}
{{/each}}

## 四、风险提示

{{#each risks}}
{{@index}}. {{this}}
{{/each}}

## 五、建议

{{#each suggestions}}
{{@index}}. {{this}}
{{/each}}

以上意见，供贵方参考。

{{law_firm_name}}
律师：{{lawyer_name}}
{{formatDate date}}`,
    variables: ['client_name', 'matter', 'law_firm_name', 'background', 'legal_issues', 'opinions', 'risks', 'suggestions', 'lawyer_name', 'date'],
    filenameTemplate: '法律意见书-{{matter}}.docx'
  },

  // 8. 上诉状
  {
    id: 'appeal',
    name: '上诉状',
    category: '诉讼文书',
    description: '民事上诉状模板',
    content: `# 民事上诉状

上诉人（原审{{original_role}}）：{{appellant_name}}，{{appellant_gender}}，{{appellant_birth}}出生，{{appellant_nation}}族，{{appellant_occupation}}，住{{appellant_address}}，联系电话：{{appellant_phone}}。

被上诉人（原审{{opposite_role}}）：{{appellee_name}}，{{appellee_gender}}，住{{appellee_address}}，联系电话：{{appellee_phone}}。

上诉人因与被上诉人{{case_cause}}一案，不服{{original_court}}（{{original_case_number}}）号民事判决，现依法提起上诉。

## 上诉请求

{{#each appeals}}
{{@index}}. {{this}}
{{/each}}

## 事实与理由

{{#each reasons}}
### {{@index}}. {{this.title}}

{{this.content}}

{{/each}}

综上所述，原审判决认定事实不清，适用法律错误，请求二审法院依法改判，支持上诉人的上诉请求。

此致

{{appeal_court}}

上诉人：{{appellant_name}}
{{formatDate date}}`,
    variables: ['original_role', 'appellant_name', 'appellant_gender', 'appellant_birth', 'appellant_nation', 'appellant_occupation', 'appellant_address', 'appellant_phone', 'opposite_role', 'appellee_name', 'appellee_gender', 'appellee_address', 'appellee_phone', 'case_cause', 'original_court', 'original_case_number', 'appeals', 'reasons', 'appeal_court', 'date'],
    filenameTemplate: '上诉状-{{appellant_name}}.docx'
  },

  // 9. 财产保全申请书
  {
    id: 'property_preservation',
    name: '财产保全申请书',
    category: '程序文书',
    description: '财产保全申请书模板',
    content: `# 财产保全申请书

申请人：{{applicant_name}}，{{applicant_gender}}，{{applicant_birth}}出生，住{{applicant_address}}，联系电话：{{applicant_phone}}。

被申请人：{{respondent_name}}，{{respondent_gender}}，住{{respondent_address}}，联系电话：{{respondent_phone}}。

申请人因与被申请人{{case_cause}}一案，现依法申请财产保全。

## 申请事项

请求贵院依法查封、冻结被申请人名下价值人民币{{formatMoney amount}}（{{formatMoneyChinese amount}}）的财产。

## 事实与理由

{{facts}}

申请人认为，如不及时采取财产保全措施，将可能使判决难以执行或造成申请人其他损害。为保障申请人的合法权益，特依法申请财产保全。

申请人愿意提供相应的担保。

此致

{{court_name}}

申请人：{{applicant_name}}
{{formatDate date}}`,
    variables: ['applicant_name', 'applicant_gender', 'applicant_birth', 'applicant_address', 'applicant_phone', 'respondent_name', 'respondent_gender', 'respondent_address', 'respondent_phone', 'case_cause', 'amount', 'facts', 'court_name', 'date'],
    filenameTemplate: '财产保全申请书-{{applicant_name}}.docx'
  },

  // 10. 强制执行申请书
  {
    id: 'enforcement_application',
    name: '强制执行申请书',
    category: '程序文书',
    description: '强制执行申请书模板',
    content: `# 强制执行申请书

申请执行人：{{applicant_name}}，{{applicant_gender}}，{{applicant_birth}}出生，住{{applicant_address}}，联系电话：{{applicant_phone}}。

被执行人：{{respondent_name}}，{{respondent_gender}}，住{{respondent_address}}，联系电话：{{respondent_phone}}。

申请执行人与被执行人{{case_cause}}一案，业经贵院作出（{{case_number}}）号民事判决书/调解书，该判决书/调解书已经发生法律效力。

## 申请事项

请求贵院依法强制执行被执行人，执行标的为：

{{#each execution_items}}
{{@index}}. {{this}}
{{/each}}

## 事实与理由

{{facts}}

该判决书/调解书已于{{delivery_date}}送达被执行人，被执行人至今未履行判决书/调解书确定的义务。为维护申请执行人的合法权益，特依法申请强制执行。

此致

{{court_name}}

申请执行人：{{applicant_name}}
{{formatDate date}}

附：
1. 判决书/调解书复印件一份
2. 判决书/调解书生效证明一份`,
    variables: ['applicant_name', 'applicant_gender', 'applicant_birth', 'applicant_address', 'applicant_phone', 'respondent_name', 'respondent_gender', 'respondent_address', 'respondent_phone', 'case_cause', 'case_number', 'execution_items', 'facts', 'delivery_date', 'court_name', 'date'],
    filenameTemplate: '强制执行申请书-{{applicant_name}}.docx'
  },

  // 11. 调查取证申请书
  {
    id: 'investigation_application',
    name: '调查取证申请书',
    category: '程序文书',
    description: '调查取证申请书模板',
    content: `# 调查取证申请书

申请人：{{applicant_name}}，{{applicant_gender}}，住{{applicant_address}}，联系电话：{{applicant_phone}}。

申请人因与{{opponent_name}}{{case_cause}}一案（案号：{{case_number}}），现依法申请调查取证。

## 申请事项

请求贵院依法调查收集以下证据：

{{#each evidence_items}}
{{@index}}. {{this.name}}
   证据持有人：{{this.holder}}
   证据内容：{{this.content}}
   证明目的：{{this.purpose}}

{{/each}}

## 事实与理由

{{facts}}

上述证据对查明案件事实具有重要意义，但由于{{reason}}，申请人无法自行收集，特依法申请贵院调查收集。

此致

{{court_name}}

申请人：{{applicant_name}}
{{formatDate date}}`,
    variables: ['applicant_name', 'applicant_gender', 'applicant_address', 'applicant_phone', 'opponent_name', 'case_cause', 'case_number', 'evidence_items', 'facts', 'reason', 'court_name', 'date'],
    filenameTemplate: '调查取证申请书-{{applicant_name}}.docx'
  },

  // 12. 延期审理申请书
  {
    id: 'postponement_application',
    name: '延期审理申请书',
    category: '程序文书',
    description: '延期审理申请书模板',
    content: `# 延期审理申请书

申请人：{{applicant_name}}，{{applicant_gender}}，住{{applicant_address}}，联系电话：{{applicant_phone}}。

申请人因与{{opponent_name}}{{case_cause}}一案（案号：{{case_number}}），原定于{{original_date}}开庭审理，现因{{reason}}，无法按时出庭，特申请延期审理。

## 申请事项

请求贵院依法延期审理本案。

## 事实与理由

{{facts}}

鉴于上述情况，申请人确实无法在原定开庭时间出庭参加诉讼，为保障申请人的诉讼权利，特依法申请延期审理。

此致

{{court_name}}

申请人：{{applicant_name}}
{{formatDate date}}

附：{{attachment}}`,
    variables: ['applicant_name', 'applicant_gender', 'applicant_address', 'applicant_phone', 'opponent_name', 'case_cause', 'case_number', 'original_date', 'reason', 'facts', 'court_name', 'date', 'attachment'],
    filenameTemplate: '延期审理申请书-{{applicant_name}}.docx'
  },

  // 13. 撤诉申请书
  {
    id: 'withdrawal_application',
    name: '撤诉申请书',
    category: '程序文书',
    description: '撤诉申请书模板',
    content: `# 撤诉申请书

申请人：{{applicant_name}}，{{applicant_gender}}，住{{applicant_address}}，联系电话：{{applicant_phone}}。

被申请人：{{respondent_name}}，{{respondent_gender}}，住{{respondent_address}}。

申请人因与被申请人{{case_cause}}一案（案号：{{case_number}}），现依法申请撤诉。

## 申请事项

请求贵院依法准许申请人撤回对被申请人的起诉。

## 事实与理由

{{facts}}

鉴于上述情况，申请人决定撤回对被申请人的起诉，特依法申请撤诉。

此致

{{court_name}}

申请人：{{applicant_name}}
{{formatDate date}}`,
    variables: ['applicant_name', 'applicant_gender', 'applicant_address', 'applicant_phone', 'respondent_name', 'respondent_gender', 'respondent_address', 'case_cause', 'case_number', 'facts', 'court_name', 'date'],
    filenameTemplate: '撤诉申请书-{{applicant_name}}.docx'
  },

  // 14. 催告函
  {
    id: 'demand_letter',
    name: '催告函',
    category: '非诉文书',
    description: '催告函模板',
    content: `# 催告函

{{recipient_name}}：

根据{{contract_name}}（合同编号：{{contract_number}}）的约定，贵方应于{{due_date}}前履行以下义务：

{{#each obligations}}
{{@index}}. {{this}}
{{/each}}

然而，截至目前，贵方仍未履行上述义务，已构成违约。

现郑重催告贵方：

请于收到本函后{{deadline}}日内，履行上述合同义务，并支付违约金人民币{{formatMoney penalty}}（{{formatMoneyChinese penalty}}）。

如贵方逾期仍不履行，我方将保留采取进一步法律措施的权利，由此产生的一切法律后果由贵方承担。

特此函告。

{{sender_name}}
{{formatDate date}}

联系电话：{{sender_phone}}
地址：{{sender_address}}`,
    variables: ['recipient_name', 'contract_name', 'contract_number', 'due_date', 'obligations', 'deadline', 'penalty', 'sender_name', 'date', 'sender_phone', 'sender_address'],
    filenameTemplate: '催告函-致{{recipient_name}}.docx'
  },

  // 15. 和解协议书
  {
    id: 'settlement_agreement',
    name: '和解协议书',
    category: '非诉文书',
    description: '和解协议书模板',
    content: `# 和解协议书

甲方：{{party_a_name}}，{{party_a_gender}}，住{{party_a_address}}，联系电话：{{party_a_phone}}。

乙方：{{party_b_name}}，{{party_b_gender}}，住{{party_b_address}}，联系电话：{{party_b_phone}}。

甲、乙双方就{{matter}}一事，经友好协商，达成如下和解协议：

## 第一条 事实确认

{{facts}}

## 第二条 和解方案

{{#each terms}}
{{@index}}. {{this}}
{{/each}}

## 第三条 履行方式

{{performance}}

## 第四条 违约责任

{{breach}}

## 第五条 其他约定

{{#each other_terms}}
{{@index}}. {{this}}
{{/each}}

## 第六条 生效条款

本协议自双方签字之日起生效。本协议一式{{copies}}份，甲、乙双方各执{{party_copies}}份，具有同等法律效力。

甲方：{{party_a_name}}（签字）     乙方：{{party_b_name}}（签字）

{{formatDate date}}                 {{formatDate date}}`,
    variables: ['party_a_name', 'party_a_gender', 'party_a_address', 'party_a_phone', 'party_b_name', 'party_b_gender', 'party_b_address', 'party_b_phone', 'matter', 'facts', 'terms', 'performance', 'breach', 'other_terms', 'copies', 'party_copies', 'date'],
    filenameTemplate: '和解协议书-{{party_a_name}}与{{party_b_name}}.docx'
  },
];

/**
 * 根据ID获取模板
 */
export function getTemplateById(id: string): DocumentTemplate | undefined {
  return DOCUMENT_TEMPLATES.find(t => t.id === id);
}

/**
 * 根据分类获取模板列表
 */
export function getTemplatesByCategory(category: string): DocumentTemplate[] {
  return DOCUMENT_TEMPLATES.filter(t => t.category === category);
}

/**
 * 获取所有模板分类
 */
export function getAllCategories(): string[] {
  const categories = new Set(DOCUMENT_TEMPLATES.map(t => t.category));
  return Array.from(categories);
}

/**
 * 搜索模板
 */
export function searchTemplates(keyword: string): DocumentTemplate[] {
  const lowerKeyword = keyword.toLowerCase();
  return DOCUMENT_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(lowerKeyword) ||
    t.description.toLowerCase().includes(lowerKeyword)
  );
}
