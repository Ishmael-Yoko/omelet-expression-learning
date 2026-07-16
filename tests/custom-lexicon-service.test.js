const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_CUSTOM_LEXICON,
  getCustomLexiconPath,
  loadCustomLexicon,
  normalizeCustomLexicon,
  saveCustomLexicon,
} = require('../services/custom-lexicon-service');

function createLexiconPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'omelet-custom-lexicon-'));
  return path.join(dir, 'custom-lexicon.json');
}

test('getCustomLexiconPath resolves under userData path', () => {
  assert.equal(
    getCustomLexiconPath('C:\\demo-user-data'),
    path.join('C:\\demo-user-data', 'custom-lexicon.json'),
  );
});

test('normalizeCustomLexicon trims, deduplicates, and ignores empty replacement rows', () => {
  assert.deepEqual(normalizeCustomLexicon({
    fillerWords: ['  就是说 ', '', '就是说'],
    hedgeWords: ['  未必 ', '未必'],
    vagueReplacements: {
      不错: ['扎实', ' 扎实 ', ''],
      '': ['忽略'],
      还行: [],
    },
  }), {
    fillerWords: ['就是说'],
    hedgeWords: ['未必'],
    vagueReplacements: {
      不错: ['扎实'],
    },
  });
});

test('loadCustomLexicon falls back to defaults and saveCustomLexicon persists normalized data', () => {
  const lexiconPath = createLexiconPath();

  assert.deepEqual(loadCustomLexicon({ lexiconPath }), DEFAULT_CUSTOM_LEXICON);

  const saved = saveCustomLexicon({
    fillerWords: ['就是说', '就是说'],
    hedgeWords: ['未必'],
    vagueReplacements: {
      不错: ['扎实', '顺滑'],
    },
  }, { lexiconPath });

  assert.deepEqual(saved, {
    fillerWords: ['就是说'],
    hedgeWords: ['未必'],
    vagueReplacements: {
      不错: ['扎实', '顺滑'],
    },
  });
  assert.deepEqual(loadCustomLexicon({ lexiconPath }), saved);
});
