import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface DocumentFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  fileTypeFilter: string;
  onFileTypeChange: (value: string) => void;
  dateFilter: string;
  onDateChange: (value: string) => void;
}

export function DocumentFilters({
  searchTerm,
  onSearchChange,
  fileTypeFilter,
  onFileTypeChange,
  dateFilter,
  onDateChange,
}: DocumentFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索文档名称..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={fileTypeFilter} onValueChange={onFileTypeChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="文件类型" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">所有类型</SelectItem>
          <SelectItem value="pdf">PDF</SelectItem>
          <SelectItem value="docx">Word (DOCX)</SelectItem>
          <SelectItem value="doc">Word (DOC)</SelectItem>
          <SelectItem value="txt">文本 (TXT)</SelectItem>
          <SelectItem value="md">Markdown</SelectItem>
          <SelectItem value="html">HTML</SelectItem>
          <SelectItem value="pptx">PowerPoint</SelectItem>
          <SelectItem value="xlsx">Excel</SelectItem>
        </SelectContent>
      </Select>
      <Select value={dateFilter} onValueChange={onDateChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="上传时间" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">所有时间</SelectItem>
          <SelectItem value="today">今天</SelectItem>
          <SelectItem value="week">最近7天</SelectItem>
          <SelectItem value="month">最近30天</SelectItem>
          <SelectItem value="year">最近一年</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
