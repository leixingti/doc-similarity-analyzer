# 文档相似度分析系统 - 部署指南

## 快速开始

### 1. 环境要求
- Node.js 22.x
- pnpm 10.x
- MySQL 8.x 或 TiDB Cloud
- 域名(可选,用于生产环境)

### 2. 安装依赖
```bash
cd doc-similarity-analyzer
pnpm install
```

### 3. 配置环境变量
复制 `.env.example` 到 `.env` 并填写配置:

```bash
cp .env.example .env
```

**必需配置**:
```env
# 数据库
DATABASE_URL=mysql://user:password@host:3306/database

# JWT密钥
JWT_SECRET=your-secret-key-at-least-32-characters-long

# Manus OAuth
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=your-owner-id

# API配置
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
```

**可选配置**:
```env
# SMTP邮件服务
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# S3存储(如果使用)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
```

### 4. 初始化数据库
```bash
pnpm db:push
```

### 5. 创建管理员账户
```bash
node scripts/create-admin.js
```

或手动在数据库中插入:
```sql
INSERT INTO users (openId, name, email, role, loginMethod) 
VALUES ('your-openid', 'Admin', 'admin@example.com', 'admin', 'oauth');
```

### 6. 构建项目
```bash
pnpm build
```

### 7. 启动服务

**开发环境**:
```bash
pnpm dev
```

**生产环境**:
```bash
pnpm start
```

服务将在 `http://localhost:3000` 启动

---

## Railway 部署

### 方法1: 使用Railway CLI
```bash
# 安装Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 初始化项目
railway init

# 部署
railway up
```

### 方法2: 使用GitHub集成
1. 在Railway中创建新项目
2. 连接GitHub仓库
3. Railway会自动检测并部署

### 环境变量配置
在Railway Dashboard中添加所有必需的环境变量(参考上面的配置)

---

## Docker 部署

### 1. 构建镜像
```bash
docker build -t doc-similarity-analyzer .
```

### 2. 运行容器
```bash
docker run -d \
  --name doc-similarity \
  -p 3000:3000 \
  --env-file .env \
  doc-similarity-analyzer
```

### 3. 使用Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      - db
  
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: doc_similarity
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

运行:
```bash
docker-compose up -d
```

---

## Vercel 部署

### 1. 安装Vercel CLI
```bash
npm install -g vercel
```

### 2. 部署
```bash
vercel
```

### 3. 配置环境变量
在Vercel Dashboard中添加环境变量

**注意**: Vercel适合前端部署,后端需要使用Serverless函数或单独部署

---

## Nginx 反向代理

### 配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 启用HTTPS
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com
```

---

## PM2 进程管理

### 1. 安装PM2
```bash
npm install -g pm2
```

### 2. 启动应用
```bash
pm2 start dist/index.js --name doc-similarity
```

### 3. 常用命令
```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs doc-similarity

# 重启
pm2 restart doc-similarity

# 停止
pm2 stop doc-similarity

# 开机自启
pm2 startup
pm2 save
```

---

## 性能优化

### 1. 启用Gzip压缩
在Nginx中:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 2. 启用缓存
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. 数据库优化
- 添加索引
- 启用查询缓存
- 使用连接池

---

## 监控和日志

### 1. 应用监控
使用PM2 Plus或其他APM工具:
```bash
pm2 install pm2-server-monit
```

### 2. 日志管理
```bash
# 查看实时日志
pm2 logs

# 日志轮转
pm2 install pm2-logrotate
```

### 3. 错误追踪
集成Sentry:
```bash
npm install @sentry/node
```

---

## 备份策略

### 1. 数据库备份
```bash
# 每天备份
0 2 * * * mysqldump -u user -p database > /backup/db_$(date +\%Y\%m\%d).sql
```

### 2. 文件备份
```bash
# 备份上传的文件
rsync -avz /path/to/uploads /backup/uploads
```

---

## 故障排查

### 常见问题

#### 1. 数据库连接失败
- 检查 `DATABASE_URL` 是否正确
- 确认数据库服务是否运行
- 检查防火墙规则

#### 2. 文件上传失败
- 检查 `UPLOAD_DIR` 权限
- 确认 `MAX_FILE_SIZE` 配置
- 检查磁盘空间

#### 3. OAuth登录失败
- 验证 `VITE_APP_ID` 和 `OAUTH_SERVER_URL`
- 检查回调URL配置
- 确认网络连接

#### 4. 构建失败
- 清除缓存: `rm -rf node_modules && pnpm install`
- 检查Node.js版本
- 查看构建日志

---

## 安全建议

1. **使用HTTPS**: 生产环境必须启用SSL/TLS
2. **定期更新**: 保持依赖包最新
3. **限制访问**: 使用防火墙限制数据库访问
4. **备份数据**: 定期备份数据库和文件
5. **监控日志**: 定期检查错误日志
6. **密钥管理**: 使用环境变量,不要硬编码密钥

---

## 扩展性

### 水平扩展
1. 使用负载均衡器(Nginx/HAProxy)
2. 部署多个应用实例
3. 使用Redis共享会话
4. 使用CDN加速静态资源

### 垂直扩展
1. 增加服务器CPU和内存
2. 优化数据库配置
3. 使用SSD存储

---

## 联系支持

如有问题,请访问:
- GitHub Issues: https://github.com/leixingti/doc-similarity-analyzer/issues
- 文档: 查看项目根目录下的其他MD文件

---

**最后更新**: 2026-01-27  
**版本**: v1.1.0
