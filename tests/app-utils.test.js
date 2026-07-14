const test = require('node:test');
const assert = require('node:assert/strict');
const {
  applyAnalysisToStats,
  buildOriginalTextFilename,
  buildOriginalTextMarkdown,
  buildReportFilename,
  buildReportMarkdown,
  calculateExpressionDensity,
  createEmptyStats,
  escapeHtml,
  formatTimer,
  getAnalysisHighlightTerms,
  getElapsedSeconds,
  getExportTimestamp,
  renderHighlightedText,
  splitTranscriptSentences,
} = require('../src/app-utils');

test('createEmptyStats returns the renderer stats baseline', () => {
  assert.deepEqual(createEmptyStats(), {
    fillers: 0,
    hedges: 0,
    vagueWords: 0,
    totalWords: 0,
    duration: 0,
  });
});

test('applyAnalysisToStats accumulates lexicon analysis counts', () => {
  const stats = createEmptyStats();
  applyAnalysisToStats(stats, {
    fillers: [{ word: '嗯' }],
    hedges: [{ word: '可能' }, { word: '大概' }],
    vagueWords: [{ word: '很好' }],
    totalWords: 12,
  });

  assert.deepEqual(stats, {
    fillers: 1,
    hedges: 2,
    vagueWords: 1,
    totalWords: 12,
    duration: 0,
  });
});

test('calculateExpressionDensity handles empty and populated stats', () => {
  assert.equal(calculateExpressionDensity(createEmptyStats()), '--');
  assert.equal(calculateExpressionDensity({
    fillers: 2,
    hedges: 1,
    vagueWords: 0,
    totalWords: 10,
    duration: 0,
  }), '70%');
});

test('timer helpers account for paused time and clamp negative values', () => {
  assert.equal(formatTimer(65), '01:05');
  assert.equal(getElapsedSeconds(1000, 2000, null, 10000), 7);
  assert.equal(getElapsedSeconds(10000, 0, null, 1000), 0);
});

test('splitTranscriptSentences keeps sentence punctuation with each segment', () => {
  assert.deepEqual(splitTranscriptSentences('第一句。第二句！\n第三句'), [
    '第一句。',
    '第二句！',
    '第三句',
  ]);
});

test('export helpers generate stable markdown and filenames', () => {
  const now = new Date('2026-07-14T09:08:00');
  const timestamp = getExportTimestamp(now);
  assert.equal(timestamp.dateStr, '2026-07-14');
  assert.equal(timestamp.timeStr, '0908');
  assert.equal(buildReportFilename(timestamp), 'omelet-表达训练-2026-07-14-0908.md');
  assert.equal(buildOriginalTextFilename(timestamp), 'omelet-表达训练-原文-2026-07-14-0908.md');

  const reportMarkdown = buildReportMarkdown({
    dateStr: timestamp.dateStr,
    stats: { duration: 61, totalWords: 120 },
    fullText: '完整原文',
    report: '## 建议',
  });
  assert.equal(reportMarkdown.includes('# omelet-表达训练系统报告'), true);
  assert.equal(reportMarkdown.includes('**时长**: 61秒'), true);
  assert.equal(reportMarkdown.includes('完整原文'), true);

  const originalMarkdown = buildOriginalTextMarkdown({
    dateStr: timestamp.dateStr,
    fullText: '逐字稿',
  });
  assert.equal(originalMarkdown.includes('# omelet-表达训练系统原文'), true);
  assert.equal(originalMarkdown.includes('逐字稿'), true);
});

test('escapeHtml escapes user transcript markup before subtitle rendering', () => {
  assert.equal(
    escapeHtml('<img src=x onerror="alert(1)">'),
    '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;',
  );
});

test('renderHighlightedText uses lexicon analysis terms and escapes unmatched text', () => {
  const html = renderHighlightedText('嗯我觉得很好<script>', {
    fillers: [{ word: '嗯' }],
    hedges: [{ word: '我觉得' }],
    vagueWords: [{ word: '很好' }],
  });

  assert.equal(
    html,
    '<span class="filler">嗯</span><span class="hedge">我觉得</span><span class="vague">很好</span>&lt;script&gt;',
  );
});

test('getAnalysisHighlightTerms de-duplicates and prefers longer matches first', () => {
  assert.deepEqual(getAnalysisHighlightTerms({
    fillers: [{ word: '嗯' }],
    hedges: [{ word: '我觉得' }, { word: '我觉得' }],
    vagueWords: [{ word: '觉得' }],
  }), [
    { word: '我觉得', type: 'hedge' },
    { word: '觉得', type: 'vague' },
    { word: '嗯', type: 'filler' },
  ]);
});
