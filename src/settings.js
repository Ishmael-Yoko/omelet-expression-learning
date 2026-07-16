class SettingsPage {
  constructor({
    api = globalThis.window?.api,
    documentRef = globalThis.document,
    closeWindow = () => globalThis.window?.close(),
  } = {}) {
    this.api = api;
    this.documentRef = documentRef;
    this.closeWindow = closeWindow;
    this.providerConfig = api.getProviderPresets();
    this.providerSelect = documentRef.getElementById('provider');
    this.apikeyInput = documentRef.getElementById('apikey');
    this.apikeyHint = documentRef.getElementById('apikey-hint');
    this.modelSelect = documentRef.getElementById('model');
    this.ollamaUrlInput = documentRef.getElementById('ollama-url');
    this.customEndpointInput = documentRef.getElementById('custom-endpoint');
    this.customModelInput = documentRef.getElementById('custom-model');
    this.btnSave = documentRef.getElementById('btn-save');
    this.btnTestConnection = documentRef.getElementById('btn-test-connection');
    this.btnClearApiKey = documentRef.getElementById('btn-clear-apikey');
    this.saveSuccess = documentRef.getElementById('save-success');
    this.connectionStatus = documentRef.getElementById('connection-status');
    this.groupApikey = documentRef.getElementById('group-apikey');
    this.groupOllama = documentRef.getElementById('group-ollama');
    this.groupCustom = documentRef.getElementById('group-custom');
    this.groupCustomModel = documentRef.getElementById('group-custom-model');
    this.clearApiKey = false;

    this.bindEvents();
    this.ready = this.loadSettings();
  }

  bindEvents() {
    this.providerSelect.addEventListener('change', () => this.onProviderChange());
    this.btnSave.addEventListener('click', () => this.save());
    this.btnTestConnection.addEventListener('click', () => this.testConnection());
    this.btnClearApiKey.addEventListener('click', () => this.clearApiKeyInput());
  }

  async loadSettings() {
    const settings = await this.api.getSettings();

    this.providerSelect.value = settings.provider || 'deepseek';
    this.apikeyInput.value = settings.apiKey || '';
    this.clearApiKey = false;
    this.ollamaUrlInput.value = settings.ollamaUrl || 'http://localhost:11434';
    this.customEndpointInput.value = settings.customEndpoint || '';
    this.customModelInput.value = settings.customModel || '';

    this.onProviderChange();

    if (settings.model) {
      this.modelSelect.value = settings.model;
    }
  }

  clearApiKeyInput() {
    this.apikeyInput.value = '';
    this.apikeyInput.placeholder = '保存后将清空已保存的 API Key';
    this.clearApiKey = true;
  }

  buildSettingsPayload() {
    return {
      provider: this.providerSelect.value,
      apiKey: this.apikeyInput.value.trim(),
      model: this.modelSelect.value,
      ollamaUrl: this.ollamaUrlInput.value.trim(),
      customEndpoint: this.customEndpointInput.value.trim(),
      customModel: this.customModelInput.value.trim(),
      clearApiKey: this.clearApiKey,
    };
  }

  setConnectionStatus(message, type) {
    this.connectionStatus.textContent = message || '';
    this.connectionStatus.classList.remove('show', 'is-error', 'is-pending');

    if (!message) {
      return;
    }

    this.connectionStatus.classList.add('show');
    if (type === 'error') {
      this.connectionStatus.classList.add('is-error');
    }
    if (type === 'pending') {
      this.connectionStatus.classList.add('is-pending');
    }
  }

  onProviderChange() {
    const provider = this.providerSelect.value;
    const config = this.providerConfig[provider];

    this.groupApikey.classList.toggle('visible', config.needsKey);
    this.groupOllama.classList.toggle('visible', provider === 'ollama');
    this.groupCustom.classList.toggle('visible', provider === 'custom');
    this.groupCustomModel.classList.toggle('visible', provider === 'custom');

    this.apikeyHint.textContent = config.keyHint || '';
    this.modelSelect.innerHTML = '';

    if (config.models.length > 0) {
      config.models.forEach((model) => {
        const option = this.documentRef.createElement('option');
        option.value = model.value;
        option.textContent = model.label;
        this.modelSelect.appendChild(option);
      });
      this.modelSelect.parentElement.style.display = '';
    } else {
      this.modelSelect.parentElement.style.display = 'none';
    }
  }

  async testConnection() {
    this.setConnectionStatus('正在测试连接...', 'pending');
    this.btnTestConnection.disabled = true;

    try {
      const result = await this.api.testAIConnection(this.buildSettingsPayload());
      if (result.success) {
        this.setConnectionStatus(`连接成功：${result.reply}`, 'success');
      } else {
        this.setConnectionStatus(`连接失败：${result.error}`, 'error');
      }
    } catch (error) {
      this.setConnectionStatus(`连接失败：${error.message}`, 'error');
    } finally {
      this.btnTestConnection.disabled = false;
    }
  }

  async save() {
    await this.api.saveSettings(this.buildSettingsPayload());

    this.saveSuccess.classList.add('show');
    setTimeout(() => {
      this.closeWindow();
    }, 800);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SettingsPage };
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    new SettingsPage();
  });
}
