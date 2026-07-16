const { getModelStatus, openExternalModelsDir } = require('../../services/model-service');

function registerModelHandlers({ ipcMain, ok, fail }) {
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
}

module.exports = {
  registerModelHandlers,
};
