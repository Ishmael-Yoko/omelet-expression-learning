const { contextBridge, ipcRenderer } = require('electron');
const { PROVIDER_PRESETS } = require('./config/ai-providers');
const { renderMarkdown } = require('./lib/markdown');

contextBridge.exposeInMainWorld('api', {
  getProviderPresets: () => JSON.parse(JSON.stringify(PROVIDER_PRESETS)),
  renderMarkdown,
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  openSettings: () => ipcRenderer.invoke('open-settings'),
  openPromptEditor: () => ipcRenderer.invoke('open-prompt-editor'),
  getCustomPrompt: () => ipcRenderer.invoke('get-custom-prompt'),
  saveCustomPrompt: (data) => ipcRenderer.invoke('save-custom-prompt', data),
  closeWindow: () => ipcRenderer.invoke('close-current-window'),
  getModelStatus: () => ipcRenderer.invoke('get-model-status'),
  openModelsDir: () => ipcRenderer.invoke('open-models-dir'),
  initASR: () => ipcRenderer.invoke('init-asr'),
  feedAudio: (samples) => ipcRenderer.invoke('feed-audio', Array.from(samples)),
  stopASR: () => ipcRenderer.invoke('stop-asr'),
  onASRResult: (callback) => {
    ipcRenderer.on('asr-result', (_event, data) => callback(data));
  },
  removeASRListener: () => {
    ipcRenderer.removeAllListeners('asr-result');
  },
  analyzeText: (text) => ipcRenderer.invoke('analyze-text', text),
  getRealtimeFeedback: (text) => ipcRenderer.invoke('get-realtime-feedback', text),
  getFinalReport: (data) => ipcRenderer.invoke('get-final-report', data),
  saveFile: (content, filename) => ipcRenderer.invoke('save-file', content, filename),
});
