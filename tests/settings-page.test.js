const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { SettingsPage } = require('../src/settings');

function createPage(overrides = {}) {
  const dom = new JSDOM(`
    <div class="form-group visible" id="group-apikey">
      <input id="apikey">
      <div id="apikey-hint"></div>
      <button id="btn-clear-apikey" type="button">clear</button>
    </div>
    <div class="form-group" id="group-ollama"><input id="ollama-url"></div>
    <div class="form-group" id="group-custom"><input id="custom-endpoint"></div>
    <div class="form-group" id="group-custom-model"><input id="custom-model"></div>
    <div class="form-group">
      <select id="provider">
        <option value="openai">OpenAI</option>
        <option value="deepseek">DeepSeek</option>
        <option value="ollama">Ollama</option>
        <option value="custom">Custom</option>
      </select>
    </div>
    <div class="form-group"><select id="model"></select></div>
    <button id="btn-test-connection" type="button">test</button>
    <button id="btn-save" type="button">save</button>
    <div id="connection-status"></div>
    <div id="save-success"></div>
  `, { url: 'https://example.test' });

  const calls = {
    saved: [],
    tested: [],
  };
  const api = {
    getProviderPresets: () => ({
      deepseek: {
        needsKey: true,
        keyHint: '在 platform.deepseek.com 获取',
        models: [{ value: 'deepseek-chat', label: 'DeepSeek Chat' }],
      },
      ollama: {
        needsKey: false,
        keyHint: '',
        models: [{ value: 'qwen2.5:7b', label: 'Qwen 2.5 7B' }],
      },
      custom: {
        needsKey: true,
        keyHint: '自定义 API Key',
        models: [],
      },
    }),
    getSettings: async () => ({
      provider: 'deepseek',
      apiKey: '****abcd',
      model: 'deepseek-chat',
      ollamaUrl: 'http://localhost:11434',
      customEndpoint: '',
      customModel: '',
    }),
    saveSettings: async (settings) => {
      calls.saved.push(settings);
      return { success: true };
    },
    testAIConnection: async (settings) => {
      calls.tested.push(settings);
      return { success: true, reply: '连接成功' };
    },
    ...overrides.api,
  };
  const closeCalls = { count: 0 };

  const page = new SettingsPage({
    api,
    documentRef: dom.window.document,
    closeWindow: () => {
      closeCalls.count += 1;
    },
  });

  return { api, calls, closeCalls, document: dom.window.document, page };
}

test('SettingsPage builds payload and clears API key state', async () => {
  const { document, page } = createPage();
  await page.ready;

  page.clearApiKeyInput();
  document.getElementById('custom-endpoint').value = 'https://example.test/v1';
  document.getElementById('custom-model').value = 'model-x';

  assert.deepEqual(page.buildSettingsPayload(), {
    provider: 'deepseek',
    apiKey: '',
    model: 'deepseek-chat',
    ollamaUrl: 'http://localhost:11434',
    customEndpoint: 'https://example.test/v1',
    customModel: 'model-x',
    clearApiKey: true,
  });
});

test('SettingsPage tests connection and shows success status', async () => {
  const { calls, document, page } = createPage();
  await page.ready;

  await page.testConnection();

  assert.equal(calls.tested.length, 1);
  assert.equal(document.getElementById('connection-status').textContent, '连接成功：连接成功');
  assert.equal(document.getElementById('connection-status').classList.contains('show'), true);
});

test('SettingsPage shows connection errors and re-enables test button', async () => {
  const { document, page } = createPage({
    api: {
      testAIConnection: async () => ({ success: false, error: 'API Key 缺失' }),
    },
  });
  await page.ready;

  await page.testConnection();

  assert.equal(document.getElementById('connection-status').textContent, '连接失败：API Key 缺失');
  assert.equal(document.getElementById('connection-status').classList.contains('is-error'), true);
  assert.equal(document.getElementById('btn-test-connection').disabled, false);
});

test('SettingsPage saves current settings payload', async () => {
  const { calls, closeCalls, page } = createPage();
  await page.ready;

  await page.save();

  assert.equal(calls.saved.length, 1);
  assert.equal(calls.saved[0].provider, 'deepseek');
  await new Promise(resolve => setTimeout(resolve, 900));
  assert.equal(closeCalls.count, 1);
});
