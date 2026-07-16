const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const {
  COPIED_LABEL,
  COPY_LABEL,
  SAVED_LABEL,
  SAVE_LABEL,
  ReportView,
} = require('../src/report-view');

function createView(options = {}) {
  const dom = new JSDOM(`
    <div id="modal" class="modal hidden">
      <button id="copy">${COPY_LABEL}</button>
      <button id="close">关闭</button>
      <div id="body"></div>
    </div>
  `);
  const document = dom.window.document;
  const calls = { copied: [], saved: 0 };
  const view = new ReportView({
    modalEl: document.getElementById('modal'),
    bodyEl: document.getElementById('body'),
    closeButtonEl: document.getElementById('close'),
    copyButtonEl: document.getElementById('copy'),
    renderMarkdown: markdown => `<h1>${markdown}</h1>`,
    copyText: text => {
      calls.copied.push(text);
      return Promise.resolve();
    },
    onSave: () => {
      calls.saved += 1;
    },
    resetDelay: 1,
    ...options,
  });

  return { calls, document, view };
}

test('ReportView opens loading state and can close from the bound button', () => {
  const { document, view } = createView();

  view.bind();
  view.openLoading();
  assert.equal(document.getElementById('modal').classList.contains('hidden'), false);
  assert.equal(document.querySelector('.report-status').textContent, '正在生成报告...');

  document.getElementById('close').click();
  assert.equal(document.getElementById('modal').classList.contains('hidden'), true);
});

test('ReportView renders sanitized markdown output and wires save button', () => {
  const { calls, document, view } = createView({
    renderMarkdown: markdown => `<p>${markdown}</p>`,
  });

  view.render('报告正文');
  assert.equal(document.querySelector('.report-actions button').textContent, SAVE_LABEL);
  assert.equal(document.querySelector('#body p').textContent, '报告正文');

  document.getElementById('btn-save-report').click();
  assert.equal(calls.saved, 1);
});

test('ReportView can render custom HTML blocks without save actions', () => {
  const { document, view } = createView();

  view.renderHtml('<section class="history-detail"><h2>历史详情</h2></section>');

  assert.equal(document.getElementById('modal').classList.contains('hidden'), false);
  assert.equal(document.querySelector('.history-detail h2').textContent, '历史详情');
  assert.equal(document.getElementById('btn-save-report'), null);
});

test('ReportView shows text-safe error messages', () => {
  const { document, view } = createView();

  view.showError('<失败>');

  assert.equal(document.querySelector('.report-error').textContent, '生成失败: <失败>');
  assert.equal(document.getElementById('body').innerHTML.includes('<失败>'), false);
});

test('ReportView marks save and copy actions as completed', async () => {
  const { calls, document, view } = createView();
  view.bind();
  view.render('正文');

  view.markSaved();
  assert.equal(document.getElementById('btn-save-report').textContent, SAVED_LABEL);

  await view.copyRenderedText();
  assert.equal(calls.copied.length, 1);
  assert.equal(document.getElementById('copy').textContent, COPIED_LABEL);
});
