(function initTrainingShortcuts(global) {
  function isEditableTarget(target) {
    if (!target || typeof target.closest !== 'function') {
      return false;
    }

    return Boolean(
      target.closest('input, textarea, select, [contenteditable="true"]'),
    );
  }

  function getShortcutAction(event, state) {
    if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey) {
      return null;
    }

    if (isEditableTarget(event.target)) {
      return null;
    }

    const key = String(event.key || '').toLowerCase();
    if (!key) {
      return null;
    }

    if (key === ' ' || key === 'spacebar') {
      if (state.isRecording && !state.isPaused) {
        return 'pause';
      }
      if (state.isRecording && state.isPaused) {
        return 'resume';
      }
      return 'start';
    }

    if (key === 'r') {
      return state.canReport ? 'report' : null;
    }

    if (key === 'g') {
      return state.canPaste ? 'paste' : null;
    }

    if (key === 'escape') {
      if (state.isRecording) {
        return 'stop';
      }
      return state.canClear ? 'clear' : null;
    }

    return null;
  }

  const api = {
    getShortcutAction,
    isEditableTarget,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletTrainingShortcuts = api;
}(typeof window !== 'undefined' ? window : globalThis));
