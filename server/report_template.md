## 文档相似度分析报告

### 任务信息

| 任务名称 | 创建时间 | 分析模式 |
|---|---|---|
| {{taskName}} | {{createdAt}} | {{analysisMode}} |

### 分析概览

**整体相似度**

# {{overallSimilarity}}%

**分析摘要**

{{summary}}

### 详细分析

| 维度 | 相似度 (%) |
|---|---|
| 语义相似度 | {{semanticSimilarity}} |
| 结构相似度 | {{structuralSimilarity}} |
| 风格相似度 | {{styleSimilarity}} |
| 主题相似度 | {{topicSimilarity}} |
| 语气相似度 | {{toneSimilarity}} |
| 词汇相似度 | {{vocabularySimilarity}} |

**风险等级**: {{riskLevel}}

**风险说明**: {{riskDescription}}

### 相似片段

| 文档A片段 | 文档B片段 | 相似度 (%) | 原因 |
|---|---|---|---|
{{#each segments}}
| {{this.doc1Segment}} | {{this.doc2Segment}} | {{this.similarity}} | {{this.reason}} |
{{/each}}

### 可视化

![相似度雷达图](cid:similarity_radar_chart)

### 文档列表

| 文件名 | 文件类型 | 文件大小 |
|---|---|---|
{{#each documents}}
| {{this.filename}} | {{this.fileType}} | {{this.fileSize}} KB |
{{/each}}

### 改进建议

{{#each recommendations}}
- {{this}}
{{/each}}
