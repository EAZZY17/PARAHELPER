function getFemaleVoice() {
  const voices = window.speechSynthesis.getVoices();
  const names = ['samantha', 'victoria', 'karen', 'zira', 'female', 'google uk english female', 'microsoft zira'];
  for (const name of names) {
    const v = voices.find(x => x.name.toLowerCase().includes(name));
    if (v && v.lang.startsWith('en')) return v;
  }
  return voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en'));
}

export function ensureVoicesLoaded() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.getVoices();
}

/**
 * Text-to-Speech using Web Speech API (no extra API or cost)
 * Uses a female voice and speaks slowly for clarity.
 */
export function speak(text, options = {}) {
  if (!text || typeof text !== 'string') return;
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.rate = options.rate ?? 0.85;
  utterance.pitch = options.pitch ?? 1;
  utterance.lang = options.lang ?? 'en-US';
  utterance.volume = options.volume ?? 1;

  const voice = getFemaleVoice();
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
