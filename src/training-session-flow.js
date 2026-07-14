(function initTrainingSessionFlow(global) {
  class TrainingSessionFlow {
    constructor({
      initASR,
      stopASR,
      audioRecorder,
      getElapsedSeconds,
      now = () => Date.now(),
    }) {
      this.initASR = initASR;
      this.stopASR = stopASR;
      this.audioRecorder = audioRecorder;
      this.getElapsedSeconds = getElapsedSeconds;
      this.now = now;
      this.isRecording = false;
      this.isPaused = false;
      this.startTime = null;
      this.pausedTime = 0;
      this.pauseStart = null;
    }

    async start() {
      const initResult = await this.initASR();
      if (!initResult.success) {
        return { success: false, error: initResult.error, stage: 'asr' };
      }

      try {
        await this.audioRecorder.start();
      } catch (err) {
        return { success: false, error: err.message, stage: 'microphone' };
      }

      this.isRecording = true;
      this.isPaused = false;
      this.startTime = this.now();
      this.pausedTime = 0;
      this.pauseStart = null;
      return { success: true };
    }

    pause() {
      this.isPaused = true;
      this.audioRecorder.pause();
      this.pauseStart = this.now();
    }

    resume() {
      this.isPaused = false;
      this.audioRecorder.resume();
      this.pausedTime += this.now() - this.pauseStart;
      this.pauseStart = null;
    }

    async stop() {
      await this.audioRecorder.stop();

      const stopResult = await this.stopASR();
      this.isRecording = false;
      this.isPaused = false;

      return {
        finalText: stopResult && stopResult.finalText ? stopResult.finalText : '',
        duration: this.getDuration(),
      };
    }

    getDuration() {
      return this.getElapsedSeconds(this.startTime, this.pausedTime, this.pauseStart);
    }
  }

  const api = { TrainingSessionFlow };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletTrainingSessionFlow = api;
}(typeof window !== 'undefined' ? window : globalThis));
