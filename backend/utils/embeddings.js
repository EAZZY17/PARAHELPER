const { GoogleGenAI } = require('@google/genai');

// Support both GOOGLE_GEMINI_API_KEY and GEMINI_API_KEY (SDK default)
const geminiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const ai = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : null;

// OpenRouter API key - when set, chat uses OpenRouter instead of Gemini (avoids Gemini quota)
const openRouterKey = process.env.OPENROUTER_API_KEY;

// OpenRouter model: use env override or default to Gemini 2.5 Flash
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4.6';
// OpenRouter embedding model (768 dims to match ChromaDB)
const OPENROUTER_EMBEDDING_MODEL = process.env.OPENROUTER_EMBEDDING_MODEL || 'google/text-embedding-004';

// Convert messages to OpenAI format (for OpenRouter)
function toOpenAIMessages(messages) {
  const out = [];
  for (const msg of messages) {
    if (msg.role === 'system') {
      out.push({ role: 'system', content: msg.content || '' });
    } else if (msg.role === 'user' || msg.role === 'assistant') {
      out.push({ role: msg.role, content: msg.content || '' });
    }
  }
  return out;
}

// Convert OpenAI-format messages to Gemini format
function toGeminiContents(messages) {
  const contents = [];
  let systemInstruction = null;

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemInstruction = systemInstruction ? `${systemInstruction}\n\n${msg.content}` : msg.content;
    } else {
      const role = msg.role === 'assistant' ? 'model' : 'user';
      contents.push({ role, parts: [{ text: msg.content || '' }] });
    }
  }

  return { contents, systemInstruction };
}

async function getEmbeddingOpenRouter(text) {
  const res = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openRouterKey}`
    },
    body: JSON.stringify({
      model: OPENROUTER_EMBEDDING_MODEL,
      input: typeof text === 'string' ? text : text
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter embedding error ${res.status}: ${err}`);
  }
  const data = await res.json();
  const embedding = data.data?.[0]?.embedding;
  if (!embedding) throw new Error('No embedding in OpenRouter response');
  return embedding;
}

async function getEmbeddingGemini(text) {
  const result = await ai.models.embedContent({
    model: 'text-embedding-004',
    contents: text,
    config: { outputDimensionality: 768 }
  });
  return result.embeddings[0].values;
}

async function getEmbedding(text) {
  if (openRouterKey) return getEmbeddingOpenRouter(text);
  if (ai) return getEmbeddingGemini(text);
  throw new Error('OPENROUTER_API_KEY or GOOGLE_GEMINI_API_KEY required for embeddings');
}

async function chatCompletionOpenRouter(messages, model, options = {}) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openRouterKey}`,
      'HTTP-Referer': process.env.APP_URL || 'https://parahelper.onrender.com'
    },
    body: JSON.stringify({
      model: model || OPENROUTER_MODEL,
      messages: toOpenAIMessages(messages),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 1024
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

async function chatCompletionGemini(messages, model, options = {}) {
  if (!ai) throw new Error('GOOGLE_GEMINI_API_KEY is required');
  const { contents, systemInstruction } = toGeminiContents(messages);

  const config = {
    temperature: options.temperature ?? 0.7,
    maxOutputTokens: options.max_tokens ?? 1024,
    ...(systemInstruction && { systemInstruction: { parts: [{ text: systemInstruction }] } })
  };

  const geminiModel = (model || 'gemini-2.5-flash').replace(/^google\//, '').replace(/-001$/, '');
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents,
    config
  });

  return response.text;
}

async function chatCompletion(messages, model, options = {}) {
  if (openRouterKey) {
    const openRouterModel = model?.startsWith('google/') ? model : (model ? `google/${model.replace(/^google\//, '')}` : OPENROUTER_MODEL);
    return chatCompletionOpenRouter(messages, openRouterModel, options);
  }
  if (ai) {
    return chatCompletionGemini(messages, model, options);
  }
  throw new Error('Either OPENROUTER_API_KEY or GOOGLE_GEMINI_API_KEY is required');
}

async function fastCompletion(messages, options = {}) {
  return chatCompletion(messages, null, { ...options, max_tokens: options.max_tokens ?? 512 });
}

module.exports = { chatCompletion, getEmbedding, fastCompletion };
