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

// Server-side token handling: Firebase Gen AI calls go through the Vertex AI API
// which authenticates via the project's service account. In browser SDK,
// Firebase Vertex AI preview uses the Firebase app credentials implicitly.
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
 * Generate an NPC response using Firebase Gen AI.
 * @param {string} systemPrompt - NPC personality/system prompt
 * @param {Array} history - Previous conversation turns [{role, parts}]
 * @param {string} playerMessage - The player's latest input
 * @returns {Promise<string>} The NPC's response text
 */
export async function generateNPCDialogue(systemPrompt, history, playerMessage) {
  if (!genModel) {
    return `[NPC placeholder] I'm not connected to AI right now, but nice to meet you!`;
  }

  const chat = genModel.startChat({
    history: history.slice(-10),
    systemInstruction: systemPrompt,
  });

  const result = await chat.sendMessage(playerMessage);
  return result.response.text();
}

export { app };