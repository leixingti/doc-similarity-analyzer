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
  Shield, 
  Plus, 
  FileText, 
  Link as LinkIcon,
  Download,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  XCircle,
  Tag
, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

// 证据类型
const EVIDENCE_TYPES = [
  { value: 'documentary', label: '书证' },
  { value: 'physical', label: '物证' },
  { value: 'audio_visual', label: '视听资料' },
  { value: 'electronic', label: '电子数据' },
  { value: 'witness', label: '证人证言' },
  { value: 'statement', label: '当事人陈述' },
  { value: 'appraisal', label: '鉴定意见' },
  { value: 'inspection', label: '勘验笔录' },
  { value: 'other', label: '其他' },
];

// 证据类别
const EVIDENCE_CATEGORIES = [
  { value: 'contract', label: '合同类' },
  { value: 'financial', label: '财务类' },
  { value: 'communication', label: '通讯类' },
  { value: 'identity', label: '身份类' },
  { value: 'property', label: '财产类' },
  { value: 'behavior', label: '行为类' },
  { value: 'other', label: '其他' },
];

export default function EvidenceManagement() {
  useAuth();
  const [activeTab, setActiveTab] = useState("list");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 模拟证据数据
  const mockEvidences = [
    {
      id: '1',
      name: '购销合同原件',
      type: 'documentary',
      category: 'contract',
      description: '双方于2024年1月15日签订的购销合同',
      source: '原告提供',
      obtainDate: '2024-01-15',
      obtainMethod: '当事人提供',
      relevance: 'high' as const,
      authenticity: 'verified' as const,
      legality: 'legal' as const,
      tags: ['合同', '原件', '重要'],
      relatedFacts: ['双方存在合同关系', '合同约定交货时间为2024年2月1日'],
    },
    {
      id: '2',
      name: '银行转账记录',
      type: 'documentary',
      category: 'financial',
      description: '原告向被告支付货款的银行转账凭证',
      source: '银行',
      obtainDate: '2024-01-20',
      obtainMethod: '银行查询',
      relevance: 'high' as const,
      authenticity: 'verified' as const,
      legality: 'legal' as const,
      tags: ['付款', '银行', '已核实'],
      relatedFacts: ['原告已支付货款50万元'],
    },
    {
      id: '3',
      name: '微信聊天记录',
      type: 'electronic',
      category: 'communication',
      description: '双方关于交货时间的微信沟通记录',
      source: '原告手机',
      obtainDate: '2024-02-05',
      obtainMethod: '当事人提供',
      relevance: 'medium' as const,
      authenticity: 'unverified' as const,
      legality: 'legal' as const,
      tags: ['微信', '沟通', '待核实'],
      relatedFacts: ['被告同意延期交货'],
    },
  ];

  const getRelevanceBadge = (relevance: string) => {
    const config = {
      high: { label: '高关联', className: 'bg-red-100 text-red-700' },
      medium: { label: '中关联', className: 'bg-yellow-100 text-yellow-700' },
      low: { label: '低关联', className: 'bg-gray-100 text-gray-700' },
    };
    const { label, className } = config[relevance as keyof typeof config] || config.low;
    return <Badge className={className}>{label}</Badge>;
  };

  const getAuthenticityIcon = (authenticity: string) => {
    switch (authenticity) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disputed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getLegalityIcon = (legality: string) => {
    switch (legality) {
      case 'legal':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'illegal':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTypeName = (type: string) => {
    return EVIDENCE_TYPES.find(t => t.value === type)?.label || type;
  };

  const getCategoryName = (category: string) => {
    return EVIDENCE_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-4">
        <Button variant="ghost" onClick={() => window.location.href = "/dashboard"}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回首页
        </Button>
      </div>
      <div className="container mx-auto p-6">
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            证据管理
          </h1>
          <p className="text-muted-foreground mt-1">
            证据分类、清单生成、质证材料、证据链分析
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              添加证据
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>添加证据</DialogTitle>
              <DialogDescription>
                填写证据信息，系统将自动分类和标注
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>证据名称</Label>
                <Input placeholder="例如：购销合同原件" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>证据类型</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVIDENCE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>证据类别</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="选择类别" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVIDENCE_CATEGORIES.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>证据描述</Label>
                <Textarea placeholder="简要描述证据内容和证明目的" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>证据来源</Label>
                  <Input placeholder="例如：原告提供" />
                </div>
                <div>
                  <Label>取得日期</Label>
                  <Input type="date" />
                </div>
              </div>
              <div>
                <Label>取得方式</Label>
                <Input placeholder="例如：当事人提供、法院调取" />
              </div>
              <div>
                <Label>待证事实</Label>
                <Textarea placeholder="该证据用于证明的事实（每行一个）" rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={() => {
                toast.success("证据添加成功！");
                setAddDialogOpen(false);
              }}>
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">证据总数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockEvidences.length}</div>
            <p className="text-xs text-muted-foreground">
              已核实 {mockEvidences.filter(e => e.authenticity === 'verified').length} 份
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">高关联证据</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockEvidences.filter(e => e.relevance === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">
              占比 {Math.round(mockEvidences.filter(e => e.relevance === 'high').length / mockEvidences.length * 100)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待核实</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockEvidences.filter(e => e.authenticity === 'unverified').length}
            </div>
            <p className="text-xs text-muted-foreground">
              需要公证或鉴定
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">证据链</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              2个完整，1个待补强
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索证据名称、描述、标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list">证据列表</TabsTrigger>
          <TabsTrigger value="evidence-list">证据清单</TabsTrigger>
          <TabsTrigger value="cross-exam">质证材料</TabsTrigger>
          <TabsTrigger value="chain">证据链分析</TabsTrigger>
        </TabsList>

        {/* 证据列表 */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>证据列表</CardTitle>
              <CardDescription>
                管理所有证据材料
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockEvidences.map((evidence) => (
                  <div
                    key={evidence.id}
                    className="p-4 border rounded-lg hover:bg-accent cursor-pointer space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-lg">{evidence.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {evidence.description}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {getRelevanceBadge(evidence.relevance)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">类型：</span>
                        <span className="font-medium">{getTypeName(evidence.type)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">类别：</span>
                        <span className="font-medium">{getCategoryName(evidence.category)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">真实性：</span>
                        {getAuthenticityIcon(evidence.authenticity)}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">合法性：</span>
                        {getLegalityIcon(evidence.legality)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">来源：</span>
                      <span>{evidence.source}</span>
                      <span className="text-muted-foreground">|</span>
                      <span className="text-muted-foreground">取得日期：</span>
                      <span>{evidence.obtainDate}</span>
                    </div>

                    {evidence.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {evidence.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {evidence.relatedFacts.length > 0 && (
                      <div className="text-sm">
                        <div className="text-muted-foreground mb-1">待证事实：</div>
                        <ul className="list-disc list-inside space-y-1">
                          {evidence.relatedFacts.map((fact, idx) => (
                            <li key={idx}>{fact}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm">编辑</Button>
                      <Button variant="outline" size="sm">查看详情</Button>
                      <Button variant="outline" size="sm">
                        <Download className="mr-1 h-3 w-3" />
                        下载
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 证据清单 */}
        <TabsContent value="evidence-list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>证据清单生成</CardTitle>
                  <CardDescription>
                    生成规范的证据清单文档
                  </CardDescription>
                </div>
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  导出清单
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>案号</Label>
                    <Input placeholder="例如：(2024)京0105民初12345号" />
                  </div>
                  <div>
                    <Label>案由</Label>
                    <Input placeholder="例如：买卖合同纠纷" />
                  </div>
                </div>
                <div>
                  <Label>提交方</Label>
                  <Input placeholder="例如：原告张三" />
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="font-medium mb-2">证据统计</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>证据总数：{mockEvidences.length}份</div>
                    <div>书证：{mockEvidences.filter(e => e.type === 'documentary').length}份</div>
                    <div>电子数据：{mockEvidences.filter(e => e.type === 'electronic').length}份</div>
                    <div>合同类：{mockEvidences.filter(e => e.category === 'contract').length}份</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 质证材料 */}
        <TabsContent value="cross-exam" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>质证材料生成</CardTitle>
                  <CardDescription>
                    针对对方证据生成质证意见
                  </CardDescription>
                </div>
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  导出质证意见
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>选择对方证据</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="选择要质证的证据" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">对方证据1：劳动合同</SelectItem>
                      <SelectItem value="2">对方证据2：工资表</SelectItem>
                      <SelectItem value="3">对方证据3：考勤记录</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>对方主张</Label>
                  <Textarea placeholder="对方使用该证据证明的事实" rows={2} />
                </div>
                <div>
                  <Label>我方意见</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="选择质证意见" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admit">认可</SelectItem>
                      <SelectItem value="deny">不认可</SelectItem>
                      <SelectItem value="partial_admit">部分认可</SelectItem>
                      <SelectItem value="no_comment">无异议</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>质证理由</Label>
                  <Textarea placeholder="说明不认可的理由（真实性、合法性、关联性等）" rows={4} />
                </div>
                <div>
                  <Label>反驳证据</Label>
                  <Textarea placeholder="列出用于反驳的我方证据" rows={2} />
                </div>
                <Button className="w-full">生成质证意见</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 证据链分析 */}
        <TabsContent value="chain" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>证据链分析</CardTitle>
              <CardDescription>
                分析证据链完整性和证明力
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* 证据链示例 */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">待证事实：双方存在合同关系</div>
                    <Badge className="bg-green-100 text-green-700">强证据链</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    关联证据：2份
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>购销合同原件（书证）</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>银行转账记录（书证）</span>
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded text-sm">
                    <div className="font-medium text-green-900 mb-1">分析结论</div>
                    <div className="text-green-700">
                      证据链完整，有书面合同和付款凭证相互印证，证明力强。
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">待证事实：被告同意延期交货</div>
                    <Badge className="bg-yellow-100 text-yellow-700">中等证据链</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    关联证据：1份
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span>微信聊天记录（电子数据，未核实）</span>
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded text-sm space-y-2">
                    <div className="font-medium text-yellow-900">存在缺口</div>
                    <ul className="list-disc list-inside text-yellow-700 space-y-1">
                      <li>证据数量不足，缺少相互印证</li>
                      <li>有1份证据未经核实</li>
                    </ul>
                    <div className="font-medium text-yellow-900 mt-2">补强建议</div>
                    <ul className="list-disc list-inside text-yellow-700 space-y-1">
                      <li>建议补充其他类型的证据以形成证据链</li>
                      <li>建议对未核实的证据进行公证或鉴定</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
