## Question

What is the complete npm/Vite project structure, Firebase Hosting config, and dependency setup needed to host a Three.js game on Firebase Hosting with Firebase Gen AI support?

## Type

task

## Blocked by

(none)

## Blocks

05-firebase-gen-ai-integration, 11-firebase-deploy-config

## Resolution

Project scaffolded and building successfully.

**Stack:**
- Vite 8.2.2 bundler (ES modules)
- Three.js 0.185.1 for 3D rendering
- Firebase 12.18.0 with Gen AI SDK (`firebase/ai`)
- Firebase Hosting configured (project: `game-test-7da9e`)

**Structure:**
```
src/
├── main.js                    # Entry point, game bootstrap, event wiring
├── style.css                  # All UI styles (HUD, dialogue, combat, inventory)
├── engine/GameEngine.js       # 3D engine: scene, renderer, camera, player, controls
├── world/CityBuilder.js       # Procedural future city (buildings, neon, lamps, sky)
├── npc/NPC.js                 # NPC class + 4 character definitions
├── combat/CombatSystem.js     # Turn-based MVP combat
├── items/Inventory.js         # Item definitions + inventory manager
├── ui/DialogueManager.js      # Dialogue UI + sessionStorage history + Gen AI bridge
└── firebase/firebase.js       # Firebase init + Gen AI call function
```

**4 NPCs created:** Nova (data runner), Kade (bounty hunter), Zara (holographic artist), Rigo (vendor)

**Build verified:** `npx vite build` → dist/ generated (610KB JS).