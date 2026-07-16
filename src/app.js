// omelet expression trainer renderer entry

const {
  applyAnalysisToStats,
  calculateExpressionDensity,
  createEmptyStats,
  formatTimer,
  getElapsedSeconds,
  renderHighlightedText,
  splitTranscriptSentences,
} = window.OmeletAppUtils;
const { TranscriptView } = window.OmeletTranscriptView;
const { FeedbackView } = window.OmeletFeedbackView;
const { ReportView } = window.OmeletReportView;
const { ModelStatusView } = window.OmeletModelStatusView;
const { TrainingControlsView } = window.OmeletTrainingControlsView;
const { PasteModalView } = window.OmeletPasteModalView;
const { StatsView } = window.OmeletStatsView;
const { AudioRecorder } = window.OmeletAudioRecorder;
const { ExportActions } = window.OmeletExportActions;
const { buildAnalysisFeedbackItems } = window.OmeletAnalysisFeedbackRules;
const { PasteAnalysisFlow } = window.OmeletPasteAnalysisFlow;
const { RealtimeFeedbackFlow } = window.OmeletRealtimeFeedbackFlow;
const { FinalReportFlow } = window.OmeletFinalReportFlow;
const { TrainingSessionFlow } = window.OmeletTrainingSessionFlow;
const { TranscriptAnalysisFlow } = window.OmeletTranscriptAnalysisFlow;
const { createTrainerState, resetTrainerState, setTranscriptText } = window.OmeletTrainerState;
const { getAppElements } = window.OmeletAppElements;
const { HistoryView } = window.OmeletHistoryView;

class ExpressionTrainer {
  constructor() {
    this.timerInterval = null;
    this.pendingAnalysisPromises = new Set();
    Object.assign(this, createTrainerState({ createEmptyStats }));
    this.audioRecorder = new AudioRecorder({
      feedAudio: samples => window.api.feedAudio(samples),
      onResult: result => this.handleASRResult(result),
    });
    this.trainingSessionFlow = new TrainingSessionFlow({
      initASR: () => window.api.initASR(),
      stopASR: () => window.api.stopASR(),
      audioRecorder: this.audioRecorder,
      getElapsedSeconds,
    });
    this.exportActions = new ExportActions({
      ...window.OmeletAppUtils,
      saveFile: (content, filename) => window.api.saveFile(content, filename),
      writeClipboard: text => navigator.clipboard.writeText(text),
    });
    this.pasteAnalysisFlow = new PasteAnalysisFlow({
      splitTranscriptSentences,
      analyzeText: text => window.api.analyzeText(text),
      applyAnalysisToStats,
      renderSentence: (sentence, analysis) => this.transcriptView.renderSentence(sentence, analysis),
    });
    this.realtimeFeedbackFlow = new RealtimeFeedbackFlow({
      getRealtimeFeedback: text => window.api.getRealtimeFeedback(text),
      addFeedback: line => this.feedbackView.add(line),
    });
    this.finalReportFlow = new FinalReportFlow({
      getFinalReport: payload => window.api.getFinalReport(payload),
      openLoading: () => this.reportView.openLoading(),
      renderReport: report => this.reportView.render(report),
      showError: error => this.reportView.showError(error),
    });
    this.transcriptAnalysisFlow = new TranscriptAnalysisFlow({
      analyzeText: text => window.api.analyzeText(text),
      applyAnalysisToStats,
      buildAnalysisFeedbackItems,
      renderFinal: (text, analysis) => {
        this.transcriptView.renderFinal(text, analysis);
        this.updateStatsDisplay();
      },
      renderInterim: text => this.transcriptView.renderInterim(text),
      addFeedback: (text, type) => this.feedbackView.add(text, type),
    });

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    Object.assign(this, getAppElements(document));
    this.pasteModalView = new PasteModalView({
      modalEl: this.pasteModal,
      textareaEl: this.pasteTextarea,
      closeButtonEl: this.btnClosePaste,
      analyzeButtonEl: this.btnAnalyzePaste,
      onAnalyze: () => this.analyzePastedText(),
    });
    this.controlsView = new TrainingControlsView({
      startButtonEl: this.btnStart,
      pauseButtonEl: this.btnPause,
      resumeButtonEl: this.btnResume,
      stopButtonEl: this.btnStop,
      reportButtonEl: this.btnReport,
      copyTextButtonEl: this.btnCopyText,
      saveTextButtonEl: this.btnSaveText,
      clearButtonEl: this.btnClear,
      timerEl: this.timer,
    });
    this.transcriptView = new TranscriptView({
      scrollEl: this.subtitleScroll,
      containerEl: this.subtitleContainer,
      renderHighlightedText,
    });
    this.feedbackView = new FeedbackView({ containerEl: this.feedbackContent });
    this.historyView = new HistoryView({
      containerEl: this.historyContent,
      onSelect: record => this.openHistoryRecord(record),
    });
    this.reportView = new ReportView({
      modalEl: this.reportModal,
      bodyEl: this.reportBody,
      closeButtonEl: this.btnCloseReport,
      copyButtonEl: this.btnCopyReport,
      renderMarkdown: window.api.renderMarkdown,
      copyText: (text) => navigator.clipboard.writeText(text),
      onSave: () => this.saveReport(),
    });
    this.statsView = new StatsView({
      fillersEl: this.statFillers,
      hedgesEl: this.statHedges,
      vagueEl: this.statVague,
      densityEl: this.statDensity,
      calculateExpressionDensity,
    });
    this.modelStatusView = new ModelStatusView({
      statusEl: this.modelStatus,
      textEl: this.modelStatusText,
      actionsEl: this.modelStatusActions,
      downloadLinkEl: this.modelDownloadLink,
      openButtonEl: this.btnOpenModelsDir,
      refreshButtonEl: this.btnRefreshModelStatus,
      onOpenModelsDir: () => window.api.openModelsDir(),
      onRefresh: () => this.refreshModelStatus(),
    });
  }

  bindEvents() {
    this.btnStart.addEventListener('click', () => this.startRecording());
    this.btnPaste.addEventListener('click', () => this.openPasteModal());
    this.btnPause.addEventListener('click', () => this.pauseRecording());
    this.btnResume.addEventListener('click', () => this.resumeRecording());
    this.btnStop.addEventListener('click', () => this.stopRecording());
    this.btnReport.addEventListener('click', () => this.generateReport());
    this.btnSettings.addEventListener('click', () => window.api.openSettings());
    this.btnPromptEditor.addEventListener('click', () => window.api.openPromptEditor());
    this.reportView.bind();
    this.pasteModalView.bind();
    this.btnCopyText.addEventListener('click', () => this.copyOriginalText());
    this.btnSaveText.addEventListener('click', () => this.saveOriginalText());
    this.btnClear.addEventListener('click', () => this.clearAll());
    this.modelStatusView.bind();
    this.refreshModelStatus();
    this.loadHistory();
  }

  // ===== 录制控制 =====

  async refreshModelStatus() {
    this.modelStatusView.renderChecking();
    const status = await window.api.getModelStatus();
    this.modelStatusView.render(status);
  }

  async startRecording() {
    const startResult = await this.trainingSessionFlow.start();
    if (!startResult.success && startResult.stage === 'asr') {
      await this.refreshModelStatus();
      this.showError(`语音识别启动失败: ${startResult.error}`);
      return;
    }
    if (!startResult.success && startResult.stage === 'microphone') {
      this.showError(`麦克风访问失败: ${startResult.error}`);
      return;
    }

    resetTrainerState(this, { createEmptyStats, keepReport: true });
    this.realtimeFeedbackFlow.reset();
    this.updateStatsDisplay();
    this.feedbackView.clear();
    this.transcriptView.clear();

    this.controlsView.showRecordingStarted();

    this.timerInterval = setInterval(() => this.updateTimer(), 1000);
  }

  pauseRecording() {
    this.trainingSessionFlow.pause();
    this.controlsView.showPaused();
  }

  resumeRecording() {
    this.trainingSessionFlow.resume();
    this.controlsView.showResumed();
  }

  async stopRecording() {
    const stopResult = await this.trainingSessionFlow.stop();
    if (stopResult.finalText) {
      this.handleASRResult({ text: stopResult.finalText, isFinal: true });
    }

    await this.flushPendingAnalysis();

    clearInterval(this.timerInterval);
    this.stats.duration = stopResult.duration;

    this.controlsView.showStopped(Boolean(this.fullText.trim()));
    await this.saveCurrentHistoryRecord('recording');
  }

  // ===== ASR结果处理 =====

  handleASRResult({ text, isFinal }) {
    const result = this.transcriptAnalysisFlow.handleResult(
      { text, isFinal },
      { fullText: this.fullText, sentences: this.sentences, stats: this.stats },
    );
    this.fullText = result.fullText;
    this.sentences = result.sentences;
    if (result.analysisPromise) {
      this.trackAnalysisPromise(result.analysisPromise);
    }
    if (result.didFinalize) {
      this.requestRealtimeFeedback();
    }
  }

  trackAnalysisPromise(promise) {
    this.pendingAnalysisPromises.add(promise);
    promise.finally(() => {
      this.pendingAnalysisPromises.delete(promise);
    });
  }

  async flushPendingAnalysis() {
    if (this.pendingAnalysisPromises.size === 0) {
      return;
    }

    await Promise.all([...this.pendingAnalysisPromises]);
  }

  updateStatsDisplay() {
    this.statsView.render(this.stats);
  }

  // ===== 实时反馈 =====

  async requestRealtimeFeedback() {
    await this.realtimeFeedbackFlow.request(this.fullText);
  }

  // ===== 报告 =====

  async generateReport() {
    const result = await this.finalReportFlow.generate({
      fullText: this.fullText,
      stats: this.stats
    });
    if (result.success) {
      this.lastReport = result.report;
      await this.saveCurrentHistoryRecord('report');
    }
  }

  async saveReport() {
    try {
      const result = await this.exportActions.saveReport({
        report: this.lastReport,
        stats: this.stats,
        fullText: this.fullText,
      });
      if (result.success) {
        this.reportView.markSaved();
      }
    } catch (e) {
      alert('保存失败: ' + e.message);
    }
  }

  // ===== 工具 =====

  updateTimer() {
    this.controlsView.setTimerText(formatTimer(this.trainingSessionFlow.getDuration()));
  }

  showError(msg) {
    this.transcriptView.renderError(msg);
  }

  // ===== 复制 & 保存原文 & 清空 =====

  copyOriginalText() {
    this.exportActions.copyOriginalText(this.fullText).then(result => {
      if (!result.success) return;
      this.controlsView.markCopied();
    });
  }

  async saveOriginalText() {
    try {
      const result = await this.exportActions.saveOriginalText(this.fullText);
      if (result.success) {
        this.controlsView.markSaved();
      }
    } catch (e) {
      alert('保存失败: ' + e.message);
    }
  }

  clearAll() {
    resetTrainerState(this, { createEmptyStats });
    this.realtimeFeedbackFlow.reset();
    this.transcriptView.resetHint();
    this.updateStatsDisplay();
    this.feedbackView.clear();
    this.controlsView.reset();
  }

  // ===== 粘贴逐字稿分析 =====

  openPasteModal() {
    this.pasteModalView.open();
  }

  async analyzePastedText() {
    const text = this.pasteModalView.getText();
    if (!text) return;

    this.pasteModalView.close();
    this.transcriptView.clear();
    setTranscriptText(this, text, { createEmptyStats, keepReport: true });
    this.updateStatsDisplay();
    this.feedbackView.clear();

    const result = await this.pasteAnalysisFlow.analyze({ text, stats: this.stats });
    this.sentences = result.sentences;
    this.updateStatsDisplay();

    this.controlsView.showTextReady();

    await this.realtimeFeedbackFlow.request(this.fullText, { force: true });
    await this.saveCurrentHistoryRecord('paste');
  }

  async loadHistory() {
    const records = await window.api.getTrainingHistory();
    this.historyView.render(records);
  }

  async saveCurrentHistoryRecord(source) {
    if (!this.fullText.trim()) {
      return;
    }

    const now = new Date();
    const summaryLine = this.fullText.trim().split(/\s+/).join('').slice(0, 22);
    const title = summaryLine ? `${summaryLine}${this.fullText.length > 22 ? '...' : ''}` : '未命名训练';
    const isNewRecord = this.historyRecordId === '' || this.historySource !== source;
    if (isNewRecord) {
      this.historyRecordId = `${source}-${now.getTime()}`;
      this.historySource = source;
      this.historyCreatedAt = now.toISOString();
    }
    const record = {
      id: this.historyRecordId,
      title,
      source,
      createdAt: this.historyCreatedAt || now.toISOString(),
      updatedAt: now.toISOString(),
      excerpt: this.fullText.trim().slice(0, 120),
      fullText: this.fullText,
      report: this.lastReport,
      stats: { ...this.stats },
    };

    const result = await window.api.saveTrainingHistoryRecord(record);
    this.historyView.render(result.records);
  }

  openHistoryRecord(record) {
    const density = record?.stats?.totalWords
      ? `${Math.max(0, Math.round(((record.stats.totalWords - record.stats.fillers - record.stats.hedges) / record.stats.totalWords) * 100))}%`
      : '--';
    const html = `
      <section class="history-detail">
        <div class="history-detail-head">
          <span class="history-detail-tag">${record.source === 'paste' ? '粘贴分析' : '录音训练'}</span>
          <h2>${window.OmeletAppUtils.escapeHtml(record.title || '未命名训练')}</h2>
          <p>${window.OmeletHistoryView.formatHistoryTimestamp(record.updatedAt || record.createdAt)}</p>
        </div>
        <div class="history-detail-grid">
          <div class="history-detail-stat">
            <span>时长</span>
            <strong>${record?.stats?.duration || 0}秒</strong>
          </div>
          <div class="history-detail-stat">
            <span>总字数</span>
            <strong>${record?.stats?.totalWords || 0}</strong>
          </div>
          <div class="history-detail-stat">
            <span>填充词</span>
            <strong>${record?.stats?.fillers || 0}</strong>
          </div>
          <div class="history-detail-stat">
            <span>表达密度</span>
            <strong>${density}</strong>
          </div>
        </div>
        <div class="history-detail-block">
          <h3>完整原文</h3>
          <p>${window.OmeletAppUtils.escapeHtml(record.fullText || '')}</p>
        </div>
        ${record.report ? `
          <div class="history-detail-block">
            <h3>历史报告</h3>
            <div class="history-detail-report">${window.api.renderMarkdown(record.report)}</div>
          </div>
        ` : ''}
      </section>
    `;
    this.reportView.renderHtml(html);
  }
}

document.addEventListener('DOMContentLoaded', () => { new ExpressionTrainer(); });
