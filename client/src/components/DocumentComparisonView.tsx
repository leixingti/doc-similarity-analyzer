import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FileText, LayoutGrid, List, AlignLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as Diff from 'diff';

interface DocumentComparisonViewProps {
  document1Content: string;
  document2Content: string;
  document1Name: string;
  document2Name: string;
  similarity: number;
}

interface DiffChange {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  value: string;
  index: number;
}

export function DocumentComparisonView({
  document1Content,
  document2Content,
  document1Name,
  document2Name,
  similarity,
}: DocumentComparisonViewProps) {
  const [syncScroll, setSyncScroll] = useState(true);
  const [viewMode, setViewMode] = useState<'full' | 'diff'>('diff'); // 'full' = 完整文档, 'diff' = 差异片段
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const [selectedDiffIndex, setSelectedDiffIndex] = useState<number | null>(null);

  // 计算文档差异
  const diffChanges = Diff.diffWords(document1Content, document2Content);
  
  // 处理差异数据
  const leftChanges: DiffChange[] = [];
  const rightChanges: DiffChange[] = [];
  const diffList: { type: string; oldText?: string; newText?: string; index: number }[] = [];
  
  let leftIndex = 0;
  let rightIndex = 0;
  let diffIndex = 0;

  diffChanges.forEach((change) => {
    if (change.removed) {
      // 删除的内容只在左侧显示
      leftChanges.push({
        type: 'removed',
        value: change.value,
        index: diffIndex,
      });
      diffList.push({
        type: 'removed',
        oldText: change.value,
        index: diffIndex,
      });
      leftIndex++;
      diffIndex++;
    } else if (change.added) {
      // 新增的内容只在右侧显示
      rightChanges.push({
        type: 'added',
        value: change.value,
        index: diffIndex,
      });
      diffList.push({
        type: 'added',
        newText: change.value,
        index: diffIndex,
      });
      rightIndex++;
      diffIndex++;
    } else {
      // 未变化的内容两侧都显示
      leftChanges.push({
        type: 'unchanged',
        value: change.value,
        index: diffIndex,
      });
      rightChanges.push({
        type: 'unchanged',
        value: change.value,
        index: diffIndex,
      });
      leftIndex++;
      rightIndex++;
    }
  });

  // 统计信息
  const stats = {
    total: diffList.length,
    added: diffList.filter(d => d.type === 'added').length,
    removed: diffList.filter(d => d.type === 'removed').length,
    modified: 0, // 这里简化处理，可以后续优化
  };

  // 提取差异片段（带上下文）
  const extractDiffSegments = () => {
    const segments: Array<{
      leftContent: DiffChange[];
      rightContent: DiffChange[];
      index: number;
    }> = [];

    const contextSize = 20; // 上下文字符数

    diffList.forEach((diff, idx) => {
      // 找到对应的change
      const leftChange = leftChanges.find(c => c.index === diff.index && (c.type === 'removed' || c.type === 'unchanged'));
      const rightChange = rightChanges.find(c => c.index === diff.index && (c.type === 'added' || c.type === 'unchanged'));

      // 获取前后上下文
      const prevLeftChanges = leftChanges.slice(Math.max(0, leftChanges.indexOf(leftChange!) - 1), leftChanges.indexOf(leftChange!));
      const nextLeftChanges = leftChanges.slice(leftChanges.indexOf(leftChange!) + 1, leftChanges.indexOf(leftChange!) + 2);
      
      const prevRightChanges = rightChanges.slice(Math.max(0, rightChanges.indexOf(rightChange!) - 1), rightChanges.indexOf(rightChange!));
      const nextRightChanges = rightChanges.slice(rightChanges.indexOf(rightChange!) + 1, rightChanges.indexOf(rightChange!) + 2);

      if (diff.type !== 'unchanged') {
        segments.push({
          leftContent: [...prevLeftChanges, leftChange!, ...nextLeftChanges].filter(Boolean),
          rightContent: [...prevRightChanges, rightChange!, ...nextRightChanges].filter(Boolean),
          index: diff.index,
        });
      }
    });

    return segments;
  };

  const diffSegments = extractDiffSegments();

  // 同步滚动
  const handleScroll = (source: 'left' | 'right') => {
    if (!syncScroll) return;
    
    const sourceRef = source === 'left' ? leftScrollRef : rightScrollRef;
    const targetRef = source === 'left' ? rightScrollRef : leftScrollRef;
    
    if (sourceRef.current && targetRef.current) {
      targetRef.current.scrollTop = sourceRef.current.scrollTop;
    }
  };

  // 点击差异项跳转
  const scrollToDiff = (index: number) => {
    setSelectedDiffIndex(index);
    const element = document.getElementById(`diff-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // 获取背景颜色
  const getBackgroundColor = (type: string, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-blue-200 dark:bg-blue-900';
    }
    switch (type) {
      case 'added':
        return 'bg-green-100 dark:bg-green-950';
      case 'removed':
        return 'bg-red-100 dark:bg-red-950';
      case 'modified':
        return 'bg-orange-100 dark:bg-orange-950';
      default:
        return '';
    }
  };

  // 获取文本颜色
  const getTextColor = (type: string) => {
    switch (type) {
      case 'added':
        return 'text-green-700 dark:text-green-300';
      case 'removed':
        return 'text-red-700 dark:text-red-300';
      case 'modified':
        return 'text-orange-700 dark:text-orange-300';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* 顶部控制栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{similarity.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">文档相似度</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm">新增 {stats.added}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm">删除 {stats.removed}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-sm">修改 {stats.modified}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* 视图模式切换 */}
              <div className="flex items-center gap-2 border rounded-lg p-1">
                <Button
                  variant={viewMode === 'diff' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('diff')}
                  className="h-8"
                >
                  <List className="h-4 w-4 mr-1" />
                  差异片段
                </Button>
                <Button
                  variant={viewMode === 'full' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('full')}
                  className="h-8"
                >
                  <AlignLeft className="h-4 w-4 mr-1" />
                  完整文档
                </Button>
              </div>
              {/* 同步滚动 */}
              <div className="flex items-center gap-2">
                <Switch
                  id="sync-scroll"
                  checked={syncScroll}
                  onCheckedChange={setSyncScroll}
                />
                <Label htmlFor="sync-scroll">同步滚动</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 主对比区域 */}
      {viewMode === 'full' ? (
        /* 完整文档视图 */
        <div className="grid grid-cols-12 gap-4">
          {/* 左侧文档 */}
          <Card className="col-span-5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">原始文档: {document1Name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea
                className="h-[600px] w-full rounded-md border p-4"
                ref={leftScrollRef}
                onScroll={() => handleScroll('left')}
              >
                <div className="whitespace-pre-wrap text-sm">
                  {leftChanges.map((change, idx) => (
                    <span
                      key={idx}
                      id={`diff-${change.index}`}
                      className={`${getBackgroundColor(change.type, selectedDiffIndex === change.index)} ${getTextColor(change.type)}`}
                    >
                      {change.value}
                    </span>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* 右侧文档 */}
          <Card className="col-span-5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">对比文档: {document2Name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea
                className="h-[600px] w-full rounded-md border p-4"
                ref={rightScrollRef}
                onScroll={() => handleScroll('right')}
              >
                <div className="whitespace-pre-wrap text-sm">
                  {rightChanges.map((change, idx) => (
                    <span
                      key={idx}
                      className={`${getBackgroundColor(change.type, selectedDiffIndex === change.index)} ${getTextColor(change.type)}`}
                    >
                      {change.value}
                    </span>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* 差异列表 */}
          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">对比差异</CardTitle>
              </div>
              <CardDescription>
                共 {stats.total} 处差异
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {/* 统计卡片 */}
                  <div className="space-y-2 mb-4">
                    <div className="p-2 bg-muted rounded text-center">
                      <p className="text-sm font-medium">全部 {stats.total}</p>
                    </div>
                    <div className="p-2 bg-green-50 dark:bg-green-950 rounded text-center">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        新增 {stats.added}
                      </p>
                    </div>
                    <div className="p-2 bg-red-50 dark:bg-red-950 rounded text-center">
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">
                        删除 {stats.removed}
                      </p>
                    </div>
                    <div className="p-2 bg-orange-50 dark:bg-orange-950 rounded text-center">
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                        修改 {stats.modified}
                      </p>
                    </div>
                  </div>

                  {/* 差异列表 */}
                  {diffList.map((diff, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded cursor-pointer hover:bg-muted transition-colors ${
                        selectedDiffIndex === diff.index ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => scrollToDiff(diff.index)}
                    >
                      {diff.type === 'removed' && (
                        <div>
                          <Badge variant="destructive" className="mb-1">删除</Badge>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            原文档: {diff.oldText}
                          </p>
                        </div>
                      )}
                      {diff.type === 'added' && (
                        <div>
                          <Badge className="bg-green-500 mb-1">新增</Badge>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            新文档: {diff.newText}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* 差异片段视图 */
        <div className="space-y-4">
          {diffList.map((diff, idx) => (
            <Card key={idx} id={`diff-${diff.index}`} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">片段 #{idx + 1}</Badge>
                    {diff.type === 'removed' && <Badge variant="destructive">删除</Badge>}
                    {diff.type === 'added' && <Badge className="bg-green-500">新增</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* 左侧：原始文档 */}
                  {diff.oldText && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        原始文档
                      </div>
                      <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border-2 border-red-200 dark:border-red-800">
                        <p className="text-sm whitespace-pre-wrap text-red-700 dark:text-red-300">
                          {diff.oldText}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* 右侧：对比文档 */}
                  {diff.newText && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        对比文档
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-200 dark:border-green-800">
                        <p className="text-sm whitespace-pre-wrap text-green-700 dark:text-green-300">
                          {diff.newText}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
