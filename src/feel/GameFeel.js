/**
 * GameFeel — juice layer: tweens, trauma screenshake, hitstop, impact flash,
 * pickup pop, FOV punch, squash-and-stretch.
 *
 * Rules:
 *  - Tweens / shake / FOV run on the REAL render delta (they must stay live during hitstop).
 *  - Gameplay reads the hitstop-scaled delta.
 *  - No Math.random anywhere here; shake noise is driven by accumulated game time.
 */

// ─── Easing ───────────────────────────────────────────────────────────────────

export const easeInQuad = (t) => t * t;
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

// ─── TweenManager ─────────────────────────────────────────────────────────────

export class TweenManager {
  constructor() {
    this.tweens = [];
  }

  /**
   * @param {number} durationSec
   * @param {(value:number)=>void} onUpdate  receives eased value in [0,1] (may overshoot with easeOutBack)
   * @param {(t:number)=>number} [easing]
   * @param {()=>void} [onComplete]
   */
  tween(durationSec, onUpdate, easing = easeOutCubic, onComplete) {
    const t = { elapsed: 0, duration: Math.max(durationSec, 1e-6), easing, onUpdate, onComplete };
    this.tweens.push(t);
    return t;
  }

  /** Update with the REAL delta, not the gameplay delta. */
  update(delta) {
    for (let i = this.tweens.length - 1; i >= 0; i -= 1) {
      const t = this.tweens[i];
      t.elapsed += delta;
      const k = Math.min(t.elapsed / t.duration, 1);
      t.onUpdate(t.easing(k));
      if (t.elapsed >= t.duration) {
        t.onComplete?.();
        this.tweens.splice(i, 1);
      }
    }
  }

  get active() {
    return this.tweens.length;
  }
}

// ─── ShakeRig (trauma-based screenshake) ──────────────────────────────────────

const TRAUMA_MAX = 1;
const TRAUMA_DECAY = 1.4; // trauma units per second
const MAX_OFFSET = 0.55;  // world units at full shake
const MAX_ROLL = 0.1;     // radians at full shake

/** Deterministic value noise in [-1, 1]; per-axis seed keeps axes independent. */
function pseudoNoise(t, seed) {
  const x = Math.sin(t * 12.9898 + seed * 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/**
 * Recommended trauma per event: pickup 0.15, hit 0.4, explosion 0.7.
 * Shake = trauma² so small events barely move the camera and big ones snap hard.
 */
export class ShakeRig {
  constructor() {
    this.trauma = 0;
    this.time = 0; // accumulated game time (seed for the noise), not wall clock
  }

  addTrauma(amount) {
    this.trauma = Math.min(TRAUMA_MAX, this.trauma + amount);
  }

  /**
   * Call every frame AFTER the camera's base transform has been written
   * (the follow/lerp + lookAt re-derive the base each frame, so the offset does not accumulate).
   */
  update(delta, camera) {
    this.time += delta;
    this.trauma = Math.max(0, this.trauma - TRAUMA_DECAY * delta);
    if (this.trauma <= 0 || !camera) return;
    const shake = this.trauma * this.trauma;
    const freq = this.time * 32;
    camera.position.x += MAX_OFFSET * shake * pseudoNoise(freq, 1);
    camera.position.y += MAX_OFFSET * shake * pseudoNoise(freq, 2);
    camera.rotation.z += MAX_ROLL * shake * pseudoNoise(freq, 3);
  }
}

// ─── Hitstop ──────────────────────────────────────────────────────────────────

/**
 * Scales the gameplay delta for a brief freeze; the render loop, camera and tweens
 * keep running on the real delta so the frozen moment is actually visible.
 *
 * Usage (in the loop):
 *   const gameplayDelta = hitstop.update(realDelta);
 */
export class Hitstop {
  constructor() {
    this.remaining = 0; // seconds, decays in REAL time
    this.timeScale = 1;
  }

  /** @returns {{remaining:number, timeScale:number}} */
  hitstop(durationMs, scale = 0.05) {
    this.remaining = Math.max(this.remaining, durationMs / 1000);
    this.timeScale = scale;
    return this.state();
  }

  /** Advance in real time; returns the scaled gameplay delta. */
  update(realDelta) {
    if (this.remaining > 0) {
      this.remaining -= realDelta;
      if (this.remaining <= 0) {
        this.remaining = 0;
        this.timeScale = 1;
      }
    }
    return realDelta * this.timeScale;
  }

  state() {
    return { remaining: this.remaining, timeScale: this.timeScale };
  }
}

/** Standalone helper: apply a hitstop to any object exposing { remaining, timeScale }. */
export function hitstop(target, durationMs, scale = 0.05) {
  target.remaining = Math.max(target.remaining || 0, durationMs / 1000);
  target.timeScale = scale;
  return { remaining: target.remaining, timeScale: target.timeScale };
}

// ─── FOV punch ────────────────────────────────────────────────────────────────

const FOV_PUNCH_MAX = 10;
const FOV_TIME_CONSTANT = 0.2; // seconds (~200ms)

/**
 * Additive FOV bump that decays toward 0 with a 200ms time constant.
 * Recommended +4..8° on hit / dash / shock.
 */
export class FovPunch {
  constructor() {
    this.punch = 0; // additive degrees
    this.camera = null;
    this.baseFov = 60;
  }

  punchFov(camera, degrees, baseFov) {
    if (camera) this.camera = camera;
    if (typeof baseFov === 'number') this.baseFov = baseFov;
    else if (this.camera && this.punch <= 0.001) this.baseFov = this.camera.fov;
    this.punch = Math.min(FOV_PUNCH_MAX, this.punch + degrees);
    this._apply();
  }

  /** Real delta. */
  update(delta) {
    if (this.punch <= 0.001 || !this.camera) return;
    this.punch *= Math.exp(-delta / FOV_TIME_CONSTANT);
    if (this.punch < 0.001) this.punch = 0;
    this._apply();
  }

  _apply() {
    if (!this.camera) return;
    this.camera.fov = this.baseFov + this.punch;
    this.camera.updateProjectionMatrix(); // REQUIRED after any fov change
  }
}

// ─── Material / mesh helpers (need a TweenManager) ────────────────────────────

/**
 * Pulse emissiveIntensity from `peak` back to the stored base value.
 * If the material's emissive color is black the pulse is invisible, so we tint it
 * once with the material's own color (stored in userData for reference).
 */
export function flashHit(tweens, material, peak = 2.4, durationSec = 0.22) {
  if (!tweens || !material) return;
  material.userData ??= {};
  if (material.userData.baseEmissive === undefined) {
    material.userData.baseEmissive = material.emissiveIntensity ?? 0;
  }
  if (material.emissive && material.emissive.getHex() === 0) {
    material.userData.baseEmissiveColor = 0x000000;
    material.emissive.copy(material.color ?? material.emissive).multiplyScalar(0.8);
    if (material.emissive.getHex() === 0) material.emissive.setHex(0xffffff);
  }
  const base = material.userData.baseEmissive;
  material.emissiveIntensity = peak;
  tweens.tween(
    durationSec,
    (t) => {
      material.emissiveIntensity = base + (peak - base) * (1 - t); // peak -> base
    },
    easeOutCubic,
    () => {
      material.emissiveIntensity = base;
    },
  );
}

/**
 * Pickup pop: scale 1.6 -> 1.0, rise 1.2 units, fade opacity, 280ms.
 * Works for a THREE.Mesh + material. See `popElement` for the DOM equivalent.
 */
export function playPickupPop(tweens, mesh, material) {
  if (!tweens || !mesh) return;
  const startY = mesh.position.y;
  if (material) material.transparent = true;
  tweens.tween(
    0.28,
    (t) => {
      mesh.scale.setScalar(1 + 0.6 * (1 - t)); // 1.6 -> 1.0
      mesh.position.y = startY + t * 1.2;     // rise
      if (material) material.opacity = 1 - t; // fade
    },
    easeOutCubic,
    () => {
      mesh.visible = false;
    },
  );
}

/**
 * DOM flavour of the pickup pop for HUD toasts: scale 1.6 -> 1.0 with an overshoot
 * settle, small rise. Uses WAAPI so it never touches the 3D pipeline.
 */
export function popElement(element, { duration = 280, baseTransform = '' } = {}) {
  if (!element || typeof element.animate !== 'function') return null;
  const tf = (s, y) => `${baseTransform} translateY(${y}px) scale(${s})`.trim();
  return element.animate(
    [
      { transform: tf(1.6, 12), opacity: 0 },
      { transform: tf(0.96, -2), opacity: 1, offset: 0.7 },
      { transform: tf(1.0, 0), opacity: 1 },
    ],
    { duration, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'both' },
  );
}

/**
 * Squash-and-stretch: volume-preserving deform that overshoots back with easeOutBack.
 * squashY < 1 = impact squash, > 1 = jump stretch.
 */
export function squash(tweens, target, squashY = 0.85, durationSec = 0.18) {
  if (!tweens || !target) return;
  const startXZ = 1 / Math.sqrt(squashY); // volume-preserving counter-scale
  target.scale.set(startXZ, squashY, startXZ);
  tweens.tween(
    durationSec,
    (t) => {
      const y = squashY + (1 - squashY) * t;    // squashY -> 1
      const xz = startXZ + (1 - startXZ) * t;  // stretch -> 1
      target.scale.set(xz, y, xz);
    },
    easeOutBack, // overshoot past 1 gives the bouncy settle
    () => {
      target.scale.set(1, 1, 1);
    },
  );
}

/**
 * Convenience bundle: one object holding every feel subsystem, with bound helpers.
 */
export class GameFeel {
  constructor() {
    this.tweens = new TweenManager();
    this.shakeRig = new ShakeRig();
    this.hitstopCtl = new Hitstop();
    this.fov = new FovPunch();
  }

  /** Real delta in; scaled gameplay delta out. Camera gets shake + fov applied. */
  update(realDelta, camera) {
    const gameplayDelta = this.hitstopCtl.update(realDelta);
    this.tweens.update(realDelta);
    this.fov.update(realDelta);
    this.shakeRig.update(realDelta, camera);
    return gameplayDelta;
  }

  hitstop(durationMs, scale = 0.05) { return this.hitstopCtl.hitstop(durationMs, scale); }
  addTrauma(amount) { this.shakeRig.addTrauma(amount); }
  punchFov(camera, degrees, baseFov) { this.fov.punchFov(camera, degrees, baseFov); }
  flashHit(material, peak, durationSec) { flashHit(this.tweens, material, peak, durationSec); }
  playPickupPop(mesh, material) { playPickupPop(this.tweens, mesh, material); }
  squash(target, squashY, durationSec) { squash(this.tweens, target, squashY, durationSec); }
}
