const { loadSettingsForDisplay, saveSettings } = require('../../services/settings-service');

function registerSettingsHandlers({ ipcMain, ok, fail, openSettingsWindow }) {
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
}

module.exports = {
  registerSettingsHandlers,
};
