## MoodSystem.js — Per-NPC Mood Vector + Aggregate City Mood

Create `src/feel/MoodSystem.js`:

- Each NPC has a mood vector: `{ trust: 50, anger: 10, curiosity: 30, amusement: 10 }` (0-100)
- `getMoodLabel(npcId)` → 'hostile' | 'neutral' | 'friendly' | 'playful' based on dominant axis
- `applyDelta(npcId, deltas)` — e.g. `{ trust: +15, amusement: +10 }`
- `getCityMood()` → average of all NPC moods — drives world effects
- `getMemory(npcId)` — last 5 player interactions with that NPC (for Gen AI context)
- `recordInteraction(npcId, playerText, npcResponse)` — append to memory
- All persisted in-memory (reset on page reload — fine for POC)

Exports: `MoodSystem` class

Acceptance: Unit-testable, clean API, the 4 mood axes are human-readable.