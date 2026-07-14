(function initFeedbackView(global) {
  const DEFAULT_EMPTY = '开始录制或粘贴逐字稿后，这里会显示实时反馈。';
  const DEFAULT_MAX_ITEMS = 12;
  const DEFAULT_DEDUPE_WINDOW = 3;

  function classifyFeedback(text) {
    if (text === '✓' || text.includes('✓')) {
      return 'good';
    }

    const fillerKeywords = ['嗯', '啊', '呃', '那个', '就是', '然后', '这个', '对吧', '是吧', '反正', '基本上', '所以说'];
    if (fillerKeywords.some(word => text.includes(`「${word}」`))) {
      return 'filler';
    }

    const hedgeKeywords = ['可能', '也许', '大概', '应该', '我觉得', '好像', '似乎', '感觉', '或许'];
    if (hedgeKeywords.some(word => text.includes(`「${word}」`))) {
      return 'hedge';
    }

    if (text.includes('->')) {
      return 'vague';
    }

    return 'ai';
  }

  class FeedbackView {
    constructor({
      containerEl,
      emptyText = DEFAULT_EMPTY,
      maxItems = DEFAULT_MAX_ITEMS,
      dedupeWindow = DEFAULT_DEDUPE_WINDOW,
    }) {
      this.containerEl = containerEl;
      this.emptyText = emptyText;
      this.maxItems = maxItems;
      this.dedupeWindow = dedupeWindow;
    }

    clear() {
      this.containerEl.innerHTML = '';
      const empty = this.createItem(this.emptyText, 'feedback-empty');
      this.containerEl.appendChild(empty);
    }

    add(text, type = classifyFeedback(text)) {
      const value = String(text || '').trim();
      if (!value) {
        return false;
      }

      const existing = Array.from(this.containerEl.querySelectorAll('.feedback-item')).slice(0, this.dedupeWindow);
      if (existing.some(el => el.textContent === value)) {
        return false;
      }

      this.removeEmptyState();
      const item = this.createItem(value, `feedback-item type-${type}`);
      this.containerEl.insertBefore(item, this.containerEl.firstChild);
      this.trimItems();
      return true;
    }

    createItem(text, className) {
      const item = this.containerEl.ownerDocument.createElement('div');
      item.className = className;
      item.textContent = text;
      return item;
    }

    removeEmptyState() {
      this.containerEl.querySelectorAll('.feedback-empty').forEach(el => el.remove());
    }

    trimItems() {
      const items = Array.from(this.containerEl.querySelectorAll('.feedback-item'));
      items.slice(this.maxItems).forEach(el => el.remove());
    }
  }

  const api = {
    DEFAULT_EMPTY,
    DEFAULT_DEDUPE_WINDOW,
    DEFAULT_MAX_ITEMS,
    FeedbackView,
    classifyFeedback,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletFeedbackView = api;
}(typeof window !== 'undefined' ? window : globalThis));
