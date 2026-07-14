const fs = require('fs');
const path = require('path');
const { app, shell } = require('electron');
const {
  MODEL_SUBDIR,
  REQUIRED_MODEL_FILES,
  getExternalModelsDir,
  getBundledDevModelsDir,
} = require('../config/asr-config');

const MODEL_DOWNLOAD_URL =
  'https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-streaming-paraformer-bilingual-zh-en.tar.bz2';

function getModelCandidates(userDataPath = app.getPath('userData')) {
  return [
    path.join(getExternalModelsDir(userDataPath), MODEL_SUBDIR),
    path.join(getBundledDevModelsDir(), MODEL_SUBDIR),
  ];
}

function getMissingFiles(modelDir) {
  return REQUIRED_MODEL_FILES.filter(file => !fs.existsSync(path.join(modelDir, file)));
}

function getModelStatus(userDataPath) {
  const candidates = getModelCandidates(userDataPath).map(dir => ({
    dir,
    missingFiles: getMissingFiles(dir),
  }));
  const active = candidates.find(candidate => candidate.missingFiles.length === 0);

  return {
    ok: Boolean(active),
    activeDir: active ? active.dir : null,
    externalDir: candidates[0].dir,
    devDir: candidates[1].dir,
    requiredFiles: REQUIRED_MODEL_FILES,
    candidates,
    downloadUrl: MODEL_DOWNLOAD_URL,
  };
}

async function openExternalModelsDir() {
  const dir = getExternalModelsDir(app.getPath('userData'));
  fs.mkdirSync(dir, { recursive: true });
  await shell.openPath(dir);
  return dir;
}

module.exports = {
  MODEL_DOWNLOAD_URL,
  getMissingFiles,
  getModelCandidates,
  getModelStatus,
  openExternalModelsDir,
};
