const test = require('node:test');
const assert = require('node:assert/strict');
const service = require('../services/ai-service');

test('ai-service proxies connection test, realtime feedback, and final report calls', async () => {
  const calls = [];
  const deps = {
    sendConnectionTest: async (settings) => {
      calls.push(['test', settings]);
      return '连接成功';
    },
    sendFeedback: async (text, settings, prompt) => {
      calls.push(['feedback', text, settings, prompt]);
      return '实时反馈';
    },
    sendReport: async (fullText, stats, settings, prompt) => {
      calls.push(['report', fullText, stats, settings, prompt]);
      return '# 报告';
    },
  };

  assert.deepEqual(
    await service.testProviderConnection({ provider: 'deepseek' }, deps),
    { reply: '连接成功' },
  );
  assert.deepEqual(
    await service.getRealtimeFeedback('原文', { provider: 'openai' }, { tone: 'strict' }, deps),
    { feedback: '实时反馈' },
  );
  assert.deepEqual(
    await service.getFinalReport('全文', { totalWords: 10 }, { provider: 'custom' }, { style: 'md' }, deps),
    { report: '# 报告' },
  );

  assert.deepEqual(calls, [
    ['test', { provider: 'deepseek' }],
    ['feedback', '原文', { provider: 'openai' }, { tone: 'strict' }],
    ['report', '全文', { totalWords: 10 }, { provider: 'custom' }, { style: 'md' }],
  ]);
});
