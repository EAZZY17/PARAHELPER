const { chatCompletion } = require('../utils/embeddings');
const { getStatusReport } = require('../utils/mongodb');
const { sendFormEmail } = require('../utils/email');

const ADMIN_TASKS = {
  uniform_order: {
    keywords: ['uniform', 'order uniform', 'uniform credits', 'new uniform'],
    requiresCheck: 'uniform_credits',
    questions: ['What size do you need? (S, M, L, XL)', 'What items? (shirt, pants, jacket, boots, etc.)']
  },
  vacation_request: {
    keywords: ['vacation', 'time off', 'day off', 'vacation request', 'book off'],
    requiresCheck: null,
    questions: ['What dates do you need off?', 'Any notes for your supervisor?']
  },
  overtime_claim: {
    keywords: ['overtime', 'OT claim', 'extra hours', 'overtime request'],
    requiresCheck: null,
    questions: ['What date and how many hours?', 'Which call or shift?']
  },
  missed_meal: {
    keywords: ['missed meal', 'no lunch', 'skipped meal', 'meal break', 'didn\'t eat'],
    requiresCheck: null,
    questions: ['What date did you miss your meal?', 'Which shift or call?']
  },
  shift_swap: {
    keywords: ['swap shift', 'trade shift', 'switch shift', 'shift swap'],
    requiresCheck: null,
    questions: ['What date do you want to swap?', 'Who would you swap with?']
  }
};

function detectAdminTask(message) {
  const lower = message.toLowerCase();
  for (const [taskType, config] of Object.entries(ADMIN_TASKS)) {
    for (const keyword of config.keywords) {
      if (lower.includes(keyword)) return taskType;
    }
  }
  return null;
}

const SEND_TRIGGERS = ['send it', 'go ahead', 'that\'s it', 'that\'s all', 'submit', 'please send', 'send the request', 'yes send', 'yep send', 'do it'];
const CANCEL_TRIGGERS = ['never mind', 'cancel', 'forget it', 'forget that', 'nvm', 'don\'t send', 'scratch that'];

function userWantsToCancel(message) {
  const lower = message.toLowerCase().trim();
  return CANCEL_TRIGGERS.some(t => lower.includes(t));
}

function userWantsToSend(message) {
  const lower = message.toLowerCase().trim();
  return SEND_TRIGGERS.some(t => lower.includes(t) || lower === 'yes' || lower === 'yep' || lower === 'sure');
}

async function checkReadyToSend(taskType, conversationContext) {
  try {
    const config = ADMIN_TASKS[taskType];
    const questions = config?.questions || [];
    const prompt = `Given this paramedic-admin conversation, is there enough detail to send a professional ${taskType.replace(/_/g, ' ')} request?
Conversation:
${conversationContext}

Return JSON only: {"ready": true/false, "reason": "brief reason"}
- ready: true if we have the key details (${questions.join('; ')})
- ready: false if we're missing important info`;
    const raw = await chatCompletion([
      { role: 'system', content: 'Return only valid JSON.' },
      { role: 'user', content: prompt }
    ], 'gemini-3.1-flash-lite-preview', { max_tokens: 64, temperature: 0 });
    const parsed = JSON.parse((raw || '{}').replace(/```json?\s*|\s*```/g, '').trim());
    return parsed.ready === true;
  } catch (e) {
    return false;
  }
}

async function handleAdminTask(taskType, message, paramedicProfile, conversationContext = '') {
  console.log(`[AdminAgent] Handling admin task: ${taskType}`);

  const fullContext = conversationContext ? `${conversationContext}\nuser: ${message}` : `user: ${message}`;

  try {
    if (taskType === 'uniform_order') {
      let credits = 0;
      try {
        const status = await getStatusReport(paramedicProfile.paramedic_id);
        credits = (status && typeof status.uniform_credits === 'number') ? status.uniform_credits : 0;
      } catch (err) {
        console.error('[AdminAgent] Status fetch failed:', err.message);
      }
      if (credits <= 0) {
        return {
          success: false,
          response: `You currently have ${credits} uniform credits available. You'll need to request more credits from your supervisor before placing an order.`
        };
      }
    }

    if (userWantsToCancel(message)) {
      return { success: false, cancelled: true, response: 'No problem, cancelled. What else can I help with?' };
    }

    const config = ADMIN_TASKS[taskType];
    const forceSend = userWantsToSend(message);
    const readyToSend = forceSend || await checkReadyToSend(taskType, fullContext);

    if (!readyToSend) {
      const questions = config?.questions || ['What details should I include?'];
      return {
        success: false,
        needsMoreInfo: true,
        response: `Acknowledge their request warmly. Then ask 1-2 of these naturally: ${questions.join(' | ')}. Say "Just say go ahead when you're ready to send."`,
        questions
      };
    }

    const emailBodyRaw = await chatCompletion([
      {
        role: 'system',
        content: `Generate a professional email for an admin task. Use ALL details from the conversation. Keep it brief and formal.
Paramedic: ${paramedicProfile.first_name} ${paramedicProfile.last_name}
Badge: ${paramedicProfile.badge_number}
Station: ${paramedicProfile.station}
Unit: ${paramedicProfile.unit}
Task type: ${taskType.replace(/_/g, ' ')}

Conversation:
${fullContext}

Return ONLY the email body text. Include size, items, dates - whatever the user provided.`
      },
      { role: 'user', content: 'Generate the email from the conversation above.' }
    ], 'gemini-3.1-flash-lite-preview', { max_tokens: 256 });

    const emailBody = (typeof emailBodyRaw === 'string' && emailBodyRaw.trim()) ? emailBodyRaw : `Request from ${paramedicProfile.first_name} ${paramedicProfile.last_name}:\n${fullContext}`;

    const subjects = {
      uniform_order: 'Uniform Order Request',
      vacation_request: 'Vacation Request',
      overtime_claim: 'Overtime Claim',
      missed_meal: 'Missed Meal Submission',
      shift_swap: 'Shift Swap Request'
    };

    const emailResult = await sendFormEmail({
      to: 'team01@effectiveai.net',
      subject: `[ParaHelper] ${subjects[taskType]} - ${paramedicProfile.first_name} ${paramedicProfile.last_name} (${paramedicProfile.badge_number})`,
      body: emailBody
    });

    console.log(`[AdminAgent] ${taskType} email sent`);
    return {
      success: true,
      response: `Done! I've sent your ${subjects[taskType].replace(/_/g, ' ').toLowerCase()} to your supervisor. You'll get confirmation once it's reviewed.`,
      emailResult
    };
  } catch (error) {
    console.error(`[AdminAgent] Error handling ${taskType}:`, error.message);
    return {
      success: false,
      response: `I ran into an issue sending that request. Let me try again in a moment.`
    };
  }
}

module.exports = { detectAdminTask, handleAdminTask };
