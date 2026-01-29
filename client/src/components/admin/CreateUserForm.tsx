import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, AlertCircle, CheckCircle2, UserPlus } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export default function CreateUserForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const utils = trpc.useContext();
  const createUserMutation = trpc.adminManagement.createUser.useMutation({
    onSuccess: () => {
      setMessage({ type: 'success', text: '用户创建成功！用户首次登录时需要修改密码。' });
      // 清空表单
      setEmail('');
      setName('');
      setPassword('');
      setConfirmPassword('');
      setRole('user');
      // 刷新用户列表
      utils.adminManagement.getAllUsers.invalidate();
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // 验证
    if (!email || !name || !password || !confirmPassword) {
      setMessage({ type: 'error', text: '请填写所有字段' });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: '密码至少需要6个字符' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的密码不一致' });
      return;
    }

    createUserMutation.mutate({
      email,
      name,
      password,
      role,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          创建新用户
        </CardTitle>
        <CardDescription>
          添加新的系统用户并设置初始密码
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <Alert
            variant={message.type === 'error' ? 'destructive' : 'default'}
            className={`mb-4 ${message.type === 'success' ? 'bg-green-50 border-green-200' : ''}`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : ''}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">用户名 *</Label>
              <Input
                id="name"
                placeholder="请输入用户名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={createUserMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">邮箱 *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={createUserMutation.isPending}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">初始密码 *</Label>
              <Input
                id="password"
                type="password"
                placeholder="至少6个字符"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={createUserMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">确认密码 *</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={createUserMutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">用户角色</Label>
            <Select
              value={role}
              onValueChange={(value: 'user' | 'admin') => setRole(value)}
              disabled={createUserMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">普通用户</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              创建的用户首次登录时将被要求修改密码
            </AlertDescription>
          </Alert>

          <Button
            type="submit"
            className="w-full"
            disabled={createUserMutation.isPending}
          >
            {createUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            创建用户
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
