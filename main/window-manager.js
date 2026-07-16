function createWindowManager({
  createMainWindow,
  createSettingsWindow,
  createPromptEditorWindow,
  preloadPath,
}) {
  let mainWindow = null;
  let settingsWindow = null;
  let promptEditorWindow = null;

  function ensureMainWindow() {
    if (mainWindow) {
      return mainWindow;
    }

    mainWindow = createMainWindow(preloadPath);
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
    return mainWindow;
  }

  function ensureSettingsWindow() {
    if (settingsWindow) {
      settingsWindow.focus();
      return settingsWindow;
    }

    settingsWindow = createSettingsWindow(ensureMainWindow(), preloadPath);
    settingsWindow.on('closed', () => {
      settingsWindow = null;
    });
    return settingsWindow;
  }

  function ensurePromptEditorWindow() {
    if (promptEditorWindow) {
      promptEditorWindow.focus();
      return promptEditorWindow;
    }

    promptEditorWindow = createPromptEditorWindow(ensureMainWindow(), preloadPath);
    promptEditorWindow.on('closed', () => {
      promptEditorWindow = null;
    });
    return promptEditorWindow;
  }

  return {
    ensureMainWindow,
    ensurePromptEditorWindow,
    ensureSettingsWindow,
    getMainWindow: () => mainWindow,
  };
}

module.exports = {
  createWindowManager,
};
