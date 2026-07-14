const test = require('node:test');
const assert = require('node:assert/strict');
const { getRealtimePrompt, getReportPrompt } = require('../lib/prompts');

test('getRealtimePrompt includes recent text and custom training rules', () => {
  const prompt = getRealtimePrompt('这是一段训练文本', {
    elapsedSec: 125,
    topic: '产品复盘',
    previousPoints: ['开头观点'],
  }, {
    goals: '减少填充词',
    customRules: '多提醒结论先行',
  });

  assert.equal(prompt.system.includes('减少填充词'), true);
  assert.equal(prompt.system.includes('多提醒结论先行'), true);
  assert.equal(prompt.user.includes('这是一段训练文本'), true);
  assert.equal(prompt.user.includes('产品复盘'), true);
});

test('getReportPrompt keeps markdown report contract and omelet opening', () => {
  const prompt = getReportPrompt('完整原文', {
    duration: 60,
    totalWords: 120,
    fillers: 2,
    hedges: 1,
    vagueWords: 3,
  }, {
    styleRef: '更直接',
  });

  assert.equal(prompt.system.includes('markdown'), true);
  assert.equal(prompt.system.includes('omelet'), true);
  assert.equal(prompt.system.includes('更直接'), true);
  assert.equal(prompt.user.includes('完整原文'), true);
  assert.equal(prompt.user.includes('60'), true);
});
