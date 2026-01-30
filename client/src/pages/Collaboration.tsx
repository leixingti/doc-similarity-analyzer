import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  MessageSquare, 
  Clock, 
  CheckCircle,
  AlertCircle,
  UserPlus,
  Send,
  Download,
  Eye,
  Edit,
  Share2,
  Trash2,
  GitBranch
, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Collaboration() {
  useAuth();
  const [activeTab, setActiveTab] = useState("revisions");
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);

  // 模拟数据
  const mockRevisions = [
    {
      id: '1',
      version: 5,
      userName: '张律师',
      timestamp: '2024-01-30 14:30:00',
      changeType: 'edit',
      changeSummary: '修改第3条款的违约责任条款',
      changeCount: 3,
    },
    {
      id: '2',
      version: 4,
      userName: '李律师',
      timestamp: '2024-01-30 10:15:00',
      changeType: 'comment',
      changeSummary: '添加了2条评论',
      changeCount: 2,
    },
    {
      id: '3',
      version: 3,
      userName: '王律师',
      timestamp: '2024-01-29 16:45:00',
      changeType: 'edit',
      changeSummary: '新增第5条款关于知识产权的约定',
      changeCount: 1,
    },
  ];

  const mockComments = [
    {
      id: '1',
      userName: '李律师',
      content: '这里的违约金比例是否过高？建议调整为合同金额的20%',
      context: '违约金为合同金额的30%',
      resolved: false,
      replies: [
        {
          id: '1-1',
          userName: '张律师',
          content: '同意，我会修改',
          createdAt: '2024-01-30 11:00:00',
        },
      ],
      createdAt: '2024-01-30 10:30:00',
    },
    {
      id: '2',
      userName: '王律师',
      content: '建议增加不可抗力条款',
      context: '第三章 合同履行',
      resolved: true,
      replies: [],
      createdAt: '2024-01-29 15:20:00',
    },
  ];

  const mockTasks = [
    {
      id: '1',
      title: '审阅合同第3-5条款',
      assigneeName: '李律师',
      taskType: 'review',
      priority: 'high',
      status: 'in_progress',
      dueDate: '2024-02-01',
      createdAt: '2024-01-30 09:00:00',
    },
    {
      id: '2',
      title: '修改违约责任条款',
      assigneeName: '张律师',
      taskType: 'edit',
      priority: 'medium',
      status: 'completed',
      dueDate: '2024-01-31',
      createdAt: '2024-01-29 14:00:00',
    },
    {
      id: '3',
      title: '审批最终版本',
      assigneeName: '王律师',
      taskType: 'approve',
      priority: 'high',
      status: 'pending',
      dueDate: '2024-02-02',
      createdAt: '2024-01-30 16:00:00',
    },
  ];

  const mockMembers = [
    {
      userId: '1',
      userName: '张律师',
      role: 'owner',
      isOnline: true,
    },
    {
      userId: '2',
      userName: '李律师',
      role: 'editor',
      isOnline: true,
    },
    {
      userId: '3',
      userName: '王律师',
      role: 'reviewer',
      isOnline: false,
    },
    {
      userId: '4',
      userName: '赵助理',
      role: 'viewer',
      isOnline: false,
    },
  ];

  const getTaskStatusBadge = (status: string) => {
    const config = {
      pending: { label: '待处理', className: 'bg-gray-100 text-gray-700' },
      in_progress: { label: '进行中', className: 'bg-blue-100 text-blue-700' },
      completed: { label: '已完成', className: 'bg-green-100 text-green-700' },
      cancelled: { label: '已取消', className: 'bg-red-100 text-red-700' },
    };
    const { label, className } = config[status as keyof typeof config] || config.pending;
    return <Badge className={className}>{label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const config = {
      high: { label: '高', className: 'bg-red-100 text-red-700' },
      medium: { label: '中', className: 'bg-yellow-100 text-yellow-700' },
      low: { label: '低', className: 'bg-green-100 text-green-700' },
    };
    const { label, className } = config[priority as keyof typeof config] || config.medium;
    return <Badge className={className}>{label}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const config = {
      owner: { label: '所有者', className: 'bg-purple-100 text-purple-700' },
      editor: { label: '编辑者', className: 'bg-blue-100 text-blue-700' },
      reviewer: { label: '审阅者', className: 'bg-green-100 text-green-700' },
      viewer: { label: '查看者', className: 'bg-gray-100 text-gray-700' },
    };
    const { label, className } = config[role as keyof typeof config] || config.viewer;
    return <Badge className={className}>{label}</Badge>;
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'edit':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'create':
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
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
            <Users className="h-8 w-8 text-primary" />
            协作管理
          </h1>
          <p className="text-muted-foreground mt-1">
            文档协同编辑、修订追踪、评论批注、任务分配
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="mr-2 h-4 w-4" />
                添加成员
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加协作成员</DialogTitle>
                <DialogDescription>
                  邀请团队成员协作编辑文档
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>成员邮箱或用户名</Label>
                  <Input placeholder="输入邮箱或用户名" />
                </div>
                <div>
                  <Label>角色权限</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="选择角色" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">编辑者 - 可编辑和评论</SelectItem>
                      <SelectItem value="reviewer">审阅者 - 仅可评论</SelectItem>
                      <SelectItem value="viewer">查看者 - 仅可查看</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={() => {
                  toast.success("成员添加成功！");
                  setAddMemberDialogOpen(false);
                }}>
                  发送邀请
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={createTaskDialogOpen} onOpenChange={setCreateTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <CheckCircle className="mr-2 h-4 w-4" />
                创建任务
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建协作任务</DialogTitle>
                <DialogDescription>
                  分配文档审阅或编辑任务给团队成员
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>任务标题</Label>
                  <Input placeholder="例如：审阅合同第3-5条款" />
                </div>
                <div>
                  <Label>任务描述</Label>
                  <Textarea placeholder="详细描述任务内容和要求" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>分配给</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择成员" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">李律师</SelectItem>
                        <SelectItem value="2">王律师</SelectItem>
                        <SelectItem value="3">赵助理</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>任务类型</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="review">审阅</SelectItem>
                        <SelectItem value="edit">编辑</SelectItem>
                        <SelectItem value="approve">审批</SelectItem>
                        <SelectItem value="comment">评论</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>优先级</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择优先级" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">高</SelectItem>
                        <SelectItem value="medium">中</SelectItem>
                        <SelectItem value="low">低</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>截止日期</Label>
                    <Input type="date" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateTaskDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={() => {
                  toast.success("任务创建成功！");
                  setCreateTaskDialogOpen(false);
                }}>
                  创建任务
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">协作成员</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              在线 {mockMembers.filter(m => m.isOnline).length} 人
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">修订版本</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockRevisions.length}</div>
            <p className="text-xs text-muted-foreground">
              最新版本 v{mockRevisions[0]?.version}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理评论</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockComments.filter(c => !c.resolved).length}
            </div>
            <p className="text-xs text-muted-foreground">
              总评论 {mockComments.length} 条
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待办任务</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockTasks.filter(t => t.status !== 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              总任务 {mockTasks.length} 个
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revisions">修订历史</TabsTrigger>
          <TabsTrigger value="comments">评论批注</TabsTrigger>
          <TabsTrigger value="tasks">任务管理</TabsTrigger>
          <TabsTrigger value="members">成员权限</TabsTrigger>
        </TabsList>

        {/* 修订历史 */}
        <TabsContent value="revisions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>修订历史</CardTitle>
                  <CardDescription>
                    查看文档的所有修订记录
                  </CardDescription>
                </div>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  导出历史
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRevisions.map((revision) => (
                  <div
                    key={revision.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent cursor-pointer"
                  >
                    <div className="flex-shrink-0">
                      {getChangeTypeIcon(revision.changeType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">版本 {revision.version}</span>
                        <span className="text-sm text-muted-foreground">
                          by {revision.userName}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {revision.changeSummary}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {revision.timestamp}
                        </span>
                        <span>{revision.changeCount} 处变更</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        对比
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 评论批注 */}
        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>评论批注</CardTitle>
              <CardDescription>
                查看和管理文档中的所有评论
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {comment.userName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{comment.userName}</div>
                          <div className="text-xs text-muted-foreground">
                            {comment.createdAt}
                          </div>
                        </div>
                      </div>
                      {comment.resolved ? (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          已解决
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          待处理
                        </Badge>
                      )}
                    </div>

                    <div className="pl-12">
                      <div className="p-2 bg-muted rounded text-sm mb-2">
                        "{comment.context}"
                      </div>
                      <div className="text-sm">{comment.content}</div>
                    </div>

                    {comment.replies.length > 0 && (
                      <div className="pl-12 space-y-2">
                        {comment.replies.map((reply) => (
                          <div
                            key={reply.id}
                            className="flex items-start gap-3 p-3 bg-muted rounded"
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {reply.userName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {reply.userName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {reply.createdAt}
                                </span>
                              </div>
                              <div className="text-sm mt-1">{reply.content}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pl-12 flex gap-2">
                      <Input
                        placeholder="回复评论..."
                        className="flex-1"
                      />
                      <Button size="sm">
                        <Send className="h-4 w-4" />
                      </Button>
                      {!comment.resolved && (
                        <Button size="sm" variant="outline">
                          标记已解决
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 任务管理 */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>任务管理</CardTitle>
              <CardDescription>
                分配和跟踪协作任务
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-lg">{task.title}</div>
                        <div className="flex items-center gap-2 mt-2">
                          {getTaskStatusBadge(task.status)}
                          {getPriorityBadge(task.priority)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">分配给：</span>
                        <span className="font-medium ml-2">{task.assigneeName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">截止日期：</span>
                        <span className="font-medium ml-2">{task.dueDate}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">查看详情</Button>
                      {task.status === 'pending' && (
                        <Button size="sm">开始处理</Button>
                      )}
                      {task.status === 'in_progress' && (
                        <Button size="sm">标记完成</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 成员权限 */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>成员权限</CardTitle>
              <CardDescription>
                管理协作成员和权限设置
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockMembers.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {member.userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {member.userName}
                          {member.isOnline && (
                            <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {member.isOnline ? '在线' : '离线'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getRoleBadge(member.role)}
                      <div className="flex gap-1">
                        {member.role !== 'owner' && (
                          <>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="font-medium mb-2">权限说明</div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>• <strong>所有者</strong>：完全控制权限，可管理所有内容</div>
                  <div>• <strong>编辑者</strong>：可编辑文档和添加评论</div>
                  <div>• <strong>审阅者</strong>：可查看文档和添加评论，不可编辑</div>
                  <div>• <strong>查看者</strong>：仅可查看文档，不可编辑或评论</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
