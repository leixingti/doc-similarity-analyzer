import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, Edit, Key, AlertCircle, CheckCircle2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export default function UserList() {
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [resettingUser, setResettingUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const utils = trpc.useContext();
  const { data: users, isLoading } = trpc.adminManagement.getAllUsers.useQuery();
  const { data: currentUser } = trpc.auth.me.useQuery();

  const updateUserMutation = trpc.adminManagement.updateUser.useMutation({
    onSuccess: () => {
      setMessage({ type: 'success', text: '用户信息更新成功' });
      setEditingUser(null);
      utils.adminManagement.getAllUsers.invalidate();
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
    },
  });

  const deleteUserMutation = trpc.adminManagement.deleteUser.useMutation({
    onSuccess: () => {
      setMessage({ type: 'success', text: '用户删除成功' });
      setDeletingUser(null);
      utils.adminManagement.getAllUsers.invalidate();
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
    },
  });

  const resetPasswordMutation = trpc.adminManagement.resetUserPassword.useMutation({
    onSuccess: () => {
      setMessage({ type: 'success', text: '密码重置成功' });
      setResettingUser(null);
      setNewPassword('');
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
    },
  });

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setEditRole(user.role);
    setMessage(null);
  };

  const handleUpdate = () => {
    if (!editingUser) return;
    updateUserMutation.mutate({
      userId: editingUser.id,
      name: editName,
      email: editEmail,
      role: editRole,
    });
  };

  const handleDelete = (user: any) => {
    setDeletingUser(user);
    setMessage(null);
  };

  const confirmDelete = () => {
    if (!deletingUser) return;
    deleteUserMutation.mutate({ userId: deletingUser.id });
  };

  const handleResetPassword = (user: any) => {
    setResettingUser(user);
    setNewPassword('');
    setMessage(null);
  };

  const confirmResetPassword = () => {
    if (!resettingUser || !newPassword) return;
    resetPasswordMutation.mutate({
      userId: resettingUser.id,
      newPassword,
    });
  };

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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>
            管理系统中的所有用户
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert
              variant={message.type === 'error' ? 'destructive' : 'default'}
              className={message.type === 'success' ? 'bg-green-50 border-green-200' : ''}
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

          <div className="mt-4 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>用户名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>登录方式</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? '管理员' : '用户'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.loginMethod === 'oauth' ? 'OAuth' : '邮箱'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResetPassword(user)}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(user)}
                          disabled={user.id === currentUser?.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 编辑用户对话框 */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>
              修改用户的基本信息和角色
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">用户名</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">邮箱</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">角色</Label>
              <Select value={editRole} onValueChange={(value: 'user' | 'admin') => setEditRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">普通用户</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              取消
            </Button>
            <Button onClick={handleUpdate} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除用户确认对话框 */}
      <Dialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除用户 "{deletingUser?.name}" 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingUser(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重置密码对话框 */}
      <Dialog open={!!resettingUser} onOpenChange={() => setResettingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>
              为用户 "{resettingUser?.name}" 设置新密码
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">新密码</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="至少6个字符"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                用户下次登录时将被要求修改密码
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResettingUser(null)}>
              取消
            </Button>
            <Button
              onClick={confirmResetPassword}
              disabled={resetPasswordMutation.isPending || newPassword.length < 6}
            >
              {resetPasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              重置密码
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
