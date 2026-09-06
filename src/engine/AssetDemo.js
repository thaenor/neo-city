import * as THREE from 'three';
import { AssetLibrary } from './AssetLibrary.js';

/**
 * integrateAssetDemo
 * ──────────────────
 * Demo integration of @pmndrs/assets on top of the existing scene.
 * Runs AFTER engine.start() so it never blocks the existing Preetham sky or
 * city build. Loads the city.exr HDRI → applies it as:
 *   1. PMREM environment map (drives PBR reflections on every material)
 *   2. GroundedSkybox background (replaces the black void behind the city)
 * Plus spawns the suzi.glb model as a decorative prop in the central plaza.
 *
 * Failures are logged but never thrown — the game keeps running on the
 * procedural sky if the assets can't be decoded.
 *
 * @param {import('./GameEngine.js').GameEngine} engine
 */
export async function integrateAssetDemo(engine) {
  const lib = new AssetLibrary();

  // ─── HDRI: city.exr ──────────────────────────────────────────────────────
  let envMap = null;
  try {
    const equirect = await lib.loadHDRI('city');
    envMap = lib.toEnvMap(equirect, engine.renderer);
    engine.scene.environment = envMap;
    console.log('🌆 @pmndrs/assets: city.exr loaded → scene.environment set');

    // Replace the flat background with a GroundedSkybox so the player sees
    // a real horizon instead of void. Positioned to match the player's eye
    // height (camera starts at y=6) so the floor of the sphere sits on y=0.
    const skybox = lib.buildGroundedSkybox(equirect, 6, 450);
    engine.scene.add(skybox);
    // Keep the Preetham Sky dome — it adds atmospheric scattering above the
    // horizon. GroundedSkybox covers the ground plane below.
    console.log('🌅 @pmndrs/assets: GroundedSkybox added at y=6');
  } catch (err) {
    console.warn('⚠️ @pmndrs/assets HDRI load failed (continuing without it):', err.message);
    return;
  }

  // ─── Model: suzi.glb as a plaza prop ─────────────────────────────────────
  try {
    const suzi = await lib.loadModel('suzi');
    suzi.name = 'pmndrs-suzi-prop';

    // Auto-scale to ~2 units tall and centre on origin
    const box = new THREE.Box3().setFromObject(suzi);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim;
    suzi.scale.setScalar(scale);
    box.setFromObject(suzi);
    const center = box.getCenter(new THREE.Vector3());
    suzi.position.set(-center.x, -box.min.y, -center.z);

    // Drop it in the central plaza so it doesn't conflict with NPCs/buildings
    suzi.position.x += 4;
    suzi.position.z += 4;
    suzi.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
        // Apply our envMap so the prop reflects the new HDRI cityscape
        if (c.material && 'envMap' in c.material) c.material.envMap = envMap;
      }
    });

    engine.scene.add(suzi);
    console.log('🗿 @pmndrs/assets: suzi.glb added to central plaza');
  } catch (err) {
    console.warn('⚠️ @pmndrs/assets model load failed (continuing without it):', err.message);
  }
}