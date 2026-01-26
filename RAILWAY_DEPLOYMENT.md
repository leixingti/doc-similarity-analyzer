# Railway 部署指南

本文档提供了将文档相似度分析系统部署到 Railway 平台的完整步骤。

## 前置条件

- Railway 账户（https://railway.app）
- GitHub 账户（代码已推送到 GitHub）
- 基本的命令行操作能力

## 系统架构

**技术栈：**
- 前端：React 19 + TypeScript + Tailwind CSS 4
- 后端：Express 4 + tRPC 11
- 数据库：MySQL（Railway 提供）
- 文件存储：S3（Manus 平台提供）

## 部署步骤

### 1. 在 Railway 上创建项目

1. 登录 Railway 控制面板
2. 点击 "New Project"
3. 选择 "Deploy from GitHub"
4. 授权 Railway 访问您的 GitHub 账户
5. 选择 `leixingti/doc-similarity-analyzer` 仓库
6. 选择 `main` 分支

### 2. 配置 MySQL 数据库

1. 在 Railway 项目中点击 "New"
2. 选择 "Database" → "MySQL"
3. 等待 MySQL 实例启动
4. 复制数据库连接字符串（会自动设置为 `DATABASE_URL` 环境变量）

### 3. 配置环境变量

在 Railway 项目设置中添加以下环境变量：

#### 必需的环境变量

| 环境变量 | 说明 | 示例值 |
|---------|------|-------|
| `NODE_ENV` | 运行环境 | `production` |
| `DATABASE_URL` | MySQL 连接字符串 | 由 Railway MySQL 自动提供 |
| `JWT_SECRET` | JWT 签名密钥 | 生成一个随机字符串（至少32字符） |
| `VITE_APP_ID` | Manus OAuth 应用ID | 从 Manus 平台获取 |
| `OAUTH_SERVER_URL` | OAuth 服务器地址 | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | OAuth 登录门户 | 从 Manus 平台获取 |
| `OWNER_OPEN_ID` | 项目所有者 OpenID | 从 Manus 平台获取 |
| `OWNER_NAME` | 项目所有者名称 | 您的名称 |
| `BUILT_IN_FORGE_API_URL` | Manus API 地址 | `https://api.manus.im` |
| `BUILT_IN_FORGE_API_KEY` | Manus API 密钥 | 从 Manus 平台获取 |
| `VITE_FRONTEND_FORGE_API_URL` | 前端 Manus API 地址 | `https://api.manus.im` |
| `VITE_FRONTEND_FORGE_API_KEY` | 前端 Manus API 密钥 | 从 Manus 平台获取 |

#### SMTP 邮件服务配置

| 环境变量 | 说明 | 示例值 |
|---------|------|-------|
| `SMTP_HOST` | SMTP 服务器地址 | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP 端口 | `587` |
| `SMTP_USER` | SMTP 用户名 | `your-email@gmail.com` |
| `SMTP_PASSWORD` | SMTP 密码/应用密码 | Gmail 应用专用密码 |

#### 可选的环境变量

| 环境变量 | 说明 | 默认值 |
|---------|------|-------|
| `VITE_APP_TITLE` | 应用标题 | `文档相似度分析系统` |
| `VITE_APP_LOGO` | 应用 Logo URL | - |
| `VITE_ANALYTICS_ENDPOINT` | 分析服务端点 | - |
| `VITE_ANALYTICS_WEBSITE_ID` | 分析网站ID | - |

### 4. 生成环境变量

**JWT_SECRET 生成方法：**

在本地终端执行：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

复制生成的字符串到 Railway 的 `JWT_SECRET` 环境变量。

### 5. 配置 Railway 构建设置

Railway 会自动检测项目类型。确保以下配置正确：

**构建命令：**
```bash
pnpm install && pnpm run build
```

**启动命令：**
```bash
pnpm run start
```

**端口：** 应用会自动使用 `PORT` 环境变量（Railway 提供）

### 6. 初始化数据库

部署后，需要初始化数据库和管理员账户：

1. 连接到 Railway 应用的远程终端
2. 运行数据库迁移：
   ```bash
   pnpm db:push
   ```
3. 初始化管理员账户：
   ```bash
   node scripts/init-admin.mjs
   ```

**管理员账户凭证：**
- 邮箱：`admin@system.local`
- 密码：`123456`
- 首次登录时需要修改密码

### 7. 配置自定义域名（可选）

1. 在 Railway 项目中选择应用
2. 点击 "Settings" → "Domains"
3. 添加自定义域名或使用 Railway 提供的子域名

## 部署检查清单

- [ ] MySQL 数据库已创建并连接
- [ ] 所有必需的环境变量已配置
- [ ] JWT_SECRET 已生成并设置
- [ ] 构建命令和启动命令正确
- [ ] 数据库迁移已执行
- [ ] 管理员账户已初始化
- [ ] 应用可以正常启动（检查日志）
- [ ] 邮件服务可以正常发送（测试发送验证码）
- [ ] 登录功能正常（邮箱/密码和 OAuth）

## 常见问题

### 问题1：数据库连接失败

**症状：** 应用启动失败，日志显示 "DATABASE_URL is required"

**解决方案：**
1. 确认 MySQL 数据库已启动
2. 检查 `DATABASE_URL` 环境变量是否正确设置
3. 验证数据库连接字符串格式：`mysql://user:password@host:port/database`

### 问题2：构建失败

**症状：** Railway 构建日志显示错误

**解决方案：**
1. 检查本地构建是否成功：`pnpm build`
2. 确认所有依赖已正确安装
3. 查看详细的构建日志找出错误原因

### 问题3：邮件发送失败

**症状：** 注册时收不到验证码

**解决方案：**
1. 检查 SMTP 配置是否正确
2. 对于 Gmail，确保使用的是应用专用密码而不是账户密码
3. 检查应用日志中的 SMTP 错误信息

### 问题4：OAuth 登录失败

**症状：** 点击 OAuth 登录按钮后无反应或显示错误

**解决方案：**
1. 确认 `VITE_APP_ID` 和 `OAUTH_SERVER_URL` 正确
2. 检查应用的 OAuth 回调 URL 是否在 Manus 平台中配置
3. 回调 URL 应为：`https://your-domain/api/oauth/callback`

## 监控和维护

### 查看日志

在 Railway 控制面板中：
1. 选择应用
2. 点击 "Logs" 标签
3. 查看实时日志或历史日志

### 数据库备份

Railway 提供自动备份功能。在 MySQL 设置中可以配置备份策略。

### 性能监控

Railway 提供内置的性能监控工具，可以查看：
- CPU 使用率
- 内存使用率
- 网络 I/O
- 部署历史

## 扩展和优化

### 增加内存

如果应用运行缓慢，可以在 Railway 中增加分配的内存。

### 使用 CDN

考虑使用 Cloudflare 或其他 CDN 服务来加速静态资源。

### 数据库优化

- 为常用查询字段添加索引
- 定期清理过期数据
- 监控数据库性能

## 回滚和恢复

如果部署出现问题：

1. 在 Railway 中查看部署历史
2. 选择之前的稳定版本
3. 点击 "Redeploy" 恢复到该版本

## 获取帮助

- Railway 文档：https://docs.railway.app
- 项目 GitHub：https://github.com/leixingti/doc-similarity-analyzer
- 问题报告：在 GitHub 上提交 Issue

## 成功标志

部署成功的标志：

✅ 应用在 Railway 上正常运行
✅ 可以访问应用的公开 URL
✅ 邮箱/密码登录功能正常
✅ OAuth 登录功能正常
✅ 管理员可以管理用户
✅ 文档上传和分析功能正常
✅ 数据库查询正常
✅ 邮件发送正常

## 下一步

部署完成后，建议：

1. **配置自定义域名** - 使用您自己的域名而不是 Railway 的子域名
2. **设置 SSL 证书** - Railway 会自动配置 HTTPS
3. **配置备份策略** - 定期备份数据库
4. **监控应用性能** - 定期检查日志和性能指标
5. **更新依赖** - 定期更新 npm 包以获得安全补丁

---

**最后更新：** 2026年1月26日
**版本：** 1.0.0
