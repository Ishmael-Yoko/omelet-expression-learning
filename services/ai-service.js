const aiFeedback = require('../lib/ai-feedback');

async function testProviderConnection(settings, deps = aiFeedback) {
  const reply = await deps.sendConnectionTest(settings);
  return { reply };
}

async function getRealtimeFeedback(text, settings, customPrompt, deps = aiFeedback) {
  const feedback = await deps.sendFeedback(text, settings, customPrompt);
  return { feedback };
}

async function getFinalReport(fullText, stats, settings, customPrompt, deps = aiFeedback) {
  const report = await deps.sendReport(fullText, stats, settings, customPrompt);
  return { report };
}

module.exports = {
  getFinalReport,
  getRealtimeFeedback,
  testProviderConnection,
};
