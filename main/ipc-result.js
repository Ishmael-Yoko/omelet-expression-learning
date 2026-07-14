function ok(data = null) {
  return { ok: true, data };
}

function fail(error, code = 'IPC_ERROR', details = null) {
  const message = error instanceof Error ? error.message : String(error || 'Unknown error');
  return {
    ok: false,
    error: {
      code,
      message,
      details,
    },
  };
}

function isCanonicalResult(result) {
  return Boolean(
    result
      && typeof result === 'object'
      && typeof result.ok === 'boolean'
      && (Object.hasOwn(result, 'data') || Object.hasOwn(result, 'error')),
  );
}

function unwrapResult(result) {
  if (!isCanonicalResult(result)) {
    return result;
  }

  if (result.ok) {
    return result.data;
  }

  const error = new Error(result.error?.message || 'Unknown error');
  error.code = result.error?.code || 'IPC_ERROR';
  error.details = result.error?.details || null;
  throw error;
}

function toLegacyResult(result, dataMapper = data => data) {
  if (!isCanonicalResult(result)) {
    return result;
  }

  if (result.ok) {
    const mapped = dataMapper(result.data);
    if (mapped && typeof mapped === 'object' && !Array.isArray(mapped)) {
      return { success: true, ...mapped };
    }
    return { success: true, data: mapped };
  }

  return {
    success: false,
    error: result.error?.message || 'Unknown error',
    code: result.error?.code || 'IPC_ERROR',
  };
}

module.exports = {
  ok,
  fail,
  isCanonicalResult,
  unwrapResult,
  toLegacyResult,
};
