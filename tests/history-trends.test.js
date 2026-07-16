const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_WINDOW_SIZE,
  buildTrendSnapshot,
  calculateDensity,
  calculateRate,
  computeTrendDelta,
} = require('../src/history-trends');

test('history trend helpers calculate density, rates, and deltas', () => {
  assert.equal(calculateDensity({ totalWords: 20, fillers: 2, hedges: 1 }), 85);
  assert.equal(calculateDensity({ totalWords: 0, fillers: 0, hedges: 0 }), null);
  assert.equal(calculateRate(3, 60), 3);
  assert.equal(calculateRate(3, 0), null);
  assert.equal(computeTrendDelta([80, 84, 88]), 8);
  assert.equal(computeTrendDelta([3, 2.5, 1.8]), -1.2);
  assert.equal(computeTrendDelta([80]), null);
});

test('buildTrendSnapshot summarizes recent training records', () => {
  const snapshot = buildTrendSnapshot([
    { stats: { duration: 120, totalWords: 100, fillers: 10, hedges: 5 } },
    { stats: { duration: 90, totalWords: 90, fillers: 6, hedges: 4 } },
    { stats: { duration: 60, totalWords: 60, fillers: 3, hedges: 3 } },
  ]);

  assert.equal(snapshot.windowSize, DEFAULT_WINDOW_SIZE);
  assert.equal(snapshot.sessions, 3);
  assert.equal(snapshot.latestDensity, 85);
  assert.equal(snapshot.latestFillerRate, 5);
  assert.equal(snapshot.latestHedgeRate, 2.5);
  assert.equal(snapshot.densityDelta, -5);
});
