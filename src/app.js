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

class ExpressionTrainer {
  constructor() {
    this.isRecording = false;
    this.isPaused = false;
    this.startTime = null;
    this.pausedTime = 0;
    this.pauseStart = null;
    this.timerInterval = null;
    this.fullText = '';
    this.sentences = [];
    this.stats = createEmptyStats();
    this.lastReport = '';
    this.audioRecorder = new AudioRecorder({
      feedAudio: samples => window.api.feedAudio(samples),
      onResult: result => this.handleASRResult(result),
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

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.btnStart = document.getElementById('btn-start');
    this.btnPaste = document.getElementById('btn-paste');
    this.btnPause = document.getElementById('btn-pause');
    this.btnResume = document.getElementById('btn-resume');
    this.btnStop = document.getElementById('btn-stop');
    this.btnReport = document.getElementById('btn-report');
    this.btnSettings = document.getElementById('btn-settings');
    this.btnCloseReport = document.getElementById('btn-close-report');
    this.btnClosePaste = document.getElementById('btn-close-paste');
    this.btnAnalyzePaste = document.getElementById('btn-analyze-paste');
    this.btnCopyText = document.getElementById('btn-copy-text');
    this.btnSaveText = document.getElementById('btn-save-text');
    this.btnClear = document.getElementById('btn-clear');
    this.btnCopyReport = document.getElementById('btn-copy-report');
    this.pasteModal = document.getElementById('paste-modal');
    this.pasteTextarea = document.getElementById('paste-textarea');
    this.pasteModalView = new PasteModalView({
      modalEl: this.pasteModal,
      textareaEl: this.pasteTextarea,
      closeButtonEl: this.btnClosePaste,
      analyzeButtonEl: this.btnAnalyzePaste,
      onAnalyze: () => this.analyzePastedText(),
    });
    this.timer = document.getElementById('timer');
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
    this.subtitleScroll = document.getElementById('subtitle-scroll');
    this.subtitleContainer = document.getElementById('subtitle-container');
    this.transcriptView = new TranscriptView({
      scrollEl: this.subtitleScroll,
      containerEl: this.subtitleContainer,
      renderHighlightedText,
    });
    this.feedbackContent = document.getElementById('feedback-content');
    this.feedbackView = new FeedbackView({ containerEl: this.feedbackContent });
    this.reportModal = document.getElementById('report-modal');
    this.reportBody = document.getElementById('report-body');
    this.reportView = new ReportView({
      modalEl: this.reportModal,
      bodyEl: this.reportBody,
      closeButtonEl: this.btnCloseReport,
      copyButtonEl: this.btnCopyReport,
      renderMarkdown: window.api.renderMarkdown,
      copyText: (text) => navigator.clipboard.writeText(text),
      onSave: () => this.saveReport(),
    });
    this.statFillers = document.getElementById('stat-fillers');
    this.statHedges = document.getElementById('stat-hedges');
    this.statVague = document.getElementById('stat-vague');
    this.statDensity = document.getElementById('stat-density');
    this.statsView = new StatsView({
      fillersEl: this.statFillers,
      hedgesEl: this.statHedges,
      vagueEl: this.statVague,
      densityEl: this.statDensity,
      calculateExpressionDensity,
    });
    this.modelStatus = document.getElementById('model-status');
    this.modelStatusText = document.getElementById('model-status-text');
    this.modelStatusActions = document.getElementById('model-status-actions');
    this.btnOpenModelsDir = document.getElementById('btn-open-models-dir');
    this.btnRefreshModelStatus = document.getElementById('btn-refresh-model-status');
    this.modelDownloadLink = document.getElementById('model-download-link');
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
    document.getElementById('btn-prompt-editor').addEventListener('click', () => window.api.openPromptEditor());
    this.reportView.bind();
    this.pasteModalView.bind();
    this.btnCopyText.addEventListener('click', () => this.copyOriginalText());
    this.btnSaveText.addEventListener('click', () => this.saveOriginalText());
    this.btnClear.addEventListener('click', () => this.clearAll());
    this.modelStatusView.bind();
    this.refreshModelStatus();
  }

  // ===== 录制控制 =====

  async refreshModelStatus() {
    this.modelStatusView.renderChecking();
    const status = await window.api.getModelStatus();
    this.modelStatusView.render(status);
  }

  async startRecording() {
    const initResult = await window.api.initASR();
    if (!initResult.success) {
      await this.refreshModelStatus();
      this.showError(`语音识别启动失败: ${initResult.error}`);
      return;
    }

    try {
      await this.audioRecorder.start();
    } catch (err) {
      this.showError(`麦克风访问失败: ${err.message}`);
      return;
    }

    this.isRecording = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.pausedTime = 0;
    this.fullText = '';
    this.sentences = [];
    this.realtimeFeedbackFlow.reset();
    this.resetStats();
    this.transcriptView.clear();

    this.controlsView.showRecordingStarted();

    this.timerInterval = setInterval(() => this.updateTimer(), 1000);
  }

  pauseRecording() {
    this.isPaused = true;
    this.audioRecorder.pause();
    this.pauseStart = Date.now();
    this.controlsView.showPaused();
  }

  resumeRecording() {
    this.isPaused = false;
    this.audioRecorder.resume();
    this.pausedTime += Date.now() - this.pauseStart;
    this.pauseStart = null;
    this.controlsView.showResumed();
  }

  async stopRecording() {
    await this.audioRecorder.stop();

    const stopResult = await window.api.stopASR();
    if (stopResult && stopResult.finalText) {
      this.handleASRResult({ text: stopResult.finalText, isFinal: true });
    }
    this.isRecording = false;
    this.isPaused = false;

    clearInterval(this.timerInterval);
    this.stats.duration = getElapsedSeconds(this.startTime, this.pausedTime, this.pauseStart);

    this.controlsView.showStopped(Boolean(this.fullText.trim()));
  }

  // ===== ASR结果处理 =====

  handleASRResult({ text, isFinal }) {
    if (isFinal) {
      this.sentences.push(text);
      this.fullText += text;
      this.analyzeCurrentSentence(text).then(analysis => {
        this.transcriptView.renderFinal(text, analysis);
      });

      this.requestRealtimeFeedback();
      return;
    }
    this.transcriptView.renderInterim(text);
  }

  // ===== 分析 =====

  async analyzeCurrentSentence(text) {
    const analysis = await window.api.analyzeText(text);
    if (analysis) {
      applyAnalysisToStats(this.stats, analysis);
      this.updateStatsDisplay();
      buildAnalysisFeedbackItems(analysis).forEach(item => {
        this.feedbackView.add(item.text, item.type);
      });
    }
    return analysis;
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
    const elapsed = getElapsedSeconds(this.startTime, this.pausedTime, this.pauseStart);
    this.controlsView.setTimerText(formatTimer(elapsed));
  }

  resetStats() {
    this.stats = createEmptyStats();
    this.updateStatsDisplay();
    this.feedbackView.clear();
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
    this.fullText = '';
    this.sentences = [];
    this.lastReport = '';
    this.realtimeFeedbackFlow.reset();
    this.transcriptView.resetHint();
    this.resetStats();
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
    this.fullText = text;
    this.resetStats();

    const result = await this.pasteAnalysisFlow.analyze({ text, stats: this.stats });
    this.sentences = result.sentences;
    this.updateStatsDisplay();

    this.controlsView.showTextReady();

    await this.realtimeFeedbackFlow.request(this.fullText, { force: true });
  }
}

document.addEventListener('DOMContentLoaded', () => { new ExpressionTrainer(); });
