(function initPromptEditor(global) {
  function toggleExample(id, documentRef = global.document) {
    const element = documentRef.getElementById(id);
    if (element) {
      element.classList.toggle('show');
    }
  }

  function parseWordList(value) {
    return String(value || '')
      .split(/\r?\n/g)
      .map(item => item.trim())
      .filter(Boolean);
  }

  function formatWordList(values) {
    return (values || []).join('\n');
  }

  function parseReplacementMap(value) {
    const entries = String(value || '')
      .split(/\r?\n/g)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => line.split('=').map(part => part.trim()))
      .filter(parts => parts.length === 2 && parts[0] && parts[1])
      .map(([word, replacements]) => [
        word,
        replacements.split(',').map(item => item.trim()).filter(Boolean),
      ]);
    return Object.fromEntries(entries);
  }

  function formatReplacementMap(value) {
    return Object.entries(value || {})
      .map(([word, replacements]) => `${word}=${(replacements || []).join(',')}`)
      .join('\n');
  }

  class PromptEditorPage {
    constructor({
      api = global.window?.api,
      documentRef = global.document,
      closeWindow = () => global.window?.close(),
      confirmReset = message => global.confirm(message),
    } = {}) {
      this.api = api;
      this.documentRef = documentRef;
      this.closeWindow = closeWindow;
      this.confirmReset = confirmReset;
      this.goalsInput = documentRef.getElementById('goals');
      this.customRulesInput = documentRef.getElementById('custom-rules');
      this.styleRefInput = documentRef.getElementById('style-ref');
      this.customWordsInput = documentRef.getElementById('custom-words');
      this.lexiconFillerWordsInput = documentRef.getElementById('lexicon-filler-words');
      this.lexiconHedgeWordsInput = documentRef.getElementById('lexicon-hedge-words');
      this.lexiconVagueReplacementsInput = documentRef.getElementById('lexicon-vague-replacements');
      this.btnSave = documentRef.getElementById('btn-save');
      this.btnReset = documentRef.getElementById('btn-reset');
      this.btnBack = documentRef.getElementById('btn-back');
      this.saveSuccess = documentRef.getElementById('save-success');

      this.bindEvents();
      this.ready = this.load();
    }

    bindEvents() {
      this.btnSave.addEventListener('click', () => this.save());
      this.btnReset.addEventListener('click', () => this.reset());
      this.btnBack.addEventListener('click', () => {
        if (this.api && this.api.closeWindow) {
          this.api.closeWindow();
          return;
        }
        this.closeWindow();
      });
    }

    async load() {
      const [prompt, lexicon] = await Promise.all([
        this.api.getCustomPrompt(),
        this.api.getCustomLexicon(),
      ]);

      if (prompt) {
        this.goalsInput.value = prompt.goals || '';
        this.customRulesInput.value = prompt.customRules || '';
        this.styleRefInput.value = prompt.styleRef || '';
        this.customWordsInput.value = prompt.customWords || '';
      }

      if (lexicon) {
        this.lexiconFillerWordsInput.value = formatWordList(lexicon.fillerWords);
        this.lexiconHedgeWordsInput.value = formatWordList(lexicon.hedgeWords);
        this.lexiconVagueReplacementsInput.value = formatReplacementMap(lexicon.vagueReplacements);
      }
    }

    buildPromptPayload() {
      return {
        goals: this.goalsInput.value.trim(),
        customRules: this.customRulesInput.value.trim(),
        styleRef: this.styleRefInput.value.trim(),
        customWords: this.customWordsInput.value.trim(),
      };
    }

    buildLexiconPayload() {
      return {
        fillerWords: parseWordList(this.lexiconFillerWordsInput.value),
        hedgeWords: parseWordList(this.lexiconHedgeWordsInput.value),
        vagueReplacements: parseReplacementMap(this.lexiconVagueReplacementsInput.value),
      };
    }

    showSaved(message = '✓ 已保存，下次训练生效') {
      this.saveSuccess.textContent = message;
      this.saveSuccess.classList.add('show');
      setTimeout(() => {
        this.saveSuccess.classList.remove('show');
        this.saveSuccess.textContent = '✓ 已保存，下次训练生效';
      }, 2000);
    }

    async save() {
      await Promise.all([
        this.api.saveCustomPrompt(this.buildPromptPayload()),
        this.api.saveCustomLexicon(this.buildLexiconPayload()),
      ]);
      this.showSaved();
    }

    async reset() {
      if (!this.confirmReset('确定要清空所有自定义规则吗？')) {
        return;
      }

      this.goalsInput.value = '';
      this.customRulesInput.value = '';
      this.styleRefInput.value = '';
      this.customWordsInput.value = '';
      this.lexiconFillerWordsInput.value = '';
      this.lexiconHedgeWordsInput.value = '';
      this.lexiconVagueReplacementsInput.value = '';

      await Promise.all([
        this.api.saveCustomPrompt({ goals: '', customRules: '', styleRef: '', customWords: '' }),
        this.api.saveCustomLexicon({ fillerWords: [], hedgeWords: [], vagueReplacements: {} }),
      ]);
      this.showSaved('✓ 已恢复默认');
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      PromptEditorPage,
      formatReplacementMap,
      formatWordList,
      parseReplacementMap,
      parseWordList,
      toggleExample,
    };
  }

  global.toggleExample = id => toggleExample(id);

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      new PromptEditorPage();
    });
  }
}(typeof window !== 'undefined' ? window : globalThis));
