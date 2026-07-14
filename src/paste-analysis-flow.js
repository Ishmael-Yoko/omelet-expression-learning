(function initPasteAnalysisFlow(global) {
  class PasteAnalysisFlow {
    constructor({
      splitTranscriptSentences,
      analyzeText,
      applyAnalysisToStats,
      renderSentence,
    }) {
      this.splitTranscriptSentences = splitTranscriptSentences;
      this.analyzeText = analyzeText;
      this.applyAnalysisToStats = applyAnalysisToStats;
      this.renderSentence = renderSentence;
    }

    async analyze({ text, stats }) {
      const sentences = this.splitTranscriptSentences(text);

      for (const sentence of sentences) {
        const analysis = await this.analyzeText(sentence);
        if (analysis) {
          this.applyAnalysisToStats(stats, analysis);
        }
        this.renderSentence(sentence, analysis);
      }

      stats.duration = 0;
      return { sentences, stats };
    }
  }

  const api = { PasteAnalysisFlow };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletPasteAnalysisFlow = api;
}(typeof window !== 'undefined' ? window : globalThis));
