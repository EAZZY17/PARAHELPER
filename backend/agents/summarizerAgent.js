const { fastCompletion } = require('../utils/embeddings');
const { updateConversation } = require('../utils/mongodb');

async function summarizeMessages(messages, existingSummary = '') {
  console.log(`[SummarizerAgent] Summarizing ${messages.length} messages...`);

  if (messages.length < 5) return existingSummary;

  const messageText = messages.map(m => 
    `[${m.role}] ${m.content}`
  ).join('\n');

  try {
    const summary = await fastCompletion([
      {
        role: 'system',
        content: `You are the Summarizer Agent for ParaHelper. Compress conversation messages into a concise summary.

Rules:
- Keep it to 3-4 sentences maximum
- Preserve critical information: patient details, vitals, forms triggered, actions taken
- Note any outstanding tasks or pending forms
- Include any emotional state indicators
- If there's an existing summary, incorporate it

Previous summary: ${existingSummary || 'None'}

Return ONLY the summary text.`
      },
      { role: 'user', content: messageText }
    ], { max_tokens: 256, temperature: 0.3 });

    console.log('[SummarizerAgent] Summary generated');
    return summary.trim();
  } catch (error) {
    console.error('[SummarizerAgent] Summarization failed:', error.message);
    return existingSummary;
  }
}

async function generateShiftSummary(sessionData, paramedicProfile) {
  console.log('[SummarizerAgent] Generating shift summary...');

  try {
    const summary = await fastCompletion([
      {
        role: 'system',
        content: `Generate an end-of-shift summary for a paramedic.

Paramedic: ${paramedicProfile.first_name} ${paramedicProfile.last_name}
Role: ${paramedicProfile.role}
Station: ${paramedicProfile.station}
Unit: ${paramedicProfile.unit}

Include:
- Total calls responded (from conversation data)
- All forms filed and sent
- ACRs pending
- Compliance alerts outstanding
- Overtime or missed meals to claim
- Brief overall shift assessment

Keep it professional but warm. This goes to supervisors.
Return ONLY the summary text.`
      },
      { role: 'user', content: JSON.stringify(sessionData) }
    ], { max_tokens: 512, temperature: 0.3 });

    return summary.trim();
  } catch (error) {
    console.error('[SummarizerAgent] Shift summary failed:', error.message);
    return 'Shift summary generation failed. Please review manually.';
  }
}

async function checkAndSummarize(sessionId, messages, existingSummary) {
  if (messages.length >= 15) {
    const oldMessages = messages.slice(0, 10);
    const newSummary = await summarizeMessages(oldMessages, existingSummary);
    
    await updateConversation(sessionId, { summary: newSummary });
    console.log('[SummarizerAgent] Auto-summarized and saved');
    
    return { summarized: true, summary: newSummary, keepMessages: messages.slice(10) };
  }
  return { summarized: false, summary: existingSummary, keepMessages: messages };
}

module.exports = { summarizeMessages, generateShiftSummary, checkAndSummarize };
