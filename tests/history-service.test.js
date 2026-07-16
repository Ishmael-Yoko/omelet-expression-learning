const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_LIMIT,
  getHistoryPath,
  loadTrainingHistory,
  upsertTrainingHistoryRecord,
} = require('../services/history-service');

function createHistoryPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'omelet-history-'));
  return path.join(dir, 'training-history.json');
}

test('getHistoryPath resolves under userData', () => {
  assert.equal(
    getHistoryPath('C:\\demo-user-data'),
    path.join('C:\\demo-user-data', 'training-history.json'),
  );
});

test('loadTrainingHistory returns newest records first and tolerates missing files', () => {
  const historyPath = createHistoryPath();

  assert.deepEqual(loadTrainingHistory({ historyPath }), []);

  fs.writeFileSync(historyPath, JSON.stringify([
    { id: 'older', updatedAt: '2026-07-15T08:00:00.000Z' },
    { id: 'newer', updatedAt: '2026-07-16T08:00:00.000Z' },
  ]));

  assert.deepEqual(
    loadTrainingHistory({ historyPath }).map(item => item.id),
    ['newer', 'older'],
  );
});

test('upsertTrainingHistoryRecord inserts, updates, and caps history length', () => {
  const historyPath = createHistoryPath();

  const base = {
    title: '训练 1',
    source: 'recording',
    excerpt: '片段',
    fullText: '全文',
    report: '',
    stats: { duration: 10, totalWords: 20, fillers: 1, hedges: 1, vagueWords: 1 },
  };

  upsertTrainingHistoryRecord({
    ...base,
    id: 'first',
    createdAt: '2026-07-15T08:00:00.000Z',
    updatedAt: '2026-07-15T08:00:00.000Z',
  }, { historyPath, limit: 2 });

  upsertTrainingHistoryRecord({
    ...base,
    id: 'second',
    createdAt: '2026-07-16T08:00:00.000Z',
    updatedAt: '2026-07-16T08:00:00.000Z',
  }, { historyPath, limit: 2 });

  upsertTrainingHistoryRecord({
    ...base,
    id: 'first',
    title: '训练 1 更新',
    createdAt: '2026-07-15T08:00:00.000Z',
    updatedAt: '2026-07-16T09:00:00.000Z',
  }, { historyPath, limit: 2 });

  upsertTrainingHistoryRecord({
    ...base,
    id: 'third',
    createdAt: '2026-07-16T10:00:00.000Z',
    updatedAt: '2026-07-16T10:00:00.000Z',
  }, { historyPath, limit: 2 });

  const ids = loadTrainingHistory({ historyPath }).map(item => item.id);
  assert.deepEqual(ids, ['third', 'first']);
  assert.equal(loadTrainingHistory({ historyPath }).length, 2);
  assert.equal(DEFAULT_LIMIT > 0, true);
});
