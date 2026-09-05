import { GameEngine } from './engine/GameEngine.js';
import { buildCity } from './world/CityBuilder.js';
import { NPC, NPC_DEFINITIONS } from './npc/NPC.js';
import { CombatSystem } from './combat/CombatSystem.js';
import { DialogueManager } from './ui/DialogueManager.js';
import { Inventory, ITEM_DEFINITIONS } from './items/Inventory.js';

/**
 * AI Experimental Game — Main Entry Point.
 * Third-person Pokémon-like game set in a future city
 * with Firebase Gen AI-powered NPCs.
 */

// --- Bootstrap ---
const engine = new GameEngine('game-canvas');
const combat = new CombatSystem(engine);
const dialogue = new DialogueManager();
const inventory = new Inventory();

// --- Build World ---
buildCity(engine.scene);

// --- Create Player ---
engine.createPlayer();

// --- Spawn NPCs ---
NPC_DEFINITIONS.forEach(def => {
  const npc = new NPC(def);
  engine.addNPC(npc);
});

// --- Start Game Loop ---
engine.start();
document.getElementById('hud').classList.remove('hidden');
document.getElementById('interaction-prompt').classList.remove('hidden');

// --- Event Wiring ---

// NPC near/far proximity prompts
document.addEventListener('npc-near', (e) => {
  const prompt = document.getElementById('interaction-prompt');
  prompt.innerHTML = `Press <kbd>E</kbd> to talk to <b>${e.detail.npc.name}</b>`;
  prompt.classList.remove('hidden');
});

document.addEventListener('npc-far', () => {
  const prompt = document.getElementById('interaction-prompt');
  prompt.innerHTML = `Press <kbd>E</kbd> to interact`;
  prompt.classList.add('hidden');
});

// NPC gives item
document.addEventListener('npc-give-item', (e) => {
  const { npc, itemId, message } = e.detail;
  inventory.add(itemId);
  const item = ITEM_DEFINITIONS[itemId];
  // Show toast notification
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 180px; left: 50%; transform: translateX(-50%);
    background: rgba(0,0,0,0.85); color: #fff; padding: 16px 24px;
    border-radius: 8px; font-size: 16px; z-index: 1000;
    border: 1px solid rgba(255,255,255,0.2);
    animation: fadeIn 0.3s;
  `;
  toast.textContent = `${npc.name} gave you: ${item.icon} ${item.name}!`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
});

// Combat initiation
document.addEventListener('initiate-battle', (e) => {
  combat.startCombat(e.detail.npc);
});

// Combat UI updates
document.addEventListener('combat-start', (e) => {
  document.getElementById('combat-overlay').classList.remove('hidden');
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('interaction-prompt').classList.add('hidden');
});

document.addEventListener('combat-update', (e) => {
  const { enemy, player, turn, log } = e.detail;
  document.getElementById('enemy-name').textContent = enemy.name;
  document.getElementById('enemy-hp').textContent = enemy.hp;
  document.getElementById('enemy-max-hp').textContent = enemy.maxHp;
  document.getElementById('player-combat-hp-val').textContent = player.hp;
  document.getElementById('combat-log').innerHTML = log.slice(-4).join('<br>');
  document.getElementById('health-value').textContent = player.hp;

  // Disable/enable combat buttons based on turn
  document.querySelectorAll('.combat-btn').forEach(btn => {
    btn.disabled = turn !== 'player';
    btn.style.opacity = turn === 'player' ? '1' : '0.5';
  });
});

document.addEventListener('combat-end', () => {
  document.getElementById('combat-overlay').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('interaction-prompt').classList.remove('hidden');
});

// Combat buttons
document.querySelectorAll('.combat-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    combat.playerAction(btn.dataset.action);
  });
});

// Combat item usage
document.addEventListener('combat-use-item', (e) => {
  const usable = inventory.getUsable();
  if (usable.length === 0) {
    const log = document.getElementById('combat-log');
    log.innerHTML += '<br>No usable items!';
    return;
  }

  // Auto-use first usable item for MVP
  const item = usable[0];
  e.detail.combat.useItem(item);
  inventory.remove(item.id);
});

// Item consumed event
document.addEventListener('item-consumed', (e) => {
  // check if item is still in inventory
});

// Health update
document.addEventListener('combat-update', (e) => {
  document.getElementById('health-value').textContent = e.detail.player.hp;
});

// Inventory toggle
document.addEventListener('toggle-inventory', () => {
  const panel = document.getElementById('inventory-panel');
  if (panel.classList.contains('hidden')) {
    const items = inventory.getAll();
    const container = document.getElementById('inventory-items');
    container.innerHTML = '';
    if (items.length === 0) {
      container.innerHTML = '<p style="color:#666; padding: 12px;">Empty inventory.</p>';
    } else {
      items.forEach(item => {
        const btn = document.createElement('button');
        btn.textContent = `${item.icon} ${item.name} ×${item.quantity}`;
        container.appendChild(btn);
      });
    }
    panel.classList.remove('hidden');
  } else {
    panel.classList.add('hidden');
  }
});

document.getElementById('inventory-close').addEventListener('click', () => {
  document.getElementById('inventory-panel').classList.add('hidden');
});

// Startup message
console.log(`🚀 AI Experimental Game initialized
  - Player at center of future city
  - ${NPC_DEFINITIONS.length} NPCs with Gen AI personalities
  - Turn-based combat system ready
  - ${inventory.count()} items in inventory`);