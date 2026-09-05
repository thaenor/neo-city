## Question

Redesign the game UI per `threejs-game-ui-designer/references/ui-patterns.md`. Fix the "generic stat-card HUD" automatic failure.

Requirements:
- **Combat HUD**: Replace text HP numbers with animated HP bars (tweened width on damage, color shift green→yellow→red). Enemy portrait frame. Turn indicator.
- **Inventory panel**: Grid layout instead of button list. Item icons in larger cells. Quantity badges. Category headers (Consumables, Key Items).
- **Dialogue box**: NPC portrait circle frame with color-accented border. Typewriter text animation (character-by-character reveal). Styled nameplate with accent color matching NPC.
- **Interaction prompt**: Fade in/out instead of show/hide. Glow pulse on the KBD element.
- **Combat log**: Styled with colored text per event type (player action=cyan, enemy action=red, system=gray).
- **HUD health**: Tweened animated bar, not just text number. Heart icon with pulse on damage.

Files to modify:
- `index.html` — add combat-hp-bar element, inventory grid container updates, dialogue portrait frame
- `src/style.css` — complete HUD restyle with HP bars, grid layout, dialogue typewriter, combat log colors
- `src/ui/DialogueManager.js` — add typewriter text reveal, portrait frame styles
- `src/main.js` — wire HP bar tween updates, inventory grid rendering

No external dependencies — pure CSS + vanilla JS. Keep Three.js rendering untouched.