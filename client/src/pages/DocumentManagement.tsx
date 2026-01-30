import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Folder, 
  FileText, 
  Search, 
  Plus, 
  Filter,
  Calendar,
  User,
  BarChart3,
  FolderOpen,
  File,
  Tag
} from "lucide-react";

export default function DocumentManagement() {
  useAuth();
  const [activeTab, setActiveTab] = useState("cases");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">文档管理</h1>
          <p className="text-muted-foreground mt-1">
            管理案件卷宗、文档归档、全文检索
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            筛选
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新建案件
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总案件数</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              进行中 18 个
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总文档数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              本月新增 23 个
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">存储空间</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4 GB</div>
            <p className="text-xs text-muted-foreground">
              已使用 48%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">
              本周开庭 3 个
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索案件、文档、当事人..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button>搜索</Button>
          </div>
        </CardContent>
      </Card>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cases">
            <FolderOpen className="mr-2 h-4 w-4" />
            案件管理
          </TabsTrigger>
          <TabsTrigger value="documents">
            <File className="mr-2 h-4 w-4" />
            文档管理
          </TabsTrigger>
          <TabsTrigger value="search">
            <Search className="mr-2 h-4 w-4" />
            全文检索
          </TabsTrigger>
        </TabsList>

        {/* 案件管理 */}
        <TabsContent value="cases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>案件列表</CardTitle>
              <CardDescription>
                管理所有案件信息和关联文档
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 案件列表项 */}
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Folder className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">
                          (2024)京0105民初12345号
                        </div>
                        <div className="text-sm text-muted-foreground">
                          张三诉李四合同纠纷案
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            北京市朝阳区人民法院
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            2024-01-15
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            12 个文档
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                        进行中
                      </span>
                      <Button variant="ghost" size="sm">
                        查看详情
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 文档管理 */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>文档列表</CardTitle>
              <CardDescription>
                查看和管理所有文档
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 文档列表项 */}
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">民事起诉状.docx</div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>(2024)京0105民初12345号</span>
                          <span>诉讼文书</span>
                          <span>156 KB</span>
                          <span>2024-01-20</span>
                        </div>
                        <div className="flex gap-1 mt-2">
                          <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700">
                            <Tag className="inline h-3 w-3 mr-1" />
                            起诉状
                          </span>
                          <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700">
                            <Tag className="inline h-3 w-3 mr-1" />
                            重要
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        预览
                      </Button>
                      <Button variant="ghost" size="sm">
                        下载
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 全文检索 */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>全文检索</CardTitle>
              <CardDescription>
                在所有文档中搜索关键词
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>输入关键词开始搜索</p>
                  <p className="text-sm mt-2">
                    支持搜索文件名、文档内容、描述和备注
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
