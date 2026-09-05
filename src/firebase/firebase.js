import { initializeApp } from 'firebase/app';
import { getAI, getGenerativeModel } from 'firebase/ai';

const firebaseConfig = {
  apiKey: "AIzaSyAIggVffJ5LyQbqCc9avyDKXZN3NXuw7W4",
  authDomain: "game-test-7da9e.firebaseapp.com",
  projectId: "game-test-7da9e",
  storageBucket: "game-test-7da9e.firebasestorage.app",
  messagingSenderId: "461705471009",
  appId: "1:461705471009:web:dbf8bd54f04814f6a96f60"
};

const app = initializeApp(firebaseConfig);

let vertexAI = null;
let genModel = null;

try {
  vertexAI = getAI(app);
  genModel = getGenerativeModel(vertexAI, { model: 'gemini-2.0-flash' });
  console.log('✅ Firebase Gen AI initialized');
} catch (e) {
  console.warn('⚠️ Firebase AI not available:', e.message);
}

/**
 * Parse JSON action metadata from the end of an AI response.
 * Expected format: {...text...} followed by optional JSON block:
 * ```
 * Text response.
 * {"action": "give_item", "item_id": "health_potion"}
 * ```
 * Returns { text: string, actions: Array }
 */
function parseActions(response) {
  // Look for a standalone JSON object after the last newline or at end
  const jsonRegex = /\n?\s*\{(?:\s*"action"|"event")\s*:.*\}$/s;
  const match = response.match(jsonRegex);

  if (!match) {
    return { text: response.trim(), actions: [] };
  }

  let actions = [];
  try {
    const parsed = JSON.parse(match[0].trim());
    actions = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    // Invalid JSON, treat as part of text
    return { text: response.trim(), actions: [] };
  }

  const text = response.slice(0, match.index).trim();
  return { text, actions };
}

/**
 * Generate an NPC response using Firebase Gen AI.
 * @param {string} systemPrompt - NPC personality/system prompt
 * @param {Array} history - Previous conversation turns [{role, parts}]
 * @param {string} playerMessage - The player's latest input
 * @returns {Promise<{text: string, actions: Array}>} The NPC's response
 */
export async function generateNPCDialogue(systemPrompt, history, playerMessage) {
  if (!genModel) {
    return {
      text: `[Connecting...] I'm not online right now, but nice to meet you!`,
      actions: []
    };
  }

  const chat = genModel.startChat({
    history: history.slice(-10),
    systemInstruction: systemPrompt,
  });

  try {
    const result = await chat.sendMessage(playerMessage);
    const raw = result.response.text();
    return parseActions(raw);
  } catch (err) {
    console.error('Gen AI error:', err);
    return {
      text: `[Signal lost...] The city's network is glitching. Try again in a moment.`,
      actions: []
    };
  }
}

export { app };