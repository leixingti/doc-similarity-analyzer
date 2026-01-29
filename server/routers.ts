import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { compareDocumentVersions } from "./versionComparison";
import { getAllDocumentTypes } from "./documentTypes";
import { reviewContract } from "./contractReviewer";
import { performOCR, convertPDFToWord, convertWordToPDF, batchAddWatermark, batchAddPageNumbers } from "./documentFormatter";
import * as db from "./db";
import { userManagementRouter } from "./userManagement";
import { adminManagementRouter } from "./adminManagement";
import { statisticsRouter } from "./statistics";
import { storagePut } from "./storage";
import { processFile, isValidFileType, getFileExtension } from "./fileProcessor";
import { analyzeTraditional } from './traditionalAnalyzer';
import { generatePDFReport, generateMarkdownReport, type ReportData } from './reportGenerator';
import { analyzeWithDeepSeek } from "./deepseekAnalyzer";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  userManagement: userManagementRouter,
  adminManagement: adminManagementRouter,
  statistics: statisticsRouter,
  
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

    // 删除任务
    delete: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const task = await db.getAnalysisTaskById(input.taskId);
        if (!task || task.userId !== ctx.user.id) {
          throw new Error('任务不存在或无权限');
        }
        await db.deleteAnalysisTask(input.taskId);
        return { success: true };
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

    // 导出 PDF 报告
    exportPDF: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const task = await db.getAnalysisTaskById(input.taskId);
        if (!task || task.userId !== ctx.user.id) {
          throw new Error('任务不存在或无权限');
        }

        const result = await db.getAnalysisResultByTaskId(input.taskId);
        if (!result) {
          throw new Error('分析结果不存在');
        }

        // 查询相似片段
        const segments = await db.getSimilaritySegmentsByResultId(result.id);

        const doc1 = await db.getDocumentById(task.document1Id);
        const doc2 = await db.getDocumentById(task.document2Id);

        // 解析details JSON
        const details = typeof result.details === 'string' ? JSON.parse(result.details) : (result.details || {});
        
        // 解析recommendations JSON
        const recommendations = typeof result.recommendations === 'string' ? JSON.parse(result.recommendations) : (result.recommendations || []);

        const reportData: ReportData = {
          taskName: task.taskName,
          createdAt: task.createdAt.toLocaleString('zh-CN'),
          analysisMode: task.analysisMode,
          overallSimilarity: result.overallSimilarity,
          summary: result.summary || '',
          details: {
            semanticSimilarity: details.semanticSimilarity,
            structuralSimilarity: details.structuralSimilarity,
            styleSimilarity: details.styleSimilarity,
            topicSimilarity: details.topicSimilarity,
            toneSimilarity: details.toneSimilarity,
            vocabularySimilarity: details.vocabularySimilarity,
            cosineSimilarity: details.cosineSimilarity,
            jaccardSimilarity: details.jaccardSimilarity,
            tfidfSimilarity: details.tfidfSimilarity,
          },
          riskLevel: result.riskLevel as 'high' | 'medium' | 'low' | undefined,
          riskDescription: result.riskDescription || undefined,
          recommendations: Array.isArray(recommendations) ? recommendations : [],
          segments: segments.map(seg => ({
            doc1Segment: seg.doc1Segment,
            doc2Segment: seg.doc2Segment,
            similarity: seg.similarity,
            reason: seg.reason || undefined,
          })),
          documents: [
            {
              filename: doc1?.filename || '文档1',
              fileType: doc1?.fileType || 'unknown',
              fileSize: Math.round((doc1?.fileSize || 0) / 1024),
            },
            {
              filename: doc2?.filename || '文档2',
              fileType: doc2?.fileType || 'unknown',
              fileSize: Math.round((doc2?.fileSize || 0) / 1024),
            },
          ],
        };

        const pdfBuffer = await generatePDFReport(reportData);
        return {
          success: true,
          filename: `report_${input.taskId}_${Date.now()}.pdf`,
          data: pdfBuffer.toString('base64'),
        };
      }),

    // 导出 Markdown 报告
    exportMarkdown: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const task = await db.getAnalysisTaskById(input.taskId);
        if (!task || task.userId !== ctx.user.id) {
          throw new Error('任务不存在或无权限');
        }

        const result = await db.getAnalysisResultByTaskId(input.taskId);
        if (!result) {
          throw new Error('分析结果不存在');
        }

        // 查询相似片段
        const segments = await db.getSimilaritySegmentsByResultId(result.id);

        const doc1 = await db.getDocumentById(task.document1Id);
        const doc2 = await db.getDocumentById(task.document2Id);

        // 解析details JSON
        const details = typeof result.details === 'string' ? JSON.parse(result.details) : (result.details || {});
        
        // 解析recommendations JSON
        const recommendations = typeof result.recommendations === 'string' ? JSON.parse(result.recommendations) : (result.recommendations || []);

        const reportData: ReportData = {
          taskName: task.taskName,
          createdAt: task.createdAt.toLocaleString('zh-CN'),
          analysisMode: task.analysisMode,
          overallSimilarity: result.overallSimilarity,
          summary: result.summary || '',
          details: {
            semanticSimilarity: details.semanticSimilarity,
            structuralSimilarity: details.structuralSimilarity,
            styleSimilarity: details.styleSimilarity,
            topicSimilarity: details.topicSimilarity,
            toneSimilarity: details.toneSimilarity,
            vocabularySimilarity: details.vocabularySimilarity,
            cosineSimilarity: details.cosineSimilarity,
            jaccardSimilarity: details.jaccardSimilarity,
            tfidfSimilarity: details.tfidfSimilarity,
          },
          riskLevel: result.riskLevel as 'high' | 'medium' | 'low' | undefined,
          riskDescription: result.riskDescription || undefined,
          recommendations: Array.isArray(recommendations) ? recommendations : [],
          segments: segments.map(seg => ({
            doc1Segment: seg.doc1Segment,
            doc2Segment: seg.doc2Segment,
            similarity: seg.similarity,
            reason: seg.reason || undefined,
          })),
          documents: [
            {
              filename: doc1?.filename || '文档1',
              fileType: doc1?.fileType || 'unknown',
              fileSize: Math.round((doc1?.fileSize || 0) / 1024),
            },
            {
              filename: doc2?.filename || '文档2',
              fileType: doc2?.fileType || 'unknown',
              fileSize: Math.round((doc2?.fileSize || 0) / 1024),
            },
          ],
        };

        const markdown = generateMarkdownReport(reportData);
        return {
          success: true,
          filename: `report_${input.taskId}_${Date.now()}.md`,
          data: markdown,
        };
      }),
  }),

  // 版本对比
  versions: router({
    // 获取文档类型列表
    getDocumentTypes: protectedProcedure.query(() => {
      return getAllDocumentTypes();
    }),
    
    compare: protectedProcedure
      .input(
        z.object({
          document1Id: z.number(),
          document2Id: z.number(),
          documentType: z.string().optional().default('other'),
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
          { id: doc2.id, filename: doc2.filename },
          input.documentType
        );

        return result;
      }),
  }),

  // 合同审核
  contract: router({
    // 审核合同
    review: protectedProcedure
      .input(
        z.object({
          documentId: z.number(),
          contractType: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const doc = await db.getDocumentById(input.documentId);

        if (!doc) {
          throw new Error('文档不存在');
        }

        // 验证权限
        if (doc.userId !== ctx.user.id) {
          throw new Error('无权访问此文档');
        }

        // 获取文档内容
        const content = doc.extractedText || '';

        if (!content) {
          throw new Error('文档内容为空');
        }

        // 审核合同
        const result = await reviewContract(content, input.contractType);

        return result;
      }),
  }),

  // 文档格式处理
  formatter: router({
    // OCR识别
    ocr: protectedProcedure
      .input(
        z.object({
          documentId: z.number(),
          language: z.string().optional().default('chi_sim'),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const doc = await db.getDocumentById(input.documentId);

        if (!doc) {
          throw new Error('文档不存在');
        }

        // 验证权限
        if (doc.userId !== ctx.user.id) {
          throw new Error('无权访问此文档');
        }

        // 获取文件路径（假设文件存储在本地）
        // 实际应用中需要从存储服务下载文件
        const filePath = `/tmp/${doc.filename}`;

        // 执行OCR
        const result = await performOCR(filePath, input.language);

        // 更新文档的提取文本
        await db.updateDocument(input.documentId, {
          extractedText: result.text,
        });

        return result;
      }),

    // PDF转Word
    convertPDFToWord: protectedProcedure
      .input(
        z.object({
          documentId: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const doc = await db.getDocumentById(input.documentId);

        if (!doc) {
          throw new Error('文档不存在');
        }

        // 验证权限
        if (doc.userId !== ctx.user.id) {
          throw new Error('无权访问此文档');
        }

        // 获取文件路径
        const filePath = `/tmp/${doc.filename}`;

        // 转换
        const result = await convertPDFToWord(filePath);

        return result;
      }),

    // Word转PDF
    convertWordToPDF: protectedProcedure
      .input(
        z.object({
          documentId: z.number(),
          addWatermark: z.boolean().optional(),
          watermarkText: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const doc = await db.getDocumentById(input.documentId);

        if (!doc) {
          throw new Error('文档不存在');
        }

        // 验证权限
        if (doc.userId !== ctx.user.id) {
          throw new Error('无权访问此文档');
        }

        // 获取文件路径
        const filePath = `/tmp/${doc.filename}`;

        // 转换
        const result = await convertWordToPDF(filePath, undefined, {
          addWatermark: input.addWatermark,
          watermarkText: input.watermarkText,
        });

        return result;
      }),

    // 批量添加水印
    batchAddWatermark: protectedProcedure
      .input(
        z.object({
          documentIds: z.array(z.number()),
          watermarkText: z.string(),
          opacity: z.number().optional(),
          angle: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // 验证所有文档权限
        const docs = await Promise.all(
          input.documentIds.map(id => db.getDocumentById(id))
        );

        for (const doc of docs) {
          if (!doc || doc.userId !== ctx.user.id) {
            throw new Error('无权访问某些文档');
          }
        }

        // 获取文件路径
        const filePaths = docs.map(doc => `/tmp/${doc!.filename}`);

        // 批量添加水印
        const result = await batchAddWatermark(filePaths, input.watermarkText, {
          opacity: input.opacity,
          angle: input.angle,
        });

        return result;
      }),

    // 批量添加页码
    batchAddPageNumbers: protectedProcedure
      .input(
        z.object({
          documentIds: z.array(z.number()),
          position: z.enum(['top', 'bottom']).optional(),
          format: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // 验证所有文档权限
        const docs = await Promise.all(
          input.documentIds.map(id => db.getDocumentById(id))
        );

        for (const doc of docs) {
          if (!doc || doc.userId !== ctx.user.id) {
            throw new Error('无权访问某些文档');
          }
        }

        // 获取文件路径
        const filePaths = docs.map(doc => `/tmp/${doc!.filename}`);

        // 批量添加页码
        const result = await batchAddPageNumbers(filePaths, {
          position: input.position,
          format: input.format,
        });

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
    console.log(`[Analysis] Starting analysis for task ${taskId} with mode ${mode}`);
    
    // 目前只支持两个文档对比
    if (documents.length !== 2) {
      throw new Error('目前只支持两个文档的对比');
    }

    const text1 = documents[0].extractedText || '';
    const text2 = documents[1].extractedText || '';

    console.log(`[Analysis] Document 1 text: ${text1.length} chars`);
    console.log(`[Analysis] Document 2 text: ${text2.length} chars`);

    if (!text1 || !text2) {
      throw new Error('文档文本提取失败');
    }

    let analysisResult: any;

    if (mode === 'traditional') {
      console.log(`[Analysis] Running traditional analysis...`);
      const result = await analyzeTraditional(text1, text2);
      console.log(`[Analysis] Traditional analysis completed: ${result.overallSimilarity}%`);
      
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
      console.log(`[Analysis] Running DeepSeek analysis...`);
      const result = await analyzeWithDeepSeek(text1, text2);
      console.log(`[Analysis] DeepSeek analysis result: ${result.overallSimilarity}%`);
      
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
    console.log(`[Analysis] Saving analysis result...`);
    const resultId = await db.createAnalysisResult({
      taskId,
      overallSimilarity: analysisResult.similarity,
      summary: analysisResult.summary,
      details: analysisResult.details as any,
    });
    console.log(`[Analysis] Result saved with ID: ${resultId}`);

    // 保存相似片段
    if (analysisResult.segments && analysisResult.segments.length > 0) {
      console.log(`[Analysis] Saving ${analysisResult.segments.length} similarity segments...`);
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
      console.log(`[Analysis] Segments saved successfully`);
    }

    // 更新任务状态
    console.log(`[Analysis] Updating task status to completed...`);
    await db.updateAnalysisTask(taskId, {
      status: 'completed',
      similarity: analysisResult.similarity,
      summary: analysisResult.summary,
      completedAt: new Date(),
    });
    console.log(`[Analysis] Task ${taskId} completed successfully`);

  } catch (error: any) {
    console.error(`[Analysis] Task ${taskId} failed`);
    const errorMessage = error.message || error.toString();
    console.error(`[Analysis] Error: ${errorMessage}`);
    try {
      await db.updateAnalysisTask(taskId, {
        status: 'failed',
        errorMessage: errorMessage,
        summary: `Error: ${errorMessage}`,
      });
    } catch (dbError) {
      console.error(`[Analysis] Failed to update task status`);
    }
  }
}
