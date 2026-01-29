import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export default function SetupAdmin() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const setupMutation = trpc.userManagement.setupFirstAdmin.useMutation({
    onSuccess: (data) => {
      setSuccess(data.message);
      setError('');
      setIsLoading(false);
      
      // 3秒后退出登录并跳转到登录页
      setTimeout(() => {
        localStorage.removeItem('auth_token');
        setLocation('/login');
      }, 3000);
    },
    onError: (err) => {
      setError(err.message || '设置失败，请检查您的权限');
      setSuccess('');
      setIsLoading(false);
    },
  });

  const handleSetup = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await setupMutation.mutateAsync();
    } catch (err) {
      // 错误已在 onError 中处理
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Shield className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">首次管理员设置</CardTitle>
          <CardDescription>
            将您的账号设置为系统管理员
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-blue-900">说明</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>此功能仅在系统没有管理员时可用</li>
              <li>点击按钮后，您的账号将获得管理员权限</li>
              <li>设置成功后需要重新登录</li>
              <li>成为管理员后可以在 /admin 管理其他用户</li>
            </ul>
          </div>

          <Button
            onClick={handleSetup}
            className="w-full"
            disabled={isLoading || !!success}
            size="lg"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {success ? '设置成功，即将跳转...' : '成为管理员'}
          </Button>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => setLocation('/dashboard')}
              disabled={isLoading}
            >
              返回首页
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center pt-4 border-t">
            <p>⚠️ 注意：这是一个临时功能</p>
            <p>在系统有管理员后，此功能将被移除</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
