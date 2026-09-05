import * as THREE from 'three';

/**
 * Builds a compact flat city with 2 parallel × 2 perpendicular streets.
 * Central plaza at the intersection. All on y=0 ground plane.
 */
export function buildCity(scene) {
  const worldObjects = [];

  // ─── Materials ───
  const M = {
    ground: new THREE.MeshStandardMaterial({ color: 0x0a0a14, roughness: 0.95, metalness: 0.1 }),
    road: new THREE.MeshStandardMaterial({ color: 0x18181e, roughness: 0.95, metalness: 0.05 }),
    sidewalk: new THREE.MeshStandardMaterial({ color: 0x22223a, roughness: 0.8, metalness: 0.1 }),
    plaza: new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.8, metalness: 0.2 }),
    building: (c) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.4, roughness: 0.3, transparent: true, opacity: 0.92 }),
    window: (c, i) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, transparent: true, opacity: 0.5 }),
    neon: (c, i) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, transparent: true, opacity: 0.4, side: THREE.DoubleSide }),
  };

  // ─── Ground ───
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), M.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  worldObjects.push(ground);

  // ─── Street Layout ───
  // 2 parallel E-W streets at z=-8 and z=8
  // 2 perpendicular N-S streets at x=-10 and x=10
  // Central plaza from x=-5..5, z=-5..5
  
  const streetWidth = 3;
  const streetLength = 60;

  function buildStreet(zPos, xOffset, length, isHorizontal) {
    const street = new THREE.Mesh(
      new THREE.PlaneGeometry(isHorizontal ? length : streetWidth, isHorizontal ? streetWidth : length),
      M.road
    );
    street.rotation.x = -Math.PI / 2;
    street.position.set(isHorizontal ? 0 : xOffset, 0.01, isHorizontal ? zPos : 0);
    street.receiveShadow = true;
    scene.add(street);
    worldObjects.push(street);
  }

  // E-W streets (horizontal)
  buildStreet(-8, 0, streetLength, true);
  buildStreet(8, 0, streetLength, true);
  // N-S streets (vertical)
  buildStreet(0, -10, streetLength, false);
  buildStreet(0, 10, streetLength, false);

  // ─── Sidewalks ───
  function buildSidewalk(zPos, width, length, isHorizontal) {
    const sw = new THREE.Mesh(
      new THREE.PlaneGeometry(isHorizontal ? length : width, isHorizontal ? width : length),
      M.sidewalk
    );
    sw.rotation.x = -Math.PI / 2;
    sw.position.set(isHorizontal ? 0 : 0, 0.02, isHorizontal ? zPos : 0);
    sw.receiveShadow = true;
    scene.add(sw);
    worldObjects.push(sw);
  }

  buildSidewalk(-6.5, streetWidth + 1, streetLength, true);
  buildSidewalk(6.5, streetWidth + 1, streetLength, true);
  buildSidewalk(0, -8.5, streetLength, false);
  buildSidewalk(0, 8.5, streetLength, false);

  // ─── Central Plaza ───
  const plaza = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), M.plaza);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.set(0, 0.02, 0);
  plaza.receiveShadow = true;
  scene.add(plaza);
  worldObjects.push(plaza);

  // Plaza grid lines
  const grid = new THREE.GridHelper(12, 12, 0x4466aa, 0x224488);
  grid.position.set(0, 0.04, 0);
  scene.add(grid);
  worldObjects.push(grid);

  // ─── Landmark Tower (center of plaza) ───
  {
    const towerGroup = new THREE.Group();
    const segs = 4;
    const totalH = 8;

    for (let i = 0; i < segs; i++) {
      const t = i / segs;
      const w = 1.4 * (1 - t * 0.4);
      const d = 1.4 * (1 - t * 0.4);
      const segH = totalH / segs;
      const seg = new THREE.Mesh(
        new THREE.BoxGeometry(w, segH, d),
        M.building(0x3a4a7a)
      );
      seg.position.y = segH * i + segH / 2;
      seg.castShadow = true;
      seg.receiveShadow = true;
      towerGroup.add(seg);

      // Accent band
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.08, 0.05, d + 0.08),
        new THREE.MeshStandardMaterial({ color: 0x6688bb, metalness: 0.7, roughness: 0.1 })
      );
      band.position.y = segH * (i + 1);
      towerGroup.add(band);
    }

    // Crown spire
    const spireMat = new THREE.MeshStandardMaterial({ color: 0x88ddff, emissive: 0x88ddff, emissiveIntensity: 0.5 });
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.2, 8), spireMat);
    spire.position.y = totalH + 0.6;
    towerGroup.add(spire);

    // Beacon
    const beaconMat = new THREE.MeshStandardMaterial({ color: 0x44aaff, emissive: 0x44aaff, emissiveIntensity: 1.0 });
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), beaconMat);
    beacon.position.y = totalH + 1.3;
    towerGroup.add(beacon);

    const crownLight = new THREE.PointLight(0x4488ff, 1.5, 12);
    crownLight.position.y = totalH + 1.2;
    towerGroup.add(crownLight);

    towerGroup.position.set(0, 0, 0);
    scene.add(towerGroup);
    worldObjects.push(towerGroup);
  }

  // ─── Building Placement ───
  // 4 quadrants: NW (-x,-z), NE (+x,-z), SW (-x,+z), SE (+x,+z)
  const buildingColors = [0x2a2a4a, 0x3a3a5a, 0x1a1a3a, 0x4a4a6a, 0x2a3a5a, 0x3a4a6a];
  const buildingPositions = [];

  function placeBox(x, z, w, h, d, color) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.building(color));
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    worldObjects.push(mesh);
    return mesh;
  }

  // Define blocks as [xMin, xMax, zMin, zMax] avoiding streets and plaza
  const blocks = [
    // NW block: x from -24 to -12, z from -24 to -10
    { xMin: -24, xMax: -12, zMin: -24, zMax: -10, minH: 2, maxH: 5, density: 0.6 },
    // NE block: x from 12 to 24, z from -24 to -10
    { xMin: 12, xMax: 24, zMin: -24, zMax: -10, minH: 2, maxH: 5, density: 0.6 },
    // SW block: x from -24 to -12, z from 10 to 24
    { xMin: -24, xMax: -12, zMin: 10, zMax: 24, minH: 1.5, maxH: 4, density: 0.5 },
    // SE block: x from 12 to 24, z from 10 to 24
    { xMin: 12, xMax: 24, zMin: 10, zMax: 24, minH: 1.5, maxH: 4, density: 0.5 },
    // Plaza-adjacent: x from -5 to -12 and 5 to 12, z from -5 to -10 and 5 to 10
    { xMin: -12, xMax: -5, zMin: -10, zMax: -5, minH: 1.5, maxH: 3, density: 0.7 },
    { xMin: 5, xMax: 12, zMin: -10, zMax: -5, minH: 1.5, maxH: 3, density: 0.7 },
    { xMin: -12, xMax: -5, zMin: 5, zMax: 10, minH: 1.5, maxH: 3, density: 0.7 },
    { xMin: 5, xMax: 12, zMin: 5, zMax: 10, minH: 1.5, maxH: 3, density: 0.7 },
  ];

  for (const block of blocks) {
    const step = block.density > 0.6 ? 4 : 5;
    for (let x = block.xMin; x <= block.xMax; x += step) {
      for (let z = block.zMin; z <= block.zMax; z += step) {
        if (Math.random() > block.density) continue;

        const height = block.minH + Math.random() * (block.maxH - block.minH);
        const color = buildingColors[Math.floor(Math.random() * buildingColors.length)];
        const bx = x + (Math.random() - 0.5) * 1.5;
        const bz = z + (Math.random() - 0.5) * 1.5;

        // Offset from street edge
        const margin = 1.2;
        if ((Math.abs(bx) < 1.2 || Math.abs(bz) < 1.2) && 
            (Math.abs(bx - (-10)) < 2 + margin || Math.abs(bx - 10) < 2 + margin ||
             Math.abs(bz - (-8)) < margin || Math.abs(bz - 8) < margin)) continue;
        if (Math.abs(bx) < 6 && Math.abs(bz) < 6) continue; // plaza gap

        const w = 1.2 + Math.random() * 1.8;
        const d = 1.2 + Math.random() * 1.8;
        placeBox(bx, bz, w, height, d, color);
        buildingPositions.push({ x: bx, z: bz, y: 0, h: height });
      }
    }
  }

  // ─── Neon Signs on buildings ───
  const signColors = [0xff44aa, 0x44ffaa, 0xffaa44, 0x44aaff, 0xaa44ff];
  for (const bp of buildingPositions) {
    if (Math.random() > 0.4) continue;
    const color = signColors[Math.floor(Math.random() * signColors.length)];
    const signH = 0.3 + Math.random() * 0.4;
    const signW = 0.5 + Math.random() * 1.0;
    const signMat = new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 0.5,
      transparent: true, opacity: 0.35, side: THREE.DoubleSide,
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(signW, signH), signMat);
    const side = Math.floor(Math.random() * 4);
    const signY = 1.5 + Math.random() * Math.min(bp.h - 1, 2.5);
    switch (side) {
      case 0: sign.position.set(bp.x + 1.2, signY, bp.z); sign.rotation.y = 0; break;
      case 1: sign.position.set(bp.x - 1.2, signY, bp.z); sign.rotation.y = Math.PI; break;
      case 2: sign.position.set(bp.x, signY, bp.z + 1.2); sign.rotation.y = -Math.PI / 2; break;
      case 3: sign.position.set(bp.x, signY, bp.z - 1.2); sign.rotation.y = Math.PI / 2; break;
    }
    scene.add(sign);
    worldObjects.push(sign);
    const signLight = new THREE.PointLight(color, 0.15, 2);
    signLight.position.copy(sign.position);
    scene.add(signLight);
    worldObjects.push(signLight);
  }

  // ─── Street Lamps ───
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x555577, metalness: 0.6 });
  const lampColors = [0x44aaff, 0xff66aa, 0x44ffaa];

  // Along E-W streets
  for (let x = -22; x <= 22; x += 6) {
    if (Math.abs(x) < 5) continue;
    for (const z of [-8, 8]) {
      const lc = lampColors[Math.floor(Math.random() * lampColors.length)];
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 2.0), poleMat);
      pole.position.set(x, 1.0, z);
      pole.castShadow = true;
      scene.add(pole);
      const orbMat = new THREE.MeshStandardMaterial({ color: lc, emissive: lc, emissiveIntensity: 0.6, transparent: true, opacity: 0.7 });
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), orbMat);
      glow.position.set(x, 2.1, z);
      scene.add(glow);
      const pl = new THREE.PointLight(lc, 0.2, 3);
      pl.position.copy(glow.position);
      scene.add(pl);
    }
  }

  // Along N-S streets
  for (let z = -22; z <= 22; z += 6) {
    if (Math.abs(z) < 5) continue;
    for (const x of [-10, 10]) {
      const lc = lampColors[Math.floor(Math.random() * lampColors.length)];
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 2.0), poleMat);
      pole.position.set(x, 1.0, z);
      pole.castShadow = true;
      scene.add(pole);
      const orbMat = new THREE.MeshStandardMaterial({ color: lc, emissive: lc, emissiveIntensity: 0.6, transparent: true, opacity: 0.7 });
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), orbMat);
      glow.position.set(x, 2.1, z);
      scene.add(glow);
      const pl = new THREE.PointLight(lc, 0.2, 3);
      pl.position.copy(glow.position);
      scene.add(pl);
    }
  }

  // ─── Sky ───
  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x000022) },
      midColor: { value: new THREE.Color(0x080830) },
      bottomColor: { value: new THREE.Color(0x141450) },
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
        float t = clamp((h + 0.2) / 0.7, 0.0, 1.0);
        vec3 col = mix(bottomColor, mix(midColor, topColor, t * 1.5), t);
        float glow = exp(-pow(abs(h - 0.05) * 12.0, 2.0));
        col += glowColor * glow * 0.15;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.BackSide,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 32), skyMat);
  scene.add(sky);
  worldObjects.push(sky);

  // ─── Starfield ───
  const starCount = 1200;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  const starInt = new Float32Array(starCount);
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.8 + 0.1);
    const r = 140 + Math.random() * 20;
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi);
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    starInt[i] = 0.3 + Math.random() * 0.7;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('intensity', new THREE.BufferAttribute(starInt, 1));
  const starMat = new THREE.PointsMaterial({
    color: 0x8899cc, size: 0.15, transparent: true, opacity: 0.6,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);
  worldObjects.push(stars);

  // ─── Ambient Fog ───
  scene.fog = new THREE.FogExp2(0x080820, 0.008);

  return worldObjects;
}