import * as XLSX from 'xlsx';
import { renderTemplate, batchGenerateWordDocuments } from './documentTemplateEngine';
import { getTemplateById } from './documentTemplates';
import JSZip from 'jszip';

/**
 * 批量导入服务
 * 支持从Excel/CSV导入数据并批量生成文书
 */

export interface ImportData {
  [key: string]: any;
}

/**
 * 解析Excel文件
 */
export function parseExcelFile(buffer: Buffer): ImportData[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // 转换为JSON，第一行作为表头
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (data.length < 2) {
    throw new Error('Excel文件至少需要包含表头和一行数据');
  }
  
  const headers = data[0] as string[];
  const rows = data.slice(1) as any[][];
  
  return rows.map(row => {
    const obj: ImportData = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

/**
 * 解析CSV文件
 */
export function parseCSVFile(buffer: Buffer): ImportData[] {
  const content = buffer.toString('utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV文件至少需要包含表头和一行数据');
  }
  
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(line => parseCSVLine(line));
  
  return rows.map(row => {
    const obj: ImportData = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

/**
 * 解析CSV行（处理引号和逗号）
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * 验证导入数据
 */
export function validateImportData(
  data: ImportData[],
  requiredFields: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  data.forEach((row, index) => {
    requiredFields.forEach(field => {
      if (!row[field] && row[field] !== 0) {
        errors.push(`第${index + 2}行缺少必填字段: ${field}`);
      }
    });
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 批量生成文书
 */
export async function batchGenerateDocuments(
  templateId: string,
  data: ImportData[],
  filenameTemplate?: string
): Promise<Buffer> {
  const template = getTemplateById(templateId);
  
  if (!template) {
    throw new Error(`模板不存在: ${templateId}`);
  }
  
  // 验证数据
  const validation = validateImportData(data, template.variables);
  if (!validation.valid) {
    throw new Error(`数据验证失败:\n${validation.errors.join('\n')}`);
  }
  
  // 批量生成Word文档
  const documents = await batchGenerateWordDocuments(
    template.content,
    data,
    filenameTemplate || template.filenameTemplate
  );
  
  // 打包成ZIP
  const zip = new JSZip();
  
  documents.forEach(({ filename, buffer }) => {
    zip.file(filename, buffer);
  });
  
  return await zip.generateAsync({ type: 'nodebuffer' });
}

/**
 * 生成导入模板
 */
export function generateImportTemplate(templateId: string): Buffer {
  const template = getTemplateById(templateId);
  
  if (!template) {
    throw new Error(`模板不存在: ${templateId}`);
  }
  
  // 创建Excel工作簿
  const workbook = XLSX.utils.book_new();
  
  // 创建表头
  const headers = template.variables;
  const data = [headers];
  
  // 添加示例行
  const exampleRow: any[] = [];
  headers.forEach(header => {
    switch (header) {
      case 'date':
        exampleRow.push('2024-01-01');
        break;
      case 'amount':
      case 'penalty':
        exampleRow.push(100000);
        break;
      case 'phone':
      case 'plaintiff_phone':
      case 'defendant_phone':
      case 'client_phone':
      case 'lawyer_phone':
        exampleRow.push('13800138000');
        break;
      case 'gender':
      case 'plaintiff_gender':
      case 'defendant_gender':
      case 'client_gender':
        exampleRow.push('男');
        break;
      case 'birth':
      case 'plaintiff_birth':
      case 'defendant_birth':
      case 'client_birth':
        exampleRow.push('1990年1月1日');
        break;
      case 'nation':
      case 'plaintiff_nation':
      case 'defendant_nation':
      case 'client_nation':
        exampleRow.push('汉');
        break;
      default:
        exampleRow.push(`示例${header}`);
    }
  });
  data.push(exampleRow);
  
  // 创建工作表
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // 设置列宽
  const colWidths = headers.map(() => ({ wch: 20 }));
  worksheet['!cols'] = colWidths;
  
  // 添加到工作簿
  XLSX.utils.book_append_sheet(workbook, worksheet, '数据');
  
  // 生成Buffer
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * 预览生成结果
 */
export function previewGeneration(
  templateId: string,
  data: ImportData
): string {
  const template = getTemplateById(templateId);
  
  if (!template) {
    throw new Error(`模板不存在: ${templateId}`);
  }
  
  return renderTemplate(template.content, data);
}

/**
 * 获取导入统计
 */
export interface ImportStats {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: string[];
}

export function getImportStats(
  data: ImportData[],
  requiredFields: string[]
): ImportStats {
  const validation = validateImportData(data, requiredFields);
  
  return {
    totalRows: data.length,
    validRows: data.length - validation.errors.length,
    invalidRows: validation.errors.length,
    errors: validation.errors
  };
}
