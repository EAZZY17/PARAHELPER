const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getParamedicById, getStatusReport, getShifts } = require('../utils/mongodb');
const { getCurrentWeather } = require('../utils/weather');
const { generateShiftSummary } = require('../agents/summarizerAgent');
const { getMessages, getConversation } = require('../utils/mongodb');
const { sendFormEmail } = require('../utils/email');

const router = express.Router();

router.get('/paramedic/:paramedic_id/status', authMiddleware, async (req, res) => {
  try {
    const { paramedic_id } = req.params;
    const status = await getStatusReport(paramedic_id);
    if (!status) {
      return res.json({
        paramedic_id,
        acr_completion: 'GOOD', acr_unfinished: 0,
        vaccination: 'GOOD', vaccination_issues: 0,
        driver_license: 'GOOD', education: 'GOOD', cme_outstanding: 0,
        uniform_status: 'GOOD', uniform_credits: 5,
        criminal_record: 'GOOD', acp_cert: 'GOOD',
        vacation: 'GOOD', missed_meals: 'GOOD', missed_meals_count: 0,
        overtime: 'GOOD', overtime_count: 0
      });
    }
    res.json(status);
  } catch (error) {
    console.error('[Exports] Status error:', error);
    res.status(500).json({ error: 'Could not fetch status report' });
  }
});

router.get('/paramedic/:paramedic_id/shifts', authMiddleware, async (req, res) => {
  try {
    const { paramedic_id } = req.params;
    const shifts = await getShifts(paramedic_id);
    res.json(shifts || []);
  } catch (error) {
    console.error('[Exports] Shifts error:', error);
    res.status(500).json({ error: 'Could not fetch shifts' });
  }
});

router.post('/test-email', authMiddleware, async (req, res) => {
  try {
    const to = process.env.FORM_RECIPIENT_EMAIL || 'Hillsidesplc@gmail.com';
    const result = await sendFormEmail({
      to,
      subject: '[ParaHelper] Email Test - Form Delivery Verification',
      body: `This is a test email from ParaHelper.\n\nIf you receive this, form delivery to ${to} is working.\n\nSent at: ${new Date().toISOString()}`
    });
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error, hint: 'Check SENDER_EMAIL is verified in SendGrid, or use GMAIL_USER + GMAIL_APP_PASSWORD' });
    }
    res.json({ success: true, message: `Test email sent to ${to}. Check inbox (and spam).` });
  } catch (error) {
    console.error('[TestEmail] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/weather', authMiddleware, async (req, res) => {
  try {
    const station = req.paramedic?.station || req.query.station;
    const weather = await getCurrentWeather(station);
    if (!weather) return res.status(503).json({ error: 'Weather unavailable' });
    res.json({
      temp: weather.temp,
      feelsLike: weather.feelsLike,
      description: weather.description,
      conditions: weather.conditions,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Weather] Route error:', error);
    res.status(500).json({ error: 'Could not fetch weather' });
  }
});

router.post('/shift-summary', authMiddleware, async (req, res) => {
  try {
    const { session_id } = req.body;
    const paramedicId = req.paramedic.paramedic_id;
    const paramedic = (await getParamedicById(paramedicId)) || req.paramedic;
    const messages = await getMessages(session_id);
    const conversation = await getConversation(session_id);

    const summary = await generateShiftSummary(
      { messages: messages.length, conversation, forms: conversation?.forms_triggered || [] },
      paramedic
    );

    res.json({ summary, generated_at: new Date() });
  } catch (error) {
    console.error('[Exports] Shift summary error:', error);
    res.status(500).json({ error: 'Could not generate shift summary' });
  }
});

module.exports = router;
