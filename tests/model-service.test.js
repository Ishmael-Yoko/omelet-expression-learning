const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getMissingFiles,
  getModelStatus,
  MODEL_DOWNLOAD_URL,
} = require('../services/model-service');
const {
  MODEL_SUBDIR,
  REQUIRED_MODEL_FILES,
} = require('../config/asr-config');

test('getMissingFiles reports missing and present model files', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'omelet-model-'));
  assert.deepEqual(getMissingFiles(temp), REQUIRED_MODEL_FILES);

  fs.writeFileSync(path.join(temp, REQUIRED_MODEL_FILES[0]), '');
  assert.equal(getMissingFiles(temp).includes(REQUIRED_MODEL_FILES[0]), false);
});

test('getModelStatus detects a complete external model directory', () => {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'omelet-user-data-'));
  const modelDir = path.join(userData, 'models', MODEL_SUBDIR);
  fs.mkdirSync(modelDir, { recursive: true });

  for (const file of REQUIRED_MODEL_FILES) {
    fs.writeFileSync(path.join(modelDir, file), '');
  }

  const status = getModelStatus(userData);
  assert.equal(status.ok, true);
  assert.equal(status.activeDir, modelDir);
  assert.equal(status.externalDir, modelDir);
  assert.equal(status.downloadUrl, MODEL_DOWNLOAD_URL);
});
