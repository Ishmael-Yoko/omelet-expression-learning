const {
  loadTrainingHistory,
  upsertTrainingHistoryRecord,
} = require('../../services/history-service');

function registerHistoryHandlers({ ipcMain, ok, fail }) {
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
}

module.exports = {
  registerHistoryHandlers,
};
