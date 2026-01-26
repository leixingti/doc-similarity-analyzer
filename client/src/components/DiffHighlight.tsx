import { diffWords, Change } from 'diff';

interface DiffHighlightProps {
  text1: string;
  text2: string;
  label1?: string;
  label2?: string;
}

export function DiffHighlight({ text1, text2, label1 = "文档 A", label2 = "文档 B" }: DiffHighlightProps) {
  const diff = diffWords(text1, text2);

  const renderDiff = (changes: Change[], isFirstDoc: boolean) => {
    return changes.map((part, index) => {
      // 对于第一个文档：显示删除（红色）和未变化的部分
      // 对于第二个文档：显示新增（绿色）和未变化的部分
      if (isFirstDoc) {
        if (part.removed) {
          return (
            <span key={index} className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-0.5">
              {part.value}
            </span>
          );
        } else if (!part.added) {
          return <span key={index}>{part.value}</span>;
        }
        return null;
      } else {
        if (part.added) {
          return (
            <span key={index} className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-0.5">
              {part.value}
            </span>
          );
        } else if (!part.removed) {
          return <span key={index}>{part.value}</span>;
        }
        return null;
      }
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">{label1}</p>
        <div className="p-3 bg-background rounded border">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {renderDiff(diff, true)}
          </p>
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">{label2}</p>
        <div className="p-3 bg-background rounded border">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {renderDiff(diff, false)}
          </p>
        </div>
      </div>
    </div>
  );
}
