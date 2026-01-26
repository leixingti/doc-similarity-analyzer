import * as Diff from 'diff';

export interface VersionComparisonResult {
  version1: {
    documentId: number;
    filename: string;
    content: string;
  };
  version2: {
    documentId: number;
    filename: string;
    content: string;
  };
  statistics: {
    totalLines: number;
    addedLines: number;
    deletedLines: number;
    modifiedLines: number;
    unchangedLines: number;
    modificationRate: number; // 修改率百分比
  };
  changes: Array<{
    type: 'added' | 'deleted' | 'modified' | 'unchanged';
    lineNumber: number;
    oldContent?: string;
    newContent?: string;
    context?: string;
  }>;
  changeLevel: 'minimal' | 'light' | 'moderate' | 'significant'; // 变化程度
}

/**
 * 对比两个文档版本
 */
export async function compareDocumentVersions(
  doc1Content: string,
  doc2Content: string,
  doc1Info: { id: number; filename: string },
  doc2Info: { id: number; filename: string }
): Promise<VersionComparisonResult> {
  // 按行分割文本
  const lines1 = doc1Content.split('\n');
  const lines2 = doc2Content.split('\n');

  // 使用diff库计算差异
  const diffResult = Diff.diffLines(doc1Content, doc2Content);

  // 统计变化
  let addedLines = 0;
  let deletedLines = 0;
  let unchangedLines = 0;
  const changes: VersionComparisonResult['changes'] = [];
  let currentLineNumber = 0;

  diffResult.forEach((part) => {
    const lines = part.value.split('\n').filter(line => line.length > 0 || part.value.endsWith('\n'));
    
    if (part.added) {
      addedLines += lines.length;
      lines.forEach((line, index) => {
        changes.push({
          type: 'added',
          lineNumber: currentLineNumber + index + 1,
          newContent: line,
        });
      });
      currentLineNumber += lines.length;
    } else if (part.removed) {
      deletedLines += lines.length;
      lines.forEach((line, index) => {
        changes.push({
          type: 'deleted',
          lineNumber: currentLineNumber + index + 1,
          oldContent: line,
        });
      });
    } else {
      unchangedLines += lines.length;
      currentLineNumber += lines.length;
    }
  });

  // 计算修改的行数（同时有删除和添加的视为修改）
  const modifiedLines = Math.min(addedLines, deletedLines);
  const pureAddedLines = addedLines - modifiedLines;
  const pureDeletedLines = deletedLines - modifiedLines;

  const totalLines = Math.max(lines1.length, lines2.length);
  const changedLines = pureAddedLines + pureDeletedLines + modifiedLines;
  const modificationRate = totalLines > 0 ? (changedLines / totalLines) * 100 : 0;

  // 确定变化程度
  let changeLevel: VersionComparisonResult['changeLevel'];
  if (modificationRate < 5) {
    changeLevel = 'minimal'; // 微小变化
  } else if (modificationRate < 20) {
    changeLevel = 'light'; // 轻度变化
  } else if (modificationRate < 50) {
    changeLevel = 'moderate'; // 中度变化
  } else {
    changeLevel = 'significant'; // 重大变化
  }

  return {
    version1: {
      documentId: doc1Info.id,
      filename: doc1Info.filename,
      content: doc1Content,
    },
    version2: {
      documentId: doc2Info.id,
      filename: doc2Info.filename,
      content: doc2Content,
    },
    statistics: {
      totalLines,
      addedLines: pureAddedLines,
      deletedLines: pureDeletedLines,
      modifiedLines,
      unchangedLines,
      modificationRate: Math.round(modificationRate * 100) / 100,
    },
    changes,
    changeLevel,
  };
}

/**
 * 批量对比多个版本
 */
export async function compareMultipleVersions(
  versions: Array<{ id: number; filename: string; content: string }>
): Promise<Array<{ from: number; to: number; result: VersionComparisonResult }>> {
  const results: Array<{ from: number; to: number; result: VersionComparisonResult }> = [];

  for (let i = 0; i < versions.length - 1; i++) {
    const result = await compareDocumentVersions(
      versions[i].content,
      versions[i + 1].content,
      { id: versions[i].id, filename: versions[i].filename },
      { id: versions[i + 1].id, filename: versions[i + 1].filename }
    );
    results.push({
      from: versions[i].id,
      to: versions[i + 1].id,
      result,
    });
  }

  return results;
}
