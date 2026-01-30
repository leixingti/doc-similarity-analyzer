import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Download,
  Calendar,
  FileText,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity
} from "lucide-react";

export default function Reports() {
  useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("month");

  // 模拟统计数据
  const stats = {
    totalCases: 45,
    activeCases: 28,
    closedCases: 17,
    totalDocuments: 1234,
    totalTasks: 89,
    completedTasks: 67,
    pendingTasks: 22,
    teamMembers: 12,
  };

  const casesByType = [
    { type: '民事案件', count: 25, percentage: 56 },
    { type: '刑事案件', count: 8, percentage: 18 },
    { type: '行政案件', count: 7, percentage: 15 },
    { type: '执行案件', count: 5, percentage: 11 },
  ];

  const casesByStatus = [
    { status: '进行中', count: 28, color: 'bg-blue-500' },
    { status: '已结案', count: 17, color: 'bg-green-500' },
  ];

  const documentsByType = [
    { type: '合同', count: 456 },
    { type: '诉讼文书', count: 234 },
    { type: '证据材料', count: 345 },
    { type: '法律意见', count: 123 },
    { type: '其他', count: 76 },
  ];

  const monthlyActivity = [
    { month: '1月', cases: 5, documents: 120 },
    { month: '2月', cases: 7, documents: 150 },
    { month: '3月', cases: 8, documents: 180 },
    { month: '4月', cases: 6, documents: 140 },
    { month: '5月', cases: 9, documents: 200 },
    { month: '6月', cases: 10, documents: 244 },
  ];

  const teamPerformance = [
    { name: '张律师', cases: 12, documents: 345, tasks: 28 },
    { name: '李律师', cases: 10, documents: 289, tasks: 24 },
    { name: '王律师', cases: 8, documents: 234, tasks: 20 },
    { name: '赵律师', cases: 7, documents: 198, tasks: 17 },
    { name: '其他', cases: 8, documents: 168, tasks: 15 },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            报表统计
          </h1>
          <p className="text-muted-foreground mt-1">
            数据分析与工作量统计
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">本周</SelectItem>
              <SelectItem value="month">本月</SelectItem>
              <SelectItem value="quarter">本季度</SelectItem>
              <SelectItem value="year">本年</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 概览统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">案件总数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCases}</div>
            <p className="text-xs text-muted-foreground">
              进行中 {stats.activeCases} 个
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">文档数量</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              本月新增 244 个
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">任务完成率</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((stats.completedTasks / stats.totalTasks) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTasks}/{stats.totalTasks} 已完成
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">团队成员</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamMembers}</div>
            <p className="text-xs text-muted-foreground">
              活跃成员 8 人
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="cases">案件统计</TabsTrigger>
          <TabsTrigger value="documents">文档统计</TabsTrigger>
          <TabsTrigger value="team">团队绩效</TabsTrigger>
        </TabsList>

        {/* 概览 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 案件状态分布 */}
            <Card>
              <CardHeader>
                <CardTitle>案件状态分布</CardTitle>
                <CardDescription>当前案件的状态统计</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {casesByStatus.map((item) => (
                    <div key={item.status}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{item.status}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.count} ({Math.round((item.count / stats.totalCases) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${item.color} h-2 rounded-full`}
                          style={{ width: `${(item.count / stats.totalCases) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 案件类型分布 */}
            <Card>
              <CardHeader>
                <CardTitle>案件类型分布</CardTitle>
                <CardDescription>按案件类型统计</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {casesByType.map((item) => (
                    <div key={item.type}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{item.type}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 月度活动趋势 */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>月度活动趋势</CardTitle>
                <CardDescription>案件和文档的月度变化</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyActivity.map((item) => (
                    <div key={item.month} className="flex items-center gap-4">
                      <div className="w-16 text-sm font-medium">{item.month}</div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-12">案件</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${(item.cases / 10) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-8">{item.cases}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-12">文档</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${(item.documents / 250) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-8">{item.documents}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 案件统计 */}
        <TabsContent value="cases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>案件详细统计</CardTitle>
              <CardDescription>案件的多维度分析</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-4">按案件类型</h3>
                  <div className="space-y-3">
                    {casesByType.map((item) => (
                      <div key={item.type} className="flex items-center justify-between p-3 border rounded">
                        <span className="font-medium">{item.type}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-bold">{item.count}</span>
                          <span className="text-sm text-muted-foreground">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-4">按案件状态</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-muted-foreground">进行中</span>
                      </div>
                      <div className="text-3xl font-bold">{stats.activeCases}</div>
                    </div>
                    <div className="p-4 border rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-muted-foreground">已结案</span>
                      </div>
                      <div className="text-3xl font-bold">{stats.closedCases}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 文档统计 */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>文档统计分析</CardTitle>
              <CardDescription>文档的分类和使用情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-4">按文档类型</h3>
                  <div className="space-y-3">
                    {documentsByType.map((item) => (
                      <div key={item.type} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{item.type}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${(item.count / stats.totalDocuments) * 100}%` }}
                            />
                          </div>
                          <span className="text-lg font-bold w-16 text-right">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 border rounded">
                    <div className="text-sm text-muted-foreground mb-1">总文档数</div>
                    <div className="text-2xl font-bold">{stats.totalDocuments}</div>
                  </div>
                  <div className="p-4 border rounded">
                    <div className="text-sm text-muted-foreground mb-1">本月新增</div>
                    <div className="text-2xl font-bold text-green-600">+244</div>
                  </div>
                  <div className="p-4 border rounded">
                    <div className="text-sm text-muted-foreground mb-1">平均每案</div>
                    <div className="text-2xl font-bold">
                      {Math.round(stats.totalDocuments / stats.totalCases)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 团队绩效 */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>团队工作量统计</CardTitle>
              <CardDescription>团队成员的工作量和绩效</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamPerformance.map((member) => (
                  <div key={member.name} className="p-4 border rounded space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-muted-foreground">律师</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{member.cases}</div>
                        <div className="text-xs text-muted-foreground">案件数</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{member.documents}</div>
                        <div className="text-xs text-muted-foreground">文档数</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">{member.tasks}</div>
                        <div className="text-xs text-muted-foreground">任务数</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
