import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { 
  FileText, ArrowLeft, Eye, FileImage, RefreshCw, Download, 
  Droplets, Hash, Edit, Wand2 
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export default function DocumentFormatter() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  
  // OCR状态
  const [ocrDocumentId, setOcrDocumentId] = useState<number | null>(null);
  const [ocrLanguage, setOcrLanguage] = useState<string>('chi_sim');
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);

  // 格式转换状态
  const [convertDocumentId, setConvertDocumentId] = useState<number | null>(null);
  const [convertType, setConvertType] = useState<'pdf_to_word' | 'word_to_pdf'>('pdf_to_word');
  const [addWatermark, setAddWatermark] = useState(false);
  const [watermarkText, setWatermarkText] = useState('');
  const [convertResult, setConvertResult] = useState<any>(null);
  const [converting, setConverting] = useState(false);

  // 批量水印状态
  const [selectedWatermarkDocs, setSelectedWatermarkDocs] = useState<number[]>([]);
  const [batchWatermarkText, setBatchWatermarkText] = useState('');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);
  const [watermarkAngle, setWatermarkAngle] = useState(45);
  const [watermarkResult, setWatermarkResult] = useState<any>(null);
  const [addingWatermark, setAddingWatermark] = useState(false);

  // 批量页码状态
  const [selectedPageNumberDocs, setSelectedPageNumberDocs] = useState<number[]>([]);
  const [pageNumberPosition, setPageNumberPosition] = useState<'top' | 'bottom'>('bottom');
  const [pageNumberFormat, setPageNumberFormat] = useState('{n}');
  const [pageNumberResult, setPageNumberResult] = useState<any>(null);
  const [addingPageNumber, setAddingPageNumber] = useState(false);

  // 获取用户的所有文档
  const { data: documents } = trpc.documents.list.useQuery(undefined, {
    enabled: !!user,
  });

  // OCR mutation
  const ocrMutation = trpc.formatter.ocr.useMutation({
    onSuccess: (data) => {
      setOcrResult(data);
      setOcrProcessing(false);
      toast.success("OCR识别完成");
    },
    onError: (error) => {
      setOcrProcessing(false);
      toast.error(`OCR识别失败: ${error.message}`);
    },
  });

  // 格式转换mutations
  const convertPDFToWordMutation = trpc.formatter.convertPDFToWord.useMutation({
    onSuccess: (data) => {
      setConvertResult(data);
      setConverting(false);
      toast.success("转换完成");
    },
    onError: (error) => {
      setConverting(false);
      toast.error(`转换失败: ${error.message}`);
    },
  });

  const convertWordToPDFMutation = trpc.formatter.convertWordToPDF.useMutation({
    onSuccess: (data) => {
      setConvertResult(data);
      setConverting(false);
      toast.success("转换完成");
    },
    onError: (error) => {
      setConverting(false);
      toast.error(`转换失败: ${error.message}`);
    },
  });

  // 批量水印mutation
  const batchWatermarkMutation = trpc.formatter.batchAddWatermark.useMutation({
    onSuccess: (data) => {
      setWatermarkResult(data);
      setAddingWatermark(false);
      toast.success(`成功处理 ${data.succeeded} 个文件`);
    },
    onError: (error) => {
      setAddingWatermark(false);
      toast.error(`批量添加水印失败: ${error.message}`);
    },
  });

  // 批量页码mutation
  const batchPageNumberMutation = trpc.formatter.batchAddPageNumbers.useMutation({
    onSuccess: (data) => {
      setPageNumberResult(data);
      setAddingPageNumber(false);
      toast.success(`成功处理 ${data.succeeded} 个文件`);
    },
    onError: (error) => {
      setAddingPageNumber(false);
      toast.error(`批量添加页码失败: ${error.message}`);
    },
  });

  const handleOCR = () => {
    if (!ocrDocumentId) {
      toast.error("请选择要识别的文档");
      return;
    }

    setOcrProcessing(true);
    setOcrResult(null);

    ocrMutation.mutate({
      documentId: ocrDocumentId,
      language: ocrLanguage,
    });
  };

  const handleConvert = () => {
    if (!convertDocumentId) {
      toast.error("请选择要转换的文档");
      return;
    }

    setConverting(true);
    setConvertResult(null);

    if (convertType === 'pdf_to_word') {
      convertPDFToWordMutation.mutate({
        documentId: convertDocumentId,
      });
    } else {
      convertWordToPDFMutation.mutate({
        documentId: convertDocumentId,
        addWatermark,
        watermarkText: addWatermark ? watermarkText : undefined,
      });
    }
  };

  const handleBatchWatermark = () => {
    if (selectedWatermarkDocs.length === 0) {
      toast.error("请选择要添加水印的文档");
      return;
    }

    if (!batchWatermarkText) {
      toast.error("请输入水印文字");
      return;
    }

    setAddingWatermark(true);
    setWatermarkResult(null);

    batchWatermarkMutation.mutate({
      documentIds: selectedWatermarkDocs,
      watermarkText: batchWatermarkText,
      opacity: watermarkOpacity,
      angle: watermarkAngle,
    });
  };

  const handleBatchPageNumber = () => {
    if (selectedPageNumberDocs.length === 0) {
      toast.error("请选择要添加页码的文档");
      return;
    }

    setAddingPageNumber(true);
    setPageNumberResult(null);

    batchPageNumberMutation.mutate({
      documentIds: selectedPageNumberDocs,
      position: pageNumberPosition,
      format: pageNumberFormat,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>需要登录</CardTitle>
            <CardDescription>请先登录以使用文档格式处理功能</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")}>返回首页</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 页头 */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回首页
          </Button>
          <div className="flex items-center gap-3">
            <Wand2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">文档格式处理</h1>
              <p className="text-muted-foreground">
                OCR识别、格式转换、批量操作、排版美化
              </p>
            </div>
          </div>
        </div>

        {/* 功能标签页 */}
        <Tabs defaultValue="ocr" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ocr">
              <Eye className="mr-2 h-4 w-4" />
              OCR识别
            </TabsTrigger>
            <TabsTrigger value="convert">
              <RefreshCw className="mr-2 h-4 w-4" />
              格式转换
            </TabsTrigger>
            <TabsTrigger value="watermark">
              <Droplets className="mr-2 h-4 w-4" />
              批量水印
            </TabsTrigger>
            <TabsTrigger value="pagenumber">
              <Hash className="mr-2 h-4 w-4" />
              批量页码
            </TabsTrigger>
          </TabsList>

          {/* OCR识别 */}
          <TabsContent value="ocr">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>OCR设置</CardTitle>
                    <CardDescription>将图片或扫描件转为文字</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        选择文档
                      </label>
                      <Select
                        value={ocrDocumentId?.toString()}
                        onValueChange={(value) => setOcrDocumentId(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="请选择文档" />
                        </SelectTrigger>
                        <SelectContent>
                          {documents && documents.length > 0 ? (
                            documents.map((doc) => (
                              <SelectItem key={doc.id} value={doc.id.toString()}>
                                {doc.filename}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              暂无文档
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        识别语言
                      </label>
                      <Select value={ocrLanguage} onValueChange={setOcrLanguage}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chi_sim">中文（简体）</SelectItem>
                          <SelectItem value="eng">英文</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleOCR}
                      disabled={!ocrDocumentId || ocrProcessing}
                      className="w-full"
                    >
                      {ocrProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          识别中...
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          开始识别
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                {!ocrResult && !ocrProcessing && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <FileImage className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">
                        选择文档，点击"开始识别"查看结果
                      </p>
                    </CardContent>
                  </Card>
                )}

                {ocrProcessing && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
                      <p className="text-muted-foreground">正在识别文字...</p>
                    </CardContent>
                  </Card>
                )}

                {ocrResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle>识别结果</CardTitle>
                      <CardDescription>
                        置信度：{(ocrResult.confidence * 100).toFixed(1)}%
                        {ocrResult.pageCount && ` | 页数：${ocrResult.pageCount}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-muted rounded-lg max-h-[600px] overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap font-sans">
                          {ocrResult.text}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* 格式转换 */}
          <TabsContent value="convert">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>转换设置</CardTitle>
                    <CardDescription>PDF ↔ Word 互转</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        转换类型
                      </label>
                      <Select value={convertType} onValueChange={(value: any) => setConvertType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf_to_word">PDF → Word</SelectItem>
                          <SelectItem value="word_to_pdf">Word → PDF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        选择文档
                      </label>
                      <Select
                        value={convertDocumentId?.toString()}
                        onValueChange={(value) => setConvertDocumentId(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="请选择文档" />
                        </SelectTrigger>
                        <SelectContent>
                          {documents && documents.length > 0 ? (
                            documents.map((doc) => (
                              <SelectItem key={doc.id} value={doc.id.toString()}>
                                {doc.filename}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              暂无文档
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {convertType === 'word_to_pdf' && (
                      <>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="watermark"
                            checked={addWatermark}
                            onCheckedChange={(checked) => setAddWatermark(checked as boolean)}
                          />
                          <label
                            htmlFor="watermark"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            添加水印
                          </label>
                        </div>

                        {addWatermark && (
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              水印文字
                            </label>
                            <Input
                              value={watermarkText}
                              onChange={(e) => setWatermarkText(e.target.value)}
                              placeholder="如：机密、仅供内部使用"
                            />
                          </div>
                        )}
                      </>
                    )}

                    <Button
                      onClick={handleConvert}
                      disabled={!convertDocumentId || converting}
                      className="w-full"
                    >
                      {converting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          转换中...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          开始转换
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                {!convertResult && !converting && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <RefreshCw className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">
                        选择转换类型和文档，点击"开始转换"
                      </p>
                    </CardContent>
                  </Card>
                )}

                {converting && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
                      <p className="text-muted-foreground">正在转换格式...</p>
                    </CardContent>
                  </Card>
                )}

                {convertResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle>转换结果</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {convertResult.success ? (
                        <div className="space-y-4">
                          <Alert>
                            <AlertDescription>
                              ✅ 转换成功！文件已保存
                            </AlertDescription>
                          </Alert>
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm">
                              <span className="font-medium">输出文件：</span>
                              {convertResult.outputPath}
                            </p>
                            <p className="text-sm mt-2">
                              <span className="font-medium">格式：</span>
                              {convertResult.format}
                            </p>
                          </div>
                          <Button className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            下载文件
                          </Button>
                        </div>
                      ) : (
                        <Alert variant="destructive">
                          <AlertDescription>
                            ❌ 转换失败：{convertResult.error}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* 批量水印 */}
          <TabsContent value="watermark">
            <Card>
              <CardHeader>
                <CardTitle>批量添加水印</CardTitle>
                <CardDescription>为多个文档批量添加水印</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      水印文字
                    </label>
                    <Input
                      value={batchWatermarkText}
                      onChange={(e) => setBatchWatermarkText(e.target.value)}
                      placeholder="如：机密、仅供内部使用"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      透明度 ({watermarkOpacity})
                    </label>
                    <Input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      旋转角度 ({watermarkAngle}°)
                    </label>
                    <Input
                      type="range"
                      min="0"
                      max="90"
                      step="5"
                      value={watermarkAngle}
                      onChange={(e) => setWatermarkAngle(parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    选择文档（已选 {selectedWatermarkDocs.length} 个）
                  </label>
                  <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto space-y-2">
                    {documents && documents.length > 0 ? (
                      documents.map((doc) => (
                        <div key={doc.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`watermark-${doc.id}`}
                            checked={selectedWatermarkDocs.includes(doc.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedWatermarkDocs([...selectedWatermarkDocs, doc.id]);
                              } else {
                                setSelectedWatermarkDocs(selectedWatermarkDocs.filter(id => id !== doc.id));
                              }
                            }}
                          />
                          <label
                            htmlFor={`watermark-${doc.id}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {doc.filename}
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">暂无文档</p>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleBatchWatermark}
                  disabled={selectedWatermarkDocs.length === 0 || !batchWatermarkText || addingWatermark}
                  className="w-full"
                >
                  {addingWatermark ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      处理中...
                    </>
                  ) : (
                    <>
                      <Droplets className="mr-2 h-4 w-4" />
                      批量添加水印
                    </>
                  )}
                </Button>

                {watermarkResult && (
                  <div className="mt-4">
                    <Alert>
                      <AlertDescription>
                        ✅ 成功处理 {watermarkResult.succeeded} 个文件，失败 {watermarkResult.failed} 个
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 批量页码 */}
          <TabsContent value="pagenumber">
            <Card>
              <CardHeader>
                <CardTitle>批量添加页码</CardTitle>
                <CardDescription>为多个文档批量添加页码</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      页码位置
                    </label>
                    <Select value={pageNumberPosition} onValueChange={(value: any) => setPageNumberPosition(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">页眉</SelectItem>
                        <SelectItem value="bottom">页脚</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      页码格式
                    </label>
                    <Select value={pageNumberFormat} onValueChange={setPageNumberFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="{n}">{'{n}'} (1, 2, 3...)</SelectItem>
                        <SelectItem value="第{n}页">第{'{n}'}页</SelectItem>
                        <SelectItem value="Page {n}">Page {'{n}'}</SelectItem>
                        <SelectItem value="{n} / {total}">{'{n}'} / {'{total}'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    选择文档（已选 {selectedPageNumberDocs.length} 个）
                  </label>
                  <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto space-y-2">
                    {documents && documents.length > 0 ? (
                      documents.map((doc) => (
                        <div key={doc.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`pagenumber-${doc.id}`}
                            checked={selectedPageNumberDocs.includes(doc.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPageNumberDocs([...selectedPageNumberDocs, doc.id]);
                              } else {
                                setSelectedPageNumberDocs(selectedPageNumberDocs.filter(id => id !== doc.id));
                              }
                            }}
                          />
                          <label
                            htmlFor={`pagenumber-${doc.id}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {doc.filename}
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">暂无文档</p>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleBatchPageNumber}
                  disabled={selectedPageNumberDocs.length === 0 || addingPageNumber}
                  className="w-full"
                >
                  {addingPageNumber ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      处理中...
                    </>
                  ) : (
                    <>
                      <Hash className="mr-2 h-4 w-4" />
                      批量添加页码
                    </>
                  )}
                </Button>

                {pageNumberResult && (
                  <div className="mt-4">
                    <Alert>
                      <AlertDescription>
                        ✅ 成功处理 {pageNumberResult.succeeded} 个文件，失败 {pageNumberResult.failed} 个
                      </AlertDescription>
                    </Alert>
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
