// 本地文件存储实现（用于开发测试）
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_DIR = path.join(process.cwd(), '.storage');

// 确保存储目录存在
function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  ensureStorageDir();
  
  const key = relKey.replace(/^\/+/, "");
  const filePath = path.join(STORAGE_DIR, key);
  
  // 创建目录
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // 写入文件
  if (typeof data === 'string') {
    fs.writeFileSync(filePath, data);
  } else {
    fs.writeFileSync(filePath, Buffer.from(data));
  }
  
  // 返回本地 URL（用于开发）
  const url = `/storage/${key}`;
  
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  const url = `/storage/${key}`;
  
  return { key, url };
}

export async function storageDelete(relKey: string): Promise<void> {
  const key = relKey.replace(/^\/+/, "");
  const filePath = path.join(STORAGE_DIR, key);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

// 获取存储文件的实际路径（用于读取）
export function getStorageFilePath(relKey: string): string {
  const key = relKey.replace(/^\/+/, "");
  return path.join(STORAGE_DIR, key);
}
