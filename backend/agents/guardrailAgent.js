const { fastCompletion } = require('../utils/embeddings');
const { FORM_SCHEMAS } = require('./extractionAgent');

const DANGEROUS_DOSAGES = {
  'epinephrine': { max_adult: 1, max_pediatric: 0.3, unit: 'mg' },
  'atropine': { max_adult: 3, max_pediatric: 1, unit: 'mg' },
  'nitroglycerin': { max_adult: 1.2, unit: 'mg' },
  'naloxone': { max_adult: 10, max_pediatric: 2, unit: 'mg' },
  'dextrose': { max_adult: 25, unit: 'g' },
  'aspirin': { max_adult: 325, unit: 'mg' },
  'amiodarone': { max_adult: 450, unit: 'mg' }
};

const CRITICAL_VITALS = {
  heart_rate: { low: 40, high: 180 },
  systolic_bp: { low: 70, high: 220 },
  respiratory_rate: { low: 8, high: 40 },
  spo2: { low: 85, high: 100 },
  gcs: { low: 3, high: 15 },
  temperature: { low: 34, high: 41 },
  blood_glucose: { low: 2.5, high: 25 }
};

function checkRequiredFields(formType, formData) {
  const schema = FORM_SCHEMAS[formType];
  if (!schema) return [];
  
  const issues = [];
  for (const [field, config] of Object.entries(schema)) {
    if (config.required) {
      const fieldData = formData.fields?.[field];
      if (!fieldData || !fieldData.value || fieldData.value === null) {
        issues.push({
          type: 'missing_required',
          field: field,
          label: config.label,
          severity: 'error',
          message: `${config.label} is required but missing`
        });
      }
    }
  }
  return issues;
}

function checkContradictions(formData, conversationHistory = '') {
  const issues = [];
  const fields = formData.fields || {};

  if (fields.injuries_reported?.value === 'no' || fields.injuries_reported?.value === false) {
    const desc = (fields.description?.value || '').toLowerCase();
    const injuryWords = ['hurt', 'injured', 'pain', 'bleeding', 'broken', 'fracture', 'wound'];
    if (injuryWords.some(w => desc.includes(w))) {
      issues.push({
        type: 'contradiction',
        field: 'injuries_reported',
        severity: 'warning',
        message: 'No injuries reported but description mentions injury-related terms'
      });
    }
  }

  if (fields.recipient_type?.value === 'Bystander' && fields.recipient_age?.value) {
    const age = parseInt(fields.recipient_age.value);
    if (age < 3) {
      issues.push({
        type: 'contradiction',
        field: 'recipient_age',
        severity: 'warning',
        message: `Bystander age ${age} seems unusual - please verify`
      });
    }
  }

  return issues;
}

function checkMedicalSafety(message) {
  const issues = [];
  const lower = message.toLowerCase();

  for (const [drug, limits] of Object.entries(DANGEROUS_DOSAGES)) {
    const regex = new RegExp(`(\\d+\\.?\\d*)\\s*(?:${limits.unit})?\\s*(?:of\\s+)?${drug}`, 'i');
    const match = lower.match(regex);
    if (match) {
      const dose = parseFloat(match[1]);
      if (dose > limits.max_adult) {
        issues.push({
          type: 'medical_safety',
          severity: 'critical',
          message: `CRITICAL: ${dose}${limits.unit} ${drug} exceeds maximum adult dose of ${limits.max_adult}${limits.unit}`
        });
      }
    }
  }

  return issues;
}

async function runGuardrailCheck(formType, formData, message = '', conversationHistory = '') {
  console.log('[GuardrailAgent] Running quality checks...');

  const requiredIssues = checkRequiredFields(formType, formData);
  const contradictions = checkContradictions(formData, conversationHistory);
  const safetyIssues = checkMedicalSafety(message);

  const allIssues = [...requiredIssues, ...contradictions, ...safetyIssues];

  const hasCritical = allIssues.some(i => i.severity === 'critical');
  const hasErrors = allIssues.some(i => i.severity === 'error');

  const result = {
    passed: !hasCritical && !hasErrors,
    issues: allIssues,
    summary: {
      total: allIssues.length,
      critical: allIssues.filter(i => i.severity === 'critical').length,
      errors: allIssues.filter(i => i.severity === 'error').length,
      warnings: allIssues.filter(i => i.severity === 'warning').length
    }
  };

  console.log(`[GuardrailAgent] Check complete: ${result.passed ? 'PASSED' : 'BLOCKED'} (${allIssues.length} issues)`);
  return result;
}

function checkVitals(vitals) {
  const alerts = [];
  for (const [vital, value] of Object.entries(vitals)) {
    const range = CRITICAL_VITALS[vital];
    if (range) {
      const num = parseFloat(value);
      if (num < range.low) {
        alerts.push({ vital, value: num, message: `${vital} critically LOW at ${num}` });
      } else if (num > range.high) {
        alerts.push({ vital, value: num, message: `${vital} critically HIGH at ${num}` });
      }
    }
  }
  return alerts;
}

module.exports = { runGuardrailCheck, checkRequiredFields, checkContradictions, checkMedicalSafety, checkVitals };
