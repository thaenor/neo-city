import { generateNPCDialogue } from '../firebase/firebase.js';

/**
 * Manages the dialogue UI and NPC conversation flow.
 * Features: scripted intro → AI dialogue, custom text input,
 * AI action metadata parsing, typewriter text effect, NPC accent colors.
 */
export class DialogueManager {
  constructor() {
    this.isOpen = false;
    this.currentNpc = null;
    this.conversationType = null; // 'scripted' | 'ai'
    this.scriptedLines = [];
    this.scriptedIndex = 0;
    this.lockInteraction = true;

    // DOM refs
    this.box = document.getElementById('dialogue-box');
    this.nameEl = document.getElementById('dialogue-name');
    this.textEl = document.getElementById('dialogue-text');
    this.choicesEl = document.getElementById('dialogue-choices');
    this.continueBtn = document.getElementById('dialogue-continue');
    this.customInputContainer = document.getElementById('custom-input-container');
    this.customInput = document.getElementById('custom-input');
    this.customSendBtn = document.getElementById('custom-send-btn');
    this.promptEl = document.getElementById('interaction-prompt');
    this.portraitEl = document.getElementById('dialogue-portrait');

    // Typewriter state
    this.typewriterTimer = null;
    this.typewriterIndex = 0;
    this.typewriterText = '';
    this.isTyping = false;

    // NPC color accent map (id → hex color)
    this.npcColors = {
      nova: '#ff66aa',
      kade: '#ff4444',
      zara: '#88ddff',
      rigo: '#ffaa44',
    };

    // Session storage
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
    } catch { /* may be full */ }
  }

  _getNpcHistory(npcId) {
    return this.allHistory[npcId] || [];
  }

  _addToHistory(npcId, role, text) {
    if (!this.allHistory[npcId]) this.allHistory[npcId] = [];
    this.allHistory[npcId].push({ role, parts: [{ text }] });
    if (this.allHistory[npcId].length > 20) {
      this.allHistory[npcId] = this.allHistory[npcId].slice(-20);
    }
    this._saveSessionHistory();
  }

  _bindEvents() {
    this.continueBtn.addEventListener('click', () => this._onContinue());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.isOpen) {
        if (this.conversationType === 'scripted') {
          this._onContinue();
        } else if (!this.customInputContainer.classList.contains('hidden')) {
          // Send custom input on Enter
          this._sendCustomInput();
        }
      }
    });

    this.customSendBtn.addEventListener('click', () => this._sendCustomInput());

    document.addEventListener('start-dialogue', (e) => this._open(e.detail));
  }

  _open(detail) {
    this.currentNpc = detail.npc;
    this.conversationType = detail.type;
    this.isOpen = true;
    this.box.classList.remove('hidden');
    this.promptEl.classList.add('hidden');

    // Set accent color + name
    const accent = this.npcColors[detail.npc.id] || '#8cf';
    this.nameEl.textContent = detail.npc.name;
    this.nameEl.style.borderLeft = `3px solid ${accent}`;
    this.nameEl.style.paddingLeft = '10px';

    // Portrait circle with initials
    if (this.portraitEl) {
      this.portraitEl.style.borderColor = accent;
      const name = detail.npc.name || '?';
      const initial = name.charAt(0).toUpperCase();
      this.portraitEl.textContent = initial;
    }

    this.choicesEl.innerHTML = '';
    this.customInputContainer.classList.add('hidden');
    this.customInput.value = '';

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
      this._stopTypewriter();
      const line = this.scriptedLines[this.scriptedIndex];
      this.scriptedIndex++;
      this._typewriterShow(line);
      this._addToHistory(this.currentNpc.id, 'model', line);
    } else {
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
    this.choicesEl.innerHTML = '';
    this.customInputContainer.classList.add('hidden');

    this._buildChoiceButtons([
      'Tell me about yourself.',
      'What\'s happening in the city?',
      'Can you help me?',
      'Goodbye.',
    ]);
  }

  /**
   * Show options after an AI response (or initial transition).
   * @param {string} [previousMsg] - the player's previous message for context
   */
  _showAIOptions(previousMsg) {
    this.choicesEl.innerHTML = '';
    this.customInputContainer.classList.add('hidden');
    this.customInput.value = '';

    // Contextual options based on the NPC
    const options = [
      'Tell me about yourself.',
      'What\'s happening in the city?',
      'Can you help me?',
      'Goodbye.',
    ];

    if (this.currentNpc?.canBattle) {
      options.push('I want to fight you.');
    }

    this._buildChoiceButtons(options);
  }

  /**
   * Build choice buttons + a custom input option.
   */
  _buildChoiceButtons(options) {
    this.choicesEl.innerHTML = '';

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = `💬 ${opt}`;
      btn.addEventListener('click', () => this._onChoiceSelected(opt));
      this.choicesEl.appendChild(btn);
    });

    // Custom input option (always last)
    const customBtn = document.createElement('button');
    customBtn.textContent = `✏️ Say something else...`;
    customBtn.classList.add('custom-input-trigger');
    customBtn.addEventListener('click', () => this._showCustomInput());
    this.choicesEl.appendChild(customBtn);
  }

  _showCustomInput() {
    this.choicesEl.innerHTML = '';
    this.customInputContainer.classList.remove('hidden');
    this.customInput.focus();
  }

  _sendCustomInput() {
    const text = this.customInput.value.trim();
    if (!text) return;
    this.customInputContainer.classList.add('hidden');
    this.customInput.value = '';
    this._aiChat(text);
  }

  _onChoiceSelected(opt) {
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
  }

  /** Typewriter: reveal text one character at a time, ~50ms per char */
  _typewriterShow(text) {
    this._stopTypewriter();
    this.isTyping = true;
    this.typewriterText = text;
    this.typewriterIndex = 0;
    this.textEl.textContent = '';
    this.textEl.classList.add('typing');

    this.typewriterTimer = setInterval(() => {
      if (this.typewriterIndex < this.typewriterText.length) {
        this.textEl.textContent += this.typewriterText[this.typewriterIndex];
        this.typewriterIndex++;
      } else {
        this._stopTypewriter();
      }
    }, 50);
  }

  _stopTypewriter() {
    if (this.typewriterTimer) {
      clearInterval(this.typewriterTimer);
      this.typewriterTimer = null;
    }
    this.isTyping = false;
    this.textEl.classList.remove('typing');
  }

  async _aiChat(playerMessage) {
    this.textEl.textContent = '🤔 Thinking...';
    this.choicesEl.innerHTML = '';
    this.continueBtn.classList.add('hidden');
    this.customInputContainer.classList.add('hidden');

    this._addToHistory(this.currentNpc.id, 'user', playerMessage);

    const npc = this.currentNpc;
    const history = this._getNpcHistory(npc.id);

    let responseText;
    let actions = [];

    try {
      const result = await generateNPCDialogue(npc.systemPrompt, history, playerMessage);
      responseText = result.text;
      actions = result.actions || [];
    } catch (err) {
      console.error('Dialogue error:', err);
      const fallbacks = [
        'Interesting question. Not sure I have an answer right now.',
        'The city keeps its secrets. Maybe ask me something else.',
        'I\'d tell you, but I\'m still figuring it out myself.',
      ];
      responseText = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    this.textEl.textContent = '';
    this._addToHistory(npc.id, 'model', responseText);

    // Use typewriter for AI responses under 200 chars
    if (responseText.length <= 200) {
      this._typewriterShow(responseText);
    } else {
      this.textEl.textContent = responseText;
    }

    // Dispatch any AI-suggested actions
    this._dispatchActions(actions);

    this._showAIOptions(playerMessage);
  }

  /**
   * Dispatch game actions parsed from AI response metadata.
   */
  _dispatchActions(actions) {
    for (const action of actions) {
      switch (action.action) {
        case 'give_item':
          if (action.item_id) {
            document.dispatchEvent(new CustomEvent('npc-give-item', {
              detail: {
                npc: this.currentNpc,
                itemId: action.item_id,
                message: action.message || `${this.currentNpc?.name} hands you something.`
              }
            }));
          }
          break;

        case 'initiate_battle':
          setTimeout(() => {
            this._close();
            document.dispatchEvent(new CustomEvent('initiate-battle', {
              detail: { npc: this.currentNpc }
            }));
          }, 1500);
          // Show a warning in the dialogue
          this.textEl.textContent += '\n\n⚔️ They square up...';
          break;

        case 'emote':
          // NPC visual reaction handled by the mesh system
          document.dispatchEvent(new CustomEvent('npc-emote', {
            detail: { npc: this.currentNpc, type: action.type || 'neutral' }
          }));
          break;

        case 'npc_move':
          document.dispatchEvent(new CustomEvent('npc-move', {
            detail: {
              npc: this.currentNpc,
              x: action.x,
              z: action.z,
              message: action.message || ''
            }
          }));
          break;

        default:
          console.log('Unknown AI action:', action.action);
      }
    }
  }

  _closeAndMaybeGiveItem() {
    const npc = this.currentNpc;

    if (npc.givesItem && npc.conversationCount === 1) {
      document.dispatchEvent(new CustomEvent('npc-give-item', {
        detail: {
          npc,
          itemId: npc.givesItem.id,
          message: npc.givesItem.onGiveMessage
        }
      }));
    }

    if (npc.canBattle && npc.conversationCount >= 2) {
      document.dispatchEvent(new CustomEvent('initiate-battle', {
        detail: { npc }
      }));
    }

    this._close();
  }

  _close() {
    this._stopTypewriter();
    this.isOpen = false;
    this.box.classList.add('hidden');
    this.customInputContainer.classList.add('hidden');
    this.promptEl.classList.remove('hidden');
    this.currentNpc = null;
  }
}