# Railway 部署设置指南

本指南提供了将文档相似度分析器应用部署到 Railway 平台的完整步骤。

## 📋 目录

1. [快速开始](#快速开始)
2. [详细步骤](#详细步骤)
3. [环境变量配置](#环境变量配置)
4. [故障排除](#故障排除)
5. [监控和维护](#监控和维护)

## 🚀 快速开始

### 前置条件
- GitHub 账户
- Railway 账户（https://railway.app）
- 本仓库已推送到 GitHub

### 3 步快速部署

**第 1 步：创建项目**
1. 访问 https://railway.app
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 搜索 `doc-similarity-analyzer`
5. 点击 "Deploy"

**第 2 步：添加数据库**
1. 点击 "Add Service"
2. 选择 "MySQL"
3. 等待启动完成

**第 3 步：配置环境变量**
添加以下环境变量：
- `NODE_ENV`: `production`
- `JWT_SECRET`: 生成随机字符串
- `PORT`: `3000`

## 📝 详细步骤

### 步骤 1：在 Railway 创建项目

#### 1.1 登录 Railway
1. 访问 [Railway 官网](https://railway.app)
2. 点击 "Login" 按钮
3. 选择 "Login with GitHub"
4. 授权 Railway 访问您的 GitHub 账户

#### 1.2 创建新项目
1. 在 Railway 仪表板中，点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 搜索 `doc-similarity-analyzer`
4. 点击仓库名称
5. 点击 "Deploy" 按钮

#### 1.3 等待初始部署
- Railway 会自动检测项目类型
- 开始构建和部署
- 在 "Deployments" 标签中查看进度

### 步骤 2：配置 MySQL 数据库

#### 2.1 添加 MySQL 服务
1. 在 Railway 项目中，点击 "Add Service"
2. 选择 "Database"
3. 选择 "MySQL"
4. 等待 MySQL 实例启动（通常 1-2 分钟）

#### 2.2 验证数据库连接
1. Railway 会自动创建 `DATABASE_URL` 环境变量
2. 可以在 "Variables" 标签中查看连接字符串
3. 格式应为：`mysql://user:password@host:port/database`

### 步骤 3：配置环境变量

#### 3.1 访问变量设置
1. 在 Railway 项目中选择应用
2. 点击 "Variables" 标签

#### 3.2 添加必需的环境变量

| 变量名 | 值 | 说明 |
|-------|-----|------|
| `NODE_ENV` | `production` | 生产环境 |
| `JWT_SECRET` | 见下文 | JWT 签名密钥 |
| `PORT` | `3000` | 应用端口 |
| `LOG_LEVEL` | `info` | 日志级别 |

#### 3.3 生成 JWT_SECRET

在本地终端执行：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

复制输出的字符串到 Railway 的 `JWT_SECRET` 变量。

### 步骤 4：部署应用

#### 4.1 启动部署
1. 所有配置完成后，Railway 会自动开始部署
2. 在 "Deployments" 标签中查看部署进度
3. 等待部署完成（通常 5-10 分钟）

#### 4.2 访问应用
1. 部署完成后，点击 "Open" 按钮
2. 或者在 "Settings" 中查看应用 URL
3. 应用应该在 Railway 提供的域名上运行

### 步骤 5：初始化数据库（可选）

如果需要初始化数据库表：

#### 5.1 打开远程终端
1. 在 Railway 项目中选择应用
2. 点击 "Connect" 或 "Terminal" 标签

#### 5.2 运行数据库迁移
```bash
npm run db:push
```

## 🔐 环境变量配置

### 必需的环境变量

#### NODE_ENV
- **值**: `production`
- **说明**: 运行环境标识
- **示例**: `production`

#### DATABASE_URL
- **值**: MySQL 连接字符串
- **说明**: 由 Railway MySQL 自动提供
- **格式**: `mysql://username:password@host:port/database`
- **示例**: `mysql://root:abc123@mysql.railway.internal:3306/railway`

#### JWT_SECRET
- **值**: 随机字符串（至少 32 字符）
- **说明**: 用于 JWT 令牌签名
- **生成方法**: 
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### 可选的环境变量

#### PORT
- **值**: `3000`
- **说明**: 应用监听端口
- **默认值**: `3000`

#### LOG_LEVEL
- **值**: `info` | `debug` | `warn` | `error`
- **说明**: 日志输出级别
- **默认值**: `info`

#### STORAGE_PATH
- **值**: `.storage/documents`
- **说明**: 文件存储路径
- **默认值**: `.storage/documents`

## 🐛 故障排除

### 问题 1：构建失败

**症状**
- Railway 构建日志显示错误
- 部署无法完成

**原因**
- 依赖安装失败
- 构建脚本错误
- 环境变量缺失

**解决方案**
1. 检查 Railway 构建日志获取详细错误
2. 本地运行 `pnpm build` 验证构建
3. 确保所有依赖都已正确安装
4. 检查 `package.json` 中的构建脚本

### 问题 2：应用无法启动

**症状**
- 应用启动后立即崩溃
- 无法访问应用 URL

**原因**
- 环境变量缺失
- 数据库连接失败
- 启动脚本错误

**解决方案**
1. 检查应用日志：点击 "Logs" 标签
2. 验证所有必需环境变量已设置
3. 检查 `DATABASE_URL` 是否正确
4. 确保 MySQL 数据库已启动

### 问题 3：数据库连接失败

**症状**
- 应用日志显示数据库连接错误
- 无法创建表或查询数据

**原因**
- MySQL 数据库未启动
- `DATABASE_URL` 格式错误
- 数据库用户权限不足

**解决方案**
1. 确保 MySQL 服务已启动
2. 验证 `DATABASE_URL` 格式：`mysql://user:password@host:port/database`
3. 检查数据库用户权限
4. 尝试手动连接数据库测试连接

### 问题 4：文件上传失败

**症状**
- 上传文件时出现错误
- 文件无法保存

**原因**
- 存储路径权限不足
- 磁盘空间不足
- 文件大小超过限制

**解决方案**
1. 检查应用日志获取详细错误
2. 验证存储路径权限
3. 检查磁盘可用空间
4. 确认文件大小在允许范围内

### 问题 5：内存不足

**症状**
- 应用频繁重启
- 处理大文件时崩溃

**原因**
- 分配的内存不足
- 内存泄漏

**解决方案**
1. 在 Railway 中增加内存分配
2. 检查应用日志中的内存使用情况
3. 优化代码减少内存占用
4. 增加 Node.js 堆大小

## 📊 监控和维护

### 查看应用日志

#### 实时日志
1. 在 Railway 项目中选择应用
2. 点击 "Logs" 标签
3. 查看实时日志输出

#### 历史日志
1. 在 "Logs" 标签中向下滚动
2. 查看历史日志记录
3. 可以按时间范围筛选

### 监控性能指标

#### 访问指标
1. 点击 "Metrics" 标签
2. 查看以下指标：
   - CPU 使用率
   - 内存使用率
   - 网络 I/O
   - 请求延迟

#### 设置告警
1. 点击 "Alerts" 标签
2. 创建新告警规则
3. 设置告警条件（如 CPU > 80%）
4. 配置通知方式

### 数据库备份

#### 自动备份
- Railway 提供自动备份功能
- 默认每天备份一次
- 可在 MySQL 设置中配置备份策略

#### 手动备份
1. 连接到 Railway 远程终端
2. 使用 `mysqldump` 导出数据库
3. 将备份文件下载到本地

### 查看部署历史

#### 访问部署历史
1. 点击 "Deployments" 标签
2. 查看所有部署版本
3. 每个部署显示时间、状态、提交信息

#### 回滚到之前版本
1. 在部署列表中找到要回滚的版本
2. 点击版本右侧的菜单
3. 选择 "Redeploy" 按钮
4. 确认回滚操作

## 🔄 自动部署

Railway 支持自动部署工作流：

### 启用自动部署
1. 在 Railway 项目中点击 "Settings"
2. 找到 "GitHub" 部分
3. 确保 "Auto-deploy" 已启用

### 自动部署流程
1. 代码推送到 GitHub `main` 分支
2. Railway 自动检测代码变更
3. 自动触发构建流程
4. 自动部署新版本到生产环境

### 禁用自动部署
1. 在 "Settings" 中禁用 "Auto-deploy"
2. 之后需要手动部署

## 🔗 自定义域名

### 添加自定义域名

#### 1. 在 Railway 中配置
1. 在项目中选择应用
2. 点击 "Settings" → "Domains"
3. 点击 "Add Domain"
4. 输入自定义域名（如 `app.example.com`）

#### 2. 配置 DNS 记录
1. 在域名注册商的 DNS 设置中
2. 添加 CNAME 记录
3. 指向 Railway 提供的域名
4. 等待 DNS 生效（通常 15-30 分钟）

#### 3. 验证配置
1. 等待 SSL 证书自动配置
2. 访问自定义域名验证
3. 应该能正常访问应用

## 📈 性能优化

### 优化构建速度
- 使用多阶段 Docker 构建
- 利用 Docker 缓存
- 减少镜像大小

### 优化运行时性能
- 配置适当的内存限制
- 使用连接池管理数据库连接
- 启用 gzip 压缩
- 使用 CDN 加速静态资源

### 优化数据库性能
- 为常用查询字段添加索引
- 定期清理过期数据
- 监控数据库性能指标

## 💰 成本管理

### Railway 定价
- **免费层**: 每月 $5 额度
- **按需付费**: 超出免费额度后按使用量计费

### 成本优化建议
- 使用共享数据库实例
- 定期清理不需要的资源
- 监控资源使用情况
- 合理配置内存和 CPU

## ✅ 部署检查清单

### 部署前
- [ ] GitHub 仓库已创建并推送代码
- [ ] Railway 账户已创建
- [ ] 已授权 Railway 访问 GitHub

### 部署中
- [ ] 项目已在 Railway 中创建
- [ ] MySQL 数据库已添加
- [ ] 环境变量已配置
- [ ] JWT_SECRET 已生成

### 部署后
- [ ] 应用成功部署
- [ ] 可以访问应用 URL
- [ ] 数据库连接正常
- [ ] 日志中没有错误
- [ ] 所有功能正常工作

## 📞 获取帮助

### 官方资源
- [Railway 官方文档](https://docs.railway.app)
- [Railway 社区论坛](https://community.railway.app)
- [Railway 状态页面](https://status.railway.app)

### 项目资源
- [GitHub 仓库](https://github.com/leixingti/doc-similarity-analyzer)
- [GitHub Issues](https://github.com/leixingti/doc-similarity-analyzer/issues)
- [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) - 详细部署指南

## 🎉 部署成功标志

部署成功的标志：

✅ 应用在 Railway 上正常运行  
✅ 可以访问应用的公开 URL  
✅ 数据库连接正常  
✅ 日志中没有错误  
✅ 所有功能正常工作  

---

**最后更新**: 2026年1月26日  
**版本**: 1.0.0  
**状态**: 准备就绪
