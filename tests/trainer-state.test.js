const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createTrainerState,
  resetTrainerState,
  setTranscriptText,
} = require('../src/trainer-state');
const { createEmptyStats } = require('../src/app-utils');

test('createTrainerState returns the renderer state baseline', () => {
  assert.deepEqual(createTrainerState({ createEmptyStats }), {
    fullText: '',
    sentences: [],
    stats: createEmptyStats(),
    lastReport: '',
  });
});

test('resetTrainerState clears transcript state and report by default', () => {
  const state = {
    fullText: '旧文本',
    sentences: ['旧文本'],
    stats: { fillers: 1 },
    lastReport: '旧报告',
  };

  assert.equal(resetTrainerState(state, { createEmptyStats }), state);
  assert.deepEqual(state, {
    fullText: '',
    sentences: [],
    stats: createEmptyStats(),
    lastReport: '',
  });
});

test('resetTrainerState can preserve the latest report', () => {
  const state = {
    fullText: '旧文本',
    sentences: ['旧文本'],
    stats: { fillers: 1 },
    lastReport: '旧报告',
  };

  resetTrainerState(state, { createEmptyStats, keepReport: true });

  assert.equal(state.lastReport, '旧报告');
  assert.equal(state.fullText, '');
  assert.deepEqual(state.sentences, []);
});

test('setTranscriptText resets state and installs pasted transcript text', () => {
  const state = {
    fullText: '旧文本',
    sentences: ['旧文本'],
    stats: { fillers: 1 },
    lastReport: '旧报告',
  };

  setTranscriptText(state, '新逐字稿', { createEmptyStats, keepReport: true });

  assert.deepEqual(state, {
    fullText: '新逐字稿',
    sentences: [],
    stats: createEmptyStats(),
    lastReport: '旧报告',
  });
});
