(function initHistoryTrends(global) {
  const DEFAULT_WINDOW_SIZE = 5;

  function calculateDensity(stats) {
    if (!stats || !stats.totalWords) {
      return null;
    }

    return Math.max(0, Math.round(((stats.totalWords - stats.fillers - stats.hedges) / stats.totalWords) * 100));
  }

  function calculateRate(count, duration) {
    if (!duration) {
      return null;
    }

    return Number((count / (duration / 60)).toFixed(1));
  }

  function computeTrendDelta(values) {
    if (values.length < 2) {
      return null;
    }

    const first = values[0];
    const last = values[values.length - 1];
    if (first == null || last == null) {
      return null;
    }

    return Number((last - first).toFixed(1));
  }

  function buildTrendSnapshot(records, windowSize = DEFAULT_WINDOW_SIZE) {
    const recent = (records || []).slice(0, windowSize).reverse();
    const densitySeries = recent.map(record => calculateDensity(record.stats));
    const fillerRateSeries = recent.map(record => calculateRate(record?.stats?.fillers || 0, record?.stats?.duration || 0));
    const hedgeRateSeries = recent.map(record => calculateRate(record?.stats?.hedges || 0, record?.stats?.duration || 0));

    return {
      windowSize,
      sessions: recent.length,
      latestDensity: densitySeries.at(-1) ?? null,
      latestFillerRate: fillerRateSeries.at(-1) ?? null,
      latestHedgeRate: hedgeRateSeries.at(-1) ?? null,
      densityDelta: computeTrendDelta(densitySeries),
      fillerRateDelta: computeTrendDelta(fillerRateSeries),
      hedgeRateDelta: computeTrendDelta(hedgeRateSeries),
    };
  }

  const api = {
    DEFAULT_WINDOW_SIZE,
    buildTrendSnapshot,
    calculateDensity,
    calculateRate,
    computeTrendDelta,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletHistoryTrends = api;
}(typeof window !== 'undefined' ? window : globalThis));
