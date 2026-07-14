const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { renderHighlightedText } = require('../src/app-utils');
const { DEFAULT_HINT, TranscriptView } = require('../src/transcript-view');

function createView() {
  const dom = new JSDOM(`
    <div id="scroll">
      <div id="container"></div>
    </div>
  `);
  const scrollEl = dom.window.document.getElementById('scroll');
  Object.defineProperty(scrollEl, 'scrollHeight', { value: 100, configurable: true });

  return {
    containerEl: dom.window.document.getElementById('container'),
    scrollEl,
    view: new TranscriptView({
      scrollEl,
      containerEl: dom.window.document.getElementById('container'),
      renderHighlightedText,
    }),
  };
}

test('TranscriptView renders and updates an interim subtitle line', () => {
  const { containerEl, scrollEl, view } = createView();

  view.renderInterim('正在识别');
  view.renderInterim('正在识别第二段');

  assert.equal(containerEl.children.length, 1);
  assert.equal(containerEl.firstElementChild.className, 'subtitle-line interim-line');
  assert.equal(containerEl.firstElementChild.textContent, '正在识别第二段');
  assert.equal(scrollEl.scrollTop, 100);
});

test('TranscriptView replaces interim text with highlighted final text', () => {
  const { containerEl, view } = createView();

  view.renderInterim('嗯我觉得很好');
  view.renderFinal('嗯我觉得很好<script>', {
    fillers: [{ word: '嗯' }],
    hedges: [{ word: '我觉得' }],
    vagueWords: [{ word: '很好' }],
  });

  assert.equal(containerEl.querySelector('.interim-line'), null);
  assert.equal(containerEl.querySelector('.filler').textContent, '嗯');
  assert.equal(containerEl.querySelector('.hedge').textContent, '我觉得');
  assert.equal(containerEl.querySelector('.vague').textContent, '很好');
  assert.equal(containerEl.innerHTML.includes('<script>'), false);
  assert.equal(containerEl.textContent, '嗯我觉得很好<script>');
});

test('TranscriptView marks the previous active final line as old', () => {
  const { containerEl, view } = createView();

  view.renderFinal('第一句');
  view.renderFinal('第二句');

  assert.equal(containerEl.children.length, 2);
  assert.equal(containerEl.children[0].className, 'subtitle-line old');
  assert.equal(containerEl.children[1].className, 'subtitle-line');
});

test('TranscriptView renders errors and reset hints', () => {
  const { containerEl, view } = createView();

  view.renderError('麦克风访问失败');
  assert.equal(containerEl.firstElementChild.textContent, '麦克风访问失败');
  assert.equal(containerEl.firstElementChild.style.color, 'rgb(255, 107, 107)');

  view.resetHint();
  assert.equal(containerEl.children.length, 1);
  assert.equal(containerEl.firstElementChild.className, 'subtitle-line hint');
  assert.equal(containerEl.firstElementChild.textContent, DEFAULT_HINT);
});
