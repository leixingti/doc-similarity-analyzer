import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

export interface ReportData {
  taskName: string;
  createdAt: string;
  analysisMode: string;
  overallSimilarity: number;
  summary: string;
  details: {
    semanticSimilarity?: number;
    structuralSimilarity?: number;
    styleSimilarity?: number;
    topicSimilarity?: number;
    toneSimilarity?: number;
    vocabularySimilarity?: number;
    cosineSimilarity?: number;
    jaccardSimilarity?: number;
    tfidfSimilarity?: number;
  };
  riskLevel?: 'high' | 'medium' | 'low';
  riskDescription?: string;
  recommendations?: string[];
  segments: Array<{
    doc1Segment: string;
    doc2Segment: string;
    similarity: number;
    reason?: string;
  }>;
  documents: Array<{
    filename: string;
    fileType: string;
    fileSize: number;
  }>;
}

/**
 * 生成 PDF 报告 - 完整版
 */
export async function generatePDFReport(reportData: ReportData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const margin = 50;
  const pageWidth = 595;
  const pageHeight = 842;
  const contentWidth = pageWidth - margin * 2;
  
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - margin;
  
  // 辅助函数：检查是否需要新页面
  const checkNewPage = (requiredSpace: number) => {
    if (yPosition - requiredSpace < margin) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      yPosition = pageHeight - margin;
      return true;
    }
    return false;
  };
  
  // 辅助函数：绘制标题
  const drawTitle = (text: string, size: number = 24) => {
    currentPage.drawText(text, {
      x: margin,
      y: yPosition,
      size,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPosition -= size + 15;
  };
  
  // 辅助函数：绘制副标题
  const drawSubtitle = (text: string, size: number = 14) => {
    checkNewPage(30);
    currentPage.drawText(text, {
      x: margin,
      y: yPosition,
      size,
      font: boldFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    yPosition -= size + 10;
  };
  
  // 辅助函数：绘制文本
  const drawText = (text: string, size: number = 10, indent: number = 0, color = rgb(0.4, 0.4, 0.4)) => {
    const lines = wrapText(text, contentWidth - indent, size);
    for (const line of lines) {
      checkNewPage(15);
      currentPage.drawText(line, {
        x: margin + indent,
        y: yPosition,
        size,
        font,
        color,
      });
      yPosition -= size + 5;
    }
  };
  
  // 辅助函数：绘制分隔线
  const drawLine = () => {
    checkNewPage(10);
    currentPage.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: pageWidth - margin, y: yPosition },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    yPosition -= 15;
  };
  
  // ===== 第一页：封面和概览 =====
  
  // 主标题
  drawTitle('文档相似度分析报告', 28);
  yPosition -= 10;
  
  // 任务信息卡片
  checkNewPage(120);
  currentPage.drawRectangle({
    x: margin,
    y: yPosition - 100,
    width: contentWidth,
    height: 100,
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 1,
    color: rgb(0.98, 0.98, 0.98),
  });
  
  yPosition -= 15;
  drawText(`任务名称: ${reportData.taskName}`, 11, 10, rgb(0.2, 0.2, 0.2));
  drawText(`创建时间: ${reportData.createdAt}`, 10, 10);
  drawText(`分析模式: ${reportData.analysisMode === 'traditional' ? '传统算法' : 'DeepSeek AI'}`, 10, 10);
  yPosition -= 10;
  
  // 整体相似度（大字体突出显示）
  yPosition -= 20;
  drawSubtitle('整体相似度');
  
  checkNewPage(80);
  const similarityColor = reportData.overallSimilarity >= 80 ? rgb(0.9, 0.2, 0.2) : 
                         reportData.overallSimilarity >= 50 ? rgb(0.9, 0.6, 0) : 
                         rgb(0.2, 0.7, 0.2);
  
  currentPage.drawRectangle({
    x: margin,
    y: yPosition - 60,
    width: contentWidth,
    height: 60,
    color: rgb(similarityColor.red * 0.1 + 0.9, similarityColor.green * 0.1 + 0.9, similarityColor.blue * 0.1 + 0.9),
    borderColor: similarityColor,
    borderWidth: 2,
  });
  
  currentPage.drawText(`${reportData.overallSimilarity.toFixed(1)}%`, {
    x: margin + 20,
    y: yPosition - 45,
    size: 36,
    font: boldFont,
    color: similarityColor,
  });
  
  const riskText = reportData.overallSimilarity >= 80 ? '高度相似' : 
                   reportData.overallSimilarity >= 50 ? '中度相似' : 
                   '低度相似';
  currentPage.drawText(riskText, {
    x: margin + 150,
    y: yPosition - 40,
    size: 14,
    font: boldFont,
    color: similarityColor,
  });
  
  yPosition -= 75;
  
  // 分析摘要
  drawSubtitle('分析摘要');
  drawText(reportData.summary, 10, 10);
  yPosition -= 10;
  
  // ===== 详细指标 =====
  
  drawSubtitle('详细指标');
  
  checkNewPage(150);
  
  // 绘制指标表格
  const metrics = [];
  if (reportData.details.cosineSimilarity !== undefined) {
    // 传统算法指标
    metrics.push(
      { name: '余弦相似度', value: reportData.details.cosineSimilarity },
      { name: 'Jaccard相似度', value: reportData.details.jaccardSimilarity },
      { name: 'TF-IDF相似度', value: reportData.details.tfidfSimilarity }
    );
  } else {
    // DeepSeek AI指标
    metrics.push(
      { name: '语义相似度', value: reportData.details.semanticSimilarity },
      { name: '结构相似度', value: reportData.details.structuralSimilarity },
      { name: '风格相似度', value: reportData.details.styleSimilarity },
      { name: '主题相似度', value: reportData.details.topicSimilarity },
      { name: '语气相似度', value: reportData.details.toneSimilarity },
      { name: '词汇相似度', value: reportData.details.vocabularySimilarity }
    );
  }
  
  for (const metric of metrics) {
    if (metric.value !== undefined) {
      checkNewPage(25);
      const barWidth = (metric.value / 100) * (contentWidth - 150);
      const barColor = metric.value >= 80 ? rgb(0.9, 0.2, 0.2) : 
                       metric.value >= 50 ? rgb(0.9, 0.6, 0) : 
                       rgb(0.2, 0.7, 0.2);
      
      // 指标名称
      currentPage.drawText(metric.name, {
        x: margin + 10,
        y: yPosition,
        size: 10,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      // 进度条背景
      currentPage.drawRectangle({
        x: margin + 120,
        y: yPosition - 3,
        width: contentWidth - 150,
        height: 12,
        color: rgb(0.95, 0.95, 0.95),
      });
      
      // 进度条
      currentPage.drawRectangle({
        x: margin + 120,
        y: yPosition - 3,
        width: barWidth,
        height: 12,
        color: barColor,
      });
      
      // 百分比
      currentPage.drawText(`${metric.value.toFixed(1)}%`, {
        x: margin + 120 + contentWidth - 140,
        y: yPosition,
        size: 9,
        font: boldFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      yPosition -= 20;
    }
  }
  
  yPosition -= 10;
  
  // 风险评估（如果有）
  if (reportData.riskLevel && reportData.riskDescription) {
    drawSubtitle('风险评估');
    
    const riskColor = reportData.riskLevel === 'high' ? rgb(0.9, 0.2, 0.2) : 
                      reportData.riskLevel === 'medium' ? rgb(0.9, 0.6, 0) : 
                      rgb(0.2, 0.7, 0.2);
    
    const riskLevelText = reportData.riskLevel === 'high' ? '高风险' : 
                          reportData.riskLevel === 'medium' ? '中风险' : 
                          '低风险';
    
    checkNewPage(30);
    currentPage.drawText(`风险等级: ${riskLevelText}`, {
      x: margin + 10,
      y: yPosition,
      size: 11,
      font: boldFont,
      color: riskColor,
    });
    yPosition -= 20;
    
    drawText(reportData.riskDescription, 10, 10);
    yPosition -= 10;
  }
  
  // ===== 相似片段 =====
  
  if (reportData.segments && reportData.segments.length > 0) {
    checkNewPage(50);
    drawSubtitle('相似片段');
    drawText(`共发现 ${reportData.segments.length} 个相似片段，以下展示详细内容:`, 10, 10);
    yPosition -= 10;
    
    for (let i = 0; i < reportData.segments.length; i++) {
      const segment = reportData.segments[i];
      
      checkNewPage(120);
      
      // 片段标题
      currentPage.drawRectangle({
        x: margin,
        y: yPosition - 15,
        width: contentWidth,
        height: 20,
        color: rgb(0.95, 0.95, 0.95),
      });
      
      currentPage.drawText(`片段 ${i + 1}`, {
        x: margin + 10,
        y: yPosition - 12,
        size: 11,
        font: boldFont,
        color: rgb(0.2, 0.4, 0.7),
      });
      
      currentPage.drawText(`相似度: ${segment.similarity.toFixed(1)}%`, {
        x: pageWidth - margin - 100,
        y: yPosition - 12,
        size: 10,
        font: boldFont,
        color: rgb(0.9, 0.2, 0.2),
      });
      
      yPosition -= 25;
      
      // 文档A内容
      currentPage.drawText('文档A:', {
        x: margin + 10,
        y: yPosition,
        size: 9,
        font: boldFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      yPosition -= 12;
      
      drawText(segment.doc1Segment, 9, 20, rgb(0.4, 0.4, 0.4));
      yPosition -= 5;
      
      // 文档B内容
      checkNewPage(50);
      currentPage.drawText('文档B:', {
        x: margin + 10,
        y: yPosition,
        size: 9,
        font: boldFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      yPosition -= 12;
      
      drawText(segment.doc2Segment, 9, 20, rgb(0.4, 0.4, 0.4));
      
      // 原因（如果有）
      if (segment.reason) {
        yPosition -= 5;
        checkNewPage(20);
        currentPage.drawText(`相似原因: ${segment.reason}`, {
          x: margin + 10,
          y: yPosition,
          size: 8,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
        yPosition -= 12;
      }
      
      yPosition -= 15;
      drawLine();
    }
  }
  
  // ===== 文档列表 =====
  
  if (reportData.documents && reportData.documents.length > 0) {
    checkNewPage(100);
    drawSubtitle('文档列表');
    
    // 表头
    checkNewPage(80);
    currentPage.drawRectangle({
      x: margin,
      y: yPosition - 18,
      width: contentWidth,
      height: 20,
      color: rgb(0.9, 0.9, 0.9),
    });
    
    currentPage.drawText('文件名', {
      x: margin + 10,
      y: yPosition - 14,
      size: 10,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    currentPage.drawText('类型', {
      x: margin + 300,
      y: yPosition - 14,
      size: 10,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    currentPage.drawText('大小', {
      x: margin + 400,
      y: yPosition - 14,
      size: 10,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    yPosition -= 25;
    
    // 表格内容
    for (const doc of reportData.documents) {
      checkNewPage(25);
      
      const filename = doc.filename.length > 35 ? doc.filename.substring(0, 32) + '...' : doc.filename;
      currentPage.drawText(filename, {
        x: margin + 10,
        y: yPosition,
        size: 9,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      currentPage.drawText(doc.fileType.toUpperCase(), {
        x: margin + 300,
        y: yPosition,
        size: 9,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      
      const sizeKB = (doc.fileSize / 1024).toFixed(1);
      currentPage.drawText(`${sizeKB} KB`, {
        x: margin + 400,
        y: yPosition,
        size: 9,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      
      yPosition -= 18;
    }
    
    yPosition -= 10;
  }
  
  // ===== 改进建议 =====
  
  if (reportData.recommendations && reportData.recommendations.length > 0) {
    checkNewPage(100);
    drawSubtitle('改进建议');
    
    for (let i = 0; i < reportData.recommendations.length; i++) {
      checkNewPage(30);
      const bullet = `${i + 1}. `;
      currentPage.drawText(bullet, {
        x: margin + 10,
        y: yPosition,
        size: 10,
        font: boldFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      const lines = wrapText(reportData.recommendations[i], contentWidth - 40, 10);
      for (let j = 0; j < lines.length; j++) {
        if (j > 0) checkNewPage(15);
        currentPage.drawText(lines[j], {
          x: margin + (j === 0 ? 30 : 20),
          y: yPosition,
          size: 10,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
        yPosition -= 15;
      }
      yPosition -= 5;
    }
  }
  
  // ===== 页脚 =====
  
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    
    // 页码
    page.drawText(`第 ${i + 1} 页 / 共 ${pages.length} 页`, {
      x: pageWidth / 2 - 40,
      y: 20,
      size: 8,
      font,
      color: rgb(0.6, 0.6, 0.6),
    });
    
    // 生成时间（只在第一页）
    if (i === 0) {
      page.drawText(`生成时间: ${new Date().toLocaleString('zh-CN')}`, {
        x: margin,
        y: 20,
        size: 8,
        font,
        color: rgb(0.6, 0.6, 0.6),
      });
    }
  }
  
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * 文本换行
 */
function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const lines: string[] = [];
  const chars = text.split('');
  let currentLine = '';
  
  for (const char of chars) {
    const testLine = currentLine + char;
    // 中文字符宽度约为fontSize，英文约为fontSize * 0.5
    const charWidth = /[\u4e00-\u9fa5]/.test(char) ? fontSize : fontSize * 0.5;
    const estimatedWidth = currentLine.split('').reduce((sum, c) => {
      return sum + (/[\u4e00-\u9fa5]/.test(c) ? fontSize : fontSize * 0.5);
    }, 0) + charWidth;
    
    if (estimatedWidth > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * 生成 Markdown 报告
 */
export function generateMarkdownReport(reportData: ReportData): string {
  let markdown = `# 文档相似度分析报告

## 任务信息

| 任务名称 | 创建时间 | 分析模式 |
|---|---|---|
| ${reportData.taskName} | ${reportData.createdAt} | ${reportData.analysisMode === 'traditional' ? '传统算法' : 'DeepSeek AI'} |

## 分析概览

### 整体相似度

# ${reportData.overallSimilarity.toFixed(1)}%

### 分析摘要

${reportData.summary}

## 详细指标

`;

  // 根据分析模式显示不同的指标
  if (reportData.details.cosineSimilarity !== undefined) {
    markdown += `| 维度 | 相似度 (%) |
|---|---|
| 余弦相似度 | ${reportData.details.cosineSimilarity.toFixed(1)} |
| Jaccard相似度 | ${reportData.details.jaccardSimilarity?.toFixed(1)} |
| TF-IDF相似度 | ${reportData.details.tfidfSimilarity?.toFixed(1)} |
`;
  } else {
    markdown += `| 维度 | 相似度 (%) |
|---|---|
| 语义相似度 | ${reportData.details.semanticSimilarity?.toFixed(1)} |
| 结构相似度 | ${reportData.details.structuralSimilarity?.toFixed(1)} |
| 风格相似度 | ${reportData.details.styleSimilarity?.toFixed(1)} |
| 主题相似度 | ${reportData.details.topicSimilarity?.toFixed(1)} |
| 语气相似度 | ${reportData.details.toneSimilarity?.toFixed(1)} |
| 词汇相似度 | ${reportData.details.vocabularySimilarity?.toFixed(1)} |
`;
  }

  if (reportData.riskLevel && reportData.riskDescription) {
    markdown += `
## 风险评估

**风险等级**: ${reportData.riskLevel.toUpperCase()}

**风险说明**: ${reportData.riskDescription}
`;
  }

  markdown += `
## 相似片段

共发现 ${reportData.segments.length} 个相似片段:

`;

  for (let i = 0; i < reportData.segments.length; i++) {
    const segment = reportData.segments[i];
    markdown += `### 片段 ${i + 1} (相似度: ${segment.similarity.toFixed(1)}%)

**文档A**: 
\`\`\`
${segment.doc1Segment}
\`\`\`

**文档B**: 
\`\`\`
${segment.doc2Segment}
\`\`\`
`;

    if (segment.reason) {
      markdown += `
**相似原因**: ${segment.reason}
`;
    }

    markdown += `
---

`;
  }

  markdown += `## 文档列表

| 文件名 | 文件类型 | 文件大小 (KB) |
|---|---|---|
`;

  for (const doc of reportData.documents) {
    const sizeKB = (doc.fileSize / 1024).toFixed(1);
    markdown += `| ${doc.filename} | ${doc.fileType.toUpperCase()} | ${sizeKB} |
`;
  }

  if (reportData.recommendations && reportData.recommendations.length > 0) {
    markdown += `
## 改进建议

`;

    for (const recommendation of reportData.recommendations) {
      markdown += `- ${recommendation}
`;
    }
  }

  markdown += `
---

**生成时间**: ${new Date().toLocaleString('zh-CN')}
`;

  return markdown;
}
