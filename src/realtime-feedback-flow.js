(function initRealtimeFeedbackFlow(global) {
  const DEFAULT_MIN_DELTA = 30;

  class RealtimeFeedbackFlow {
    constructor({
      getRealtimeFeedback,
      addFeedback,
      minDelta = DEFAULT_MIN_DELTA,
    }) {
      this.getRealtimeFeedback = getRealtimeFeedback;
      this.addFeedback = addFeedback;
      this.minDelta = minDelta;
      this.lastFeedbackText = '';
    }

    reset() {
      this.lastFeedbackText = '';
    }

    shouldRequest(fullText) {
      return String(fullText || '').length - this.lastFeedbackText.length >= this.minDelta;
    }

    async request(fullText, { force = false } = {}) {
      if (!force && !this.shouldRequest(fullText)) {
        return { success: false, skipped: true };
      }

      this.lastFeedbackText = fullText;
      const result = await this.getRealtimeFeedback(fullText);
      if (!result.success || !result.feedback) {
        return result;
      }

      this.renderFeedback(result.feedback);
      return result;
    }

    renderFeedback(feedback) {
      String(feedback || '')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .forEach(line => this.addFeedback(line));
    }
  }

  const api = { DEFAULT_MIN_DELTA, RealtimeFeedbackFlow };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletRealtimeFeedbackFlow = api;
}(typeof window !== 'undefined' ? window : globalThis));
