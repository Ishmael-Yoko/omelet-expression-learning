const path = require('path');
const { app, BrowserWindow } = require('electron');
const { loadLexicon } = require('../lib/lexicon');
const {
  createMainWindow,
  createPromptEditorWindow,
  createSettingsWindow,
} = require('./windows');
const { registerIpcHandlers } = require('./ipc');
const { createWindowManager } = require('./window-manager');

let asrReady = false;

const preloadPath = path.join(__dirname, '..', 'preload.js');
const windowManager = createWindowManager({
  createMainWindow,
  createPromptEditorWindow,
  createSettingsWindow,
  preloadPath,
});

registerIpcHandlers({
  getMainWindow: windowManager.getMainWindow,
  openSettingsWindow: windowManager.ensureSettingsWindow,
  openPromptEditorWindow: windowManager.ensurePromptEditorWindow,
  onAsrReadyChange: (value) => {
    asrReady = value;
  },
  isAsrReady: () => asrReady,
});

app.whenReady().then(() => {
  loadLexicon();
  windowManager.ensureMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.ensureMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
