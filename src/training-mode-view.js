(function initTrainingModeView(global) {
  class TrainingModeView {
    constructor({
      selectEl,
      labelEl,
      presets,
    }) {
      this.selectEl = selectEl;
      this.labelEl = labelEl;
      this.presets = presets;
    }

    renderOptions() {
      this.selectEl.innerHTML = '';
      Object.entries(this.presets).forEach(([value, preset]) => {
        const option = this.selectEl.ownerDocument.createElement('option');
        option.value = value;
        option.textContent = preset.label;
        this.selectEl.appendChild(option);
      });
    }

    setMode(mode) {
      const fallback = Object.keys(this.presets)[0];
      const nextMode = this.presets[mode] ? mode : fallback;
      this.selectEl.value = nextMode;
      this.labelEl.textContent = this.presets[nextMode].label;
      this.labelEl.title = this.presets[nextMode].description;
      return nextMode;
    }
  }

  const api = { TrainingModeView };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletTrainingModeView = api;
}(typeof window !== 'undefined' ? window : globalThis));
