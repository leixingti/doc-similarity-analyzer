import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { FileText, ArrowLeft, AlertCircle, CheckCircle2, XCircle, AlertTriangle, Upload } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export default function ContractReview() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [contractType, setContractType] = useState<string>('commercial');
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<any>(null);

  // 获取用户的所有文档
  const { data: documents } = trpc.documents.list.useQuery(undefined, {
    enabled: !!user,
  });

  // 合同审核mutation
  const reviewMutation = trpc.contract.review.useMutation({
    onSuccess: (data) => {
      setReviewResult(data);
      setReviewing(false);
      toast.success("合同审核完成");
    },
    onError: (error) => {
      setReviewing(false);
      toast.error(`审核失败: ${error.message}`);
    },
  });

  const handleReview = async () => {
    if (!selectedDocumentId) {
      toast.error("请选择要审核的文档");
      return;
    }

    setReviewing(true);
    setReviewResult(null);

    reviewMutation.mutate({
      documentId: selectedDocumentId,
      contractType,
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
            <CardDescription>请先登录以使用合同审核功能</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")}>返回首页</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contractTypes = [
    { value: 'commercial', label: '商事合同', description: '买卖、服务、合作等商业合同' },
    { value: 'labor', label: '劳动合同', description: '劳动关系相关合同' },
    { value: 'real_estate', label: '房地产合同', description: '房屋买卖、租赁等合同' },
    { value: 'financial', label: '金融合同', description: '借款、担保、投资等合同' },
    { value: 'internet', label: '互联网合同', description: '软件、平台、数据服务合同' },
    { value: 'manufacturing', label: '制造业合同', description: '生产、加工、采购合同' },
    { value: 'construction', label: '建筑工程合同', description: '工程承包、施工合同' },
    { value: 'ip', label: '知识产权合同', description: '专利、商标、版权合同' },
    { value: 'service', label: '劳务合同', description: '劳务派遣、外包合同' },
    { value: 'general_service', label: '服务合同', description: '咨询、培训等服务合同' },
  ];

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
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">合同智能审核</h1>
              <p className="text-muted-foreground">
                基于10个行业模板的专业合同审核系统
              </p>
            </div>
          </div>
        </div>

        {/* 功能说明 */}
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>审核功能：</strong>
            必备条款检测、模糊表述识别、风险条款标注、条款冲突检测、合规性检查、优化建议
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：选择区域 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>审核设置</CardTitle>
                <CardDescription>选择文档和合同类型</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 文档选择 */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    选择文档
                  </label>
                  <Select
                    value={selectedDocumentId?.toString()}
                    onValueChange={(value) => setSelectedDocumentId(parseInt(value))}
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
                  {(!documents || documents.length === 0) && (
                    <p className="text-xs text-muted-foreground mt-2">
                      请先上传文档
                    </p>
                  )}
                </div>

                {/* 合同类型选择 */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    合同类型
                  </label>
                  <Select value={contractType} onValueChange={setContractType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contractTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {type.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    选择正确的合同类型可以获得更精准的审核结果
                  </p>
                </div>

                {/* 开始审核按钮 */}
                <Button
                  onClick={handleReview}
                  disabled={!selectedDocumentId || reviewing}
                  className="w-full"
                >
                  {reviewing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      审核中...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      开始审核
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* 合同类型说明 */}
            {contractType && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-base">
                    {contractTypes.find(t => t.value === contractType)?.label}
                  </CardTitle>
                  <CardDescription>
                    {contractTypes.find(t => t.value === contractType)?.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>

          {/* 右侧：审核结果 */}
          <div className="lg:col-span-2">
            {!reviewResult && !reviewing && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    选择文档和合同类型，点击"开始审核"查看结果
                  </p>
                </CardContent>
              </Card>
            )}

            {reviewing && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">正在审核合同...</p>
                </CardContent>
              </Card>
            )}

            {reviewResult && (
              <div className="space-y-6">
                {/* 总体评分 */}
                <Card>
                  <CardHeader>
                    <CardTitle>审核评分</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <div className={`text-6xl font-bold ${
                          reviewResult.overallScore >= 80 ? 'text-green-600' :
                          reviewResult.overallScore >= 60 ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
                          {reviewResult.overallScore}
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                          总分100分
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 必备条款检测 */}
                <Card>
                  <CardHeader>
                    <CardTitle>必备条款检测</CardTitle>
                    <CardDescription>
                      检查合同是否包含该类型的所有必备条款
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {reviewResult.missingClauses.length === 0 ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>所有必备条款均已包含</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-red-600 mb-3">
                          <XCircle className="h-5 w-5" />
                          <span>缺失 {reviewResult.missingClauses.length} 个必备条款</span>
                        </div>
                        <div className="space-y-2">
                          {reviewResult.missingClauses.map((clause: string, index: number) => (
                            <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm font-medium text-red-900">❌ {clause}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* 模糊表述 */}
                {reviewResult.ambiguousTerms.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>模糊表述</CardTitle>
                      <CardDescription>
                        发现 {reviewResult.ambiguousTerms.length} 处模糊表述
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {reviewResult.ambiguousTerms.map((term: any, index: number) => (
                        <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-sm font-medium mb-1">"{term.term}"</p>
                          <p className="text-xs text-muted-foreground mb-2">
                            类型：{term.type}
                          </p>
                          <p className="text-xs text-orange-600">
                            💡 建议：{term.suggestion}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* 风险条款 */}
                {reviewResult.riskClauses.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>风险条款</CardTitle>
                      <CardDescription>
                        发现 {reviewResult.riskClauses.length} 个风险条款
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {reviewResult.riskClauses.map((clause: any, index: number) => (
                        <div key={index} className={`p-3 rounded-lg border ${
                          clause.level === 'high' ? 'bg-red-50 border-red-200' :
                          clause.level === 'medium' ? 'bg-orange-50 border-orange-200' :
                          'bg-yellow-50 border-yellow-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              clause.level === 'high' ? 'bg-red-100 text-red-700' :
                              clause.level === 'medium' ? 'bg-orange-100 text-orange-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {clause.level === 'high' ? '高风险' :
                               clause.level === 'medium' ? '中风险' : '低风险'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {clause.type}
                            </span>
                          </div>
                          <p className="text-sm font-medium mb-1">{clause.clause}</p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {clause.description}
                          </p>
                          <p className="text-xs text-orange-600">
                            💡 建议：{clause.suggestion}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* 条款冲突 */}
                {reviewResult.conflicts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>条款冲突</CardTitle>
                      <CardDescription>
                        发现 {reviewResult.conflicts.length} 处条款冲突
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {reviewResult.conflicts.map((conflict: any, index: number) => (
                        <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium mb-2">冲突 {index + 1}</p>
                          <div className="space-y-1 mb-2">
                            <p className="text-xs">
                              <span className="font-medium">条款A：</span>{conflict.clause1}
                            </p>
                            <p className="text-xs">
                              <span className="font-medium">条款B：</span>{conflict.clause2}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {conflict.description}
                          </p>
                          <p className="text-xs text-orange-600">
                            💡 建议：{conflict.suggestion}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* 合规问题 */}
                {reviewResult.complianceIssues.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>合规问题</CardTitle>
                      <CardDescription>
                        发现 {reviewResult.complianceIssues.length} 个合规问题
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {reviewResult.complianceIssues.map((issue: any, index: number) => (
                        <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium mb-1">{issue.clause}</p>
                          <p className="text-xs text-muted-foreground mb-2">
                            <span className="font-medium">法律依据：</span>{issue.legalBasis}
                          </p>
                          <p className="text-xs text-red-600 mb-2">
                            ⚠️ {issue.issue}
                          </p>
                          <p className="text-xs text-orange-600">
                            💡 建议：{issue.suggestion}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* 优化建议 */}
                {reviewResult.suggestions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>优化建议</CardTitle>
                      <CardDescription>
                        {reviewResult.suggestions.length} 条优化建议
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {reviewResult.suggestions.map((suggestion: string, index: number) => (
                        <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm">💡 {suggestion}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
