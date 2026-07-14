(function initAppUtils(global) {
  const APP_NAME = 'omelet-表达训练系统';
  const REPORT_FILE_PREFIX = 'omelet-表达训练';

  function createEmptyStats() {
    return { fillers: 0, hedges: 0, vagueWords: 0, totalWords: 0, duration: 0 };
  }

  function applyAnalysisToStats(stats, analysis) {
    if (!analysis) {
      return stats;
    }

    stats.fillers += analysis.fillers.length;
    stats.hedges += analysis.hedges.length;
    stats.vagueWords += analysis.vagueWords.length;
    stats.totalWords += analysis.totalWords;
    return stats;
  }

  function calculateExpressionDensity(stats) {
    if (!stats.totalWords) {
      return '--';
    }

    const meaningfulWords = stats.totalWords - stats.fillers - stats.hedges;
    return `${Math.max(0, Math.round((meaningfulWords / stats.totalWords) * 100))}%`;
  }

  function getElapsedSeconds(startTime, pausedTime = 0, pauseStart = null, now = Date.now()) {
    if (!startTime) {
      return 0;
    }

    const activePause = pauseStart ? now - pauseStart : 0;
    return Math.max(0, Math.floor((now - startTime - pausedTime - activePause) / 1000));
  }

  function formatTimer(seconds) {
    const safeSeconds = Math.max(0, Math.floor(seconds || 0));
    const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, '0');
    const remainingSeconds = (safeSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  }

  function splitTranscriptSentences(text) {
    return String(text || '')
      .split(/(?<=[。！？\n])/g)
      .map(sentence => sentence.trim())
      .filter(Boolean);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getAnalysisHighlightTerms(analysis) {
    if (!analysis) {
      return [];
    }

    const terms = [
      ...(analysis.vagueWords || []).map(item => ({ word: item.word, type: 'vague' })),
      ...(analysis.fillers || []).map(item => ({ word: item.word, type: 'filler' })),
      ...(analysis.hedges || []).map(item => ({ word: item.word, type: 'hedge' })),
    ];
    const seen = new Set();

    return terms
      .filter(item => item.word && !seen.has(`${item.type}:${item.word}`) && seen.add(`${item.type}:${item.word}`))
      .sort((a, b) => b.word.length - a.word.length);
  }

  function renderHighlightedText(text, analysis) {
    const source = String(text || '');
    const terms = getAnalysisHighlightTerms(analysis);

    if (!source || terms.length === 0) {
      return escapeHtml(source);
    }

    let html = '';
    let index = 0;

    while (index < source.length) {
      const match = terms.find(term => source.startsWith(term.word, index));
      if (!match) {
        html += escapeHtml(source[index]);
        index += 1;
        continue;
      }

      html += `<span class="${match.type}">${escapeHtml(match.word)}</span>`;
      index += match.word.length;
    }

    return html;
  }

  function getExportTimestamp(now = new Date()) {
    return {
      dateStr: now.toISOString().slice(0, 10),
      timeStr: now.toTimeString().slice(0, 5).replace(':', ''),
    };
  }

  function buildReportMarkdown({ dateStr, stats, fullText, report }) {
    return `# ${APP_NAME}报告\n\n**日期**: ${dateStr}  \n**时长**: ${stats.duration}秒  \n**总字数**: ${stats.totalWords}  \n\n---\n\n## 完整原文\n\n${fullText}\n\n---\n\n${report}`;
  }

  function buildOriginalTextMarkdown({ dateStr, fullText }) {
    return `# ${APP_NAME}原文\n\n**日期**: ${dateStr}\n\n---\n\n${fullText}`;
  }

  function buildReportFilename({ dateStr, timeStr }) {
    return `${REPORT_FILE_PREFIX}-${dateStr}-${timeStr}.md`;
  }

  function buildOriginalTextFilename({ dateStr, timeStr }) {
    return `${REPORT_FILE_PREFIX}-原文-${dateStr}-${timeStr}.md`;
  }

  const api = {
    APP_NAME,
    REPORT_FILE_PREFIX,
    applyAnalysisToStats,
    buildOriginalTextFilename,
    buildOriginalTextMarkdown,
    buildReportFilename,
    buildReportMarkdown,
    calculateExpressionDensity,
    createEmptyStats,
    escapeHtml,
    formatTimer,
    getAnalysisHighlightTerms,
    getElapsedSeconds,
    getExportTimestamp,
    renderHighlightedText,
    splitTranscriptSentences,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletAppUtils = api;
}(typeof window !== 'undefined' ? window : globalThis));
