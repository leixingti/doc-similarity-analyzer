import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { FileText, ArrowLeft, AlertCircle, CheckCircle2, MinusCircle, PlusCircle, Download } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import jsPDF from "jspdf";
import { toast } from "sonner";

export default function VersionComparison() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [document1Id, setDocument1Id] = useState<number | null>(null);
  const [document2Id, setDocument2Id] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  // 导出PDF报告
  const exportToPDF = async () => {
    if (!comparisonResult || !documents) return;

    setExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // 标题
      doc.setFontSize(20);
      doc.text("文档版本对比报告", pageWidth / 2, yPos, { align: "center" });
      yPos += 15;

      // 对比文档信息
      doc.setFontSize(12);
      const doc1 = documents.find((d) => d.id === document1Id);
      const doc2 = documents.find((d) => d.id === document2Id);
      doc.text(`Version 1: ${doc1?.filename || "Unknown"}`, 20, yPos);
      yPos += 8;
      doc.text(`Version 2: ${doc2?.filename || "Unknown"}`, 20, yPos);
      yPos += 15;

      // 变化统计
      doc.setFontSize(16);
      doc.text("变化统计", 20, yPos);
      yPos += 10;

      doc.setFontSize(12);
      doc.text(`Total Lines: ${comparisonResult.statistics.totalLines}`, 20, yPos);
      yPos += 8;
      doc.text(`Added Lines: ${comparisonResult.statistics.addedLines}`, 20, yPos);
      yPos += 8;
      doc.text(`Deleted Lines: ${comparisonResult.statistics.deletedLines}`, 20, yPos);
      yPos += 8;
      doc.text(`Modified Lines: ${comparisonResult.statistics.modifiedLines}`, 20, yPos);
      yPos += 8;
      doc.text(`Unchanged Lines: ${comparisonResult.statistics.unchangedLines}`, 20, yPos);
      yPos += 15;

      // 总体评估
      doc.setFontSize(16);
      doc.text("总体评估", 20, yPos);
      yPos += 10;

      doc.setFontSize(12);
      doc.text(`Modification Rate: ${comparisonResult.statistics.modificationRate.toFixed(2)}%`, 20, yPos);
      yPos += 8;
      doc.text(`Change Level: ${getChangeLevelText(comparisonResult.changeLevel)}`, 20, yPos);
      yPos += 15;

      // 详细变化（只显示前20个）
      doc.setFontSize(16);
      doc.text("详细变化 (Top 20)", 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      const maxChanges = Math.min(20, comparisonResult.changes.length);
      for (let i = 0; i < maxChanges; i++) {
        const change = comparisonResult.changes[i];
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        const typeText = change.type === "added" ? "[+]" : change.type === "deleted" ? "[-]" : "[~]";
        doc.text(`${typeText} Line ${change.lineNumber}`, 20, yPos);
        yPos += 6;

        if (change.oldContent) {
          const oldLines = doc.splitTextToSize(`- ${change.oldContent}`, pageWidth - 40);
          doc.text(oldLines, 25, yPos);
          yPos += oldLines.length * 5;
        }

        if (change.newContent) {
          const newLines = doc.splitTextToSize(`+ ${change.newContent}`, pageWidth - 40);
          doc.text(newLines, 25, yPos);
          yPos += newLines.length * 5;
        }

        yPos += 3;
      }

      // 保存PDF
      const fileName = `version-comparison-${doc1?.filename || "doc1"}-vs-${doc2?.filename || "doc2"}.pdf`;
      doc.save(fileName);
      toast.success("导出成功！");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("导出失败，请重试");
    } finally {
      setExporting(false);
    }
  };

  // 获取用户的所有文档
  const { data: documents } = trpc.documents.list.useQuery(undefined, {
    enabled: !!user,
  });

  // 获取对比结果
  const { data: comparisonResult, isLoading: comparing } = trpc.versions.compare.useQuery(
    {
      document1Id: document1Id!,
      document2Id: document2Id!,
    },
    {
      enabled: !!document1Id && !!document2Id && document1Id !== document2Id,
    }
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!user) {
    window.location.href = 
"/login";
    return null;
  }

  const getChangeLevelText = (level: string) => {
    switch (level) {
      case 'minimal':
        return '微小变化';
      case 'light':
        return '轻度变化';
      case 'moderate':
        return '中度变化';
      case 'significant':
        return '重大变化';
      default:
        return '未知';
    }
  };

  const getChangeLevelColor = (level: string) => {
    switch (level) {
      case 'minimal':
        return 'text-green-600';
      case 'light':
        return 'text-blue-600';
      case 'moderate':
        return 'text-orange-600';
      case 'significant':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">文档版本对比</span>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* 版本选择器 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>选择对比版本</CardTitle>
            <CardDescription>选择两个文档进行版本对比</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">版本 1</label>
                <Select
                  value={document1Id?.toString()}
                  onValueChange={(value) => setDocument1Id(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择文档" />
                  </SelectTrigger>
                  <SelectContent>
                    {documents?.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id.toString()}>
                        {doc.filename}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">版本 2</label>
                <Select
                  value={document2Id?.toString()}
                  onValueChange={(value) => setDocument2Id(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择文档" />
                  </SelectTrigger>
                  <SelectContent>
                    {documents?.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id.toString()}>
                        {doc.filename}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {document1Id && document2Id && document1Id === document2Id && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>请选择两个不同的文档进行对比</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* 对比结果 */}
        {comparing && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">正在对比文档...</p>
          </div>
        )}

        {comparisonResult && (
          <div className="space-y-6">
            {/* 导出按钮 */}
            <div className="flex justify-end">
              <Button onClick={exportToPDF} disabled={exporting}>
                <Download className="mr-2 h-4 w-4" />
                {exporting ? "导出中..." : "导出PDF报告"}
              </Button>
            </div>
            {/* 变化统计 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">总行数</p>
                    <p className="text-2xl font-bold">{comparisonResult.statistics.totalLines}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <PlusCircle className="h-4 w-4 text-green-600" />
                      <p className="text-sm text-muted-foreground">新增</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {comparisonResult.statistics.addedLines}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <MinusCircle className="h-4 w-4 text-red-600" />
                      <p className="text-sm text-muted-foreground">删除</p>
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                      {comparisonResult.statistics.deletedLines}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <p className="text-sm text-muted-foreground">修改</p>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                      {comparisonResult.statistics.modifiedLines}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CheckCircle2 className="h-4 w-4 text-gray-600" />
                      <p className="text-sm text-muted-foreground">未变化</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-600">
                      {comparisonResult.statistics.unchangedLines}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 修改率和变化程度 */}
            <Card>
              <CardHeader>
                <CardTitle>总体评估</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">修改率</p>
                    <p className="text-4xl font-bold">
                      {comparisonResult.statistics.modificationRate.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">变化程度</p>
                    <p className={`text-4xl font-bold ${getChangeLevelColor(comparisonResult.changeLevel)}`}>
                      {getChangeLevelText(comparisonResult.changeLevel)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 详细变化列表 */}
            <Card>
              <CardHeader>
                <CardTitle>详细变化</CardTitle>
                <CardDescription>
                  显示前100个变化（共 {comparisonResult.changes.length} 个）
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {comparisonResult.changes.slice(0, 100).map((change, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        change.type === 'added'
                          ? 'bg-green-50 border-green-200'
                          : change.type === 'deleted'
                          ? 'bg-red-50 border-red-200'
                          : change.type === 'modified'
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {change.type === 'added' && (
                            <PlusCircle className="h-5 w-5 text-green-600" />
                          )}
                          {change.type === 'deleted' && (
                            <MinusCircle className="h-5 w-5 text-red-600" />
                          )}
                          {change.type === 'modified' && (
                            <AlertCircle className="h-5 w-5 text-orange-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium mb-1">
                            行 {change.lineNumber}
                          </p>
                          {change.oldContent && (
                            <p className="text-sm text-red-700 line-through mb-1">
                              {change.oldContent}
                            </p>
                          )}
                          {change.newContent && (
                            <p className="text-sm text-green-700">
                              {change.newContent}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
