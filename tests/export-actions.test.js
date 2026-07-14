const test = require('node:test');
const assert = require('node:assert/strict');
const { ExportActions } = require('../src/export-actions');
const {
  buildOriginalTextFilename,
  buildOriginalTextMarkdown,
  buildReportFilename,
  buildReportMarkdown,
  getExportTimestamp,
} = require('../src/app-utils');

function createActions() {
  const calls = {
    copied: [],
    saved: [],
  };

  const actions = new ExportActions({
    buildOriginalTextFilename,
    buildOriginalTextMarkdown,
    buildReportFilename,
    buildReportMarkdown,
    getExportTimestamp,
    now: () => new Date('2026-07-14T09:08:00'),
    saveFile: async (content, filename) => {
      calls.saved.push({ content, filename });
      return { success: true, filename };
    },
    writeClipboard: async text => {
      calls.copied.push(text);
    },
  });

  return { actions, calls };
}

test('ExportActions skips empty copy and save requests', async () => {
  const { actions, calls } = createActions();

  assert.deepEqual(await actions.copyOriginalText('  '), { success: false, skipped: true });
  assert.deepEqual(await actions.saveOriginalText(''), { success: false, skipped: true });
  assert.deepEqual(
    await actions.saveReport({ report: '', stats: {}, fullText: 'text' }),
    { success: false, skipped: true },
  );
  assert.deepEqual(calls.copied, []);
  assert.deepEqual(calls.saved, []);
});

test('ExportActions copies original transcript text', async () => {
  const { actions, calls } = createActions();

  const result = await actions.copyOriginalText('逐字稿');

  assert.deepEqual(result, { success: true });
  assert.deepEqual(calls.copied, ['逐字稿']);
});

test('ExportActions saves original transcript markdown', async () => {
  const { actions, calls } = createActions();

  const result = await actions.saveOriginalText('完整原文');

  assert.equal(result.success, true);
  assert.equal(calls.saved[0].filename, 'omelet-表达训练-原文-2026-07-14-0908.md');
  assert.equal(calls.saved[0].content.includes('# omelet-表达训练系统原文'), true);
  assert.equal(calls.saved[0].content.includes('完整原文'), true);
});

test('ExportActions saves report markdown', async () => {
  const { actions, calls } = createActions();

  const result = await actions.saveReport({
    report: '## 训练建议',
    stats: { duration: 90, totalWords: 160 },
    fullText: '完整原文',
  });

  assert.equal(result.success, true);
  assert.equal(calls.saved[0].filename, 'omelet-表达训练-2026-07-14-0908.md');
  assert.equal(calls.saved[0].content.includes('**时长**: 90秒'), true);
  assert.equal(calls.saved[0].content.includes('## 训练建议'), true);
});
