import { generateNPCDialogue } from '../firebase/firebase.js';

/**
 * Manages the dialogue UI and NPC conversation flow.
 */
export class DialogueManager {
  constructor() {
    this.isOpen = false;
    this.currentNpc = null;
    this.conversationType = null; // 'scripted' | 'ai'
    this.scriptedLines = [];
    this.scriptedIndex = 0;
    this.history = []; // { role, parts } for Gen AI context
    this.onResolve = null; // callback when dialogue ends
    this.lockInteraction = true;

    // DOM refs
    this.box = document.getElementById('dialogue-box');
    this.nameEl = document.getElementById('dialogue-name');
    this.textEl = document.getElementById('dialogue-text');
    this.choicesEl = document.getElementById('dialogue-choices');
    this.continueBtn = document.getElementById('dialogue-continue');
    this.promptEl = document.getElementById('interaction-prompt');

    // Session storage key
    this.STORAGE_KEY = 'game_npc_history';

    this._loadSessionHistory();
    this._bindEvents();
  }

  _loadSessionHistory() {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      this.allHistory = stored ? JSON.parse(stored) : {};
    } catch {
      this.allHistory = {};
    }
  }

  _saveSessionHistory() {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.allHistory));
    } catch { /* sessionStorage may be full */ }
  }

  _getNpcHistory(npcId) {
    return this.allHistory[npcId] || [];
  }

  _addToHistory(npcId, role, text) {
    if (!this.allHistory[npcId]) this.allHistory[npcId] = [];
    this.allHistory[npcId].push({ role, parts: [{ text }] });
    // Keep last 20 exchanges max per NPC
    if (this.allHistory[npcId].length > 20) {
      this.allHistory[npcId] = this.allHistory[npcId].slice(-20);
    }
    this._saveSessionHistory();
  }

  _bindEvents() {
    // Continue button
    this.continueBtn.addEventListener('click', () => this._onContinue());

    // Keyboard Enter to continue
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.isOpen && this.conversationType === 'scripted') {
        this._onContinue();
      }
    });

    // NPC interaction events from engine
    document.addEventListener('start-dialogue', (e) => this._open(e.detail));
  }

  _open(detail) {
    this.currentNpc = detail.npc;
    this.conversationType = detail.type;
    this.isOpen = true;
    this.box.classList.remove('hidden');
    this.promptEl.classList.add('hidden');

    this.nameEl.textContent = detail.npc.name;
    this.choicesEl.innerHTML = '';

    if (detail.type === 'scripted') {
      this.scriptedLines = detail.lines;
      this.scriptedIndex = 0;
      this.continueBtn.classList.remove('hidden');
      this._showScriptedLine();
    } else if (detail.type === 'ai') {
      this.continueBtn.classList.add('hidden');
      this._showAIOptions(detail.playerMessage);
    }
  }

  _showScriptedLine() {
    if (this.scriptedIndex < this.scriptedLines.length) {
      this.textEl.textContent = this.scriptedLines[this.scriptedIndex];
      this.scriptedIndex++;
      // Add to history
      this._addToHistory(this.currentNpc.id, 'model', this.scriptedLines[this.scriptedIndex - 1]);
    } else {
      // Scripted intro done — transition to AI
      this._transitionToAI();
    }
  }

  _onContinue() {
    if (this.conversationType === 'scripted') {
      this._showScriptedLine();
    }
  }

  _transitionToAI() {
    this.conversationType = 'ai';
    this.continueBtn.classList.add('hidden');
    this.textEl.textContent = 'What do you say?';

    const choices = document.createElement('div');
    choices.id = 'dialogue-choices';
    this.choicesEl.innerHTML = '';

    const options = [
      'Tell me about yourself.',
      'What\'s happening in the city?',
      'Can you help me?',
      'Goodbye.',
    ];

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = `💬 ${opt}`;
      btn.addEventListener('click', () => this._aiChat(opt));
      this.choicesEl.appendChild(btn);
    });
  }

  _showAIOptions(playerMsg) {
    this.choicesEl.innerHTML = '';
    const options = [
      'Tell me about yourself.',
      'What\'s happening in the city?',
      'Can you help me?',
      'Goodbye.',
    ];

    // If talking to Kade, add a challenge option
    if (this.currentNpc?.id === 'kade') {
      options.push('I want to fight you.');
    }

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = `💬 ${opt}`;
      btn.addEventListener('click', () => {
        if (opt === 'I want to fight you.') {
          this._close();
          document.dispatchEvent(new CustomEvent('initiate-battle', {
            detail: { npc: this.currentNpc }
          }));
        } else if (opt === 'Goodbye.') {
          this._closeAndMaybeGiveItem();
        } else {
          this._aiChat(opt);
        }
      });
      this.choicesEl.appendChild(btn);
    });
  }

  async _aiChat(playerMessage) {
    this.textEl.textContent = '🤔 Thinking...';
    this.choicesEl.innerHTML = '';
    this.continueBtn.classList.add('hidden');

    this._addToHistory(this.currentNpc.id, 'user', playerMessage);

    const npc = this.currentNpc;
    const history = this._getNpcHistory(npc.id);

    try {
      const response = await generateNPCDialogue(npc.systemPrompt, history, playerMessage);
      this.textEl.textContent = response;
      this._addToHistory(npc.id, 'model', response);
    } catch (err) {
      console.error('Gen AI failed:', err);
      const fallbacks = [
        'Interesting question. I\'m not sure I have an answer right now.',
        'The city keeps its secrets. Maybe ask me something else.',
        'I\'d tell you, but I\'m still figuring it out myself.',
      ];
      const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      this.textEl.textContent = fallback;
      this._addToHistory(npc.id, 'model', fallback);
    }

    this._showAIOptions(playerMessage);
  }

  _closeAndMaybeGiveItem() {
    const npc = this.currentNpc;

    // First meeting item give
    if (npc.givesItem && npc.conversationCount === 1) {
      document.dispatchEvent(new CustomEvent('npc-give-item', {
        detail: { npc, itemId: npc.givesItem.id, message: npc.givesItem.onGiveMessage }
      }));
    }

    // Check battle trigger (Kade battle after dialogue)
    if (npc.canBattle && npc.conversationCount >= 2) {
      document.dispatchEvent(new CustomEvent('initiate-battle', {
        detail: { npc }
      }));
    }

    this._close();
  }

  _close() {
    this.isOpen = false;
    this.box.classList.add('hidden');
    this.promptEl.classList.remove('hidden');
    this.currentNpc = null;
  }
}