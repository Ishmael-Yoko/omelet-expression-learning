const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { DEFAULT_SETTINGS } = require('../config/settings-defaults');
const { decryptSecret, encryptSecret, maskSecret } = require('./secure-settings-service');

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function readSettingsFile() {
  const settingsPath = getSettingsPath();
  if (!fs.existsSync(settingsPath)) {
    return { ...DEFAULT_SETTINGS };
  }

  try {
    const raw = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    return { ...DEFAULT_SETTINGS, ...raw };
  } catch (_error) {
    return { ...DEFAULT_SETTINGS };
  }
}

function loadSettings() {
  const settings = readSettingsFile();
  const apiKey = decryptSecret(settings.apiKey);
  return { ...settings, apiKey };
}

function loadSettingsForDisplay() {
  const settings = readSettingsFile();
  const apiKey = decryptSecret(settings.apiKey);
  return {
    ...settings,
    apiKey: maskSecret(apiKey),
    hasApiKey: Boolean(apiKey),
  };
}

function saveSettings(settings) {
  const nextSettings = { ...settings };
  if (settings.apiKey && !settings.apiKey.startsWith('****')) {
    nextSettings.apiKey = encryptSecret(settings.apiKey);
  } else {
    const current = readSettingsFile();
    nextSettings.apiKey = current.apiKey || '';
  }

  fs.writeFileSync(getSettingsPath(), JSON.stringify(nextSettings, null, 2));
}

module.exports = {
  getSettingsPath,
  loadSettings,
  loadSettingsForDisplay,
  saveSettings,
};
