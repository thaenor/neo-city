import * as THREE from 'three';

/**
 * Builds the city environment matching the reference image aesthetic:
 * multi-tiered elevation, central landmark tower, dense skyline,
 * neon signage, atmospheric dusk lighting.
 */
export function buildCity(scene) {
  const worldObjects = [];

  // ═══════════════════════════════════════════
  //  MATERIAL POOL (reused across city)
  // ═══════════════════════════════════════════
  const M = {
    ground: new THREE.MeshStandardMaterial({ color: 0x12121f, roughness: 0.9, metalness: 0.15 }),
    asphalt: new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.95, metalness: 0.05 }),
    building: (c) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.5, roughness: 0.25, transparent: true, opacity: 0.9 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x3366aa, transparent: true, opacity: 0.12, metalness: 0.9, roughness: 0.05 }),
    window: (c, i) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, transparent: true, opacity: 0.6 }),
    neonSign: (c, i) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
    crownLight: (c, i) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, transparent: true, opacity: 0.7 }),
  };

  // ═══════════════════════════════════════════
  //  GROUND & ELEVATION TIERS
  // ═══════════════════════════════════════════

  // Main ground plane
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), M.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  worldObjects.push(ground);

  // --- Tier 1: High Overlook (player spawn area) ---
  // A raised platform at z=-30 to z=-20, y=2
  const overlookGeo = new THREE.PlaneGeometry(50, 14);
  const overlookMat = M.asphalt.clone();
  overlookMat.color.setHex(0x1a1a2e);
  const overlook = new THREE.Mesh(overlookGeo, overlookMat);
  overlook.position.set(0, 2.0, -28);
  overlook.rotation.x = -Math.PI / 2;
  overlook.receiveShadow = true;
  scene.add(overlook);
  worldObjects.push(overlook);

  // Overlook railing
  const railMat = new THREE.MeshStandardMaterial({ color: 0x446688, metalness: 0.6, roughness: 0.3 });
  for (let x = -24; x <= 24; x += 4) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.8), railMat);
    post.position.set(x, 2.4, -34.5);
    scene.add(post);
    worldObjects.push(post);
  }
  // Horizontal rail
  const railBar = new THREE.Mesh(new THREE.BoxGeometry(50, 0.04, 0.04), railMat);
  railBar.position.set(0, 2.6, -34.5);
  scene.add(railBar);
  worldObjects.push(railBar);

  // Overlook ground grid
  const viewGrid = new THREE.GridHelper(50, 20, 0x4466aa, 0x224488);
  viewGrid.position.set(0, 2.06, -28);
  scene.add(viewGrid);
  worldObjects.push(viewGrid);

  // --- Tier 2: Upper Mid (z=-18 to z=-5, y=1) ---
  const upperMid = new THREE.Mesh(new THREE.PlaneGeometry(80, 14), M.asphalt);
  upperMid.position.set(0, 1.0, -11);
  upperMid.rotation.x = -Math.PI / 2;
  upperMid.receiveShadow = true;
  scene.add(upperMid);
  worldObjects.push(upperMid);

  // --- Tier 3: City Core (z=-4 to z=20, y=0) ---
  const core = new THREE.Mesh(new THREE.PlaneGeometry(80, 28), M.asphalt);
  core.position.set(0, 0.0, 8);
  core.rotation.x = -Math.PI / 2;
  core.receiveShadow = true;
  scene.add(core);
  worldObjects.push(core);

  // --- Tier 4: Distant Basin (z=20 to z=45, y=-0.5) ---
  const basin = new THREE.Mesh(new THREE.PlaneGeometry(80, 28), M.asphalt);
  basin.position.set(0, -0.5, 34);
  basin.rotation.x = -Math.PI / 2;
  basin.receiveShadow = true;
  scene.add(basin);
  worldObjects.push(basin);

  // --- Ramps between tiers ---
  function buildRamp(x, z, width, heightDiff, length) {
    const rampGeo = new THREE.PlaneGeometry(width, length);
    const rampMat = M.asphalt.clone();
    rampMat.color.setHex(0x22223a);
    const ramp = new THREE.Mesh(rampGeo, rampMat);
    ramp.position.set(x, z + length/2 - 0.5);
    ramp.rotation.x = -Math.PI / 2 + Math.atan2(heightDiff, length) * 0.5;
    ramp.rotation.order = 'YXZ';
    ramp.position.y = Math.min(2.0, 1.0) + 0.1;
    ramp.receiveShadow = true;
    scene.add(ramp);
    worldObjects.push(ramp);
    return ramp;
  }

  // Ramps from overlook (y=2) to upper mid (y=1)
  for (let x = -20; x <= 20; x += 8) {
    const stairMat = new THREE.MeshStandardMaterial({ color: 0x333355, metalness: 0.3, roughness: 0.6 });
    for (let s = 0; s < 4; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(2, 0.08, 0.4), stairMat);
      step.position.set(x, 2.0 - s * 0.25, -20.5 + s * 0.4);
      scene.add(step);
      worldObjects.push(step);
    }
  }

  // ═══════════════════════════════════════════
  //  R1: CENTRAL LANDMARK TOWER
  // ═══════════════════════════════════════════
  {
    const towerGroup = new THREE.Group();
    const towerColor = 0x445588;
    const accentColor = 0x6688cc;
    const glowColor = 0x4488ff;
    const totalH = 12;

    // Base platform
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 2.2, 0.5, 12),
      new THREE.MeshStandardMaterial({ color: 0x334466, metalness: 0.7, roughness: 0.2 })
    );
    base.position.y = 0.25;
    base.receiveShadow = true;
    base.castShadow = true;
    towerGroup.add(base);

    // Main tower body - multi-tiered tapered segments
    const segs = 6;
    for (let i = 0; i < segs; i++) {
      const t = i / segs;
      const w = 1.6 * (1 - t * 0.5);
      const d = 1.6 * (1 - t * 0.5);
      const segH = totalH / segs;

      const segment = new THREE.Mesh(
        new THREE.BoxGeometry(w, segH, d),
        M.building(0x3a4a7a)
      );
      segment.position.y = 0.5 + segH * i + segH / 2;
      segment.castShadow = true;
      segment.receiveShadow = true;
      towerGroup.add(segment);

      // Horizontal accent band at each segment join
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.1, 0.06, d + 0.1),
        new THREE.MeshStandardMaterial({ color: 0x6688bb, metalness: 0.8, roughness: 0.1 })
      );
      band.position.y = 0.5 + segH * (i + 1) - 0.03;
      towerGroup.add(band);

      // Vertical accent lines on each segment
      for (let side = 0; side < 4; side++) {
        const lineMat = new THREE.MeshStandardMaterial({
          color: accentColor, emissive: accentColor, emissiveIntensity: 0.5 + i * 0.05,
          transparent: true, opacity: 0.5,
        });
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.04, segH, 0.04), lineMat);
        const offset = w / 2 - 0.05;
        switch (side) {
          case 0: line.position.set(offset, 0.5 + segH * i + segH / 2, 0); break;
          case 1: line.position.set(-offset, 0.5 + segH * i + segH / 2, 0); break;
          case 2: line.position.set(0, 0.5 + segH * i + segH / 2, offset); break;
          case 3: line.position.set(0, 0.5 + segH * i + segH / 2, -offset); break;
        }
        towerGroup.add(line);
      }
    }

    // Crown / spire at top
    const spireMat = new THREE.MeshStandardMaterial({
      color: 0x88ddff, emissive: 0x88ddff, emissiveIntensity: 0.4,
    });
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.5, 8), spireMat);
    spire.position.y = totalH + 0.75;
    towerGroup.add(spire);

    // Crown beacon (glowing orb)
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x44aaff, emissive: 0x44aaff, emissiveIntensity: 1.0,
      transparent: true, opacity: 0.7,
    });
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), beaconMat);
    beacon.position.y = totalH + 1.55;
    towerGroup.add(beacon);

    // Crown light (point light)
    const crownLight = new THREE.PointLight(0x4488ff, 1.5, 15);
    crownLight.position.y = totalH + 1.5;
    towerGroup.add(crownLight);

    // Glowing rings around the tower at different heights
    for (let ri = 0; ri < 4; ri++) {
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x44aaff, emissive: 0x44aaff, emissiveIntensity: 0.3,
        transparent: true, opacity: 0.3, side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.1, 16), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 1.5 + ri * 2.5;
      towerGroup.add(ring);
    }

    // Tower base glow ring
    const baseGlowMat = new THREE.MeshStandardMaterial({
      color: 0x4466cc, emissive: 0x4466cc, emissiveIntensity: 0.2,
      transparent: true, opacity: 0.15, side: THREE.DoubleSide,
    });
    const baseRing = new THREE.Mesh(new THREE.RingGeometry(2, 3, 24), baseGlowMat);
    baseRing.rotation.x = -Math.PI / 2;
    baseRing.position.y = 0.02;
    towerGroup.add(baseRing);

    // Position tower at city center, offset slightly
    towerGroup.position.set(-2, 0, 0);
    scene.add(towerGroup);
    worldObjects.push(towerGroup);
  }

  // ═══════════════════════════════════════════
  //  BUILDING GENERATION (all tiers)
  // ═══════════════════════════════════════════
  const buildingColors = [0x2a2a4a, 0x3a3a5a, 0x1a1a3a, 0x4a4a6a, 0x2a3a5a, 0x3a4a6a, 0x2a3a4a];
  const buildingPositions = [];

  function buildBox(x, z, w, h, d, color, yOffset) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.building(color));
    mesh.position.set(x, yOffset + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    worldObjects.push(mesh);
    return mesh;
  }

  function buildTaperedTower(x, z, h, color, yOffset) {
    const group = new THREE.Group();
    const segs = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < segs; i++) {
      const t = i / segs;
      const w = 1.8 * (1 - t * 0.3);
      const d = 1.8 * (1 - t * 0.3);
      const segH = h / segs;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(w, segH, d), M.building(color));
      seg.position.y = segH * i + segH / 2;
      seg.castShadow = true;
      seg.receiveShadow = true;
      group.add(seg);
    }
    group.position.set(x, yOffset, z);
    scene.add(group);
    worldObjects.push(group);
    return group;
  }

  function buildAngledRoof(x, z, w, h, color, yOffset) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.7, w), M.building(color));
    body.position.y = h * 0.35;
    body.castShadow = true;
    group.add(body);

    const roofMat = new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.4 });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.6, h * 0.3, 4), roofMat);
    roof.position.y = h * 0.7 + h * 0.15;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);

    group.position.set(x, yOffset, z);
    scene.add(group);
    worldObjects.push(group);
    return group;
  }

  // Define city zones with different building densities and heights
  const zones = [
    // { xMin, xMax, zMin, zMax, minH, maxH, density, yOffset, spawnRate }
    // Overlook tier (sparse, low buildings)
    { xMin: -24, xMax: 24, zMin: -34, zMax: -25, minH: 0.8, maxH: 1.5, density: 0.3, yOffset: 2.0, spawn: 0.35 },
    // Upper mid tier
    { xMin: -35, xMax: 35, zMin: -22, zMax: -8, minH: 1.5, maxH: 3.5, density: 0.6, yOffset: 1.0, spawn: 0.55 },
    // City core (dense, mid height)
    { xMin: -40, xMax: 40, zMin: -7, zMax: 15, minH: 2.5, maxH: 6, density: 0.7, yOffset: 0.0, spawn: 0.7 },
    // Lower mid (dense, taller)
    { xMin: -40, xMax: 40, zMin: 15, zMax: 28, minH: 4, maxH: 8, density: 0.65, yOffset: -0.5, spawn: 0.6 },
  ];

  for (const zone of zones) {
    const step = zone.density < 0.5 ? 10 : 7;
    for (let x = zone.xMin; x <= zone.xMax; x += step) {
      for (let z = zone.zMin; z <= zone.zMax; z += step) {
        // Skip center plaza area around tower
        if (Math.abs(x) < 5 && z < 10 && z > -5) continue;
        if (Math.random() > zone.spawn) continue;

        const height = zone.minH + Math.random() * (zone.maxH - zone.minH);
        const color = buildingColors[Math.floor(Math.random() * buildingColors.length)];
        const shape = Math.random();

        let bx = x + (Math.random() - 0.5) * 2;
        let bz = z + (Math.random() - 0.5) * 2;

        if (shape < 0.1 && height > 3) {
          buildTaperedTower(bx, bz, height, color, zone.yOffset);
        } else if (shape < 0.18 && height > 4) {
          buildAngledRoof(bx, bz, 1.5 + Math.random(), height, color, zone.yOffset);
        } else {
          const w = 1.2 + Math.random() * 2;
          const d = 1.2 + Math.random() * 2;
          buildBox(bx, bz, w, height, d, color, zone.yOffset);
        }

        buildingPositions.push({ x: bx, z: bz, y: zone.yOffset, h: height });
      }
    }
  }

  // ═══════════════════════════════════════════
  //  R4: DISTANT SKYLINE (far edge towers)
  // ═══════════════════════════════════════════
  const skylinePositions = [];
  for (let x = -38; x <= 38; x += 5) {
    if (Math.random() < 0.25) continue;
    const height = 6 + Math.random() * 8;
    const color = buildingColors[Math.floor(Math.random() * buildingColors.length)];

    // Distant towers sit on the basin tier
    const bz = 34 + Math.random() * 8;
    const bw = 1.5 + Math.random() * 1.5;

    if (Math.random() < 0.15) {
      buildTaperedTower(x, bz, height, color, -0.5);
    } else {
      buildBox(x, bz, bw, height, bw, color, -0.5);
    }

    // Crown lights on distant towers
    if (Math.random() < 0.5) {
      const crownMat = new THREE.MeshStandardMaterial({
        color: 0xffdd88, emissive: 0xffdd88, emissiveIntensity: 0.2,
        transparent: true, opacity: 0.4,
      });
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), crownMat);
      crown.position.set(x, -0.5 + height + 0.1, bz);
      scene.add(crown);
      worldObjects.push(crown);
    }

    skylinePositions.push({ x, z: bz, h: height });
  }

  // ═══════════════════════════════════════════
  //  R3: NEON ADVERTISEMENT SIGNS
  // ═══════════════════════════════════════════
  const signColors = [0xff44aa, 0x44ffaa, 0xffaa44, 0x44aaff, 0xaa44ff, 0xff6644];
  const signTexts = ['DATA', 'NEON', 'VOID', 'ZERO', 'PULSE', 'ECHO', 'NOVA', 'CORE', 'WAVE', 'GRID'];

  // Place signs on existing building positions
  for (const bp of buildingPositions.slice(0, 60)) {
    if (Math.random() < 0.6) continue; // only ~40% of buildings get signs

    const color = signColors[Math.floor(Math.random() * signColors.length)];
    const signH = 0.4 + Math.random() * 0.5;
    const signW = 0.6 + Math.random() * 1.2;

    // Sign panel
    const signMat = new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 0.4 + Math.random() * 0.4,
      transparent: true, opacity: 0.3 + Math.random() * 0.3,
      side: THREE.DoubleSide,
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(signW, signH), signMat);

    // Position on a random side of the building
    const side = Math.floor(Math.random() * 4);
    const signY = bp.y + 1.5 + Math.random() * Math.min(bp.h - 1, 3);

    switch (side) {
      case 0: sign.position.set(bp.x + 1.0, signY, bp.z); sign.rotation.y = 0; break;
      case 1: sign.position.set(bp.x - 1.0, signY, bp.z); sign.rotation.y = Math.PI; break;
      case 2: sign.position.set(bp.x, signY, bp.z + 1.0); sign.rotation.y = -Math.PI / 2; break;
      case 3: sign.position.set(bp.x, signY, bp.z - 1.0); sign.rotation.y = Math.PI / 2; break;
    }

    scene.add(sign);
    worldObjects.push(sign);

    // Sign frame
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x555577, metalness: 0.6, roughness: 0.3,
    });
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(signW + 0.06, signH + 0.06, 0.02),
      frameMat
    );
    frame.position.copy(sign.position);
    frame.rotation.copy(sign.rotation);
    scene.add(frame);
    worldObjects.push(frame);

    // Scanlines (horizontal decorative stripes inside sign)
    for (let s = 0; s < 3; s++) {
      const stripeMat = new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 0.1,
        transparent: true, opacity: 0.1,
      });
      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(signW * 0.8, 0.02),
        stripeMat
      );
      stripe.position.copy(sign.position);
      stripe.position.y += (s - 1) * 0.1;
      stripe.rotation.copy(sign.rotation);
      scene.add(stripe);
      worldObjects.push(stripe);
    }

    // Point light for sign glow
    const signLight = new THREE.PointLight(color, 0.15, 2);
    signLight.position.copy(sign.position);
    scene.add(signLight);
    worldObjects.push(signLight);
  }

  // ═══════════════════════════════════════════
  //  ADDITIONAL CITY DETAILS
  // ═══════════════════════════════════════════

  // Neon street lamps (colorful, varied)
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x555577, metalness: 0.6 });
  const lightColors = [0x44aaff, 0xff66aa, 0x44ffaa, 0xffaa44, 0xaa66ff];

  for (let i = 0; i < 25; i++) {
    const x = (Math.random() - 0.5) * 60;
    const z = (Math.random() - 0.5) * 50 + 5;
    if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;

    const lc = lightColors[Math.floor(Math.random() * lightColors.length)];
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 2.5), poleMat);
    pole.position.set(x, 1.25, z);
    pole.castShadow = true;
    scene.add(pole);
    worldObjects.push(pole);

    const orbMat = new THREE.MeshStandardMaterial({
      color: lc, emissive: lc, emissiveIntensity: 0.5, transparent: true, opacity: 0.7,
    });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), orbMat);
    glow.position.set(x, 2.6, z);
    scene.add(glow);
    worldObjects.push(glow);

    const pointLight = new THREE.PointLight(lc, 0.2, 4);
    pointLight.position.copy(glow.position);
    scene.add(pointLight);
    worldObjects.push(pointLight);
  }

  // Glowing ground crystals
  for (let i = 0; i < 20; i++) {
    const x = (Math.random() - 0.5) * 60;
    const z = (Math.random() - 0.5) * 60;
    const pc = lightColors[Math.floor(Math.random() * lightColors.length)];
    const podMat = new THREE.MeshStandardMaterial({
      color: pc, emissive: pc, emissiveIntensity: 0.15,
      transparent: true, opacity: 0.25,
    });
    const pod = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), podMat);
    pod.position.set(x, 0.08, z);
    scene.add(pod);
    worldObjects.push(pod);
  }

  // ═══════════════════════════════════════════
  //  R5: SKY + ATMOSPHERE
  // ═══════════════════════════════════════════

  // Sky gradient with aurora bands
  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x000033) },
      midColor: { value: new THREE.Color(0x0a0a3a) },
      bottomColor: { value: new THREE.Color(0x1a1a3a) },
      glowColor: { value: new THREE.Color(0x224488) },
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
      uniform vec3 midColor;
      uniform vec3 bottomColor;
      uniform vec3 glowColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        vec3 col = mix(midColor, topColor, max(h, 0.0));
        col = mix(col, bottomColor, max(-h * 0.3, 0.0));
        // Aurora band near horizon
        float aurora = exp(-pow((h + 0.15) * 6.0, 2.0));
        col += glowColor * aurora * 0.3;
        // Star speckle
        float stars = step(0.998, fract(sin(dot(vWorldPosition.xz * 100.0, vec2(12.9898, 78.233))) * 43758.5453));
        col += vec3(1.0) * stars * 0.3;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.BackSide,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 32), skyMat);
  scene.add(sky);
  worldObjects.push(sky);

  // Horizon glow ring
  const horizonMat = new THREE.MeshStandardMaterial({
    color: 0x3355aa, emissive: 0x3355aa, emissiveIntensity: 0.12,
    transparent: true, opacity: 0.06, side: THREE.DoubleSide,
  });
  const horizonRing = new THREE.Mesh(new THREE.RingGeometry(90, 93, 48), horizonMat);
  horizonRing.position.set(0, -1.5, 0);
  horizonRing.rotation.x = -Math.PI / 2;
  scene.add(horizonRing);
  worldObjects.push(horizonRing);

  // City glow reflection on ground (giant ring under the city)
  const cityGlowMat = new THREE.MeshStandardMaterial({
    color: 0x2233aa, emissive: 0x2233aa, emissiveIntensity: 0.05,
    transparent: true, opacity: 0.05, side: THREE.DoubleSide,
  });
  const cityGlow = new THREE.Mesh(new THREE.RingGeometry(10, 60, 48), cityGlowMat);
  cityGlow.position.set(0, 0.01, 5);
  cityGlow.rotation.x = -Math.PI / 2;
  scene.add(cityGlow);
  worldObjects.push(cityGlow);

  // Fog
  scene.fog = new THREE.FogExp2(0x08081a, 0.006);

  // ═══════════════════════════════════════════
  //  PARTICLES (floating data motes)
  // ═══════════════════════════════════════════
  const particleCount = 400;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 5 + Math.random() * 35;
    positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = 0.5 + Math.random() * 5;
    positions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 10;

    const pc2 = lightColors[Math.floor(Math.random() * lightColors.length)];
    colors[i * 3] = ((pc2 >> 16) & 0xff) / 255;
    colors[i * 3 + 1] = ((pc2 >> 8) & 0xff) / 255;
    colors[i * 3 + 2] = (pc2 & 0xff) / 255;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particleMat = new THREE.PointsMaterial({
    size: 0.06, vertexColors: true, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);
  worldObjects.push(particles);
  window.__gameParticles = { positions, particles, time: 0, count: particleCount };

  console.log(`🌆 Revamped city built: ${worldObjects.length} objects, ${particleCount} particles`);
  return worldObjects;
}