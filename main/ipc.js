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
const { getModelStatus, openExternalModelsDir } = require('../services/model-service');
const { fail, ok } = require('./ipc-result');

function registerIpcHandlers({
  getMainWindow,
  openSettingsWindow,
  openPromptEditorWindow,
  onAsrReadyChange,
  isAsrReady,
}) {
  ipcMain.handle('get-settings', () => loadSettingsForDisplay());

  ipcMain.handle('save-settings', (_event, settings) => {
    try {
      saveSettings(settings);
      return ok();
    } catch (error) {
      return fail(error, 'SETTINGS_SAVE_FAILED');
    }
  });

  ipcMain.handle('open-settings', () => {
    openSettingsWindow();
    return ok();
  });

  ipcMain.handle('open-prompt-editor', () => {
    openPromptEditorWindow();
    return ok();
  });

  ipcMain.handle('get-custom-prompt', () => loadCustomPrompt());

  ipcMain.handle('save-custom-prompt', (_event, data) => {
    try {
      saveCustomPrompt(data);
      return ok();
    } catch (error) {
      return fail(error, 'PROMPT_SAVE_FAILED');
    }
  });

  ipcMain.handle('close-current-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.close();
    }
    return ok();
  });

  ipcMain.handle('get-model-status', () => getModelStatus());

  ipcMain.handle('open-models-dir', async () => {
    try {
      const dir = await openExternalModelsDir();
      return ok({ dir });
    } catch (error) {
      return fail(error, 'MODEL_DIR_OPEN_FAILED');
    }
  });

  ipcMain.handle('init-asr', async () => {
    try {
      await initASR();
      onAsrReadyChange(true);
      return ok();
    } catch (error) {
      return fail(error, 'ASR_INIT_FAILED');
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
    return ok({ finalText });
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
      return ok({ feedback });
    } catch (error) {
      return fail(error, 'AI_FEEDBACK_FAILED');
    }
  });

  ipcMain.handle('get-final-report', async (_event, { fullText, stats }) => {
    const settings = loadSettings();
    const customPrompt = loadCustomPrompt();
    try {
      const report = await sendReport(fullText, stats, settings, customPrompt);
      return ok({ report });
    } catch (error) {
      return fail(error, 'AI_REPORT_FAILED');
    }
  });
}

module.exports = {
  registerIpcHandlers,
};
