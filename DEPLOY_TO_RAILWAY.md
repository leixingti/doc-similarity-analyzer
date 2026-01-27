# 部署到Railway - 快速指南

## 问题修复总结

本次更新修复了生产环境的数据库查询错误,主要改进包括:

1. ✅ 优化数据库连接配置
2. ✅ 添加连接测试和错误处理
3. ✅ 运行数据库迁移,创建所有表
4. ✅ 完善Dashboard功能和UI

---

## 部署步骤

### 方法1: GitHub自动部署(推荐)

#### 1. 推送代码到GitHub
```bash
git push origin main
```

#### 2. Railway自动部署
- Railway会自动检测到新提交
- 自动构建和部署
- 大约需要3-5分钟

#### 3. 查看部署日志
- 访问Railway Dashboard
- 查看Deployments标签
- 确认部署成功

### 方法2: Railway CLI部署

#### 1. 安装Railway CLI
```bash
npm install -g @railway/cli
```

#### 2. 登录Railway
```bash
railway login
```

#### 3. 链接项目
```bash
cd /path/to/doc-similarity-analyzer
railway link
```

#### 4. 部署
```bash
railway up
```

---

## 环境变量检查

确保Railway中配置了以下环境变量:

### 必需变量
```env
DATABASE_URL=mysql://2SDxeZiTrYjeW97.root:E8io4SjtjPyWNHLA@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test

JWT_SECRET=your-secret-key-at-least-32-characters

VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=your-owner-id

BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
```

### 可选变量
```env
NODE_ENV=production
PORT=3000
```

---

## 部署后验证

### 1. 检查服务状态
访问: https://doc-similarity-analyzer-production-9902.up.railway.app/

### 2. 测试用户注册
1. 访问 `/login` 页面
2. 点击"注册"标签
3. 填写:
   - 用户名: TestUser
   - 邮箱: test@example.com
   - 密码: test123456
4. 点击"注册"按钮
5. 应该成功注册并自动登录

### 3. 测试用户登录
1. 使用刚注册的账号登录
2. 应该能看到Dashboard页面
3. 验证统计卡片显示正常

### 4. 检查数据库
```bash
# 使用测试脚本
node scripts/test-db-connection.mjs

# 应该看到:
# ✅ 连接获取成功
# ✅ users表查询成功, 用户数: 1
# ✅ 参数化查询成功
```

---

## 故障排查

### 问题1: 部署失败
**症状**: Railway显示部署失败

**解决方案**:
1. 检查构建日志
2. 确认所有依赖已安装
3. 验证环境变量配置

### 问题2: 数据库连接失败
**症状**: 页面显示数据库错误

**解决方案**:
1. 检查 `DATABASE_URL` 是否正确
2. 确认TiDB服务是否运行
3. 查看服务器日志

### 问题3: 用户注册失败
**症状**: 注册时显示错误

**解决方案**:
1. 检查数据库迁移是否完成
2. 验证users表是否存在
3. 查看详细错误日志

---

## Railway日志查看

### 使用Dashboard
1. 登录Railway Dashboard
2. 选择项目
3. 点击"Deployments"
4. 查看实时日志

### 使用CLI
```bash
# 查看实时日志
railway logs

# 查看最近100行
railway logs --limit 100

# 持续监控
railway logs --follow
```

---

## 回滚方案

如果部署出现问题,可以快速回滚:

### Railway Dashboard回滚
1. 进入Deployments页面
2. 找到上一个成功的部署
3. 点击"Redeploy"

### Git回滚
```bash
# 回滚到上一个提交
git revert HEAD
git push origin main

# 或回滚到特定提交
git reset --hard <commit-hash>
git push origin main --force
```

---

## 性能监控

### 关键指标
- 响应时间: < 2秒
- 错误率: < 1%
- 数据库连接: 稳定
- 内存使用: < 512MB

### 监控工具
- Railway内置监控
- 数据库连接池状态
- 错误日志分析

---

## 安全检查

### 部署前检查
- [ ] 环境变量已配置
- [ ] 数据库密码已更新
- [ ] JWT密钥足够复杂
- [ ] SSL/TLS已启用

### 部署后检查
- [ ] HTTPS正常工作
- [ ] 用户认证正常
- [ ] 文件上传安全
- [ ] API接口保护

---

## 更新内容总结

### 代码改进
- 优化数据库连接配置(添加超时、队列等)
- 改进错误处理(try-catch、日志)
- 添加连接测试机制

### 数据库
- 运行迁移,创建所有表
- 验证users表正常工作
- 测试参数化查询

### 功能增强
- Dashboard统计面板
- 文档搜索和筛选
- 管理员菜单
- 批量操作

---

## 下一步

### 立即执行
1. ✅ 推送代码到GitHub
2. ✅ 等待Railway自动部署
3. ✅ 验证功能正常

### 后续优化
1. 添加更多监控
2. 实现自动备份
3. 优化性能
4. 添加单元测试

---

## 联系支持

如有问题:
1. 查看Railway日志
2. 检查DATABASE_FIX_SUMMARY.md
3. 运行test-db-connection.mjs测试
4. 查看GitHub Issues

---

**准备就绪!** 现在可以推送代码并部署到生产环境了。

```bash
# 推送代码
git push origin main

# 等待Railway自动部署
# 访问 https://doc-similarity-analyzer-production-9902.up.railway.app/
```

---

**最后更新**: 2026-01-27  
**版本**: v1.1.1  
**状态**: 准备部署 ✅
