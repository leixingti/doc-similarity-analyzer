import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { FileText, CheckCircle2, Clock, TrendingUp, HardDrive } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardStats() {
  const { data: stats, isLoading } = trpc.statistics.dashboard.useQuery();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: "总文档数",
      value: stats.documents.total,
      description: `使用 ${stats.documents.storageMB} MB 存储`,
      icon: FileText,
      iconColor: "text-blue-500",
    },
    {
      title: "分析任务",
      value: stats.tasks.total,
      description: `${stats.tasks.completed} 个已完成`,
      icon: CheckCircle2,
      iconColor: "text-green-500",
    },
    {
      title: "处理中",
      value: stats.tasks.processing,
      description: `${stats.tasks.pending} 个等待中`,
      icon: Clock,
      iconColor: "text-orange-500",
    },
    {
      title: "平均相似度",
      value: `${stats.tasks.averageSimilarity}%`,
      description: `基于 ${stats.tasks.completed} 个任务`,
      icon: TrendingUp,
      iconColor: "text-purple-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
