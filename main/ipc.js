const { ipcMain } = require('electron');
const { fail, ok } = require('./ipc-result');
const { registerAiHandlers } = require('./ipc-handlers/ai-handlers');
const { registerAsrHandlers } = require('./ipc-handlers/asr-handlers');
const { registerFileHandlers } = require('./ipc-handlers/file-handlers');
const { registerHistoryHandlers } = require('./ipc-handlers/history-handlers');
const { registerModelHandlers } = require('./ipc-handlers/model-handlers');
const { registerPromptHandlers } = require('./ipc-handlers/prompt-handlers');
const { registerSettingsHandlers } = require('./ipc-handlers/settings-handlers');

function registerIpcHandlers({
  getMainWindow,
  openSettingsWindow,
  openPromptEditorWindow,
  onAsrReadyChange,
  isAsrReady,
}) {
  const deps = {
    ipcMain,
    ok,
    fail,
    getMainWindow,
    openSettingsWindow,
    openPromptEditorWindow,
    onAsrReadyChange,
    isAsrReady,
  };

  registerSettingsHandlers(deps);
  registerPromptHandlers(deps);
  registerHistoryHandlers(deps);
  registerModelHandlers(deps);
  registerAsrHandlers(deps);
  registerFileHandlers(deps);
  registerAiHandlers(deps);
}

module.exports = {
  registerIpcHandlers,
};
