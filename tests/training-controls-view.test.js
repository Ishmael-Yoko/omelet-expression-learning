const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const {
  COPIED_LABEL,
  COPY_LABEL,
  SAVED_LABEL,
  SAVE_LABEL,
  TrainingControlsView,
  setHidden,
} = require('../src/training-controls-view');

function createView(options = {}) {
  const dom = new JSDOM(`
    <button id="start"></button>
    <button id="pause" class="hidden"></button>
    <button id="resume" class="hidden"></button>
    <button id="stop" class="hidden"></button>
    <button id="report" class="hidden"></button>
    <button id="copy" class="hidden"><span class="btn-label">${COPY_LABEL}</span></button>
    <button id="save" class="hidden"><span class="btn-label">${SAVE_LABEL}</span></button>
    <button id="clear" class="hidden"></button>
    <span id="timer">00:00</span>
  `);
  const document = dom.window.document;

  return {
    document,
    view: new TrainingControlsView({
      startButtonEl: document.getElementById('start'),
      pauseButtonEl: document.getElementById('pause'),
      resumeButtonEl: document.getElementById('resume'),
      stopButtonEl: document.getElementById('stop'),
      reportButtonEl: document.getElementById('report'),
      copyTextButtonEl: document.getElementById('copy'),
      saveTextButtonEl: document.getElementById('save'),
      clearButtonEl: document.getElementById('clear'),
      timerEl: document.getElementById('timer'),
      resetDelay: 1,
      ...options,
    }),
  };
}

test('setHidden toggles hidden class predictably', () => {
  const { document } = createView();
  const el = document.getElementById('start');

  setHidden(el, true);
  assert.equal(el.classList.contains('hidden'), true);

  setHidden(el, false);
  assert.equal(el.classList.contains('hidden'), false);
});

test('TrainingControlsView shows recording started state', () => {
  const { document, view } = createView();

  view.showRecordingStarted();

  assert.equal(document.getElementById('start').classList.contains('hidden'), true);
  assert.equal(document.getElementById('pause').classList.contains('hidden'), false);
  assert.equal(document.getElementById('stop').classList.contains('hidden'), false);
  assert.equal(document.getElementById('report').classList.contains('hidden'), true);
  assert.equal(document.getElementById('timer').classList.contains('active'), true);
});

test('TrainingControlsView toggles paused and resumed state', () => {
  const { document, view } = createView();

  view.showPaused();
  assert.equal(document.getElementById('pause').classList.contains('hidden'), true);
  assert.equal(document.getElementById('resume').classList.contains('hidden'), false);
  assert.equal(document.getElementById('timer').classList.contains('active'), false);

  view.showResumed();
  assert.equal(document.getElementById('pause').classList.contains('hidden'), false);
  assert.equal(document.getElementById('resume').classList.contains('hidden'), true);
  assert.equal(document.getElementById('timer').classList.contains('active'), true);
});

test('TrainingControlsView shows stopped state with text actions when transcript exists', () => {
  const { document, view } = createView();

  view.showStopped(true);

  assert.equal(document.getElementById('start').classList.contains('hidden'), false);
  assert.equal(document.getElementById('stop').classList.contains('hidden'), true);
  assert.equal(document.getElementById('report').classList.contains('hidden'), false);
  assert.equal(document.getElementById('copy').classList.contains('hidden'), false);
  assert.equal(document.getElementById('save').classList.contains('hidden'), false);
  assert.equal(document.getElementById('clear').classList.contains('hidden'), false);
});

test('TrainingControlsView resets timer, actions, and labels', () => {
  const { document, view } = createView();

  view.setTimerText('01:23');
  view.showTextReady();
  view.markCopied();
  view.markSaved();
  view.reset();

  assert.equal(document.getElementById('timer').textContent, '00:00');
  assert.equal(document.getElementById('timer').classList.contains('active'), false);
  assert.equal(document.getElementById('report').classList.contains('hidden'), true);
  assert.equal(document.getElementById('copy').classList.contains('hidden'), true);
  assert.equal(document.querySelector('#copy .btn-label').textContent, COPY_LABEL);
  assert.equal(document.querySelector('#save .btn-label').textContent, SAVE_LABEL);
});

test('TrainingControlsView updates copy and save labels', () => {
  const { document, view } = createView();

  view.markCopied();
  view.markSaved();

  assert.equal(document.querySelector('#copy .btn-label').textContent, COPIED_LABEL);
  assert.equal(document.querySelector('#save .btn-label').textContent, SAVED_LABEL);
});
