const https = require('https');

const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel - calm professional

async function textToSpeech(text) {
  if (!process.env.ELEVENLABS_API_KEY) {
    console.log('[ElevenLabs] No API key - skipping TTS');
    return null;
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text.substring(0, 500),
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const base64Audio = buffer.toString('base64');
    console.log('[ElevenLabs] Generated audio for response');
    return `data:audio/mpeg;base64,${base64Audio}`;
  } catch (error) {
    console.error('[ElevenLabs] TTS Error:', error.message);
    return null;
  }
}

module.exports = { textToSpeech };
