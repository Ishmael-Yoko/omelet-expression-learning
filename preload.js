const { contextBridge, ipcRenderer } = require('electron');
const { PROVIDER_PRESETS } = require('./config/ai-providers');
const { renderMarkdown } = require('./lib/markdown');
const { toLegacyResult, unwrapResult } = require('./main/ipc-result');

const invokeLegacy = async (channel, ...args) => toLegacyResult(await ipcRenderer.invoke(channel, ...args));
const invokeData = async (channel, ...args) => unwrapResult(await ipcRenderer.invoke(channel, ...args));

contextBridge.exposeInMainWorld('api', {
  getProviderPresets: () => JSON.parse(JSON.stringify(PROVIDER_PRESETS)),
  renderMarkdown,
  getSettings: () => invokeData('get-settings'),
  saveSettings: (settings) => invokeLegacy('save-settings', settings),
  openSettings: () => invokeLegacy('open-settings'),
  openPromptEditor: () => invokeLegacy('open-prompt-editor'),
  getCustomPrompt: () => invokeData('get-custom-prompt'),
  saveCustomPrompt: (data) => invokeLegacy('save-custom-prompt', data),
  getCustomLexicon: () => invokeData('get-custom-lexicon'),
  saveCustomLexicon: (data) => invokeLegacy('save-custom-lexicon', data),
  closeWindow: () => invokeLegacy('close-current-window'),
  getTrainingHistory: () => invokeData('get-training-history'),
  saveTrainingHistoryRecord: (record) => invokeData('save-training-history-record', record),
  getModelStatus: () => invokeData('get-model-status'),
  openModelsDir: () => invokeLegacy('open-models-dir'),
  initASR: () => invokeLegacy('init-asr'),
  feedAudio: (samples) => invokeData('feed-audio', Array.from(samples)),
  stopASR: () => invokeLegacy('stop-asr'),
  onASRResult: (callback) => {
    ipcRenderer.on('asr-result', (_event, data) => callback(data));
  },
  removeASRListener: () => {
    ipcRenderer.removeAllListeners('asr-result');
  },
  analyzeText: (text) => invokeData('analyze-text', text),
  getRealtimeFeedback: (text) => invokeLegacy('get-realtime-feedback', text),
  getFinalReport: (data) => invokeLegacy('get-final-report', data),
  testAIConnection: (settings) => invokeLegacy('test-ai-connection', settings),
  saveFile: (content, filename) => invokeLegacy('save-file', content, filename),
});
