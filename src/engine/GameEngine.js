import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

/**
 * Manages the 3D scene, renderer, camera, and game loop.
 */
export class GameEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.player = null;
    this.npcs = [];
    this.keys = {};
    this.mouseX = 0;
    this.mouseY = 0;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.interactable = null;
    this.isLocked = false; // mouse lock state
    this.updateCallbacks = [];
    this.elapsedTime = 0;
    this.feel = null;
    this.baseFov = 60;
    this.composer = null;

    // City boundary clamp bounds (player stays within this XZ rectangle).
    // Walls at these same values act as physics blockers for future raycast use.
    this.bounds = { minX: -15, maxX: 15, minZ: -15, maxZ: 15 };

    this._initRenderer();
    this._initCamera();
    this._initLights();
    this._initScene();
    this._initSky();
    this._initPostProcessing();
    this._initControls();
  }

  _initRenderer() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  _initCamera() {
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    this.camera.position.set(-14, 6, -8);
    this.camera.lookAt(-14, 0, -20);
  }

  _initLights() {
    // Ambient
    const ambient = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(ambient);

    // Hemisphere
    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x362d59, 0.8);
    this.scene.add(hemi);

    // Main directional (sun)
    const sun = new THREE.DirectionalLight(0xffeedd, 2.0);
    sun.position.set(50, 80, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -60;
    sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60;
    sun.shadow.camera.bottom = -60;
    this.scene.add(sun);

    // Fill light
    const fill = new THREE.DirectionalLight(0x4488ff, 0.4);
    fill.position.set(-30, 40, -20);
    this.scene.add(fill);
  }

  /**
   * Create invisible boundary walls along the city edges.
   * Walls use MeshBasicMaterial with visible:false so they don't render,
   * but remain in the scene graph as physics blockers for future raycasts.
   * Actual player containment is handled by clamping in _updatePlayer().
   */
  _initScene() {
    const { minX, maxX, minZ, maxZ } = this.bounds;
    const wallHeight = 6;
    const wallThickness = 1;
    const spanX = maxX - minX;
    const spanZ = maxZ - minZ;

    const wallMat = new THREE.MeshBasicMaterial({ visible: false });

    // North wall (minZ edge) — spans full X range, thin in Z
    const wallNorth = new THREE.Mesh(
      new THREE.BoxGeometry(spanX + wallThickness * 2, wallHeight, wallThickness),
      wallMat
    );
    wallNorth.position.set(0, wallHeight / 2, minZ - wallThickness / 2);
    wallNorth.name = 'city-wall-north';
    this.scene.add(wallNorth);

    // South wall (maxZ edge)
    const wallSouth = new THREE.Mesh(
      new THREE.BoxGeometry(spanX + wallThickness * 2, wallHeight, wallThickness),
      wallMat
    );
    wallSouth.position.set(0, wallHeight / 2, maxZ + wallThickness / 2);
    wallSouth.name = 'city-wall-south';
    this.scene.add(wallSouth);

    // West wall (minX edge) — spans full Z range, thin in X
    const wallWest = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, spanZ),
      wallMat
    );
    wallWest.position.set(minX - wallThickness / 2, wallHeight / 2, 0);
    wallWest.name = 'city-wall-west';
    this.scene.add(wallWest);

    // East wall (maxX edge)
    const wallEast = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, spanZ),
      wallMat
    );
    wallEast.position.set(maxX + wallThickness / 2, wallHeight / 2, 0);
    wallEast.name = 'city-wall-east';
    this.scene.add(wallEast);

    // Group reference for future raycast/physics work
    this.boundaryWalls = [wallNorth, wallSouth, wallWest, wallEast];
  }

  /**
   * Create a Preetham atmospheric sky dome configured for a cyberpunk night.
   * Low sun → cold blue/purple gradient; the dome is huge (scale 10000) so
   * it surrounds the player and reads as an infinite skybox.
   */
  _initSky() {
    this.sky = new Sky();
    this.sky.scale.setScalar(10000);

    const uniforms = this.sky.material.uniforms;
    uniforms.turbidity.value = 10;
    uniforms.rayleigh.value = 1;
    uniforms.mieCoefficient.value = 0.005;
    uniforms.mieDirectionalG.value = 0.7;

    // Low sun for night cyberpunk feel: keep magnitude small, point
    // just above the horizon. Preetham normalizes this internally.
    const sunPosition = new THREE.Vector3();
    const phi = THREE.MathUtils.degToRad(90 - 2);   // 2° above horizon
    const theta = THREE.MathUtils.degToRad(180);    // due south
    sunPosition.setFromSphericalCoords(1, phi, theta);
    uniforms.sunPosition.value.copy(sunPosition);

    // Use the sky dome itself as the visible background. Sky already has
    // BackSide + depthWrite:false so it renders behind everything.
    this.scene.background = null;
    this.scene.add(this.sky);
  }

  _initPostProcessing() {
    try {
      this.composer = new EffectComposer(this.renderer);
      const renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.15,   // strength
        0.4,    // radius
        0.2     // threshold
      );
      this.composer.addPass(bloomPass);

      window.addEventListener('resize', () => {
        this.composer.setSize(window.innerWidth, window.innerHeight);
      });

      console.log('✨ Bloom post-processing enabled');
    } catch (e) {
      console.warn('⚠️ Post-processing not available:', e.message);
      this.composer = null;
    }
  }

  _initControls() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key === 'e' && this.interactable && !this.playerLocked) {
        this.interactable.onInteract?.();
      }
      if (e.key === 'i') {
        document.dispatchEvent(new CustomEvent('toggle-inventory'));
      }
    });
    document.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  /**
   * Request pointer lock for mouse-look camera.
   */
  lockControls() {
    if (!this.isLocked) {
      this.canvas.requestPointerLock();
      document.addEventListener('pointerlockchange', () => {
        this.isLocked = document.pointerLockElement === this.canvas;
      });
      document.addEventListener('mousemove', (e) => {
        if (this.isLocked) {
          this.mouseX += e.movementX * 0.002;
          this.mouseY += e.movementY * 0.002;
          this.mouseY = Math.max(-1.0, Math.min(1.0, this.mouseY));
        }
      });
    }
  }

  /**
   * Add an NPC to the scene and tracking list.
   */
  addNPC(npc) {
    this.npcs.push(npc);
    this.scene.add(npc.mesh);
  }

  /**
   * Create a detailed sci-fi explorer character with faceted armor, helmet, and jetpack.
   */
  createPlayer() {
    const group = new THREE.Group();

    // Materials
    const armorMat = new THREE.MeshStandardMaterial({ color: 0x2a4a8a, metalness: 0.4, roughness: 0.3 });
    const armorDarkMat = new THREE.MeshStandardMaterial({ color: 0x1a3a6a, metalness: 0.5, roughness: 0.4 });
    const jointMat = new THREE.MeshStandardMaterial({ color: 0x8899aa, metalness: 0.6, roughness: 0.2 });
    const jointDarkMat = new THREE.MeshStandardMaterial({ color: 0x667788, metalness: 0.5, roughness: 0.3 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0xccddee, roughness: 0.3, metalness: 0.1, flatShading: true });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x44ddff, emissive: 0x44ddff, emissiveIntensity: 0.5 });

    // 1. Torso — hexagonal cross-section
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.45, 0.5, 6),
      armorMat
    );
    torso.position.y = 0.5;
    torso.castShadow = true;
    group.add(torso);

    // 2. Chest plate — thin armor on front
    const chest = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.15, 0.05),
      jointMat
    );
    chest.position.set(0, 0.6, 0.2);
    chest.castShadow = true;
    group.add(chest);

    // 3. Core jewel — glowing center
    const jewel = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 8),
      visorMat
    );
    jewel.position.set(0, 0.6, 0.24);
    group.add(jewel);

    // 4. Helmet — faceted dome via LatheGeometry
    const helmetPoints = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.22, 0.05),
      new THREE.Vector2(0.24, 0.1),
      new THREE.Vector2(0.22, 0.2),
      new THREE.Vector2(0.1, 0.28),
      new THREE.Vector2(0, 0.3),
    ];
    const helmet = new THREE.Mesh(
      new THREE.LatheGeometry(helmetPoints, 8),
      helmetMat
    );
    helmet.position.y = 1.05;
    helmet.castShadow = true;
    group.add(helmet);

    // 5. Visor slit — glowing strip
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.05, 0.02),
      visorMat
    );
    visor.position.set(0, 1.1, 0.23);
    group.add(visor);

    // 6. Helmet antenna
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.015, 0.15),
      jointMat
    );
    antenna.position.set(0, 1.35, 0);
    antenna.castShadow = true;
    group.add(antenna);
    const antennaTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 6, 6),
      visorMat
    );
    antennaTip.position.set(0, 1.425, 0);
    group.add(antennaTip);

    // 7. Left arm
    const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), jointMat);
    shoulderL.position.set(-0.38, 0.8, 0);
    shoulderL.castShadow = true;
    group.add(shoulderL);
    const armUpperL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.25), jointMat);
    armUpperL.position.set(-0.34, 0.7, 0);
    armUpperL.castShadow = true;
    group.add(armUpperL);
    const armLowerL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.2), jointDarkMat);
    armLowerL.position.set(-0.34, 0.45, 0);
    armLowerL.castShadow = true;
    group.add(armLowerL);

    // 8. Right arm
    const shoulderR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), jointMat);
    shoulderR.position.set(0.38, 0.8, 0);
    shoulderR.castShadow = true;
    group.add(shoulderR);
    const armUpperR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.25), jointMat);
    armUpperR.position.set(0.34, 0.7, 0);
    armUpperR.castShadow = true;
    group.add(armUpperR);
    const armLowerR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.2), jointDarkMat);
    armLowerR.position.set(0.34, 0.45, 0);
    armLowerR.castShadow = true;
    group.add(armLowerR);

    // 9. Left leg
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.35), armorMat);
    legL.position.set(-0.12, 0.175, 0);
    legL.castShadow = true;
    group.add(legL);
    const bootL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.08), armorDarkMat);
    bootL.position.set(-0.12, 0.04, 0);
    bootL.castShadow = true;
    group.add(bootL);

    // 10. Right leg
    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.35), armorMat);
    legR.position.set(0.12, 0.175, 0);
    legR.castShadow = true;
    group.add(legR);
    const bootR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.08), armorDarkMat);
    bootR.position.set(0.12, 0.04, 0);
    bootR.castShadow = true;
    group.add(bootR);

    // 11. Backpack / jetpack
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.12), armorDarkMat);
    pack.position.set(0, 0.55, -0.25);
    pack.castShadow = true;
    group.add(pack);
    const thrusterL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.06, 8), jointDarkMat);
    thrusterL.position.set(-0.08, 0.48, -0.3);
    thrusterL.castShadow = true;
    group.add(thrusterL);
    const thrusterR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.06, 8), jointDarkMat);
    thrusterR.position.set(0.08, 0.48, -0.3);
    thrusterR.castShadow = true;
    group.add(thrusterR);
    const glowL = new THREE.Mesh(new THREE.CircleGeometry(0.035, 8), visorMat);
    glowL.position.set(-0.08, 0.45, -0.33);
    thrusterL.add(glowL);
    const glowR = new THREE.Mesh(new THREE.CircleGeometry(0.035, 8), visorMat);
    glowR.position.set(0.08, 0.45, -0.33);
    thrusterR.add(glowR);

    // 12. Shoulder pads
    const padMat = new THREE.MeshStandardMaterial({ color: 0x2a4a8a, metalness: 0.5, roughness: 0.2 });
    const padL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6, 0, Math.PI * 2, 0, Math.PI / 2), padMat);
    padL.position.set(-0.38, 0.85, -0.02);
    padL.rotation.x = -0.3;
    padL.castShadow = true;
    group.add(padL);
    const padR = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6, 0, Math.PI * 2, 0, Math.PI / 2), padMat);
    padR.position.set(0.38, 0.85, -0.02);
    padR.rotation.x = -0.3;
    padR.castShadow = true;
    group.add(padR);

    // Spawn near the NW corner of the city, facing the plaza
    group.position.set(-14, 0, -20);
    this.scene.add(group);
    this.player = group;

    return group;
  }

  /**
   * Update player movement and camera each frame.
   */
  _updatePlayer(delta) {
    if (!this.player) return;

    // Skip movement while typing in input fields
    const isTyping = document.activeElement &&
      (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
    if (isTyping) return;

    const speed = 6.0 * delta;
    const dir = new THREE.Vector3();

    // Forward/back relative to camera look direction (horizontal only)
    const forward = new THREE.Vector3(
      -Math.sin(this.mouseX),
      0,
      -Math.cos(this.mouseX)
    ).normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    if (this.keys['w']) dir.add(forward);
    if (this.keys['s']) dir.sub(forward);
    if (this.keys['a']) dir.sub(right);
    if (this.keys['d']) dir.add(right);

    if (dir.length() > 0) {
      dir.normalize().multiplyScalar(speed);
      this.player.position.add(dir);
      // Face movement direction
      this.player.rotation.y = Math.atan2(dir.x, dir.z);
    }

    // Clamp player to city bounds — primary containment mechanism.
    // Boundary walls in _initScene() are the spatial reference / future raycast target.
    const { minX, maxX, minZ, maxZ } = this.bounds;
    this.player.position.x = Math.max(minX, Math.min(maxX, this.player.position.x));
    this.player.position.z = Math.max(minZ, Math.min(maxZ, this.player.position.z));

    // Camera follows player with orbit offset
    const camDist = 10;
    const camHeight = 6 + this.mouseY * 3;
    const targetPos = new THREE.Vector3(
      this.player.position.x + Math.sin(this.mouseX) * camDist,
      this.player.position.y + camHeight,
      this.player.position.z + Math.cos(this.mouseX) * camDist
    );
    this.camera.position.lerp(targetPos, 0.1);
    this.camera.lookAt(this.player.position.x, this.player.position.y + 0.8, this.player.position.z);
  }

  /**
   * Check NPC proximity and set interactable.
   */
  _checkInteractions() {
    if (!this.player || this.interactable?.lockInteraction) return;

    const interactionRange = 3.0;
    const playerPos = this.player.position;
    let closest = null;
    let closestDist = interactionRange;

    for (const npc of this.npcs) {
      const dist = playerPos.distanceTo(npc.mesh.position);
      if (dist < closestDist && !npc.isInCombat) {
        closestDist = dist;
        closest = npc;
      }
    }

    if (closest !== this.interactable) {
      this.interactable = closest;
      if (closest) {
        document.dispatchEvent(new CustomEvent('npc-near', { detail: { npc: closest } }));
      } else {
        document.dispatchEvent(new CustomEvent('npc-far'));
      }
    }
  }

  /**
   * Lock player movement (during dialogue/combat).
   */
  setPlayerLock(locked) {
    this.playerLocked = locked;
  }

  /**
   * Wire in the GameFeel bundle. Called once from main.js.
   */
  setFeelInstances(feel) {
    this.feel = feel;
  }

  /**
   * Register a per-frame update callback. Receives (delta, totalElapsed).
   */
  registerUpdateCallback(fn) {
    this.updateCallbacks.push(fn);
  }

  /**
   * Start the game loop.
   */
  start() {
    this.lockControls();

    const loop = () => {
      requestAnimationFrame(loop);
      const delta = this.clock.getDelta();
      this.elapsedTime += delta;

      if (!this.playerLocked) {
        this._updatePlayer(delta);
        this._checkInteractions();
      }

      // Game feel (shake, tweens, hitstop, FOV punch) — always live
      if (this.feel) {
        this.feel.update(delta, this.camera);
      }

      // Custom update callbacks (particles, animations, etc.)
      for (const cb of this.updateCallbacks) {
        cb(delta, this.elapsedTime);
      }

      // Render with post-processing if available
      if (this.composer) {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }
    };
    loop();
  }
}