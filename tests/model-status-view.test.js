const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { ModelStatusView, getMissingFilesText } = require('../src/model-status-view');

function createView() {
  const dom = new JSDOM(`
    <div id="status" class="model-status model-status-checking">
      <span id="text"></span>
      <div id="actions" class="hidden">
        <button id="open"></button>
        <button id="refresh"></button>
        <a id="download"></a>
      </div>
    </div>
  `);
  const document = dom.window.document;
  const calls = { open: 0, refresh: 0 };
  const view = new ModelStatusView({
    statusEl: document.getElementById('status'),
    textEl: document.getElementById('text'),
    actionsEl: document.getElementById('actions'),
    downloadLinkEl: document.getElementById('download'),
    openButtonEl: document.getElementById('open'),
    refreshButtonEl: document.getElementById('refresh'),
    onOpenModelsDir: () => { calls.open += 1; },
    onRefresh: () => { calls.refresh += 1; },
  });

  return { calls, document, view };
}

test('getMissingFilesText returns joined missing files or a fallback', () => {
  assert.equal(getMissingFilesText({ candidates: [{ missingFiles: ['a.onnx', 'tokens.txt'] }] }), 'a.onnx、tokens.txt');
  assert.equal(getMissingFilesText({ candidates: [{ missingFiles: [] }] }), '未知文件');
  assert.equal(getMissingFilesText({}), '未知文件');
});

test('ModelStatusView renders checking state', () => {
  const { document, view } = createView();

  view.renderChecking();

  assert.equal(document.getElementById('status').classList.contains('model-status-checking'), true);
  assert.equal(document.getElementById('actions').classList.contains('hidden'), true);
  assert.equal(document.getElementById('text').textContent, '正在检测本地语音模型...');
});

test('ModelStatusView renders ready state', () => {
  const { document, view } = createView();

  view.render({
    ok: true,
    activeDir: 'C:/omelet/models',
    downloadUrl: 'https://example.com/model',
  });

  assert.equal(document.getElementById('status').classList.contains('model-status-ok'), true);
  assert.equal(document.getElementById('status').classList.contains('model-status-checking'), false);
  assert.equal(document.getElementById('actions').classList.contains('hidden'), true);
  assert.equal(document.getElementById('download').href, 'https://example.com/model');
  assert.equal(document.getElementById('text').textContent, '语音模型已就绪：C:/omelet/models');
});

test('ModelStatusView renders missing state with actionable directory details', () => {
  const { document, view } = createView();

  view.render({
    ok: false,
    externalDir: 'C:/omelet/models',
    downloadUrl: 'https://example.com/model',
    candidates: [{ missingFiles: ['encoder.int8.onnx', 'tokens.txt'] }],
  });

  assert.equal(document.getElementById('status').classList.contains('model-status-missing'), true);
  assert.equal(document.getElementById('actions').classList.contains('hidden'), false);
  assert.equal(
    document.getElementById('text').textContent,
    '语音模型未就绪，请将模型放到：C:/omelet/models。缺少：encoder.int8.onnx、tokens.txt',
  );
});

test('ModelStatusView binds model directory and refresh actions', () => {
  const { calls, document, view } = createView();

  view.bind();
  document.getElementById('open').click();
  document.getElementById('refresh').click();

  assert.deepEqual(calls, { open: 1, refresh: 1 });
});
