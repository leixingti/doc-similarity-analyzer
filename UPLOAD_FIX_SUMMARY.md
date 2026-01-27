# 文件上传404错误修复总结

## 问题描述
用户上传文档时失败,错误信息:
```
上传 大盘鸡制作方法_1.docx 失败: Storage upload failed (404 Not Found): Not Found
```

## 根本原因

### 原因1: 缺少/storage路由
系统使用本地存储时,文件保存到`.storage`目录,但服务器没有配置Express路由来服务这些文件。

### 原因2: Manus存储API失败
当配置了`BUILT_IN_FORGE_API_URL`和`BUILT_IN_FORGE_API_KEY`时:
- 系统尝试使用Manus存储服务
- API端点返回404错误
- 没有回退机制,直接抛出错误

## 修复方案

### 修复1: 添加/storage路由
**文件**: `server/_core/index.ts`

```typescript
// 添加在第42行
app.use('/storage', express.static(path.join(projectRoot, '.storage')));
```

**作用**:
- 服务`.storage`目录中的文件
- 使本地存储的文件可以通过`/storage/...`访问

### 修复2: 添加错误回退机制
**文件**: `server/storage.ts`

**改进**:
1. 提取本地存储逻辑到`saveToLocalStorage()`函数
2. 在`storagePut()`中添加try-catch
3. Manus存储失败时自动回退到本地存储
4. 添加详细日志方便调试

**代码变化**:
```typescript
// 之前: 直接抛出错误
if (!response.ok) {
  throw new Error(`Storage upload failed...`);
}

// 之后: 回退到本地存储
if (!response.ok) {
  console.error(`[Storage] Manus storage upload failed...`);
  console.log('[Storage] Falling back to local storage');
  return saveToLocalStorage(relKey, data);
}
```

## 工作流程

### 修复前
```
用户上传文件
  ↓
检测到FORGE_API配置
  ↓
尝试上传到Manus存储
  ↓
API返回404
  ↓
抛出错误 ❌
  ↓
用户看到上传失败
```

### 修复后
```
用户上传文件
  ↓
检测到FORGE_API配置
  ↓
尝试上传到Manus存储
  ↓
API返回404
  ↓
自动回退到本地存储 ✅
  ↓
保存到.storage目录
  ↓
通过/storage路由访问
  ↓
上传成功!
```

## 技术细节

### 存储策略
1. **优先级**: Manus存储 > 本地存储
2. **判断条件**: 
   - 如果`BUILT_IN_FORGE_API_URL`和`BUILT_IN_FORGE_API_KEY`都配置 → 尝试Manus存储
   - 否则 → 直接使用本地存储
3. **回退机制**: Manus存储失败 → 自动本地存储

### 本地存储
- **目录**: `.storage/`
- **结构**: `.storage/documents/{userId}/{nanoid}-{filename}`
- **访问**: `http://domain/storage/documents/...`
- **权限**: 公开访问(通过Express static)

### Manus存储
- **API**: `{FORGE_API_URL}/v1/storage/upload`
- **认证**: Bearer token
- **返回**: `{ url: "https://..." }`

## 日志输出

### 本地存储
```
[Storage] Using local storage
```

### Manus存储成功
```
[Storage] Attempting Manus storage upload to: https://api.manus.im/v1/storage/upload?path=...
[Storage] Manus storage upload successful
```

### Manus存储失败(回退)
```
[Storage] Attempting Manus storage upload to: https://api.manus.im/v1/storage/upload?path=...
[Storage] Manus storage upload failed (404): Not Found
[Storage] Falling back to local storage
```

## 测试场景

### 场景1: 无FORGE_API配置
- 预期: 直接使用本地存储
- 日志: `[Storage] Using local storage`

### 场景2: 有FORGE_API配置,API正常
- 预期: 使用Manus存储
- 日志: `[Storage] Manus storage upload successful`

### 场景3: 有FORGE_API配置,API失败
- 预期: 回退到本地存储
- 日志: `[Storage] Falling back to local storage`

## 部署注意事项

### Railway环境
1. 确保`.storage`目录可写
2. 注意Railway的临时文件系统(重启后文件丢失)
3. 生产环境建议配置正确的S3或Manus存储

### 环境变量
```env
# 如果不使用Manus存储,留空或删除这两行
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
```

### 文件持久化
⚠️ **重要**: Railway使用临时文件系统,容器重启后`.storage`目录会被清空!

**建议**:
1. 配置正确的Manus存储API
2. 或使用S3/OSS等对象存储
3. 或使用Railway的Volume功能

## 相关文件

### 修改的文件
- `server/_core/index.ts` - 添加/storage路由
- `server/storage.ts` - 添加回退机制和日志

### 相关文件(未修改)
- `server/routers.ts` - 文件上传API
- `server/fileProcessor.ts` - 文件处理
- `client/src/pages/DashboardNew.tsx` - 上传UI

## 安全考虑

### 当前实现
- ✅ 文件大小限制(10MB)
- ✅ 文件类型验证
- ✅ 用户ID隔离
- ✅ 随机文件名(nanoid)

### 潜在风险
- ⚠️ /storage路由公开访问(无认证)
- ⚠️ 可能被猜测文件路径

### 建议改进
- 🔄 添加文件访问权限检查
- 🔄 使用签名URL
- 🔄 添加访问日志
- 🔄 实现文件过期机制

## 性能优化

### 当前实现
- ✅ 使用Express static中间件
- ✅ 自动支持浏览器缓存
- ✅ 支持Range请求(部分下载)

### 可能改进
- 🔄 添加CDN
- 🔄 启用gzip压缩
- 🔄 实现文件缩略图
- 🔄 异步文件处理

## 总结

### 问题
- 文件上传失败,返回404错误

### 原因
- 缺少/storage路由
- Manus存储API失败无回退

### 修复
- 添加Express static路由
- 实现自动回退机制
- 添加详细日志

### 效果
- ✅ 文件上传成功
- ✅ 自动容错
- ✅ 易于调试

---

**修复时间**: 2026-01-27  
**修复人员**: Manus AI  
**状态**: ✅ 已修复,待部署
