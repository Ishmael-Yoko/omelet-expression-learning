(function initTranscriptAnalysisFlow(global) {
  class TranscriptAnalysisFlow {
    constructor({
      analyzeText,
      applyAnalysisToStats,
      buildAnalysisFeedbackItems,
      renderFinal,
      renderInterim,
      addFeedback,
    }) {
      this.analyzeText = analyzeText;
      this.applyAnalysisToStats = applyAnalysisToStats;
      this.buildAnalysisFeedbackItems = buildAnalysisFeedbackItems;
      this.renderFinal = renderFinal;
      this.renderInterim = renderInterim;
      this.addFeedback = addFeedback;
    }

    handleResult({ text, isFinal }, state) {
      if (!isFinal) {
        this.renderInterim(text);
        return { ...state, analysisPromise: null, didFinalize: false };
      }

      const nextState = {
        ...state,
        fullText: `${state.fullText}${text}`,
        sentences: [...state.sentences, text],
        didFinalize: true,
      };

      return {
        ...nextState,
        analysisPromise: this.analyzeAndRenderFinal(text, nextState.stats),
      };
    }

    async analyzeAndRenderFinal(text, stats) {
      const analysis = await this.analyzeText(text);
      if (analysis) {
        this.applyAnalysisToStats(stats, analysis);
        this.buildAnalysisFeedbackItems(analysis).forEach(item => {
          this.addFeedback(item.text, item.type);
        });
      }
      this.renderFinal(text, analysis);
      return analysis;
    }
  }

  const api = { TranscriptAnalysisFlow };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletTranscriptAnalysisFlow = api;
}(typeof window !== 'undefined' ? window : globalThis));
