import * as THREE from 'three';

/**
 * Builds a detailed future city environment.
 * Returns an array of world objects for cleanup if needed.
 */
export function buildCity(scene) {
  const worldObjects = [];

  // ─── Ground with hex grid detail ───
  const groundGeo = new THREE.PlaneGeometry(200, 200);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x12121f,
    roughness: 0.9,
    metalness: 0.15,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  worldObjects.push(ground);

  // Hexagonal grid overlay
  const hexGrid = new THREE.GridHelper(200, 30, 0x3344aa, 0x224488);
  hexGrid.position.y = 0.05;
  scene.add(hexGrid);
  worldObjects.push(hexGrid);

  // Secondary fine grid
  const fineGrid = new THREE.GridHelper(200, 60, 0x5566cc, 0x223366);
  fineGrid.position.y = 0.03;
  fineGrid.material.transparent = true;
  fineGrid.material.opacity = 0.3;
  scene.add(fineGrid);
  worldObjects.push(fineGrid);

  // ─── Road lane markers (glowing strips) ───
  const laneMat = new THREE.MeshStandardMaterial({
    color: 0x44aaff,
    emissive: 0x44aaff,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.3,
  });
  for (let i = -45; i <= 45; i += 12) {
    if (Math.abs(i) < 10) continue; // skip center
    // Horizontal lanes
    const laneH = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.08), laneMat);
    laneH.position.set(0, 0.06, i);
    laneH.rotation.x = -Math.PI / 2;
    scene.add(laneH);
    worldObjects.push(laneH);
    // Vertical lanes
    const laneV = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 1.5), laneMat);
    laneV.position.set(i, 0.06, 0);
    laneV.rotation.x = -Math.PI / 2;
    scene.add(laneV);
    worldObjects.push(laneV);
  }

  // ─── Materials ───
  const buildingColors = [0x2a2a4a, 0x3a3a5a, 0x1a1a3a, 0x4a4a6a, 0x2a3a5a, 0x1a2a3a];
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x4488aa,
    transparent: true,
    opacity: 0.15,
    metalness: 0.9,
    roughness: 0.05,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x6688bb,
    metalness: 0.7,
    roughness: 0.2,
  });

  // ─── Buildings (varied shapes) ───
  const buildingPositions = [];

  function buildSimpleBlock(x, z, w, h, d, color) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({
        color, metalness: 0.4, roughness: 0.3, transparent: true, opacity: 0.9,
      })
    );
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    worldObjects.push(mesh);
    return mesh;
  }

  function buildTaperedTower(x, z, h, color) {
    const group = new THREE.Group();
    const segs = 4;
    for (let i = 0; i < segs; i++) {
      const t = i / segs;
      const w = 2.4 * (1 - t * 0.4);
      const d = 2.4 * (1 - t * 0.4);
      const segH = h / segs;
      const seg = new THREE.Mesh(
        new THREE.BoxGeometry(w, segH, d),
        new THREE.MeshStandardMaterial({
          color, metalness: 0.5, roughness: 0.2, transparent: true, opacity: 0.9,
        })
      );
      seg.position.y = segH * i + segH / 2;
      seg.castShadow = true;
      seg.receiveShadow = true;
      group.add(seg);
    }
    group.position.set(x, 0, z);
    scene.add(group);
    worldObjects.push(group);

    // Crown glow
    const crownMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.3,
      transparent: true, opacity: 0.5,
    });
    const crown = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.6), crownMat);
    crown.position.set(x, h + 0.1, z);
    scene.add(crown);
    worldObjects.push(crown);

    return group;
  }

  function buildLShaped(x, z, h, color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color, metalness: 0.3, roughness: 0.3, transparent: true, opacity: 0.9,
    });
    const wing1 = new THREE.Mesh(new THREE.BoxGeometry(3, h, 1), mat);
    wing1.position.set(x, h / 2, z);
    wing1.castShadow = true;
    wing1.receiveShadow = true;
    group.add(wing1);

    const wing2 = new THREE.Mesh(new THREE.BoxGeometry(1, h - 0.5, 3), mat);
    wing2.position.set(x + 1.5, (h - 0.5) / 2, z + 1);
    wing2.castShadow = true;
    wing2.receiveShadow = true;
    group.add(wing2);

    scene.add(group);
    worldObjects.push(group);
    return group;
  }

  // Generate city grid with varied building shapes
  for (let x = -42; x <= 42; x += 8) {
    for (let z = -42; z <= 42; z += 8) {
      if (Math.abs(x) < 12 && Math.abs(z) < 12) continue;
      if (Math.random() < 0.20) continue; // plazas

      const height = 2.5 + Math.random() * 7;
      const color = buildingColors[Math.floor(Math.random() * buildingColors.length)];
      const shapeRoll = Math.random();

      if (shapeRoll < 0.15) {
        buildTaperedTower(x, z, height, color);
      } else if (shapeRoll < 0.25) {
        buildLShaped(x, z, height, color);
      } else {
        const w = 1.8 + Math.random() * 2.4;
        const d = 1.8 + Math.random() * 2.4;
        buildSimpleBlock(x, z, w, height, d, color);
      }

      buildingPositions.push({ x, z });
    }
  }

  // ─── Windows and glow panels on ALL buildings ───
  const winColors = [0xffdd88, 0x88ddff, 0xff88dd, 0x88ffaa];
  for (const bp of buildingPositions) {
    const winCount = 3 + Math.floor(Math.random() * 5);
    for (let i = 0; i < winCount; i++) {
      const winMat = new THREE.MeshStandardMaterial({
        color: winColors[Math.floor(Math.random() * winColors.length)],
        emissive: winColors[Math.floor(Math.random() * winColors.length)],
        emissiveIntensity: 0.2 + Math.random() * 0.4,
        transparent: true,
        opacity: 0.5 + Math.random() * 0.3,
      });
      const win = new THREE.Mesh(
        new THREE.PlaneGeometry(0.2 + Math.random() * 0.3, 0.3 + Math.random() * 0.4),
        winMat
      );
      const side = Math.floor(Math.random() * 4);
      const rx = bp.x + (Math.random() - 0.5) * 1.5;
      const rz = bp.z + (Math.random() - 0.5) * 1.5;
      const ry = 1.5 + Math.random() * 4;
      win.position.set(rx, ry, rz);

      if (side === 0) { win.rotation.y = 0; win.position.z = bp.z + 1.2; }
      else if (side === 1) { win.rotation.y = Math.PI; win.position.z = bp.z - 1.2; }
      else if (side === 2) { win.rotation.y = -Math.PI / 2; win.position.x = bp.x + 1.2; }
      else { win.rotation.y = Math.PI / 2; win.position.x = bp.x - 1.2; }

      scene.add(win);
      worldObjects.push(win);
    }
  }

  // ─── Holographic billboards ───
  const billboardMat = new THREE.MeshStandardMaterial({
    color: 0x00ffcc,
    emissive: 0x00ffcc,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
  });
  const billboardPositions = [
    { x: -35, z: 0 }, { x: 35, z: -15 }, { x: 20, z: -40 }, { x: -40, z: 35 },
  ];
  for (const bp of billboardPositions) {
    const bill = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.5), billboardMat);
    const angle = Math.random() * Math.PI * 2;
    bill.position.set(bp.x, 4, bp.z);
    bill.rotation.y = angle;
    scene.add(bill);
    worldObjects.push(bill);

    // Frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x666688, metalness: 0.6, roughness: 0.3 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.6, 0.05), frameMat);
    frame.position.set(bp.x, 4, bp.z);
    frame.rotation.y = angle;
    scene.add(frame);
    worldObjects.push(frame);

    // Scanlines effect (animated stripe)
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0x44ffaa, emissive: 0x44ffaa, emissiveIntensity: 0.1,
      transparent: true, opacity: 0.15,
    });
    for (let s = 0; s < 3; s++) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.05), stripeMat);
      stripe.position.set(bp.x, 3.4 + s * 0.45, bp.z);
      stripe.rotation.y = angle;
      scene.add(stripe);
      worldObjects.push(stripe);
    }
  }

  // ─── Neon street lamps (denser, more colorful) ───
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x666688, metalness: 0.7 });
  const lightColors = [0x44aaff, 0xff66aa, 0x44ffaa, 0xffaa44, 0xaa66ff];

  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 8 + Math.random() * 35;
    const lc = lightColors[Math.floor(Math.random() * lightColors.length)];

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 3.0), poleMat);
    pole.position.set(Math.cos(angle) * radius, 1.5, Math.sin(angle) * radius);
    pole.castShadow = true;
    scene.add(pole);
    worldObjects.push(pole);

    // Light orb
    const orbMat = new THREE.MeshStandardMaterial({
      color: lc, emissive: lc, emissiveIntensity: 0.6, transparent: true, opacity: 0.8,
    });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.10, 8, 8), orbMat);
    glow.position.set(Math.cos(angle) * radius, 3.1, Math.sin(angle) * radius);
    scene.add(glow);
    worldObjects.push(glow);

    const pointLight = new THREE.PointLight(lc, 0.3, 5);
    pointLight.position.copy(glow.position);
    scene.add(pointLight);
    worldObjects.push(pointLight);
  }

  // ─── Neon data-arches (gateways) ───
  const gateColors = [0x00ffff, 0xff44aa, 0x44ffaa];
  const gatePositions = [
    { x: 46, z: 0 }, { x: -46, z: 12 }, { x: 10, z: -46 }, { x: -10, z: 46 },
  ];
  for (const gp of gatePositions) {
    const gc = gateColors[Math.floor(Math.random() * gateColors.length)];
    const archMat = new THREE.MeshStandardMaterial({
      color: gc, emissive: gc, emissiveIntensity: 0.3,
      transparent: true, opacity: 0.35,
    });
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI;
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(3, 0.06, 4, 10, Math.PI / 8),
        archMat
      );
      arch.position.set(gp.x, 2 + Math.sin(angle) * 2, gp.z);
      arch.rotation.x = Math.PI / 2;
      arch.rotation.z = angle;
      scene.add(arch);
      worldObjects.push(arch);
    }
  }

  // ─── Glowing ground crystals / pods ───
  const podColors = [0x44ffaa, 0x44aaff, 0xff66aa, 0xffaa44];
  for (let i = 0; i < 16; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 5 + Math.random() * 30;
    const pc = podColors[Math.floor(Math.random() * podColors.length)];
    const podMat = new THREE.MeshStandardMaterial({
      color: pc, emissive: pc, emissiveIntensity: 0.2,
      transparent: true, opacity: 0.3,
    });
    const pod = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 0), podMat);
    pod.position.set(Math.cos(angle) * radius, 0.1, Math.sin(angle) * radius);
    scene.add(pod);
    worldObjects.push(pod);
  }

  // ─── Glowing neon trees (cyberpunk foliage) ───
  const treeColors = [0x44ff88, 0x88ff44, 0x44ffcc, 0x66ffaa];
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 15 + Math.random() * 28;
    const tc = treeColors[Math.floor(Math.random() * treeColors.length)];

    // Trunk
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x444466, metalness: 0.3 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 1.0), trunkMat);
    trunk.position.set(Math.cos(angle) * radius, 0.5, Math.sin(angle) * radius);
    scene.add(trunk);
    worldObjects.push(trunk);

    // Canopy (glowing spheres)
    const leafMat = new THREE.MeshStandardMaterial({
      color: tc, emissive: tc, emissiveIntensity: 0.3,
      transparent: true, opacity: 0.4,
    });
    for (let j = 0; j < 5; j++) {
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.15 + Math.random() * 0.1, 6, 6),
        leafMat
      );
      leaf.position.set(
        Math.cos(angle) * radius + (Math.random() - 0.5) * 0.8,
        1.0 + Math.random() * 0.6,
        Math.sin(angle) * radius + (Math.random() - 0.5) * 0.8
      );
      scene.add(leaf);
      worldObjects.push(leaf);
    }
  }

  // ─── Holographic data-stream dots (particle system) ───
  const particleCount = 600;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 5 + Math.random() * 40;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0.5 + Math.random() * 6;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    const pc2 = lightColors[Math.floor(Math.random() * lightColors.length)];
    colors[i * 3] = ((pc2 >> 16) & 0xff) / 255;
    colors[i * 3 + 1] = ((pc2 >> 8) & 0xff) / 255;
    colors[i * 3 + 2] = (pc2 & 0xff) / 255;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particleMat = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);
  worldObjects.push(particles);

  // Store particles for animation update
  window.__gameParticles = { positions, particles, time: 0 };

  // ─── Central plaza glowing ring ───
  const plazaMat = new THREE.MeshStandardMaterial({
    color: 0x224488, emissive: 0x224488, emissiveIntensity: 0.15,
    transparent: true, opacity: 0.2, side: THREE.DoubleSide,
  });
  const plazaRing = new THREE.Mesh(new THREE.RingGeometry(3, 4, 24), plazaMat);
  plazaRing.position.set(0, 0.06, 0);
  plazaRing.rotation.x = -Math.PI / 2;
  scene.add(plazaRing);
  worldObjects.push(plazaRing);

  // Inner ring
  const innerMat = new THREE.MeshStandardMaterial({
    color: 0x4488ff, emissive: 0x4488ff, emissiveIntensity: 0.2,
    transparent: true, opacity: 0.3, side: THREE.DoubleSide,
  });
  const innerRing = new THREE.Mesh(new THREE.RingGeometry(0.5, 1, 24), innerMat);
  innerRing.position.set(0, 0.07, 0);
  innerRing.rotation.x = -Math.PI / 2;
  scene.add(innerRing);
  worldObjects.push(innerRing);

  // ─── Fog ───
  scene.fog = new THREE.FogExp2(0x08081a, 0.007);

  // ─── Sky ───
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

  // ─── Distant glow ring (horizon neon band) ───
  const horizonMat = new THREE.MeshStandardMaterial({
    color: 0x3355aa,
    emissive: 0x3355aa,
    emissiveIntensity: 0.15,
    transparent: true,
    opacity: 0.08,
    side: THREE.DoubleSide,
  });
  const horizonRing = new THREE.Mesh(new THREE.RingGeometry(80, 82, 48), horizonMat);
  horizonRing.position.set(0, -0.5, 0);
  horizonRing.rotation.x = -Math.PI / 2;
  scene.add(horizonRing);
  worldObjects.push(horizonRing);

  console.log(`🌆 City built: ${worldObjects.length} objects, ${particleCount} particles`);
  return worldObjects;
}