const test = require('node:test');
const assert = require('node:assert/strict');
const { TrainingSessionFlow } = require('../src/training-session-flow');

function createFlow(options = {}) {
  const calls = {
    recorder: [],
    stopASR: 0,
  };
  let currentTime = 1000;
  const recorder = {
    start: async () => {
      calls.recorder.push('start');
      if (options.recorderStartError) {
        throw new Error(options.recorderStartError);
      }
    },
    pause: () => calls.recorder.push('pause'),
    resume: () => calls.recorder.push('resume'),
    stop: async () => calls.recorder.push('stop'),
  };
  const flow = new TrainingSessionFlow({
    initASR: async () => options.initResult || { success: true },
    stopASR: async () => {
      calls.stopASR += 1;
      return options.stopResult || {};
    },
    audioRecorder: recorder,
    getElapsedSeconds: (startTime, pausedTime, pauseStart) => (
      Math.floor((currentTime - startTime - pausedTime - (pauseStart ? currentTime - pauseStart : 0)) / 1000)
    ),
    now: () => currentTime,
  });

  return {
    calls,
    flow,
    setTime: value => { currentTime = value; },
  };
}

test('TrainingSessionFlow reports ASR initialization failures before recording starts', async () => {
  const { calls, flow } = createFlow({ initResult: { success: false, error: 'missing model' } });

  assert.deepEqual(await flow.start(), { success: false, error: 'missing model', stage: 'asr' });
  assert.deepEqual(calls.recorder, []);
  assert.equal(flow.isRecording, false);
});

test('TrainingSessionFlow reports microphone failures after ASR initialization', async () => {
  const { calls, flow } = createFlow({ recorderStartError: 'denied' });

  assert.deepEqual(await flow.start(), { success: false, error: 'denied', stage: 'microphone' });
  assert.deepEqual(calls.recorder, ['start']);
  assert.equal(flow.isRecording, false);
});

test('TrainingSessionFlow starts, pauses, resumes, and accounts for paused time', async () => {
  const { calls, flow, setTime } = createFlow();

  assert.deepEqual(await flow.start(), { success: true });
  setTime(6000);
  flow.pause();
  setTime(9000);
  flow.resume();
  setTime(12000);

  assert.deepEqual(calls.recorder, ['start', 'pause', 'resume']);
  assert.equal(flow.isRecording, true);
  assert.equal(flow.isPaused, false);
  assert.equal(flow.pausedTime, 3000);
  assert.equal(flow.getDuration(), 8);
});

test('TrainingSessionFlow stops recorder and returns final ASR text with duration', async () => {
  const { calls, flow, setTime } = createFlow({ stopResult: { finalText: '最后一句' } });

  await flow.start();
  setTime(11000);
  const result = await flow.stop();

  assert.deepEqual(result, { finalText: '最后一句', duration: 10 });
  assert.deepEqual(calls.recorder, ['start', 'stop']);
  assert.equal(calls.stopASR, 1);
  assert.equal(flow.isRecording, false);
  assert.equal(flow.isPaused, false);
});
