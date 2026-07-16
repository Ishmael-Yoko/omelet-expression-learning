const test = require('node:test');
const assert = require('node:assert/strict');
const { createWindowManager } = require('../main/window-manager');

function createWindow(name) {
  const listeners = new Map();
  return {
    name,
    focusCalls: 0,
    on(event, handler) {
      listeners.set(event, handler);
    },
    focus() {
      this.focusCalls += 1;
    },
    emit(event) {
      const handler = listeners.get(event);
      if (handler) {
        handler();
      }
    },
  };
}

test('window-manager creates, caches, focuses, and clears managed windows', () => {
  const calls = [];
  const manager = createWindowManager({
    preloadPath: 'preload.js',
    createMainWindow: (preloadPath) => {
      calls.push(['main', preloadPath]);
      return createWindow('main');
    },
    createSettingsWindow: (mainWindow, preloadPath) => {
      calls.push(['settings', mainWindow.name, preloadPath]);
      return createWindow('settings');
    },
    createPromptEditorWindow: (mainWindow, preloadPath) => {
      calls.push(['prompt', mainWindow.name, preloadPath]);
      return createWindow('prompt');
    },
  });

  const main = manager.ensureMainWindow();
  const settings = manager.ensureSettingsWindow();
  const prompt = manager.ensurePromptEditorWindow();

  assert.equal(manager.ensureMainWindow(), main);
  assert.equal(manager.getMainWindow(), main);

  manager.ensureSettingsWindow();
  manager.ensurePromptEditorWindow();
  assert.equal(settings.focusCalls, 1);
  assert.equal(prompt.focusCalls, 1);

  settings.emit('closed');
  prompt.emit('closed');
  main.emit('closed');

  const nextMain = manager.ensureMainWindow();
  assert.notEqual(nextMain, main);
  assert.deepEqual(calls, [
    ['main', 'preload.js'],
    ['settings', 'main', 'preload.js'],
    ['prompt', 'main', 'preload.js'],
    ['main', 'preload.js'],
  ]);
});
