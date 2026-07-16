(function initHistoryController(global) {
  class HistoryController {
    constructor({
      getTrainingHistory,
      saveTrainingHistoryRecord,
      historyView,
      historyTrendView,
      reportView,
      historyDetailView,
      buildTrendSnapshot,
      createEmptyStats,
      splitTranscriptSentences,
      onRestore,
    }) {
      this.getTrainingHistory = getTrainingHistory;
      this.saveTrainingHistoryRecord = saveTrainingHistoryRecord;
      this.historyView = historyView;
      this.historyTrendView = historyTrendView;
      this.reportView = reportView;
      this.historyDetailView = historyDetailView;
      this.buildTrendSnapshot = buildTrendSnapshot;
      this.createEmptyStats = createEmptyStats;
      this.splitTranscriptSentences = splitTranscriptSentences;
      this.onRestore = onRestore;
    }

    async load() {
      const records = await this.getTrainingHistory();
      this.render(records);
      return records;
    }

    render(records) {
      this.historyView.render(records);
      this.historyTrendView.render(this.buildTrendSnapshot(records));
    }

    async saveCurrentRecord({
      source,
      fullText,
      lastReport,
      stats,
      trainingMode,
      historyRecordId,
      historySource,
      historyCreatedAt,
    }) {
      if (!String(fullText || '').trim()) {
        return { historyRecordId, historySource, historyCreatedAt };
      }

      const now = new Date();
      const summaryLine = String(fullText).trim().split(/\s+/).join('').slice(0, 22);
      const title = summaryLine ? `${summaryLine}${fullText.length > 22 ? '...' : ''}` : '未命名训练';
      const isNewRecord = historyRecordId === '' || historySource !== source;
      const nextRecordId = isNewRecord ? `${source}-${now.getTime()}` : historyRecordId;
      const nextHistoryCreatedAt = isNewRecord ? now.toISOString() : (historyCreatedAt || now.toISOString());

      const record = {
        id: nextRecordId,
        title,
        source,
        trainingMode,
        createdAt: nextHistoryCreatedAt,
        updatedAt: now.toISOString(),
        excerpt: String(fullText).trim().slice(0, 120),
        fullText,
        report: lastReport,
        stats: { ...stats },
      };

      const result = await this.saveTrainingHistoryRecord(record);
      this.render(result.records);

      return {
        historyRecordId: nextRecordId,
        historySource: source,
        historyCreatedAt: nextHistoryCreatedAt,
      };
    }

    openRecord(record) {
      this.reportView.renderHtml(this.historyDetailView.render(record));
      this.reportView.bindRenderedAction('#btn-restore-history', async () => {
        await this.restoreRecord(record);
      });
    }

    openTrendDetail(snapshot) {
      const html = `
        <section class="history-detail">
          <div class="history-detail-head">
            <span class="history-detail-tag">趋势分析</span>
            <h2>最近 ${snapshot.sessions} 次训练变化</h2>
            <p>对比窗口 ${snapshot.windowSize} 次</p>
          </div>
          <div class="history-detail-grid">
            <div class="history-detail-stat">
              <span>表达密度</span>
              <strong>${snapshot.latestDensity ?? '--'}%</strong>
              <em>${snapshot.densityDelta == null ? '样本不足' : `${snapshot.densityDelta >= 0 ? '+' : ''}${snapshot.densityDelta}%`}</em>
            </div>
            <div class="history-detail-stat">
              <span>填充词率</span>
              <strong>${snapshot.latestFillerRate ?? '--'}</strong>
              <em>${snapshot.fillerRateDelta == null ? '样本不足' : `${snapshot.fillerRateDelta >= 0 ? '+' : ''}${snapshot.fillerRateDelta}/分钟`}</em>
            </div>
            <div class="history-detail-stat">
              <span>犹豫词率</span>
              <strong>${snapshot.latestHedgeRate ?? '--'}</strong>
              <em>${snapshot.hedgeRateDelta == null ? '样本不足' : `${snapshot.hedgeRateDelta >= 0 ? '+' : ''}${snapshot.hedgeRateDelta}/分钟`}</em>
            </div>
          </div>
        </section>
      `;

      this.reportView.renderHtml(html);
    }

    async restoreRecord(record) {
      this.reportView.close();
      await this.onRestore({
        fullText: record.fullText || '',
        sentences: this.splitTranscriptSentences(record.fullText || ''),
        stats: { ...this.createEmptyStats(), ...(record.stats || {}) },
        trainingMode: record.trainingMode || '',
        lastReport: record.report || '',
        historyRecordId: record.id || '',
        historySource: record.source || '',
        historyCreatedAt: record.createdAt || '',
      });
    }
  }

  const api = { HistoryController };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletHistoryController = api;
}(typeof window !== 'undefined' ? window : globalThis));
