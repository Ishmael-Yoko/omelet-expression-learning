(function initAnalysisFeedbackRules(global) {
  function buildAnalysisFeedbackItems(analysis) {
    if (!analysis) {
      return [];
    }

    const items = [];

    if (analysis.vagueWords && analysis.vagueWords.length > 0) {
      analysis.vagueWords.forEach(item => {
        const alternatives = (item.alternatives || []).slice(0, 3).join(' / ');
        items.push({
          text: alternatives ? `「${item.word}」 -> ${alternatives}` : `「${item.word}」需要更具体`,
          type: 'vague',
        });
      });
    }

    if (analysis.fillers && analysis.fillers.length >= 2) {
      const uniqueFillers = [...new Set(analysis.fillers.map(item => item.word).filter(Boolean))].slice(0, 3);
      if (uniqueFillers.length > 0) {
        items.push({
          text: `填充词：${uniqueFillers.join('、')} - 试试停顿`,
          type: 'filler',
        });
      }
    }

    if (analysis.hedges && analysis.hedges.length >= 1) {
      const uniqueHedges = [...new Set(analysis.hedges.map(item => item.word).filter(Boolean))].slice(0, 2);
      if (uniqueHedges.length > 0) {
        items.push({
          text: `「${uniqueHedges.join('」「')}」 -> 直接说`,
          type: 'hedge',
        });
      }
    }

    return items;
  }

  const api = { buildAnalysisFeedbackItems };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.OmeletAnalysisFeedbackRules = api;
}(typeof window !== 'undefined' ? window : globalThis));
