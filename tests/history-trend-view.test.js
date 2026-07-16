const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { DEFAULT_EMPTY, HistoryTrendView } = require('../src/history-trend-view');

function createView(options = {}) {
  const dom = new JSDOM('<div id="history-trend"></div>');
  const containerEl = dom.window.document.getElementById('history-trend');
  return {
    document: dom.window.document,
    containerEl,
    view: new HistoryTrendView({ containerEl, ...options }),
  };
}

test('HistoryTrendView renders empty state when no sessions exist', () => {
  const { containerEl, view } = createView();

  view.render({ sessions: 0 });

  assert.equal(containerEl.textContent, DEFAULT_EMPTY);
});

test('HistoryTrendView renders trend snapshot and detail action', () => {
  const calls = [];
  const { containerEl, document, view } = createView({
    onOpenDetail: snapshot => calls.push(snapshot.sessions),
  });

  view.render({
    sessions: 3,
    windowSize: 5,
    latestDensity: 85,
    latestFillerRate: 5,
    latestHedgeRate: 2.5,
    densityDelta: -5,
    fillerRateDelta: -1.5,
    hedgeRateDelta: 0.2,
  });

  assert.equal(containerEl.textContent.includes('最近 3 次'), true);
  assert.equal(containerEl.textContent.includes('85%'), true);
  assert.equal(containerEl.textContent.includes('-5%'), true);

  document.getElementById('btn-open-history-trend').click();
  assert.deepEqual(calls, [3]);
});
