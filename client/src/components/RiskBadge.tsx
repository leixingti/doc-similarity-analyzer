/**
 * 风险等级标注组件
 * 用于显示文档变化的风险等级
 */

import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface RiskBadgeProps {
  level: 'high' | 'medium' | 'low';
  category?: string;
  description?: string;
  className?: string;
}

export function RiskBadge({ level, category, description, className }: RiskBadgeProps) {
  const config = {
    high: {
      color: 'bg-red-100 text-red-800 border-red-300',
      icon: AlertCircle,
      label: '高风险',
      emoji: '🔴'
    },
    medium: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: AlertTriangle,
      label: '中风险',
      emoji: '🟡'
    },
    low: {
      color: 'bg-green-100 text-green-800 border-green-300',
      icon: Info,
      label: '低风险',
      emoji: '🟢'
    }
  };

  const { color, icon: Icon, label, emoji } = config[level];

  return (
    <Badge 
      variant="outline" 
      className={`${color} ${className} flex items-center gap-1`}
      title={description}
    >
      <span>{emoji}</span>
      <span className="font-medium">{label}</span>
      {category && <span className="text-xs">· {category}</span>}
    </Badge>
  );
}

/**
 * 风险统计卡片组件
 */
interface RiskStatisticsProps {
  statistics: {
    totalChanges: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    noRisk: number;
    riskCategories: Array<{ category: string; count: number }>;
  };
}

export function RiskStatistics({ statistics }: RiskStatisticsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-4 border rounded-lg bg-red-50 border-red-200">
        <div className="text-center">
          <p className="text-3xl font-bold text-red-600">{statistics.highRisk}</p>
          <p className="text-sm text-red-700 mt-1">🔴 高风险变化</p>
        </div>
      </div>
      
      <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
        <div className="text-center">
          <p className="text-3xl font-bold text-yellow-600">{statistics.mediumRisk}</p>
          <p className="text-sm text-yellow-700 mt-1">🟡 中风险变化</p>
        </div>
      </div>
      
      <div className="p-4 border rounded-lg bg-green-50 border-green-200">
        <div className="text-center">
          <p className="text-3xl font-bold text-green-600">{statistics.lowRisk}</p>
          <p className="text-sm text-green-700 mt-1">🟢 低风险变化</p>
        </div>
      </div>
      
      <div className="p-4 border rounded-lg bg-gray-50 border-gray-200">
        <div className="text-center">
          <p className="text-3xl font-bold text-gray-600">{statistics.noRisk}</p>
          <p className="text-sm text-gray-700 mt-1">⚪ 其他变化</p>
        </div>
      </div>
    </div>
  );
}

/**
 * 风险类别分布组件
 */
interface RiskCategoriesProps {
  categories: Array<{ category: string; count: number }>;
}

export function RiskCategories({ categories }: RiskCategoriesProps) {
  if (categories.length === 0) {
    return null;
  }

  // 按数量排序
  const sortedCategories = [...categories].sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">变化类别分布</h4>
      <div className="flex flex-wrap gap-2">
        {sortedCategories.map((cat, index) => (
          <Badge key={index} variant="secondary" className="text-sm">
            {cat.category} <span className="ml-1 font-bold">×{cat.count}</span>
          </Badge>
        ))}
      </div>
    </div>
  );
}
