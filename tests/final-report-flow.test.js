const test = require('node:test');
const assert = require('node:assert/strict');
const { FinalReportFlow } = require('../src/final-report-flow');

function createFlow(result) {
  const calls = {
    requested: [],
    events: [],
  };
  const flow = new FinalReportFlow({
    getFinalReport: async payload => {
      calls.requested.push(payload);
      calls.events.push('request');
      return result;
    },
    openLoading: () => calls.events.push('loading'),
    renderReport: report => calls.events.push(`render:${report}`),
    showError: error => calls.events.push(`error:${error}`),
  });

  return { calls, flow };
}

test('FinalReportFlow opens loading and renders successful report', async () => {
  const { calls, flow } = createFlow({ success: true, report: '# 报告' });
  const payload = {
    fullText: '完整逐字稿',
    stats: { duration: 10, totalWords: 20 },
  };

  const result = await flow.generate(payload);

  assert.deepEqual(result, { success: true, report: '# 报告' });
  assert.deepEqual(calls.requested, [payload]);
  assert.deepEqual(calls.events, ['loading', 'request', 'render:# 报告']);
});

test('FinalReportFlow shows errors without rendering report', async () => {
  const { calls, flow } = createFlow({ success: false, error: 'API Key 缺失' });

  const result = await flow.generate({ fullText: '', stats: {} });

  assert.deepEqual(result, { success: false, error: 'API Key 缺失' });
  assert.deepEqual(calls.events, ['loading', 'request', 'error:API Key 缺失']);
});
