const test = require('node:test');
const assert = require('node:assert/strict');
const { applyAnalysisToStats, createEmptyStats, splitTranscriptSentences } = require('../src/app-utils');
const { PasteAnalysisFlow } = require('../src/paste-analysis-flow');

test('PasteAnalysisFlow analyzes each pasted sentence in order', async () => {
  const calls = [];
  const rendered = [];
  const flow = new PasteAnalysisFlow({
    splitTranscriptSentences,
    applyAnalysisToStats,
    analyzeText: async (sentence) => {
      calls.push(sentence);
      if (sentence === '第二句！') {
        return null;
      }
      return {
        fillers: [{ word: '嗯' }],
        hedges: [],
        vagueWords: [{ word: '很好' }],
        totalWords: 4,
      };
    },
    renderSentence: (sentence, analysis) => rendered.push({ sentence, analysis }),
  });
  const stats = createEmptyStats();
  stats.duration = 99;

  const result = await flow.analyze({ text: '第一句。第二句！第三句', stats });

  assert.deepEqual(result.sentences, ['第一句。', '第二句！', '第三句']);
  assert.deepEqual(calls, ['第一句。', '第二句！', '第三句']);
  assert.equal(rendered.length, 3);
  assert.equal(rendered[1].analysis, null);
  assert.deepEqual(result.stats, {
    fillers: 2,
    hedges: 0,
    vagueWords: 2,
    totalWords: 8,
    duration: 0,
  });
});

test('PasteAnalysisFlow handles blank pasted text', async () => {
  const rendered = [];
  const flow = new PasteAnalysisFlow({
    splitTranscriptSentences,
    applyAnalysisToStats,
    analyzeText: async () => {
      throw new Error('blank text should not be analyzed');
    },
    renderSentence: (sentence, analysis) => rendered.push({ sentence, analysis }),
  });

  const result = await flow.analyze({ text: '  ', stats: createEmptyStats() });

  assert.deepEqual(result.sentences, []);
  assert.deepEqual(rendered, []);
});
