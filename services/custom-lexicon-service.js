const fs = require('node:fs');
const path = require('node:path');
let app = null;
try {
  ({ app } = require('electron'));
} catch {
  app = null;
}

const DEFAULT_CUSTOM_LEXICON = {
  fillerWords: [],
  hedgeWords: [],
  vagueReplacements: {},
};

function getCustomLexiconPath(userDataPath) {
  const basePath = userDataPath || (app && typeof app.getPath === 'function' ? app.getPath('userData') : process.cwd());
  return path.join(basePath, 'custom-lexicon.json');
}

function normalizeWordList(value) {
  return [...new Set(
    (Array.isArray(value) ? value : [])
      .map(item => String(item || '').trim())
      .filter(Boolean),
  )];
}

function normalizeReplacementMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const entries = Object.entries(value)
    .map(([word, replacements]) => [String(word || '').trim(), normalizeWordList(replacements)])
    .filter(([word, replacements]) => word && replacements.length > 0);

  return Object.fromEntries(entries);
}

function normalizeCustomLexicon(value) {
  return {
    fillerWords: normalizeWordList(value?.fillerWords),
    hedgeWords: normalizeWordList(value?.hedgeWords),
    vagueReplacements: normalizeReplacementMap(value?.vagueReplacements),
  };
}

function loadCustomLexicon(options = {}) {
  const lexiconPath = options.lexiconPath || getCustomLexiconPath(options.userDataPath);
  if (!fs.existsSync(lexiconPath)) {
    return { ...DEFAULT_CUSTOM_LEXICON };
  }

  try {
    const raw = JSON.parse(fs.readFileSync(lexiconPath, 'utf-8'));
    return normalizeCustomLexicon(raw);
  } catch {
    return { ...DEFAULT_CUSTOM_LEXICON };
  }
}

function saveCustomLexicon(value, options = {}) {
  const lexiconPath = options.lexiconPath || getCustomLexiconPath(options.userDataPath);
  const normalized = normalizeCustomLexicon(value);
  fs.writeFileSync(lexiconPath, JSON.stringify(normalized, null, 2));
  return normalized;
}

module.exports = {
  DEFAULT_CUSTOM_LEXICON,
  getCustomLexiconPath,
  loadCustomLexicon,
  normalizeCustomLexicon,
  saveCustomLexicon,
};
