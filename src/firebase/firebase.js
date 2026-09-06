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
 * Expected format: {...text...} followed by optional JSON blocks:
 * ```
 * Text response.
 * {"action": "give_item", "item_id": "health_potion"}
 * {"action": "mood_shift", "target": "echo", "deltas": {"amusement": +10}}
 * ```
 * Returns { text: string, actions: Array }
 */
function parseActions(response) {
  // Match ALL JSON objects that contain "action" at any depth
  // Each JSON object must be on its own line or at the end
  const jsonRegex = /\{[^{}]*"action"[^{}]*\}/g;
  let actions = [];
  let text = response;

  let match;
  while ((match = jsonRegex.exec(response)) !== null) {
    try {
      const parsed = JSON.parse(match[0]);
      const actionArr = Array.isArray(parsed) ? parsed : [parsed];
      actions = actions.concat(actionArr);
      // Remove the JSON from the text
      text = text.replace(match[0], '');
    } catch {
      // Invalid JSON, skip it
    }
  }

  text = text.trim();

  // Legacy: also try the old single-JSON-at-end format
  if (actions.length === 0) {
    const legacyRegex = /\n\s*\{(?:\s*"action"\s*:.*)\}$/s;
    const legacyMatch = response.match(legacyRegex);
    if (legacyMatch) {
      try {
        const parsed = JSON.parse(legacyMatch[0].trim());
        actions = Array.isArray(parsed) ? parsed : [parsed];
        text = response.slice(0, legacyMatch.index).trim();
      } catch {}
    }
  }

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