(function initAudioRecorder(global) {
  const DEFAULT_SAMPLE_RATE = 16000;
  const DEFAULT_BUFFER_SIZE = 4096;

  class AudioRecorder {
    constructor({
      mediaDevices = global.navigator?.mediaDevices,
      AudioContextCtor = global.AudioContext || global.webkitAudioContext,
      feedAudio,
      onResult,
      sampleRate = DEFAULT_SAMPLE_RATE,
      bufferSize = DEFAULT_BUFFER_SIZE,
    }) {
      this.mediaDevices = mediaDevices;
      this.AudioContextCtor = AudioContextCtor;
      this.feedAudio = feedAudio;
      this.onResult = onResult;
      this.sampleRate = sampleRate;
      this.bufferSize = bufferSize;
      this.audioContext = null;
      this.audioProcessor = null;
      this.mediaStream = null;
      this.isActive = false;
      this.isPaused = false;
    }

    async start() {
      const stream = await this.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new this.AudioContextCtor({ sampleRate: this.sampleRate });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(this.bufferSize, 1, 1);

      processor.onaudioprocess = async (event) => {
        if (!this.isActive || this.isPaused) {
          return;
        }

        const samples = event.inputBuffer.getChannelData(0);
        const result = await this.feedAudio(samples);
        if (result) {
          this.onResult(result);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      this.audioContext = audioContext;
      this.audioProcessor = processor;
      this.mediaStream = stream;
      this.isActive = true;
      this.isPaused = false;
    }

    pause() {
      this.isPaused = true;
    }

    resume() {
      this.isPaused = false;
    }

    async stop() {
      this.isActive = false;
      this.isPaused = false;

      if (this.audioProcessor) {
        this.audioProcessor.disconnect();
        this.audioProcessor = null;
      }

      if (this.audioContext) {
        await this.audioContext.close();
        this.audioContext = null;
      }

      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }
    }
  }

  const api = { AudioRecorder, DEFAULT_BUFFER_SIZE, DEFAULT_SAMPLE_RATE };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletAudioRecorder = api;
}(typeof window !== 'undefined' ? window : globalThis));
