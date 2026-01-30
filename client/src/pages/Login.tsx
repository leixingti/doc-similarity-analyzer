import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, Lock, AlertCircle, User } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { getLoginUrl } from '@/lib/auth';

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [adminInviteCode, setAdminInviteCode] = useState('');
  const [showAdminInvite, setShowAdminInvite] = useState(false);
  const utils = trpc.useUtils();

  // 倒计时逻辑
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendCodeMutation = trpc.userManagement.sendVerificationCode.useMutation({
    onSuccess: () => {
      setSuccess('验证码已发送到您的邮箱');
      setCountdown(60);
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err) => {
      setError(err.message || '验证码发送失败');
    },
  });

  const loginMutation = trpc.userManagement.login.useMutation({
    onSuccess: (data) => {
      // 保存token到localStorage
      localStorage.setItem('auth_token', data.token);
      
      // 清除tRPC缓存，强制重新获取用户信息
      utils.auth.me.invalidate();
      
      // 如果需要修改密码，跳转到密码修改页面
      if (data.user?.mustChangePassword) {
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

  const registerMutation = trpc.userManagement.register.useMutation({
    onSuccess: (data) => {
      // 保存token到localStorage
      localStorage.setItem('auth_token', data.token);
      
      // 清除tRPC缓存，强制重新获取用户信息
      utils.auth.me.invalidate();
      
      // 注册成功后自动跳转到仪表板
      setLocation('/dashboard');
    },
    onError: (err) => {
      setError(err.message || '注册失败，请检查输入');
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

  const handleSendCode = async () => {
    setError('');
    setSuccess('');
    
    if (!email) {
      setError('请先输入邮箱地址');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }
    
    sendCodeMutation.mutate({ email });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!email || !password || !name) {
      setError('请填写所有必填项');
      setIsLoading(false);
      return;
    }

    if (!verificationCode) {
      setError('请输入验证码');
      setIsLoading(false);
      return;
    }

    if (verificationCode.length !== 6) {
      setError('验证码必须是6位数字');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('密码至少需要6个字符');
      setIsLoading(false);
      return;
    }

    registerMutation.mutate({ 
      email, 
      password, 
      name, 
      code: verificationCode,
      adminInviteCode: adminInviteCode || undefined,
    });
  };

  const handleOAuthLogin = () => {
    window.location.href = 
"/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">智能文档处理系统</CardTitle>
          <CardDescription className="text-center">
            选择登录或注册方式访问系统
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
            <Alert className="border-green-500 text-green-700">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">登录</TabsTrigger>
              <TabsTrigger value="register">注册</TabsTrigger>
            </TabsList>

            {/* 登录标签页 */}
            <TabsContent value="login" className="space-y-4">
              {/* 邮箱登录表单 */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="输入邮箱地址"
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

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setLocation('/forgot-password')}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    忘记密码？
                  </button>
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

              {/* OAuth登录按钮 - 已隐藏 */}
              {/* <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleOAuthLogin}
                disabled={isLoading}
              >
                使用 Manus 账号登录
              </Button> */}

              {/* 提示信息 - 已隐藏 */}
              {/* <p className="text-sm text-center text-gray-600">
                默认管理员账号：admin@system.local / 123456
              </p> */}
            </TabsContent>

            {/* 注册标签页 */}
            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">用户名</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="请输入用户名"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="example@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-verification-code">验证码</Label>
                  <div className="flex gap-2">
                    <Input
                      id="register-verification-code"
                      type="text"
                      placeholder="请输入6位验证码"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      maxLength={6}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendCode}
                      disabled={countdown > 0 || !email || isLoading}
                      className="whitespace-nowrap"
                    >
                      {countdown > 0 ? `${countdown}s` : '发送验证码'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="至少6个字符"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="register-admin-invite">管理员邀请码（可选）</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdminInvite(!showAdminInvite)}
                      className="text-xs h-auto p-0 text-blue-600 hover:text-blue-800"
                    >
                      {showAdminInvite ? '隐藏' : '成为管理员？'}
                    </Button>
                  </div>
                  {showAdminInvite && (
                    <Input
                      id="register-admin-invite"
                      type="text"
                      placeholder="请输入管理员邀请码"
                      value={adminInviteCode}
                      onChange={(e) => setAdminInviteCode(e.target.value)}
                      disabled={isLoading}
                    />
                  )}
                  {showAdminInvite && (
                    <p className="text-xs text-gray-500">
                      如果您有管理员邀请码，输入后将自动获得管理员权限
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  注册
                </Button>
              </form>

              <p className="text-sm text-center text-gray-600">
                注册后将自动登录系统
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
