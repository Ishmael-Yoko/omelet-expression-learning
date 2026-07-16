const fs = require('node:fs');
const path = require('node:path');
const { app } = require('electron');

const DEFAULT_LIMIT = 40;

function getHistoryPath(userDataPath = app.getPath('userData')) {
  return path.join(userDataPath, 'training-history.json');
}

function readHistoryFile(options = {}) {
  const historyPath = options.historyPath || getHistoryPath(options.userDataPath);
  if (!fs.existsSync(historyPath)) {
    return [];
  }

  try {
    const raw = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function loadTrainingHistory(options = {}) {
  return readHistoryFile(options)
    .sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
}

function upsertTrainingHistoryRecord(record, options = {}) {
  if (!record || !record.id) {
    throw new Error('Training history record requires an id');
  }

  const historyPath = options.historyPath || getHistoryPath(options.userDataPath);
  const limit = options.limit || DEFAULT_LIMIT;
  const current = readHistoryFile({ historyPath });
  const next = current.filter(item => item.id !== record.id);
  next.unshift(record);
  const capped = next
    .sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')))
    .slice(0, limit);
  fs.writeFileSync(historyPath, JSON.stringify(capped, null, 2));
  return capped;
}

module.exports = {
  DEFAULT_LIMIT,
  getHistoryPath,
  loadTrainingHistory,
  readHistoryFile,
  upsertTrainingHistoryRecord,
};
