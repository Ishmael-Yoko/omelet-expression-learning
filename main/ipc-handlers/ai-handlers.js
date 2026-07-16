const {
  getFinalReport,
  getRealtimeFeedback,
  testProviderConnection,
} = require('../../services/ai-service');
const { loadSettings } = require('../../services/settings-service');
const { loadCustomPrompt } = require('../../services/prompt-service');

function registerAiHandlers({ ipcMain, ok, fail }) {
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
  registerAiHandlers,
};
