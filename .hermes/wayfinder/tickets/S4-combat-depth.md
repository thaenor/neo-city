## Question

Add depth to the combat system after game feel (S1) is in place. Requires the ShakeRig, hitstop, and TweenManager from `src/feel/GameFeel.js`.

Requirements:
- **Enemy variety**: 3 enemy types with distinct silhouettes and attack patterns:
  1. **Grunt** (medium) — standard attack, medium HP. Humanoid shape with simple armor.
  2. **Tank** (large) — slow heavy attack, high HP, wide body. Attacks every 2 turns instead of 1.
  3. **Scout** (small) — fast weak attack, low HP, dodges every 3rd attack. Thin frame.
- **Attack telegraphs**: Before enemy's turn, show a brief warning (screen shake 0.2 trauma, or red flash on enemy) 0.5s before damage lands.
- **Combo counter**: Each consecutive hit within 3s increments a combo multiplier (1x, 1.5x, 2x damage). Display on HUD. Resets when player is hit.
- **Defeat animation**: On enemy defeat, play a pop effect (scale 1→1.3→0, with a burst of 3 small particles flying outward).
- **Damage numbers**: Brief floating text above the target showing damage dealt "+12" that rises and fades over 600ms.

Files to modify:
- `src/combat/CombatSystem.js` — add enemy types, combo system, telegraphs, defeat anim, damage numbers
- `src/npc/NPC.js` — add enemy type definitions alongside existing NPCs
- `src/main.js` — wire combo display, damage number DOM elements

Create new file: `src/combat/EnemyTypes.js` — enemy class definitions with stats and attack patterns.