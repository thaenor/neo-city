## Question

Is the Firebase Hosting deploy configured and working? firebase.json, .firebaserc, build script → npm run build → firebase deploy --only hosting. Verify with a test deploy.

## Type

task

## Blocked by

01-project-scaffolding, 10-npc-state-machine

## Blocks

(none — final step)

## Resolution

Deploy verified successfully.

**Hosting URL:** https://game-test-7da9e.web.app

**Build:** Vite production build → `dist/` (610KB JS + 3KB CSS + 2KB HTML)
**Deploy:** `firebase deploy --only hosting` → 4 files uploaded, version finalized, released.

**Project:** game-test-7da9e
**Console:** https://console.firebase.google.com/project/game-test-7da9e/overview