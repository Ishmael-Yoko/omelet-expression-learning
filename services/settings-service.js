const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { DEFAULT_SETTINGS } = require('../config/settings-defaults');
const { decryptSecret, encryptSecret, maskSecret } = require('./secure-settings-service');

function getSettingsPath(userDataPath = app.getPath('userData')) {
  return path.join(userDataPath, 'settings.json');
}

function readSettingsFile(options = {}) {
  const settingsPath = options.settingsPath || getSettingsPath(options.userDataPath);
  if (!fs.existsSync(settingsPath)) {
    return { ...DEFAULT_SETTINGS };
  }

  try {
    const raw = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    return { ...DEFAULT_SETTINGS, ...raw };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function loadSettings(options = {}) {
  const settings = readSettingsFile(options);
  const decrypt = options.decryptSecret || decryptSecret;
  const apiKey = decrypt(settings.apiKey);
  return { ...settings, apiKey };
}

function loadSettingsForDisplay(options = {}) {
  const settings = readSettingsFile(options);
  const decrypt = options.decryptSecret || decryptSecret;
  const mask = options.maskSecret || maskSecret;
  const apiKey = decrypt(settings.apiKey);
  return {
    ...settings,
    apiKey: mask(apiKey),
    hasApiKey: Boolean(apiKey),
  };
}

function saveSettings(settings, options = {}) {
  const settingsPath = options.settingsPath || getSettingsPath(options.userDataPath);
  const encrypt = options.encryptSecret || encryptSecret;
  const nextSettings = { ...settings };

  if (settings.clearApiKey) {
    nextSettings.apiKey = '';
    delete nextSettings.clearApiKey;
  } else if (settings.apiKey && !settings.apiKey.startsWith('****')) {
    nextSettings.apiKey = encrypt(settings.apiKey);
  } else {
    const current = readSettingsFile({ settingsPath });
    nextSettings.apiKey = current.apiKey || '';
  }

  fs.writeFileSync(settingsPath, JSON.stringify(nextSettings, null, 2));
}

module.exports = {
  getSettingsPath,
  readSettingsFile,
  loadSettings,
  loadSettingsForDisplay,
  saveSettings,
};
