(function initTrainerState(global) {
  function createTrainerState({ createEmptyStats }) {
    return {
      fullText: '',
      sentences: [],
      stats: createEmptyStats(),
      lastReport: '',
    };
  }

  function resetTrainerState(state, { createEmptyStats, keepReport = false } = {}) {
    state.fullText = '';
    state.sentences = [];
    state.stats = createEmptyStats();
    if (!keepReport) {
      state.lastReport = '';
    }
    return state;
  }

  function setTranscriptText(state, text, { createEmptyStats, keepReport = false } = {}) {
    resetTrainerState(state, { createEmptyStats, keepReport });
    state.fullText = text;
    return state;
  }

  const api = { createTrainerState, resetTrainerState, setTranscriptText };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletTrainerState = api;
}(typeof window !== 'undefined' ? window : globalThis));
