## Destination

A polished, deployable 3D third-person game (Three.js, browser) set in a compact future city. The layout is a flat grid of 2 parallel × 2 perpendicular streets with a central plaza. 4 NPCs (2 friendly, 2 hostile) with AI-driven personalities via Firebase Gen AI. Battle system works end-to-end. CI/CD via GitHub Actions. Clear story: "Neo City — a corporate ghost town where the player must gather allies and fight rogue AI enforcers to uncover the truth about the Collapse."

## Decisions so far

- City is a FLAT layout (no elevation tiers). All buildings/NPCs on same ground.
- Layout: 2 parallel streets (east-west) × 2 perpendicular streets (north-south). Central plaza at intersection.
- 4 NPCs: Nova (friendly, data runner), Zara (friendly, holographic artist), Kade (hostile, ex-corp bounty hunter), Rigo (friendly turned hostile test — or 2 hostile: Kade + a new rogue enforcer)
- Git remote: https://github.com/thaenor/neo-city.git
- CI/CD: GitHub Actions → Firebase Hosting on push to main
- WASD blocked during input focus
- Testing: simple smoke test script + manual QA checklist
- Three.js game skills available at ~/Dev/threejs-game-skills/ for shaders/assets

## Tickets (descending priority)

| Ticket | Status | Blocked By |
|--------|--------|-----------|
| [T1 Redesign City Layout — Flat Grid](tickets/T1-city-layout.md) | ✅ Closed | — |
| [T2 Fix Input — Block WASD While Typing](tickets/T2-input-blocking.md) | ✅ Closed | — |
| [T3 Fix Battle System End-to-End](tickets/T3-battle-system.md) | ✅ Closed | T2 |
| [T4 Fix Item Menu / Inventory Panel](tickets/T4-item-menu.md) | ✅ Closed | — |
| [T5 City Visual Polish — Shaders & Assets](tickets/T5-visual-polish.md) | ✅ Closed | T1 |
| [T6 Lock In Storyline & NPC Roles](tickets/T6-storyline.md) | ✅ Closed | — |
| [T7 Git Remote + GitHub Actions CI/CD](tickets/T7-git-cicd.md) | ✅ Closed | — |
| [T8 Testing Structure / QA Workflow](tickets/T8-testing.md) | ✅ Closed | — |