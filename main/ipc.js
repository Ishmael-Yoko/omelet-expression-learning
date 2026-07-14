const { BrowserWindow, ipcMain } = require('electron');
const { initASR, feedAudio, stopRecognition } = require('../lib/asr');
const { analyzeText } = require('../lib/lexicon');
const { sendFeedback, sendReport } = require('../lib/ai-feedback');
const {
  loadSettings,
  loadSettingsForDisplay,
  saveSettings,
} = require('../services/settings-service');
const { loadCustomPrompt, saveCustomPrompt } = require('../services/prompt-service');
const { saveMarkdownFile } = require('../services/file-service');

function registerIpcHandlers({
  getMainWindow,
  openSettingsWindow,
  openPromptEditorWindow,
  onAsrReadyChange,
  isAsrReady,
}) {
  ipcMain.handle('get-settings', () => loadSettingsForDisplay());

  ipcMain.handle('save-settings', (_event, settings) => {
    saveSettings(settings);
    return { success: true };
  });

  ipcMain.handle('open-settings', () => {
    openSettingsWindow();
    return { success: true };
  });

  ipcMain.handle('open-prompt-editor', () => {
    openPromptEditorWindow();
    return { success: true };
  });

  ipcMain.handle('get-custom-prompt', () => loadCustomPrompt());

  ipcMain.handle('save-custom-prompt', (_event, data) => {
    saveCustomPrompt(data);
    return { success: true };
  });

  ipcMain.handle('close-current-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.close();
    }
    return { success: true };
  });

  ipcMain.handle('init-asr', async () => {
    try {
      await initASR();
      onAsrReadyChange(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('feed-audio', (_event, samplesArray) => {
    if (!isAsrReady()) {
      return null;
    }
    return feedAudio(new Float32Array(samplesArray));
  });

  ipcMain.handle('stop-asr', () => {
    const finalText = stopRecognition();
    onAsrReadyChange(false);
    return { success: true, finalText };
  });

  ipcMain.handle('analyze-text', (_event, text) => analyzeText(text));

  ipcMain.handle('save-file', async (_event, content, filename) => {
    return saveMarkdownFile(getMainWindow(), content, filename);
  });

  ipcMain.handle('get-realtime-feedback', async (_event, text) => {
    const settings = loadSettings();
    const customPrompt = loadCustomPrompt();
    try {
      const feedback = await sendFeedback(text, settings, customPrompt);
      return { success: true, feedback };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-final-report', async (_event, { fullText, stats }) => {
    const settings = loadSettings();
    const customPrompt = loadCustomPrompt();
    try {
      const report = await sendReport(fullText, stats, settings, customPrompt);
      return { success: true, report };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  registerIpcHandlers,
};
