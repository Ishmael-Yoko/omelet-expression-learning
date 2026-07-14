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

function toLegacyResult(result, dataMapper = data => data) {
  if (!result || typeof result !== 'object' || typeof result.ok !== 'boolean') {
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
  toLegacyResult,
};
