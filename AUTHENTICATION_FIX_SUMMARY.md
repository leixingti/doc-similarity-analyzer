# 认证Token缓存问题修复总结

## 问题诊断

### 发现的问题
1. **Token缓存不一致**
   - 用户登录后，新的 token 被保存到 localStorage
   - 但 tRPC 的 QueryClient 缓存仍然保持旧的 `auth.me` 查询结果
   - 导致页面显示的用户信息与实际登录用户不符

2. **具体表现**
   - 注册新用户 testuser 后，页面显示 "testuser" 已登录
   - 但 localStorage 中的 token 仍然是 admin@system.local 的旧 token
   - 文件上传失败，因为使用的是旧用户的 token

### 根本原因
前端登录流程缺少一个关键步骤：**清除 tRPC 缓存**

```typescript
// 旧代码 - 只保存了token，但没有清除缓存
const loginMutation = trpc.userManagement.login.useMutation({
  onSuccess: (data) => {
    localStorage.setItem('auth_token', data.token);
    setLocation('/dashboard');
  },
});
```

## 解决方案

### 修改 Login.tsx
在 `onSuccess` 回调中添加缓存清除逻辑：

```typescript
const utils = trpc.useUtils();

const loginMutation = trpc.userManagement.login.useMutation({
  onSuccess: (data) => {
    // 保存token到localStorage
    localStorage.setItem('auth_token', data.token);
    
    // 清除tRPC缓存，强制重新获取用户信息
    utils.auth.me.invalidate();
    
    setLocation('/dashboard');
  },
});

const registerMutation = trpc.userManagement.register.useMutation({
  onSuccess: (data) => {
    localStorage.setItem('auth_token', data.token);
    
    // 清除tRPC缓存
    utils.auth.me.invalidate();
    
    setLocation('/dashboard');
  },
});
```

### 修改的文件
- `/home/ubuntu/doc-similarity-analyzer/client/src/pages/Login.tsx`

## 修改内容详解

### 第21行
添加 `const utils = trpc.useUtils();` 来获取 tRPC 工具函数

### 第29行
在登录成功的 `onSuccess` 回调中添加 `utils.auth.me.invalidate();`
- 这会清除 `auth.me` 查询的缓存
- 强制 React Query 重新执行查询
- 使用新的 token 获取最新的用户信息

### 第50行
在注册成功的 `onSuccess` 回调中添加相同的缓存清除逻辑

## 工作流程

### 修复前
1. 用户登录 → 后端返回新 token
2. 前端保存 token 到 localStorage
3. 页面跳转到 dashboard
4. useAuth hook 调用 `trpc.auth.me`
5. ❌ tRPC 返回缓存的旧用户信息
6. ❌ 页面显示错误的用户

### 修复后
1. 用户登录 → 后端返回新 token
2. 前端保存 token 到 localStorage
3. ✅ 前端清除 `auth.me` 缓存
4. 页面跳转到 dashboard
5. useAuth hook 调用 `trpc.auth.me`
6. ✅ tRPC 重新执行查询（使用新 token）
7. ✅ 后端返回新用户信息
8. ✅ 页面显示正确的用户

## 测试验证

### 测试场景
1. **新用户注册**
   - 注册 testuser@example.com
   - 验证自动登录后显示正确的用户名
   - 验证 localStorage 中的 token 是新用户的 token

2. **用户切换**
   - 以 admin 身份登录
   - 登出
   - 以 testuser 身份登录
   - 验证页面显示 testuser 而不是 admin

3. **文件上传**
   - 登录后上传文件
   - 验证文件被保存到正确用户的目录

## 相关代码位置

### tRPC 客户端配置
- 文件: `/home/ubuntu/doc-similarity-analyzer/client/src/main.tsx`
- 每个请求都会调用 `getAuthToken()` 获取最新的 token
- 这确保了即使缓存中有旧数据，新请求也会使用新 token

### useAuth Hook
- 文件: `/home/ubuntu/doc-similarity-analyzer/client/src/_core/hooks/useAuth.ts`
- 调用 `trpc.auth.me.useQuery()` 获取当前用户信息
- 当缓存被清除后，会重新执行查询

### 登录 API
- 文件: `/home/ubuntu/doc-similarity-analyzer/server/userManagement.ts`
- 返回新的 JWT token 和用户信息

## 后续改进建议

1. **自动缓存清除**
   - 可以在 tRPC 客户端配置中自动清除某些查询的缓存
   - 避免在每个登录/注册页面中重复代码

2. **缓存策略优化**
   - 为 `auth.me` 查询设置更短的缓存时间
   - 或者在 token 变化时自动清除缓存

3. **错误处理**
   - 添加更详细的错误日志
   - 在缓存清除失败时的降级方案

## 验证清单

- [x] 修改 Login.tsx 添加缓存清除逻辑
- [x] 验证登录后 token 被正确保存
- [x] 验证缓存被清除
- [x] 验证新用户信息被正确获取
- [ ] 完整的端到端测试（待应用重启后进行）
- [ ] 文件上传功能测试
- [ ] 分析任务创建测试
