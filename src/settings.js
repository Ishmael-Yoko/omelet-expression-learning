class SettingsPage {
  constructor() {
    this.providerConfig = window.api.getProviderPresets();
    this.providerSelect = document.getElementById('provider');
    this.apikeyInput = document.getElementById('apikey');
    this.apikeyHint = document.getElementById('apikey-hint');
    this.modelSelect = document.getElementById('model');
    this.ollamaUrlInput = document.getElementById('ollama-url');
    this.customEndpointInput = document.getElementById('custom-endpoint');
    this.customModelInput = document.getElementById('custom-model');
    this.btnSave = document.getElementById('btn-save');
    this.saveSuccess = document.getElementById('save-success');
    this.groupApikey = document.getElementById('group-apikey');
    this.groupOllama = document.getElementById('group-ollama');
    this.groupCustom = document.getElementById('group-custom');
    this.groupCustomModel = document.getElementById('group-custom-model');

    this.bindEvents();
    this.loadSettings();
  }

  bindEvents() {
    this.providerSelect.addEventListener('change', () => this.onProviderChange());
    this.btnSave.addEventListener('click', () => this.save());
  }

  async loadSettings() {
    const settings = await window.api.getSettings();

    this.providerSelect.value = settings.provider || 'deepseek';
    this.apikeyInput.value = settings.apiKey || '';
    this.ollamaUrlInput.value = settings.ollamaUrl || 'http://localhost:11434';
    this.customEndpointInput.value = settings.customEndpoint || '';
    this.customModelInput.value = settings.customModel || '';

    this.onProviderChange();

    if (settings.model) {
      this.modelSelect.value = settings.model;
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
        const option = document.createElement('option');
        option.value = model.value;
        option.textContent = model.label;
        this.modelSelect.appendChild(option);
      });
      this.modelSelect.parentElement.style.display = '';
    } else {
      this.modelSelect.parentElement.style.display = 'none';
    }
  }

  async save() {
    const settings = {
      provider: this.providerSelect.value,
      apiKey: this.apikeyInput.value.trim(),
      model: this.modelSelect.value,
      ollamaUrl: this.ollamaUrlInput.value.trim(),
      customEndpoint: this.customEndpointInput.value.trim(),
      customModel: this.customModelInput.value.trim(),
    };

    await window.api.saveSettings(settings);

    this.saveSuccess.classList.add('show');
    setTimeout(() => {
      window.close();
    }, 800);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SettingsPage();
});
