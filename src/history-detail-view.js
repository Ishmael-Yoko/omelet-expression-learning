(function initHistoryDetailView(global) {
  class HistoryDetailView {
    constructor({
      escapeHtml,
      formatHistoryTimestamp,
      renderMarkdown,
    }) {
      this.escapeHtml = escapeHtml;
      this.formatHistoryTimestamp = formatHistoryTimestamp;
      this.renderMarkdown = renderMarkdown;
    }

    calculateDensity(record) {
      if (!record?.stats?.totalWords) {
        return '--';
      }

      return `${Math.max(0, Math.round(((record.stats.totalWords - record.stats.fillers - record.stats.hedges) / record.stats.totalWords) * 100))}%`;
    }

    render(record) {
      const density = this.calculateDensity(record);
      const sourceText = record?.source === 'paste' ? '粘贴分析' : '录音训练';
      const reportHtml = record?.report ? this.renderMarkdown(record.report) : '';

      return `
        <section class="history-detail">
          <div class="history-detail-head">
            <span class="history-detail-tag">${sourceText}</span>
            <h2>${this.escapeHtml(record?.title || '未命名训练')}</h2>
            <p>${this.formatHistoryTimestamp(record?.updatedAt || record?.createdAt)}</p>
          </div>
          <div class="history-detail-grid">
            <div class="history-detail-stat">
              <span>时长</span>
              <strong>${record?.stats?.duration || 0}秒</strong>
            </div>
            <div class="history-detail-stat">
              <span>总字数</span>
              <strong>${record?.stats?.totalWords || 0}</strong>
            </div>
            <div class="history-detail-stat">
              <span>填充词</span>
              <strong>${record?.stats?.fillers || 0}</strong>
            </div>
            <div class="history-detail-stat">
              <span>表达密度</span>
              <strong>${density}</strong>
            </div>
          </div>
          <div class="history-detail-actions">
            <button class="btn-sm btn-secondary" id="btn-restore-history" type="button">恢复到当前工作区</button>
          </div>
          <div class="history-detail-block">
            <h3>完整原文</h3>
            <p>${this.escapeHtml(record?.fullText || '')}</p>
          </div>
          ${reportHtml ? `
            <div class="history-detail-block">
              <h3>历史报告</h3>
              <div class="history-detail-report">${reportHtml}</div>
            </div>
          ` : ''}
        </section>
      `;
    }
  }

  const api = { HistoryDetailView };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletHistoryDetailView = api;
}(typeof window !== 'undefined' ? window : globalThis));
