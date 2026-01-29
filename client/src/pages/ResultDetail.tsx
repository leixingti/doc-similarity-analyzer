import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useState } from 'react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { ArrowLeft, FileText, Loader2, Download, AlertCircle, CheckCircle2, XCircle, ChevronDown, LayoutGrid } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { DiffHighlight } from '@/components/DiffHighlight';

export default function ResultDetail() {
  const { taskId } = useParams();
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const { data: task, isLoading } = trpc.analysis.getTask.useQuery(
    { taskId: parseInt(taskId || "0") },
    { enabled: !!user && !!taskId }
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = 
"/login";
    return null;
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container flex h-16 items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">分析结果</span>
            </div>
          </div>
        </header>
        <div className="container py-20 text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">任务不存在</h2>
          <p className="text-muted-foreground mb-6">该分析任务不存在或您没有权限访问</p>
          <Button onClick={() => setLocation("/dashboard")}>返回控制台</Button>
        </div>
      </div>
    );
  }

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yOffset = 20;

      // Title
      pdf.setFontSize(20);
      pdf.text('Document Similarity Analysis Report', pageWidth / 2, yOffset, { align: 'center' });
      yOffset += 15;

      // Task Info
      pdf.setFontSize(12);
      pdf.text(`Task: ${task?.taskName || ''}`, 20, yOffset);
      yOffset += 8;
      pdf.text(`Created: ${task?.createdAt ? new Date(task.createdAt).toLocaleString() : ''}`, 20, yOffset);
      yOffset += 8;
      pdf.text(`Mode: ${task?.analysisMode === 'traditional' ? 'Traditional' : 'DeepSeek AI'}`, 20, yOffset);
      yOffset += 15;

      // Overall Similarity
      pdf.setFontSize(16);
      pdf.text('Overall Similarity', 20, yOffset);
      yOffset += 10;
      pdf.setFontSize(32);
      pdf.text(`${similarity.toFixed(1)}%`, 20, yOffset);
      yOffset += 15;

      // Analysis Summary
      if (task?.summary) {
        pdf.setFontSize(14);
        pdf.text('Analysis Summary', 20, yOffset);
        yOffset += 8;
        pdf.setFontSize(10);
        const lines = pdf.splitTextToSize(task?.summary || '', pageWidth - 40);
        pdf.text(lines, 20, yOffset);
        yOffset += lines.length * 5 + 10;
      }

      // Similar Segments
      if (result?.segments && result.segments.length > 0) {
        if (yOffset > pageHeight - 40) {
          pdf.addPage();
          yOffset = 20;
        }
        pdf.setFontSize(14);
        pdf.text('Similar Segments', 20, yOffset);
        yOffset += 10;

        result.segments.slice(0, 5).forEach((segment: any, index: number) => {
          if (yOffset > pageHeight - 30) {
            pdf.addPage();
            yOffset = 20;
          }
          pdf.setFontSize(10);
          pdf.text(`Segment ${index + 1} (Similarity: ${segment.similarity.toFixed(1)}%)`, 20, yOffset);
          yOffset += 6;
          const text1 = pdf.splitTextToSize(`Doc A: ${segment.text1}`, pageWidth - 40);
          pdf.text(text1, 20, yOffset);
          yOffset += text1.length * 4 + 4;
          const text2 = pdf.splitTextToSize(`Doc B: ${segment.text2}`, pageWidth - 40);
          pdf.text(text2, 20, yOffset);
          yOffset += text2.length * 4 + 8;
        });
      }

      pdf.save(`analysis-report-${taskId}.pdf`);
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('PDF export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleExportWord = async () => {
    setExporting(true);
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: '文档相似度分析报告',
              heading: 'Heading1',
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `任务名称: ${task?.taskName || ''}`, break: 1 }),
                new TextRun({ text: `创建时间: ${task?.createdAt ? new Date(task.createdAt).toLocaleString() : ''}`, break: 1 }),
                new TextRun({ text: `分析模式: ${task?.analysisMode === 'traditional' ? '传统算法' : 'DeepSeek AI'}`, break: 1 }),
              ],
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: `整体相似度: ${similarity.toFixed(1)}%`,
              heading: 'Heading2',
            }),
            new Paragraph({ text: task?.summary || '暂无分析摘要' }),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: '相似片段',
              heading: 'Heading2',
            }),
            ...segments.map((seg: any, idx: number) => 
              new Paragraph({
                children: [
                  new TextRun({ text: `片段 #${idx + 1} (${seg.similarity.toFixed(1)}% 相似)`, bold: true, break: 1 }),
                  new TextRun({ text: `文档A: ${seg.doc1Segment || seg.text1 || ''}`, break: 1 }),
                  new TextRun({ text: `文档B: ${seg.doc2Segment || seg.text2 || ''}`, break: 1 }),
                  new TextRun({ text: `分析原因: ${seg.reason || ''}`, break: 1 }),
                ],
              })
            ),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${task?.taskName || '分析报告'}_${Date.now()}.docx`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Word报告已导出！');
    } catch (error: any) {
      toast.error(`导出失败: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // 概览表
      const overviewData = [
        ['文档相似度分析报告'],
        [''],
        ['任务名称', task?.taskName || ''],
        ['创建时间', task?.createdAt ? new Date(task.createdAt).toLocaleString() : ''],
        ['分析模式', task?.analysisMode === 'traditional' ? '传统算法' : 'DeepSeek AI'],
        ['整体相似度', `${similarity.toFixed(1)}%`],
        [''],
        ['分析摘要'],
        [task?.summary || '暂无分析摘要'],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(wb, ws1, '概览');

      // 相似片段表
      const segmentsData = [
        ['片段编号', '相似度', '文档A', '文档B', '分析原因'],
        ...segments.map((seg: any, idx: number) => [
          `片段 #${idx + 1}`,
          `${seg.similarity.toFixed(1)}%`,
          seg.doc1Segment || seg.text1 || '',
          seg.doc2Segment || seg.text2 || '',
          seg.reason || '',
        ]),
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(segmentsData);
      XLSX.utils.book_append_sheet(wb, ws2, '相似片段');

      // 导出
      XLSX.writeFile(wb, `${task?.taskName || '分析报告'}_${Date.now()}.xlsx`);

      toast.success('Excel报告已导出！');
    } catch (error: any) {
      toast.error(`导出失败: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const getSimilarityLevel = (similarity: number) => {
    if (similarity >= 80) return { label: "高度相似", color: "text-red-500", bgColor: "bg-red-50 dark:bg-red-950", borderColor: "border-red-200 dark:border-red-800" };
    if (similarity >= 50) return { label: "中度相似", color: "text-orange-500", bgColor: "bg-orange-50 dark:bg-orange-950", borderColor: "border-orange-200 dark:border-orange-800" };
    return { label: "低度相似", color: "text-green-500", bgColor: "bg-green-50 dark:bg-green-950", borderColor: "border-green-200 dark:border-green-800" };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />;
      default:
        return null;
    }
  };

  const similarity = task.similarity || 0;
  const level = getSimilarityLevel(similarity);

  // 准备雷达图数据
  const result = task.result;
  const radarData = result?.details ? [
    { subject: '语义相似度', value: (result.details as any)?.semanticSimilarity || 0, fullMark: 100 },
    { subject: '结构相似度', value: (result.details as any)?.structureSimilarity || 0, fullMark: 100 },
    { subject: '风格相似度', value: (result.details as any)?.styleSimilarity || 0, fullMark: 100 },
    { subject: '词汇相似度', value: (result.details as any)?.lexicalSimilarity || 0, fullMark: 100 },
    { subject: '句法相似度', value: (result.details as any)?.syntacticSimilarity || 0, fullMark: 100 },
  ] : [
    { subject: '语义相似度', value: similarity, fullMark: 100 },
    { subject: '结构相似度', value: similarity * 0.95, fullMark: 100 },
    { subject: '风格相似度', value: similarity * 0.90, fullMark: 100 },
    { subject: '词汇相似度', value: similarity * 0.85, fullMark: 100 },
    { subject: '句法相似度', value: similarity * 0.92, fullMark: 100 },
  ];

  // 准备柱状图数据
  const segments = result?.segments || [];
  const barData = [
    { name: '高度相似', count: segments.filter(s => s.similarity >= 80).length, fill: '#ef4444' },
    { name: '中度相似', count: segments.filter(s => s.similarity >= 50 && s.similarity < 80).length, fill: '#f97316' },
    { name: '低度相似', count: segments.filter(s => s.similarity < 50).length, fill: '#22c55e' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-lg font-bold">{task.taskName}</h1>
                <p className="text-xs text-muted-foreground">
                  创建于 {new Date(task.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
          </div>
          <div className="relative">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {exporting ? '导出中...' : '导出报告'}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
            {exportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-card border rounded-lg shadow-lg z-50">
                <div className="py-1">
                  <button
                    className="w-full px-4 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      setExportMenuOpen(false);
                      handleExportPDF();
                    }}
                  >
                    导出PDF格式
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      setExportMenuOpen(false);
                      handleExportWord();
                    }}
                  >
                    导出Word格式
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      setExportMenuOpen(false);
                      handleExportExcel();
                    }}
                  >
                    导出Excel格式
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Overview Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Similarity Score */}
          <Card className={`${level.bgColor} ${level.borderColor} border-2`}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">整体相似度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold ${level.color}`}>
                  {similarity.toFixed(1)}%
                </span>
              </div>
              <p className={`text-sm font-medium mt-2 ${level.color}`}>{level.label}</p>
              <Progress value={similarity} className="mt-4" />
            </CardContent>
          </Card>

          {/* Analysis Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">分析模式</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-lg">
                    {task.analysisMode === 'traditional' ? '传统算法' : 'DeepSeek AI'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {task.analysisMode === 'traditional' 
                      ? '基于余弦相似度和编辑距离' 
                      : 'AI驱动的深度语义分析'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">任务状态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {getStatusIcon(task.status)}
                <div>
                  <p className="font-bold text-lg">
                    {task.status === 'completed' ? '已完成' : 
                     task.status === 'processing' ? '处理中' : 
                     task.status === 'failed' ? '失败' : '等待中'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    分析已成功完成
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Results */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="segments">相似片段</TabsTrigger>
            <TabsTrigger value="comparison">文档对比</TabsTrigger>
            <TabsTrigger value="visualization">可视化</TabsTrigger>
            <TabsTrigger value="documents">文档列表</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>分析摘要</CardTitle>
                <CardDescription>AI生成的详细分析报告</CardDescription>
              </CardHeader>
              <CardContent>
                {task?.summary ? (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-foreground">{task.summary}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">暂无分析摘要</p>
                )}
              </CardContent>
            </Card>

            {/* Detailed Metrics */}
            {result?.details ? (
              <Card>
                <CardHeader>
                  <CardTitle>详细指标</CardTitle>
                  <CardDescription>多维度相似度分析</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">语义相似度</span>
                      <span className="text-sm text-muted-foreground">
                        {(result.details as any)?.semanticSimilarity?.toFixed(1) || similarity.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={(result.details as any)?.semanticSimilarity || similarity} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">结构相似度</span>
                      <span className="text-sm text-muted-foreground">
                        {(result.details as any)?.structureSimilarity?.toFixed(1) || (similarity * 0.95).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={(result.details as any)?.structureSimilarity || similarity * 0.95} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">风格相似度</span>
                      <span className="text-sm text-muted-foreground">
                        {(result.details as any)?.styleSimilarity?.toFixed(1) || (similarity * 0.90).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={(result.details as any)?.styleSimilarity || similarity * 0.90} />
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          {/* Segments Tab */}
          <TabsContent value="segments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>相似片段</CardTitle>
                <CardDescription>
                  共找到 {segments.length} 个相似片段
                </CardDescription>
              </CardHeader>
              <CardContent>
                {segments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">暂无相似片段数据</p>
                ) : (
                  <div className="space-y-4">
                    {segments.map((segment, index) => {
                      const segLevel = getSimilarityLevel(segment.similarity);
                      return (
                        <div key={index} className={`p-4 rounded-lg border-2 ${segLevel.borderColor} ${segLevel.bgColor}`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-muted-foreground">
                              片段 #{index + 1}
                            </span>
                            <span className={`text-sm font-bold ${segLevel.color}`}>
                              {segment.similarity.toFixed(1)}% 相似
                            </span>
                          </div>
                          <DiffHighlight 
                            text1={segment.doc1Segment || segment.text1 || '暂无内容'}
                            text2={segment.doc2Segment || segment.text2 || '暂无内容'}
                            label1="文档 A"
                            label2="文档 B"
                          />
                          {segment.reason && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">分析原因：</span>
                                {segment.reason}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visualization Tab */}
          <TabsContent value="visualization" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>多维度分析</CardTitle>
                  <CardDescription>各维度相似度雷达图</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name="相似度" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>相似片段分布</CardTitle>
                  <CardDescription>按相似度等级统计</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-6">
            {segments.length >= 2 ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-primary" />
                    <CardTitle>文档对比视图</CardTitle>
                  </div>
                  <CardDescription>
                    左右对比显示两个文档的差异，共找到 {segments.length} 个相似片段
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* 相似度概览 */}
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-primary">{similarity.toFixed(1)}%</p>
                            <p className="text-sm text-muted-foreground">整体相似度</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-500">{segments.filter(s => s.similarity >= 80).length}</p>
                            <p className="text-sm text-muted-foreground">高度相似片段</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-orange-500">{segments.filter(s => s.similarity >= 50 && s.similarity < 80).length}</p>
                            <p className="text-sm text-muted-foreground">中度相似片段</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* 相似片段对比列表 */}
                    <div className="space-y-4">
                      {segments.map((segment, index) => {
                        const segLevel = getSimilarityLevel(segment.similarity);
                        return (
                          <Card key={index} className={`border-2 ${segLevel.borderColor}`}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">片段 #{index + 1}</Badge>
                                  <span className={`text-sm font-bold ${segLevel.color}`}>
                                    {segment.similarity.toFixed(1)}% 相似
                                  </span>
                                </div>
                                <Badge className={segLevel.bgColor}>{segLevel.label}</Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="grid md:grid-cols-2 gap-4">
                                {/* 左侧：文档A */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <FileText className="h-4 w-4" />
                                    文档 A
                                  </div>
                                  <div className="p-3 bg-muted rounded-lg">
                                    <p className="text-sm whitespace-pre-wrap">
                                      {segment.doc1Segment || segment.text1 || '暂无内容'}
                                    </p>
                                  </div>
                                </div>
                                {/* 右侧：文档B */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <FileText className="h-4 w-4" />
                                    文档 B
                                  </div>
                                  <div className="p-3 bg-muted rounded-lg">
                                    <p className="text-sm whitespace-pre-wrap">
                                      {segment.doc2Segment || segment.text2 || '暂无内容'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              {segment.reason && (
                                <div className="mt-3 pt-3 border-t">
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-medium">分析原因：</span>
                                    {segment.reason}
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>文档对比视图</CardTitle>
                  <CardDescription>
                    左右对比显示两个文档的差异
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-2">暂无可对比的片段</p>
                    <p className="text-sm">需要至少 2 个相似片段才能显示对比视图</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>参与对比的文档</CardTitle>
                <CardDescription>共 {task.documents?.length || 0} 个文档</CardDescription>
              </CardHeader>
              <CardContent>
                {!task.documents || task.documents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">暂无文档信息</p>
                ) : (
                  <div className="space-y-3">
                    {task.documents.map((doc: any, index: number) => (
                      <div key={doc.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-muted-foreground">
                              文档 {String.fromCharCode(65 + index)}
                            </span>
                          </div>
                          <p className="font-medium truncate">{doc.filename}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.fileType.toUpperCase()} · {(doc.fileSize / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
