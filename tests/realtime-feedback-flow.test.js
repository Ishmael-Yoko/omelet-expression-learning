const test = require('node:test');
const assert = require('node:assert/strict');
const { RealtimeFeedbackFlow } = require('../src/realtime-feedback-flow');

function createFlow(options = {}) {
  const calls = {
    requested: [],
    added: [],
  };
  const flow = new RealtimeFeedbackFlow({
    minDelta: 5,
    getRealtimeFeedback: async (text) => {
      calls.requested.push(text);
      return options.result || { success: true, feedback: '第一条\n\n 第二条 ' };
    },
    addFeedback: line => calls.added.push(line),
  });

  return { calls, flow };
}

test('RealtimeFeedbackFlow skips requests until text grows enough', async () => {
  const { calls, flow } = createFlow();

  assert.deepEqual(await flow.request('短'), { success: false, skipped: true });
  assert.deepEqual(calls.requested, []);
});

test('RealtimeFeedbackFlow requests feedback and renders non-empty lines', async () => {
  const { calls, flow } = createFlow();

  const result = await flow.request('足够长的文本');

  assert.equal(result.success, true);
  assert.deepEqual(calls.requested, ['足够长的文本']);
  assert.deepEqual(calls.added, ['第一条', '第二条']);
});

test('RealtimeFeedbackFlow does not render failed or empty feedback', async () => {
  const { calls, flow } = createFlow({ result: { success: false, error: 'missing api key' } });

  const result = await flow.request('足够长的文本');

  assert.deepEqual(result, { success: false, error: 'missing api key' });
  assert.deepEqual(calls.added, []);
});

test('RealtimeFeedbackFlow supports forced requests and reset', async () => {
  const { calls, flow } = createFlow();

  await flow.request('12345');
  assert.deepEqual(await flow.request('123456'), { success: false, skipped: true });

  flow.reset();
  await flow.request('12345');
  await flow.request('x', { force: true });

  assert.deepEqual(calls.requested, ['12345', '12345', 'x']);
});
