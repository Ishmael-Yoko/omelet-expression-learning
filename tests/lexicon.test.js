const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeText, loadLexicon } = require('../lib/lexicon');

test('analyzeText lazily loads lexicon and detects filler, hedge, and vague words', () => {
  const result = analyzeText('嗯我觉得这个很好');

  assert.ok(result);
  assert.equal(result.fillers.some(item => item.word === '嗯'), true);
  assert.equal(result.hedges.some(item => item.word === '我觉得'), true);
  assert.equal(result.vagueWords.some(item => item.word === '很好'), true);
  assert.equal(typeof result.density, 'number');
});

test('analyzeText returns null for blank input', () => {
  assert.equal(analyzeText('   '), null);
});

test('loadLexicon can be called repeatedly without changing public behavior', () => {
  loadLexicon();
  loadLexicon();

  const result = analyzeText('开心');
  assert.equal(result.vagueWords[0].word, '开心');
});
