# Railway 部署 - 快速参考卡片

## 🚀 一键部署（推荐）

```bash
cd /home/ubuntu/doc-similarity-analyzer
./scripts/quick-deploy.sh
```

**脚本会自动:**
- ✅ 生成 JWT_SECRET
- ✅ 验证配置
- ✅ 创建环境变量文件
- ✅ 输出部署步骤
- ✅ 复制 JWT_SECRET 到剪贴板

---

## 📋 Railway 部署步骤

### 第 1 步：创建项目
```
https://railway.app
→ New Project
→ Deploy from GitHub repo
→ 搜索 doc-similarity-analyzer
→ Deploy
```

### 第 2 步：添加数据库
```
Add Service
→ Database
→ MySQL
→ 等待启动
```

### 第 3 步：配置环境变量
```
Variables 标签
→ 添加以下变量:
  NODE_ENV = production
  JWT_SECRET = <脚本生成的值>
  PORT = 3000
  LOG_LEVEL = info
```

### 第 4 步：部署
```
Railway 自动构建并部署
→ 查看 Deployments 标签
→ 等待完成
→ 点击 Open
```

---

## 🔐 环境变量

| 变量 | 值 | 说明 |
|------|-----|------|
| `NODE_ENV` | `production` | 生产环境 |
| `JWT_SECRET` | 生成的字符串 | JWT 签名密钥 |
| `PORT` | `3000` | 应用端口 |
| `LOG_LEVEL` | `info` | 日志级别 |
| `DATABASE_URL` | 自动提供 | MySQL 连接 |

### 生成 JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ✅ 验证部署

部署完成后运行：

```bash
./scripts/verify-deployment.sh https://your-app.railway.app
```

**检查项:**
- ✓ 应用在线
- ✓ 健康检查
- ✓ API 端点
- ✓ 响应时间
- ✓ SSL 证书

---

## 📚 文档速查

| 文档 | 用途 |
|------|------|
| RAILWAY_QUICK_START.md | 快速部署（5分钟） |
| RAILWAY_SETUP_GUIDE.md | 详细部署 |
| RAILWAY_DEPLOYMENT.md | 完整参考 |
| DEPLOYMENT_SCRIPTS.md | 脚本使用说明 |

---

## 🛠️ 有用的命令

```bash
# 本地测试构建
pnpm build

# 本地开发运行
pnpm dev

# 本地生产运行
NODE_ENV=production pnpm start

# 查看应用日志
# Railway 控制面板 → Logs 标签

# 查看部署历史
# Railway 控制面板 → Deployments 标签
```

---

## 🐛 常见问题

**Q: 如何获取 JWT_SECRET?**  
A: 运行 `./scripts/quick-deploy.sh` 自动生成

**Q: DATABASE_URL 需要手动配置吗?**  
A: 不需要，Railway MySQL 会自动提供

**Q: 部署失败怎么办?**  
A: 查看 Railway 日志找出错误原因

**Q: 如何回滚到之前的版本?**  
A: Railway 控制面板 → Deployments → 选择版本 → Redeploy

---

## 🎯 部署检查清单

- [ ] 运行了 `./scripts/quick-deploy.sh`
- [ ] 复制了 JWT_SECRET
- [ ] 在 Railway 创建了项目
- [ ] 添加了 MySQL 数据库
- [ ] 配置了环境变量
- [ ] 部署已完成
- [ ] 运行了验证脚本
- [ ] 所有检查通过

---

## 📞 需要帮助?

1. 查看 DEPLOYMENT_SCRIPTS.md
2. 查看 RAILWAY_SETUP_GUIDE.md
3. 访问 https://docs.railway.app
4. 在 GitHub 提交 Issue

---

**最后更新**: 2026年1月26日
