## Question

Add game feel (juice) to the combat system and moment-to-moment gameplay. Based on `threejs-gameplay-systems/references/game-feel.md`:
- **Trauma-based screenshake** on hit, pickup, explosion events. Decay at 1.4/s, squared curve, MAX_OFFSET 0.55, per-axis deterministic noise.
- **Hitstop** on heavy combat hits: 60-90ms freeze at 0.05 time scale on gameplay delta only. Camera/shake/HUD run at real delta.
- **Impact flash** on enemy materials on hit. Pulse emissiveIntensity from peak 2.4 back to base over 220ms.
- **Pickup pop** when items are collected: scale 1.6→1.0, rise 1.2 units, fade opacity, over 280ms. Punch HUD counter.
- **FOV punch** of +4-8° on damage/boost, decay with 200ms time constant.
- **Squash-and-stretch** on combat impacts: 0.85 squashY over 180ms with easeOutBack overshoot.

Files to modify:
- `src/combat/CombatSystem.js` — add ShakeRig, hitstop calls, impact flash, FOV punch on hit and defeat
- `src/engine/GameEngine.js` — add `registerUpdateCallback` already exists, wire ShakeRig into the loop, expose camera for FOV punch
- `src/main.js` — add pickup pop on npc-give-item event, wire shake to combat-hit events

Create a new file: `src/feel/GameFeel.js` — contains ShakeRig, TweenManager, hitstop helpers as copy-pasteable classes from the reference.

Keep the existing combat numbers (player.attack=12, etc.) — only add feel on top.