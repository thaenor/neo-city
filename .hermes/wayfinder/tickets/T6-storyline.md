## Question

Lock in a concise, cohesive storyline so the game has narrative context. The setting is "Neo City" — a post-collapse corporate ghost town.

## Story Premise

**Title:** Neo City Reckoning

**Setting:** Neo City, year 2187. OmniCorp abandoned the city 10 years ago after a catastrophic AI uprising known as "the Collapse." The city now runs on leftover neural networks, rogue AI fragments, and salvaged tech. A new power — the "Protocol" — is trying to restore OmniCorp's control.

**Player Role:** A scavenger who just arrived in Neo City, drawn by rumors of a hidden data cache that could expose the truth about the Collapse.

**Main Quest:** Find 3 data fragments hidden across the city to unlock the central tower's core and expose the Protocol. Each friendly NPC holds clues to a fragment.

**NPC Roles:**

| NPC | Role | Friendly? | Gives | Notes |
|-----|------|-----------|-------|-------|
| Nova | Data runner | ✅ | Info Chip + clue to Zara's fragment | First NPC player meets, introduces the Underwire |
| Zara | Holographic artist | ✅ | Memory Fragment (healing) + clue to final fragment | Provides lore about the Collapse |
| Kade | Ex-corp bounty hunter | ❌ Hostile | Shield Token (on defeat) | Tests the player, fight or earn respect |
| Rigo | Street vendor | ❌ → Neutral | Repair Kit (on defeat or trade) | Refuses to help initially, fights if pushed |

**Resolution:** Player collects all fragments → uploads to central tower → Protocol is exposed → city is freed → end credits.

## Key Files to Update

`src/npc/NPC.js` — update NPC_DEFINITIONS with story-aligned backstories and system prompts. Kade and Rigo should be fightable (both `canBattle: true`).

`src/ui/DialogueManager.js` — add story-progression-aware dialogue choices.

## Acceptance
- Storyline is documented and referenced by all NPC system prompts
- NPC dialogue reflects their role in the story
- Collecting all items from friendly NPCs marks progression toward the endgame