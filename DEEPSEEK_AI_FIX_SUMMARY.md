# DeepSeek AI 分析模式问题修复总结

## 问题描述

使用 **DeepSeek AI** 分析模式时，相似度总是显示为 **0**，任务状态为 **failed**。

## 问题诊断

### 1. 环境变量加载问题 ✅ 已修复
**问题**: `BUILT_IN_FORGE_API_KEY` 环境变量未被正确加载  
**原因**: dotenv 在导入其他模块之前没有加载  
**修复**: 在 `server/_core/index.ts` 顶部添加 dotenv 加载代码

### 2. LLM 模型参数问题 ✅ 已修复
**问题**: DeepSeek 分析器调用 LLM 时没有指定模型  
**原因**: `invokeLLM` 函数默认使用 `gemini-2.5-flash`  
**修复**: 
- 修改 `invokeLLM` 函数以支持 `model` 参数
- 修改 `analyzeWithDeepSeek` 函数指定使用 `deepseek` 模型
- 修改 `analyzeTraditional` 函数指定使用 `gpt-4.1-nano` 模型

### 3. JSON 格式问题 ✅ 已修复
**问题**: DeepSeek 分析器使用 `json_schema` 格式可能不兼容  
**原因**: 某些 LLM 模型不支持 `json_schema`  
**修复**: 改用 `json_object` 格式

### 4. API 端点问题 ❌ 未解决
**问题**: `https://api.manus.im/v1/chat/completions` 返回 404  
**原因**: 
- API 端点可能不存在或已更改
- 可能需要不同的 URL 格式
- 可能需要不同的认证方式

## 当前状态

| 项目 | 状态 | 说明 |
|------|------|------|
| 环境变量加载 | ✅ 已修复 | 正确加载 `BUILT_IN_FORGE_API_KEY` |
| 模型参数传递 | ✅ 已修复 | 支持自定义模型选择 |
| JSON 格式 | ✅ 已修复 | 使用 `json_object` 格式 |
| API 端点 | ❌ 失败 | 返回 404 Not Found |

## 根本原因

**API 端点 `https://api.manus.im/v1/chat/completions` 不可用**

### 测试结果
```bash
$ curl -X POST "https://api.manus.im/v1/chat/completions" \
  -H "Authorization: Bearer sk-ZQy8T2FuH2dY9bZ4pcwear" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek",...}'
  
Response: 404 Not Found
```

## 解决方案

需要以下信息来解决问题：

1. **正确的 API 端点 URL** - DeepSeek AI 的正确 API 地址
2. **认证方式** - 是否需要不同的认证头或格式
3. **模型名称** - DeepSeek 模型的正确名称
4. **API 文档** - Manus API 或 DeepSeek API 的官方文档

## 建议

### 短期解决方案
- 使用传统算法分析模式（已正常工作）
- 使用 Gemini 或其他可用的 LLM 模型

### 长期解决方案
- 联系 Manus 团队获取正确的 DeepSeek API 配置
- 更新 API 端点和认证信息
- 添加 API 端点的健康检查

## 修改的文件

1. **server/_core/env.ts**
   - 添加调试日志以验证环境变量加载

2. **server/_core/llm.ts**
   - 添加 `model` 参数到 `invokeLLM` 函数
   - 支持自定义模型选择

3. **server/deepseekAnalyzer.ts**
   - 指定使用 `deepseek` 模型
   - 改用 `json_object` 格式

4. **server/routers.ts**
   - 修改 `analyzeTraditional` 指定使用 `gpt-4.1-nano` 模型

## 测试命令

```bash
# 查看环境变量是否正确加载
grep "forgeApiKey" /tmp/dev-server.log

# 查看 API 调用错误
tail -50 /tmp/dev-server.log | grep -A 5 "DeepSeek\|LLM invoke"

# 查看数据库中的任务状态
mysql -h 127.0.0.1 -u root doc_similarity -e \
  "SELECT id, taskName, status, similarity FROM analysisTasks WHERE analysisMode='deepseek' ORDER BY id DESC LIMIT 5;"
```

## 下一步

请提供以下信息以继续修复：
1. DeepSeek API 的正确端点 URL
2. 是否需要特殊的认证或请求格式
3. 支持的模型名称列表
