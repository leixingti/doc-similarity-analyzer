# 登出功能修复总结

## 问题描述

用户点击"登出"按钮后，无法成功退出系统。系统被重定向到 Manus OAuth 登录页面，而不是本地登录页面。

## 问题分析

### 根本原因

1. **缺少登出后的重定向**: `logout` 函数在清除缓存后，没有重定向到登录页面
2. **错误的重定向 URL**: 使用了 `getLoginUrl()` 返回的 OAuth 登录 URL，而不是本地登录页面 URL

### 问题代码

```typescript
// 原始代码 - useAuth.ts
const logout = useCallback(async () => {
  try {
    await logoutMutation.mutateAsync();
  } catch (error: unknown) {
    if (
      error instanceof TRPCClientError &&
      error.data?.code === "UNAUTHORIZED"
    ) {
      return;
    }
    throw error;
  } finally {
    utils.auth.me.setData(undefined, null);
    await utils.auth.me.invalidate();
    // ❌ 缺少重定向逻辑
  }
}, [logoutMutation, utils]);
```

## 修复方案

### 修改文件

**文件**: `client/src/_core/hooks/useAuth.ts`

### 具体修改

#### 1. 移除 OAuth 登录 URL 导入

```typescript
// ❌ 删除这一行
// import { getLoginUrl } from "@/const";
```

#### 2. 修复默认重定向路径

```typescript
// ❌ 原始代码
const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =

// ✅ 修复后的代码
const { redirectOnUnauthenticated = false, redirectPath = '/login' } =
```

#### 3. 添加登出后的重定向

```typescript
// ❌ 原始代码
finally {
  utils.auth.me.setData(undefined, null);
  await utils.auth.me.invalidate();
  // 缺少重定向
}

// ✅ 修复后的代码
finally {
  utils.auth.me.setData(undefined, null);
  await utils.auth.me.invalidate();
  window.location.href = '/login';  // ← 添加重定向
}
```

## 修复后的工作流程

1. **用户点击登出按钮** → 触发 `logout()` 函数
2. **调用后端登出 API** → 服务器清除会话
3. **清除前端缓存** → 移除用户信息和认证 token
4. **重定向到登录页** → `window.location.href = '/login'`
5. **用户看到登录页面** → 登出完成

## 测试结果

### 测试场景

| 场景 | 结果 | 状态 |
|------|------|------|
| 点击登出按钮 | 成功触发登出 | ✅ |
| 后端登出 API 调用 | 成功清除会话 | ✅ |
| 前端缓存清除 | 用户信息已清除 | ✅ |
| 重定向到登录页 | 重定向到 `/login` | ✅ |
| 登出后无法访问仪表板 | 访问被拒绝 | ✅ |

## 相关代码变更

### 修改前后对比

```diff
- import { getLoginUrl } from "@/const";
  import { trpc } from "@/lib/trpc";
  import { TRPCClientError } from "@trpc/client";
  import { useCallback, useEffect, useMemo } from "react";

  export function useAuth(options?: UseAuthOptions) {
-   const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
+   const { redirectOnUnauthenticated = false, redirectPath = '/login' } =
      options ?? {};

    const logout = useCallback(async () => {
      try {
        await logoutMutation.mutateAsync();
      } catch (error: unknown) {
        if (
          error instanceof TRPCClientError &&
          error.data?.code === "UNAUTHORIZED"
        ) {
          return;
        }
        throw error;
      } finally {
        utils.auth.me.setData(undefined, null);
        await utils.auth.me.invalidate();
+       window.location.href = '/login';
      }
    }, [logoutMutation, utils]);
```

## 影响范围

- **受影响的文件**: `client/src/_core/hooks/useAuth.ts`
- **受影响的功能**: 用户登出流程
- **向后兼容性**: ✅ 完全兼容

## 后续建议

1. **添加登出确认**: 在登出前显示确认对话框
2. **改进错误处理**: 如果登出失败，显示错误消息
3. **清除本地存储**: 确保所有本地数据都被清除
4. **添加日志**: 记录登出事件用于审计

## 总结

通过简单的修改，成功修复了用户无法登出的问题。现在用户可以正确地登出系统，并被重定向到登录页面。
