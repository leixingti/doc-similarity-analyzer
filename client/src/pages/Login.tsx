import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { getLoginUrl } from '@/lib/auth';

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.userManagement.login.useMutation({
    onSuccess: (data) => {
      // 保存token到localStorage
      localStorage.setItem('auth_token', data.token);
      
      // 如果需要修改密码，跳转到密码修改页面
      if (data.mustChangePassword) {
        setLocation('/change-password?required=true');
      } else {
        setLocation('/dashboard');
      }
    },
    onError: (err) => {
      setError(err.message || '登录失败，请检查邮箱和密码');
      setIsLoading(false);
    },
  });

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('请输入邮箱和密码');
      setIsLoading(false);
      return;
    }

    loginMutation.mutate({ email, password });
  };

  const handleOAuthLogin = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">登录</CardTitle>
          <CardDescription className="text-center">
            选择登录方式访问文档相似度分析系统
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 邮箱登录表单 */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@system.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              邮箱登录
            </Button>
          </form>

          {/* 分隔线 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                或
              </span>
            </div>
          </div>

          {/* OAuth登录按钮 */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleOAuthLogin}
            disabled={isLoading}
          >
            使用 Manus 账号登录
          </Button>

          {/* 提示信息 */}
          <p className="text-sm text-center text-gray-600">
            默认管理员账号：admin@system.local / 123456
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
