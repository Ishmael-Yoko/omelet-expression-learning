const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { calculateExpressionDensity } = require('../src/app-utils');
const { StatsView } = require('../src/stats-view');

function createView() {
  const dom = new JSDOM(`
    <span id="fillers"></span>
    <span id="hedges"></span>
    <span id="vague"></span>
    <span id="density"></span>
  `);
  const document = dom.window.document;

  return {
    document,
    view: new StatsView({
      fillersEl: document.getElementById('fillers'),
      hedgesEl: document.getElementById('hedges'),
      vagueEl: document.getElementById('vague'),
      densityEl: document.getElementById('density'),
      calculateExpressionDensity,
    }),
  };
}

test('StatsView renders count and expression density values', () => {
  const { document, view } = createView();

  view.render({
    fillers: 2,
    hedges: 1,
    vagueWords: 3,
    totalWords: 10,
    duration: 0,
  });

  assert.equal(document.getElementById('fillers').textContent, '2');
  assert.equal(document.getElementById('hedges').textContent, '1');
  assert.equal(document.getElementById('vague').textContent, '3');
  assert.equal(document.getElementById('density').textContent, '70%');
});

test('StatsView renders empty density fallback', () => {
  const { document, view } = createView();

  view.render({
    fillers: 0,
    hedges: 0,
    vagueWords: 0,
    totalWords: 0,
    duration: 0,
  });

  assert.equal(document.getElementById('density').textContent, '--');
});
