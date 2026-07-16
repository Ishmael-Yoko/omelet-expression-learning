(function initHistoryView(global) {
  const DEFAULT_EMPTY = '最近的训练记录会显示在这里。';

  function formatHistoryTimestamp(value) {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return `${date.toLocaleDateString('zh-CN')} ${date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  function buildHistorySummary(record) {
    const density = record?.stats?.totalWords
      ? `${Math.max(0, Math.round(((record.stats.totalWords - record.stats.fillers - record.stats.hedges) / record.stats.totalWords) * 100))}%`
      : '--';
    return `时长 ${record?.stats?.duration || 0}秒 · ${record?.stats?.totalWords || 0}字 · 密度 ${density}`;
  }

  class HistoryView {
    constructor({
      containerEl,
      emptyText = DEFAULT_EMPTY,
      onSelect = null,
    }) {
      this.containerEl = containerEl;
      this.emptyText = emptyText;
      this.onSelect = onSelect;
    }

    render(records = []) {
      this.containerEl.innerHTML = '';

      if (!records.length) {
        const empty = this.containerEl.ownerDocument.createElement('div');
        empty.className = 'history-empty';
        empty.textContent = this.emptyText;
        this.containerEl.appendChild(empty);
        return;
      }

      records.forEach(record => {
        this.containerEl.appendChild(this.createItem(record));
      });
    }

    createItem(record) {
      const item = this.containerEl.ownerDocument.createElement('article');
      item.className = 'history-item';

      const title = this.containerEl.ownerDocument.createElement('div');
      title.className = 'history-title';
      title.textContent = record.title || '未命名训练';

      const meta = this.containerEl.ownerDocument.createElement('div');
      meta.className = 'history-meta';
      meta.textContent = `${record.source === 'paste' ? '粘贴分析' : '录音训练'} · ${formatHistoryTimestamp(record.updatedAt || record.createdAt)}`;

      const summary = this.containerEl.ownerDocument.createElement('div');
      summary.className = 'history-summary';
      summary.textContent = buildHistorySummary(record);

      const excerpt = this.containerEl.ownerDocument.createElement('p');
      excerpt.className = 'history-excerpt';
      excerpt.textContent = record.excerpt || '';

      if (this.onSelect) {
        item.tabIndex = 0;
        item.setAttribute('role', 'button');
        item.addEventListener('click', () => this.onSelect(record));
        item.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.onSelect(record);
          }
        });
      }

      item.append(title, meta, summary, excerpt);
      return item;
    }
  }

  const api = {
    DEFAULT_EMPTY,
    HistoryView,
    buildHistorySummary,
    formatHistoryTimestamp,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletHistoryView = api;
}(typeof window !== 'undefined' ? window : globalThis));
