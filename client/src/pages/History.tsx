import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { ArrowLeft, FileText, Loader2, TrendingUp, BarChart3, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useAuth } from "@/_core/hooks/useAuth";

export default function History() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minSimilarity, setMinSimilarity] = useState("");
  const [maxSimilarity, setMaxSimilarity] = useState("");

  const { data: stats } = trpc.analysis.getStatistics.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: history } = trpc.analysis.getHistory.useQuery(
    {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      minSimilarity: minSimilarity ? parseFloat(minSimilarity) : undefined,
      maxSimilarity: maxSimilarity ? parseFloat(maxSimilarity) : undefined,
    },
    { enabled: !!user }
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = 
'/login';
    return null;
  }

  // 准备趋势图数据
  const prepareTrendData = () => {
    if (!history || history.length === 0) return [];

    // 按月份统计
    const monthlyData: { [key: string]: { total: number; sum: number; count: number } } = {};

    history.forEach((task: any) => {
      const date = new Date(task.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total: 0, sum: 0, count: 0 };
      }

      monthlyData[monthKey].total++;
      monthlyData[monthKey].sum += task.overallSimilarity || 0;
      monthlyData[monthKey].count++;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        count: data.total,
        avgSimilarity: data.count > 0 ? (data.sum / data.count).toFixed(1) : 0,
      }));
  };

  // 按文档类型统计
  const prepareDocTypeData = () => {
    if (!history || history.length === 0) return [];

    const typeCount: { [key: string]: number } = {};

    history.forEach((task: any) => {
      // 这里假设我们有文档类型信息，如果没有可以使用analysisMode
      const type = task.analysisMode || 'unknown';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    return Object.entries(typeCount).map(([name, value]) => ({
      name: name === 'traditional' ? '传统算法' : name === 'deepseek' ? 'DeepSeek AI' : name,
      value,
    }));
  };

  const trendData = prepareTrendData();
  const docTypeData = prepareDocTypeData();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">分析历史</span>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总分析次数</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCount || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                累计分析任务
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均相似度</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.avgSimilarity !== null && stats?.avgSimilarity !== undefined
                  ? `${stats.avgSimilarity.toFixed(1)}%`
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                所有任务平均值
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">最高相似度</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {stats?.maxSimilarity !== null && stats?.maxSimilarity !== undefined
                  ? `${stats.maxSimilarity.toFixed(1)}%`
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                历史最高记录
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">最低相似度</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {stats?.minSimilarity !== null && stats?.minSimilarity !== undefined
                  ? `${stats.minSimilarity.toFixed(1)}%`
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                历史最低记录
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Trend Chart */}
        {trendData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>月度趋势</CardTitle>
              <CardDescription>分析次数和平均相似度变化</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="count"
                    stroke="#8b5cf6"
                    name="分析次数"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgSimilarity"
                    stroke="#06b6d4"
                    name="平均相似度(%)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* 分析类型分布和统计图表 */}
        {history && history.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* 分析模式分布饼图 */}
            <Card>
              <CardHeader>
                <CardTitle>分析模式分布</CardTitle>
                <CardDescription>传统算法 vs DeepSeek AI</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={docTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {docTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 相似度分布柱状图 */}
            <Card>
              <CardHeader>
                <CardTitle>相似度分布</CardTitle>
                <CardDescription>不同相似度区间的任务数量</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      {
                        range: '0-20%',
                        count: history.filter((t: any) => t.overallSimilarity < 20).length,
                      },
                      {
                        range: '20-40%',
                        count: history.filter((t: any) => t.overallSimilarity >= 20 && t.overallSimilarity < 40).length,
                      },
                      {
                        range: '40-60%',
                        count: history.filter((t: any) => t.overallSimilarity >= 40 && t.overallSimilarity < 60).length,
                      },
                      {
                        range: '60-80%',
                        count: history.filter((t: any) => t.overallSimilarity >= 60 && t.overallSimilarity < 80).length,
                      },
                      {
                        range: '80-100%',
                        count: history.filter((t: any) => t.overallSimilarity >= 80).length,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8b5cf6" name="任务数量" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>筛选条件</CardTitle>
            <CardDescription>按时间和相似度范围筛选历史记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="startDate">开始日期</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">结束日期</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="minSimilarity">最小相似度(%)</Label>
                <Input
                  id="minSimilarity"
                  type="number"
                  min="0"
                  max="100"
                  value={minSimilarity}
                  onChange={(e) => setMinSimilarity(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="maxSimilarity">最大相似度(%)</Label>
                <Input
                  id="maxSimilarity"
                  type="number"
                  min="0"
                  max="100"
                  value={maxSimilarity}
                  onChange={(e) => setMaxSimilarity(e.target.value)}
                  placeholder="100"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setMinSimilarity("");
                  setMaxSimilarity("");
                }}
              >
                清除筛选
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* History List */}
        <Card>
          <CardHeader>
            <CardTitle>历史记录</CardTitle>
            <CardDescription>
              共 {history?.length || 0} 条记录
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!history || history.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                暂无符合条件的历史记录
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 border rounded hover:bg-accent cursor-pointer"
                    onClick={() => setLocation(`/results/${task.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{task.taskName}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(task.createdAt).toLocaleString('zh-CN')} ·{' '}
                          {task.analysisMode === 'traditional' ? '传统算法' : 'DeepSeek AI'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {task.overallSimilarity?.toFixed(1) || '0.0'}%
                      </p>
                      <p className="text-xs text-muted-foreground">相似度</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
