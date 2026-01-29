import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  // 验证令牌
  const verifyTokenQuery = trpc.userManagement.verifyResetToken.useQuery(
    { token: token || '' },
    {
      enabled: !!token,
      retry: false,
    }
  );

  const resetPasswordMutation = trpc.userManagement.resetPassword.useMutation();

  useEffect(() => {
    if (!token) {
      setError('缺少重置令牌');
    }
  }, [token]);

  useEffect(() => {
    if (verifyTokenQuery.data) {
      setEmail(verifyTokenQuery.data.email);
    }
  }, [verifyTokenQuery.data]);

  useEffect(() => {
    if (verifyTokenQuery.error) {
      setError(verifyTokenQuery.error.message || '重置链接无效或已过期');
    }
  }, [verifyTokenQuery.error]);

  useEffect(() => {
    if (resetPasswordMutation.isSuccess) {
      setSuccess(true);
      setIsLoading(false);
      
      // 3秒后跳转到登录页
      setTimeout(() => {
        setLocation('/login');
      }, 3000);
    }
  }, [resetPasswordMutation.isSuccess, setLocation]);

  useEffect(() => {
    if (resetPasswordMutation.error) {
      setError(resetPasswordMutation.error.message || '密码重置失败');
      setIsLoading(false);
    }
  }, [resetPasswordMutation.error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    // 验证输入
    if (!newPassword || !confirmPassword) {
      setError('请填写所有字段');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('密码至少需要6个字符');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      setIsLoading(false);
      return;
    }

    if (!token) {
      setError('缺少重置令牌');
      setIsLoading(false);
      return;
    }

    resetPasswordMutation.mutate({ token, newPassword });
  };

  if (verifyTokenQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-gray-600">验证重置链接...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-red-600">
              链接无效
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button
              className="w-full"
              onClick={() => setLocation('/forgot-password')}
            >
              重新请求重置链接
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verifyTokenQuery.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-red-600">
              链接无效
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {verifyTokenQuery.error?.message || '重置链接无效或已过期'}
              </AlertDescription>
            </Alert>
            <Button
              className="w-full"
              onClick={() => setLocation('/forgot-password')}
            >
              重新请求重置链接
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            重置密码
          </CardTitle>
          <CardDescription className="text-center">
            为 {email} 设置新密码
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
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                密码重置成功！即将跳转到登录页...
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="至少6个字符"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoading || success}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="再次输入新密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoading || success}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || success}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {success ? '重置成功' : '重置密码'}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setLocation('/login')}
              disabled={isLoading}
            >
              返回登录
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
