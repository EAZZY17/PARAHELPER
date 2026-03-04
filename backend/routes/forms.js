const express = require('express');
const authMiddleware = require('../middleware/auth');
const { runGuardrailCheck } = require('../agents/guardrailAgent');
const { exportOccurrenceReport, exportTeddyBear, exportStatusReport } = require('../agents/exportAgent');
const { saveOccurrenceReport, saveTeddyBearTracking, getOccurrenceReports, getTeddyBearRecords, getStatusReport, getShifts } = require('../utils/mongodb');
const { getParamedicById } = require('../utils/mongodb');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { form_type, form_data, session_id } = req.body;
    const paramedicId = req.paramedic.paramedic_id;

    console.log(`[Forms] Submitting ${form_type} from ${req.paramedic.first_name}`);

    const guardrailResult = await runGuardrailCheck(form_type, form_data);
    if (!guardrailResult.passed) {
      return res.status(400).json({
        error: 'Form has issues that need to be resolved',
        guardrail: guardrailResult
      });
    }

    const paramedic = (await getParamedicById(paramedicId)) || req.paramedic;
    let exportResult;

    if (form_type === 'occurrence_report') {
      const report = {
        occurrence_id: `OCC-${uuidv4().substring(0, 8)}`,
        session_id: session_id,
        paramedic_id: paramedicId,
        ...flattenFormFields(form_data.fields),
        created_at: new Date(),
        sent_at: null,
        status: 'pending'
      };
      await saveOccurrenceReport(report);
      exportResult = await exportOccurrenceReport(form_data, paramedic);
    } else if (form_type === 'teddy_bear') {
      const tracking = {
        tracking_id: `TBT-${uuidv4().substring(0, 8)}`,
        session_id: session_id,
        paramedic_id: paramedicId,
        ...flattenFormFields(form_data.fields),
        created_at: new Date(),
        status: 'pending'
      };
      await saveTeddyBearTracking(tracking);
      exportResult = await exportTeddyBear(form_data, paramedic);
    } else if (form_type === 'status_report') {
      exportResult = await exportStatusReport(form_data, paramedic);
    } else {
      return res.status(400).json({ error: 'Unknown form type' });
    }

    res.json({
      success: true,
      form_type,
      export_result: exportResult,
      message: `${form_type.replace(/_/g, ' ')} submitted and sent!`
    });
  } catch (error) {
    console.error('[Forms] Submit error:', error);
    res.status(500).json({ error: 'Form submission failed. Let me try again.' });
  }
});

router.post('/guardrail-check', authMiddleware, async (req, res) => {
  try {
    const { form_type, form_data } = req.body;
    const result = await runGuardrailCheck(form_type, form_data);
    res.json(result);
  } catch (error) {
    console.error('[Forms] Guardrail check error:', error);
    res.status(500).json({ error: 'Guardrail check failed' });
  }
});

router.get('/occurrence-reports', authMiddleware, async (req, res) => {
  try {
    const reports = await getOccurrenceReports(req.paramedic.paramedic_id);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch reports' });
  }
});

router.get('/teddy-bears', authMiddleware, async (req, res) => {
  try {
    const records = await getTeddyBearRecords(req.paramedic.paramedic_id);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch records' });
  }
});

function flattenFormFields(fields) {
  const flat = {};
  for (const [key, val] of Object.entries(fields || {})) {
    flat[key] = val?.value || null;
  }
  return flat;
}

module.exports = router;
