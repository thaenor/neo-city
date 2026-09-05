import * as THREE from 'three';

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

    this._initRenderer();
    this._initCamera();
    this._initLights();
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
    this.camera.position.set(0, 8, 12);
    this.camera.lookAt(0, 0, 0);
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

  _initControls() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key === 'e' && this.interactable) {
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
   * Create a simple placeholder player character.
   */
  createPlayer() {
    const group = new THREE.Group();

    // Body (capsule-like with cylinder + sphere)
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.5, 1.0, 8),
      new THREE.MeshStandardMaterial({ color: 0x44aaff, metalness: 0.3, roughness: 0.6 })
    );
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.7 })
    );
    head.position.y = 1.25;
    head.castShadow = true;
    group.add(head);

    // Eyes (little dots)
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
    eyeL.position.set(-0.1, 1.3, 0.23);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
    eyeR.position.set(0.1, 1.3, 0.23);
    group.add(eyeR);

    group.position.set(0, 0, 0);
    this.scene.add(group);
    this.player = group;

    return group;
  }

  /**
   * Update player movement and camera each frame.
   */
  _updatePlayer(delta) {
    if (!this.player) return;

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
   * Start the game loop.
   */
  start() {
    this.lockControls();

    const loop = () => {
      requestAnimationFrame(loop);
      const delta = this.clock.getDelta();

      if (!this.playerLocked) {
        this._updatePlayer(delta);
        this._checkInteractions();
      }

      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }
}