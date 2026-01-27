import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

/**
 * 统计信息路由
 */
export const statisticsRouter = router({
  /**
   * 获取Dashboard统计数据
   */
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // 获取文档统计
    const documents = await db.getUserDocuments(userId);
    const totalDocuments = documents.length;
    const totalStorageBytes = documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0);
    const totalStorageMB = (totalStorageBytes / (1024 * 1024)).toFixed(2);

    // 获取任务统计
    const tasks = await db.getUserAnalysisTasks(userId);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const processingTasks = tasks.filter(t => t.status === 'processing').length;
    const failedTasks = tasks.filter(t => t.status === 'failed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;

    // 计算平均相似度（仅完成的任务）
    const completedTasksWithSimilarity = tasks.filter(
      t => t.status === 'completed' && t.similarity !== null
    );
    const averageSimilarity = completedTasksWithSimilarity.length > 0
      ? (completedTasksWithSimilarity.reduce((sum, t) => sum + (t.similarity || 0), 0) / completedTasksWithSimilarity.length).toFixed(1)
      : '0';

    // 获取最近活动（最近5个任务）
    const recentTasks = tasks
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(task => ({
        id: task.id,
        taskName: task.taskName,
        status: task.status,
        similarity: task.similarity,
        createdAt: task.createdAt,
      }));

    // 获取最近上传的文档（最近5个）
    const recentDocuments = documents
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(doc => ({
        id: doc.id,
        filename: doc.filename,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        createdAt: doc.createdAt,
      }));

    // 按文件类型统计
    const fileTypeStats = documents.reduce((acc, doc) => {
      const type = doc.fileType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 按月份统计任务数量（最近6个月）
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const tasksByMonth = tasks
      .filter(t => new Date(t.createdAt) >= sixMonthsAgo)
      .reduce((acc, task) => {
        const date = new Date(task.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        acc[monthKey] = (acc[monthKey] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      documents: {
        total: totalDocuments,
        storageMB: totalStorageMB,
        byType: fileTypeStats,
        recent: recentDocuments,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        processing: processingTasks,
        failed: failedTasks,
        pending: pendingTasks,
        averageSimilarity,
        byMonth: tasksByMonth,
        recent: recentTasks,
      },
    };
  }),
});
