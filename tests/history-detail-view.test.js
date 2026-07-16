const test = require('node:test');
const assert = require('node:assert/strict');
const { HistoryDetailView } = require('../src/history-detail-view');

function createView() {
  return new HistoryDetailView({
    escapeHtml: value => String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;'),
    formatHistoryTimestamp: value => `formatted:${value}`,
    renderMarkdown: value => `<p>${value}</p>`,
  });
}

test('HistoryDetailView renders summary, transcript, report, and restore action', () => {
  const view = createView();
  const html = view.render({
    title: '训练记录',
    source: 'recording',
    createdAt: '2026-07-16T08:00:00.000Z',
    updatedAt: '2026-07-16T09:00:00.000Z',
    fullText: '完整原文',
    report: '## 报告',
    stats: {
      duration: 60,
      totalWords: 20,
      fillers: 2,
      hedges: 1,
    },
  });

  assert.equal(html.includes('录音训练'), true);
  assert.equal(html.includes('formatted:2026-07-16T09:00:00.000Z'), true);
  assert.equal(html.includes('恢复到当前工作区'), true);
  assert.equal(html.includes('<p>## 报告</p>'), true);
  assert.equal(html.includes('85%'), true);
});

test('HistoryDetailView omits report block when no report exists', () => {
  const view = createView();
  const html = view.render({
    title: '无报告训练',
    source: 'paste',
    updatedAt: '2026-07-16T09:00:00.000Z',
    fullText: '原文',
    report: '',
    stats: {
      duration: 0,
      totalWords: 0,
      fillers: 0,
      hedges: 0,
    },
  });

  assert.equal(html.includes('历史报告'), false);
  assert.equal(html.includes('--'), true);
});
