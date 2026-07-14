/**
 * 语音识别模块 - 基于 sherpa-onnx-node。
 * 打包版本优先从 Electron userData/models 读取模型，开发环境回退到仓库 models。
 */

const path = require('path');
const fs = require('fs');
const {
  MODEL_SUBDIR,
  REQUIRED_MODEL_FILES,
  getExternalModelsDir,
  getBundledDevModelsDir,
  sampleRate,
  featureDim,
  numThreads,
} = require('../config/asr-config');

let recognizer = null;
let stream = null;
let isRunning = false;
let activeModelDir = null;

function hasRequiredModels(modelDir) {
  return REQUIRED_MODEL_FILES.every(file => fs.existsSync(path.join(modelDir, file)));
}

function resolveModelDir(userDataPath) {
  const candidates = [
    path.join(getExternalModelsDir(userDataPath), MODEL_SUBDIR),
    path.join(getBundledDevModelsDir(), MODEL_SUBDIR),
  ];

  const found = candidates.find(hasRequiredModels);
  if (found) return found;

  throw new Error(
    `模型文件未找到。\n` +
    `请将 ${MODEL_SUBDIR} 放到以下任一目录：\n` +
    candidates.map(dir => `- ${dir}`).join('\n')
  );
}

async function initASR() {
  if (recognizer) {
    stream = recognizer.createStream();
    isRunning = true;
    console.log('[ASR] 重用已有引擎，创建新 stream');
    return;
  }

  activeModelDir = resolveModelDir();
  const sherpa = require('sherpa-onnx-node');

  const config = {
    featConfig: {
      sampleRate,
      featureDim,
    },
    modelConfig: {
      paraformer: {
        encoder: path.join(activeModelDir, 'encoder.int8.onnx'),
        decoder: path.join(activeModelDir, 'decoder.int8.onnx'),
      },
      tokens: path.join(activeModelDir, 'tokens.txt'),
      numThreads,
      provider: 'cpu',
      debug: false,
    },
    decodingMethod: 'greedy_search',
    maxActivePaths: 4,
    enableEndpoint: true,
    rule1MinTrailingSilence: 2.4,
    rule2MinTrailingSilence: 1.2,
    rule3MinUtteranceLength: 20,
  };

  recognizer = new sherpa.OnlineRecognizer(config);
  stream = recognizer.createStream();
  isRunning = true;

  console.log(`[ASR] 识别引擎初始化完成: ${activeModelDir}`);
}

function feedAudio(samples) {
  if (!isRunning || !stream || !recognizer) return null;

  stream.acceptWaveform({ samples, sampleRate });

  while (recognizer.isReady(stream)) {
    recognizer.decode(stream);
  }

  const result = recognizer.getResult(stream);
  const text = (result.text || '').trim();
  const isEndpoint = recognizer.isEndpoint(stream);

  if (isEndpoint && text) {
    recognizer.reset(stream);
    return { text, isFinal: true };
  }
  if (text) {
    return { text, isFinal: false };
  }

  return null;
}

function stopRecognition() {
  isRunning = false;

  let finalText = '';
  if (stream && recognizer) {
    stream.inputFinished();
    while (recognizer.isReady(stream)) {
      recognizer.decode(stream);
    }
    const result = recognizer.getResult(stream);
    finalText = (result.text || '').trim();
    stream = null;
  }

  console.log('[ASR] 停止录制');
  return finalText;
}

module.exports = { initASR, feedAudio, stopRecognition, resolveModelDir };
