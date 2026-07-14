const path = require('path');

const MODEL_SUBDIR = 'sherpa-onnx-streaming-paraformer-bilingual-zh-en';
const REQUIRED_MODEL_FILES = ['encoder.int8.onnx', 'decoder.int8.onnx', 'tokens.txt'];

function getExternalModelsDir(userDataPath) {
  if (!userDataPath) {
    const { app } = require('electron');
    userDataPath = app.getPath('userData');
  }
  return path.join(userDataPath, 'models');
}

function getBundledDevModelsDir() {
  return path.join(__dirname, '..', 'models');
}

module.exports = {
  MODEL_SUBDIR,
  REQUIRED_MODEL_FILES,
  getExternalModelsDir,
  getBundledDevModelsDir,
  sampleRate: 16000,
  featureDim: 80,
  numThreads: 2,
};
