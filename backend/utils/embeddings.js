const { GoogleGenAI } = require('@google/genai');

// Support both GOOGLE_GEMINI_API_KEY and GEMINI_API_KEY (SDK default)
const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

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

async function getEmbedding(text) {
  if (!ai) throw new Error('GOOGLE_GEMINI_API_KEY is required');
  const result = await ai.models.embedContent({
    model: 'text-embedding-004',
    contents: text,
    config: { outputDimensionality: 768 }
  });
  return result.embeddings[0].values;
}

async function chatCompletion(messages, model = 'gemini-3.1-flash-lite-preview', options = {}) {
  if (!ai) throw new Error('GOOGLE_GEMINI_API_KEY is required');
  const { contents, systemInstruction } = toGeminiContents(messages);

  const config = {
    temperature: options.temperature ?? 0.7,
    maxOutputTokens: options.max_tokens ?? 1024,
    ...(systemInstruction && { systemInstruction: { parts: [{ text: systemInstruction }] } })
  };

  const response = await ai.models.generateContent({
    model: model.replace(/^google\//, '').replace(/-001$/, '') || 'gemini-3.1-flash-lite-preview',
    contents,
    config
  });

  return response.text;
}

async function fastCompletion(messages, options = {}) {
  return chatCompletion(messages, 'gemini-3.1-flash-lite-preview', { ...options, max_tokens: options.max_tokens ?? 512 });
}

module.exports = { chatCompletion, getEmbedding, fastCompletion };
