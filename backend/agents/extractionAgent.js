const { fastCompletion } = require('../utils/embeddings');

// Quick pattern extraction for common fields - runs before LLM for reliability
function extractPatterns(text, formType) {
  if (!text) return {};
  const lower = text.toLowerCase();
  const out = {};

  if (formType === 'occurrence_report') {
    // Date: "March 3rd 2026", "March 3, 2026", "3/3/2026", "today"
    const dateMatch = text.match(/(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})/i)
      || text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
      || text.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      const months = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
      if (dateMatch[0].match(/^\d{4}-/)) {
        out.date = { value: dateMatch[0], confidence: 'high' };
      } else if (dateMatch[0].match(/\d+\/\d+\/\d+/)) {
        const [, m, d, y] = dateMatch;
        out.date = { value: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`, confidence: 'high' };
      } else {
        const m = months[dateMatch[0].split(/\s/)[0].toLowerCase()];
        const d = dateMatch[1].padStart(2, '0');
        const y = dateMatch[2];
        out.date = { value: `${y}-${String(m).padStart(2, '0')}-${d}`, confidence: 'high' };
      }
    } else if (lower.includes('today')) {
      const d = new Date();
      out.date = { value: d.toISOString().slice(0, 10), confidence: 'medium' };
    }

    // Time: "2pm", "2 pm", "14:00", "at 2"
    const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i) || text.match(/(?:at|around)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const merid = (timeMatch[3] || '').toLowerCase();
      if (merid === 'pm' && h < 12) h += 12;
      if (merid === 'am' && h === 12) h = 0;
      out.time = { value: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, confidence: 'high' };
    }

    // Location: "at the Main Street station", "Main Street station", "happened at X"
    const locMatch = text.match(/(?:happened at|occurred at|at (?:the )?)([^.?!]+?)(?:\.|$)/i)
      || text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+station(?:\s+lot)?)/i)
      || text.match(/(?:in|at)\s+(?:the\s+)?([^.?!,]+?)(?:\s+lot|\s+station|\.|,|$)/i);
    if (locMatch) {
      const loc = locMatch[1].replace(/^(?:the|a|an)\s+/i, '').trim();
      if (loc.length > 2 && loc.length < 80) out.location = { value: loc, confidence: 'high' };
    }

    // Severity
    if (/\bminor\b/.test(lower)) out.severity = { value: 'low', confidence: 'high' };
    else if (/\bmoderate\b/.test(lower)) out.severity = { value: 'medium', confidence: 'high' };
    else if (/\bsevere\b/.test(lower)) out.severity = { value: 'high', confidence: 'high' };

    // injuries_reported, equipment_damage
    if (/\bno injuries\b|\bno one (?:was )?hurt\b/i.test(text)) out.injuries_reported = { value: 'no', confidence: 'high' };
    if (/\b(?:door|vehicle|equipment)\s+damage\b|damage to/i.test(text)) out.equipment_damage = { value: 'yes', confidence: 'high' };
    if (/\bno damage\b|\bminor.*no damage/i.test(text)) out.equipment_damage = { value: 'no', confidence: 'high' };

    // City: "Vaughan, Toronto", "the city is Vaughan", "in Scarborough", "Toronto", etc.
    const cityMatch = text.match(/(?:city\s+(?:is|was)\s+)?([A-Za-z]+(?:\s+[A-Za-z]+)?)\s*,?\s*(?:Toronto|ON)?/i)
      || text.match(/(?:in|at)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)(?:\s*,|\s+Toronto|\.|$)/i)
      || text.match(/\b(Toronto|Vaughan|Scarborough|Brampton|Mississauga|Hamilton|Ottawa|Markham|Pickering|Oshawa|Burlington|Oakville|Etobicoke|North York)\b/i);
    if (cityMatch) {
      let city = (cityMatch[1] || cityMatch[0]).trim();
      if (city.toLowerCase() === 'vaughaun') city = 'Vaughan';
      if (city.length > 1 && city.length < 50) out.city = { value: city, confidence: 'high' };
    }
  }

  if (formType === 'teddy_bear') {
    const ageMatch = text.match(/(\d+)\s*(?:year|yr)s?\s*old|(?:age|aged)\s*(\d+)|(\d+)\s*yo\b/i);
    if (ageMatch) out.recipient_age = { value: ageMatch[1] || ageMatch[2] || ageMatch[3], confidence: 'high' };
  }

  return out;
}

const FORM_SCHEMAS = {
  occurrence_report: {
    date: { required: true, label: 'Date of Occurrence' },
    time: { required: true, label: 'Time of Occurrence' },
    call_number: { required: false, label: 'Call Number' },
    occurrence_type: { required: true, label: 'Occurrence Type' },
    occurrence_reference: { required: false, label: 'Reference Number' },
    vehicle_number: { required: false, label: 'Vehicle Number' },
    vehicle_description: { required: false, label: 'Vehicle Description' },
    service: { required: false, label: 'Service' },
    role: { required: true, label: 'Paramedic Role' },
    badge_number: { required: true, label: 'Badge Number' },
    paramedic_name: { required: true, label: 'Paramedic Name' },
    location: { required: true, label: 'Location' },
    city: { required: true, label: 'City' },
    province: { required: true, label: 'Province' },
    severity: { required: true, label: 'Severity' },
    injuries_reported: { required: true, label: 'Injuries Reported' },
    equipment_damage: { required: true, label: 'Equipment Damage' },
    supervisor_notified: { required: false, label: 'Supervisor Notified' },
    other_services: { required: false, label: 'Other Services Involved' },
    description: { required: true, label: 'Description' },
    action_taken: { required: true, label: 'Action Taken' },
    resolution: { required: false, label: 'Resolution' },
    management_notes: { required: false, label: 'Management Notes' }
  },
  teddy_bear: {
    date_time: { required: true, label: 'Date & Time' },
    primary_medic_first: { required: true, label: 'Primary Medic First Name' },
    primary_medic_last: { required: true, label: 'Primary Medic Last Name' },
    medic_number: { required: true, label: 'Medic Badge Number' },
    second_medic: { required: false, label: 'Second Medic Name' },
    recipient_age: { required: true, label: 'Recipient Age' },
    recipient_gender: { required: true, label: 'Recipient Gender' },
    recipient_type: { required: true, label: 'Recipient Type' },
    unit_id: { required: false, label: 'Unit Number' },
    location: { required: false, label: 'Location' },
    city: { required: false, label: 'City' },
    province: { required: false, label: 'Province' },
    notes: { required: false, label: 'Notes' }
  },
  status_report: {
    paramedic_name: { required: true, label: 'Paramedic Name' },
    report_month: { required: true, label: 'Report Month' },
    acr_completion: { required: true, label: 'ACR Completion Status' },
    acr_unfinished: { required: false, label: 'ACRs Unfinished' },
    vaccination: { required: true, label: 'Vaccination Status' },
    driver_license: { required: true, label: 'Driver License Status' },
    education: { required: true, label: 'Education Status' },
    uniform_status: { required: true, label: 'Uniform Status' },
    uniform_credits: { required: false, label: 'Uniform Credits' },
    criminal_record: { required: true, label: 'Criminal Record Check' },
    acp_cert: { required: false, label: 'ACP Certification Status' },
    vacation: { required: true, label: 'Vacation Status' },
    missed_meals: { required: true, label: 'Missed Meals Status' },
    overtime: { required: true, label: 'Overtime Status' }
  }
};

async function extractFormData(message, formType, existingData = {}, paramedicProfile = {}, conversationContext = '') {
  console.log(`[ExtractionAgent] Extracting data for ${formType}...`);
  
  const schema = FORM_SCHEMAS[formType];
  if (!schema) {
    console.log(`[ExtractionAgent] Unknown form type: ${formType}`);
    return null;
  }

  const prefilled = {};
  if (paramedicProfile.first_name) {
    prefilled.paramedic_name = `${paramedicProfile.first_name} ${paramedicProfile.last_name}`;
    prefilled.primary_medic_first = paramedicProfile.first_name;
    prefilled.primary_medic_last = paramedicProfile.last_name;
    prefilled.badge_number = paramedicProfile.badge_number;
    prefilled.medic_number = paramedicProfile.badge_number;
    prefilled.role = paramedicProfile.role;
    prefilled.service = 'EMS';
    prefilled.province = 'ON';
    prefilled.vehicle_number = paramedicProfile.unit;
    prefilled.unit_id = paramedicProfile.unit;
  }

  const fullContext = conversationContext ? `Previous conversation:\n${conversationContext}\n\nLatest message: ${message}` : message;
  const patternExtracted = extractPatterns(fullContext, formType);

  try {
    const result = await fastCompletion([
      {
        role: 'system',
        content: `You are a silent form data extraction agent for paramedics. Extract form field values from the FULL conversation - including any previous messages where the user provided details.

Form type: ${formType}
Required fields: ${Object.entries(schema).filter(([,c]) => c.required).map(([k,c]) => `${k} (${c.label})`).join(', ')}
Already extracted: ${JSON.stringify(Object.fromEntries(Object.entries(existingData).filter(([,v]) => v?.value).map(([k,v]) => [k, v?.value || v])))}

Rules:
- Extract from the ENTIRE conversation - if user said "5 year old" earlier, include recipient_age: 5
- If user said "today" or "just now", use today's date/time
- Assign confidence: "high" if explicitly stated, "medium" if inferred, "low" if guessed
- Include ALL fields from schema - use null for missing, keep existing values
- For dates use YYYY-MM-DD, times use HH:MM
- recipient_gender: Male/Female/Other/Prefer not to say
- recipient_type: Patient/Family/Bystander/Other
- occurrence_type: call_related or non_call_related
- severity: low/medium/high
- injuries_reported, equipment_damage: yes/no
- IMPORTANT: Combine info from ALL messages in the conversation. If user said "2pm" in one message and "March 3rd" in another, use both.
- For occurrence forms: city is REQUIRED. Extract from "Vaughan, Toronto", "city is Vaughan", "in Scarborough", etc. Use the city name only (e.g. "Vaughan" not "Vaughan, Toronto").

Return ONLY valid JSON:
{
  "form_type": "${formType}",
  "fields": {
    "field_name": { "value": "extracted value or null", "confidence": "high/medium/low" }
  }
}`
      },
      { role: 'user', content: fullContext }
    ], { max_tokens: 1024, temperature: 0.1 });

    let parsed;
    try {
      parsed = JSON.parse(result.trim().replace(/```json\n?|\n?```/g, ''));
    } catch (e) {
      parsed = { form_type: formType, fields: {} };
    }
    parsed.fields = parsed.fields || {};

    for (const [key, val] of Object.entries(prefilled)) {
      if (!parsed.fields[key] || !parsed.fields[key].value) {
        parsed.fields[key] = { value: val, confidence: 'high' };
      }
    }

    for (const [key, val] of Object.entries(existingData)) {
      if (val && (val.value || val.value === 0) && (!parsed.fields[key] || !parsed.fields[key].value)) {
        parsed.fields[key] = typeof val === 'object' ? val : { value: val, confidence: 'high' };
      }
    }

    // Pattern extraction ALWAYS wins when it has a value - ensures form fills as user speaks, no matter what
    for (const [key, val] of Object.entries(patternExtracted)) {
      if (val?.value && schema[key]) {
        parsed.fields[key] = val;
      }
    }

    for (const fieldName of Object.keys(schema)) {
      if (!parsed.fields[fieldName]) {
        parsed.fields[fieldName] = { value: null, confidence: null };
      }
    }

    console.log(`[ExtractionAgent] Extracted ${Object.keys(parsed.fields).filter(k => parsed.fields[k]?.value).length} fields`);
    return parsed;
  } catch (error) {
    console.error('[ExtractionAgent] Extraction failed:', error.message);
    const fallback = { form_type: formType, fields: {} };
    for (const [key, val] of Object.entries({ ...prefilled, ...existingData, ...patternExtracted })) {
      if (val && typeof val === 'object' && val.value) {
        fallback.fields[key] = val;
      } else if (val) {
        fallback.fields[key] = { value: val, confidence: 'high' };
      }
    }
    return fallback;
  }
}

function getFormSchema(formType) {
  return FORM_SCHEMAS[formType] || null;
}

module.exports = { extractFormData, getFormSchema, FORM_SCHEMAS };
