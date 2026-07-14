const test = require('node:test');
const assert = require('node:assert/strict');
const { fail, ok, toLegacyResult } = require('../main/ipc-result');

test('ok wraps IPC data in the canonical result shape', () => {
  assert.deepEqual(ok({ value: 1 }), {
    ok: true,
    data: { value: 1 },
  });
});

test('fail wraps errors with code and message', () => {
  assert.deepEqual(fail(new Error('boom'), 'TEST_ERROR'), {
    ok: false,
    error: {
      code: 'TEST_ERROR',
      message: 'boom',
      details: null,
    },
  });
});

test('toLegacyResult preserves current renderer success contract', () => {
  const legacy = toLegacyResult(ok({ finalText: 'hello' }));
  assert.deepEqual(legacy, {
    success: true,
    finalText: 'hello',
  });
});

test('toLegacyResult maps canonical errors to current renderer error contract', () => {
  const legacy = toLegacyResult(fail('missing model', 'ASR_MODEL_MISSING'));
  assert.deepEqual(legacy, {
    success: false,
    error: 'missing model',
    code: 'ASR_MODEL_MISSING',
  });
});

test('toLegacyResult passes through non-canonical results', () => {
  const raw = { ok: 'not boolean' };
  assert.equal(toLegacyResult(null), null);
  assert.equal(toLegacyResult(raw), raw);
});
