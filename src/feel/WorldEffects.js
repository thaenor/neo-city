import * as THREE from 'three';

/**
 * WorldEffects
 * ─────────────
 * Reads the aggregate city mood every frame and drives visual parameters
 * in real-time: bloom, sky, fog, ambient light.
 *
 * Each mood axis maps to a distinct visual "flavour":
 *   Anger   → aggressive red, high bloom, hot fog
 *   Trust   → calm blue/cyan, soft glow
 *   Amusement → playful purple/pink, pulsing bloom
 *   Curiosity → green/teal, crisp fog
 *
 * All transitions lerp smoothly so the world feels alive, not janky.
 */

export class WorldEffects {
  /**
   * @param {import('./MoodSystem.js').MoodSystem} moodSystem
   * @param {import('../engine/GameEngine.js').GameEngine} engine
   */
  constructor(moodSystem, engine) {
    this.mood = moodSystem;
    this.engine = engine;

    // Current lerped values (smooth targets)
    this._bloom = 0.15;
    this._fogColor = new THREE.Color(0x0a0a1a);
    this._ambientColor = new THREE.Color(0x404060);
    this._skyTint = new THREE.Color(0x000000);

    // Previous frame target for smoothness
    this._target = {
      bloom: 0.15,
      fogColor: new THREE.Color(0x0a0a1a),
      ambientColor: new THREE.Color(0x404060),
      skyTint: new THREE.Color(0x000000),
    };

    this._lerpSpeed = 2.0; // per second
  }

  /**
   * Call every frame from the game loop.
   * @param {number} delta — seconds since last frame
   */
  update(delta) {
    const cityMood = this.mood.getCityMood();

    // ─── Compute targets from mood ────────────────────────────────
    this._computeTargets(cityMood);

    // ─── Lerp current values toward targets ───────────────────────
    const t = Math.min(1, this._lerpSpeed * delta);

    this._bloom += (this._target.bloom - this._bloom) * t;
    this._fogColor.lerp(this._target.fogColor, t);
    this._ambientColor.lerp(this._target.ambientColor, t);
    this._skyTint.lerp(this._target.skyTint, t);

    // ─── Apply to scene ──────────────────────────────────────────
    this._applyBloom();
    this._applyFog();
    this._applyLights();
    this._applySky();
  }

  _computeTargets(cityMood) {
    const { trust, anger, amusement, curiosity } = cityMood;

    // Normalise axes to 0-1 influence
    const a = anger / 100;         // red
    const t = trust / 100;         // blue
    const am = amusement / 100;    // purple
    const c = curiosity / 100;     // teal

    // Bloom: anger and amusement make it surge, trust dampens it
    this._target.bloom = 0.1 + (a * 0.35) + (am * 0.3) - (t * 0.05);

    // Fog color: blend between mood-driven colours
    const r = a * 0.8 + am * 0.3;
    const g = t * 0.4 + c * 0.6 + am * 0.1;
    const b = t * 0.6 + c * 0.3 + am * 0.5 + (1 - a) * 0.2;
    this._target.fogColor.setRGB(
      Math.min(0.6, r),
      Math.min(0.4, g),
      Math.min(0.5, b)
    );

    // Ambient light: angry = dim red, happy = bright cyan
    this._target.ambientColor.setRGB(
      0.25 + a * 0.3 + am * 0.1,
      0.25 + t * 0.3 + c * 0.2,
      0.38 + t * 0.2 + c * 0.1
    );

    // Sky tint overlay (subtle — adds colour to the Preetham sky)
    this._target.skyTint.setRGB(
      a * 0.15,
      t * 0.08 + c * 0.05,
      t * 0.12 + am * 0.1
    );
  }

  _applyBloom() {
    const composer = this.engine.composer;
    if (!composer || !composer.passes) return;
    const bloomPass = composer.passes.find(p => p.strength !== undefined);
    if (bloomPass) {
      bloomPass.strength = this._bloom;
    }
  }

  _applyFog() {
    const scene = this.engine.scene;
    if (!scene) return;
    // Enable fog if not already set
    if (!scene.fog) {
      scene.fog = new THREE.Fog(this._fogColor, 15, 50);
    } else {
      scene.fog.color.copy(this._fogColor);
    }
  }

  _applyLights() {
    const scene = this.engine.scene;
    if (!scene) return;
    // Find the ambient light by type
    const ambient = scene.children.find(
      c => c.isAmbientLight
    );
    if (ambient) {
      ambient.color.copy(this._ambientColor);
    }
  }

  _applySky() {
    // The Sky object has turbidity/rayleigh uniforms we could tweak,
    // but for the POC we overlay a subtle tint on scene background.
    // The Sky dome already renders behind everything.
    // We can't tint it easily without modifying the Sky shader,
    // so instead we set a thin fog overlay that mimics a tint.
    // (Already handled by _applyFog above.)
  }
}