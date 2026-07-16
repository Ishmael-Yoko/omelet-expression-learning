(function initHistoryTrendView(global) {
  const DEFAULT_EMPTY = '最近 5 次训练趋势会显示在这里。';

  class HistoryTrendView {
    constructor({
      containerEl,
      emptyText = DEFAULT_EMPTY,
      onOpenDetail = null,
    }) {
      this.containerEl = containerEl;
      this.emptyText = emptyText;
      this.onOpenDetail = onOpenDetail;
    }

    render(snapshot) {
      if (!snapshot || !snapshot.sessions) {
        this.containerEl.innerHTML = `<div class="history-trend-empty">${this.emptyText}</div>`;
        return;
      }

      this.containerEl.innerHTML = `
        <div class="history-trend-head">
          <span>最近 ${snapshot.sessions} 次</span>
          <div class="history-trend-head-actions">
            <span>对比窗口 ${snapshot.windowSize} 次</span>
            ${this.onOpenDetail ? '<button class="btn-sm" id="btn-open-history-trend" type="button">查看趋势</button>' : ''}
          </div>
        </div>
        <div class="history-trend-grid">
          <div class="history-trend-card">
            <span>表达密度</span>
            <strong>${snapshot.latestDensity ?? '--'}%</strong>
            <em>${this.formatDelta(snapshot.densityDelta, '%')}</em>
          </div>
          <div class="history-trend-card">
            <span>填充词率</span>
            <strong>${snapshot.latestFillerRate ?? '--'}</strong>
            <em>${this.formatDelta(snapshot.fillerRateDelta, '/分钟')}</em>
          </div>
          <div class="history-trend-card">
            <span>犹豫词率</span>
            <strong>${snapshot.latestHedgeRate ?? '--'}</strong>
            <em>${this.formatDelta(snapshot.hedgeRateDelta, '/分钟')}</em>
          </div>
        </div>
      `;

      if (this.onOpenDetail) {
        const button = this.containerEl.querySelector('#btn-open-history-trend');
        if (button) {
          button.addEventListener('click', () => this.onOpenDetail(snapshot));
        }
      }
    }

    formatDelta(value, unit) {
      if (value == null) {
        return '样本不足';
      }

      return `${value >= 0 ? '+' : ''}${value}${unit}`;
    }
  }

  const api = {
    DEFAULT_EMPTY,
    HistoryTrendView,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletHistoryTrendView = api;
}(typeof window !== 'undefined' ? window : globalThis));
