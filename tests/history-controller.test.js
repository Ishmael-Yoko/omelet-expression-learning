const test = require('node:test');
const assert = require('node:assert/strict');
const { HistoryController } = require('../src/history-controller');

test('HistoryController saves records, renders views, and restores payloads', async () => {
  const calls = {
    renderedRecords: [],
    trendSnapshots: [],
    reportHtml: [],
    restorePayloads: [],
  };
  const controller = new HistoryController({
    getTrainingHistory: async () => [{ id: 'one', stats: { duration: 10, totalWords: 20, fillers: 1, hedges: 1 } }],
    saveTrainingHistoryRecord: async record => ({ records: [record] }),
    historyView: {
      render: records => calls.renderedRecords.push(records),
    },
    historyTrendView: {
      render: snapshot => calls.trendSnapshots.push(snapshot),
    },
    reportView: {
      renderHtml: html => calls.reportHtml.push(html),
      bindRenderedAction: (_selector, handler) => {
        calls.restoreAction = handler;
      },
      close: () => {
        calls.closed = true;
      },
    },
    historyDetailView: {
      render: record => `<section>${record.title}</section>`,
    },
    buildTrendSnapshot: records => ({ sessions: records.length, windowSize: 5 }),
    createEmptyStats: () => ({ duration: 0, totalWords: 0, fillers: 0, hedges: 0, vagueWords: 0 }),
    splitTranscriptSentences: text => [text],
    onRestore: async payload => {
      calls.restorePayloads.push(payload);
    },
  });

  const loaded = await controller.load();
  assert.equal(loaded.length, 1);
  assert.equal(calls.renderedRecords.length, 1);
  assert.equal(calls.trendSnapshots[0].sessions, 1);

  const historyState = await controller.saveCurrentRecord({
    source: 'recording',
    fullText: '完整原文',
    lastReport: '报告',
    stats: { duration: 30, totalWords: 50, fillers: 2, hedges: 1, vagueWords: 0 },
    trainingMode: 'presentation',
    historyRecordId: '',
    historySource: '',
    historyCreatedAt: '',
  });

  assert.equal(historyState.historySource, 'recording');
  assert.equal(calls.renderedRecords.at(-1)[0].trainingMode, 'presentation');

  const record = {
    id: 'recording-1',
    title: '训练记录',
    source: 'recording',
    trainingMode: 'sales',
    createdAt: '2026-07-16T08:00:00.000Z',
    fullText: '完整原文',
    report: '报告',
    stats: { duration: 40, totalWords: 80, fillers: 4, hedges: 2, vagueWords: 1 },
  };
  controller.openRecord(record);
  assert.equal(calls.reportHtml.at(-1).includes('训练记录'), true);
  await calls.restoreAction();
  assert.equal(calls.closed, true);
  assert.equal(calls.restorePayloads[0].trainingMode, 'sales');
});
