(function initReportView(global) {
  const COPY_LABEL = '复制全文';
  const COPIED_LABEL = '✓ 已复制';
  const SAVE_LABEL = '保存为 Markdown';
  const SAVED_LABEL = '✓ 已保存';

  class ReportView {
    constructor({
      modalEl,
      bodyEl,
      closeButtonEl,
      copyButtonEl,
      renderMarkdown,
      copyText,
      onSave,
      resetDelay = 2000,
    }) {
      this.modalEl = modalEl;
      this.bodyEl = bodyEl;
      this.closeButtonEl = closeButtonEl;
      this.copyButtonEl = copyButtonEl;
      this.renderMarkdown = renderMarkdown;
      this.copyText = copyText;
      this.onSave = onSave;
      this.resetDelay = resetDelay;
      this.saveButtonEl = null;
    }

    bind() {
      this.closeButtonEl.addEventListener('click', () => this.close());
      this.copyButtonEl.addEventListener('click', () => this.copyRenderedText());
    }

    openLoading() {
      this.bodyEl.innerHTML = '<p class="report-status">正在生成报告...</p>';
      this.open();
    }

    open() {
      this.modalEl.classList.remove('hidden');
    }

    close() {
      this.modalEl.classList.add('hidden');
    }

    showError(message) {
      const error = this.bodyEl.ownerDocument.createElement('p');
      error.className = 'report-error';
      error.textContent = `生成失败: ${message}`;
      this.bodyEl.innerHTML = '';
      this.bodyEl.appendChild(error);
    }

    render(reportMarkdown) {
      const safeHtml = this.renderMarkdown(reportMarkdown);
      this.renderHtml(safeHtml, { allowSave: true });
    }

    renderHtml(html, { allowSave = false } = {}) {
      this.bodyEl.innerHTML = `
        ${allowSave ? `<div class="report-actions"><button id="btn-save-report" class="btn-sm btn-save-report">${SAVE_LABEL}</button></div>` : ''}
        ${html}
      `;
      this.saveButtonEl = this.bodyEl.ownerDocument.getElementById('btn-save-report');
      if (this.saveButtonEl) {
        this.saveButtonEl.addEventListener('click', () => this.onSave());
      }
      this.open();
    }

    markSaved() {
      if (!this.saveButtonEl) {
        return;
      }

      this.saveButtonEl.textContent = SAVED_LABEL;
      this.saveButtonEl.classList.add('is-saved');
      setTimeout(() => {
        this.saveButtonEl.textContent = SAVE_LABEL;
        this.saveButtonEl.classList.remove('is-saved');
      }, this.resetDelay);
    }

    copyRenderedText() {
      return this.copyText(this.bodyEl.innerText).then(() => {
        this.copyButtonEl.textContent = COPIED_LABEL;
        setTimeout(() => {
          this.copyButtonEl.textContent = COPY_LABEL;
        }, this.resetDelay);
      });
    }
  }

  const api = {
    COPIED_LABEL,
    COPY_LABEL,
    SAVED_LABEL,
    SAVE_LABEL,
    ReportView,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletReportView = api;
}(typeof window !== 'undefined' ? window : globalThis));
