import Handlebars from 'handlebars';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';

/**
 * 文书模板引擎
 * 支持变量替换、条件渲染、循环等功能
 */

// 注册自定义Helper
Handlebars.registerHelper('uppercase', function(str: string) {
  return str ? str.toUpperCase() : '';
});

Handlebars.registerHelper('lowercase', function(str: string) {
  return str ? str.toLowerCase() : '';
});

Handlebars.registerHelper('formatDate', function(date: string | Date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
});

Handlebars.registerHelper('formatDateChinese', function(date: string | Date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${convertToChineseNumber(year)}年${convertToChineseNumber(month)}月${convertToChineseNumber(day)}日`;
});

Handlebars.registerHelper('formatMoney', function(amount: number) {
  if (!amount && amount !== 0) return '';
  return amount.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' });
});

Handlebars.registerHelper('formatMoneyChinese', function(amount: number) {
  if (!amount && amount !== 0) return '';
  return convertToChineseMoney(amount);
});

Handlebars.registerHelper('eq', function(a: any, b: any) {
  return a === b;
});

Handlebars.registerHelper('ne', function(a: any, b: any) {
  return a !== b;
});

Handlebars.registerHelper('gt', function(a: number, b: number) {
  return a > b;
});

Handlebars.registerHelper('lt', function(a: number, b: number) {
  return a < b;
});

/**
 * 数字转中文数字
 */
function convertToChineseNumber(num: number): string {
  const chineseNums = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const chineseUnits = ['', '十', '百', '千', '万', '十万', '百万', '千万', '亿'];
  
  if (num === 0) return '零';
  if (num < 10) return chineseNums[num];
  
  let result = '';
  let unitIndex = 0;
  let needZero = false;
  
  while (num > 0) {
    const digit = num % 10;
    
    if (digit === 0) {
      if (needZero && result && result[0] !== '零') {
        result = '零' + result;
      }
      needZero = false;
    } else {
      result = chineseNums[digit] + (unitIndex > 0 ? chineseUnits[unitIndex] : '') + result;
      needZero = true;
    }
    
    num = Math.floor(num / 10);
    unitIndex++;
  }
  
  // 处理"一十"的特殊情况
  if (result.startsWith('一十')) {
    result = result.substring(1);
  }
  
  return result;
}

/**
 * 金额转中文大写
 */
function convertToChineseMoney(amount: number): string {
  const chineseNums = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const chineseUnits = ['', '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿'];
  const chineseDecimalUnits = ['角', '分'];
  
  if (amount === 0) return '零元整';
  
  // 分离整数和小数部分
  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);
  
  let result = '';
  let unitIndex = 0;
  let needZero = false;
  let num = integerPart;
  
  // 处理整数部分
  while (num > 0) {
    const digit = num % 10;
    
    if (digit === 0) {
      if (needZero && result && result[0] !== '零') {
        result = '零' + result;
      }
      needZero = false;
      
      // 处理万和亿的单位
      if (unitIndex === 4 || unitIndex === 8) {
        if (result && !result.startsWith('万') && !result.startsWith('亿')) {
          result = chineseUnits[unitIndex] + result;
        }
      }
    } else {
      result = chineseNums[digit] + chineseUnits[unitIndex] + result;
      needZero = true;
    }
    
    num = Math.floor(num / 10);
    unitIndex++;
  }
  
  result += '元';
  
  // 处理小数部分
  if (decimalPart === 0) {
    result += '整';
  } else {
    const jiao = Math.floor(decimalPart / 10);
    const fen = decimalPart % 10;
    
    if (jiao > 0) {
      result += chineseNums[jiao] + chineseDecimalUnits[0];
    } else {
      result += '零';
    }
    
    if (fen > 0) {
      result += chineseNums[fen] + chineseDecimalUnits[1];
    }
  }
  
  return result;
}

/**
 * 渲染模板
 */
export function renderTemplate(templateContent: string, data: any): string {
  const template = Handlebars.compile(templateContent);
  return template(data);
}

/**
 * 批量渲染模板
 */
export function batchRenderTemplate(templateContent: string, dataList: any[]): string[] {
  const template = Handlebars.compile(templateContent);
  return dataList.map(data => template(data));
}

/**
 * 生成Word文档
 */
export async function generateWordDocument(content: string, filename: string): Promise<Buffer> {
  // 将文本内容转换为段落
  const paragraphs = content.split('\n').map(line => {
    if (!line.trim()) {
      return new Paragraph({ text: '' });
    }
    
    // 检测标题
    if (line.startsWith('# ')) {
      return new Paragraph({
        text: line.substring(2),
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      });
    } else if (line.startsWith('## ')) {
      return new Paragraph({
        text: line.substring(3),
        heading: HeadingLevel.HEADING_2,
      });
    } else if (line.startsWith('### ')) {
      return new Paragraph({
        text: line.substring(4),
        heading: HeadingLevel.HEADING_3,
      });
    }
    
    // 普通段落
    return new Paragraph({
      children: [
        new TextRun({
          text: line,
          size: 28, // 14pt
        }),
      ],
      spacing: {
        line: 360, // 1.5倍行距
        before: 100,
        after: 100,
      },
    });
  });
  
  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs,
    }],
  });
  
  return await Packer.toBuffer(doc);
}

/**
 * 批量生成Word文档
 */
export async function batchGenerateWordDocuments(
  templateContent: string,
  dataList: any[],
  filenameTemplate: string
): Promise<Array<{ filename: string; buffer: Buffer }>> {
  const results: Array<{ filename: string; buffer: Buffer }> = [];
  
  for (const data of dataList) {
    const content = renderTemplate(templateContent, data);
    const filename = renderTemplate(filenameTemplate, data);
    const buffer = await generateWordDocument(content, filename);
    
    results.push({ filename, buffer });
  }
  
  return results;
}

/**
 * 验证模板语法
 */
export function validateTemplate(templateContent: string): { valid: boolean; error?: string } {
  try {
    Handlebars.compile(templateContent);
    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

/**
 * 提取模板变量
 */
export function extractTemplateVariables(templateContent: string): string[] {
  const variables = new Set<string>();
  const regex = /\{\{([^}]+)\}\}/g;
  let match;
  
  while ((match = regex.exec(templateContent)) !== null) {
    const variable = match[1].trim();
    // 移除helper函数名
    const cleanVariable = variable.split(' ')[0].replace(/^[#/]/, '');
    if (cleanVariable && !['if', 'unless', 'each', 'with'].includes(cleanVariable)) {
      variables.add(cleanVariable);
    }
  }
  
  return Array.from(variables);
}
