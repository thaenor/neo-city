import { GameEngine } from './engine/GameEngine.js';
import { buildCity } from './world/CityBuilder.js';
import { NPC, NPC_DEFINITIONS } from './npc/NPC.js';
import { CombatSystem } from './combat/CombatSystem.js';
import { DialogueManager } from './ui/DialogueManager.js';
import { Inventory, ITEM_DEFINITIONS } from './items/Inventory.js';
import { GameFeel, popElement } from './feel/GameFeel.js';
import * as THREE from 'three';

const engine = new GameEngine('game-canvas');
const combat = new CombatSystem(engine);
const dialogue = new DialogueManager();
const inventory = new Inventory();
const feel = new GameFeel();

// Wire game feel into engine and combat
engine.setFeelInstances(feel);
combat.setFeel(feel);

// ─── Build World ───
buildCity(engine.scene);

// ─── Create Player ───
engine.createPlayer();

// ─── Spawn NPCs ───
const npcs = {};
NPC_DEFINITIONS.forEach(def => {
  const npc = new NPC(def);
  engine.addNPC(npc);
  npcs[def.id] = npc;
});

// ─── Start Game Loop ───
engine.start();
document.getElementById('hud').classList.remove('hidden');
document.getElementById('interaction-prompt').classList.remove('hidden');

// ─── NPC interaction prompts ───
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

// ─── Dialogue lock/unlock player movement ───
document.addEventListener('dialogue-open', () => {
  engine.setPlayerLock(true);
});
document.addEventListener('dialogue-close', () => {
  engine.setPlayerLock(false);
});

// ─── NPC gives item ───
document.addEventListener('npc-give-item', (e) => {
  const { npc: giverNpc, itemId } = e.detail;
  inventory.add(itemId);
  const item = ITEM_DEFINITIONS[itemId];
  if (!item) return;

  const toastContainer = document.getElementById('toast-container') || document.body;
  const toast = document.createElement('div');
  toast.className = 'item-toast';
  toast.innerHTML = `
    <span class="toast-icon">${item.icon}</span>
    <div class="toast-info">
      <span class="toast-title">${item.name}</span>
      <span class="toast-desc">${item.description}</span>
    </div>
  `;
  toast.style.cssText = `
    display: flex; align-items: center; gap: 12px;
    position: fixed; bottom: 180px; left: 50%; transform: translateX(-50%);
    background: rgba(0,0,0,0.88); color: #fff; padding: 14px 24px;
    border-radius: 10px; z-index: 1000;
    border: 1px solid rgba(255,255,255,0.15);
    backdrop-filter: blur(8px);
    min-width: 240px;
  `;
  toastContainer.appendChild(toast);
  popElement(toast);
  setTimeout(() => toast.remove(), 3500);
});

// ─── NPC emote ───
document.addEventListener('npc-emote', (e) => {
  const { npc, type } = e.detail;
  if (!npc || !npc.mesh) return;
  const ring = npc.mesh.children.find(c => c.type === 'Mesh' && c.geometry.type === 'RingGeometry');
  if (ring) {
    ring.material.emissiveIntensity = 1.0;
    setTimeout(() => { ring.material.emissiveIntensity = 0.3; }, 500);
  }
  const origY = npc.mesh.position.y;
  const bounce = type === 'happy' || type === 'surprised' ? 0.15 : 0.05;
  npc.mesh.position.y += bounce;
  setTimeout(() => { npc.mesh.position.y = origY; }, 200);
});

// ─── NPC move ───
document.addEventListener('npc-move', (e) => {
  const { npc, x, z } = e.detail;
  if (!npc || !npc.mesh) return;
  const start = npc.mesh.position.clone();
  const target = new THREE.Vector3(x, start.y, z);
  const duration = 1500;
  const startTime = performance.now();
  function animateMove() {
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    const smooth = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    npc.mesh.position.lerpVectors(start, target, smooth);
    if (t < 1) requestAnimationFrame(animateMove);
  }
  animateMove();
});

// ─── Combat telegraphs ───
document.addEventListener('combat-telegraph', (e) => {
  const { type } = e.detail;
  // Flash the enemy HP bar red as warning
  if (enemyHpFill) {
    enemyHpFill.style.transition = 'background 0.1s';
    enemyHpFill.style.background = '#ff4444';
    setTimeout(() => {
      enemyHpFill.style.transition = '';
      enemyHpFill.style.background = '';
    }, 300);
  }
  // Extra shake for heavy telegraph
  if (type === 'quake' && feel) {
    feel.addTrauma(0.3);
  }
});

// ─── Defeat animation ───
document.addEventListener('defeat-animation', (e) => {
  const overlay = document.getElementById('combat-overlay');
  if (!overlay) return;
  // Create burst particles
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: absolute; width: 6px; height: 6px; border-radius: 50%;
      background: #ff6644; pointer-events: none; z-index: 100;
      left: 50%; top: 35%;
      box-shadow: 0 0 6px rgba(255,102,68,0.8);
    `;
    overlay.appendChild(particle);
    const angle = (i / 8) * Math.PI * 2;
    const dist = 60 + Math.random() * 40;
    particle.animate([
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px)) scale(0)`, opacity: 0 },
    ], { duration: 600, easing: 'ease-out' }).onfinish = () => particle.remove();
  }
});
document.addEventListener('initiate-battle', (e) => {
  combat.startCombat(e.detail.npc);
});

// DOM refs for combat UI
const hpBarFill = document.getElementById('hp-bar-fill');
const hpValueText = document.getElementById('health-value-text') || document.getElementById('health-value');
const enemyHpFill = document.getElementById('enemy-hp-bar-fill');
const enemyHpValue = document.getElementById('enemy-hp');
const enemyMaxHp = document.getElementById('enemy-max-hp');
const enemyNameEl = document.getElementById('enemy-name');
const playerCombatHpFill = document.getElementById('player-hp-bar-fill');
const playerCombatHpVal = document.getElementById('player-combat-hp-val');
const combatLog = document.getElementById('combat-log');
const combatBtns = document.querySelectorAll('.combat-btn');
const comboDisplay = document.getElementById('combo-display');
const comboCountEl = document.getElementById('combo-count');

document.addEventListener('combat-start', () => {
  document.getElementById('combat-overlay').classList.remove('hidden');
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('interaction-prompt').classList.add('hidden');
  if (comboDisplay) comboDisplay.classList.add('hidden');
});

document.addEventListener('combat-update', (e) => {
  const { enemy, player, turn, log, combo } = e.detail;

  // Enemy info
  if (enemyNameEl) enemyNameEl.textContent = enemy.name;
  if (enemyHpValue) enemyHpValue.textContent = enemy.hp;
  if (enemyMaxHp) enemyMaxHp.textContent = enemy.maxHp;
  if (enemyHpFill) {
    const pct = (enemy.hp / enemy.maxHp) * 100;
    enemyHpFill.style.width = `${pct}%`;
    enemyHpFill.className = 'hp-bar-fill ' + (pct > 80 ? 'hp-high' : pct > 30 ? 'hp-mid' : 'hp-low');
  }

  // Player combat HP
  if (playerCombatHpVal) playerCombatHpVal.textContent = player.hp;
  if (playerCombatHpFill) {
    const pct = (player.hp / player.maxHp) * 100;
    playerCombatHpFill.style.width = `${pct}%`;
    playerCombatHpFill.className = 'hp-bar-fill ' + (pct > 80 ? 'hp-high' : pct > 30 ? 'hp-mid' : 'hp-low');
  }

  // HUD health bar
  if (hpBarFill) {
    const pct = (player.hp / player.maxHp) * 100;
    hpBarFill.style.width = `${pct}%`;
    hpBarFill.className = 'hp-bar-fill ' + (pct > 80 ? 'hp-high' : pct > 30 ? 'hp-mid' : 'hp-low');
  }
  if (hpValueText) {
    hpValueText.textContent = `${player.hp}/${player.maxHp}`;
  }

  // Combat log
  if (combatLog) {
    combatLog.innerHTML = log.slice(-4).join('<br>');
  }

  // Combo display
  if (comboDisplay && comboCountEl) {
    if (combo > 0) {
      comboDisplay.classList.remove('hidden');
      comboCountEl.textContent = combo;
      comboDisplay.classList.remove('combo-pulse');
      void comboDisplay.offsetWidth; // reset animation
      comboDisplay.classList.add('combo-pulse');
    } else {
      comboDisplay.classList.add('hidden');
    }
  }

  // Turn buttons
  combatBtns.forEach(btn => {
    btn.disabled = turn !== 'player';
    btn.style.opacity = turn === 'player' ? '1' : '0.5';
  });
});

document.addEventListener('combat-end', () => {
  document.getElementById('combat-overlay').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('interaction-prompt').classList.remove('hidden');
  if (comboDisplay) comboDisplay.classList.add('hidden');
});

combatBtns.forEach(btn => {
  btn.addEventListener('click', () => { combat.playerAction(btn.dataset.action); });
});

document.addEventListener('combat-use-item', (e) => {
  const usable = inventory.getUsable();
  if (usable.length === 0) {
    if (combatLog) combatLog.innerHTML += '<br>No usable items!';
    return;
  }
  const item = usable[0];
  e.detail.combat.useItem(item);
  inventory.remove(item.id);
});

// ─── Damage numbers ───
document.addEventListener('damage-number', (e) => {
  const { amount, type } = e.detail;
  const overlay = document.getElementById('combat-overlay');
  if (!overlay) return;
  const el = document.createElement('div');
  el.className = `dmg-num dmg-${type}`;
  const sign = type === 'player' ? '' : '-';
  el.textContent = `${sign}${amount}`;
  el.style.cssText = `
    position: absolute; font-size: 24px; font-weight: 700;
    color: ${type === 'player' ? '#5fd6ff' : '#ff6b6b'};
    text-shadow: 0 0 8px ${type === 'player' ? 'rgba(95,214,255,0.5)' : 'rgba(255,107,107,0.5)'};
    pointer-events: none; z-index: 100;
    left: 50%; top: ${type === 'player' ? '60%' : '30%'};
    transform: translateX(-50%);
  `;
  overlay.appendChild(el);
  el.animate([
    { transform: 'translateX(-50%) translateY(0)', opacity: 1 },
    { transform: 'translateX(-50%) translateY(-40px)', opacity: 0 },
  ], { duration: 800, easing: 'ease-out' }).onfinish = () => el.remove();
});

// ─── Inventory ───
document.addEventListener('toggle-inventory', () => {
  const panel = document.getElementById('inventory-panel');
  if (panel.classList.contains('hidden')) {
    const items = inventory.getAll();
    const container = document.getElementById('inventory-items');
    container.innerHTML = '';
    if (items.length === 0) {
      container.innerHTML = '<p style="color:#666; padding: 12px; text-align: center;">Empty inventory.</p>';
    } else {
      items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'inv-card';
        card.innerHTML = `
          <span class="inv-icon">${item.icon}</span>
          <span class="inv-name">${item.name}</span>
          <span class="inv-qty">×${item.quantity}</span>
        `;
        container.appendChild(card);
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

// ─── Toast style injection ───
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
  .item-toast .toast-info { display: flex; flex-direction: column; gap: 2px; }
  .item-toast .toast-title { font-weight: 600; font-size: 15px; }
  .item-toast .toast-desc { font-size: 12px; color: rgba(255,255,255,0.6); }
  .item-toast .toast-icon { font-size: 24px; }
`;
document.head.appendChild(style);

console.log(`🚀 AI Experimental Game — Refined
  - ${NPC_DEFINITIONS.length} NPCs with Gen AI personalities
  - Custom text input + typewriter dialogue
  - AI action metadata (give items, battle, emotes, moves)
  - Game feel: screenshake, hitstop, impact flash, FOV punch
  - Turn-based combat with combo system
  - Redesigned HUD with HP bars, combo display, grid inventory
  - Detailed player character (faceted armor, jetpack, glowing visor)`);