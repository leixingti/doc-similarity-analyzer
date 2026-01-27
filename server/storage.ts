// 存储模块 - 支持 Manus 存储服务和本地存储

import { ENV } from './_core/env';
import * as fs from 'fs';
import * as path from 'path';

// 如果配置了 Manus 存储凭证，使用 Manus 存储；否则使用本地存储
const USE_LOCAL_STORAGE = !ENV.forgeApiUrl || !ENV.forgeApiKey;
const STORAGE_DIR = path.join(process.cwd(), '.storage');

type StorageConfig = { baseUrl: string; apiKey: string };

function getStorageConfig(): StorageConfig {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  if (!baseUrl || !apiKey) {
    console.log('Using local file storage (Manus credentials not configured)');
    return { baseUrl: '', apiKey: '' };
  }

  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(
  baseUrl: string,
  relKey: string,
  apiKey: string
): Promise<string> {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  return (await response.json()).url;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

// 本地存储辅助函数
function saveToLocalStorage(relKey: string, data: Buffer | Uint8Array | string): { key: string; url: string } {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  
  const key = normalizeKey(relKey);
  const filePath = path.join(STORAGE_DIR, key);
  const dir = path.dirname(filePath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (typeof data === 'string') {
    fs.writeFileSync(filePath, data);
  } else {
    fs.writeFileSync(filePath, Buffer.from(data));
  }
  
  return { key, url: `/storage/${key}` };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  // 如果配置为本地存储,直接使用
  if (USE_LOCAL_STORAGE) {
    console.log('[Storage] Using local storage');
    return saveToLocalStorage(relKey, data);
  }
  
  // 尝试使用 Manus 存储,失败则回退到本地存储
  try {
    const { baseUrl, apiKey } = getStorageConfig();
    const key = normalizeKey(relKey);
    const uploadUrl = buildUploadUrl(baseUrl, key);
    const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
    
    console.log('[Storage] Attempting Manus storage upload to:', uploadUrl.toString());
    
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: buildAuthHeaders(apiKey),
      body: formData,
    });

    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText);
      console.error(`[Storage] Manus storage upload failed (${response.status}): ${message}`);
      console.log('[Storage] Falling back to local storage');
      return saveToLocalStorage(relKey, data);
    }
    
    const url = (await response.json()).url;
    console.log('[Storage] Manus storage upload successful');
    return { key, url };
  } catch (error) {
    console.error('[Storage] Manus storage error:', error);
    console.log('[Storage] Falling back to local storage');
    return saveToLocalStorage(relKey, data);
  }
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string; }> {
  const key = normalizeKey(relKey);
  
  if (USE_LOCAL_STORAGE) {
    return { key, url: `/storage/${key}` };
  }
  
  const { baseUrl, apiKey } = getStorageConfig();
  return {
    key,
    url: await buildDownloadUrl(baseUrl, key, apiKey),
  };
}
