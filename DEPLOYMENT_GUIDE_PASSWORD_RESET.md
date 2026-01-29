# 密码重置功能部署指南

## 部署前准备

### 1. 环境变量配置

在部署环境的 `.env` 文件中添加或确认以下配置：

```env
# Resend API 配置（必需）
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM=noreply@yourdomain.com

# 前端URL配置（必需）
FRONTEND_URL=https://yourdomain.com
# 或本地开发环境
# FRONTEND_URL=http://localhost:5000

# 数据库配置（已有）
DATABASE_URL=mysql://user:password@host:port/database
```

### 2. 获取 Resend API Key

1. 访问 [Resend](https://resend.com/)
2. 注册账号并登录
3. 创建 API Key
4. 配置发件域名（需要验证DNS记录）
5. 将 API Key 添加到环境变量

## 部署步骤

### 步骤 1: 拉取最新代码

```bash
git pull origin main
```

### 步骤 2: 安装依赖

```bash
pnpm install
```

### 步骤 3: 运行数据库迁移

**方法 1: 使用 drizzle-kit**
```bash
pnpm db:push
```

**方法 2: 手动执行SQL**
```bash
# 连接到数据库
mysql -u username -p database_name

# 执行迁移SQL
source drizzle/0003_add_password_reset.sql;

# 验证表是否创建成功
SHOW TABLES LIKE 'passwordResetTokens';
DESCRIBE passwordResetTokens;
```

### 步骤 4: 验证数据库表结构

确认 `passwordResetTokens` 表已创建，包含以下字段：
- id (int, PRIMARY KEY, AUTO_INCREMENT)
- email (varchar(320))
- token (varchar(255), UNIQUE)
- expiresAt (timestamp)
- used (boolean, DEFAULT false)
- createdAt (timestamp, DEFAULT now())

### 步骤 5: 构建项目

```bash
pnpm build
```

### 步骤 6: 启动服务

**开发环境：**
```bash
pnpm dev
```

**生产环境：**
```bash
pnpm start
```

## 功能测试

### 测试 1: 忘记密码流程

1. 访问登录页面 `/login`
2. 点击"忘记密码？"链接
3. 输入注册邮箱
4. 点击"发送重置链接"
5. 检查邮箱是否收到重置邮件
6. 点击邮件中的重置链接
7. 输入新密码（两次）
8. 提交重置
9. 使用新密码登录

### 测试 2: 令牌过期

1. 请求密码重置
2. 等待30分钟后点击链接
3. 应显示"重置链接无效或已过期"

### 测试 3: 令牌重复使用

1. 请求密码重置
2. 使用令牌重置密码
3. 再次使用相同令牌
4. 应显示"重置链接无效或已过期"

### 测试 4: 邮箱不存在

1. 使用未注册的邮箱请求重置
2. 应显示"如果该邮箱已注册，将收到密码重置邮件"
3. 不应发送邮件

## 常见问题排查

### 问题 1: 邮件发送失败

**症状：** 提示"邮件发送失败，请稍后重试"

**解决方案：**
1. 检查 `RESEND_API_KEY` 是否正确配置
2. 检查 Resend 账户是否有效
3. 检查发件域名是否已验证
4. 查看服务器日志获取详细错误信息

```bash
# 查看日志
tail -f logs/app.log
```

### 问题 2: 重置链接无效

**症状：** 点击邮件链接后显示"重置链接无效或已过期"

**解决方案：**
1. 检查 `FRONTEND_URL` 是否配置正确
2. 检查令牌是否在30分钟内使用
3. 检查令牌是否已被使用
4. 检查数据库中的 `passwordResetTokens` 表

```sql
-- 查询令牌记录
SELECT * FROM passwordResetTokens WHERE email = 'user@example.com' ORDER BY createdAt DESC LIMIT 5;
```

### 问题 3: 数据库迁移失败

**症状：** 执行 `pnpm db:push` 报错

**解决方案：**
1. 检查数据库连接是否正常
2. 检查数据库用户权限
3. 手动执行SQL文件

```bash
mysql -u username -p database_name < drizzle/0003_add_password_reset.sql
```

### 问题 4: 前端页面404

**症状：** 访问 `/forgot-password` 或 `/reset-password` 显示404

**解决方案：**
1. 确认前端路由已正确配置
2. 重新构建前端

```bash
pnpm build
```

## 监控建议

### 1. 邮件发送监控

监控邮件发送成功率和失败原因：

```javascript
// 在 email.ts 中添加日志
console.log(`[Email] Password reset email sent to ${email}, status: ${response.status}`);
```

### 2. 令牌使用监控

监控令牌创建、使用和过期情况：

```sql
-- 统计令牌使用情况
SELECT 
  DATE(createdAt) as date,
  COUNT(*) as total,
  SUM(CASE WHEN used = 1 THEN 1 ELSE 0 END) as used,
  SUM(CASE WHEN expiresAt < NOW() THEN 1 ELSE 0 END) as expired
FROM passwordResetTokens
GROUP BY DATE(createdAt)
ORDER BY date DESC
LIMIT 30;
```

### 3. 清理过期令牌

建议添加定时任务清理过期令牌：

```sql
-- 清理30天前的过期令牌
DELETE FROM passwordResetTokens 
WHERE createdAt < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

可以使用 cron 定时执行：

```bash
# 每天凌晨2点清理
0 2 * * * mysql -u username -p'password' database_name -e "DELETE FROM passwordResetTokens WHERE createdAt < DATE_SUB(NOW(), INTERVAL 30 DAY);"
```

## 安全建议

1. **使用HTTPS**: 确保生产环境使用HTTPS，保护重置链接安全
2. **限制请求频率**: 考虑添加请求频率限制，防止滥用
3. **日志记录**: 记录所有密码重置请求和操作
4. **监控异常**: 监控异常的重置请求模式
5. **定期审计**: 定期审计密码重置日志

## 回滚方案

如果需要回滚此功能：

```bash
# 1. 回滚代码
git revert HEAD

# 2. 删除数据库表（可选）
mysql -u username -p database_name -e "DROP TABLE IF EXISTS passwordResetTokens;"

# 3. 重新构建和部署
pnpm build
pnpm start
```

## 联系支持

如有问题，请查看：
- 项目文档：`PASSWORD_RESET_FEATURE.md`
- 项目仓库：https://github.com/leixingti/doc-similarity-analyzer
- 提交Issue获取帮助
