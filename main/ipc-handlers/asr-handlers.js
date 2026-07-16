const { initASR, feedAudio, stopRecognition } = require('../../lib/asr');
const { analyzeText } = require('../../lib/lexicon');

function registerAsrHandlers({
  ipcMain,
  ok,
  fail,
  onAsrReadyChange,
  isAsrReady,
}) {
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
}

module.exports = {
  registerAsrHandlers,
};
