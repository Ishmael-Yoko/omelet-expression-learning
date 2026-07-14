(function initStatsView(global) {
  class StatsView {
    constructor({ fillersEl, hedgesEl, vagueEl, densityEl, calculateExpressionDensity }) {
      this.fillersEl = fillersEl;
      this.hedgesEl = hedgesEl;
      this.vagueEl = vagueEl;
      this.densityEl = densityEl;
      this.calculateExpressionDensity = calculateExpressionDensity;
    }

    render(stats) {
      this.fillersEl.textContent = stats.fillers;
      this.hedgesEl.textContent = stats.hedges;
      this.vagueEl.textContent = stats.vagueWords;
      this.densityEl.textContent = this.calculateExpressionDensity(stats);
    }
  }

  const api = { StatsView };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletStatsView = api;
}(typeof window !== 'undefined' ? window : globalThis));
