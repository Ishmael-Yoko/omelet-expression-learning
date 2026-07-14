const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { PasteModalView } = require('../src/paste-modal-view');

function createView() {
  const dom = new JSDOM(`
    <div id="modal" class="modal hidden">
      <textarea id="textarea">旧文本</textarea>
      <button id="close"></button>
      <button id="analyze"></button>
    </div>
  `);
  const document = dom.window.document;
  const calls = { analyze: 0 };
  const view = new PasteModalView({
    modalEl: document.getElementById('modal'),
    textareaEl: document.getElementById('textarea'),
    closeButtonEl: document.getElementById('close'),
    analyzeButtonEl: document.getElementById('analyze'),
    onAnalyze: () => { calls.analyze += 1; },
  });

  return { calls, document, view };
}

test('PasteModalView opens by clearing and focusing the textarea', () => {
  const { document, view } = createView();

  view.open();

  assert.equal(document.getElementById('modal').classList.contains('hidden'), false);
  assert.equal(document.getElementById('textarea').value, '');
  assert.equal(document.activeElement, document.getElementById('textarea'));
});

test('PasteModalView closes and returns trimmed text', () => {
  const { document, view } = createView();

  document.getElementById('textarea').value = '  第一段逐字稿  ';
  assert.equal(view.getText(), '第一段逐字稿');

  view.close();
  assert.equal(document.getElementById('modal').classList.contains('hidden'), true);
});

test('PasteModalView binds close and analyze actions', () => {
  const { calls, document, view } = createView();

  view.bind();
  view.open();
  document.getElementById('analyze').click();
  document.getElementById('close').click();

  assert.equal(calls.analyze, 1);
  assert.equal(document.getElementById('modal').classList.contains('hidden'), true);
});
