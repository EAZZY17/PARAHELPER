const express = require('express');
const jwt = require('jsonwebtoken');
const { getParamedic, getParamedicById } = require('../utils/mongodb');
const { getParamedicStatus, getParamedicShifts } = require('../agents/knowledgeAgent');
const { generateLoginBriefing } = require('../agents/conversationAgent');
const { saveConversation } = require('../utils/mongodb');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { badge_number, pin } = req.body;
    console.log(`[Auth] Login attempt: ${badge_number}`);

    if (!badge_number || !pin) {
      return res.status(400).json({ error: 'Badge number and PIN are required' });
    }

    const paramedic = await getParamedic(badge_number);
    if (!paramedic) {
      return res.status(401).json({ error: 'Invalid badge number' });
    }

    if (String(paramedic.pin) !== String(pin)) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    const token = jwt.sign(
      {
        paramedic_id: paramedic.paramedic_id,
        badge_number: paramedic.badge_number,
        role: paramedic.role,
        first_name: paramedic.first_name,
        last_name: paramedic.last_name,
        station: paramedic.station,
        unit: paramedic.unit
      },
      process.env.JWT_SECRET || 'parahelper_secret_key_2026',
      { expiresIn: '12h' }
    );

    const sessionId = `SES-${uuidv4().substring(0, 8)}`;
    await saveConversation({
      session_id: sessionId,
      paramedic_id: paramedic.paramedic_id,
      started_at: new Date(),
      ended_at: null,
      summary: '',
      status: 'active',
      forms_triggered: [],
      shift_date: new Date().toISOString().split('T')[0]
    });

    let statusData = null;
    let shiftData = null;
    let briefing = '';

    try {
      statusData = await getParamedicStatus(paramedic.paramedic_id);
      const shifts = await getParamedicShifts(paramedic.paramedic_id);
      shiftData = shifts && shifts.length > 0 ? shifts[0] : null;
      briefing = await generateLoginBriefing(paramedic, statusData, shiftData);
    } catch (err) {
      console.error('[Auth] Briefing generation error:', err.message);
      briefing = `Hey ${paramedic.first_name}! Welcome to your shift at ${paramedic.station}, Unit ${paramedic.unit}. Let me know when you're ready to get started.`;
    }

    const profile = {
      paramedic_id: paramedic.paramedic_id,
      first_name: paramedic.first_name,
      last_name: paramedic.last_name,
      badge_number: paramedic.badge_number,
      role: paramedic.role,
      station: paramedic.station,
      unit: paramedic.unit,
      email: paramedic.email,
      shift_status: paramedic.shift_status
    };

    console.log(`[Auth] Login success: ${paramedic.first_name} ${paramedic.last_name} (${paramedic.role})`);

    res.json({
      token,
      profile,
      session_id: sessionId,
      briefing,
      status: statusData,
      shift: shiftData
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

module.exports = router;
