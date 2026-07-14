// omelet expression trainer renderer entry

const {
  applyAnalysisToStats,
  buildOriginalTextFilename,
  buildOriginalTextMarkdown,
  buildReportFilename,
  buildReportMarkdown,
  calculateExpressionDensity,
  createEmptyStats,
  formatTimer,
  getElapsedSeconds,
  getExportTimestamp,
  renderHighlightedText,
  splitTranscriptSentences,
} = window.OmeletAppUtils;
const { TranscriptView } = window.OmeletTranscriptView;
const { FeedbackView } = window.OmeletFeedbackView;
const { ReportView } = window.OmeletReportView;
const { ModelStatusView } = window.OmeletModelStatusView;
const { TrainingControlsView } = window.OmeletTrainingControlsView;
const { PasteModalView } = window.OmeletPasteModalView;

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
    this.lastFeedbackText = '';
    this.lastReport = '';

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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(stream);
      this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.audioProcessor.onaudioprocess = async (e) => {
        if (!this.isRecording || this.isPaused) return;
        const samples = e.inputBuffer.getChannelData(0);
        const result = await window.api.feedAudio(samples);
        if (result) this.handleASRResult(result);
      };
      source.connect(this.audioProcessor);
      this.audioProcessor.connect(this.audioContext.destination);
      this.mediaStream = stream;
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
    this.resetStats();
    this.transcriptView.clear();

    this.controlsView.showRecordingStarted();

    this.timerInterval = setInterval(() => this.updateTimer(), 1000);
  }

  pauseRecording() {
    this.isPaused = true;
    this.pauseStart = Date.now();
    this.controlsView.showPaused();
  }

  resumeRecording() {
    this.isPaused = false;
    this.pausedTime += Date.now() - this.pauseStart;
    this.pauseStart = null;
    this.controlsView.showResumed();
  }

  async stopRecording() {
    if (this.audioProcessor) { this.audioProcessor.disconnect(); this.audioProcessor = null; }
    if (this.audioContext) { this.audioContext.close(); this.audioContext = null; }
    if (this.mediaStream) { this.mediaStream.getTracks().forEach(t => t.stop()); this.mediaStream = null; }

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

      if (this.fullText.length - this.lastFeedbackText.length >= 30) {
        this.requestRealtimeFeedback();
      }
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
      if (analysis.vagueWords && analysis.vagueWords.length > 0) {
        analysis.vagueWords.forEach(item => {
          const alts = item.alternatives.slice(0, 3).join(' / ');
          this.feedbackView.add(`「${item.word}」 -> ${alts}`, 'vague');
        });
      }
      if (analysis.fillers && analysis.fillers.length >= 2) {
        const uniqueFillers = [...new Set(analysis.fillers.map(f => f.word))].slice(0, 3);
        this.feedbackView.add(`填充词：${uniqueFillers.join('、')} - 试试停顿`, 'filler');
      }
      if (analysis.hedges && analysis.hedges.length >= 1) {
        const uniqueHedges = [...new Set(analysis.hedges.map(h => h.word))].slice(0, 2);
        this.feedbackView.add(`「${uniqueHedges.join('」「')}」 -> 直接说`, 'hedge');
      }
    }
    return analysis;
  }

  updateStatsDisplay() {
    this.statFillers.textContent = this.stats.fillers;
    this.statHedges.textContent = this.stats.hedges;
    this.statVague.textContent = this.stats.vagueWords;
    this.statDensity.textContent = calculateExpressionDensity(this.stats);
  }

  // ===== 实时反馈 =====

  async requestRealtimeFeedback() {
    this.lastFeedbackText = this.fullText;
    const result = await window.api.getRealtimeFeedback(this.fullText);
    if (result.success && result.feedback) {
      const lines = result.feedback.split('\n').filter(l => l.trim());
      lines.forEach(line => {
        this.feedbackView.add(line.trim());
      });
    }
  }

  // ===== 报告 =====

  async generateReport() {
    this.reportView.openLoading();

    const result = await window.api.getFinalReport({
      fullText: this.fullText,
      stats: this.stats
    });

    if (result.success) {
      this.lastReport = result.report;
      this.reportView.render(result.report);
    } else {
      this.reportView.showError(result.error);
    }
  }

  async saveReport() {
    if (!this.lastReport) return;
    const { dateStr, timeStr } = getExportTimestamp();
    const markdown = buildReportMarkdown({
      dateStr,
      stats: this.stats,
      fullText: this.fullText,
      report: this.lastReport,
    });
    const filename = buildReportFilename({ dateStr, timeStr });

    try {
      const result = await window.api.saveFile(markdown, filename);
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
    if (!this.fullText.trim()) return;
    navigator.clipboard.writeText(this.fullText).then(() => {
      this.controlsView.markCopied();
    });
  }

  async saveOriginalText() {
    if (!this.fullText.trim()) return;
    const { dateStr, timeStr } = getExportTimestamp();
    const markdown = buildOriginalTextMarkdown({ dateStr, fullText: this.fullText });
    const filename = buildOriginalTextFilename({ dateStr, timeStr });

    try {
      const result = await window.api.saveFile(markdown, filename);
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

    const sentences = splitTranscriptSentences(text);
    this.sentences = sentences;

    for (const sentence of sentences) {
      const analysis = await window.api.analyzeText(sentence);
      if (analysis) {
        applyAnalysisToStats(this.stats, analysis);
      }
      this.transcriptView.renderSentence(sentence, analysis);
    }

    this.stats.duration = 0;
    this.updateStatsDisplay();

    this.controlsView.showTextReady();

    this.requestRealtimeFeedback();
  }
}

document.addEventListener('DOMContentLoaded', () => { new ExpressionTrainer(); });
