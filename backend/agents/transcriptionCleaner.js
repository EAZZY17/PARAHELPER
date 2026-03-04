const { fastCompletion } = require('../utils/embeddings');

const MEDICAL_CORRECTIONS = {
  'a cpp': 'ACP', 'a cp': 'ACP', 'acp p': 'ACP',
  'pee see pee': 'PCP', 'p c p': 'PCP',
  'epi pin': 'EpiPen', 'epee pen': 'EpiPen', 'epipen': 'EpiPen',
  'dinner bea': 'dyspnea', 'dis nea': 'dyspnea', 'disp nea': 'dyspnea',
  'night row': 'nitro', 'nitro glycerin': 'nitroglycerin',
  'a trophy': 'atropine', 'at row peen': 'atropine',
  'nar can': 'Narcan', 'nor can': 'Narcan', 'nalox own': 'naloxone',
  'be vm': 'BVM', 'b v m': 'BVM', 'bag valve mask': 'BVM',
  'n r b': 'NRB', 'non rebreather': 'NRB',
  'gcs': 'GCS', 'g c s': 'GCS', 'Glasgow': 'GCS',
  'stemi': 'STEMI', 's t elevation': 'STEMI',
  'tack a card ya': 'tachycardia', 'tack e card ia': 'tachycardia',
  'brady card ia': 'bradycardia', 'brady cardia': 'bradycardia',
  'a fib': 'AFib', 'atrial fib': 'AFib',
  'sp oh two': 'SpO2', 'sp02': 'SpO2', 'spo two': 'SpO2',
  'et co2': 'ETCO2', 'end title': 'ETCO2',
  'iv': 'IV', 'i v': 'IV', 'eye vee': 'IV',
  'io': 'IO', 'i o': 'IO', 'inter osseous': 'IO',
  'mg': 'mg', 'milligrams': 'mg',
  'ml': 'mL', 'milliliters': 'mL',
  'acr': 'ACR', 'a c r': 'ACR',
  'sbar': 'SBAR', 's bar': 'SBAR',
  'mvc': 'MVC', 'm v c': 'MVC', 'motor vehicle': 'MVC',
  'cpr': 'CPR', 'c p r': 'CPR',
  'aed': 'AED', 'a e d': 'AED',
};

const UNIT_PATTERN = /unit\s+(?:for|four|fore)?\s*(?:oh|zero|0)?\s*(\d{1,2})/gi;
const DCC_PATTERN = /(?:d\s*c\s*c|dcc)\s*[-\s]*(\d{4})\s*[-\s]*(\d{4})/gi;
const BADGE_PATTERN = /(?:s|es)\s*[-\s]*(\d{4})/gi;

function cleanTranscript(rawText) {
  if (!rawText || rawText.trim() === '') return rawText;
  
  console.log('[TranscriptionCleaner] Processing raw input...');
  let cleaned = rawText;

  for (const [wrong, right] of Object.entries(MEDICAL_CORRECTIONS)) {
    const regex = new RegExp(wrong, 'gi');
    cleaned = cleaned.replace(regex, right);
  }

  cleaned = cleaned.replace(UNIT_PATTERN, (match, num) => {
    return `unit 40${num.padStart(2, '0')}`;
  });

  cleaned = cleaned.replace(DCC_PATTERN, (match, p1, p2) => {
    return `DCC-${p1}-${p2}`;
  });

  cleaned = cleaned.replace(/station\s+(\d+)/gi, 'Station $1');

  if (cleaned !== rawText) {
    console.log(`[TranscriptionCleaner] Corrected: "${rawText}" → "${cleaned}"`);
  }
  
  return cleaned;
}

async function deepClean(rawText) {
  const quickCleaned = cleanTranscript(rawText);
  
  if (quickCleaned.length < 10) return quickCleaned;

  try {
    const result = await fastCompletion([
      {
        role: 'system',
        content: `You are a medical transcription corrector for paramedics. Fix speech recognition errors for medical terminology only. Keep meaning intact. Return ONLY the corrected text with no explanation.
Common fixes: drug names, medical abbreviations, unit numbers (40XX format), badge numbers (S-XXXX), vital signs, medical conditions.
If the text is already correct, return it unchanged.`
      },
      { role: 'user', content: quickCleaned }
    ], { max_tokens: 256, temperature: 0.1 });
    
    return result.trim();
  } catch (error) {
    console.error('[TranscriptionCleaner] Deep clean failed, using quick clean:', error.message);
    return quickCleaned;
  }
}

module.exports = { cleanTranscript, deepClean };
