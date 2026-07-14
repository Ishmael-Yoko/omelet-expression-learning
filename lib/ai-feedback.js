const { getRealtimePrompt, getReportPrompt } = require('./prompts');
const { PROVIDER_ENDPOINTS } = require('../config/ai-providers');

async function callAPI(endpoint, apiKey, model, messages, maxTokens = 200) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API request failed (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function getProviderConfig(settings) {
  const { provider, apiKey, model, ollamaUrl, customEndpoint, customModel } = settings;

  switch (provider) {
    case 'deepseek':
      return {
        endpoint: PROVIDER_ENDPOINTS.deepseek,
        apiKey,
        model: model || 'deepseek-chat',
      };
    case 'openai':
      return {
        endpoint: PROVIDER_ENDPOINTS.openai,
        apiKey,
        model: model || 'gpt-4o-mini',
      };
    case 'ollama':
      return {
        endpoint: `${ollamaUrl || 'http://localhost:11434'}/v1/chat/completions`,
        apiKey: 'ollama',
        model: model || 'qwen2.5:7b',
      };
    case 'custom':
      return {
        endpoint: customEndpoint,
        apiKey,
        model: customModel || model,
      };
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

async function sendFeedback(text, settings, customPrompt) {
  const config = getProviderConfig(settings);
  const prompt = getRealtimePrompt(text, null, customPrompt);
  const messages = [
    { role: 'system', content: prompt.system },
    { role: 'user', content: prompt.user },
  ];

  return callAPI(config.endpoint, config.apiKey, config.model, messages, 150);
}

async function sendReport(fullText, stats, settings, customPrompt) {
  const config = getProviderConfig(settings);
  const prompt = getReportPrompt(fullText, stats, customPrompt);
  const messages = [
    { role: 'system', content: prompt.system },
    { role: 'user', content: prompt.user },
  ];

  return callAPI(config.endpoint, config.apiKey, config.model, messages, 8192);
}

module.exports = { sendFeedback, sendReport, getProviderConfig };
