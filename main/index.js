const path = require('path');
const { app, BrowserWindow } = require('electron');
const { loadLexicon } = require('../lib/lexicon');
const {
  createMainWindow,
  createPromptEditorWindow,
  createSettingsWindow,
} = require('./windows');
const { registerIpcHandlers } = require('./ipc');

let mainWindow = null;
let settingsWindow = null;
let promptEditorWindow = null;
let asrReady = false;

const preloadPath = path.join(__dirname, '..', 'preload.js');

function ensureMainWindow() {
  if (mainWindow) {
    return mainWindow;
  }

  mainWindow = createMainWindow(preloadPath);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  return mainWindow;
}

function ensurePromptEditorWindow() {
  if (promptEditorWindow) {
    promptEditorWindow.focus();
    return promptEditorWindow;
  }

  promptEditorWindow = createPromptEditorWindow(ensureMainWindow(), preloadPath);
  promptEditorWindow.on('closed', () => {
    promptEditorWindow = null;
  });
  return promptEditorWindow;
}

function ensureSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return settingsWindow;
  }

  settingsWindow = createSettingsWindow(ensureMainWindow(), preloadPath);
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
  return settingsWindow;
}

registerIpcHandlers({
  getMainWindow: () => mainWindow,
  openSettingsWindow: ensureSettingsWindow,
  openPromptEditorWindow: ensurePromptEditorWindow,
  onAsrReadyChange: (value) => {
    asrReady = value;
  },
  isAsrReady: () => asrReady,
});

app.whenReady().then(() => {
  loadLexicon();
  ensureMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      ensureMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
