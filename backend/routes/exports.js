const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getParamedicById, getStatusReport, getShifts } = require('../utils/mongodb');
const { getCurrentWeather } = require('../utils/weather');
const { generateShiftSummary } = require('../agents/summarizerAgent');
const { getMessages, getConversation } = require('../utils/mongodb');

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
