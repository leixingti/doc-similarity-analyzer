import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2, CheckCircle, XCircle, Mail } from "lucide-react";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("验证链接无效");
      return;
    }

    // 模拟验证请求
    const verifyEmail = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 模拟验证成功
        setStatus("success");
        setMessage("邮箱验证成功！");
        
        // 3秒后跳转到登录页
        setTimeout(() => {
          setLocation("/login");
        }, 3000);
      } catch (error) {
        setStatus("error");
        setMessage("验证失败，请重试");
      }
    };

    verifyEmail();
  }, [token, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            {status === "loading" && (
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            )}
            {status === "success" && (
              <CheckCircle className="h-12 w-12 text-green-500" />
            )}
            {status === "error" && (
              <XCircle className="h-12 w-12 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl text-center">
            {status === "loading" && "验证中..."}
            {status === "success" && "验证成功"}
            {status === "error" && "验证失败"}
          </CardTitle>
          <CardDescription className="text-center">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="text-center text-sm text-muted-foreground">
              <p>正在验证您的邮箱地址</p>
              <p className="mt-2">请稍候...</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg text-sm text-green-700">
                <p className="font-medium mb-2">✓ 邮箱验证成功</p>
                <p>您的账户已激活，现在可以登录使用系统了</p>
              </div>
              <Button
                className="w-full"
                onClick={() => setLocation("/login")}
              >
                前往登录
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg text-sm text-red-700">
                <p className="font-medium mb-2">✗ 验证失败</p>
                <p>可能的原因：</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>验证链接已过期</li>
                  <li>验证链接无效</li>
                  <li>邮箱已被验证</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setLocation("/login")}
                >
                  返回登录
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => window.location.reload()}
                >
                  重试
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
