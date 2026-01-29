/**
 * 细微变化识别模块
 * 专门识别容易被忽略但可能有重大法律影响的细微变化
 */

export interface SubtleChange {
  type: 'punctuation' | 'unit' | 'auxiliary' | 'number' | 'date';
  oldValue: string;
  newValue: string;
  lineNumber: number;
  context: string;
  riskLevel: 'high' | 'medium' | 'low';
  description: string;
  legalImpact: string;
}

/**
 * 标点符号变化检测
 * 例如："违约金10万元。" vs "违约金10万元，"
 */
export function detectPunctuationChanges(
  oldText: string,
  newText: string
): SubtleChange[] {
  const changes: SubtleChange[] = [];
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  const maxLines = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i] || '';
    const newLine = newLines[i] || '';

    // 移除所有标点后比较
    const oldWithoutPunc = oldLine.replace(/[，。、；：！？""''（）【】《》]/g, '');
    const newWithoutPunc = newLine.replace(/[，。、；：！？""''（）【】《》]/g, '');

    // 如果去掉标点后内容相同，但原文不同，说明只有标点变化
    if (oldWithoutPunc === newWithoutPunc && oldLine !== newLine) {
      // 找出具体的标点变化
      const oldPuncs = oldLine.match(/[，。、；：！？""''（）【】《》]/g) || [];
      const newPuncs = newLine.match(/[，。、；：！？""''（）【】《》]/g) || [];

      if (oldPuncs.join('') !== newPuncs.join('')) {
        // 判断风险等级
        let riskLevel: 'high' | 'medium' | 'low' = 'low';
        let legalImpact = '标点符号变化可能影响语义理解';

        // 句号变逗号或逗号变句号 - 高风险
        if (
          (oldLine.includes('。') && newLine.includes('，') && !newLine.includes('。')) ||
          (oldLine.includes('，') && newLine.includes('。') && !oldLine.includes('。'))
        ) {
          riskLevel = 'high';
          legalImpact = '句号与逗号的变化可能改变句子的独立性和完整性，影响条款的法律效力';
        }
        // 顿号变逗号 - 中风险
        else if (
          (oldLine.includes('、') && newLine.includes('，')) ||
          (oldLine.includes('，') && newLine.includes('、'))
        ) {
          riskLevel = 'medium';
          legalImpact = '顿号与逗号的变化可能影响列举项的并列关系';
        }

        changes.push({
          type: 'punctuation',
          oldValue: oldPuncs.join(''),
          newValue: newPuncs.join(''),
          lineNumber: i + 1,
          context: oldLine,
          riskLevel,
          description: `标点符号从"${oldPuncs.join('')}"变为"${newPuncs.join('')}"`,
          legalImpact
        });
      }
    }
  }

  return changes;
}

/**
 * 数字单位变化检测
 * 例如："30个工作日" vs "30日"、"30天" vs "30个自然日"
 */
export function detectUnitChanges(
  oldText: string,
  newText: string
): SubtleChange[] {
  const changes: SubtleChange[] = [];
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  // 时间单位模式
  const timeUnitPatterns = [
    {
      pattern: /(\d+)\s*(个)?(工作日|自然日|日|天|小时|分钟)/g,
      extract: (match: RegExpMatchArray) => ({
        number: match[1],
        modifier: match[2] || '',
        unit: match[3]
      })
    }
  ];

  // 金额单位模式
  const amountUnitPatterns = [
    {
      pattern: /(人民币|美元|欧元)?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(元|万元|亿元|USD|EUR)/g,
      extract: (match: RegExpMatchArray) => ({
        currency: match[1] || '人民币',
        number: match[2],
        unit: match[3]
      })
    }
  ];

  const maxLines = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i] || '';
    const newLine = newLines[i] || '';

    // 检测时间单位变化
    for (const { pattern, extract } of timeUnitPatterns) {
      const oldMatches = Array.from(oldLine.matchAll(new RegExp(pattern.source, 'g')));
      const newMatches = Array.from(newLine.matchAll(new RegExp(pattern.source, 'g')));

      if (oldMatches.length > 0 && newMatches.length > 0) {
        oldMatches.forEach((oldMatch, idx) => {
          const newMatch = newMatches[idx];
          if (!newMatch) return;

          const oldData = extract(oldMatch as RegExpMatchArray);
          const newData = extract(newMatch as RegExpMatchArray);

          // 数字相同但单位不同
          if (oldData.number === newData.number) {
            const oldUnit = `${oldData.modifier}${oldData.unit}`;
            const newUnit = `${newData.modifier}${newData.unit}`;

            if (oldUnit !== newUnit) {
              let riskLevel: 'high' | 'medium' | 'low' = 'high';
              let legalImpact = '';

              // "工作日" vs "日" 或 "自然日"
              if (
                (oldUnit.includes('工作日') && !newUnit.includes('工作')) ||
                (!oldUnit.includes('工作') && newUnit.includes('工作日'))
              ) {
                riskLevel = 'high';
                legalImpact = '工作日与自然日的差异可能导致履行期限相差数天，影响违约责任的认定';
              }
              // "日" vs "天"
              else if (
                (oldUnit.includes('日') && newUnit.includes('天')) ||
                (oldUnit.includes('天') && newUnit.includes('日'))
              ) {
                riskLevel = 'medium';
                legalImpact = '"日"与"天"在法律上通常等同，但表述不一致可能引起歧义';
              }

              changes.push({
                type: 'unit',
                oldValue: oldMatch[0],
                newValue: newMatch[0],
                lineNumber: i + 1,
                context: oldLine,
                riskLevel,
                description: `时间单位从"${oldUnit}"变为"${newUnit}"`,
                legalImpact
              });
            }
          }
        });
      }
    }

    // 检测金额单位变化
    for (const { pattern, extract } of amountUnitPatterns) {
      const oldMatches = Array.from(oldLine.matchAll(new RegExp(pattern.source, 'g')));
      const newMatches = Array.from(newLine.matchAll(new RegExp(pattern.source, 'g')));

      if (oldMatches.length > 0 && newMatches.length > 0) {
        oldMatches.forEach((oldMatch, idx) => {
          const newMatch = newMatches[idx];
          if (!newMatch) return;

          const oldData = extract(oldMatch as RegExpMatchArray);
          const newData = extract(newMatch as RegExpMatchArray);

          // 数字相同但单位不同
          if (oldData.number === newData.number && oldData.unit !== newData.unit) {
            const riskLevel: 'high' = 'high';
            const legalImpact = '金额单位变化会导致实际金额相差巨大，严重影响合同履行';

            changes.push({
              type: 'unit',
              oldValue: oldMatch[0],
              newValue: newMatch[0],
              lineNumber: i + 1,
              context: oldLine,
              riskLevel,
              description: `金额单位从"${oldData.unit}"变为"${newData.unit}"`,
              legalImpact
            });
          }

          // 币种不同
          if (oldData.currency !== newData.currency) {
            changes.push({
              type: 'unit',
              oldValue: oldMatch[0],
              newValue: newMatch[0],
              lineNumber: i + 1,
              context: oldLine,
              riskLevel: 'high',
              description: `币种从"${oldData.currency}"变为"${newData.currency}"`,
              legalImpact: '币种变化会因汇率波动导致实际金额差异，影响合同履行'
            });
          }
        });
      }
    }
  }

  return changes;
}

/**
 * 助词变化检测
 * 例如："应当" vs "可以"、"必须" vs "应该"
 */
export function detectAuxiliaryChanges(
  oldText: string,
  newText: string
): SubtleChange[] {
  const changes: SubtleChange[] = [];
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  // 法律助词及其强度
  const auxiliaryWords = [
    { word: '必须', strength: 5, type: '强制性' },
    { word: '应当', strength: 4, type: '强制性' },
    { word: '应该', strength: 3, type: '建议性' },
    { word: '可以', strength: 2, type: '授权性' },
    { word: '可能', strength: 1, type: '不确定性' },
    { word: '不得', strength: 5, type: '禁止性' },
    { word: '禁止', strength: 5, type: '禁止性' },
    { word: '不应', strength: 4, type: '禁止性' },
  ];

  const maxLines = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i] || '';
    const newLine = newLines[i] || '';

    // 检查每个助词
    for (const oldAux of auxiliaryWords) {
      for (const newAux of auxiliaryWords) {
        if (oldAux.word === newAux.word) continue;

        // 检查是否存在助词替换
        const oldHas = oldLine.includes(oldAux.word);
        const newHas = newLine.includes(newAux.word);

        if (oldHas && newHas) {
          // 检查上下文是否相似（简单检查：去掉助词后的内容）
          const oldContext = oldLine.replace(oldAux.word, '___');
          const newContext = newLine.replace(newAux.word, '___');

          if (oldContext === newContext) {
            // 计算风险等级
            const strengthDiff = Math.abs(oldAux.strength - newAux.strength);
            let riskLevel: 'high' | 'medium' | 'low' = 'low';
            let legalImpact = '';

            if (strengthDiff >= 3) {
              riskLevel = 'high';
              legalImpact = `从${oldAux.type}变为${newAux.type}，改变了条款的法律约束力`;
            } else if (strengthDiff >= 2) {
              riskLevel = 'medium';
              legalImpact = `助词变化可能影响义务的强制程度`;
            } else {
              riskLevel = 'low';
              legalImpact = `助词变化可能影响表述的准确性`;
            }

            changes.push({
              type: 'auxiliary',
              oldValue: oldAux.word,
              newValue: newAux.word,
              lineNumber: i + 1,
              context: oldLine,
              riskLevel,
              description: `法律助词从"${oldAux.word}"（${oldAux.type}）变为"${newAux.word}"（${newAux.type}）`,
              legalImpact
            });
          }
        }
      }
    }
  }

  return changes;
}

/**
 * 数字变化检测（非单位相关）
 * 例如：百分比、数量、比例等
 */
export function detectNumberChanges(
  oldText: string,
  newText: string
): SubtleChange[] {
  const changes: SubtleChange[] = [];
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  // 百分比模式
  const percentPattern = /(\d+(?:\.\d+)?)\s*%/g;
  // 比例模式
  const ratioPattern = /(\d+)\s*:\s*(\d+)/g;
  // 纯数字模式（带上下文）
  const numberPattern = /(?:不超过|不少于|至少|最多|最少|超过)\s*(\d+(?:\.\d+)?)/g;

  const maxLines = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i] || '';
    const newLine = newLines[i] || '';

    // 检测百分比变化
    const oldPercents = Array.from(oldLine.matchAll(percentPattern));
    const newPercents = Array.from(newLine.matchAll(percentPattern));

    if (oldPercents.length > 0 && newPercents.length > 0) {
      oldPercents.forEach((oldMatch, idx) => {
        const newMatch = newPercents[idx];
        if (!newMatch) return;

        const oldValue = parseFloat(oldMatch[1]);
        const newValue = parseFloat(newMatch[1]);

        if (oldValue !== newValue) {
          const diff = Math.abs(oldValue - newValue);
          const riskLevel: 'high' | 'medium' | 'low' = diff >= 5 ? 'high' : diff >= 1 ? 'medium' : 'low';

          changes.push({
            type: 'number',
            oldValue: oldMatch[0],
            newValue: newMatch[0],
            lineNumber: i + 1,
            context: oldLine,
            riskLevel,
            description: `百分比从${oldValue}%变为${newValue}%`,
            legalImpact: '百分比变化可能影响利润分配、违约金计算等重要权益'
          });
        }
      });
    }

    // 检测比例变化
    const oldRatios = Array.from(oldLine.matchAll(ratioPattern));
    const newRatios = Array.from(newLine.matchAll(ratioPattern));

    if (oldRatios.length > 0 && newRatios.length > 0) {
      oldRatios.forEach((oldMatch, idx) => {
        const newMatch = newRatios[idx];
        if (!newMatch) return;

        if (oldMatch[0] !== newMatch[0]) {
          changes.push({
            type: 'number',
            oldValue: oldMatch[0],
            newValue: newMatch[0],
            lineNumber: i + 1,
            context: oldLine,
            riskLevel: 'high',
            description: `比例从${oldMatch[0]}变为${newMatch[0]}`,
            legalImpact: '比例变化可能影响股权分配、利润分配等核心权益'
          });
        }
      });
    }

    // 检测数量限制变化
    const oldNumbers = Array.from(oldLine.matchAll(numberPattern));
    const newNumbers = Array.from(newLine.matchAll(numberPattern));

    if (oldNumbers.length > 0 && newNumbers.length > 0) {
      oldNumbers.forEach((oldMatch, idx) => {
        const newMatch = newNumbers[idx];
        if (!newMatch) return;

        const oldValue = parseFloat(oldMatch[1]);
        const newValue = parseFloat(newMatch[1]);

        if (oldValue !== newValue) {
          changes.push({
            type: 'number',
            oldValue: oldMatch[0],
            newValue: newMatch[0],
            lineNumber: i + 1,
            context: oldLine,
            riskLevel: 'medium',
            description: `数量限制从${oldMatch[0]}变为${newMatch[0]}`,
            legalImpact: '数量限制变化可能影响合同履行的标准和要求'
          });
        }
      });
    }
  }

  return changes;
}

/**
 * 综合检测所有细微变化
 */
export function detectAllSubtleChanges(
  oldText: string,
  newText: string
): SubtleChange[] {
  const changes: SubtleChange[] = [];

  // 检测标点符号变化
  changes.push(...detectPunctuationChanges(oldText, newText));

  // 检测单位变化
  changes.push(...detectUnitChanges(oldText, newText));

  // 检测助词变化
  changes.push(...detectAuxiliaryChanges(oldText, newText));

  // 检测数字变化
  changes.push(...detectNumberChanges(oldText, newText));

  // 按行号排序
  changes.sort((a, b) => a.lineNumber - b.lineNumber);

  return changes;
}

/**
 * 生成细微变化报告
 */
export function generateSubtleChangeReport(changes: SubtleChange[]): string {
  if (changes.length === 0) {
    return '未发现细微变化';
  }

  const highRisk = changes.filter(c => c.riskLevel === 'high');
  const mediumRisk = changes.filter(c => c.riskLevel === 'medium');
  const lowRisk = changes.filter(c => c.riskLevel === 'low');

  let report = `发现${changes.length}处细微变化：\n\n`;

  if (highRisk.length > 0) {
    report += `⚠️ 高风险变化（${highRisk.length}处）：\n`;
    highRisk.forEach(change => {
      report += `  • 第${change.lineNumber}行：${change.description}\n`;
      report += `    影响：${change.legalImpact}\n`;
    });
    report += '\n';
  }

  if (mediumRisk.length > 0) {
    report += `⚡ 中风险变化（${mediumRisk.length}处）：\n`;
    mediumRisk.forEach(change => {
      report += `  • 第${change.lineNumber}行：${change.description}\n`;
    });
    report += '\n';
  }

  if (lowRisk.length > 0) {
    report += `ℹ️ 低风险变化（${lowRisk.length}处）：\n`;
    lowRisk.forEach(change => {
      report += `  • 第${change.lineNumber}行：${change.description}\n`;
    });
  }

  return report;
}
