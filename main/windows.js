const { BrowserWindow } = require('electron');
const { WINDOW_CONFIG, getRendererPath } = require('../config/app-config');

function createBaseWindow(config, preloadPath, extraOptions = {}) {
  return new BrowserWindow({
    ...config,
    ...extraOptions,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
}

function createMainWindow(preloadPath) {
  const mainWindow = createBaseWindow(WINDOW_CONFIG.main, preloadPath);
  mainWindow.loadFile(getRendererPath('index.html'));
  mainWindow.setFullScreenable(true);
  return mainWindow;
}

function createPromptEditorWindow(mainWindow, preloadPath) {
  const promptWindow = createBaseWindow(WINDOW_CONFIG.promptEditor, preloadPath, {
    parent: mainWindow,
  });
  promptWindow.loadFile(getRendererPath('prompt-editor.html'));
  return promptWindow;
}

function createSettingsWindow(mainWindow, preloadPath) {
  const settingsWindow = createBaseWindow(WINDOW_CONFIG.settings, preloadPath, {
    parent: mainWindow,
    modal: true,
  });
  settingsWindow.loadFile(getRendererPath('settings.html'));
  return settingsWindow;
}

module.exports = {
  createMainWindow,
  createPromptEditorWindow,
  createSettingsWindow,
};
