import * as THREE from 'three';

/**
 * Builds the future city environment.
 */
export function buildCity(scene) {
  const worldObjects = [];

  // --- Ground ---
  const groundGeo = new THREE.PlaneGeometry(200, 200);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a2e,
    roughness: 0.9,
    metalness: 0.1,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  worldObjects.push(ground);

  // Grid lines for futuristic feel
  const gridHelper = new THREE.GridHelper(200, 40, 0x4488ff, 0x2244aa);
  gridHelper.position.y = 0.05;
  scene.add(gridHelper);
  worldObjects.push(gridHelper);

  // --- Buildings ---
  const buildingColors = [0x2a2a4a, 0x3a3a5a, 0x1a1a3a, 0x4a4a6a, 0x2a3a5a];
  const buildingPositions = [];

  // Generate building positions in a rough city grid
  for (let x = -40; x <= 40; x += 8) {
    for (let z = -40; z <= 40; z += 8) {
      // Skip center area (player spawn)
      if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;
      // Skip some positions randomly for streets
      if (Math.random() < 0.25) continue;

      const height = 2 + Math.random() * 6;
      const width = 2 + Math.random() * 2;
      const depth = 2 + Math.random() * 2;

      const building = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({
          color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
          metalness: 0.4,
          roughness: 0.3,
          transparent: true,
          opacity: 0.9,
        })
      );
      building.position.set(x, height / 2, z);
      building.castShadow = true;
      building.receiveShadow = true;
      scene.add(building);
      worldObjects.push(building);
      buildingPositions.push({ x, z, width, depth });

      // Window glow (small emissive rectangles on front)
      const windowMat = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.5 ? 0xffdd88 : 0x88ddff,
        emissive: Math.random() > 0.5 ? 0xffdd88 : 0x88ddff,
        emissiveIntensity: 0.3,
      });
      for (let wy = 0.5; wy < height - 0.5; wy += 1.5) {
        for (let wz = -0.3; wz <= 0.3; wz += 0.6) {
          if (Math.random() > 0.4) {
            const win = new THREE.Mesh(
              new THREE.PlaneGeometry(0.3, 0.5),
              windowMat
            );
            win.position.set(x + width / 2 + 0.01, wy, z + wz);
            win.rotation.y = Math.PI / 2;
            scene.add(win);
            worldObjects.push(win);
          }
        }
      }
    }
  }

  // --- Street lamps / neon poles ---
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0x44aaff,
    emissive: 0x44aaff,
    emissiveIntensity: 0.5,
  });

  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 10 + Math.random() * 30;

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 2.5), poleMat);
    pole.position.set(Math.cos(angle) * radius, 1.25, Math.sin(angle) * radius);
    pole.castShadow = true;
    scene.add(pole);
    worldObjects.push(pole);

    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), lightMat);
    glow.position.set(Math.cos(angle) * radius, 2.6, Math.sin(angle) * radius);
    scene.add(glow);
    worldObjects.push(glow);

    const pointLight = new THREE.PointLight(0x44aaff, 0.5, 6);
    pointLight.position.copy(glow.position);
    scene.add(pointLight);
    worldObjects.push(pointLight);
  }

  // --- Neon arch at "city entrance" ---
  const archMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.4,
  });
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI;
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(4, 0.08, 4, 12, Math.PI / 12),
      archMat
    );
    arch.position.set(45, 3 + Math.sin(angle) * 3, 0);
    arch.rotation.x = Math.PI / 2;
    arch.rotation.z = angle;
    scene.add(arch);
    worldObjects.push(arch);
  }

  // --- Fog for atmosphere ---
  scene.fog = new THREE.FogExp2(0x0a0a1a, 0.008);

  // --- Skybox-ish (starfield + gradient) ---
  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x000033) },
      bottomColor: { value: new THREE.Color(0x0a0a1a) },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0);
      }
    `,
    side: THREE.BackSide,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 32), skyMat);
  scene.add(sky);
  worldObjects.push(sky);

  return worldObjects;
}