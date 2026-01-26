# Railway 部署故障排除指南

## 常见部署错误及解决方案

### 1. ❌ npm ci 错误：package-lock.json 不存在

**错误信息：**
```
npm error The `npm ci` command can only install with an existing package-lock.json
```

**原因：** 项目使用 `pnpm` 作为包管理器，但 Dockerfile 使用了 `npm ci` 命令

**解决方案：**
- 在 Dockerfile 中安装 pnpm：`RUN npm install -g pnpm`
- 使用 `pnpm install --frozen-lockfile` 替代 `npm ci`
- 使用 `pnpm run build` 替代 `npm run build`

### 2. ❌ httpRead 错误：COPY 命令失败

**错误信息：**
```
failed to copy: httpRead
```

**原因：** Dockerfile 中使用了通配符 `COPY package*.json`，导致 Docker 构建出现问题

**解决方案：**
```dockerfile
# 修改前
COPY package*.json pnpm-lock.yaml ./

# 修改后
COPY package.json ./
COPY pnpm-lock.yaml ./
```

### 3. ❌ pnpm-lock.yaml 不存在

**错误信息：**
```
ERROR: failed to solve: failed to compute cache key: "/pnpm-lock.yaml": not found
```

**原因：** `.dockerignore` 文件中包含了 `pnpm-lock.yaml`，导致 Docker 构建时无法访问该文件

**解决方案：**
从 `.dockerignore` 中移除以下行：
```
pnpm-lock.yaml
yarn.lock
```

**修改后的 .dockerignore：**
```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.env.local
.env.*.local
.DS_Store
dist
.vite
.manus-logs
.next
.nuxt
out
build
coverage
.nyc_output
.cache
.turbo
.pnpm-store
.idea
.vscode
*.swp
*.swo
*~
.prettierignore
.eslintignore
.editorconfig
.github
.gitattributes
CONTRIBUTING.md
LICENSE
docker-compose.yml
Dockerfile.dev
.dockerignore
```

## 部署检查清单

在部署前检查以下项目：

- [ ] **Dockerfile 使用正确的包管理器**
  - 使用 `pnpm` 而不是 `npm`
  - 包含 `RUN npm install -g pnpm`
  - 使用 `pnpm install --frozen-lockfile`
  - 使用 `pnpm run build`

- [ ] **COPY 命令正确**
  - 不使用通配符 `package*.json`
  - 明确指定文件名
  - 例如：`COPY package.json ./` 和 `COPY pnpm-lock.yaml ./`

- [ ] **.dockerignore 不排除必要文件**
  - `pnpm-lock.yaml` 不在 `.dockerignore` 中
  - `yarn.lock` 不在 `.dockerignore` 中（如果使用 yarn）
  - `package.json` 不在 `.dockerignore` 中

- [ ] **package.json 存在且有效**
  - 文件存在于项目根目录
  - 包含有效的 JSON 格式
  - 包含 `build` 脚本

- [ ] **pnpm-lock.yaml 存在且有效**
  - 文件存在于项目根目录
  - 与 `package.json` 同步

## 部署流程

### 第 1 步：本地验证

```bash
# 检查文件是否存在
ls -la package.json pnpm-lock.yaml

# 检查 .dockerignore
cat .dockerignore | grep -E "pnpm-lock|yarn.lock"

# 本地构建测试
docker build -t test-app:latest .
```

### 第 2 步：提交到 GitHub

```bash
git add .
git commit -m "Fix deployment configuration"
git push origin main
```

### 第 3 步：在 Railway 中部署

1. 访问 https://railway.app
2. 打开您的项目
3. 点击 "Redeploy" 或等待自动部署
4. 查看 "Logs" 标签监控构建进度

### 第 4 步：验证部署

```bash
# 检查应用是否在线
curl https://your-app.railway.app/health

# 查看应用日志
# Railway 控制面板 → Logs 标签
```

## 调试技巧

### 查看完整的构建日志

1. 在 Railway 项目中
2. 点击 "Deployments" 标签
3. 点击失败的部署
4. 点击 "Build logs" 查看详细错误

### 本地 Docker 构建测试

```bash
# 构建镜像
docker build -t doc-similarity-analyzer:latest .

# 运行容器
docker run -p 3000:3000 doc-similarity-analyzer:latest

# 测试应用
curl http://localhost:3000/health
```

### 检查 Railway 环境变量

1. 在 Railway 项目中
2. 点击 "Variables" 标签
3. 确保所有必需的环境变量都已设置：
   - `NODE_ENV=production`
   - `JWT_SECRET=<your-secret>`
   - `DATABASE_URL=<provided-by-railway-mysql>`

## 常见问题解答

**Q: 为什么 pnpm-lock.yaml 被排除？**
A: 通常 `.dockerignore` 用于减小镜像大小，但对于使用 pnpm 的项目，锁文件是必需的。

**Q: 我应该使用 npm 还是 pnpm？**
A: 使用 pnpm。它更快，更节省空间，并且是项目的默认包管理器。

**Q: 如何强制重新部署？**
A: 在 Railway 中，点击 "Redeploy" 按钮，或推送新代码到 GitHub。

**Q: 部署需要多长时间？**
A: 通常 5-10 分钟，具体取决于依赖大小和网络速度。

## 需要更多帮助？

- 查看 [Railway 官方文档](https://docs.railway.app)
- 查看 [pnpm 官方文档](https://pnpm.io)
- 在项目中提交 Issue

---

**最后更新**: 2026年1月26日
