## Destination

Upgrade the AI Experimental Future City game from prototype (~0.85 visual scorecard average) to polished premium quality (≥2.0 average) across game feel, UI, player model, combat depth, and visual polish.

## Notes

- Working in `~/dev/ai-experimental-game/`
- Deployed via Firebase Hosting at https://game-test-7da9e.web.app
- Three.js 0.185, Vite 8, Firebase 12, vanilla JS (no TypeScript)
- The scorecard at `threejs-aaa-graphics-builder/references/visual-scorecard.md` defines the bar
- Game feel reference at `threejs-gameplay-systems/references/game-feel.md`
- UI patterns at `threejs-game-ui-designer/references/ui-patterns.md`
- Authoring recipes at `threejs-aaa-graphics-builder/references/authoring-recipes.md`
- Sub-agents run `openrouter/pareto-code` for cost-efficient coding
- Review agents run same model as me for quality verification
- All work goes to feature branches, then I merge and deploy

## Decisions so far

<!-- filled on close -->

## Tickets

| Ticket | Status | Type | 
|--------|--------|------|
| [S1 Game Feel (screenshake, hitstop, flash, pickup pop, FOV punch)](tickets/S1-game-feel.md) | ✅ Closed | Gameplay |
| [S2 UI Redesign (combat HUD, inventory grid, dialogue panel)](tickets/S2-ui-redesign.md) | ✅ Closed | UI |
| [S3 Player Model Upgrade (faceted character, armor, weapon)](tickets/S3-player-model.md) | ✅ Closed | Graphics |
| [S4 Combat Depth (enemy types, telegraphs, defeat anim, combo)](tickets/S4-combat-depth.md) | ✅ Closed | Gameplay |
| [S5 Post-Processing & Lighting (bloom, vignette, FOV tuning)](tickets/S5-post-processing.md) | ✅ Closed | Graphics |
| [S6 Review & Merge Pass](tickets/S6-review.md) | ✅ Closed | QA |