const { chatCompletion, fastCompletion } = require('../utils/embeddings');
const { deepClean } = require('./transcriptionCleaner');
const { detectFormsWithAI } = require('./formDetectiveAgent');
const { extractFormData } = require('./extractionAgent');
const { runGuardrailCheck } = require('./guardrailAgent');
const { answerQuestion } = require('./knowledgeAgent');
const { checkAndSummarize } = require('./summarizerAgent');
const { detectAdminTask, handleAdminTask } = require('./adminAgent');
const { recommendHospital } = require('../services/hospitalRecommendation');
const { saveMessage, getMessages, updateConversation } = require('../utils/mongodb');
const { v4: uuidv4 } = require('uuid');

const CRISIS_KEYWORDS = [
  'unresponsive', 'not breathing', 'code', 'cardiac arrest',
  'major trauma', 'critical', 'cpr', 'no pulse', 'dying',
  'code blue', 'resuscitation', 'v-fib', 'asystole'
];

const EMOTIONAL_KEYWORDS = [
  'rough', 'hard', 'sad', 'bad outcome', 'kid died', 'child died',
  'tough', 'difficult', 'lost the patient', 'didn\'t make it',
  'pronounced', 'death', 'emotional'
];

const POSITIVE_KEYWORDS = [
  'great outcome', 'saved', 'good call', 'made it', 'stable',
  'discharged', 'good result', 'awesome', 'nailed it'
];

function detectCrisisMode(message) {
  const lower = message.toLowerCase();
  return CRISIS_KEYWORDS.some(k => lower.includes(k));
}

function detectEmotionalState(message) {
  const lower = message.toLowerCase();
  if (EMOTIONAL_KEYWORDS.some(k => lower.includes(k))) return 'tough';
  if (POSITIVE_KEYWORDS.some(k => lower.includes(k))) return 'positive';
  return 'neutral';
}

// Only trigger map for EXPLICIT directions/route requests - not when filling form fields
const ROUTE_KEYWORDS = [
  'directions to', 'route to', 'navigate to', 'how do i get to', 'how to get to',
  'fastest way to', 'drive to', 'map to', 'show me the way to', 'get directions',
  'need directions', 'give me directions', 'show me the route', 'fastest route to'
];

const HOSPITAL_KEYWORDS = [
  'nearest hospital', 'closest hospital', 'best hospital', 'fastest hospital',
  'which hospital should', 'hospital recommendation', 'take patient to hospital',
  'nearest er', 'closest emergency'
];

function detectHospitalRequest(message) {
  const lower = message.toLowerCase();
  return HOSPITAL_KEYWORDS.some(k => lower.includes(k));
}

function isLikelyFormFieldAnswer(message, guardrailResults) {
  if (!message || typeof message !== 'string') return false;
  const trimmed = message.trim();
  if (trimmed.length > 80) return false; // long messages = likely not a single form field
  const locationLabels = ['location', 'city', 'address', 'date', 'time', 'severity'];
  const hasFormsWithMissingLocation = Object.values(guardrailResults || {}).some((gr) => {
    const issues = (gr?.issues || []).filter(i => i.type === 'missing_required');
    return issues.some(i => {
      const label = (i.label || '').toLowerCase();
      return locationLabels.some(l => label.includes(l));
    });
  });
  return hasFormsWithMissingLocation;
}

async function extractSceneAddress(message, conversationContext) {
  try {
    const result = await fastCompletion([
      {
        role: 'system',
        content: `Extract the accident/incident/scene location or address from the user's message. IMPORTANT: This is for Canada only. Return ONLY the address as a single line. Always include province and Canada (e.g. "123 McCowan Road, Scarborough, ON, Canada" or "corner of McCowan and Sheppard, Toronto, ON, Canada"). For street/intersection only, append ", ON, Canada". If no location, return empty string.`
      },
      { role: 'user', content: `Message: ${message}\n\nContext: ${conversationContext || 'none'}` }
    ], { max_tokens: 64, temperature: 0 });
    const addr = (result || '').trim().replace(/^["']|["']$/g, '');
    return addr || null;
  } catch (e) {
    console.error('[ConversationAgent] Scene address extraction failed:', e.message);
    return null;
  }
}

function detectDirectionsRequest(message) {
  const lower = message.toLowerCase();
  return ROUTE_KEYWORDS.some(k => lower.includes(k));
}

async function extractDestinationAddress(message, conversationContext) {
  try {
    const result = await fastCompletion([
      {
        role: 'system',
        content: `Extract the destination address or location from the user's message. IMPORTANT: This is for Canada only. Return ONLY the address as a single line. Always include province and Canada for precision (e.g. "123 McCowan Road, Scarborough, ON, Canada" or "Scarborough General Hospital, Toronto, ON, Canada"). For street names or partial addresses, append ", ON, Canada". For Toronto area add "Toronto, ON, Canada". If no location, return empty string.`
      },
      { role: 'user', content: `Message: ${message}\n\nContext: ${conversationContext || 'none'}` }
    ], { max_tokens: 64, temperature: 0 });
    const addr = (result || '').trim().replace(/^["']|["']$/g, '');
    return addr || null;
  } catch (e) {
    console.error('[ConversationAgent] Address extraction failed:', e.message);
    return null;
  }
}

function detectPediatricMode(message) {
  const lower = message.toLowerCase();
  const ageMatch = lower.match(/(?:age|aged|years?\s*old|yo|child|kid|infant|baby|toddler|newborn)\s*(\d+)?/);
  if (ageMatch) {
    const age = parseInt(ageMatch[1]);
    if (!isNaN(age) && age < 12) return true;
    if (!ageMatch[1] && ['child', 'kid', 'infant', 'baby', 'toddler', 'newborn'].some(w => lower.includes(w))) return true;
  }
  return false;
}

async function processMessage({
  message, sessionId, paramedicProfile, wasVoice = false,
  currentForms = {}, conversationSummary = '', shiftPhase = 'between_calls',
  pendingAdminTask = null
}) {
  console.log(`\n[ConversationAgent] Processing message from ${paramedicProfile.first_name}...`);

  let cleanedMessage = message;
  let rawTranscript = message;
  if (wasVoice) {
    try {
      cleanedMessage = await deepClean(message);
      console.log(`[ConversationAgent] Cleaned voice input: "${cleanedMessage}"`);
    } catch (e) {
      console.error('[ConversationAgent] Voice cleanup failed:', e.message);
      cleanedMessage = message;
    }
  }

  try {
    await saveMessage({
      message_id: `MSG-${uuidv4().substring(0, 8)}`,
      session_id: sessionId,
      paramedic_id: paramedicProfile.paramedic_id,
      role: 'user',
      content: cleanedMessage,
      timestamp: new Date(),
      was_voice: wasVoice,
      raw_transcript: rawTranscript,
      cleaned_transcript: cleanedMessage,
      extracted_data: null
    });
  } catch (e) {
    console.error('[ConversationAgent] Save user message failed:', e.message);
  }

  const isCrisis = detectCrisisMode(cleanedMessage);
  const emotionalState = detectEmotionalState(cleanedMessage);
  const isPediatric = detectPediatricMode(cleanedMessage);

  let conversationContext = '';
  try {
    const messagesSoFar = await getMessages(sessionId);
    conversationContext = messagesSoFar.slice(-12).map(m => `${m.role}: ${m.content}`).join('\n');
  } catch (e) {
    console.error('[ConversationAgent] Load messages failed:', e.message);
  }

  let detectedForms = [];
  try {
    detectedForms = await detectFormsWithAI(cleanedMessage);
  } catch (e) {
    console.error('[ConversationAgent] Form detection failed:', e.message);
  }

  const adminTask = detectAdminTask(cleanedMessage);

  // ALWAYS run extraction for every form on every message - fill form as info is given, no matter what
  const allFormTypes = new Set([...detectedForms, ...Object.keys(currentForms || {})]);
  let formUpdates = { ...currentForms };

  for (const formType of allFormTypes) {
    if (!formType) continue;
    try {
      const existingData = formUpdates[formType]?.fields || {};
      const extracted = await extractFormData(cleanedMessage, formType, existingData, paramedicProfile, conversationContext);
      if (extracted) formUpdates[formType] = extracted;
    } catch (e) {
      console.error(`[ConversationAgent] Extraction failed for ${formType}:`, e.message);
    }
  }

  let guardrailResults = {};
  for (const [formType, formData] of Object.entries(formUpdates)) {
    if (formData) {
      try {
        guardrailResults[formType] = await runGuardrailCheck(formType, formData, cleanedMessage);
      } catch (e) {
        console.error(`[ConversationAgent] Guardrail failed for ${formType}:`, e.message);
      }
    }
  }

  let knowledgeResponse = null;
  const questionIndicators = ['what', 'how', 'where', 'when', 'which', 'can you', 'tell me', 'dose', 'dosage', 'protocol', 'hospital', 'help', 'need help'];
  if (questionIndicators.some(q => cleanedMessage.toLowerCase().includes(q)) && detectedForms.length === 0) {
    try {
      knowledgeResponse = await answerQuestion(cleanedMessage, paramedicProfile, conversationSummary);
    } catch (e) {
      console.error('[ConversationAgent] Knowledge query failed:', e.message);
    }
  }

  let mapDestination = null;
  let hospitalRecommendation = null;

  // Only open map for EXPLICIT directions/hospital requests - NOT when filling form fields (location, city, etc.)
  const skipMapForFormAnswer = isLikelyFormFieldAnswer(cleanedMessage, guardrailResults);

  if (!skipMapForFormAnswer && detectHospitalRequest(cleanedMessage)) {
    try {
      const sceneAddr = await extractSceneAddress(cleanedMessage, conversationContext);
      const addrToUse = sceneAddr || `${paramedicProfile.station || 'Toronto'}, ON`;
      hospitalRecommendation = await recommendHospital(addrToUse);
      if (hospitalRecommendation?.recommended) {
        mapDestination = hospitalRecommendation.recommended.place_name;
        console.log('[ConversationAgent] Hospital recommendation:', hospitalRecommendation.recommended.place_name, hospitalRecommendation.recommended.durationMinutes, 'min');
      }
    } catch (e) {
      console.error('[ConversationAgent] Hospital recommendation failed:', e.message);
    }
  } else if (!skipMapForFormAnswer && detectDirectionsRequest(cleanedMessage)) {
    try {
      mapDestination = await extractDestinationAddress(cleanedMessage, conversationContext);
      if (mapDestination) console.log('[ConversationAgent] Directions request detected, destination:', mapDestination);
    } catch (e) {
      console.error('[ConversationAgent] Directions extraction failed:', e.message);
    }
  }

  let adminResponse = null;
  const taskToHandle = adminTask || pendingAdminTask;
  if (taskToHandle) {
    try {
      adminResponse = await handleAdminTask(taskToHandle, cleanedMessage, paramedicProfile, conversationContext);
    } catch (e) {
      console.error('[ConversationAgent] Admin task failed:', e.message);
    }
  }

  let messages = [];
  let summaryResult = { summarized: false, summary: conversationSummary, keepMessages: [] };
  try {
    messages = await getMessages(sessionId);
    summaryResult = await checkAndSummarize(sessionId, messages, conversationSummary);
  } catch (e) {
    console.error('[ConversationAgent] Summary/load failed:', e.message);
    summaryResult = { summarized: false, summary: conversationSummary, keepMessages: messages };
  }

  const mode = isCrisis ? 'stress' : 'normal';
  const modeInstruction = isCrisis
    ? 'STRESS MODE ACTIVE. Short, sharp responses only. Maximum 2 sentences. No small talk. Information only. "Copy that." "On it." "Noted."'
    : 'Normal mode. Warm, conversational, friendly. Use first name occasionally. React naturally.';

  const missingFieldsByForm = {};
  for (const [formType, gr] of Object.entries(guardrailResults)) {
    const missing = (gr.issues || []).filter(i => i.type === 'missing_required').map(i => i.label);
    if (missing.length > 0) missingFieldsByForm[formType] = missing;
  }

  const formContext = Object.entries(formUpdates).map(([type, data]) => {
    if (!data) return '';
    const filledFields = Object.entries(data.fields || {}).filter(([_, v]) => v?.value).length;
    const totalFields = Object.keys(data.fields || {}).length;
    const guardrail = guardrailResults[type];
    const missingList = missingFieldsByForm[type];
    let out = `Form: ${type} (${filledFields}/${totalFields} filled)`;
    if (missingList && missingList.length > 0) {
      out += `\n  MISSING - ask user for: ${missingList.join(', ')}`;
    }
    if (guardrail?.summary?.errors > 0) out += ` [${guardrail.summary.errors} required fields missing]`;
    return out;
  }).filter(Boolean).join('\n');

  const recentMessages = (summaryResult.keepMessages?.length ? summaryResult.keepMessages : messages).slice(-10);

  let systemPrompt = `You are ParaHelper, a voice-first AI companion exclusively for paramedics. You are ${paramedicProfile.first_name}'s shift buddy.

ACCEPT ANY MESSAGE: The user can say anything - chitchat, "need help", questions, form requests, admin tasks, or just venting. Always respond naturally and helpfully. Never refuse or say you cannot help. For general help requests, offer to assist with forms, protocols, directions, or just listen.

PERSONALITY: You sound like a smart human friend who happens to know everything about being a paramedic. Not a robot. Not a form. A real partner.
- Use "${paramedicProfile.first_name}" occasionally (not every message)
- Keep it natural and conversational
- Never say "I am an AI" or "I cannot"
- Never use bullet points in spoken responses
- Never ask for info already provided
- React to emotions naturally
- Confirm before sending anything
- Say "Done! Sent it off" not "Form submission successful"

${modeInstruction}

CURRENT CONTEXT:
- Paramedic: ${paramedicProfile.first_name} ${paramedicProfile.last_name} (${paramedicProfile.role})
- Station: ${paramedicProfile.station}, Unit: ${paramedicProfile.unit}
- Shift Phase: ${shiftPhase}
- Crisis Mode: ${isCrisis ? 'YES' : 'No'}
${isPediatric ? '- PEDIATRIC MODE ACTIVE: Use weight-based calculations, pediatric references, extra safety\n' : ''}
${formContext ? `\nACTIVE FORMS:\n${formContext}\n` : ''}
${knowledgeResponse ? `\nKNOWLEDGE CONTEXT:\n${knowledgeResponse.answer}\n` : ''}
${adminResponse ? `\nADMIN TASK RESULT (${adminResponse.needsMoreInfo ? 'ASK THESE QUESTIONS - do NOT say you sent it yet' : 'SENT'}):\n${adminResponse.response}\n` : ''}
${summaryResult.summary ? `\nCONVERSATION SUMMARY:\n${summaryResult.summary}\n` : ''}

EMOTIONAL STATE: ${emotionalState}
${emotionalState === 'tough' ? 'ACKNOWLEDGE THE EMOTION FIRST before any paperwork. "That sounds like a tough one. Take a breath - I have got the easy parts filled already."' : ''}
${emotionalState === 'positive' ? 'Celebrate! "That is amazing - great work out there!"' : ''}

FORM HANDLING - CRITICAL:
- When forms have MISSING fields listed above, you MUST ask the user for those specific fields
- Ask naturally, 1-3 fields at a time: "Just need the date and time it happened" or "How old was the child and was it Patient, Family, or Bystander?"
- NEVER skip asking for missing required fields - the form cannot be sent until they are filled
- After user answers, the Extraction Agent will update the form - then ask for any remaining missing fields
- Be specific: "What time did it happen?" not "Can you give me more details?"
- For Teddy Bear: ask recipient_age, recipient_type, recipient_gender, date_time
- For Occurrence: ask date, time, occurrence_type, location, city, description, action_taken

RULES:
- For medical dosages always add "confirm against your protocols"
- Never diagnose - only pattern detection
- If multiple forms detected, announce both
- For status/shifts - query and display, no email needed
${mapDestination ? `\nDIRECTIONS: User asked for route to "${mapDestination}". Include in your response that you're opening the map with the route - e.g. "Opening the map with directions to ${mapDestination}."` : ''}
${hospitalRecommendation?.recommended ? `
HOSPITAL RECOMMENDATION (use this - it factors in real-time traffic):
- FASTEST: ${hospitalRecommendation.recommended.place_name} — ${hospitalRecommendation.recommended.durationMinutes} min, ${hospitalRecommendation.recommended.distanceKm} km
- Alternatives: ${(hospitalRecommendation.alternatives || []).map(a => `${a.place_name} (${a.durationMinutes} min)`).join('; ')}
- Scene: ${hospitalRecommendation.sceneName}
Tell the user the recommended hospital is fastest given current traffic. Open the map with the route.` : ''}`;

  const conversationMessages = [
    { role: 'system', content: systemPrompt }
  ];

  for (const msg of recentMessages) {
    conversationMessages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    });
  }

  conversationMessages.push({ role: 'user', content: cleanedMessage });

  let aiResponse;
  try {
    aiResponse = await chatCompletion(conversationMessages, 'gemini-2.5-flash', {
      max_tokens: 1024,
      temperature: 0.8
    });
    if (!aiResponse || typeof aiResponse !== 'string') {
      aiResponse = `Hey ${paramedicProfile.first_name}, I'm here. What do you need?`;
    }
  } catch (e) {
    console.error('[ConversationAgent] Chat completion failed:', e.message);
    aiResponse = `Hey ${paramedicProfile.first_name}, something's glitching on my end. Can you try that again? I'm here to help with whatever you need.`;
  }

  try {
    await saveMessage({
    message_id: `MSG-${uuidv4().substring(0, 8)}`,
    session_id: sessionId,
    paramedic_id: paramedicProfile.paramedic_id,
    role: 'assistant',
    content: aiResponse,
    timestamp: new Date(),
    was_voice: false,
    raw_transcript: null,
    cleaned_transcript: null,
    extracted_data: Object.keys(formUpdates).length > 0 ? formUpdates : null
  });
  } catch (e) {
    console.error('[ConversationAgent] Save message failed:', e.message);
  }

  try {
    await updateConversation(sessionId, {
    forms_triggered: Object.keys(formUpdates),
    forms: formUpdates,
    status: 'active',
    last_message_at: new Date()
  });
  } catch (e) {
    console.error('[ConversationAgent] Update conversation failed:', e.message);
  }

  const alerts = [];
  if (isCrisis) alerts.push({ type: 'crisis', message: 'Crisis mode active' });
  if (isPediatric) alerts.push({ type: 'pediatric', message: 'Pediatric mode active' });
  for (const [formType, gr] of Object.entries(guardrailResults)) {
    const issues = gr?.issues || [];
    if (issues.length > 0) {
      alerts.push(...issues.map(i => ({ type: i.type, formType, ...i })));
    }
  }

  return {
    response: aiResponse,
    formUpdates: formUpdates,
    guardrailResults: guardrailResults,
    mapDestination: mapDestination || undefined,
    alerts: alerts,
    phase: shiftPhase,
    mode: mode,
    isPediatric: isPediatric,
    detectedForms: detectedForms,
    conversationSummary: summaryResult.summary,
    adminTaskPending: adminResponse?.cancelled ? null : (adminResponse?.needsMoreInfo ? taskToHandle : (adminResponse?.success ? null : pendingAdminTask))
  };
}

async function generateLoginBriefing(paramedicProfile, statusData, shiftData) {
  console.log(`[ConversationAgent] Generating login briefing for ${paramedicProfile.first_name}...`);

  const statusIssues = [];
  if (statusData) {
    if (statusData.acr_completion === 'BAD') statusIssues.push(`${statusData.acr_unfinished} unfinished ACRs`);
    if (statusData.vaccination === 'BAD') statusIssues.push('vaccination overdue');
    if (statusData.driver_license === 'BAD') statusIssues.push('driver license issue');
    if (statusData.overtime === 'BAD') statusIssues.push(`${statusData.overtime_count} overtime claims pending`);
    if (statusData.missed_meals === 'BAD') statusIssues.push(`${statusData.missed_meals_count} missed meal claims`);
    if (statusData.education === 'BAD') statusIssues.push(`${statusData.cme_outstanding} CME outstanding`);
  }

  const partnerInfo = shiftData?.partner_id || 'TBD';

  const briefing = await chatCompletion([
    {
      role: 'system',
      content: `You are ParaHelper greeting a paramedic at the start of their shift. Generate a warm, personal morning briefing.

Paramedic: ${paramedicProfile.first_name} ${paramedicProfile.last_name}
Role: ${paramedicProfile.role}
Station: ${paramedicProfile.station}
Unit: ${paramedicProfile.unit}
Partner: ${partnerInfo}
Status issues: ${statusIssues.length > 0 ? statusIssues.join(', ') : 'All clear'}

Include:
1. Warm greeting using first name
2. Partner and station info
3. Weather heads-up (mention icy roads or general conditions)
4. Any compliance issues flagged naturally
5. Ask if ready to start

Keep it natural and conversational - like a friend catching you up. 3-5 sentences max.`
    },
    { role: 'user', content: 'Generate the login briefing.' }
  ], 'gemini-2.5-flash', { max_tokens: 256, temperature: 0.8 });

  return briefing;
}

module.exports = { processMessage, generateLoginBriefing, detectCrisisMode };
