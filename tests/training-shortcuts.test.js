const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { getShortcutAction, isEditableTarget } = require('../src/training-shortcuts');

function createEvent(key, options = {}) {
  const dom = new JSDOM(`
    <button id="button"></button>
    <input id="input">
    <textarea id="textarea"></textarea>
    <div id="contenteditable" contenteditable="true"></div>
  `);
  const document = dom.window.document;
  return {
    document,
    event: {
      key,
      defaultPrevented: false,
      repeat: false,
      metaKey: false,
      ctrlKey: false,
      altKey: false,
      target: document.getElementById('button'),
      ...options,
    },
  };
}

test('isEditableTarget detects inputs, textareas, and contenteditable elements', () => {
  const { document } = createEvent('x');

  assert.equal(isEditableTarget(document.getElementById('input')), true);
  assert.equal(isEditableTarget(document.getElementById('textarea')), true);
  assert.equal(isEditableTarget(document.getElementById('contenteditable')), true);
  assert.equal(isEditableTarget(document.getElementById('button')), false);
});

test('Space toggles start, pause, and resume depending on recording state', () => {
  const { event } = createEvent(' ');

  assert.equal(getShortcutAction(event, {
    isRecording: false,
    isPaused: false,
    canReport: false,
    canPaste: true,
    canClear: false,
  }), 'start');

  assert.equal(getShortcutAction(event, {
    isRecording: true,
    isPaused: false,
    canReport: false,
    canPaste: true,
    canClear: false,
  }), 'pause');

  assert.equal(getShortcutAction(event, {
    isRecording: true,
    isPaused: true,
    canReport: false,
    canPaste: true,
    canClear: false,
  }), 'resume');
});

test('other shortcut keys map to report, paste, and clear/stop actions', () => {
  assert.equal(getShortcutAction(createEvent('r').event, {
    isRecording: false,
    isPaused: false,
    canReport: true,
    canPaste: true,
    canClear: false,
  }), 'report');

  assert.equal(getShortcutAction(createEvent('g').event, {
    isRecording: false,
    isPaused: false,
    canReport: false,
    canPaste: true,
    canClear: false,
  }), 'paste');

  assert.equal(getShortcutAction(createEvent('Escape').event, {
    isRecording: true,
    isPaused: false,
    canReport: false,
    canPaste: true,
    canClear: false,
  }), 'stop');

  assert.equal(getShortcutAction(createEvent('Escape').event, {
    isRecording: false,
    isPaused: false,
    canReport: false,
    canPaste: true,
    canClear: true,
  }), 'clear');
});

test('shortcuts are ignored for editable targets and modified/repeated events', () => {
  const editable = createEvent('r', { target: createEvent('r').document.getElementById('input') });
  assert.equal(getShortcutAction(editable.event, {
    isRecording: false,
    isPaused: false,
    canReport: true,
    canPaste: true,
    canClear: false,
  }), null);

  assert.equal(getShortcutAction(createEvent('r', { ctrlKey: true }).event, {
    isRecording: false,
    isPaused: false,
    canReport: true,
    canPaste: true,
    canClear: false,
  }), null);

  assert.equal(getShortcutAction(createEvent('r', { repeat: true }).event, {
    isRecording: false,
    isPaused: false,
    canReport: true,
    canPaste: true,
    canClear: false,
  }), null);
});
