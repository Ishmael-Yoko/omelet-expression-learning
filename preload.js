const { contextBridge, ipcRenderer } = require('electron');
const { PROVIDER_PRESETS } = require('./config/ai-providers');
const { renderMarkdown } = require('./lib/markdown');
const { toLegacyResult } = require('./main/ipc-result');

const invokeLegacy = async (channel, ...args) => toLegacyResult(await ipcRenderer.invoke(channel, ...args));

contextBridge.exposeInMainWorld('api', {
  getProviderPresets: () => JSON.parse(JSON.stringify(PROVIDER_PRESETS)),
  renderMarkdown,
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => invokeLegacy('save-settings', settings),
  openSettings: () => invokeLegacy('open-settings'),
  openPromptEditor: () => invokeLegacy('open-prompt-editor'),
  getCustomPrompt: () => ipcRenderer.invoke('get-custom-prompt'),
  saveCustomPrompt: (data) => invokeLegacy('save-custom-prompt', data),
  closeWindow: () => invokeLegacy('close-current-window'),
  getModelStatus: () => ipcRenderer.invoke('get-model-status'),
  openModelsDir: () => invokeLegacy('open-models-dir'),
  initASR: () => invokeLegacy('init-asr'),
  feedAudio: (samples) => ipcRenderer.invoke('feed-audio', Array.from(samples)),
  stopASR: () => invokeLegacy('stop-asr'),
  onASRResult: (callback) => {
    ipcRenderer.on('asr-result', (_event, data) => callback(data));
  },
  removeASRListener: () => {
    ipcRenderer.removeAllListeners('asr-result');
  },
  analyzeText: (text) => ipcRenderer.invoke('analyze-text', text),
  getRealtimeFeedback: (text) => invokeLegacy('get-realtime-feedback', text),
  getFinalReport: (data) => invokeLegacy('get-final-report', data),
  saveFile: (content, filename) => ipcRenderer.invoke('save-file', content, filename),
});
