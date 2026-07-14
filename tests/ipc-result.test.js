const test = require('node:test');
const assert = require('node:assert/strict');
const {
  fail,
  isCanonicalResult,
  ok,
  toLegacyResult,
  unwrapResult,
} = require('../main/ipc-result');

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

test('canonical detection requires a data or error envelope', () => {
  const modelStatus = { ok: false, activeDir: null };
  assert.equal(isCanonicalResult(ok(modelStatus)), true);
  assert.equal(isCanonicalResult(modelStatus), false);
});

test('unwrapResult returns canonical data without changing business fields', () => {
  const modelStatus = { ok: false, activeDir: null };
  assert.deepEqual(unwrapResult(ok(modelStatus)), modelStatus);
  assert.equal(unwrapResult(modelStatus), modelStatus);
});

test('unwrapResult throws canonical errors with the IPC code attached', () => {
  assert.throws(
    () => unwrapResult(fail('load failed', 'SETTINGS_LOAD_FAILED')),
    (error) => {
      assert.equal(error.message, 'load failed');
      assert.equal(error.code, 'SETTINGS_LOAD_FAILED');
      return true;
    },
  );
});
