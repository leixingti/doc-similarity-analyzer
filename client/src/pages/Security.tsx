import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Key,
  FileText,
  Monitor,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Smartphone,
  Copy,
  Loader2
, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Security() {
  useAuth();
  const [activeTab, setActiveTab] = useState("2fa");
  const [loading, setLoading] = useState(false);

  // 2FA状态
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");

  // 审计日志
  const [auditLogs] = useState([
    {
      id: 1,
      action: "登录",
      resource: "认证系统",
      ipAddress: "192.168.1.100",
      status: "success",
      timestamp: "2024-01-30 10:00:00",
    },
    {
      id: 2,
      action: "创建文档",
      resource: "文档管理",
      resourceId: "DOC-123",
      ipAddress: "192.168.1.100",
      status: "success",
      timestamp: "2024-01-30 10:05:00",
    },
    {
      id: 3,
      action: "删除文档",
      resource: "文档管理",
      resourceId: "DOC-456",
      ipAddress: "192.168.1.101",
      status: "failure",
      timestamp: "2024-01-30 10:15:00",
      errorMessage: "权限不足",
    },
  ]);

  // 会话列表
  const [sessions] = useState([
    {
      id: "session-1",
      device: "Windows PC",
      browser: "Chrome 120",
      ipAddress: "192.168.1.100",
      location: "北京",
      lastActivity: "刚刚",
      isCurrent: true,
    },
    {
      id: "session-2",
      device: "iPhone 14",
      browser: "Safari",
      ipAddress: "192.168.1.101",
      location: "上海",
      lastActivity: "3小时前",
      isCurrent: false,
    },
  ]);

  const handleEnable2FA = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟生成2FA密钥
      setQrCode("otpauth://totp/LawyerDoc:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=LawyerDoc");
      setBackupCodes([
        "ABCD1234",
        "EFGH5678",
        "IJKL9012",
        "MNOP3456",
        "QRST7890",
      ]);
      
      toast.success("2FA密钥生成成功！");
    } catch (error) {
      toast.error("生成失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("请输入6位验证码");
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTwoFactorEnabled(true);
      toast.success("双因素认证已启用！");
    } catch (error) {
      toast.error("验证失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTwoFactorEnabled(false);
      setQrCode("");
      setBackupCodes([]);
      setVerificationCode("");
      
      toast.success("双因素认证已禁用");
    } catch (error) {
      toast.error("操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success("会话已撤销");
    } catch (error) {
      toast.error("操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("所有其他会话已撤销");
    } catch (error) {
      toast.error("操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "success") {
      return <Badge className="bg-green-100 text-green-700">成功</Badge>;
    }
    return <Badge className="bg-red-100 text-red-700">失败</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-4">
        <Button variant="ghost" onClick={() => window.location.href = "/dashboard"}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回首页
        </Button>
      </div>
      <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            安全设置
          </h1>
          <p className="text-muted-foreground mt-1">
            管理账户安全和隐私设置
          </p>
        </div>
      </div>

      {/* 安全概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">双因素认证</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {twoFactorEnabled ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">已启用</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm">未启用</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃会话</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-xs text-muted-foreground">
              {sessions.filter(s => s.isCurrent).length} 个当前会话
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">操作日志</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              最近24小时
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="2fa">双因素认证</TabsTrigger>
          <TabsTrigger value="sessions">会话管理</TabsTrigger>
          <TabsTrigger value="audit">操作日志</TabsTrigger>
        </TabsList>

        {/* 双因素认证 */}
        <TabsContent value="2fa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>双因素认证（2FA）</CardTitle>
              <CardDescription>
                为您的账户添加额外的安全保护层
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!twoFactorEnabled ? (
                <>
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium mb-1">什么是双因素认证？</div>
                        <div className="text-muted-foreground">
                          双因素认证（2FA）为您的账户提供额外的安全保护。启用后，登录时除了密码外，还需要输入手机验证器应用生成的6位验证码。
                        </div>
                      </div>
                    </div>
                  </div>

                  {!qrCode ? (
                    <Button onClick={handleEnable2FA} disabled={loading} className="w-full">
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Key className="mr-2 h-4 w-4" />
                          启用双因素认证
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <div className="font-medium mb-2">步骤1：扫描二维码</div>
                        <div className="text-sm text-muted-foreground mb-4">
                          使用Google Authenticator、Microsoft Authenticator等应用扫描下方二维码
                        </div>
                        <div className="flex justify-center p-4 border rounded-lg bg-white">
                          <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                            <Smartphone className="h-12 w-12 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="font-medium mb-2">步骤2：保存备份码</div>
                        <div className="text-sm text-muted-foreground mb-2">
                          请妥善保存以下备份码，当无法使用验证器时可用于登录
                        </div>
                        <div className="grid grid-cols-2 gap-2 p-4 border rounded-lg bg-muted">
                          {backupCodes.map((code, idx) => (
                            <div key={idx} className="font-mono text-sm">
                              {code}
                            </div>
                          ))}
                        </div>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Copy className="mr-2 h-4 w-4" />
                          复制备份码
                        </Button>
                      </div>

                      <div>
                        <div className="font-medium mb-2">步骤3：输入验证码</div>
                        <div className="text-sm text-muted-foreground mb-2">
                          输入验证器应用显示的6位验证码
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="000000"
                            maxLength={6}
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                          />
                          <Button onClick={handleVerify2FA} disabled={loading}>
                            {loading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "验证"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div className="text-sm">
                        <div className="font-medium">双因素认证已启用</div>
                        <div className="text-muted-foreground">
                          您的账户已受到双因素认证保护
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="destructive"
                    onClick={handleDisable2FA}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        处理中...
                      </>
                    ) : (
                      "禁用双因素认证"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 会话管理 */}
        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>活跃会话</CardTitle>
              <CardDescription>
                管理您在不同设备上的登录会话
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Monitor className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {session.device}
                            {session.isCurrent && (
                              <Badge className="bg-green-100 text-green-700">当前</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {session.browser} · {session.location}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            IP: {session.ipAddress} · {session.lastActivity}
                          </div>
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={loading}
                        >
                          撤销
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={handleRevokeAllSessions}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    处理中...
                  </>
                ) : (
                  "撤销所有其他会话"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 操作日志 */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>操作日志</CardTitle>
              <CardDescription>
                查看您的账户操作记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium">{log.action}</div>
                      {getStatusBadge(log.status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>资源：{log.resource} {log.resourceId && `(${log.resourceId})`}</div>
                      <div>IP地址：{log.ipAddress}</div>
                      <div>时间：{log.timestamp}</div>
                      {log.errorMessage && (
                        <div className="text-red-600">错误：{log.errorMessage}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
