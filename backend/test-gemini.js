/**
 * Quick test script to verify Gemini API is working.
 * Run from backend folder: node test-gemini.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const key = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!key) {
  console.error('Error: No API key found. Set GOOGLE_GEMINI_API_KEY in .env (project root)');
  process.exit(1);
}

console.log('Testing Gemini API...');
const { chatCompletion } = require('./utils/embeddings');

chatCompletion(
  [{ role: 'user', content: 'Say "ParaHelper works!" in exactly 5 words.' }],
  'gemini-2.5-flash',
  { max_tokens: 32 }
)
  .then((text) => {
    console.log('Success:', text);
  })
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
