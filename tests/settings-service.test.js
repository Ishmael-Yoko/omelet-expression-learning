const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  loadSettings,
  loadSettingsForDisplay,
  saveSettings,
} = require('../services/settings-service');

function createSettingsPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'omelet-settings-'));
  return path.join(dir, 'settings.json');
}

const encryptSecret = value => `enc:${value}`;
const decryptSecret = value => value ? value.replace(/^enc:/, '') : '';
const maskSecret = value => value ? `mask:${value.slice(-4)}` : '';

test('saveSettings encrypts a new API key and loadSettings decrypts it', () => {
  const settingsPath = createSettingsPath();

  saveSettings({
    provider: 'deepseek',
    apiKey: 'plain-key',
    model: 'deepseek-chat',
  }, { settingsPath, encryptSecret });

  const raw = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  assert.equal(raw.apiKey, 'enc:plain-key');

  const loaded = loadSettings({ settingsPath, decryptSecret });
  assert.equal(loaded.apiKey, 'plain-key');
});

test('loadSettingsForDisplay masks the API key and exposes hasApiKey', () => {
  const settingsPath = createSettingsPath();
  fs.writeFileSync(settingsPath, JSON.stringify({
    provider: 'deepseek',
    apiKey: 'enc:plain-key',
  }));

  const display = loadSettingsForDisplay({ settingsPath, decryptSecret, maskSecret });
  assert.equal(display.apiKey, 'mask:-key');
  assert.equal(display.hasApiKey, true);
});

test('saveSettings keeps existing encrypted API key when masked value is submitted', () => {
  const settingsPath = createSettingsPath();
  fs.writeFileSync(settingsPath, JSON.stringify({
    provider: 'deepseek',
    apiKey: 'enc:old-key',
  }));

  saveSettings({
    provider: 'openai',
    apiKey: '****-key',
    model: 'gpt-4o-mini',
  }, { settingsPath, encryptSecret });

  const raw = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  assert.equal(raw.provider, 'openai');
  assert.equal(raw.apiKey, 'enc:old-key');
});

test('saveSettings clears existing API key when clearApiKey is true', () => {
  const settingsPath = createSettingsPath();
  fs.writeFileSync(settingsPath, JSON.stringify({
    provider: 'deepseek',
    apiKey: 'enc:old-key',
  }));

  saveSettings({
    provider: 'deepseek',
    apiKey: '',
    model: 'deepseek-chat',
    clearApiKey: true,
  }, { settingsPath, encryptSecret });

  const raw = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  assert.equal(raw.apiKey, '');
  assert.equal(Object.hasOwn(raw, 'clearApiKey'), false);
});
