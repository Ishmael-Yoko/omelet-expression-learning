(function initFinalReportFlow(global) {
  class FinalReportFlow {
    constructor({
      getFinalReport,
      openLoading,
      renderReport,
      showError,
    }) {
      this.getFinalReport = getFinalReport;
      this.openLoading = openLoading;
      this.renderReport = renderReport;
      this.showError = showError;
    }

    async generate({ fullText, stats }) {
      this.openLoading();

      const result = await this.getFinalReport({ fullText, stats });
      if (result.success) {
        this.renderReport(result.report);
        return { success: true, report: result.report };
      }

      this.showError(result.error);
      return { success: false, error: result.error };
    }
  }

  const api = { FinalReportFlow };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletFinalReportFlow = api;
}(typeof window !== 'undefined' ? window : globalThis));
