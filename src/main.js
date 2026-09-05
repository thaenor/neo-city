import { GameEngine } from './engine/GameEngine.js';
import { buildCity } from './world/CityBuilder.js';
import { NPC, NPC_DEFINITIONS } from './npc/NPC.js';
import { CombatSystem } from './combat/CombatSystem.js';
import { DialogueManager } from './ui/DialogueManager.js';
import { Inventory, ITEM_DEFINITIONS } from './items/Inventory.js';

const engine = new GameEngine('game-canvas');
const combat = new CombatSystem(engine);
const dialogue = new DialogueManager();
const inventory = new Inventory();

// --- Build World ---
buildCity(engine.scene);

// --- Create Player ---
engine.createPlayer();

// --- Spawn NPCs ---
const npcs = {};
NPC_DEFINITIONS.forEach(def => {
  const npc = new NPC(def);
  engine.addNPC(npc);
  npcs[def.id] = npc;
});

// --- Particle animation in game loop ---
engine.registerUpdateCallback((delta, time) => {
  const p = window.__gameParticles;
  if (!p) return;
  p.time += delta;
  const pos = p.positions;
  for (let i = 0; i < 600; i++) {
    // Gentle floating motion
    pos[i * 3 + 1] += Math.sin(p.time * 0.5 + i * 0.1) * delta * 0.02;
    pos[i * 3] += Math.sin(p.time * 0.3 + i * 0.05) * delta * 0.01;
    pos[i * 3 + 2] += Math.cos(p.time * 0.4 + i * 0.07) * delta * 0.01;
    // Reset if too high/low
    if (pos[i * 3 + 1] > 6) pos[i * 3 + 1] = 0.5;
    if (pos[i * 3 + 1] < 0.5) pos[i * 3 + 1] = 6;
  }
  p.particles.geometry.attributes.position.needsUpdate = true;
});

// --- Start Game Loop ---
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

// ─── NPC gives item ───
document.addEventListener('npc-give-item', (e) => {
  const { npc: giverNpc, itemId, message } = e.detail;
  inventory.add(itemId);
  const item = ITEM_DEFINITIONS[itemId];
  if (!item) return;

  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 180px; left: 50%; transform: translateX(-50%);
    background: rgba(0,0,0,0.85); color: #fff; padding: 16px 24px;
    border-radius: 8px; font-size: 16px; z-index: 1000;
    border: 1px solid rgba(255,255,255,0.2);
    animation: fadeIn 0.3s; text-align: center;
  `;
  toast.innerHTML = `${giverNpc?.name || 'NPC'} gave you:<br><b>${item.icon} ${item.name}</b> — ${item.description}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
});

// ─── NPC emote (visual reaction) ───
document.addEventListener('npc-emote', (e) => {
  const { npc, type } = e.detail;
  if (!npc || !npc.mesh) return;

  // Flash the NPC's name ring
  const ring = npc.mesh.children.find(c => c.type === 'Mesh' && c.geometry.type === 'RingGeometry');
  if (ring) {
    ring.material.emissiveIntensity = 1.0;
    setTimeout(() => { ring.material.emissiveIntensity = 0.3; }, 500);
  }

  // Brief bobbing animation
  const origY = npc.mesh.position.y;
  const bounce = type === 'happy' || type === 'surprised' ? 0.15 : 0.05;
  npc.mesh.position.y += bounce;
  setTimeout(() => { npc.mesh.position.y = origY; }, 200);
});

// ─── NPC move (AI-directed movement) ───
document.addEventListener('npc-move', (e) => {
  const { npc, x, z } = e.detail;
  if (!npc || !npc.mesh) return;

  // Simple lerp to target
  const start = npc.mesh.position.clone();
  const target = new THREE.Vector3(x, start.y, z);
  const duration = 1500;
  const startTime = performance.now();

  function animateMove() {
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    const smooth = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease in-out
    npc.mesh.position.lerpVectors(start, target, smooth);
    if (t < 1) requestAnimationFrame(animateMove);
  }
  animateMove();
});

// ─── Combat ───
document.addEventListener('initiate-battle', (e) => {
  combat.startCombat(e.detail.npc);
});

document.addEventListener('combat-start', () => {
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

document.querySelectorAll('.combat-btn').forEach(btn => {
  btn.addEventListener('click', () => { combat.playerAction(btn.dataset.action); });
});

document.addEventListener('combat-use-item', (e) => {
  const usable = inventory.getUsable();
  if (usable.length === 0) {
    document.getElementById('combat-log').innerHTML += '<br>No usable items!';
    return;
  }
  const item = usable[0];
  e.detail.combat.useItem(item);
  inventory.remove(item.id);
});

// ─── Inventory ───
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

// ─── Toaster style ───
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
`;
document.head.appendChild(style);

console.log(`🚀 AI Experimental Game initialized
  - ${NPC_DEFINITIONS.length} NPCs with Gen AI personalities
  - Custom text input for dialogue
  - AI action metadata (give items, battle, emotes, moves)
  - Procedural city with particles, billboards, neon trees`);