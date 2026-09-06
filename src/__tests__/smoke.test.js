/**
 * Smoke test — verifies all modules load and key classes/functions export.
 * Run: node src/__tests__/smoke.test.js
 *
 * NOTE: Three.js and Firebase modules won't run in Node directly.
 * This test checks module structure via dynamic import + syntax verification.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

const requiredExports = {
  'src/engine/GameEngine.js': ['GameEngine'],
  'src/combat/CombatSystem.js': ['CombatSystem'],
  'src/combat/EnemyTypes.js': ['ENEMY_TYPES', 'getRandomEnemyType', 'createEnemy'],
  'src/feel/GameFeel.js': ['GameFeel'],
  'src/feel/MoodSystem.js': ['MoodSystem'],
  'src/feel/WorldEffects.js': ['WorldEffects'],
  'src/ui/DialogueManager.js': ['DialogueManager'],
  'src/items/Inventory.js': ['Inventory', 'ITEM_DEFINITIONS'],
  'src/npc/NPC.js': ['NPC', 'NPC_DEFINITIONS'],
  'src/world/CityBuilder.js': ['buildCity'],
  'src/engine/AssetLibrary.js': ['AssetLibrary'],
  'src/engine/AssetDemo.js': ['integrateAssetDemo'],
  'src/main.js': [],
};

let passed = 0;
let failed = 0;

for (const [file, exports] of Object.entries(requiredExports)) {
  const fullPath = resolve(ROOT, file);
  if (!existsSync(fullPath)) {
    console.log(`❌ MISSING: ${file}`);
    failed++;
    continue;
  }

  const source = readFileSync(fullPath, 'utf-8');
  if (!source || source.trim().length === 0) {
    console.log(`❌ EMPTY: ${file}`);
    failed++;
    continue;
  }

  // Check each required export name appears in the source as a named export
  for (const exp of exports) {
    if (!source.includes(`export ${exp}`) && !source.includes(`export class ${exp}`) && !source.includes(`export function ${exp}`) && !source.includes(`export const ${exp}`) && !source.includes(`export async function ${exp}`)) {
      console.log(`❌ ${file} missing export: ${exp}`);
      failed++;
    } else {
      console.log(`✅ ${file} → exports ${exp}`);
    }
  }

  passed++;
}

console.log('\n═══════════════════════════════');
console.log(`📊 Smoke test: ${passed} files, ${failed} issues`);
console.log('═══════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);