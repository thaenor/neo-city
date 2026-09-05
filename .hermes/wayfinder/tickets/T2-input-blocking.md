## Question

Block WASD movement when the player is typing in an input field (custom dialogue input). Currently, pressing W/A/S/D while using the custom input box moves the player character, breaking the typing experience.

## Requirements

1. In `GameEngine._initControls()`, check if the active element is an `<input>` or `<textarea>` before processing WASD movement keys
2. Only block `w`, `a`, `s`, `d` — allow `e`, `i`, and other keys to work normally even during typing
3. Use `document.activeElement.tagName` to detect input/textarea focus
4. The `_updatePlayer` method already checks `this.playerLocked` — add an additional check for input focus

## Implementation

In `src/engine/GameEngine.js`:

In `_updatePlayer()`:
```js
// Skip movement while typing in input fields
const isTyping = document.activeElement && 
  (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');

// Wrap the entire movement section in:
if (!isTyping) {
  // ... all movement logic ...
}
```

Keep WASD key handlers in `keys` object for other purposes — only block their effect in `_updatePlayer`.

## Acceptance
- Player can walk around using WASD normally when no input is focused
- Clicking into the custom input box and typing WASD does not move the character
- E (interact) and I (inventory) still work even during typing