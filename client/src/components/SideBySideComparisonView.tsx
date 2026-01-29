import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Change {
  type: 'added' | 'deleted' | 'modified' | 'unchanged';
  lineNumber: number;
  oldContent?: string;
  newContent?: string;
}

interface ComparisonResult {
  changes: Change[];
  statistics: {
    totalLines: number;
    addedLines: number;
    deletedLines: number;
    modifiedLines: number;
    unchangedLines: number;
    modificationRate: number;
  };
  changeLevel: string;
}

interface SideBySideComparisonViewProps {
  comparisonResult: ComparisonResult;
  document1Name: string;
  document2Name: string;
  onBack: () => void;
}

export function SideBySideComparisonView({
  comparisonResult,
  document1Name,
  document2Name,
  onBack,
}: SideBySideComparisonViewProps) {
  const [syncScroll, setSyncScroll] = useState(true);
  const [alignDocs, setAlignDocs] = useState(false);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const [selectedDiff, setSelectedDiff] = useState<number | null>(null);

  // 同步滚动
  const handleScroll = (source: 'left' | 'right') => {
    if (!syncScroll) return;

    const sourceRef = source === 'left' ? leftScrollRef : rightScrollRef;
    const targetRef = source === 'left' ? rightScrollRef : leftScrollRef;

    if (sourceRef.current && targetRef.current) {
      targetRef.current.scrollTop = sourceRef.current.scrollTop;
    }
  };

  // 构建左右两侧的内容
  const buildSideContent = (side: 'left' | 'right') => {
    return comparisonResult.changes.map((change, index) => {
      const content = side === 'left' ? change.oldContent : change.newContent;
      const showLine = side === 'left' 
        ? (change.type === 'deleted' || change.type === 'modified' || change.type === 'unchanged')
        : (change.type === 'added' || change.type === 'modified' || change.type === 'unchanged');

      if (!showLine && alignDocs) {
        // 对齐模式下，显示空行
        return (
          <div
            key={index}
            className="flex items-start gap-2 py-2 px-3 border-b border-gray-100 min-h-[40px] bg-gray-50"
          >
            <span className="text-xs text-gray-400 w-12 flex-shrink-0"></span>
            <div className="flex-1"></div>
          </div>
        );
      }

      if (!showLine) {
        return null;
      }

      let bgColor = '';
      let textColor = '';
      let borderColor = '';

      if (change.type === 'added' && side === 'right') {
        bgColor = 'bg-green-50';
        textColor = 'text-green-900';
        borderColor = 'border-l-4 border-l-green-500';
      } else if (change.type === 'deleted' && side === 'left') {
        bgColor = 'bg-red-50';
        textColor = 'text-red-900';
        borderColor = 'border-l-4 border-l-red-500';
      } else if (change.type === 'modified') {
        bgColor = 'bg-orange-50';
        textColor = 'text-orange-900';
        borderColor = 'border-l-4 border-l-orange-500';
      }

      return (
        <div
          key={index}
          className={`flex items-start gap-2 py-2 px-3 border-b border-gray-100 min-h-[40px] ${bgColor} ${borderColor} ${
            selectedDiff === index ? 'ring-2 ring-blue-500' : ''
          } cursor-pointer hover:bg-opacity-80 transition-colors`}
          onClick={() => setSelectedDiff(index)}
        >
          <span className="text-xs text-gray-500 w-12 flex-shrink-0 font-mono">
            {change.lineNumber}
          </span>
          <div className={`flex-1 text-sm font-mono whitespace-pre-wrap break-words ${textColor}`}>
            {content || ' '}
          </div>
        </div>
      );
    });
  };

  // 滚动到指定差异
  const scrollToDiff = (index: number) => {
    setSelectedDiff(index);
    // 简单实现：滚动到大致位置
    if (leftScrollRef.current) {
      const lineHeight = 40; // 估算的行高
      leftScrollRef.current.scrollTop = index * lineHeight;
    }
    if (rightScrollRef.current) {
      const lineHeight = 40;
      rightScrollRef.current.scrollTop = index * lineHeight;
    }
  };

  // 只显示有差异的变化
  const differencesOnly = comparisonResult.changes.filter(
    (change) => change.type !== 'unchanged'
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回对比
            </Button>
            <div>
              <span className="text-lg font-semibold">文档相似度: </span>
              <span className="text-lg font-bold text-blue-600">
                {(100 - comparisonResult.statistics.modificationRate).toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="sync-scroll"
                checked={syncScroll}
                onCheckedChange={setSyncScroll}
              />
              <Label htmlFor="sync-scroll" className="text-sm cursor-pointer">
                同步滚动
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="align-docs"
                checked={alignDocs}
                onCheckedChange={setAlignDocs}
              />
              <Label htmlFor="align-docs" className="text-sm cursor-pointer">
                文档对齐
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm">新增</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm">删除</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-sm">修改</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* 左侧文档 */}
        <div className="flex-1 border-r">
          <div className="bg-gray-100 border-b px-4 py-3">
            <h3 className="font-semibold text-sm">原始文档: {document1Name}</h3>
          </div>
          <div
            ref={leftScrollRef}
            className="h-[calc(100%-3rem)] overflow-y-auto"
            onScroll={() => handleScroll('left')}
          >
            {buildSideContent('left')}
          </div>
        </div>

        {/* 右侧文档 */}
        <div className="flex-1 border-r">
          <div className="bg-gray-100 border-b px-4 py-3">
            <h3 className="font-semibold text-sm">对比文档: {document2Name}</h3>
          </div>
          <div
            ref={rightScrollRef}
            className="h-[calc(100%-3rem)] overflow-y-auto"
            onScroll={() => handleScroll('right')}
          >
            {buildSideContent('right')}
          </div>
        </div>

        {/* 右侧差异列表 */}
        <div className="w-96 bg-gray-50 flex flex-col">
          <div className="bg-white border-b px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">对比差异</h3>
              <Badge variant="outline" className="text-lg font-bold">
                {differencesOnly.length}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">已忽略</span>
              <span className="font-medium">0</span>
            </div>
          </div>

          <div className="px-4 py-3 bg-white border-b">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">全部</div>
                <div className="font-bold">{comparisonResult.statistics.totalLines}</div>
              </div>
              <div>
                <div className="text-green-600 mb-1">新增</div>
                <div className="font-bold text-green-600">
                  {comparisonResult.statistics.addedLines}
                </div>
              </div>
              <div>
                <div className="text-red-600 mb-1">删除</div>
                <div className="font-bold text-red-600">
                  {comparisonResult.statistics.deletedLines}
                </div>
              </div>
            </div>
            <div className="mt-2 text-sm">
              <div className="text-orange-600 mb-1">修改</div>
              <div className="font-bold text-orange-600">
                {comparisonResult.statistics.modifiedLines}
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {differencesOnly.map((change, index) => {
                const originalIndex = comparisonResult.changes.indexOf(change);
                return (
                  <div
                    key={originalIndex}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedDiff === originalIndex
                        ? 'ring-2 ring-blue-500 shadow-md'
                        : 'hover:shadow-sm'
                    } ${
                      change.type === 'added'
                        ? 'bg-green-50 border-green-200'
                        : change.type === 'deleted'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-orange-50 border-orange-200'
                    }`}
                    onClick={() => scrollToDiff(originalIndex)}
                  >
                    <div className="mb-2">
                      <Badge
                        variant="outline"
                        className={
                          change.type === 'added'
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : change.type === 'deleted'
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : 'bg-orange-100 text-orange-800 border-orange-300'
                        }
                      >
                        {change.type === 'added' ? '删除' : change.type === 'deleted' ? '新疆' : '修改'}
                      </Badge>
                    </div>

                    <div className="text-sm space-y-1">
                      <div className="font-semibold text-gray-700">
                        原文档: {change.oldContent ? change.oldContent.substring(0, 30) : '无'}
                        {change.oldContent && change.oldContent.length > 30 && '...'}
                      </div>
                      {change.type === 'modified' && (
                        <>
                          <div className="text-orange-600 font-semibold">修改:</div>
                          <div className="text-gray-700">
                            {change.newContent ? change.newContent.substring(0, 30) : '无'}
                            {change.newContent && change.newContent.length > 30 && '...'}
                          </div>
                        </>
                      )}
                      {change.type === 'deleted' && (
                        <div className="text-red-600 text-xs">已删除此内容</div>
                      )}
                      {change.type === 'added' && (
                        <>
                          <div className="text-green-600 font-semibold">新增:</div>
                          <div className="text-gray-700">
                            {change.newContent ? change.newContent.substring(0, 30) : '无'}
                            {change.newContent && change.newContent.length > 30 && '...'}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
