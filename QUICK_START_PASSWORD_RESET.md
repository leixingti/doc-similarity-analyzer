# 密码重置功能快速开始

## 🚀 5分钟快速部署

### 第一步：配置环境变量

在项目根目录创建或编辑 `.env` 文件：

```env
# Resend API配置（必需）
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM=noreply@yourdomain.com

# 前端URL（必需）
FRONTEND_URL=http://localhost:5000
```

> 💡 **获取 Resend API Key**: 访问 [resend.com](https://resend.com) 注册并创建API密钥

### 第二步：运行数据库迁移

```bash
pnpm db:push
```

### 第三步：启动项目

```bash
# 开发环境
pnpm dev

# 生产环境
pnpm build && pnpm start
```

## ✅ 功能验证

### 测试忘记密码流程

1. 打开浏览器访问 `http://localhost:5000/login`
2. 点击"忘记密码？"链接
3. 输入注册邮箱
4. 点击"发送重置链接"
5. 检查邮箱收件箱
6. 点击邮件中的重置链接
7. 输入新密码并提交
8. 使用新密码登录

## 📋 功能清单

- ✅ 用户自行修改密码（已登录用户）
- ✅ 忘记密码邮箱重置
- ✅ 密码重置令牌（30分钟有效）
- ✅ 防止邮箱枚举攻击
- ✅ 密码加密存储

## 🔗 相关页面

| 功能 | 路径 |
|------|------|
| 登录 | `/login` |
| 修改密码 | `/change-password` |
| 忘记密码 | `/forgot-password` |
| 重置密码 | `/reset-password?token={token}` |

## 📚 详细文档

- [功能详细说明](./PASSWORD_RESET_FEATURE.md)
- [部署指南](./DEPLOYMENT_GUIDE_PASSWORD_RESET.md)
- [功能总结](./FEATURE_SUMMARY.md)

## ❓ 常见问题

### Q: 邮件发送失败？
**A**: 检查 `RESEND_API_KEY` 是否正确配置，确认 Resend 账户状态正常。

### Q: 重置链接无效？
**A**: 检查 `FRONTEND_URL` 配置是否正确，确认链接在30分钟内使用。

### Q: 如何测试邮件功能？
**A**: 使用真实邮箱地址测试，或查看 Resend 控制台的邮件发送日志。

## 🆘 需要帮助？

- 查看详细文档：[PASSWORD_RESET_FEATURE.md](./PASSWORD_RESET_FEATURE.md)
- 提交Issue：[GitHub Issues](https://github.com/leixingti/doc-similarity-analyzer/issues)
- 查看部署指南：[DEPLOYMENT_GUIDE_PASSWORD_RESET.md](./DEPLOYMENT_GUIDE_PASSWORD_RESET.md)

---

**快速开始指南** | 版本 1.0.0 | 更新时间：2026-01-29
