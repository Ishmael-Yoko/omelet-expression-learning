(function initPasteModalView(global) {
  class PasteModalView {
    constructor({ modalEl, textareaEl, closeButtonEl, analyzeButtonEl, onAnalyze }) {
      this.modalEl = modalEl;
      this.textareaEl = textareaEl;
      this.closeButtonEl = closeButtonEl;
      this.analyzeButtonEl = analyzeButtonEl;
      this.onAnalyze = onAnalyze;
    }

    bind() {
      this.closeButtonEl.addEventListener('click', () => this.close());
      this.analyzeButtonEl.addEventListener('click', () => this.onAnalyze());
    }

    open() {
      this.textareaEl.value = '';
      this.modalEl.classList.remove('hidden');
      this.textareaEl.focus();
    }

    close() {
      this.modalEl.classList.add('hidden');
    }

    getText() {
      return this.textareaEl.value.trim();
    }
  }

  const api = { PasteModalView };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletPasteModalView = api;
}(typeof window !== 'undefined' ? window : globalThis));
