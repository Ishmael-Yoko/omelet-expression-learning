(function initTrainingControlsView(global) {
  const COPY_LABEL = '复制原文';
  const COPIED_LABEL = '✓ 已复制';
  const SAVE_LABEL = '保存原文';
  const SAVED_LABEL = '✓ 已保存';

  function setHidden(el, hidden) {
    el.classList.toggle('hidden', hidden);
  }

  class TrainingControlsView {
    constructor({
      startButtonEl,
      pauseButtonEl,
      resumeButtonEl,
      stopButtonEl,
      reportButtonEl,
      copyTextButtonEl,
      saveTextButtonEl,
      clearButtonEl,
      timerEl,
      resetDelay = 2000,
    }) {
      this.startButtonEl = startButtonEl;
      this.pauseButtonEl = pauseButtonEl;
      this.resumeButtonEl = resumeButtonEl;
      this.stopButtonEl = stopButtonEl;
      this.reportButtonEl = reportButtonEl;
      this.copyTextButtonEl = copyTextButtonEl;
      this.saveTextButtonEl = saveTextButtonEl;
      this.clearButtonEl = clearButtonEl;
      this.timerEl = timerEl;
      this.resetDelay = resetDelay;
    }

    showRecordingStarted() {
      setHidden(this.startButtonEl, true);
      setHidden(this.pauseButtonEl, false);
      setHidden(this.stopButtonEl, false);
      setHidden(this.reportButtonEl, true);
      setHidden(this.resumeButtonEl, true);
      this.setTimerActive(true);
    }

    showPaused() {
      setHidden(this.pauseButtonEl, true);
      setHidden(this.resumeButtonEl, false);
      this.setTimerActive(false);
    }

    showResumed() {
      setHidden(this.resumeButtonEl, true);
      setHidden(this.pauseButtonEl, false);
      this.setTimerActive(true);
    }

    showStopped(hasText) {
      setHidden(this.stopButtonEl, true);
      setHidden(this.pauseButtonEl, true);
      setHidden(this.resumeButtonEl, true);
      setHidden(this.startButtonEl, false);
      this.setTimerActive(false);
      setHidden(this.reportButtonEl, !hasText);
      this.setTextActionsVisible(hasText);
    }

    showTextReady() {
      setHidden(this.reportButtonEl, false);
      this.setTextActionsVisible(true);
    }

    reset() {
      this.setTimerText('00:00');
      this.setTimerActive(false);
      setHidden(this.reportButtonEl, true);
      this.setTextActionsVisible(false);
      this.resetCopyLabel();
      this.resetSaveLabel();
    }

    setTextActionsVisible(visible) {
      setHidden(this.copyTextButtonEl, !visible);
      setHidden(this.saveTextButtonEl, !visible);
      setHidden(this.clearButtonEl, !visible);
    }

    setTimerText(text) {
      this.timerEl.textContent = text;
    }

    setTimerActive(active) {
      this.timerEl.classList.toggle('active', active);
    }

    markCopied() {
      this.setButtonLabel(this.copyTextButtonEl, COPIED_LABEL);
      setTimeout(() => this.resetCopyLabel(), this.resetDelay);
    }

    markSaved() {
      this.setButtonLabel(this.saveTextButtonEl, SAVED_LABEL);
      setTimeout(() => this.resetSaveLabel(), this.resetDelay);
    }

    resetCopyLabel() {
      this.setButtonLabel(this.copyTextButtonEl, COPY_LABEL);
    }

    resetSaveLabel() {
      this.setButtonLabel(this.saveTextButtonEl, SAVE_LABEL);
    }

    setButtonLabel(button, text) {
      const label = button.querySelector('.btn-label');
      if (label) {
        label.textContent = text;
      } else {
        button.textContent = text;
      }
    }
  }

  const api = {
    COPIED_LABEL,
    COPY_LABEL,
    SAVED_LABEL,
    SAVE_LABEL,
    TrainingControlsView,
    setHidden,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletTrainingControlsView = api;
}(typeof window !== 'undefined' ? window : globalThis));
