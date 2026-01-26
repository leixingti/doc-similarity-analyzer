import { PDFDocument, PDFPage, rgb } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

export interface ReportData {
  taskName: string;
  createdAt: string;
  analysisMode: string;
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
  documents: Array<{
    filename: string;
    fileType: string;
    fileSize: number;
  }>;
}

/**
 * 生成 PDF 报告
 */
export async function generatePDFReport(reportData: ReportData): Promise<Buffer> {
  const pdfDoc = PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 纸张大小
  const { height } = page.getSize();
  
  let yPosition = height - 40;
  const margin = 40;
  const pageWidth = 595 - margin * 2;
  
  // 标题
  page.drawText('文档相似度分析报告', {
    x: margin,
    y: yPosition,
    size: 24,
    color: rgb(0, 0, 0),
  });
  yPosition -= 40;
  
  // 任务信息
  page.drawText('任务信息', {
    x: margin,
    y: yPosition,
    size: 14,
    color: rgb(0, 0, 0),
  });
  yPosition -= 25;
  
  const taskInfo = [
    `任务名称: ${reportData.taskName}`,
    `创建时间: ${reportData.createdAt}`,
    `分析模式: ${reportData.analysisMode}`,
  ];
  
  for (const info of taskInfo) {
    page.drawText(info, {
      x: margin + 20,
      y: yPosition,
      size: 10,
      color: rgb(50, 50, 50),
    });
    yPosition -= 15;
  }
  
  yPosition -= 15;
  
  // 分析概览
  page.drawText('分析概览', {
    x: margin,
    y: yPosition,
    size: 14,
    color: rgb(0, 0, 0),
  });
  yPosition -= 25;
  
  // 相似度百分比（大字体）
  const similarityColor = reportData.overallSimilarity > 80 ? rgb(255, 0, 0) : 
                         reportData.overallSimilarity > 50 ? rgb(255, 165, 0) : 
                         rgb(0, 128, 0);
  
  page.drawText(`整体相似度: ${reportData.overallSimilarity}%`, {
    x: margin + 20,
    y: yPosition,
    size: 20,
    color: similarityColor,
  });
  yPosition -= 30;
  
  // 分析摘要
  page.drawText('分析摘要:', {
    x: margin + 20,
    y: yPosition,
    size: 10,
    color: rgb(50, 50, 50),
  });
  yPosition -= 15;
  
  const summaryLines = wrapText(reportData.summary, pageWidth - 40, 10);
  for (const line of summaryLines) {
    page.drawText(line, {
      x: margin + 30,
      y: yPosition,
      size: 9,
      color: rgb(80, 80, 80),
    });
    yPosition -= 12;
  }
  
  yPosition -= 10;
  
  // 详细分析
  page.drawText('详细分析', {
    x: margin,
    y: yPosition,
    size: 14,
    color: rgb(0, 0, 0),
  });
  yPosition -= 25;
  
  const details = [
    `语义相似度: ${reportData.details.semanticSimilarity}%`,
    `结构相似度: ${reportData.details.structuralSimilarity}%`,
    `风格相似度: ${reportData.details.styleSimilarity}%`,
    `主题相似度: ${reportData.details.topicSimilarity}%`,
    `语气相似度: ${reportData.details.toneSimilarity}%`,
    `词汇相似度: ${reportData.details.vocabularySimilarity}%`,
  ];
  
  for (const detail of details) {
    page.drawText(detail, {
      x: margin + 20,
      y: yPosition,
      size: 10,
      color: rgb(50, 50, 50),
    });
    yPosition -= 15;
  }
  
  yPosition -= 10;
  
  // 风险等级
  page.drawText(`风险等级: ${reportData.riskLevel.toUpperCase()}`, {
    x: margin + 20,
    y: yPosition,
    size: 10,
    color: reportData.riskLevel === 'high' ? rgb(255, 0, 0) : 
           reportData.riskLevel === 'medium' ? rgb(255, 165, 0) : 
           rgb(0, 128, 0),
  });
  yPosition -= 15;
  
  // 风险说明
  const riskLines = wrapText(reportData.riskDescription, pageWidth - 40, 10);
  for (const line of riskLines) {
    page.drawText(line, {
      x: margin + 30,
      y: yPosition,
      size: 9,
      color: rgb(80, 80, 80),
    });
    yPosition -= 12;
  }
  
  yPosition -= 10;
  
  // 相似片段
  if (reportData.segments.length > 0) {
    page.drawText('相似片段', {
      x: margin,
      y: yPosition,
      size: 14,
      color: rgb(0, 0, 0),
    });
    yPosition -= 25;
    
    for (let i = 0; i < Math.min(3, reportData.segments.length); i++) {
      const segment = reportData.segments[i];
      
      page.drawText(`片段 ${i + 1}:`, {
        x: margin + 20,
        y: yPosition,
        size: 10,
        color: rgb(0, 0, 128),
      });
      yPosition -= 15;
      
      const doc1Lines = wrapText(`文档A: ${segment.doc1Segment}`, pageWidth - 60, 9);
      for (const line of doc1Lines) {
        page.drawText(line, {
          x: margin + 30,
          y: yPosition,
          size: 8,
          color: rgb(80, 80, 80),
        });
        yPosition -= 11;
      }
      
      const doc2Lines = wrapText(`文档B: ${segment.doc2Segment}`, pageWidth - 60, 9);
      for (const line of doc2Lines) {
        page.drawText(line, {
          x: margin + 30,
          y: yPosition,
          size: 8,
          color: rgb(80, 80, 80),
        });
        yPosition -= 11;
      }
      
      page.drawText(`相似度: ${segment.similarity}% | 原因: ${segment.reason}`, {
        x: margin + 30,
        y: yPosition,
        size: 8,
        color: rgb(100, 100, 100),
      });
      yPosition -= 15;
      
      if (yPosition < 100) {
        const newPage = pdfDoc.addPage([595, 842]);
        yPosition = 842 - 40;
      }
    }
  }
  
  // 改进建议
  if (reportData.recommendations.length > 0) {
    if (yPosition < 150) {
      const newPage = pdfDoc.addPage([595, 842]);
      yPosition = 842 - 40;
    }
    
    page.drawText('改进建议', {
      x: margin,
      y: yPosition,
      size: 14,
      color: rgb(0, 0, 0),
    });
    yPosition -= 25;
    
    for (const recommendation of reportData.recommendations) {
      const recLines = wrapText(`• ${recommendation}`, pageWidth - 40, 10);
      for (const line of recLines) {
        page.drawText(line, {
          x: margin + 20,
          y: yPosition,
          size: 9,
          color: rgb(80, 80, 80),
        });
        yPosition -= 12;
      }
      yPosition -= 5;
    }
  }
  
  // 页脚
  page.drawText(`生成时间: ${new Date().toLocaleString('zh-CN')}`, {
    x: margin,
    y: 20,
    size: 8,
    color: rgb(150, 150, 150),
  });
  
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * 文本换行
 */
function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const lines: string[] = [];
  const words = text.split('');
  let currentLine = '';
  
  for (const char of words) {
    const testLine = currentLine + char;
    // 简单的字符宽度估算
    const estimatedWidth = testLine.length * (fontSize * 0.5);
    
    if (estimatedWidth > maxWidth) {
      if (currentLine) lines.push(currentLine);
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
| ${reportData.taskName} | ${reportData.createdAt} | ${reportData.analysisMode} |

## 分析概览

### 整体相似度

# ${reportData.overallSimilarity}%

### 分析摘要

${reportData.summary}

## 详细分析

| 维度 | 相似度 (%) |
|---|---|
| 语义相似度 | ${reportData.details.semanticSimilarity} |
| 结构相似度 | ${reportData.details.structuralSimilarity} |
| 风格相似度 | ${reportData.details.styleSimilarity} |
| 主题相似度 | ${reportData.details.topicSimilarity} |
| 语气相似度 | ${reportData.details.toneSimilarity} |
| 词汇相似度 | ${reportData.details.vocabularySimilarity} |

**风险等级**: ${reportData.riskLevel}

**风险说明**: ${reportData.riskDescription}

## 相似片段

`;

  for (let i = 0; i < reportData.segments.length; i++) {
    const segment = reportData.segments[i];
    markdown += `### 片段 ${i + 1}

**文档A**: ${segment.doc1Segment}

**文档B**: ${segment.doc2Segment}

**相似度**: ${segment.similarity}%

**原因**: ${segment.reason}

`;
  }

  markdown += `## 文档列表

| 文件名 | 文件类型 | 文件大小 (KB) |
|---|---|---|
`;

  for (const doc of reportData.documents) {
    markdown += `| ${doc.filename} | ${doc.fileType} | ${doc.fileSize} |
`;
  }

  markdown += `
## 改进建议

`;

  for (const recommendation of reportData.recommendations) {
    markdown += `- ${recommendation}
`;
  }

  markdown += `
---

生成时间: ${new Date().toLocaleString('zh-CN')}
`;

  return markdown;
}
