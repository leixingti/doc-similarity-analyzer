import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: number;
    filename: string;
    fileType: string;
    fileUrl: string;
    extractedText: string | null;
    fileSize: number;
  } | null;
}

export function DocumentPreviewDialog({ open, onOpenChange, document }: DocumentPreviewDialogProps) {
  if (!document) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = () => {
    window.open(document.fileUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{document.filename}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                下载
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            文件类型: {document.fileType.toUpperCase()} · 大小: {formatFileSize(document.fileSize)}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
          {document.extractedText ? (
            <div className="whitespace-pre-wrap font-mono text-sm">
              {document.extractedText}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>无法预览此文档的文本内容</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
