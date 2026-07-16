const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const {
  DEFAULT_EMPTY,
  HistoryView,
  buildHistorySummary,
  formatHistoryTimestamp,
} = require('../src/history-view');

function createView(options = {}) {
  const dom = new JSDOM('<div id="history"></div>');
  const containerEl = dom.window.document.getElementById('history');
  return {
    containerEl,
    document: dom.window.document,
    view: new HistoryView({ containerEl, ...options }),
  };
}

test('formatHistoryTimestamp and summary handle complete and empty records', () => {
  assert.equal(formatHistoryTimestamp('2026-07-16T08:15:00.000Z').includes('2026'), true);
  assert.equal(formatHistoryTimestamp(''), '');
  assert.equal(buildHistorySummary({
    stats: { duration: 61, totalWords: 20, fillers: 2, hedges: 1 },
  }), '时长 61秒 · 20字 · 密度 85%');
  assert.equal(buildHistorySummary({ stats: { duration: 0, totalWords: 0, fillers: 0, hedges: 0 } }), '时长 0秒 · 0字 · 密度 --');
});

test('HistoryView renders empty state when no records exist', () => {
  const { containerEl, view } = createView();

  view.render([]);

  assert.equal(containerEl.children.length, 1);
  assert.equal(containerEl.firstElementChild.className, 'history-empty');
  assert.equal(containerEl.firstElementChild.textContent, DEFAULT_EMPTY);
});

test('HistoryView renders history items in the given order', () => {
  const { containerEl, view } = createView();

  view.render([
    {
      id: 'newer',
      title: '训练 B',
      source: 'paste',
      updatedAt: '2026-07-16T08:00:00.000Z',
      excerpt: '第二条片段',
      stats: { duration: 0, totalWords: 30, fillers: 1, hedges: 1 },
    },
    {
      id: 'older',
      title: '训练 A',
      source: 'recording',
      updatedAt: '2026-07-15T08:00:00.000Z',
      excerpt: '第一条片段',
      stats: { duration: 10, totalWords: 20, fillers: 2, hedges: 1 },
    },
  ]);

  assert.deepEqual(
    Array.from(containerEl.querySelectorAll('.history-title')).map(el => el.textContent),
    ['训练 B', '训练 A'],
  );
  assert.equal(containerEl.querySelectorAll('.history-item').length, 2);
  assert.equal(containerEl.textContent.includes('第二条片段'), true);
});

test('HistoryView emits record selection on click and keyboard confirm', () => {
  const calls = [];
  const { containerEl, document, view } = createView({
    onSelect: record => calls.push(record.id),
  });
  const records = [{
    id: 'selected',
    title: '训练 A',
    source: 'recording',
    updatedAt: '2026-07-16T08:00:00.000Z',
    excerpt: '第一条片段',
    stats: { duration: 10, totalWords: 20, fillers: 2, hedges: 1 },
  }];

  view.render(records);
  const item = containerEl.querySelector('.history-item');
  item.click();
  item.dispatchEvent(new document.defaultView.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

  assert.deepEqual(calls, ['selected', 'selected']);
  assert.equal(item.getAttribute('role'), 'button');
  assert.equal(item.tabIndex, 0);
});
