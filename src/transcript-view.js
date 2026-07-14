(function initTranscriptView(global) {
  const DEFAULT_HINT = '点击下方按钮开始说话';

  class TranscriptView {
    constructor({ scrollEl, containerEl, renderHighlightedText }) {
      this.scrollEl = scrollEl;
      this.containerEl = containerEl;
      this.renderHighlightedText = renderHighlightedText;
    }

    clear() {
      this.containerEl.innerHTML = '';
    }

    resetHint(message = DEFAULT_HINT) {
      this.containerEl.innerHTML = '';
      const line = this.createLine(message, 'hint');
      this.containerEl.appendChild(line);
      this.scrollToBottom();
    }

    renderInterim(text) {
      let interim = this.containerEl.querySelector('.interim-line');
      if (!interim) {
        interim = this.createLine('', 'interim-line');
        this.containerEl.appendChild(interim);
      }
      interim.textContent = text;
      this.scrollToBottom();
    }

    renderFinal(text, analysis = null) {
      const interim = this.containerEl.querySelector('.interim-line');
      if (interim) {
        interim.remove();
      }

      this.containerEl.querySelectorAll('.subtitle-line:not(.old)').forEach(el => {
        el.classList.add('old');
      });

      const line = this.createLine('');
      line.innerHTML = this.renderHighlightedText(text, analysis);
      this.containerEl.appendChild(line);
      this.scrollToBottom();
    }

    renderSentence(text, analysis = null) {
      const line = this.createLine('');
      line.innerHTML = this.renderHighlightedText(text, analysis);
      this.containerEl.appendChild(line);
      this.scrollToBottom();
    }

    renderError(message) {
      const line = this.createLine(message);
      line.style.color = '#ff6b6b';
      this.containerEl.appendChild(line);
      this.scrollToBottom();
    }

    createLine(text, extraClass = '') {
      const line = this.containerEl.ownerDocument.createElement('div');
      line.className = ['subtitle-line', extraClass].filter(Boolean).join(' ');
      line.textContent = text;
      return line;
    }

    scrollToBottom() {
      this.scrollEl.scrollTop = this.scrollEl.scrollHeight;
    }
  }

  const api = { DEFAULT_HINT, TranscriptView };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletTranscriptView = api;
}(typeof window !== 'undefined' ? window : globalThis));
