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
import { FileText, Plus, Upload, Loader2, CheckCircle2, XCircle, Clock, GitCompare, Eye, Grid3x3, Trash2, Download, FileCheck, Wand2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { DocumentPreviewDialog } from "@/components/DocumentPreviewDialog";
import { DashboardStats } from "@/components/DashboardStats";
import { DocumentFilters } from "@/components/DocumentFilters";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DashboardNew() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [exporting, setExporting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [documentToPreview, setDocumentToPreview] = useState<any>(null);

  // 搜索和筛选状态
  const [searchTerm, setSearchTerm] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const { data: documents, refetch: refetchDocuments } = trpc.documents.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: tasks, refetch: refetchTasks } = trpc.analysis.listTasks.useQuery(undefined, {
    enabled: !!user,
  });

  // 过滤文档
  const filteredDocuments = useMemo(() => {
    if (!documents) return [];

    return documents.filter((doc) => {
      // 搜索过滤
      if (searchTerm && !doc.filename.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // 文件类型过滤
      if (fileTypeFilter !== "all" && doc.fileType !== fileTypeFilter) {
        return false;
      }

      // 日期过滤
      if (dateFilter !== "all") {
        const docDate = new Date(doc.createdAt);
        const now = new Date();
        const diffTime = now.getTime() - docDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        switch (dateFilter) {
          case "today":
            if (diffDays > 1) return false;
            break;
          case "week":
            if (diffDays > 7) return false;
            break;
          case "month":
            if (diffDays > 30) return false;
            break;
          case "year":
            if (diffDays > 365) return false;
            break;
        }
      }

      return true;
    });
  }, [documents, searchTerm, fileTypeFilter, dateFilter]);

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
      setSelectedFiles([]);
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
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    
    for (const file of files) {
      // 验证文件大小
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`文件 ${file.name} 大小超过10MB，已跳过`);
        continue;
      }
      validFiles.push(file);
    }
    
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setCurrentUploadIndex(0);
    
    const uploadNextFile = async (index: number) => {
      if (index >= selectedFiles.length) {
        // 所有文件上传完成
        setUploading(false);
        setUploadDialogOpen(false);
        setSelectedFiles([]);
        setUploadProgress(0);
        toast.success(`成功上传 ${selectedFiles.length} 个文件！`);
        refetchDocuments();
        return;
      }

      const file = selectedFiles[index];
      setCurrentUploadIndex(index);
      setUploadProgress(Math.round((index / selectedFiles.length) * 100));

      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const buffer = e.target?.result as ArrayBuffer;
          const base64 = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );

          uploadMutation.mutate(
            {
              filename: file.name,
              fileType: file.name.split('.').pop() || '',
              fileSize: file.size,
              fileBuffer: base64,
            },
            {
              onSuccess: () => {
                // 继续上传下一个文件
                uploadNextFile(index + 1);
              },
              onError: (error) => {
                toast.error(`上传 ${file.name} 失败: ${error.message}`);
                // 继续上传下一个文件
                uploadNextFile(index + 1);
              },
            }
          );
        };
        reader.onerror = () => {
          toast.error(`读取 ${file.name} 失败`);
          uploadNextFile(index + 1);
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        toast.error(`处理 ${file.name} 失败`);
        uploadNextFile(index + 1);
      }
    };

    uploadNextFile(0);
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
        pdf.text(`${(task.similarity || 0).toFixed(1)}%`, 20, yOffset);
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
    window.location.href = '/login';
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

  const getFileTypeBadge = (fileType: string) => {
    const colors: Record<string, string> = {
      pdf: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      docx: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      doc: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      txt: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
      md: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      html: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      pptx: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      xlsx: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    };

    return (
      <Badge variant="secondary" className={colors[fileType] || ""}>
        {fileType.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">文档相似度分析系统</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">欢迎, {user.name || user.email}</span>
            {user.role === 'admin' && (
              <>
                <Badge variant="outline" className="text-xs">管理员</Badge>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => setLocation('/admin')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  管理员后台
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => logout()}>
              登出
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8 space-y-8">
        {/* 统计卡片 */}
        <DashboardStats />

        {/* 快捷操作 */}
        <div className="flex flex-wrap gap-4">
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
                    multiple
                    accept=".docx,.doc,.pdf,.txt,.pptx,.ppt,.xlsx,.xls,.md,.markdown,.html,.htm"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                  {selectedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">已选择 {selectedFiles.length} 个文件：</p>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="text-sm text-muted-foreground flex justify-between">
                            <span>{file.name}</span>
                            <span>({(file.size / 1024).toFixed(2)} KB)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {uploading && (
                    <div className="mt-4 space-y-2">
                      <Progress value={uploadProgress} />
                      <p className="text-sm text-muted-foreground text-center">
                        上传进度: {currentUploadIndex + 1}/{selectedFiles.length} ({uploadProgress}%)
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setUploadDialogOpen(false);
                  setSelectedFiles([]);
                }} disabled={uploading}>
                  取消
                </Button>
                <Button onClick={handleUpload} disabled={selectedFiles.length === 0 || uploading}>
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {uploading ? `上传中 (${currentUploadIndex + 1}/${selectedFiles.length})...` : `上传 (${selectedFiles.length} 个文件)`}
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

          <Button variant="outline" onClick={() => setLocation("/batch-comparison")}>
            <Grid3x3 className="mr-2 h-4 w-4" />
            批量对比
          </Button>

          <Button variant="outline" onClick={() => setLocation("/contract-review")}>
            <FileCheck className="mr-2 h-4 w-4" />
            合同审核
          </Button>

          <Button variant="outline" onClick={() => setLocation("/document-formatter")}>
            <Wand2 className="mr-2 h-4 w-4" />
            格式处理
          </Button>

          <Dialog open={createTaskDialogOpen} onOpenChange={setCreateTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                创建分析任务
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
                  <Select value={analysisMode} onValueChange={(v: any) => setAnalysisMode(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="traditional">传统算法</SelectItem>
                      <SelectItem value="deepseek">DeepSeek AI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>选择文档 (必须选择2个)</Label>
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                    {documents?.map((doc) => (
                      <div key={doc.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`doc-${doc.id}`}
                          checked={selectedDocs.includes(doc.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              if (selectedDocs.length < 2) {
                                setSelectedDocs([...selectedDocs, doc.id]);
                              } else {
                                toast.error("最多只能选择2个文档");
                              }
                            } else {
                              setSelectedDocs(selectedDocs.filter(id => id !== doc.id));
                            }
                          }}
                        />
                        <label
                          htmlFor={`doc-${doc.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          {doc.filename} ({getFileTypeBadge(doc.fileType)})
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    已选择: {selectedDocs.length}/2
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setCreateTaskDialogOpen(false);
                  setTaskName("");
                  setSelectedDocs([]);
                }}>
                  取消
                </Button>
                <Button onClick={handleCreateTask} disabled={selectedDocs.length !== 2 || !taskName}>
                  创建任务
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* 文档列表 */}
        <Card>
          <CardHeader>
            <CardTitle>我的文档</CardTitle>
            <CardDescription>
              管理您上传的文档，共 {filteredDocuments.length} 个文档
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              fileTypeFilter={fileTypeFilter}
              onFileTypeChange={setFileTypeFilter}
              dateFilter={dateFilter}
              onDateChange={setDateFilter}
            />
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {documents && documents.length > 0 ? "没有找到匹配的文档" : "还没有上传任何文档"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {(doc.fileSize / 1024).toFixed(2)} KB • {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {getFileTypeBadge(doc.fileType)}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDocumentToPreview(doc);
                          setPreviewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDocumentToDelete(doc.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 最近的任务 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>最近的分析任务</CardTitle>
                <CardDescription>
                  查看您最近创建的分析任务
                </CardDescription>
              </div>
              {selectedTasks.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchExport}
                  disabled={exporting}
                >
                  {exporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  导出选中 ({selectedTasks.length})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!tasks || tasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                还没有创建任何分析任务
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 10).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Checkbox
                        checked={selectedTasks.includes(task.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTasks([...selectedTasks, task.id]);
                          } else {
                            setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                          }
                        }}
                      />
                      {getStatusIcon(task.status)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.taskName}</p>
                        <p className="text-sm text-muted-foreground">
                          {getStatusText(task.status)} • {new Date(task.createdAt).toLocaleDateString()}
                          {task.similarity !== null && ` • 相似度: ${task.similarity.toFixed(1)}%`}
                        </p>
                      </div>
                      <Badge variant={task.analysisMode === 'deepseek' ? 'default' : 'secondary'}>
                        {task.analysisMode === 'deepseek' ? 'AI分析' : '传统算法'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {task.status === 'completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/results/${task.id}`)}
                        >
                          查看详情
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除这个文档吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (documentToDelete) {
                  deleteDocumentMutation.mutate({ documentId: documentToDelete });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 文档预览对话框 */}
      {documentToPreview && (
        <DocumentPreviewDialog
          document={documentToPreview}
          open={previewDialogOpen}
          onOpenChange={setPreviewDialogOpen}
        />
      )}
    </div>
  );
}
