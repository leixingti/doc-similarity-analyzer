import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { FileText, Download, Upload, Eye, AlertCircle, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { Textarea } from '../components/ui/textarea';

export default function DocumentGeneration() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'excel' | 'csv'>('excel');
  const [previewData, setPreviewData] = useState<any>({});
  const [previewResult, setPreviewResult] = useState<string>('');
  const [importStats, setImportStats] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  // 获取所有模板
  const { data: templates = [] } = trpc.templates.list.useQuery();
  
  // 获取所有分类
  const { data: categories = [] } = trpc.templates.getCategories.useQuery();
  
  // 获取模板详情
  const { data: templateDetail } = trpc.templates.getById.useQuery(
    { templateId: selectedTemplate },
    { enabled: !!selectedTemplate }
  );

  // 生成导入模板
  const generateImportTemplate = trpc.templates.generateImportTemplate.useMutation({
    onSuccess: (data) => {
      // 下载文件
      const blob = new Blob([Buffer.from(data.buffer, 'base64')], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  });

  // 预览生成结果
  const previewMutation = trpc.templates.preview.useQuery(
    { templateId: selectedTemplate, data: previewData },
    { enabled: false }
  );

  // 批量生成文书
  const batchGenerate = trpc.templates.batchGenerate.useMutation({
    onSuccess: (data) => {
      setGenerating(false);
      // 下载ZIP文件
      const blob = new Blob([Buffer.from(data.buffer, 'base64')], {
        type: 'application/zip'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      
      alert(`成功生成${data.count}份文书！`);
    },
    onError: (error) => {
      setGenerating(false);
      alert(`生成失败：${error.message}`);
    }
  });

  // 获取导入统计
  const getStatsMutation = trpc.templates.getImportStats.useQuery(
    {
      templateId: selectedTemplate,
      fileType: fileType,
      fileContent: ''
    },
    { enabled: false }
  );

  // 过滤模板
  const filteredTemplates = templates.filter(t => {
    if (selectedCategory !== 'all' && t.category !== selectedCategory) {
      return false;
    }
    if (searchKeyword && !t.name.includes(searchKeyword) && !t.description.includes(searchKeyword)) {
      return false;
    }
    return true;
  });

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);

    // 读取文件并获取统计
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const content = base64.split(',')[1];

      try {
        const stats = await getStatsMutation.refetch({
          templateId: selectedTemplate,
          fileType: fileType,
          fileContent: content
        });
        setImportStats(stats.data);
      } catch (error: any) {
        alert(`文件解析失败：${error.message}`);
      }
    };
    reader.readAsDataURL(file);
  };

  // 处理批量生成
  const handleBatchGenerate = async () => {
    if (!uploadedFile || !selectedTemplate) return;

    setGenerating(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const content = base64.split(',')[1];

      try {
        await batchGenerate.mutateAsync({
          templateId: selectedTemplate,
          fileType: fileType,
          fileContent: content
        });
      } catch (error) {
        console.error('批量生成失败:', error);
      }
    };
    reader.readAsDataURL(uploadedFile);
  };

  // 处理预览
  const handlePreview = async () => {
    if (!selectedTemplate) return;

    try {
      const result = await previewMutation.refetch({
        templateId: selectedTemplate,
        data: previewData
      });
      setPreviewResult(result.data || '');
    } catch (error: any) {
      alert(`预览失败：${error.message}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">文书批量生成</h1>
          <p className="text-muted-foreground mt-2">
            选择模板，导入数据，批量生成法律文书
          </p>
        </div>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="generate">
            <FileText className="w-4 h-4 mr-2" />
            批量生成
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="w-4 h-4 mr-2" />
            预览测试
          </TabsTrigger>
        </TabsList>

        {/* 批量生成标签页 */}
        <TabsContent value="generate" className="space-y-6">
          {/* 模板选择 */}
          <Card>
            <CardHeader>
              <CardTitle>1. 选择文书模板</CardTitle>
              <CardDescription>
                从{templates.length}个模板中选择需要生成的文书类型
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 搜索和筛选 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>分类筛选</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部分类</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>搜索模板</Label>
                  <Input
                    placeholder="输入关键词搜索..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                </div>
              </div>

              {/* 模板列表 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map(template => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all ${
                      selectedTemplate === template.id
                        ? 'border-primary border-2'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {template.name}
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        分类：{template.category}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        变量数：{template.variables.length}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    没有找到匹配的模板，请调整筛选条件
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* 模板详情 */}
          {templateDetail && (
            <Card>
              <CardHeader>
                <CardTitle>模板详情：{templateDetail.name}</CardTitle>
                <CardDescription>{templateDetail.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>必填变量（{templateDetail.variables.length}个）</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {templateDetail.variables.map(v => (
                      <span key={v} className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <Button
                    onClick={() => generateImportTemplate.mutate({ templateId: selectedTemplate })}
                    disabled={generateImportTemplate.isPending}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    下载导入模板
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    下载Excel模板，填写数据后上传进行批量生成
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 数据导入 */}
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>2. 导入数据文件</CardTitle>
                <CardDescription>
                  上传填写好的Excel或CSV文件
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>文件类型</Label>
                  <Select value={fileType} onValueChange={(v: 'excel' | 'csv') => setFileType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                      <SelectItem value="csv">CSV (.csv)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>选择文件</Label>
                  <Input
                    type="file"
                    accept={fileType === 'excel' ? '.xlsx,.xls' : '.csv'}
                    onChange={handleFileUpload}
                  />
                </div>

                {importStats && (
                  <Alert className={importStats.invalidRows > 0 ? 'border-destructive' : 'border-green-500'}>
                    {importStats.invalidRows > 0 ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    <AlertDescription>
                      <div className="space-y-1">
                        <div>总行数：{importStats.totalRows}</div>
                        <div className="text-green-600">有效行数：{importStats.validRows}</div>
                        {importStats.invalidRows > 0 && (
                          <>
                            <div className="text-destructive">无效行数：{importStats.invalidRows}</div>
                            <div className="mt-2 text-sm">
                              <div className="font-semibold">错误详情：</div>
                              <ul className="list-disc list-inside">
                                {importStats.errors.slice(0, 5).map((err: string, i: number) => (
                                  <li key={i}>{err}</li>
                                ))}
                                {importStats.errors.length > 5 && (
                                  <li>...还有{importStats.errors.length - 5}个错误</li>
                                )}
                              </ul>
                            </div>
                          </>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* 批量生成 */}
          {uploadedFile && importStats && importStats.validRows > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>3. 批量生成文书</CardTitle>
                <CardDescription>
                  将生成{importStats.validRows}份文书，打包为ZIP文件下载
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleBatchGenerate}
                  disabled={generating}
                  size="lg"
                  className="w-full"
                >
                  {generating ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      生成中...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      开始批量生成
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 预览测试标签页 */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>预览测试</CardTitle>
              <CardDescription>
                手动输入数据，预览生成结果
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 选择模板 */}
              <div>
                <Label>选择模板</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择模板..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 输入数据 */}
              {templateDetail && (
                <div>
                  <Label>输入数据（JSON格式）</Label>
                  <Textarea
                    rows={10}
                    placeholder={`{\n  "${templateDetail.variables[0]}": "示例值",\n  "${templateDetail.variables[1]}": "示例值"\n}`}
                    value={JSON.stringify(previewData, null, 2)}
                    onChange={(e) => {
                      try {
                        setPreviewData(JSON.parse(e.target.value));
                      } catch (error) {
                        // 忽略JSON解析错误
                      }
                    }}
                  />
                </div>
              )}

              {/* 预览按钮 */}
              <Button onClick={handlePreview} disabled={!selectedTemplate}>
                <Eye className="w-4 h-4 mr-2" />
                预览生成结果
              </Button>

              {/* 预览结果 */}
              {previewResult && (
                <div>
                  <Label>预览结果</Label>
                  <div className="mt-2 p-4 border rounded-lg bg-muted whitespace-pre-wrap">
                    {previewResult}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
