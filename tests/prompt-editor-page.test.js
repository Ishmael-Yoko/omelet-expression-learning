const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const {
  PromptEditorPage,
  formatReplacementMap,
  formatWordList,
  parseReplacementMap,
  parseWordList,
} = require('../src/prompt-editor');

function createPage(overrides = {}) {
  const dom = new JSDOM(`
    <button id="btn-back" type="button">back</button>
    <select id="training-mode">
      <option value="improvisation">即兴表达</option>
      <option value="interview">面试回答</option>
      <option value="presentation">汇报表达</option>
      <option value="sales">销售沟通</option>
      <option value="retrospective">复盘总结</option>
    </select>
    <textarea id="goals"></textarea>
    <textarea id="custom-rules"></textarea>
    <textarea id="style-ref"></textarea>
    <textarea id="custom-words"></textarea>
    <textarea id="lexicon-filler-words"></textarea>
    <textarea id="lexicon-hedge-words"></textarea>
    <textarea id="lexicon-vague-replacements"></textarea>
    <button id="btn-save" type="button">save</button>
    <button id="btn-reset" type="button">reset</button>
    <div id="save-success"></div>
  `, { url: 'https://example.test' });

  const calls = {
    promptSaved: [],
    lexiconSaved: [],
    closed: 0,
  };
  const api = {
    getCustomPrompt: async () => ({
      trainingMode: 'presentation',
      goals: '减少填充词',
      customRules: '多提醒结论先行',
      styleRef: '更直接',
      customWords: '对吧',
    }),
    getCustomLexicon: async () => ({
      fillerWords: ['就是说'],
      hedgeWords: ['未必'],
      vagueReplacements: { 不错: ['扎实', '顺滑'] },
    }),
    saveCustomPrompt: async value => {
      calls.promptSaved.push(value);
      return { success: true };
    },
    saveCustomLexicon: async value => {
      calls.lexiconSaved.push(value);
      return { success: true };
    },
    closeWindow: () => {
      calls.closed += 1;
    },
    ...overrides.api,
  };

  const page = new PromptEditorPage({
    api,
    documentRef: dom.window.document,
    closeWindow: () => {
      calls.closed += 1;
    },
    confirmReset: overrides.confirmReset || (() => true),
  });

  return { calls, document: dom.window.document, page };
}

test('prompt-editor parsing helpers normalize list and replacement input', () => {
  assert.deepEqual(parseWordList('  就是说 \n\n未必 '), ['就是说', '未必']);
  assert.equal(formatWordList(['a', 'b']), 'a\nb');
  assert.deepEqual(parseReplacementMap('不错=扎实, 顺滑\n很多=成片'), {
    不错: ['扎实', '顺滑'],
    很多: ['成片'],
  });
  assert.equal(formatReplacementMap({ 不错: ['扎实', '顺滑'] }), '不错=扎实,顺滑');
});

test('PromptEditorPage loads prompt and custom lexicon values', async () => {
  const { document, page } = createPage();
  await page.ready;

  assert.equal(document.getElementById('goals').value, '减少填充词');
  assert.equal(document.getElementById('training-mode').value, 'presentation');
  assert.equal(document.getElementById('custom-rules').value, '多提醒结论先行');
  assert.equal(document.getElementById('lexicon-filler-words').value, '就是说');
  assert.equal(document.getElementById('lexicon-vague-replacements').value, '不错=扎实,顺滑');
});

test('PromptEditorPage saves prompt and custom lexicon together', async () => {
  const { calls, document, page } = createPage();
  await page.ready;

  document.getElementById('lexicon-hedge-words').value = '未必\n我倾向于';
  await page.save();

  assert.equal(calls.promptSaved.length, 1);
  assert.equal(calls.lexiconSaved.length, 1);
  assert.equal(calls.promptSaved[0].trainingMode, 'presentation');
  assert.deepEqual(calls.lexiconSaved[0], {
    fillerWords: ['就是说'],
    hedgeWords: ['未必', '我倾向于'],
    vagueReplacements: { 不错: ['扎实', '顺滑'] },
  });
});

test('PromptEditorPage reset clears both prompt and custom lexicon payloads', async () => {
  const { calls, document, page } = createPage();
  await page.ready;

  await page.reset();

  assert.equal(document.getElementById('goals').value, '');
  assert.equal(document.getElementById('lexicon-filler-words').value, '');
  assert.deepEqual(calls.promptSaved.at(-1), {
    trainingMode: 'improvisation',
    goals: '',
    customRules: '',
    styleRef: '',
    customWords: '',
  });
  assert.deepEqual(calls.lexiconSaved.at(-1), {
    fillerWords: [],
    hedgeWords: [],
    vagueReplacements: {},
  });
});
