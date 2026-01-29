# 密码修改与重置功能说明

## 功能概述

本次更新为文档相似度分析系统添加了完整的密码管理功能，包括：

1. **用户自行修改密码**（已存在，已优化）
2. **忘记密码邮箱重置**（新增功能）

## 新增功能详情

### 1. 数据库变更

#### 新增表：`passwordResetTokens`
用于存储密码重置令牌，包含以下字段：
- `id`: 主键，自增
- `email`: 用户邮箱
- `token`: 重置令牌（64位随机字符串）
- `expiresAt`: 过期时间（30分钟）
- `used`: 是否已使用
- `createdAt`: 创建时间

#### 迁移文件
- `drizzle/0003_add_password_reset.sql`: 数据库迁移SQL
- `drizzle/schema.ts`: 更新schema定义

### 2. 后端API

#### 新增路由（在 `userManagement` 路由器中）

##### `requestPasswordReset`
- **类型**: Public Procedure (Mutation)
- **输入**: `{ email: string }`
- **功能**: 发送密码重置邮件
- **安全特性**: 无论邮箱是否存在都返回成功，防止邮箱枚举攻击

##### `verifyResetToken`
- **类型**: Public Procedure (Query)
- **输入**: `{ token: string }`
- **功能**: 验证重置令牌是否有效
- **返回**: `{ success: boolean, email: string }`

##### `resetPassword`
- **类型**: Public Procedure (Mutation)
- **输入**: `{ token: string, newPassword: string }`
- **功能**: 使用令牌重置密码
- **安全特性**: 验证令牌后立即标记为已使用

#### 新增函数（在 `authDb.ts` 中）

- `createPasswordResetToken(email: string): Promise<string>`
  - 创建密码重置令牌
  - 令牌有效期：30分钟

- `verifyPasswordResetToken(token: string): Promise<string | null>`
  - 验证令牌并返回关联的邮箱
  - 检查令牌是否过期或已使用

- `markTokenAsUsed(token: string): Promise<void>`
  - 标记令牌为已使用

- `resetUserPassword(email: string, newPassword: string): Promise<void>`
  - 重置用户密码（加密存储）

#### 新增邮件功能（在 `email.ts` 中）

- `sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean>`
  - 发送密码重置邮件
  - 包含重置链接和纯文本备用链接
  - 使用 Resend API 发送

### 3. 前端页面

#### 新增页面

##### `ForgotPassword.tsx`
- **路径**: `/forgot-password`
- **功能**: 
  - 输入邮箱地址
  - 请求密码重置链接
  - 显示成功/错误提示
  - 返回登录页面

##### `ResetPassword.tsx`
- **路径**: `/reset-password?token={token}`
- **功能**:
  - 自动验证令牌有效性
  - 输入新密码（两次确认）
  - 重置密码
  - 成功后自动跳转到登录页

#### 修改页面

##### `Login.tsx`
- 在密码输入框下方添加"忘记密码？"链接
- 点击跳转到忘记密码页面

##### `App.tsx`
- 添加 `/forgot-password` 路由
- 添加 `/reset-password` 路由

## 使用流程

### 用户修改密码（已登录）
1. 登录后访问 `/change-password`
2. 输入当前密码
3. 输入新密码（两次确认）
4. 提交修改

### 忘记密码重置流程
1. 在登录页点击"忘记密码？"
2. 输入注册邮箱地址
3. 点击"发送重置链接"
4. 检查邮箱，点击重置链接
5. 在重置页面输入新密码（两次确认）
6. 提交后自动跳转到登录页
7. 使用新密码登录

## 安全特性

1. **令牌安全**
   - 64位随机字符串
   - 30分钟过期时间
   - 一次性使用（使用后立即失效）

2. **防止枚举攻击**
   - 无论邮箱是否存在，都返回相同的成功消息
   - 不暴露用户是否注册

3. **密码加密**
   - 使用 bcrypt 加密存储
   - 加密强度：10轮

4. **邮件安全**
   - 使用 HTTPS 链接
   - 包含过期时间提示
   - 提供纯文本备用链接

## 环境变量要求

确保在 `.env` 文件中配置以下变量：

```env
# Resend API 配置（用于发送邮件）
RESEND_API_KEY=your_resend_api_key
RESEND_FROM=noreply@yourdomain.com

# 前端URL（用于生成重置链接）
FRONTEND_URL=https://yourdomain.com
```

## 数据库迁移

在部署前需要运行数据库迁移：

```bash
pnpm db:push
```

或手动执行迁移SQL：

```bash
mysql -u username -p database_name < drizzle/0003_add_password_reset.sql
```

## 测试建议

1. **功能测试**
   - 测试忘记密码流程
   - 测试令牌过期情况
   - 测试令牌重复使用
   - 测试邮箱不存在情况

2. **安全测试**
   - 测试令牌枚举攻击
   - 测试邮箱枚举攻击
   - 测试密码强度验证

3. **邮件测试**
   - 测试邮件发送成功
   - 测试邮件内容格式
   - 测试重置链接有效性

## 注意事项

1. 确保 Resend API Key 已正确配置
2. 确保 FRONTEND_URL 设置为正确的域名
3. 建议配置邮件发送监控
4. 定期清理过期的重置令牌（可添加定时任务）

## 后续优化建议

1. 添加密码强度检测
2. 添加密码历史记录（防止重复使用旧密码）
3. 添加账户锁定机制（多次失败后锁定）
4. 添加双因素认证（2FA）
5. 添加密码重置频率限制
6. 添加定时清理过期令牌的任务
