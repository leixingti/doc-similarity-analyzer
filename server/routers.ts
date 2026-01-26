import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { compareDocumentVersions } from "./versionComparison";
import * as db from "./db";
import { userManagementRouter } from "./userManagement";
import { storagePut } from "./storage";
import { processFile, isValidFileType, getFileExtension } from "./fileProcessor";
import { analyzeTraditional } from "./traditionalAnalyzer";
import { analyzeWithDeepSeek } from "./deepseekAnalyzer";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  userManagement: userManagementRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // 文档管理
  documents: router({
    // 删除文档
    delete: protectedProcedure
      .input(z.object({ documentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteDocument(input.documentId, ctx.user.id);
        return { success: true };
      }),
    // 上传文档
    upload: protectedProcedure
      .input(z.object({
        filename: z.string(),
        fileType: z.string(),
        fileSize: z.number(),
        fileBuffer: z.string(), // base64编码的文件内容
      }))
      .mutation(async ({ ctx, input }) => {
        // 验证文件类型
        if (!isValidFileType(input.fileType)) {
          throw new Error(`不支持的文件类型: ${input.fileType}`);
        }

        // 验证文件大小（10MB限制）
        if (input.fileSize > 10 * 1024 * 1024) {
          throw new Error('文件大小超过10MB限制');
        }

        // 解码文件内容
        const fileBuffer = Buffer.from(input.fileBuffer, 'base64');

        // 处理文件，提取文本
        const processed = await processFile(fileBuffer, input.fileType);

        // 上传到S3
        const fileKey = `documents/${ctx.user.id}/${nanoid()}-${input.filename}`;
        const { url } = await storagePut(fileKey, fileBuffer, `application/${input.fileType}`);

        // 保存到数据库
        const docId = await db.createDocument({
          userId: ctx.user.id,
          filename: input.filename,
          originalName: input.filename,
          fileType: input.fileType,
          fileSize: input.fileSize,
          fileKey,
          fileUrl: url,
          extractedText: processed.text,
          metadata: processed.metadata,
        });

        return {
          success: true,
          documentId: docId,
          extractedText: processed.text.substring(0, 500), // 返回前500字符预览
        };
      }),

    // 获取用户的所有文档
    list: protectedProcedure.query(async ({ ctx }) => {
      const documents = await db.getUserDocuments(ctx.user.id);
      return documents;
    }),


  }),

  // 分析任务
  analysis: router({
    // 创建分析任务
    create: protectedProcedure
      .input(z.object({
        taskName: z.string(),
        documentIds: z.array(z.number()).min(2).max(10),
        analysisMode: z.enum(['traditional', 'deepseek']),
      }))
      .mutation(async ({ ctx, input }) => {
        // 验证文档所有权
        const docs = await db.getDocumentsByIds(input.documentIds);
        if (docs.length !== input.documentIds.length) {
          throw new Error('部分文档不存在');
        }
        if (docs.some(doc => doc.userId !== ctx.user.id)) {
          throw new Error('无权访问部分文档');
        }

        // 创建任务
        const taskId = await db.createAnalysisTask({
          userId: ctx.user.id,
          taskName: input.taskName,
          documentIds: input.documentIds as any,
          analysisMode: input.analysisMode,
          status: 'processing',
        });

        // 异步执行分析
        performAnalysis(taskId, docs, input.analysisMode).catch(err => {
          console.error(`[Analysis] Task ${taskId} failed:`, err);
          db.updateAnalysisTask(taskId, {
            status: 'failed',
            summary: `Error: ${err.message}`,
          });
        });

        return {
          success: true,
          taskId,
        };
      }),

    // 获取任务详情
    getTask: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ ctx, input }) => {
        const task = await db.getAnalysisTaskById(input.taskId);
        if (!task || task.userId !== ctx.user.id) {
          throw new Error('任务不存在或无权限');
        }

        // 获取分析结果
        const result = await db.getAnalysisResultByTaskId(input.taskId);
        
        // 获取相似片段
        let segments: any[] = [];
        if (result) {
          segments = await db.getSimilaritySegmentsByResultId(result.id);
        }

        // 获取文档信息
        const documentIds = task.documentIds as number[];
        const documents = await db.getDocumentsByIds(documentIds);

        return {
          ...task,
          result: result ? {
            ...result,
            segments,
          } : null,
          documents,
        };
      }),

    // 获取用户的所有任务
    listTasks: protectedProcedure.query(async ({ ctx }) => {
      const tasks = await db.getUserAnalysisTasks(ctx.user.id);
      return tasks;
    }),

    // 批量获取任务（用于导出）
    batchGetTasks: protectedProcedure
      .input(z.object({ taskIds: z.array(z.number()) }))
      .query(async ({ ctx, input }) => {
        const tasks = [];
        for (const taskId of input.taskIds) {
          const task = await db.getAnalysisTaskById(taskId);
          if (task && task.userId === ctx.user.id) {
            const result = await db.getAnalysisResultByTaskId(taskId);
            const segments = result ? await db.getSimilaritySegmentsByResultId(result.id) : [];
            const documentIds = task.documentIds as number[];
            const documents = await db.getDocumentsByIds(documentIds);
            
            tasks.push({
              ...task,
              result: result ? { ...result, segments } : null,
              documents,
            });
          }
        }
        return tasks;
      }),

    // 获取历史记录
    getHistory: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        minSimilarity: z.number().optional(),
        maxSimilarity: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const history = await db.getAnalysisHistory(ctx.user.id, input);
        return history;
      }),

    // 获取统计数据
    getStatistics: protectedProcedure.query(async ({ ctx }) => {
      const stats = await db.getAnalysisStatistics(ctx.user.id);
      return stats;
    }),
  }),

  // 版本对比
  versions: router({
    compare: protectedProcedure
      .input(
        z.object({
          document1Id: z.number(),
          document2Id: z.number(),
        })
      )
      .query(async ({ input, ctx }) => {
        const doc1 = await db.getDocumentById(input.document1Id);
        const doc2 = await db.getDocumentById(input.document2Id);

        if (!doc1 || !doc2) {
          throw new Error('文档不存在');
        }

        // 验证权限
        if (doc1.userId !== ctx.user.id || doc2.userId !== ctx.user.id) {
          throw new Error('无权访问此文档');
        }

        // 获取文档内容
        const content1 = doc1.extractedText || '';
        const content2 = doc2.extractedText || '';

        // 对比版本
        const result = await compareDocumentVersions(
          content1,
          content2,
          { id: doc1.id, filename: doc1.filename },
          { id: doc2.id, filename: doc2.filename }
        );

        return result;
      }),
  }),
});

export type AppRouter = typeof appRouter;

/**
 * 执行分析任务（异步）
 */
async function performAnalysis(
  taskId: number,
  documents: any[],
  mode: 'traditional' | 'deepseek'
) {
  try {
    // 目前只支持两个文档对比
    if (documents.length !== 2) {
      throw new Error('目前只支持两个文档的对比');
    }

    const text1 = documents[0].extractedText || '';
    const text2 = documents[1].extractedText || '';

    if (!text1 || !text2) {
      throw new Error('文档文本提取失败');
    }

    let analysisResult: any;

    if (mode === 'traditional') {
      // 传统算法分析
      const result = await analyzeTraditional(text1, text2);
      
      analysisResult = {
        similarity: result.overallSimilarity,
        summary: `基于传统算法的分析结果：整体相似度为 ${result.overallSimilarity.toFixed(1)}%。` +
                 `余弦相似度 ${result.details.cosineSimilarity.toFixed(1)}%，` +
                 `Jaccard相似度 ${result.details.jaccardSimilarity.toFixed(1)}%，` +
                 `TF-IDF相似度 ${result.details.tfidfSimilarity.toFixed(1)}%。` +
                 `共发现 ${result.segments.length} 个相似片段。`,
        details: result.details,
        segments: result.segments,
      };
    } else {
      // DeepSeek AI分析
      const result = await analyzeWithDeepSeek(text1, text2);
      
      analysisResult = {
        similarity: result.overallSimilarity,
        summary: result.summary,
        details: result.details,
        riskLevel: result.riskLevel,
        riskDescription: result.riskDescription,
        recommendations: result.recommendations,
        segments: result.segments,
      };
    }

    // 保存分析结果
    const resultId = await db.createAnalysisResult({
      taskId,
      similarity: analysisResult.similarity,
      details: analysisResult.details as any,
      documentId1: documents[0].id,
      documentId2: documents[1].id,
    });

    // 保存相似片段
    if (analysisResult.segments && analysisResult.segments.length > 0) {
      const segmentsToInsert = analysisResult.segments.map((seg: any) => ({
        resultId,
        doc1Id: documents[0].id,
        doc2Id: documents[1].id,
        doc1Segment: seg.doc1Segment,
        doc2Segment: seg.doc2Segment,
        similarity: seg.similarity,
        reason: seg.reason,
        position: null,
      }));
      
      await db.createSimilaritySegments(segmentsToInsert);
    }

    // 更新任务状态
    await db.updateAnalysisTask(taskId, {
      status: 'completed',
      similarity: analysisResult.similarity,
      completedAt: new Date(),
    });

  } catch (error: any) {
    console.error(`[Analysis] Task ${taskId} failed:`, error);
    await db.updateAnalysisTask(taskId, {
      status: 'failed',
      summary: `Error: ${error.message}`,
    });
    throw error;
  }
}
