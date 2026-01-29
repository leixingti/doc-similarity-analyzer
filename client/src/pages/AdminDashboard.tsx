import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, Shield, BarChart3, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import UserList from '@/components/admin/UserList';
import CreateUserForm from '@/components/admin/CreateUserForm';
import UserStats from '@/components/admin/UserStats';

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();

  // 检查用户是否为管理员
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>请先登录</AlertDescription>
            </Alert>
            <Button
              className="w-full mt-4"
              onClick={() => setLocation('/login')}
            >
              前往登录
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-red-600">
              权限不足
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                您没有权限访问管理员后台
              </AlertDescription>
            </Alert>
            <Button
              className="w-full"
              onClick={() => setLocation('/')}
            >
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            管理员后台
          </h1>
          <p className="text-gray-600">
            用户管理、权限设置和系统统计
          </p>
        </div>

        {/* 主要内容 */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              用户管理
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              创建用户
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              统计信息
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <UserList />
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <CreateUserForm />
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <UserStats />
          </TabsContent>
        </Tabs>

        {/* 返回按钮 */}
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
          >
            返回首页
          </Button>
        </div>
      </div>
    </div>
  );
}
