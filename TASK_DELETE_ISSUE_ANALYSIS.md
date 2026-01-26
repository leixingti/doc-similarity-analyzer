# 任务删除功能问题分析

## 问题描述

用户报告：**文档可以删除，但任务无法删除**

## 根本原因分析

### 1. 前端代码问题 ✅ (已修复)
- **问题**: `deleteTaskMutation` 没有被定义
- **原因**: 在编辑代码时遗漏了 mutation 定义
- **修复**: 添加了 `deleteTaskMutation` 定义

### 2. 后端 API 问题 ✅ (已修复)
- **问题**: 没有删除任务的 API 端点
- **原因**: 功能不完整
- **修复**: 在 `routers.ts` 中添加了 `analysis.delete` 端点

### 3. 数据库函数问题 ✅ (已修复)
- **问题**: 没有 `deleteAnalysisTask` 函数
- **原因**: 功能不完整
- **修复**: 在 `db.ts` 中添加了 `deleteAnalysisTask` 函数

### 4. Schema 映射问题 ✅ (已修复)
- **问题**: Drizzle schema 中缺少 `overallSimilarity` 字段
- **原因**: 数据库中有 `overallSimilarity` 字段，但 schema 中没有定义
- **修复**: 添加了 `overallSimilarity` 字段到 schema

### 5. 认证问题 ❌ (未解决)
- **问题**: 前端的 JWT token 无效或过期，导致 API 返回 401 Unauthorized
- **原因**: 可能是浏览器 session 过期或 token 存储有问题
- **需要**: 重新登录或检查 token 存储机制

## 已修复的文件

1. **client/src/pages/Dashboard.tsx**
   - 修复删除文档参数名 (`id` → `documentId`)
   - 添加删除任务的 state 和 mutation
   - 为任务列表添加删除按钮
   - 添加删除任务确认对话框

2. **server/routers.ts**
   - 添加 `analysis.delete` API 端点

3. **server/db.ts**
   - 添加 `deleteAnalysisTask` 数据库函数

4. **drizzle/schema.ts**
   - 添加 `overallSimilarity` 字段
   - 添加 `errorMessage` 字段

## 下一步

需要解决认证问题：
1. 重新登录系统
2. 检查 JWT token 是否正确存储
3. 验证前端的认证请求是否正确发送

## 测试状态

- ✅ 删除文档：成功
- ❌ 删除任务：需要解决认证问题
- ✅ 所有代码修改已完成
