const { saveMarkdownFile } = require('../../services/file-service');

function registerFileHandlers({ ipcMain, ok, fail, getMainWindow }) {
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
}

module.exports = {
  registerFileHandlers,
};
