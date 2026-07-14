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
    this.timer = document.getElementById('timer');
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
    this.btnCloseReport.addEventListener('click', () => this.reportModal.classList.add('hidden'));
    this.btnCopyReport.addEventListener('click', () => {
      const reportText = this.reportBody.innerText;
      navigator.clipboard.writeText(reportText).then(() => {
        this.btnCopyReport.textContent = '✓ 已复制';
        setTimeout(() => { this.btnCopyReport.textContent = '复制全文'; }, 2000);
      });
    });
    this.btnClosePaste.addEventListener('click', () => this.pasteModal.classList.add('hidden'));
    this.btnAnalyzePaste.addEventListener('click', () => this.analyzePastedText());
    this.btnCopyText.addEventListener('click', () => this.copyOriginalText());
    this.btnSaveText.addEventListener('click', () => this.saveOriginalText());
    this.btnClear.addEventListener('click', () => this.clearAll());
    this.btnOpenModelsDir.addEventListener('click', () => window.api.openModelsDir());
    this.btnRefreshModelStatus.addEventListener('click', () => this.refreshModelStatus());
    this.refreshModelStatus();
  }

  // ===== 录制控制 =====

  async refreshModelStatus() {
    const status = await window.api.getModelStatus();
    this.modelStatus.classList.remove('model-status-checking');
    this.modelStatus.classList.toggle('model-status-ok', status.ok);
    this.modelStatus.classList.toggle('model-status-missing', !status.ok);
    this.modelStatusActions.classList.toggle('hidden', status.ok);
    this.modelDownloadLink.href = status.downloadUrl;

    if (status.ok) {
      this.modelStatusText.textContent = `语音模型已就绪：${status.activeDir}`;
      return;
    }

    const missing = status.candidates[0].missingFiles.join('、');
    this.modelStatusText.textContent = `语音模型未就绪，请将模型放到：${status.externalDir}。缺少：${missing}`;
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

    this.btnStart.classList.add('hidden');
    this.btnPause.classList.remove('hidden');
    this.btnStop.classList.remove('hidden');
    this.btnReport.classList.add('hidden');
    this.btnResume.classList.add('hidden');
    this.timer.classList.add('active');

    this.timerInterval = setInterval(() => this.updateTimer(), 1000);
  }

  pauseRecording() {
    this.isPaused = true;
    this.pauseStart = Date.now();
    this.btnPause.classList.add('hidden');
    this.btnResume.classList.remove('hidden');
    this.timer.classList.remove('active');
  }

  resumeRecording() {
    this.isPaused = false;
    this.pausedTime += Date.now() - this.pauseStart;
    this.pauseStart = null;
    this.btnResume.classList.add('hidden');
    this.btnPause.classList.remove('hidden');
    this.timer.classList.add('active');
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

    this.btnStop.classList.add('hidden');
    this.btnPause.classList.add('hidden');
    this.btnResume.classList.add('hidden');
    this.btnStart.classList.remove('hidden');
    this.timer.classList.remove('active');

    if (this.fullText.trim()) {
      this.btnReport.classList.remove('hidden');
      this.btnCopyText.classList.remove('hidden');
      this.btnSaveText.classList.remove('hidden');
      this.btnClear.classList.remove('hidden');
    }
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
    this.reportBody.innerHTML = '<p style="text-align:center;color:#666;padding:40px;">正在生成报告...</p>';
    this.reportModal.classList.remove('hidden');

    const result = await window.api.getFinalReport({
      fullText: this.fullText,
      stats: this.stats
    });

    if (result.success) {
      this.lastReport = result.report;
      this.renderReport(result.report);
    } else {
      this.reportBody.innerHTML = `<p style="color:#ff6b6b;">生成失败: ${result.error}</p>`;
    }
  }

  renderReport(report) {
    const safeHtml = window.api.renderMarkdown(report);
    this.reportBody.innerHTML = `
      <div style="text-align:right;margin-bottom:12px;">
        <button id="btn-save-report" class="btn-sm btn-save-report">保存为 Markdown</button>
      </div>
      ${safeHtml}
    `;

    document.getElementById('btn-save-report').addEventListener('click', () => this.saveReport());
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
        const btn = document.getElementById('btn-save-report');
        btn.textContent = '✓ 已保存';
        btn.style.background = '#333';
        setTimeout(() => { btn.textContent = '保存为 Markdown'; btn.style.background = ''; }, 2000);
      }
    } catch (e) {
      alert('保存失败: ' + e.message);
    }
  }

  // ===== 工具 =====

  updateTimer() {
    const elapsed = getElapsedSeconds(this.startTime, this.pausedTime, this.pauseStart);
    this.timer.textContent = formatTimer(elapsed);
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
      this.btnCopyText.querySelector('.btn-label').textContent = '✓ 已复制';
      setTimeout(() => { this.btnCopyText.querySelector('.btn-label').textContent = '复制原文'; }, 1500);
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
        this.btnSaveText.querySelector('.btn-label').textContent = '✓ 已保存';
        setTimeout(() => { this.btnSaveText.querySelector('.btn-label').textContent = '保存原文'; }, 2000);
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
    this.timer.textContent = '00:00';
    this.timer.classList.remove('active');
    this.btnReport.classList.add('hidden');
    this.btnCopyText.classList.add('hidden');
    this.btnSaveText.classList.add('hidden');
    this.btnClear.classList.add('hidden');
  }

  // ===== 粘贴逐字稿分析 =====

  openPasteModal() {
    this.pasteTextarea.value = '';
    this.pasteModal.classList.remove('hidden');
    this.pasteTextarea.focus();
  }

  async analyzePastedText() {
    const text = this.pasteTextarea.value.trim();
    if (!text) return;

    this.pasteModal.classList.add('hidden');
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

    this.btnReport.classList.remove('hidden');
    this.btnCopyText.classList.remove('hidden');
    this.btnSaveText.classList.remove('hidden');
    this.btnClear.classList.remove('hidden');

    this.requestRealtimeFeedback();
  }
}

document.addEventListener('DOMContentLoaded', () => { new ExpressionTrainer(); });
