(function initExportActions(global) {
  class ExportActions {
    constructor({
      buildOriginalTextFilename,
      buildOriginalTextMarkdown,
      buildReportFilename,
      buildReportMarkdown,
      getExportTimestamp,
      saveFile,
      writeClipboard,
      now,
    }) {
      this.buildOriginalTextFilename = buildOriginalTextFilename;
      this.buildOriginalTextMarkdown = buildOriginalTextMarkdown;
      this.buildReportFilename = buildReportFilename;
      this.buildReportMarkdown = buildReportMarkdown;
      this.getExportTimestamp = getExportTimestamp;
      this.saveFile = saveFile;
      this.writeClipboard = writeClipboard;
      this.now = now;
    }

    async copyOriginalText(fullText) {
      if (!String(fullText || '').trim()) {
        return { success: false, skipped: true };
      }

      await this.writeClipboard(fullText);
      return { success: true };
    }

    async saveOriginalText(fullText) {
      if (!String(fullText || '').trim()) {
        return { success: false, skipped: true };
      }

      const { dateStr, timeStr } = this.getExportTimestamp(this.now?.());
      const markdown = this.buildOriginalTextMarkdown({ dateStr, fullText });
      const filename = this.buildOriginalTextFilename({ dateStr, timeStr });
      return this.saveFile(markdown, filename);
    }

    async saveReport({ report, stats, fullText }) {
      if (!report) {
        return { success: false, skipped: true };
      }

      const { dateStr, timeStr } = this.getExportTimestamp(this.now?.());
      const markdown = this.buildReportMarkdown({ dateStr, stats, fullText, report });
      const filename = this.buildReportFilename({ dateStr, timeStr });
      return this.saveFile(markdown, filename);
    }
  }

  const api = { ExportActions };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletExportActions = api;
}(typeof window !== 'undefined' ? window : globalThis));
