const { BrowserWindow } = require('electron');
const { loadCustomPrompt, saveCustomPrompt } = require('../../services/prompt-service');
const { loadCustomLexicon, saveCustomLexicon } = require('../../services/custom-lexicon-service');

function registerPromptHandlers({
  ipcMain,
  ok,
  fail,
  openPromptEditorWindow,
}) {
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

  ipcMain.handle('get-custom-lexicon', () => {
    try {
      return ok(loadCustomLexicon());
    } catch (error) {
      return fail(error, 'CUSTOM_LEXICON_LOAD_FAILED');
    }
  });

  ipcMain.handle('save-custom-lexicon', (_event, data) => {
    try {
      return ok(saveCustomLexicon(data));
    } catch (error) {
      return fail(error, 'CUSTOM_LEXICON_SAVE_FAILED');
    }
  });

  ipcMain.handle('close-current-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.close();
    }
    return ok();
  });
}

module.exports = {
  registerPromptHandlers,
};
