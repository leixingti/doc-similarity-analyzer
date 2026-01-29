import mammoth from 'mammoth';
// pdf-parse will be dynamically imported
import * as XLSX from 'xlsx';
import { marked } from 'marked';

/**
 * 文件处理器 - 支持多种文档格式的文本提取
 * 支持格式: DOCX, PDF, TXT, PPTX, XLSX, Markdown, HTML
 */

export interface FileMetadata {
  pages?: number;
  words?: number;
  characters?: number;
  sheets?: number;
  slides?: number;
}

export interface ProcessedFile {
  text: string;
  metadata: FileMetadata;
}

/**
 * 处理DOCX文件
 */
export async function processDocx(buffer: Buffer): Promise<ProcessedFile> {
  try {
    console.log('[FileProcessor] Starting DOCX processing, buffer size:', buffer.length);
    
    // 检查buffer是否有效
    if (!buffer || buffer.length === 0) {
      throw new Error('Empty or invalid buffer');
    }
    
    // 检查文件大小限制（50MB）
    const maxSize = 50 * 1024 * 1024;
    if (buffer.length > maxSize) {
      throw new Error(`File too large: ${(buffer.length / 1024 / 1024).toFixed(2)}MB (max: 50MB)`);
    }
    
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    
    console.log('[FileProcessor] DOCX processed successfully, text length:', text.length);
    
    // 检查是否成功提取文本
    if (!text || text.trim().length === 0) {
      console.warn('[FileProcessor] DOCX file contains no text content');
      // 不抛出错误，返回空文本
      return {
        text: '',
        metadata: {
          words: 0,
          characters: 0,
        }
      };
    }
    
    return {
      text,
      metadata: {
        words: text.split(/\s+/).filter((w: string) => w.length > 0).length,
        characters: text.length,
      }
    };
  } catch (error: any) {
    console.error('[FileProcessor] DOCX processing error:', error);
    console.error('[FileProcessor] Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    throw new Error(`Failed to process DOCX file: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * 处理PDF文件
 */
export async function processPdf(buffer: Buffer): Promise<ProcessedFile> {
  try {
    console.log('[FileProcessor] Starting PDF processing, buffer size:', buffer.length);
    // Import pdf-parse v2 with correct API
    const module = await import('pdf-parse');
    const { PDFParse } = module;
    console.log('[FileProcessor] pdf-parse module loaded successfully');
    
    // Convert Buffer to Uint8Array for pdf-parse
    const uint8Array = new Uint8Array(buffer);
    
    // Create parser instance with data parameter
    const parser = new PDFParse({ data: uint8Array });
    const result = await parser.getText();
    
    console.log('[FileProcessor] PDF parsed successfully, text length:', result.text.length);
    const text = result.text;
    
    // Get page count using getInfo if available
    let pageCount = 1;
    try {
      const info = await parser.getInfo();
      pageCount = info.numpages || 1;
    } catch (e) {
      console.warn('[FileProcessor] Could not retrieve page count, defaulting to 1');
    }
    
    return {
      text,
      metadata: {
        pages: pageCount,
        words: text.split(/\s+/).filter((w: string) => w.length > 0).length,
        characters: text.length,
      }
    };
  } catch (error: any) {
    console.error('[FileProcessor] PDF processing error:', error);
    console.error('[FileProcessor] Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    throw new Error(`Failed to process PDF file: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * 处理TXT文件
 */
export async function processTxt(buffer: Buffer): Promise<ProcessedFile> {
  try {
    const text = buffer.toString('utf-8');
    
    return {
      text,
      metadata: {
        words: text.split(/\s+/).filter((w: string) => w.length > 0).length,
        characters: text.length,
      }
    };
  } catch (error) {
    console.error('[FileProcessor] TXT processing error:', error);
    throw new Error('Failed to process TXT file');
  }
}

/**
 * 处理PPTX文件（简化版，提取文本）
 */
export async function processPptx(buffer: Buffer): Promise<ProcessedFile> {
  try {
    // PPTX是ZIP格式，包含XML文件
    // 简化处理：使用mammoth的文本提取能力
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    
    return {
      text,
      metadata: {
        words: text.split(/\s+/).filter((w: string) => w.length > 0).length,
        characters: text.length,
      }
    };
  } catch (error) {
    console.error('[FileProcessor] PPTX processing error:', error);
    throw new Error('Failed to process PPTX file');
  }
}

/**
 * 处理XLSX文件
 */
export async function processXlsx(buffer: Buffer): Promise<ProcessedFile> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let text = '';
    let totalCells = 0;
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const sheetText = XLSX.utils.sheet_to_txt(worksheet, { blankrows: false });
      text += `\n=== ${sheetName} ===\n${sheetText}\n`;
      
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      totalCells += (range.e.r - range.s.r + 1) * (range.e.c - range.s.c + 1);
    });
    
    return {
      text: text.trim(),
      metadata: {
        sheets: workbook.SheetNames.length,
        words: text.split(/\s+/).filter((w: string) => w.length > 0).length,
        characters: text.length,
      }
    };
  } catch (error) {
    console.error('[FileProcessor] XLSX processing error:', error);
    throw new Error('Failed to process XLSX file');
  }
}

/**
 * 处理Markdown文件
 */
export async function processMarkdown(buffer: Buffer): Promise<ProcessedFile> {
  try {
    const markdown = buffer.toString('utf-8');
    // 转换为HTML然后提取纯文本
    const html = await marked(markdown);
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    return {
      text,
      metadata: {
        words: text.split(/\s+/).filter((w: string) => w.length > 0).length,
        characters: text.length,
      }
    };
  } catch (error) {
    console.error('[FileProcessor] Markdown processing error:', error);
    throw new Error('Failed to process Markdown file');
  }
}

/**
 * 处理HTML文件
 */
export async function processHtml(buffer: Buffer): Promise<ProcessedFile> {
  try {
    const html = buffer.toString('utf-8');
    // 移除HTML标签，提取纯文本
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
    
    return {
      text,
      metadata: {
        words: text.split(/\s+/).filter((w: string) => w.length > 0).length,
        characters: text.length,
      }
    };
  } catch (error) {
    console.error('[FileProcessor] HTML processing error:', error);
    throw new Error('Failed to process HTML file');
  }
}

/**
 * 根据文件类型处理文件
 */
export async function processFile(buffer: Buffer, fileType: string): Promise<ProcessedFile> {
  const type = fileType.toLowerCase();
  
  switch (type) {
    case 'docx':
    case 'doc':
      return processDocx(buffer);
    
    case 'pdf':
      return processPdf(buffer);
    
    case 'txt':
      return processTxt(buffer);
    
    case 'pptx':
    case 'ppt':
      return processPptx(buffer);
    
    case 'xlsx':
    case 'xls':
      return processXlsx(buffer);
    
    case 'md':
    case 'markdown':
      return processMarkdown(buffer);
    
    case 'html':
    case 'htm':
      return processHtml(buffer);
    
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * 验证文件格式
 */
export function isValidFileType(fileType: string): boolean {
  const validTypes = ['docx', 'doc', 'pdf', 'txt', 'pptx', 'ppt', 'xlsx', 'xls', 'md', 'markdown', 'html', 'htm'];
  return validTypes.includes(fileType.toLowerCase());
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}
