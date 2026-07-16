const { BrowserWindow, ipcMain } = require('electron');
const { initASR, feedAudio, stopRecognition } = require('../lib/asr');
const { analyzeText } = require('../lib/lexicon');
const {
  getFinalReport,
  getRealtimeFeedback,
  testProviderConnection,
} = require('../services/ai-service');
const {
  loadSettings,
  loadSettingsForDisplay,
  saveSettings,
} = require('../services/settings-service');
const { loadCustomPrompt, saveCustomPrompt } = require('../services/prompt-service');
const {
  loadTrainingHistory,
  upsertTrainingHistoryRecord,
} = require('../services/history-service');
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
  ipcMain.handle('get-settings', () => {
    try {
      return ok(loadSettingsForDisplay());
    } catch (error) {
      return fail(error, 'SETTINGS_LOAD_FAILED');
    }
  });

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

  ipcMain.handle('get-custom-prompt', () => {
    try {
      return ok(loadCustomPrompt());
    } catch (error) {
      return fail(error, 'PROMPT_LOAD_FAILED');
    }
  });

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

  ipcMain.handle('get-training-history', () => {
    try {
      return ok({ records: loadTrainingHistory() });
    } catch (error) {
      return fail(error, 'TRAINING_HISTORY_LOAD_FAILED');
    }
  });

  ipcMain.handle('save-training-history-record', (_event, record) => {
    try {
      return ok({ records: upsertTrainingHistoryRecord(record) });
    } catch (error) {
      return fail(error, 'TRAINING_HISTORY_SAVE_FAILED');
    }
  });

  ipcMain.handle('get-model-status', () => {
    try {
      return ok(getModelStatus());
    } catch (error) {
      return fail(error, 'MODEL_STATUS_FAILED');
    }
  });

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
      return ok(null);
    }

    try {
      return ok(feedAudio(new Float32Array(samplesArray)));
    } catch (error) {
      return fail(error, 'ASR_FEED_FAILED');
    }
  });

  ipcMain.handle('stop-asr', () => {
    const finalText = stopRecognition();
    onAsrReadyChange(false);
    return ok({ finalText });
  });

  ipcMain.handle('analyze-text', (_event, text) => {
    try {
      return ok(analyzeText(text));
    } catch (error) {
      return fail(error, 'TEXT_ANALYSIS_FAILED');
    }
  });

  ipcMain.handle('save-file', async (_event, content, filename) => {
    try {
      const result = await saveMarkdownFile(getMainWindow(), content, filename);
      if (!result.success) {
        return fail('Save cancelled', 'FILE_SAVE_CANCELLED');
      }
      return ok({ path: result.path });
    } catch (error) {
      return fail(error, 'FILE_SAVE_FAILED');
    }
  });

  ipcMain.handle('get-realtime-feedback', async (_event, text) => {
    const settings = loadSettings();
    const customPrompt = loadCustomPrompt();
    try {
      return ok(await getRealtimeFeedback(text, settings, customPrompt));
    } catch (error) {
      return fail(error, 'AI_FEEDBACK_FAILED');
    }
  });

  ipcMain.handle('get-final-report', async (_event, { fullText, stats }) => {
    const settings = loadSettings();
    const customPrompt = loadCustomPrompt();
    try {
      return ok(await getFinalReport(fullText, stats, settings, customPrompt));
    } catch (error) {
      return fail(error, 'AI_REPORT_FAILED');
    }
  });

  ipcMain.handle('test-ai-connection', async (_event, settings) => {
    try {
      return ok(await testProviderConnection(settings));
    } catch (error) {
      return fail(error, 'AI_CONNECTION_TEST_FAILED');
    }
  });
}

module.exports = {
  registerIpcHandlers,
};
