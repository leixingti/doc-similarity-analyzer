import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, UserCheck, BarChart3, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export default function UserStats() {
  const { data: stats, isLoading } = trpc.adminManagement.getUserStats.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      title: '总用户数',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: '管理员',
      value: stats?.adminCount || 0,
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: '普通用户',
      value: stats?.userCount || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: '已验证邮箱',
      value: stats?.verifiedCount || 0,
      icon: UserCheck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            用户统计
          </CardTitle>
          <CardDescription>
            系统用户的统计信息
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-full`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>详细信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700">邮箱验证率</span>
                <span className="text-lg font-semibold">
                  {stats.totalUsers > 0
                    ? Math.round((stats.verifiedCount / stats.totalUsers) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700">管理员占比</span>
                <span className="text-lg font-semibold">
                  {stats.totalUsers > 0
                    ? Math.round((stats.adminCount / stats.totalUsers) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700">普通用户占比</span>
                <span className="text-lg font-semibold">
                  {stats.totalUsers > 0
                    ? Math.round((stats.userCount / stats.totalUsers) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
