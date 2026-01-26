# 文件上传失败问题分析

## 问题描述
文件上传功能无法正常工作，后端返回 `401 Unauthorized` 错误。

## 根本原因

### 认证信息丢失
后端日志显示 `[Auth] Missing session cookie`，这表示前端没有正确发送认证信息。

### 问题链条

1. **登录成功** ✅
   - 后端登录 API 正常工作
   - 返回有效的 JWT token

2. **Token 未保存** ❌
   - 前端登录后，token 没有被保存到 localStorage
   - 或者被保存了，但后来被清除了

3. **认证请求失败** ❌
   - 文件上传时，前端无法获取 token
   - tRPC 客户端发送的请求没有 `Authorization` 头
   - 后端无法识别用户身份

## 技术细节

### 前端认证流程
```typescript
// client/src/lib/auth.ts
export const getAuthToken = () => localStorage.getItem('auth_token');

// client/src/main.tsx
const token = getAuthToken();
if (token) {
  headers.set('Authorization', `Bearer ${token}`);
}
```

### 问题
- `getAuthToken()` 返回 `null`
- 导致 `Authorization` 头没有被添加
- 后端无法识别请求来自哪个用户

## 可能的原因

1. **OAuth 认证流程**
   - 系统可能使用 OAuth 而不是邮箱+密码认证
   - OAuth token 可能存储在不同的位置（例如 session 或 cookie）

2. **浏览器 localStorage 问题**
   - localStorage 可能被禁用
   - 或者在特定情况下被清除

3. **登录 API 返回值问题**
   - 前端的 mutation 可能没有正确处理 API 返回值
   - token 可能没有被正确提取和保存

## 解决方案

### 方案 1：修复 Token 保存逻辑
检查 `Login.tsx` 中的 mutation 处理，确保：
1. 登录 API 返回了 token
2. `onSuccess` 回调被正确调用
3. token 被正确保存到 localStorage

### 方案 2：使用 OAuth 认证
如果系统使用 OAuth，需要：
1. 确保 OAuth token 被正确存储
2. 修改 tRPC 客户端配置以使用 OAuth token

### 方案 3：使用 Cookie 认证
如果系统使用 Cookie 认证，需要：
1. 确保 `credentials: include` 被设置
2. 后端正确设置 Cookie

## 当前系统状态

| 功能 | 状态 | 原因 |
|------|------|------|
| 登录 | ✅ | 邮箱+密码登录成功 |
| 文件上传 | ❌ | 认证信息丢失 |
| 创建分析任务 | ❌ | 认证信息丢失 |
| 查看任务 | ❌ | 认证信息丢失 |

## 建议

需要进一步调查：
1. 登录后，token 是否被正确保存到 localStorage
2. 是否使用了 OAuth 或其他认证方式
3. 后端的认证中间件是否正确配置

**关键问题：前端的 tRPC 客户端无法获取有效的认证 token**
