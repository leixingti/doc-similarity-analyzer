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
  Sparkles, 
  FileText, 
  AlertTriangle,
  MessageSquare,
  FileSearch,
  Download,
  Copy,
  Loader2
, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function AIAssistant() {
  useAuth();
  const [activeTab, setActiveTab] = useState("clause");
  const [loading, setLoading] = useState(false);

  // 条款生成
  const [clauseForm, setClauseForm] = useState({
    contractType: "",
    clauseType: "",
  });
  const [generatedClause, setGeneratedClause] = useState<any>(null);

  // 风险预测
  const [riskForm, setRiskForm] = useState({
    documentType: "",
    content: "",
  });
  const [riskPrediction, setRiskPrediction] = useState<any>(null);

  // 法律问答
  const [question, setQuestion] = useState("");
  const [qaResult, setQAResult] = useState<any>(null);

  // 文档摘要
  const [summaryForm, setSummaryForm] = useState({
    title: "",
    content: "",
    documentType: "",
  });
  const [summary, setSummary] = useState<any>(null);

  const handleGenerateClause = async () => {
    if (!clauseForm.contractType || !clauseForm.clauseType) {
      toast.error("请选择合同类型和条款类型");
      return;
    }

    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setGeneratedClause({
        title: `${clauseForm.clauseType}条款`,
        content: `一、任何一方违反本合同约定，应当承担违约责任。\n\n二、违约方应当赔偿守约方因此遭受的损失，包括但不限于直接损失、间接损失、合理的律师费、诉讼费等。\n\n三、如一方延迟履行合同义务，每延迟一日，应按照合同总金额的0.5%向守约方支付违约金，但违约金总额不超过合同总金额的20%。`,
        category: "违约与救济",
        riskLevel: "medium",
        suggestions: [
          "建议明确具体的违约情形",
          "违约金比例可根据实际情况调整",
          "建议增加争议解决条款",
        ],
      });
      
      toast.success("条款生成成功！");
    } catch (error) {
      toast.error("生成失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handlePredictRisk = async () => {
    if (!riskForm.content) {
      toast.error("请输入文档内容");
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setRiskPrediction({
        riskLevel: "medium",
        score: 65,
        riskFactors: [
          {
            factor: "缺少违约责任条款",
            severity: "high",
            description: "合同中未明确约定违约责任，可能导致违约后难以追究责任",
            mitigation: "建议增加详细的违约责任条款，明确违约情形和违约金计算方式",
          },
          {
            factor: "缺少争议解决条款",
            severity: "medium",
            description: "未约定争议解决方式和管辖法院，可能导致诉讼不便",
            mitigation: "建议增加争议解决条款，明确管辖法院或仲裁机构",
          },
        ],
        recommendations: [
          "建议完善合同条款，补充缺失的重要条款",
          "建议由专业律师审查合同",
          "建议保留合同签订和履行的相关证据",
        ],
      });
      
      toast.success("风险分析完成！");
    } catch (error) {
      toast.error("分析失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question) {
      toast.error("请输入问题");
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setQAResult({
        question,
        answer: "根据《中华人民共和国民法典》第585条的规定，约定的违约金低于造成的损失的，人民法院或者仲裁机构可以根据当事人的请求予以增加；约定的违约金过分高于造成的损失的，人民法院或者仲裁机构可以根据当事人的请求予以适当减少。\n\n司法实践中，一般认为违约金超过实际损失的30%即可认定为'过分高于造成的损失'。",
        references: [
          "《中华人民共和国民法典》第585条",
          "《最高人民法院关于适用<中华人民共和国合同法>若干问题的解释(二)》第29条",
        ],
        relatedQuestions: [
          "违约金和损失赔偿可以同时主张吗？",
          "如何计算实际损失？",
        ],
        confidence: 0.95,
      });
      
      toast.success("回答生成完成！");
    } catch (error) {
      toast.error("回答失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!summaryForm.content) {
      toast.error("请输入文档内容");
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSummary({
        title: summaryForm.title || "文档摘要",
        summary: "本文档为法律合同，涉及甲方和乙方之间的买卖关系。合同约定了双方的权利义务、违约责任等内容。文档共计1234字。",
        keyPoints: [
          "甲方向乙方出售货物，总价款50万元",
          "乙方应在合同签订后10日内支付定金",
          "货物应在合同签订后30日内交付",
          "违约方应支付违约金",
        ],
        parties: ["甲方：张三", "乙方：李四"],
        dates: ["2024年1月30日"],
        amounts: ["50万元", "10万元"],
        wordCount: 1234,
      });
      
      toast.success("摘要生成完成！");
    } catch (error) {
      toast.error("生成失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (level: string) => {
    const config: Record<string, { label: string; className: string }> = {
      low: { label: "低风险", className: "bg-green-100 text-green-700" },
      medium: { label: "中风险", className: "bg-yellow-100 text-yellow-700" },
      high: { label: "高风险", className: "bg-orange-100 text-orange-700" },
      critical: { label: "极高风险", className: "bg-red-100 text-red-700" },
    };
    const { label, className } = config[level] || config.medium;
    return <Badge className={className}>{label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 返回按钮 */}
      <Button variant="ghost" onClick={() => window.location.href = '/dashboard'}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回首页
      </Button>
      
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI智能助手
          </h1>
          <p className="text-muted-foreground mt-1">
            AI驱动的法律文书智能生成和分析工具
          </p>
        </div>
      </div>

      {/* 功能卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-accent" onClick={() => setActiveTab("clause")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">条款生成</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              智能生成合同条款
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent" onClick={() => setActiveTab("risk")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">风险预测</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              深度分析法律风险
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent" onClick={() => setActiveTab("qa")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">法律问答</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              智能回答法律问题
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent" onClick={() => setActiveTab("summary")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">文档摘要</CardTitle>
            <FileSearch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              自动生成文档摘要
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="clause">条款生成</TabsTrigger>
          <TabsTrigger value="risk">风险预测</TabsTrigger>
          <TabsTrigger value="qa">法律问答</TabsTrigger>
          <TabsTrigger value="summary">文档摘要</TabsTrigger>
        </TabsList>

        {/* 条款生成 */}
        <TabsContent value="clause" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>智能生成合同条款</CardTitle>
              <CardDescription>
                基于AI技术，自动生成专业的合同条款
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>合同类型</Label>
                  <Select
                    value={clauseForm.contractType}
                    onValueChange={(value) => setClauseForm({ ...clauseForm, contractType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择合同类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="买卖合同">买卖合同</SelectItem>
                      <SelectItem value="服务合同">服务合同</SelectItem>
                      <SelectItem value="租赁合同">租赁合同</SelectItem>
                      <SelectItem value="技术合同">技术合同</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>条款类型</Label>
                  <Select
                    value={clauseForm.clauseType}
                    onValueChange={(value) => setClauseForm({ ...clauseForm, clauseType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择条款类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="违约责任">违约责任</SelectItem>
                      <SelectItem value="保密条款">保密条款</SelectItem>
                      <SelectItem value="争议解决">争议解决</SelectItem>
                      <SelectItem value="知识产权">知识产权</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleGenerateClause} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    生成条款
                  </>
                )}
              </Button>

              {generatedClause && (
                <div className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-lg">{generatedClause.title}</h3>
                    <div className="flex gap-2">
                      {getRiskBadge(generatedClause.riskLevel)}
                      <Button variant="ghost" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm whitespace-pre-wrap bg-muted p-4 rounded">
                    {generatedClause.content}
                  </div>

                  <div>
                    <div className="font-medium mb-2">优化建议</div>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      {generatedClause.suggestions.map((suggestion: string, idx: number) => (
                        <li key={idx}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>

                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    导出条款
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 风险预测 */}
        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>法律风险深度预测</CardTitle>
              <CardDescription>
                AI分析文档内容，预测潜在法律风险
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>文档类型</Label>
                <Select
                  value={riskForm.documentType}
                  onValueChange={(value) => setRiskForm({ ...riskForm, documentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择文档类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="合同">合同</SelectItem>
                    <SelectItem value="协议">协议</SelectItem>
                    <SelectItem value="章程">章程</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>文档内容</Label>
                <Textarea
                  placeholder="粘贴或输入文档内容..."
                  rows={8}
                  value={riskForm.content}
                  onChange={(e) => setRiskForm({ ...riskForm, content: e.target.value })}
                />
              </div>

              <Button onClick={handlePredictRisk} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    开始分析
                  </>
                )}
              </Button>

              {riskPrediction && (
                <div className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-lg">风险评估结果</h3>
                    {getRiskBadge(riskPrediction.riskLevel)}
                  </div>

                  <div className="p-4 bg-muted rounded">
                    <div className="text-sm text-muted-foreground mb-1">风险评分</div>
                    <div className="text-3xl font-bold">{riskPrediction.score}/100</div>
                  </div>

                  <div>
                    <div className="font-medium mb-2">风险因素</div>
                    <div className="space-y-3">
                      {riskPrediction.riskFactors.map((factor: any, idx: number) => (
                        <div key={idx} className="p-3 border rounded">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{factor.factor}</span>
                            {getRiskBadge(factor.severity)}
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {factor.description}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">建议：</span>
                            {factor.mitigation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="font-medium mb-2">优化建议</div>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      {riskPrediction.recommendations.map((rec: string, idx: number) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 法律问答 */}
        <TabsContent value="qa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>智能法律问答</CardTitle>
              <CardDescription>
                AI回答您的法律问题
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>您的问题</Label>
                <Textarea
                  placeholder="输入您的法律问题..."
                  rows={4}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </div>

              <Button onClick={handleAskQuestion} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    思考中...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    获取回答
                  </>
                )}
              </Button>

              {qaResult && (
                <div className="p-4 border rounded-lg space-y-4">
                  <div>
                    <div className="font-medium mb-2">问题</div>
                    <div className="text-sm">{qaResult.question}</div>
                  </div>

                  <div>
                    <div className="font-medium mb-2">回答</div>
                    <div className="text-sm whitespace-pre-wrap bg-muted p-4 rounded">
                      {qaResult.answer}
                    </div>
                  </div>

                  <div>
                    <div className="font-medium mb-2">法律依据</div>
                    <div className="flex flex-wrap gap-2">
                      {qaResult.references.map((ref: string, idx: number) => (
                        <Badge key={idx} variant="outline">{ref}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="font-medium mb-2">相关问题</div>
                    <div className="space-y-2">
                      {qaResult.relatedQuestions.map((q: string, idx: number) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left"
                          onClick={() => setQuestion(q)}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    置信度：{(qaResult.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 文档摘要 */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>文档自动摘要</CardTitle>
              <CardDescription>
                AI提取文档关键信息，生成摘要
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>文档标题</Label>
                <Input
                  placeholder="输入文档标题"
                  value={summaryForm.title}
                  onChange={(e) => setSummaryForm({ ...summaryForm, title: e.target.value })}
                />
              </div>

              <div>
                <Label>文档类型</Label>
                <Select
                  value={summaryForm.documentType}
                  onValueChange={(value) => setSummaryForm({ ...summaryForm, documentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择文档类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="合同">合同</SelectItem>
                    <SelectItem value="判决书">判决书</SelectItem>
                    <SelectItem value="法律意见">法律意见</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>文档内容</Label>
                <Textarea
                  placeholder="粘贴或输入文档内容..."
                  rows={8}
                  value={summaryForm.content}
                  onChange={(e) => setSummaryForm({ ...summaryForm, content: e.target.value })}
                />
              </div>

              <Button onClick={handleGenerateSummary} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <FileSearch className="mr-2 h-4 w-4" />
                    生成摘要
                  </>
                )}
              </Button>

              {summary && (
                <div className="p-4 border rounded-lg space-y-4">
                  <div>
                    <div className="font-medium mb-2">文档摘要</div>
                    <div className="text-sm bg-muted p-4 rounded">
                      {summary.summary}
                    </div>
                  </div>

                  <div>
                    <div className="font-medium mb-2">关键要点</div>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      {summary.keyPoints.map((point: string, idx: number) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium mb-2">当事人</div>
                      <div className="text-sm space-y-1">
                        {summary.parties.map((party: string, idx: number) => (
                          <div key={idx}>{party}</div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="font-medium mb-2">涉及金额</div>
                      <div className="text-sm space-y-1">
                        {summary.amounts.map((amount: string, idx: number) => (
                          <div key={idx}>{amount}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    文档字数：{summary.wordCount}
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
