import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GroundedSkybox } from 'three/examples/jsm/objects/GroundedSkybox.js';

// CC0-1.0 licensed assets bundled as base64 data URIs — zero network cost.
// Static imports let Vite tree-shake + emit one chunk per asset.
import cityHDR from '@pmndrs/assets/hdri/city.exr.js';
import dawnHDR from '@pmndrs/assets/hdri/dawn.exr.js';
import nightHDR from '@pmndrs/assets/hdri/night.exr.js';
import sunsetHDR from '@pmndrs/assets/hdri/sunset.exr.js';
import skyHDR from '@pmndrs/assets/hdri/sky.exr.js';
import forestHDR from '@pmndrs/assets/hdri/forest.exr.js';
import suziGLB from '@pmndrs/assets/models/suzi.glb.js';
import bunnyGLB from '@pmndrs/assets/models/bunny.glb.js';
import pmndrsGLB from '@pmndrs/assets/models/pmndrs.glb.js';

/**
 * AssetLibrary
 * ────────────
 * Lazy loader for the @pmndrs/assets CC0 collection (HDRIs, GLBs, textures).
 *
 * All assets ship as base64 data URIs and are decoded on demand. The first
 * load takes a moment because of base64 → ArrayBuffer conversion; subsequent
 * calls hit the in-memory cache.
 *
 * Usage:
 *   const lib = new AssetLibrary();
 *   const env = await lib.loadHDRI('city');          // → THREE.Texture (PMREM)
 *   const model = await lib.loadModel('suzi');       // → THREE.Group
 */
export class AssetLibrary {
  constructor() {
    this._cache = new Map();   // name → resolved asset (Texture or Group)
    this._exrLoader = new EXRLoader();
    this._gltfLoader = new GLTFLoader();

    // Static lookup tables — Vite tree-shakes the unused imports.
    this._hdriTable = {
      city: cityHDR,
      dawn: dawnHDR,
      night: nightHDR,
      sunset: sunsetHDR,
      sky: skyHDR,
      forest: forestHDR,
    };
    this._modelTable = {
      suzi: suziGLB,
      bunny: bunnyGLB,
      pmndrs: pmndrsGLB,
    };
  }

  /**
   * Decode a base64 data URI into a Uint8Array suitable for three.js loaders.
   * Works in both browser (atob) and Node (Buffer) so the file can be unit-tested.
   */
  _dataUriToBytes(dataUri) {
    const commaIdx = dataUri.indexOf(',');
    const b64 = dataUri.substring(commaIdx + 1);
    if (typeof atob === 'function') {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return bytes;
    }
    // Node fallback (Buffer is global in node)
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }

  /**
   * Load an HDRI from the @pmndrs/assets bundle. Returns a raw
   * equirectangular texture. For scene.environment / reflections, call
   * `toEnvMap()` to PMREM-prefilter it.
   *
   * @param {string} name — basename without extension (e.g. 'city', 'sunset')
   * @returns {Promise<THREE.DataTexture>}
   */
  async loadHDRI(name) {
    if (this._cache.has(`hdri:${name}`)) return this._cache.get(`hdri:${name}`);
    const dataUri = this._hdriTable[name];
    if (!dataUri) throw new Error(`AssetLibrary: unknown HDRI "${name}"`);
    const bytes = this._dataUriToBytes(dataUri);
    // EXRLoader.parse() wants the underlying ArrayBuffer (DataView requires it)
    const texture = await this._exrLoader.parse(bytes.buffer);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.LinearSRGBColorSpace;
    this._cache.set(`hdri:${name}`, texture);
    return texture;
  }

  /**
   * PMREM-prefilter an HDRI texture so it can drive PBR reflections.
   * @param {THREE.Texture} equirect
   * @param {THREE.WebGLRenderer} renderer
   * @returns {THREE.Texture}
   */
  toEnvMap(equirect, renderer) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envMap = pmrem.fromEquirectangular(equirect).texture;
    pmrem.dispose();
    return envMap;
  }

  /**
   * Build a GroundedSkybox — a sky sphere with the bottom flattened at the
   * given height, so the player sees a horizon line instead of looking
   * "below" the floor of the sphere. Works perfectly for flat city layouts.
   *
   * @param {THREE.Texture} equirect — from loadHDRI()
   * @param {number} height — camera height above ground (e.g. 6)
   * @param {number} radius — sky radius (must exceed scene max distance)
   * @returns {THREE.Mesh}
   */
  buildGroundedSkybox(equirect, height = 6, radius = 450) {
    const skybox = new GroundedSkybox(equirect, height, radius);
    skybox.position.y = height;
    skybox.name = 'grounded-skybox';
    return skybox;
  }

  /**
   * Load a GLB model from @pmndrs/assets/models/. Returns a THREE.Group.
   * @param {string} name — 'suzi' | 'bunny' | 'pmndrs'
   * @returns {Promise<THREE.Group>}
   */
  async loadModel(name) {
    if (this._cache.has(`model:${name}`)) return this._cache.get(`model:${name}`);
    const dataUri = this._modelTable[name];
    if (!dataUri) throw new Error(`AssetLibrary: unknown model "${name}"`);
    const bytes = this._dataUriToBytes(dataUri);
    const gltf = await this._gltfLoader.parseAsync(bytes.buffer);
    const group = gltf.scene || gltf.scenes[0];
    this._cache.set(`model:${name}`, group);
    return group;
  }
}