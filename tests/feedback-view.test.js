const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { DEFAULT_EMPTY, FeedbackView, classifyFeedback } = require('../src/feedback-view');

function createView(options = {}) {
  const dom = new JSDOM('<div id="feedback"></div>');
  const containerEl = dom.window.document.getElementById('feedback');
  return {
    containerEl,
    view: new FeedbackView({ containerEl, ...options }),
  };
}

test('classifyFeedback maps common feedback copy to semantic types', () => {
  assert.equal(classifyFeedback('✓ 保持这个节奏'), 'good');
  assert.equal(classifyFeedback('「嗯」出现较多'), 'filler');
  assert.equal(classifyFeedback('「可能」 -> 直接说'), 'hedge');
  assert.equal(classifyFeedback('「很好」 -> 出色 / 精彩'), 'vague');
  assert.equal(classifyFeedback('建议补充一个例子'), 'ai');
});

test('FeedbackView clears to the configured empty state', () => {
  const { containerEl, view } = createView();

  view.add('建议补充一个例子');
  view.clear();

  assert.equal(containerEl.children.length, 1);
  assert.equal(containerEl.firstElementChild.className, 'feedback-empty');
  assert.equal(containerEl.firstElementChild.textContent, DEFAULT_EMPTY);
});

test('FeedbackView inserts newest feedback first and removes empty state', () => {
  const { containerEl, view } = createView();

  view.clear();
  view.add('第一条', 'ai');
  view.add('第二条', 'good');

  assert.equal(containerEl.querySelector('.feedback-empty'), null);
  assert.deepEqual(Array.from(containerEl.children).map(el => el.textContent), ['第二条', '第一条']);
  assert.equal(containerEl.firstElementChild.className, 'feedback-item type-good');
});

test('FeedbackView de-duplicates recent feedback items', () => {
  const { containerEl, view } = createView();

  assert.equal(view.add('重复建议', 'ai'), true);
  assert.equal(view.add('重复建议', 'ai'), false);

  assert.equal(containerEl.querySelectorAll('.feedback-item').length, 1);
});

test('FeedbackView trims items over the configured max count', () => {
  const { containerEl, view } = createView({ maxItems: 3 });

  ['一', '二', '三', '四'].forEach(text => view.add(text, 'ai'));

  assert.deepEqual(Array.from(containerEl.children).map(el => el.textContent), ['四', '三', '二']);
});
