import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export default function ChangePassword() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const isRequired = new URLSearchParams(search).get('required') === 'true';
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const changePasswordMutation = trpc.userManagement.changePassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setIsLoading(false);
      
      // 3秒后跳转到dashboard
      setTimeout(() => {
        setLocation('/dashboard');
      }, 3000);
    },
    onError: (err) => {
      setError(err.message || '密码修改失败');
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    // 验证输入
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('请填写所有字段');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('新密码至少需要6个字符');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      setIsLoading(false);
      return;
    }

    if (oldPassword === newPassword) {
      setError('新密码不能与旧密码相同');
      setIsLoading(false);
      return;
    }

    changePasswordMutation.mutate({ oldPassword, newPassword });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isRequired ? '首次登录 - 修改密码' : '修改密码'}
          </CardTitle>
          <CardDescription className="text-center">
            {isRequired 
              ? '为了账户安全，首次登录必须修改默认密码'
              : '请输入旧密码和新密码'
            }
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
                密码修改成功！即将跳转到控制台...
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">当前密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="oldPassword"
                  type="password"
                  placeholder="••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoading || success}
                />
              </div>
            </div>

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
              {success ? '修改成功' : '确认修改'}
            </Button>

            {!isRequired && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setLocation('/dashboard')}
                disabled={isLoading}
              >
                取消
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
