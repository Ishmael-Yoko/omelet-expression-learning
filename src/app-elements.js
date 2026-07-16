(function initAppElements(global) {
  const ELEMENT_IDS = {
    btnStart: 'btn-start',
    btnPaste: 'btn-paste',
    btnPause: 'btn-pause',
    btnResume: 'btn-resume',
    btnStop: 'btn-stop',
    btnReport: 'btn-report',
    btnSettings: 'btn-settings',
    btnPromptEditor: 'btn-prompt-editor',
    btnCloseReport: 'btn-close-report',
    btnClosePaste: 'btn-close-paste',
    btnAnalyzePaste: 'btn-analyze-paste',
    btnCopyText: 'btn-copy-text',
    btnSaveText: 'btn-save-text',
    btnClear: 'btn-clear',
    btnCopyReport: 'btn-copy-report',
    pasteModal: 'paste-modal',
    pasteTextarea: 'paste-textarea',
    timer: 'timer',
    subtitleScroll: 'subtitle-scroll',
    subtitleContainer: 'subtitle-container',
    feedbackContent: 'feedback-content',
    historyContent: 'history-content',
    reportModal: 'report-modal',
    reportBody: 'report-body',
    statFillers: 'stat-fillers',
    statHedges: 'stat-hedges',
    statVague: 'stat-vague',
    statDensity: 'stat-density',
    modelStatus: 'model-status',
    modelStatusText: 'model-status-text',
    modelStatusActions: 'model-status-actions',
    btnOpenModelsDir: 'btn-open-models-dir',
    btnRefreshModelStatus: 'btn-refresh-model-status',
    modelDownloadLink: 'model-download-link',
  };

  function getRequiredElement(documentRef, id) {
    const element = documentRef.getElementById(id);
    if (!element) {
      throw new Error(`Missing required element: #${id}`);
    }
    return element;
  }

  function getAppElements(documentRef = global.document) {
    return Object.fromEntries(
      Object.entries(ELEMENT_IDS).map(([key, id]) => [key, getRequiredElement(documentRef, id)]),
    );
  }

  const api = { ELEMENT_IDS, getAppElements, getRequiredElement };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletAppElements = api;
}(typeof window !== 'undefined' ? window : globalThis));
