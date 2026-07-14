const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAnalysisFeedbackItems } = require('../src/analysis-feedback-rules');

test('buildAnalysisFeedbackItems returns no items for empty analysis', () => {
  assert.deepEqual(buildAnalysisFeedbackItems(null), []);
  assert.deepEqual(buildAnalysisFeedbackItems({ fillers: [], hedges: [], vagueWords: [] }), []);
});

test('buildAnalysisFeedbackItems formats vague word alternatives', () => {
  assert.deepEqual(buildAnalysisFeedbackItems({
    vagueWords: [
      { word: '很好', alternatives: ['明确', '稳定', '可量化', '额外候选'] },
    ],
    fillers: [],
    hedges: [],
  }), [
    { text: '「很好」 -> 明确 / 稳定 / 可量化', type: 'vague' },
  ]);
});

test('buildAnalysisFeedbackItems summarizes repeated fillers after threshold', () => {
  assert.deepEqual(buildAnalysisFeedbackItems({
    vagueWords: [],
    fillers: [{ word: '嗯' }, { word: '然后' }, { word: '嗯' }, { word: '就是' }],
    hedges: [],
  }), [
    { text: '填充词：嗯、然后、就是 - 试试停顿', type: 'filler' },
  ]);
});

test('buildAnalysisFeedbackItems summarizes hedges directly', () => {
  assert.deepEqual(buildAnalysisFeedbackItems({
    vagueWords: [],
    fillers: [{ word: '嗯' }],
    hedges: [{ word: '可能' }, { word: '应该' }, { word: '可能' }],
  }), [
    { text: '「可能」「应该」 -> 直接说', type: 'hedge' },
  ]);
});
