## WorldEffects.js — City Reacts to Aggregate Mood

Create `src/feel/WorldEffects.js`:

Takes a `(moodSystem, engine)` reference. On each frame:
- Reads `getCityMood()` → extracts dominant axis
- Maps mood to visual parameters:

| Mood | Bloom | Sky | Fog | Neon |
|------|-------|-----|-----|------|
| Hostile (anger > 50) | 0.4 strength | Red tint (0x441111) | Red-brown fog | Red pulse |
| Neutral (trust > curiosity) | 0.15 (baseline) | Neutral night (current) | Dark blue fog | White baseline |
| Friendly (trust > 50) | 0.3 strength | Warm tint (0x224422) | Soft green fog | Cyan pulse |
| Playful (amusement > 40) | 0.5 strength | Purple tint (0x331144) | Purple fog | Pink pulse |

- Lerps transitions for smoothness (0.5s blend)
- Writes to: bloom pass strength, scene.background/fog, neon material colors
- Glitch pass optional

Exports: `WorldEffects` class with `update(delta)` method.