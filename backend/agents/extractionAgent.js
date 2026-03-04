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

    // Location: "Highway 401 West", "at the Main Street station", "happened at X"
    const highwayMatch = text.match(/[Hh]ighway\s+(\d+[A-Za-z]*(?:\s+(?:East|West|North|South))?)/i);
    if (highwayMatch) {
      const loc = 'Highway ' + highwayMatch[1];
      if (loc.length > 2 && loc.length < 80) out.location = { value: loc, confidence: 'high' };
    } else {
      const locMatch = text.match(/(?:happened at|occurred at|at (?:the )?)([^.?!]+?)(?:\.|$)/i)
        || text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+station(?:\s+lot)?)/i)
        || text.match(/(?:in|at)\s+(?:the\s+)?([^.?!,]+?)(?:\s+lot|\s+station|\.|,|$)/i);
      if (locMatch) {
        const loc = locMatch[1].replace(/^(?:the|a|an)\s+/i, '').trim();
        if (loc.length > 2 && loc.length < 80 && !/^(?:previous|latest|conversation|message)$/i.test(loc)) {
          out.location = { value: loc, confidence: 'high' };
        }
      }
    }

    // Severity
    if (/\bminor\b/.test(lower)) out.severity = { value: 'low', confidence: 'high' };
    else if (/\bmoderate\b/.test(lower)) out.severity = { value: 'medium', confidence: 'high' };
    else if (/\bsevere\b/.test(lower)) out.severity = { value: 'high', confidence: 'high' };

    // injuries_reported, equipment_damage
    if (/\bno injuries\b|\bno one (?:was )?hurt\b/i.test(text)) out.injuries_reported = { value: 'no', confidence: 'high' };
    if (/\b(?:door|vehicle|equipment)\s+damage\b|damage to/i.test(text)) out.equipment_damage = { value: 'yes', confidence: 'high' };
    if (/\bno damage\b|\bminor.*no damage/i.test(text)) out.equipment_damage = { value: 'no', confidence: 'high' };

    // City: "in the city of Toronto", "city of Vaughan", "Vaughan, Toronto", etc.
    const cityOfMatch = text.match(/(?:in the )?city of\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
    if (cityOfMatch) {
      let city = cityOfMatch[1].trim();
      if (city.toLowerCase() === 'vaughaun') city = 'Vaughan';
      if (city.length > 1 && city.length < 50) out.city = { value: city, confidence: 'high' };
    } else {
      const cityMatch = text.match(/(?:city\s+(?:is|was)\s+)([A-Za-z]+(?:\s+[A-Za-z]+)?)/i)
        || text.match(/\b(Toronto|Vaughan|Scarborough|Brampton|Mississauga|Hamilton|Ottawa|Markham|Pickering|Oshawa|Burlington|Oakville|Etobicoke|North York)\b/i);
      if (cityMatch) {
        let city = (cityMatch[1] || cityMatch[0]).trim();
        if (city.toLowerCase() === 'vaughaun') city = 'Vaughan';
        if (city.length > 1 && city.length < 50 && !/^(?:previous|conversation|message)$/i.test(city)) {
          out.city = { value: city, confidence: 'high' };
        }
      }
    }
  }

  if (formType === 'teddy_bear') {
    const ageMatch = text.match(/(\d+)\s*(?:year|yr)s?\s*old|(?:age|aged)\s*(\d+)|(\d+)\s*yo\b/i);
    if (ageMatch) out.recipient_age = { value: ageMatch[1] || ageMatch[2] || ageMatch[3], confidence: 'high' };
  }

  if (formType === 'vehicle_inventory' || formType === 'equipment_inventory') {
    if (lower.includes('today')) {
      const d = new Date();
      out.date = { value: d.toISOString().slice(0, 10), confidence: 'medium' };
    }
    const okItems = ['engine', 'fuel', 'tire', 'lights', 'siren', 'radio', 'gps', 'cleanliness', 'stretcher', 'suction', 'defibrillator', 'first aid'];
    const itemMap = { engine: 'engine_condition', fuel: 'fuel_level', tire: 'tire_pressure', lights: 'emergency_lights', siren: 'siren_system', radio: 'radio_communication', gps: 'gps_navigation', cleanliness: 'ambulance_cleanliness', stretcher: 'stretcher', suction: 'suction_device', defibrillator: 'defibrillator', 'first aid': 'first_aid_kit' };
    for (const item of okItems) {
      if (new RegExp(`${item}.*(?:ok|good|fine|working)`).test(lower)) {
        const key = itemMap[item];
        if (key) out[key] = { value: 'OK', confidence: 'high' };
      }
      if (new RegExp(`${item}.*(?:low|issue|not working|needs)`).test(lower)) {
        const key = itemMap[item];
        if (key) out[key] = { value: key.includes('fuel') || key.includes('oxygen') ? 'Low' : 'Issue', confidence: 'high' };
      }
    }
    if (/\boxygen.*(?:full|100)/i.test(text)) out.oxygen_tank_level = { value: 'Full', confidence: 'high' };
    if (/\boxygen.*(?:low|\d+%)/i.test(text)) {
      const pct = text.match(/(\d+)\s*%/);
      out.oxygen_tank_level = { value: pct ? `${pct[1]}%` : 'Low', confidence: 'high' };
    }
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
  },
  vehicle_inventory: {
    paramedic_name: { required: true, label: 'Paramedic Name' },
    employee_id: { required: true, label: 'Employee ID' },
    unit_number: { required: true, label: 'Unit Number / Ambulance ID' },
    date: { required: true, label: 'Date' },
    shift_time: { required: true, label: 'Shift Time' },
    station_location: { required: true, label: 'Station Location' },
    engine_condition: { required: true, label: 'Engine Condition' },
    fuel_level: { required: true, label: 'Fuel Level' },
    tire_pressure: { required: true, label: 'Tire Pressure' },
    emergency_lights: { required: true, label: 'Emergency Lights' },
    siren_system: { required: true, label: 'Siren System' },
    radio_communication: { required: true, label: 'Radio Communication' },
    gps_navigation: { required: true, label: 'GPS / Navigation' },
    ambulance_cleanliness: { required: true, label: 'Ambulance Cleanliness' },
    stretcher: { required: true, label: 'Stretcher' },
    oxygen_tank_level: { required: true, label: 'Oxygen Tank Level' },
    suction_device: { required: true, label: 'Suction Device' },
    defibrillator: { required: true, label: 'Defibrillator' },
    first_aid_kit: { required: true, label: 'First Aid Kit' },
    notes_issues: { required: false, label: 'Notes / Issues' }
  },
  equipment_inventory: {
    paramedic_name: { required: true, label: 'Paramedic Name' },
    employee_id: { required: true, label: 'Employee ID' },
    ambulance_unit: { required: true, label: 'Ambulance Unit' },
    date: { required: true, label: 'Date' },
    oxygen_masks: { required: false, label: 'Oxygen Masks' },
    iv_kits: { required: false, label: 'IV Kits' },
    bandages: { required: false, label: 'Bandages' },
    gloves: { required: false, label: 'Gloves' },
    saline_bags: { required: false, label: 'Saline Bags' },
    epinephrine: { required: false, label: 'Epinephrine' },
    tourniquets: { required: false, label: 'Tourniquets' },
    trauma_dressings: { required: false, label: 'Trauma Dressings' },
    epinephrine_exp: { required: false, label: 'Epinephrine Expiration' },
    saline_exp: { required: false, label: 'Saline Expiration' },
    notes_restock: { required: false, label: 'Notes / Restock Request' }
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
    prefilled.unit_number = paramedicProfile.unit;
    prefilled.ambulance_unit = paramedicProfile.unit;
    prefilled.station_location = paramedicProfile.station;
    prefilled.employee_id = paramedicProfile.badge_number;
  }

  const fullContext = conversationContext
    ? `---USER/ASSISTANT DIALOGUE---\n${conversationContext}\n---END DIALOGUE---\n\nMOST RECENT USER MESSAGE: ${message}`
    : message;
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
- For occurrence forms: location = the physical place (e.g. "Highway 401 West", "123 Main St", "corner of X and Y"). city = the city name only (e.g. "Toronto", "Vaughan"). NEVER use "Previous conversation", "Latest message", or any instruction/meta text as values.
- For vehicle_inventory: engine_condition, fuel_level, tire_pressure, emergency_lights, siren_system, radio_communication, gps_navigation, ambulance_cleanliness use "OK" or "Issue"/"Low"/"Not Working"/"Needs Cleaning" as appropriate. stretcher, suction_device, defibrillator, first_aid_kit: "OK" or "Issue". oxygen_tank_level: "Full" or "Low" or percentage like "60%".
- For equipment_inventory: oxygen_masks, iv_kits, bandages, gloves, saline_bags, epinephrine, tourniquets, trauma_dressings: use quantity and status "OK"/"Low Stock"/"Missing"/"Expired".

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

    // Sanitize: reject meta/instruction text that LLM sometimes wrongly extracts
    const BAD_VALUES = /^(?:previous\s+conversation|latest\s+message|conversation|message|user\s+said|assistant\s+said|extract|instruction|knocked\s+out|don't\s+worry|see\s+above)/i;
    for (const [key, field] of Object.entries(parsed.fields || {})) {
      const v = field?.value;
      if (typeof v === 'string' && (BAD_VALUES.test(v) || v.length > 200)) {
        parsed.fields[key] = { value: null, confidence: null };
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
