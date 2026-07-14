(function initModelStatusView(global) {
  function getMissingFilesText(status) {
    const firstCandidate = status?.candidates?.[0];
    return (firstCandidate?.missingFiles || []).join('、') || '未知文件';
  }

  class ModelStatusView {
    constructor({
      statusEl,
      textEl,
      actionsEl,
      downloadLinkEl,
      openButtonEl,
      refreshButtonEl,
      onOpenModelsDir,
      onRefresh,
    }) {
      this.statusEl = statusEl;
      this.textEl = textEl;
      this.actionsEl = actionsEl;
      this.downloadLinkEl = downloadLinkEl;
      this.openButtonEl = openButtonEl;
      this.refreshButtonEl = refreshButtonEl;
      this.onOpenModelsDir = onOpenModelsDir;
      this.onRefresh = onRefresh;
    }

    bind() {
      this.openButtonEl.addEventListener('click', () => this.onOpenModelsDir());
      this.refreshButtonEl.addEventListener('click', () => this.onRefresh());
    }

    renderChecking() {
      this.setState('checking');
      this.actionsEl.classList.add('hidden');
      this.textEl.textContent = '正在检测本地语音模型...';
    }

    render(status) {
      this.downloadLinkEl.href = status.downloadUrl || '';

      if (status.ok) {
        this.renderReady(status);
        return;
      }

      this.renderMissing(status);
    }

    renderReady(status) {
      this.setState('ok');
      this.actionsEl.classList.add('hidden');
      this.textEl.textContent = `语音模型已就绪：${status.activeDir}`;
    }

    renderMissing(status) {
      this.setState('missing');
      this.actionsEl.classList.remove('hidden');
      this.textEl.textContent = `语音模型未就绪，请将模型放到：${status.externalDir}。缺少：${getMissingFilesText(status)}`;
    }

    setState(state) {
      this.statusEl.classList.toggle('model-status-checking', state === 'checking');
      this.statusEl.classList.toggle('model-status-ok', state === 'ok');
      this.statusEl.classList.toggle('model-status-missing', state === 'missing');
    }
  }

  const api = { ModelStatusView, getMissingFilesText };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletModelStatusView = api;
}(typeof window !== 'undefined' ? window : globalThis));
