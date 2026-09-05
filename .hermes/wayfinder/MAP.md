## Destination

A deployable 3D third-person Pokémon-like game (Three.js, browser) with AI-driven NPCs powered by Firebase Gen AI — deployed via Firebase Hosting. Playable MVP with: player roaming a future city, talking to NPCs (each with unique backstory/personality → Gen AI responses), NPCs initiating battles or giving items, basic combat, basic inventory. Placeholder assets OK.

## Notes

- **Three.js** for 3D rendering (no Unity/Unreal)
- **Firebase Gen AI** (Vertex AI via Firebase) for NPC dialogue generation
- **Vite** as the build tool
- **SessionStorage** for conversation history
- Local git only (no remote for now)
- All assets are placeholder/procedural geometry — no custom 3D models
- All generated in `~/dev/ai-experimental-game/`
- Domain: third-person 3D, AI dialogue, turn-based combat, item inventory

## Decisions so far

- [01 Project Scaffolding](tickets/01-project-scaffolding.md): Vite + Three.js + Firebase 12.18 + Hosting config. Build verified.
- [02 City Environment](tickets/02-city-environment.md): Procedural future city with buildings, neon lamps, grid, fog, starfield sky.
- [03 Character Controller](tickets/03-character-controller.md): WASD movement, mouse-look orbit cam, pointer lock, building grid collision ready.
- [04 NPC Base System](tickets/04-npc-base-system.md): NPC class with mesh, proximity detection, interaction trigger (E key).
- [05 Firebase Gen AI Integration](tickets/05-firebase-gen-ai-integration.md): `firebase/ai` SDK wired, `generateNPCDialogue()` with system prompt + history.
- [06 Conversation UI & Session Storage](tickets/06-conversation-ui-session-storage.md): Dialogue box, choice buttons, sessionStorage history, scripted → AI transition.
- [07 NPC Personalities & Backstories](tickets/07-npc-personalities-backstories.md): 4 NPCs (Nova, Kade, Zara, Rigo) with full backstory, system prompts, items.
- [08 MVP Combat System](tickets/08-mvp-combat-system.md): Turn-based combat with attack/defend/item, HP bars, win/lose conditions.
- [09 MVP Item System](tickets/09-mvp-item-system.md): 5 item types (health potion, shield token, info chip, memory fragment, repair kit), inventory add/remove/use.
- [10 NPC State Machine](tickets/10-npc-state-machine.md): Scripted intro → AI dialogue → battle trigger (Kade) / item giving flow.

## Tickets

| Ticket | Status | Blocked By |
|--------|--------|-----------|
| [01 Project Scaffolding](tickets/01-project-scaffolding.md) | ✅ Closed | — |
| [02 City Environment](tickets/02-city-environment.md) | ✅ Closed | — |
| [03 Character Controller](tickets/03-character-controller.md) | ✅ Closed | 02 |
| [04 NPC Base System](tickets/04-npc-base-system.md) | ✅ Closed | 02 |
| [05 Firebase Gen AI Integration](tickets/05-firebase-gen-ai-integration.md) | ✅ Closed | 01 |
| [06 Conversation UI & Session Storage](tickets/06-conversation-ui-session-storage.md) | ✅ Closed | 04, 05 |
| [07 NPC Personalities & Backstories](tickets/07-npc-personalities-backstories.md) | ✅ Closed | 05 |
| [08 MVP Combat System](tickets/08-mvp-combat-system.md) | ✅ Closed | 03, 06 |
| [09 MVP Item System](tickets/09-mvp-item-system.md) | ✅ Closed | 04 |
| [10 NPC State Machine](tickets/10-npc-state-machine.md) | ✅ Closed | 06, 08, 09 |
| [11 Firebase Deploy Config](tickets/11-firebase-deploy-config.md) | 🔵 Open | 01, 10 |

## Not yet specified

- **Art / visual polish**: what style of placeholder to use (low-poly, geometric, cel-shaded wireframe) and any post-processing
- **Sound / music**: no requirement yet, could add minimal ambient or SFX
- **Multiplayer / persistence**: single-player only confirmed; save/load state not yet specified
- **Combat depth**: MVP means basic attack + enemy attack; no elements/types/status effects yet, but the design of what "basic" means needs resolution
- **Item types**: health potion minimum; what else (buff items, catch items?) undecided
- **City layout / scale**: number of buildings, NPC count, map boundaries
- **Firebase Gen AI exact API**: whether to use REST or Firebase Gen Kit SDK; model selection (Gemini 1.5/2.0)

## Out of scope

- Custom 3D models / animations (placeholder geometry only)
- Multiplayer or online features
- Sound design / music
- Save/load game state persistence across sessions
- Pokémon-style creature collection / catching
- Story quests / narrative arc
- Mobile/responsive support — desktop browser only