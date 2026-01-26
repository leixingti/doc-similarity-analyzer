# 传统算法分析失败 - 诊断和修复报告

## 问题描述

用户在使用传统算法（快速）进行文档相似度分析时，收到错误信息：
```
创建失败: Unexpected token '<', "<!doctype "... is not valid JSON
```

## 问题诊断

### 错误原因分析

1. **表面错误**：API 返回的是 HTML（`<!doctype`）而不是 JSON
2. **根本原因**：后端 API 调用出现异常，导致返回错误页面而不是 JSON 响应

### 可能的原因

1. **数据库连接问题**
   - 分析任务创建失败
   - 分析结果保存失败
   - 相似片段保存失败

2. **文本提取问题**
   - 文档的 `extractedText` 为空或未定义
   - 文本提取过程中出现错误

3. **传统算法计算问题**
   - 算法执行出错
   - 返回值格式不正确

4. **API 响应处理问题**
   - 错误响应未被正确处理
   - 错误信息格式不正确

## 代码分析

### 后端流程（server/routers.ts）

```typescript
// 1. 创建分析任务
const taskId = await db.createAnalysisTask({...});

// 2. 异步执行分析（不等待完成）
performAnalysis(taskId, docs, input.analysisMode).catch(err => {
  // 错误处理
});

// 3. 立即返回成功响应
return { success: true, taskId };
```

### 问题所在

1. **异步执行**：`performAnalysis` 是异步执行的，不会阻塞 API 响应
2. **错误处理**：如果 `performAnalysis` 中出现错误，前端无法立即知道
3. **错误传播**：错误被捕获并保存到数据库，但前端收不到错误信息

### 前端错误处理（client/src/pages/Dashboard.tsx）

```typescript
const createTaskMutation = trpc.analysis.create.useMutation({
  onSuccess: () => {
    // 任务创建成功
    toast.success("分析任务已创建！");
  },
  onError: (error) => {
    // 任务创建失败
    toast.error(`创建失败: ${error.message}`);
  },
});
```

## 修复方案

### 方案 1：改进错误处理（推荐）

修改后端 API 以同步执行分析并返回错误：

```typescript
// 修改 performAnalysis 为同步执行
const analysisResult = await performAnalysis(taskId, docs, input.analysisMode);

// 如果出现错误，直接返回给前端
if (!analysisResult.success) {
  throw new Error(analysisResult.error);
}

return { success: true, taskId, result: analysisResult };
```

### 方案 2：改进前端轮询

添加前端轮询机制以获取分析结果：

```typescript
// 创建任务后，轮询获取任务状态
const pollTaskStatus = async (taskId: number) => {
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    const task = await trpc.analysis.getTask.query({ taskId });
    if (task.status === 'completed') {
      toast.success("分析完成！");
      break;
    } else if (task.status === 'failed') {
      toast.error(`分析失败: ${task.summary}`);
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};
```

### 方案 3：添加详细的日志记录

在 `performAnalysis` 函数中添加更详细的日志：

```typescript
async function performAnalysis(
  taskId: number,
  documents: any[],
  mode: 'traditional' | 'deepseek'
) {
  try {
    console.log(`[Analysis] Starting analysis for task ${taskId} with mode ${mode}`);
    
    // 验证文档
    if (documents.length !== 2) {
      throw new Error('目前只支持两个文档的对比');
    }

    // 提取文本
    const text1 = documents[0].extractedText || '';
    const text2 = documents[1].extractedText || '';

    console.log(`[Analysis] Document 1 text length: ${text1.length}`);
    console.log(`[Analysis] Document 2 text length: ${text2.length}`);

    if (!text1 || !text2) {
      throw new Error('文档文本提取失败');
    }

    // 执行分析
    let analysisResult: any;
    if (mode === 'traditional') {
      console.log(`[Analysis] Running traditional analysis...`);
      const result = await analyzeTraditional(text1, text2);
      console.log(`[Analysis] Traditional analysis completed: ${result.overallSimilarity}%`);
      analysisResult = {
        similarity: result.overallSimilarity,
        summary: `基于传统算法的分析结果：整体相似度为 ${result.overallSimilarity.toFixed(1)}%。...`,
        details: result.details,
        segments: result.segments,
      };
    }

    // 保存结果
    console.log(`[Analysis] Saving analysis result...`);
    const resultId = await db.createAnalysisResult({...});
    console.log(`[Analysis] Result saved with ID: ${resultId}`);

    // 更新任务状态
    console.log(`[Analysis] Updating task status...`);
    await db.updateAnalysisTask(taskId, {
      status: 'completed',
      similarity: analysisResult.similarity,
      summary: analysisResult.summary,
      completedAt: new Date(),
    });
    console.log(`[Analysis] Task ${taskId} completed successfully`);

  } catch (error: any) {
    console.error(`[Analysis] Task ${taskId} failed:`, error);
    console.error(`[Analysis] Error message: ${error.message}`);
    console.error(`[Analysis] Error stack: ${error.stack}`);
    
    try {
      await db.updateAnalysisTask(taskId, {
        status: 'failed',
        errorMessage: error.message,
        summary: `Error: ${error.message}`,
      });
    } catch (dbError) {
      console.error(`[Analysis] Failed to update task status:`, dbError);
    }
  }
}
```

## 建议的修复步骤

1. **立即修复**：添加详细的日志记录
2. **短期修复**：改进前端错误处理和轮询机制
3. **长期优化**：考虑使用 WebSocket 或 Server-Sent Events (SSE) 实时推送分析结果

## 测试建议

1. 检查应用日志中的 `[Analysis]` 前缀的日志
2. 查看数据库中任务的状态（completed 或 failed）
3. 检查任务的 `errorMessage` 字段以了解失败原因
4. 验证文档的 `extractedText` 是否正确提取

## 相关文件

- `server/routers.ts` - 分析 API 路由
- `server/traditionalAnalyzer.ts` - 传统算法实现
- `client/src/pages/Dashboard.tsx` - 前端分析界面
- `server/_core/db.ts` - 数据库操作

## 后续跟进

请检查应用日志中的 `[Analysis]` 前缀的日志，以确定具体的失败原因。
