import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { FileText, Plus, Upload, Loader2, CheckCircle2, XCircle, Clock, GitCompare } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [exporting, setExporting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);

  const { data: documents, refetch: refetchDocuments } = trpc.documents.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: tasks, refetch: refetchTasks } = trpc.analysis.listTasks.useQuery(undefined, {
    enabled: !!user,
  });

  const deleteDocumentMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast.success("文档删除成功！");
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      refetchDocuments();
      refetchTasks();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const uploadMutation = trpc.documents.upload.useMutation({
    onSuccess: () => {
      toast.success("文档上传成功！");
      setUploadDialogOpen(false);
      setSelectedFile(null);
      refetchDocuments();
    },
    onError: (error) => {
      toast.error(`上传失败: ${error.message}`);
    },
  });

  const createTaskMutation = trpc.analysis.create.useMutation({
    onSuccess: () => {
      toast.success("分析任务已创建！");
      setCreateTaskDialogOpen(false);
      refetchTasks();
    },
    onError: (error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 验证文件大小
      if (file.size > 10 * 1024 * 1024) {
        toast.error("文件大小不能超过10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 90); // 0-90%用于读取文件
          setUploadProgress(progress);
        }
      };
      reader.onload = async (e) => {
        setUploadProgress(95); // 文件读取完成，开始上传
        const buffer = e.target?.result as ArrayBuffer;
        const base64 = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || '';
           uploadMutation.mutate(
          {
            filename: selectedFile.name,
            fileType: selectedFile.name.split('.').pop() || '',
            fileSize: selectedFile.size,
            fileBuffer: base64,
          },
          {
            onSuccess: () => {
              setUploadProgress(100);
            },
          }
        );  setUploading(false);
      };
      reader.readAsArrayBuffer(selectedFile);
    } catch (error) {
      setUploading(false);
      toast.error("文件读取失败");
    }
  };

  const [taskName, setTaskName] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [analysisMode, setAnalysisMode] = useState<"traditional" | "deepseek">("traditional");

  const handleBatchExport = async () => {
    if (selectedTasks.length === 0) {
      toast.error('请选择要导出的任务');
      return;
    }

    setExporting(true);
    try {
      const zip = new JSZip();
      const tasksToExport = tasks?.filter(t => selectedTasks.includes(t.id)) || [];

      for (const task of tasksToExport) {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        let yOffset = 20;

        // Title
        pdf.setFontSize(20);
        pdf.text('Document Similarity Analysis Report', pageWidth / 2, yOffset, { align: 'center' });
        yOffset += 15;

        // Task Info
        pdf.setFontSize(12);
        pdf.text(`Task: ${task.taskName}`, 20, yOffset);
        yOffset += 8;
        pdf.text(`Created: ${new Date(task.createdAt).toLocaleString()}`, 20, yOffset);
        yOffset += 8;
        pdf.text(`Mode: ${task.analysisMode === 'traditional' ? 'Traditional' : 'DeepSeek AI'}`, 20, yOffset);
        yOffset += 15;

        // Overall Similarity
        pdf.setFontSize(16);
        pdf.text('Overall Similarity', 20, yOffset);
        yOffset += 10;
        pdf.setFontSize(32);
        pdf.text(`${(task.overallSimilarity || 0).toFixed(1)}%`, 20, yOffset);
        yOffset += 15;

        const pdfBlob = pdf.output('blob');
        zip.file(`${task.taskName}-${task.id}.pdf`, pdfBlob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `analysis-reports-${Date.now()}.zip`);
      toast.success(`成功导出 ${tasksToExport.length} 个报告！`);
      setSelectedTasks([]);
    } catch (error) {
      console.error('Batch export error:', error);
      toast.error('批量导出失败');
    } finally {
      setExporting(false);
    }
  };

  const handleCreateTask = () => {
    if (!taskName) {
      toast.error("请输入任务名称");
      return;
    }
    if (selectedDocs.length !== 2) {
      toast.error("请选择2个文档进行对比");
      return;
    }

    createTaskMutation.mutate({
      taskName,
      documentIds: selectedDocs,
      analysisMode,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
      case 'processing':
        return '处理中';
      default:
        return '等待中';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">文档相似度分析系统</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">欢迎, {user.name || user.email}</span>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              登出
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                上传文档
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>上传文档</DialogTitle>
                <DialogDescription>
                  支持DOCX、PDF、TXT、PPTX、XLSX、Markdown、HTML格式，最大10MB
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="file">选择文件</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".docx,.doc,.pdf,.txt,.pptx,.ppt,.xlsx,.xls,.md,.markdown,.html,.htm"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground mt-2">
                      已选择: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                  {uploading && (
                    <div className="mt-4 space-y-2">
                      <Progress value={uploadProgress} />
                      <p className="text-sm text-muted-foreground text-center">
                        上传进度: {uploadProgress}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
                  取消
                </Button>
                <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {uploading ? "上传中..." : "上传"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={() => setLocation("/history")}>
            <Clock className="mr-2 h-4 w-4" />
            历史记录
          </Button>

          <Button variant="outline" onClick={() => setLocation("/version-comparison")}>
            <GitCompare className="mr-2 h-4 w-4" />
            版本对比
          </Button>

          <Dialog open={createTaskDialogOpen} onOpenChange={setCreateTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                创建分析任务
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>创建分析任务</DialogTitle>
                <DialogDescription>
                  选择两个文档进行相似度分析
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="taskName">任务名称</Label>
                  <Input
                    id="taskName"
                    placeholder="例如：合同版本对比"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>分析模式</Label>
                  <Select value={analysisMode} onValueChange={(v) => setAnalysisMode(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="traditional">传统算法（快速）</SelectItem>
                      <SelectItem value="deepseek">DeepSeek AI（智能）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>选择文档（选择2个）</Label>
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {documents?.map((doc) => (
                      <label key={doc.id} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-accent">
                        <input
                          type="checkbox"
                          checked={selectedDocs.includes(doc.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (selectedDocs.length < 2) {
                                setSelectedDocs([...selectedDocs, doc.id]);
                              }
                            } else {
                              setSelectedDocs(selectedDocs.filter(id => id !== doc.id));
                            }
                          }}
                        />
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{doc.filename}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateTaskDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleCreateTask}>创建任务</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Documents */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>我的文档</CardTitle>
            <CardDescription>已上传 {documents?.length || 0} 个文档</CardDescription>
          </CardHeader>
          <CardContent>
            {!documents || documents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">暂无文档，请先上传</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{doc.filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.fileType.toUpperCase()} · {(doc.fileSize / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDocumentToDelete(doc.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>分析任务</CardTitle>
                <CardDescription>共 {tasks?.length || 0} 个任务</CardDescription>
              </div>
              {tasks && tasks.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedTasks.length === tasks.length) {
                        setSelectedTasks([]);
                      } else {
                        setSelectedTasks(tasks.map(t => t.id));
                      }
                    }}
                  >
                    {selectedTasks.length === tasks.length ? '取消全选' : '全选'}
                  </Button>
                  {selectedTasks.length > 0 && (
                    <Button
                      size="sm"
                      onClick={handleBatchExport}
                      disabled={exporting}
                    >
                      {exporting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {exporting ? '导出中...' : `导出选中 (${selectedTasks.length})`}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!tasks || tasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">暂无任务，请创建分析任务</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTasks([...selectedTasks, task.id]);
                          } else {
                            setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                          }
                        }}
                        className="h-4 w-4"
                      />
                      {getStatusIcon(task.status)}
                      <div>
                        <p className="font-medium">{task.taskName}</p>
                        <p className="text-sm text-muted-foreground">
                          {getStatusText(task.status)} · {task.analysisMode === 'traditional' ? '传统算法' : 'DeepSeek AI'}
                          {task.overallSimilarity !== null && ` · 相似度 ${task.overallSimilarity.toFixed(1)}%`}
                        </p>
                      </div>
                    </div>
                    {task.status === 'completed' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setLocation(`/results/${task.id}`)}
                      >
                        查看报告
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              删除文档后，所有使用该文档的分析任务和结果也将被删除。此操作不可恢复，确定要继续吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (documentToDelete) {
                  deleteDocumentMutation.mutate({ documentId: documentToDelete });
                }
              }}
              disabled={deleteDocumentMutation.isPending}
            >
              {deleteDocumentMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {deleteDocumentMutation.isPending ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
