const test = require('node:test');
const assert = require('node:assert/strict');
const { applyAnalysisToStats, createEmptyStats } = require('../src/app-utils');
const { TranscriptAnalysisFlow } = require('../src/transcript-analysis-flow');

function createFlow() {
  const calls = {
    feedback: [],
    finals: [],
    interims: [],
  };
  const analysis = {
    fillers: [{ word: '嗯' }],
    hedges: [{ word: '可能' }],
    vagueWords: [{ word: '很好', alternatives: ['明确'] }],
    totalWords: 5,
  };
  const flow = new TranscriptAnalysisFlow({
    analyzeText: async () => analysis,
    applyAnalysisToStats,
    buildAnalysisFeedbackItems: value => [
      { text: `反馈:${value.vagueWords[0].word}`, type: 'vague' },
    ],
    renderFinal: (text, value) => calls.finals.push({ text, analysis: value }),
    renderInterim: text => calls.interims.push(text),
    addFeedback: (text, type) => calls.feedback.push({ text, type }),
  });

  return { analysis, calls, flow };
}

test('TranscriptAnalysisFlow renders interim text without changing transcript state', () => {
  const { calls, flow } = createFlow();
  const state = {
    fullText: '已有',
    sentences: ['已有'],
    stats: createEmptyStats(),
  };

  const result = flow.handleResult({ text: '正在识别', isFinal: false }, state);

  assert.equal(result.didFinalize, false);
  assert.equal(result.fullText, state.fullText);
  assert.equal(result.sentences, state.sentences);
  assert.deepEqual(calls.interims, ['正在识别']);
  assert.deepEqual(calls.finals, []);
});

test('TranscriptAnalysisFlow finalizes text and applies async analysis side effects', async () => {
  const { analysis, calls, flow } = createFlow();
  const state = {
    fullText: '第一句。',
    sentences: ['第一句。'],
    stats: createEmptyStats(),
  };

  const result = flow.handleResult({ text: '嗯可能很好。', isFinal: true }, state);

  assert.equal(result.didFinalize, true);
  assert.equal(result.fullText, '第一句。嗯可能很好。');
  assert.deepEqual(result.sentences, ['第一句。', '嗯可能很好。']);

  await new Promise(resolve => setImmediate(resolve));

  assert.deepEqual(result.stats, {
    fillers: 1,
    hedges: 1,
    vagueWords: 1,
    totalWords: 5,
    duration: 0,
  });
  assert.deepEqual(calls.feedback, [{ text: '反馈:很好', type: 'vague' }]);
  assert.deepEqual(calls.finals, [{ text: '嗯可能很好。', analysis }]);
});
