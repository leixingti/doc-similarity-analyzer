import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Loader2, Mail, Lock, User, Building } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    organization: "",
    agreeTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("请填写所有必填项");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("密码长度至少为8位");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("两次输入的密码不一致");
      return;
    }

    if (!formData.agreeTerms) {
      toast.error("请阅读并同意服务条款");
      return;
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("请输入有效的邮箱地址");
      return;
    }

    setLoading(true);

    try {
      // 模拟注册请求
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("注册成功！验证邮件已发送到您的邮箱");
      toast.info("请查收邮件并点击链接完成验证");
      
      // 跳转到登录页
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    } catch (error) {
      toast.error("注册失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <FileText className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">创建账户</CardTitle>
          <CardDescription className="text-center">
            注册成为律师文档管理系统用户
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">姓名 *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="请输入您的姓名"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">邮箱 *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">所在机构</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="organization"
                  placeholder="律师事务所或公司名称（可选）"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码 *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="至少8位密码"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                密码长度至少8位，建议包含大小写字母、数字和特殊字符
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码 *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="再次输入密码"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={formData.agreeTerms}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, agreeTerms: checked as boolean })
                }
                disabled={loading}
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                我已阅读并同意{" "}
                <a href="#" className="text-primary hover:underline">
                  服务条款
                </a>{" "}
                和{" "}
                <a href="#" className="text-primary hover:underline">
                  隐私政策
                </a>
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  注册中...
                </>
              ) : (
                "注册"
              )}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">已有账户？</span>{" "}
              <Button
                variant="link"
                className="p-0"
                onClick={() => setLocation("/login")}
                disabled={loading}
              >
                立即登录
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
