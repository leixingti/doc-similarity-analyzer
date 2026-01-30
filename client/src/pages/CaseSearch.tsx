import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  FileText, 
  Scale,
  TrendingUp,
  Calendar,
  Building,
  Users,
  Download,
  Eye,
  Lightbulb,
  BookOpen,
  Filter
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function CaseSearch() {
  useAuth();
  const [activeTab, setActiveTab] = useState("search");
  const [searchQuery, setSearchQuery] = useState({
    keywords: "",
    caseType: "",
    caseName: "",
    court: "",
    dateStart: "",
    dateEnd: "",
  });

  // 模拟案例数据
  const mockCases = [
    {
      id: '1',
      caseNumber: '(2023)京0105民初12345号',
      caseName: '买卖合同纠纷',
      court: '北京市朝阳区人民法院',
      caseType: 'civil',
      judgmentDate: '2023-06-15',
      parties: {
        plaintiff: ['张三'],
        defendant: ['李四'],
      },
      judgment: '被告李四于本判决生效之日起十日内向原告张三支付货款50万元及违约金5万元。',
      legalBasis: ['《中华人民共和国民法典》第509条', '《中华人民共和国民法典》第577条'],
      keywords: ['买卖合同', '违约', '货款', '违约金'],
      similarity: 95,
    },
    {
      id: '2',
      caseNumber: '(2023)京0108民初23456号',
      caseName: '买卖合同纠纷',
      court: '北京市海淀区人民法院',
      caseType: 'civil',
      judgmentDate: '2023-08-20',
      parties: {
        plaintiff: ['王五'],
        defendant: ['赵六'],
      },
      judgment: '被告赵六于本判决生效之日起十日内向原告王五支付货款80万元及违约金10万元。',
      legalBasis: ['《中华人民共和国民法典》第509条', '《中华人民共和国民法典》第577条'],
      keywords: ['买卖合同', '违约', '定金', '设备'],
      similarity: 88,
    },
  ];

  const [searchResults, setSearchResults] = useState(mockCases);
  const [selectedCase, setSelectedCase] = useState<any>(null);

  const getCaseTypeName = (type: string) => {
    const names: Record<string, string> = {
      civil: '民事',
      criminal: '刑事',
      administrative: '行政',
      enforcement: '执行',
      national_compensation: '国家赔偿',
    };
    return names[type] || type;
  };

  const handleSearch = () => {
    toast.success("搜索完成！");
    // 实际应用中这里会调用后端API
  };

  const handleExtractElements = () => {
    toast.success("案例要素提取完成！");
  };

  const handleGenerateOpinion = () => {
    toast.success("法律意见生成完成！");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Scale className="h-8 w-8 text-primary" />
            案例检索系统
          </h1>
          <p className="text-muted-foreground mt-1">
            智能检索法律案例，生成专业法律意见
          </p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">案例总数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              覆盖多个领域
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">检索次数</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">
              本月检索
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">法律意见</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              已生成意见
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均相似度</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">
              匹配准确率
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">案例检索</TabsTrigger>
          <TabsTrigger value="extract">要素提取</TabsTrigger>
          <TabsTrigger value="similar">相似推荐</TabsTrigger>
          <TabsTrigger value="opinion">法律意见</TabsTrigger>
        </TabsList>

        {/* 案例检索 */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>检索条件</CardTitle>
              <CardDescription>
                输入检索条件，查找相关法律案例
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>关键词</Label>
                  <Input
                    placeholder="输入关键词，多个关键词用空格分隔"
                    value={searchQuery.keywords}
                    onChange={(e) => setSearchQuery({ ...searchQuery, keywords: e.target.value })}
                  />
                </div>

                <div>
                  <Label>案件类型</Label>
                  <Select
                    value={searchQuery.caseType}
                    onValueChange={(value) => setSearchQuery({ ...searchQuery, caseType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择案件类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="civil">民事</SelectItem>
                      <SelectItem value="criminal">刑事</SelectItem>
                      <SelectItem value="administrative">行政</SelectItem>
                      <SelectItem value="enforcement">执行</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>案由</Label>
                  <Input
                    placeholder="例如：买卖合同纠纷"
                    value={searchQuery.caseName}
                    onChange={(e) => setSearchQuery({ ...searchQuery, caseName: e.target.value })}
                  />
                </div>

                <div>
                  <Label>审理法院</Label>
                  <Input
                    placeholder="例如：北京市朝阳区人民法院"
                    value={searchQuery.court}
                    onChange={(e) => setSearchQuery({ ...searchQuery, court: e.target.value })}
                  />
                </div>

                <div>
                  <Label>判决日期（开始）</Label>
                  <Input
                    type="date"
                    value={searchQuery.dateStart}
                    onChange={(e) => setSearchQuery({ ...searchQuery, dateStart: e.target.value })}
                  />
                </div>

                <div>
                  <Label>判决日期（结束）</Label>
                  <Input
                    type="date"
                    value={searchQuery.dateEnd}
                    onChange={(e) => setSearchQuery({ ...searchQuery, dateEnd: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSearch} className="flex-1">
                  <Search className="mr-2 h-4 w-4" />
                  开始检索
                </Button>
                <Button variant="outline" onClick={() => setSearchQuery({
                  keywords: "",
                  caseType: "",
                  caseName: "",
                  court: "",
                  dateStart: "",
                  dateEnd: "",
                })}>
                  <Filter className="mr-2 h-4 w-4" />
                  重置条件
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 检索结果 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>检索结果</CardTitle>
                  <CardDescription>
                    找到 {searchResults.length} 个相关案例
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  导出结果
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searchResults.map((caseItem) => (
                  <div
                    key={caseItem.id}
                    className="p-4 border rounded-lg hover:bg-accent cursor-pointer space-y-3"
                    onClick={() => setSelectedCase(caseItem)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-lg">{caseItem.caseName}</h3>
                          <Badge variant="outline">
                            {getCaseTypeName(caseItem.caseType)}
                          </Badge>
                          <Badge className="bg-green-100 text-green-700">
                            相似度 {caseItem.similarity}%
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {caseItem.caseNumber}
                            </span>
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {caseItem.court}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {caseItem.judgmentDate}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            原告：{caseItem.parties.plaintiff.join('、')} vs 被告：{caseItem.parties.defendant.join('、')}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-sm">
                      <div className="font-medium mb-1">判决结果：</div>
                      <div className="text-muted-foreground line-clamp-2">
                        {caseItem.judgment}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {caseItem.keywords.map((keyword, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <div className="font-medium mb-1">法律依据：</div>
                      <div>{caseItem.legalBasis.join('、')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 要素提取 */}
        <TabsContent value="extract" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>案例要素提取</CardTitle>
              <CardDescription>
                输入案例文本，自动提取关键要素
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>案例文本</Label>
                <Textarea
                  placeholder="粘贴或输入案例全文..."
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              <Button onClick={handleExtractElements} className="w-full">
                <BookOpen className="mr-2 h-4 w-4" />
                提取要素
              </Button>

              {/* 提取结果 */}
              <div className="p-4 border rounded-lg space-y-4">
                <div>
                  <div className="font-medium mb-2">案件类型</div>
                  <Badge>民事</Badge>
                </div>

                <div>
                  <div className="font-medium mb-2">案由</div>
                  <div className="text-sm">买卖合同纠纷</div>
                </div>

                <div>
                  <div className="font-medium mb-2">当事人</div>
                  <div className="text-sm space-y-1">
                    <div>原告：张三</div>
                    <div>被告：李四</div>
                  </div>
                </div>

                <div>
                  <div className="font-medium mb-2">争议焦点</div>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    <li>被告是否应支付货款</li>
                    <li>违约金的计算标准</li>
                  </ul>
                </div>

                <div>
                  <div className="font-medium mb-2">适用法律</div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">《民法典》第509条</Badge>
                    <Badge variant="outline">《民法典》第577条</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 相似推荐 */}
        <TabsContent value="similar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>相似案例推荐</CardTitle>
              <CardDescription>
                基于案例要素，智能推荐相似案例
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                请先在"要素提取"标签页提取案例要素
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 法律意见 */}
        <TabsContent value="opinion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>法律意见生成</CardTitle>
              <CardDescription>
                基于相似案例，生成专业法律意见
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>案例描述</Label>
                <Textarea
                  placeholder="简要描述您的案例情况..."
                  rows={5}
                />
              </div>

              <Button onClick={handleGenerateOpinion} className="w-full">
                <Lightbulb className="mr-2 h-4 w-4" />
                生成法律意见
              </Button>

              {/* 生成的法律意见 */}
              <div className="p-4 border rounded-lg space-y-4">
                <div>
                  <div className="font-medium mb-2">事实对比</div>
                  <div className="text-sm text-muted-foreground">
                    本案与检索到的2个相似案例在事实方面高度相似...
                  </div>
                </div>

                <div>
                  <div className="font-medium mb-2">法律分析</div>
                  <div className="text-sm text-muted-foreground">
                    根据《民法典》第509条和第577条的规定...
                  </div>
                </div>

                <div>
                  <div className="font-medium mb-2">风险评估</div>
                  <div className="text-sm text-muted-foreground">
                    根据相似案例分析，原告胜诉率约90%...
                  </div>
                </div>

                <div>
                  <div className="font-medium mb-2">建议</div>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>补充收集相关证据材料</li>
                    <li>重点关注法院的裁判要点</li>
                    <li>准备针对常见抗辩的应对方案</li>
                  </ul>
                </div>

                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  导出法律意见书
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 案例详情对话框 */}
      {selectedCase && (
        <Dialog open={!!selectedCase} onOpenChange={() => setSelectedCase(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedCase.caseName}</DialogTitle>
              <DialogDescription>
                {selectedCase.caseNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">案件类型：</span>
                  {getCaseTypeName(selectedCase.caseType)}
                </div>
                <div>
                  <span className="font-medium">审理法院：</span>
                  {selectedCase.court}
                </div>
                <div>
                  <span className="font-medium">判决日期：</span>
                  {selectedCase.judgmentDate}
                </div>
                <div>
                  <span className="font-medium">相似度：</span>
                  {selectedCase.similarity}%
                </div>
              </div>

              <div>
                <div className="font-medium mb-2">当事人</div>
                <div className="text-sm space-y-1">
                  <div>原告：{selectedCase.parties.plaintiff.join('、')}</div>
                  <div>被告：{selectedCase.parties.defendant.join('、')}</div>
                </div>
              </div>

              <div>
                <div className="font-medium mb-2">判决结果</div>
                <div className="text-sm">{selectedCase.judgment}</div>
              </div>

              <div>
                <div className="font-medium mb-2">法律依据</div>
                <div className="flex flex-wrap gap-2">
                  {selectedCase.legalBasis.map((law: string, idx: number) => (
                    <Badge key={idx} variant="outline">{law}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-medium mb-2">关键词</div>
                <div className="flex flex-wrap gap-2">
                  {selectedCase.keywords.map((keyword: string, idx: number) => (
                    <Badge key={idx} variant="secondary">{keyword}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
