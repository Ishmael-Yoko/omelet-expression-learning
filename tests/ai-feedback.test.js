const test = require('node:test');
const assert = require('node:assert/strict');
const { getProviderConfig } = require('../lib/ai-feedback');

test('getProviderConfig returns default OpenAI compatible provider config', () => {
  const openai = getProviderConfig({ provider: 'openai', apiKey: 'key' });
  assert.equal(openai.model, 'gpt-4o-mini');
  assert.equal(openai.apiKey, 'key');
  assert.match(openai.endpoint, /openai\.com/);

  const deepseek = getProviderConfig({ provider: 'deepseek', apiKey: 'key' });
  assert.equal(deepseek.model, 'deepseek-chat');
  assert.match(deepseek.endpoint, /deepseek\.com/);
});

test('getProviderConfig supports local Ollama and custom endpoints', () => {
  const ollama = getProviderConfig({ provider: 'ollama', ollamaUrl: 'http://127.0.0.1:11434' });
  assert.equal(ollama.endpoint, 'http://127.0.0.1:11434/v1/chat/completions');
  assert.equal(ollama.apiKey, 'ollama');
  assert.equal(ollama.model, 'qwen2.5:7b');

  const custom = getProviderConfig({
    provider: 'custom',
    apiKey: 'secret',
    customEndpoint: 'https://example.test/v1/chat/completions',
    customModel: 'custom-model',
  });
  assert.equal(custom.endpoint, 'https://example.test/v1/chat/completions');
  assert.equal(custom.model, 'custom-model');
});

test('getProviderConfig rejects unknown providers', () => {
  assert.throws(() => getProviderConfig({ provider: 'unknown' }), /Unknown provider/);
});
