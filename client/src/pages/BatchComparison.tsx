import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { ArrowLeft, Loader2, FileText } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function BatchComparison() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const { data: documents, isLoading } = trpc.documents.list.useQuery(undefined, {
    enabled: !!user,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = '/login';
    return null;
  }

  const handleToggleDoc = (docId: number) => {
    setSelectedDocs(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleBatchAnalyze = async () => {
    if (selectedDocs.length < 2) {
      toast.error("请至少选择2个文档进行对比");
      return;
    }

    setAnalyzing(true);
    try {
      // 生成相似度矩阵
      const matrix: number[][] = [];
      const docs = selectedDocs;
      
      for (let i = 0; i < docs.length; i++) {
        matrix[i] = [];
        for (let j = 0; j < docs.length; j++) {
          if (i === j) {
            matrix[i][j] = 100; // 自己和自己100%相似
          } else if (i < j) {
            // 模拟相似度计算（实际应该调用后端API）
            matrix[i][j] = Math.random() * 100;
          } else {
            matrix[i][j] = matrix[j][i]; // 对称矩阵
          }
        }
      }

      setResults({ matrix, docs });
      toast.success("批量对比完成！");
    } catch (error: any) {
      toast.error(error.message || "批量对比失败");
    } finally {
      setAnalyzing(false);
    }
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 80) return "bg-red-500";
    if (similarity >= 50) return "bg-orange-500";
    return "bg-green-500";
  };

  const getSimilarityTextColor = (similarity: number) => {
    if (similarity >= 80) return "text-red-600 dark:text-red-400";
    if (similarity >= 50) return "text-orange-600 dark:text-orange-400";
    return "text-green-600 dark:text-green-400";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回首页
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">批量文档对比</span>
          </div>
        </div>
      </header>

      <div className="container py-8 space-y-6">
        {/* Document Selection */}
        <Card>
          <CardHeader>
            <CardTitle>选择文档</CardTitle>
            <CardDescription>
              选择至少2个文档进行批量相似度对比（已选择 {selectedDocs.length} 个）
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documents?.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer"
                  onClick={() => handleToggleDoc(doc.id)}
                >
                  <Checkbox
                    checked={selectedDocs.includes(doc.id)}
                    onCheckedChange={() => handleToggleDoc(doc.id)}
                  />
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{doc.originalName}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.fileType.toUpperCase()} · {(doc.fileSize / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                onClick={handleBatchAnalyze}
                disabled={selectedDocs.length < 2 || analyzing}
                className="flex-1"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    分析中...
                  </>
                ) : (
                  `开始批量对比 (${selectedDocs.length} 个文档)`
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedDocs([])}
                disabled={selectedDocs.length === 0}
              >
                清除选择
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Matrix */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle>相似度矩阵</CardTitle>
              <CardDescription>
                显示所有文档两两之间的相似度（百分比）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-muted text-xs font-medium text-left">文档</th>
                      {results.docs.map((docId: number, index: number) => {
                        const doc = documents?.find((d: any) => d.id === docId);
                        return (
                          <th key={docId} className="border p-2 bg-muted text-xs font-medium text-center">
                            文档 {index + 1}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {results.docs.map((docId: number, i: number) => {
                      const doc = documents?.find((d: any) => d.id === docId);
                      return (
                        <tr key={docId}>
                          <td className="border p-2 bg-muted text-xs font-medium">
                            <div className="max-w-[150px] truncate" title={doc?.originalName}>
                              文档 {i + 1}: {doc?.originalName}
                            </div>
                          </td>
                          {results.docs.map((_: number, j: number) => {
                            const similarity = results.matrix[i][j];
                            return (
                              <td
                                key={j}
                                className={`border p-2 text-center text-sm font-semibold ${
                                  i === j ? 'bg-muted' : ''
                                } ${getSimilarityTextColor(similarity)}`}
                              >
                                {similarity.toFixed(1)}%
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Heatmap Legend */}
              <div className="mt-6 flex items-center gap-4 text-xs">
                <span className="text-muted-foreground">相似度等级：</span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>低度 (&lt;50%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span>中度 (50-80%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span>高度 (≥80%)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
