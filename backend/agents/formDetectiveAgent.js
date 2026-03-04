const { fastCompletion } = require('../utils/embeddings');

const FORM_TRIGGERS = {
  occurrence_report: [
    'accident', 'incident', 'hit', 'damage', 'occurred', 'occurrence',
    'collision', 'injury at', 'equipment damage', 'slip', 'fall',
    'backed into', 'door damage', 'vehicle damage', 'report an incident'
  ],
  teddy_bear: [
    'teddy', 'bear', 'comfort', 'scared', 'child', 'kid', 'gave a bear',
    'teddy bear', 'comfort item', 'stuffed animal', 'pediatric comfort'
  ],
  shift_report: [
    'shift', 'schedule', 'when do i work', 'hours', 'next shift',
    'my schedule', 'shift report', 'working today', 'on duty'
  ],
  status_report: [
    'status', 'certifications', 'vacation', 'overtime', 'compliance',
    'acr', 'vaccination', 'driver license', 'uniform', 'missed meal',
    'criminal record', 'education', 'status check', 'status report'
  ],
  vehicle_inventory: [
    'vehicle inventory', 'ambulance check', 'pre shift', 'vehicle inspection',
    'unit check', 'ambulance condition', 'tire pressure', 'fuel level',
    'emergency lights', 'siren', 'stretcher', 'oxygen tank', 'defibrillator'
  ],
  equipment_inventory: [
    'equipment inventory', 'supplies check', 'restock', 'oxygen masks',
    'iv kits', 'bandages', 'gloves', 'saline', 'epinephrine', 'tourniquet',
    'trauma dressing', 'expiration', 'low stock', 'missing items'
  ]
};

function detectFormsFromKeywords(message) {
  const lower = message.toLowerCase();
  const detectedForms = [];

  for (const [formType, triggers] of Object.entries(FORM_TRIGGERS)) {
    for (const trigger of triggers) {
      if (lower.includes(trigger)) {
        detectedForms.push(formType);
        break;
      }
    }
  }

  const ageMatch = lower.match(/(?:age|aged|years?\s*old|yo)\s*(\d+)/);
  if (ageMatch && parseInt(ageMatch[1]) < 12) {
    if (!detectedForms.includes('teddy_bear')) {
      detectedForms.push('teddy_bear');
    }
  }

  return [...new Set(detectedForms)];
}

async function detectFormsWithAI(message, conversationContext = '') {
  console.log('[FormDetective] Analyzing message for form triggers...');
  
  const keywordForms = detectFormsFromKeywords(message);
  
  if (keywordForms.length > 0) {
    console.log(`[FormDetective] Detected forms from keywords: ${keywordForms.join(', ')}`);
    return keywordForms;
  }

  try {
    const result = await fastCompletion([
      {
        role: 'system',
        content: `You detect which paramedic forms are needed from a message. Return ONLY a JSON array of form types.
Possible forms: "occurrence_report", "teddy_bear", "shift_report", "status_report", "vehicle_inventory", "equipment_inventory"
If no form is needed, return [].
Rules:
- Accidents/incidents/damage/injuries → occurrence_report
- Teddy bears/comfort items/scared children → teddy_bear  
- Schedule/shift/hours/work times → shift_report
- Status/certifications/compliance/vacation/overtime → status_report
- Vehicle/ambulance inspection/pre-shift check → vehicle_inventory
- Equipment/supplies/restock/inventory check → equipment_inventory
- A single message can trigger MULTIPLE forms
- Age under 12 → also add teddy_bear
Return ONLY the JSON array, nothing else.`
      },
      { role: 'user', content: `Context: ${conversationContext}\nCurrent message: ${message}` }
    ], { max_tokens: 64, temperature: 0 });

    const parsed = JSON.parse(result.trim());
    console.log(`[FormDetective] AI detected forms: ${parsed.join(', ') || 'none'}`);
    return parsed;
  } catch (error) {
    console.error('[FormDetective] AI detection failed:', error.message);
    return keywordForms;
  }
}

module.exports = { detectFormsFromKeywords, detectFormsWithAI };
