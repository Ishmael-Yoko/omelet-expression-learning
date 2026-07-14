const test = require('node:test');
const assert = require('node:assert/strict');
const { AudioRecorder, DEFAULT_BUFFER_SIZE, DEFAULT_SAMPLE_RATE } = require('../src/audio-recorder');

function createHarness() {
  const calls = {
    contextOptions: null,
    feedSamples: [],
    results: [],
    sourceConnectedTo: null,
    processorConnectedTo: null,
    processorDisconnects: 0,
    contextClosed: 0,
    tracksStopped: 0,
  };

  const track = {
    stop: () => { calls.tracksStopped += 1; },
  };
  const stream = {
    getTracks: () => [track],
  };
  const processor = {
    onaudioprocess: null,
    connect: destination => { calls.processorConnectedTo = destination; },
    disconnect: () => { calls.processorDisconnects += 1; },
  };
  const source = {
    connect: target => { calls.sourceConnectedTo = target; },
  };

  class FakeAudioContext {
    constructor(options) {
      calls.contextOptions = options;
      this.destination = { id: 'destination' };
    }

    createMediaStreamSource(value) {
      assert.equal(value, stream);
      return source;
    }

    createScriptProcessor(...args) {
      calls.processorArgs = args;
      return processor;
    }

    close() {
      calls.contextClosed += 1;
      return Promise.resolve();
    }
  }

  const recorder = new AudioRecorder({
    mediaDevices: {
      getUserMedia: async (constraints) => {
        calls.constraints = constraints;
        return stream;
      },
    },
    AudioContextCtor: FakeAudioContext,
    feedAudio: async samples => {
      calls.feedSamples.push(samples);
      return { text: '识别结果', isFinal: true };
    },
    onResult: result => calls.results.push(result),
  });

  return { calls, processor, recorder, stream };
}

function createAudioEvent(samples = new Float32Array([0.1, 0.2])) {
  return {
    inputBuffer: {
      getChannelData: (channel) => {
        assert.equal(channel, 0);
        return samples;
      },
    },
  };
}

test('AudioRecorder starts microphone capture and wires processor graph', async () => {
  const { calls, processor, recorder } = createHarness();

  await recorder.start();

  assert.deepEqual(calls.constraints, { audio: true });
  assert.deepEqual(calls.contextOptions, { sampleRate: DEFAULT_SAMPLE_RATE });
  assert.deepEqual(calls.processorArgs, [DEFAULT_BUFFER_SIZE, 1, 1]);
  assert.equal(calls.sourceConnectedTo, processor);
  assert.equal(calls.processorConnectedTo.id, 'destination');
  assert.equal(recorder.isActive, true);
  assert.equal(recorder.isPaused, false);
});

test('AudioRecorder feeds audio samples and forwards recognition results', async () => {
  const { calls, processor, recorder } = createHarness();
  const samples = new Float32Array([0.3, 0.4]);

  await recorder.start();
  await processor.onaudioprocess(createAudioEvent(samples));

  assert.equal(calls.feedSamples[0], samples);
  assert.deepEqual(calls.results, [{ text: '识别结果', isFinal: true }]);
});

test('AudioRecorder skips audio work while paused', async () => {
  const { calls, processor, recorder } = createHarness();

  await recorder.start();
  recorder.pause();
  await processor.onaudioprocess(createAudioEvent());

  assert.equal(calls.feedSamples.length, 0);
  recorder.resume();
  await processor.onaudioprocess(createAudioEvent());
  assert.equal(calls.feedSamples.length, 1);
});

test('AudioRecorder stops processor, context, and media tracks', async () => {
  const { calls, recorder } = createHarness();

  await recorder.start();
  await recorder.stop();

  assert.equal(calls.processorDisconnects, 1);
  assert.equal(calls.contextClosed, 1);
  assert.equal(calls.tracksStopped, 1);
  assert.equal(recorder.audioProcessor, null);
  assert.equal(recorder.audioContext, null);
  assert.equal(recorder.mediaStream, null);
  assert.equal(recorder.isActive, false);
});
