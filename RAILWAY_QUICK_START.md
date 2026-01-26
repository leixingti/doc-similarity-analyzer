# Railway 快速部署指南

本指南提供了快速部署文档相似度分析器到 Railway 的步骤。

## 🚀 5分钟快速部署

### 前置条件
- GitHub 账户（已登录 Railway）
- Railway 账户（https://railway.app）
- 本仓库已推送到 GitHub

### 步骤 1：创建 Railway 项目

1. 访问 [Railway 官网](https://railway.app)
2. 点击 "New Project" 按钮
3. 选择 "Deploy from GitHub repo"
4. 搜索 `doc-similarity-analyzer` 仓库
5. 点击 "Deploy" 按钮

### 步骤 2：添加 MySQL 数据库

1. 在 Railway 项目中点击 "Add Service"
2. 选择 "Database" → "MySQL"
3. 等待数据库启动（通常需要 1-2 分钟）
4. Railway 会自动设置 `DATABASE_URL` 环境变量

### 步骤 3：配置环境变量

在 Railway 项目中，点击应用，然后点击 "Variables" 标签，添加以下环境变量：

| 环境变量 | 值 | 说明 |
|---------|-----|------|
| `NODE_ENV` | `production` | 生产环境 |
| `JWT_SECRET` | 生成随机字符串 | 用于 JWT 签名 |
| `PORT` | `3000` | 应用端口 |
| `LOG_LEVEL` | `info` | 日志级别 |

**生成 JWT_SECRET：**
在终端执行：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 步骤 4：部署

1. Railway 会自动开始构建和部署
2. 在 "Deployments" 标签中查看部署进度
3. 部署完成后，点击 "Open" 按钮访问应用

### 步骤 5：初始化数据库（可选）

如果需要初始化数据库表：

1. 在 Railway 项目中打开应用
2. 点击 "Connect" 或 "Terminal" 标签
3. 运行以下命令：
   ```bash
   npm run db:push
   ```

## 📋 环境变量参考

### 必需的环境变量
- `NODE_ENV`: 运行环境（`production`）
- `DATABASE_URL`: MySQL 连接字符串（由 Railway 自动提供）
- `JWT_SECRET`: JWT 签名密钥（至少 32 字符）

### 可选的环境变量
- `PORT`: 应用端口（默认 3000）
- `LOG_LEVEL`: 日志级别（默认 info）
- `STORAGE_PATH`: 文件存储路径（默认 `.storage/documents`）

## 🔗 自定义域名（可选）

1. 在 Railway 项目中选择应用
2. 点击 "Settings" → "Domains"
3. 添加自定义域名
4. 按照 Railway 的说明配置 DNS 记录

## 🐛 故障排除

### 构建失败
- 检查 GitHub 仓库中是否有 `package.json` 和 `Dockerfile`
- 查看 Railway 构建日志获取详细错误信息

### 应用无法启动
- 检查 `DATABASE_URL` 环境变量是否正确
- 查看应用日志中的错误信息
- 确保所有必需的环境变量都已设置

### 数据库连接失败
- 验证 MySQL 数据库已启动
- 检查 `DATABASE_URL` 格式是否正确
- 确保数据库用户有足够的权限

## 📊 监控应用

### 查看日志
1. 在 Railway 项目中选择应用
2. 点击 "Logs" 标签
3. 查看实时日志

### 查看性能指标
1. 点击 "Metrics" 标签
2. 查看 CPU、内存、网络等指标

## 🔄 自动部署

Railway 支持自动部署：
- 每当代码推送到 GitHub 的 `main` 分支时
- Railway 会自动检测变更并开始部署
- 部署完成后应用会自动更新

## 💾 备份和恢复

### 查看部署历史
1. 点击 "Deployments" 标签
2. 查看所有部署版本

### 回滚到之前的版本
1. 在部署列表中找到要回滚的版本
2. 点击 "Redeploy" 按钮

## 📞 获取帮助

- Railway 文档：https://docs.railway.app
- 项目 GitHub：https://github.com/leixingti/doc-similarity-analyzer
- 问题报告：在 GitHub 上提交 Issue

## ✅ 部署检查清单

- [ ] GitHub 仓库已连接到 Railway
- [ ] MySQL 数据库已创建
- [ ] 环境变量已配置
- [ ] JWT_SECRET 已生成并设置
- [ ] 应用已成功部署
- [ ] 可以访问应用 URL
- [ ] 数据库连接正常
- [ ] 应用日志中没有错误

## 🎉 部署成功！

如果看到以下标志，说明部署成功：

✅ 应用在 Railway 上正常运行
✅ 可以访问应用的公开 URL
✅ 数据库连接正常
✅ 应用日志中没有错误

---

**提示：** 更详细的部署指南请参考 [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
