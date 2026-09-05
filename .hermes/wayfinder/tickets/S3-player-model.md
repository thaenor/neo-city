## Question

Replace the placeholder player character (cylinder+sphere) with an authored minimal-sci-fi character. Per `threejs-aaa-graphics-builder/references/authoring-recipes.md`:

- **Body**: Tapered torso from ExtrudeGeometry or custom BufferGeometry — hexagon cross-section, narrow waist, broad shoulders.
- **Helmet**: Faceted dome (LatheGeometry + bevel) with a V-shaped visor slit (emissive blue). Small antenna on top.
- **Arms**: Offset cylinders at shoulders with elbow joints. Color-blocked: upper arm one color, forearm another.
- **Legs**: Tapered cylinders from hip to ankle, with boots (slightly wider base).
- **Chest plate**: Armor overlay with panel lines (thin offset meshes), small glowing core on chest.
- **Backpack / jetpack**: Box with rounded edges, two small thrusters (circles with emissive inner discs).
- **Material zones**: Skin (fabric, rough), armor (metallic, moderate roughness), visor (emissive), thruster (emissive glow).
- **Collision proxy**: Keep the original capsule footprint for gameplay.

All procedurally generated — no external assets. Color scheme: deep blue armor, silver-gray joints, cyan visor/accents.

File to modify:
- `src/engine/GameEngine.js` — rewrite the `createPlayer()` method entirely

Keep the group structure and return type identical so no other code breaks.