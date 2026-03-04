const express = require('express');
const authMiddleware = require('../middleware/auth');
const { processMessage } = require('../agents/conversationAgent');
const { textToSpeech } = require('../utils/elevenlabs');
const { getMessages, getConversation, getLatestConversation, updateConversation, saveConversation } = require('../utils/mongodb');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const sessionState = {};

// Start a new session (no auth required)
router.post('/session/start', authMiddleware, async (req, res) => {
  try {
    const sessionId = `SES-${uuidv4().substring(0, 8)}`;
    await saveConversation({
      session_id: sessionId,
      paramedic_id: req.paramedic.paramedic_id,
      started_at: new Date(),
      ended_at: null,
      summary: '',
      status: 'active',
      forms_triggered: [],
      shift_date: new Date().toISOString().split('T')[0]
    });
    res.json({ session_id: sessionId });
  } catch (error) {
    console.error('[Chat] Session start error:', error);
    res.status(500).json({ error: 'Could not start session' });
  }
});

router.post('/message', authMiddleware, async (req, res) => {
  try {
    const { message, session_id, was_voice = false } = req.body;
    const paramedicId = req.paramedic.paramedic_id;

    if (!message || !session_id) {
      return res.status(400).json({ error: 'Message and session_id are required' });
    }

    console.log(`[Chat] Message from ${req.paramedic.first_name}: "${message.substring(0, 50)}..."`);

    if (!sessionState[session_id]) {
      sessionState[session_id] = {
        forms: {},
        phase: 'between_calls',
        summary: '',
        callCount: 0,
        highAcuityCount: 0,
        lastBreak: Date.now(),
        shiftStart: Date.now(),
        pendingAdminTask: null
      };
      const existing = await getConversation(session_id);
      if (!existing) {
        await saveConversation({
          session_id,
          paramedic_id: paramedicId,
          started_at: new Date(),
          ended_at: null,
          summary: '',
          status: 'active',
          forms_triggered: [],
          shift_date: new Date().toISOString().split('T')[0]
        });
      }
    }

    const state = sessionState[session_id];

    const phaseTriggers = {
      before_call: ['dispatch', 'incoming', 'new call', 'call coming', 'responding'],
      during_call: ['on scene', 'arrived', 'patient', 'vitals', 'treating', 'transporting'],
      after_call: ['handoff', 'hospital', 'at hospital', 'transferred', 'sbar', 'er nurse'],
      between_calls: ['back at station', 'available', 'in service', 'clear', 'downtime']
    };

    for (const [phase, triggers] of Object.entries(phaseTriggers)) {
      if (triggers.some(t => message.toLowerCase().includes(t))) {
        state.phase = phase;
        break;
      }
    }

    const result = await processMessage({
      message,
      sessionId: session_id,
      paramedicProfile: {
        paramedic_id: paramedicId,
        first_name: req.paramedic.first_name,
        last_name: req.paramedic.last_name,
        badge_number: req.paramedic.badge_number,
        role: req.paramedic.role,
        station: req.paramedic.station,
        unit: req.paramedic.unit
      },
      wasVoice: was_voice,
      currentForms: state.forms,
      conversationSummary: state.summary,
      shiftPhase: state.phase,
      pendingAdminTask: state.pendingAdminTask || null
    });

    state.forms = result.formUpdates || state.forms;
    if (Object.keys(state.forms).length > 0) {
      updateConversation(session_id, { forms: state.forms }).catch(e => console.error('[Chat] Persist forms failed:', e.message));
    }
    state.summary = result.conversationSummary || state.summary;
    if (result.adminTaskPending !== undefined) {
      state.pendingAdminTask = result.adminTaskPending;
    }

    if (result.mode === 'stress') {
      state.highAcuityCount++;
    }

    let audioUrl = null;
    if (was_voice) {
      try {
        audioUrl = await textToSpeech(result.response);
      } catch (e) {
        console.error('[Chat] Text-to-speech failed:', e.message);
      }
    }

    let fatigueAlert = null;
    const hoursActive = (Date.now() - state.shiftStart) / (1000 * 60 * 60);
    if (state.highAcuityCount >= 4 && hoursActive <= 2) {
      fatigueAlert = `You've handled ${state.highAcuityCount} high acuity calls in ${Math.round(hoursActive * 10) / 10} hours. Consider a hydration check.`;
    }

    res.json({
      response: result.response,
      map_destination: result.mapDestination,
      audio_url: audioUrl,
      form_update: result.formUpdates,
      guardrail_results: result.guardrailResults,
      alerts: [...(result.alerts || []), ...(fatigueAlert ? [{ type: 'fatigue', message: fatigueAlert }] : [])],
      phase: state.phase,
      mode: result.mode,
      is_pediatric: result.isPediatric,
      detected_forms: result.detectedForms,
      session_state: {
        callCount: state.callCount,
        highAcuityCount: state.highAcuityCount,
        phase: state.phase
      }
    });
  } catch (error) {
    console.error('[Chat] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Give me a sec and try again.' });
  }
});

router.get('/session/:session_id', authMiddleware, async (req, res) => {
  try {
    const { session_id } = req.params;
    const conversation = await getConversation(session_id);
    const messages = await getMessages(session_id);

    res.json({
      conversation,
      messages,
      state: sessionState[session_id] || {}
    });
  } catch (error) {
    console.error('[Chat] Session fetch error:', error);
    res.status(500).json({ error: 'Could not load session' });
  }
});

router.get('/latest', authMiddleware, async (req, res) => {
  try {
    const paramedicId = req.paramedic.paramedic_id;
    const conversation = await getLatestConversation(paramedicId);
    if (!conversation) {
      return res.json({ session_id: null, messages: [], conversation: null });
    }
    const messages = await getMessages(conversation.session_id);
    const memState = sessionState[conversation.session_id] || {};
    const persistedForms = conversation.forms && Object.keys(conversation.forms).length > 0 ? conversation.forms : null;
    const state = {
      ...memState,
      forms: memState.forms && Object.keys(memState.forms).length > 0 ? memState.forms : (persistedForms || memState.forms || {})
    };
    res.json({
      session_id: conversation.session_id,
      conversation,
      messages,
      state
    });
  } catch (error) {
    console.error('[Chat] Latest fetch error:', error);
    res.status(500).json({ error: 'Could not load chat' });
  }
});

module.exports = router;
