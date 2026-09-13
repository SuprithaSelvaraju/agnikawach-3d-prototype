import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { COLORS, fontUI } from "../../styles/tokens";

/* =========================================================================
   SETUP SCENE — a polished, non-interactive-data product visualization
   (the camera itself IS interactive — see the OrbitControls rig at the
   bottom of this file). Deliberately separate from scenes/sceneBuilders.js
   + FacilityScene: own geometry, own materials, no picking, no hazard-zone
   palette.

   This pass focuses on three things beyond the original geometry:
     1) A believable site (soil, grass, roads, perimeter fence, engineered
        pad + local foundations) instead of one giant concrete slab.
     2) Material/light polish (metal hierarchy, contrasty three-point
        directional lighting, filmic tone mapping, contact shadows) so it
        reads as a rendered product shot, not a CAD preview.
     3) A genuine hero interaction: slow constant auto-rotation via
        OrbitControls, with the user able to grab and spin the model;
        auto-rotate politely resumes a couple seconds after release.

   Equipment layout, annotation anchors, and the annotation-rendering
   contract with SetupScreen.jsx are unchanged.
   ========================================================================= */

const MAT = {
  // process vessels — light metallic steel, but with enough body to read
  // as a material rather than white plastic
  tank: new THREE.MeshStandardMaterial({ color: 0xd8dee3, metalness: 0.42, roughness: 0.32 }),
  tankAlt: new THREE.MeshStandardMaterial({ color: 0xc9d0d6, metalness: 0.4, roughness: 0.35 }),
  // structural / darker steel
  steelDark: new THREE.MeshStandardMaterial({ color: 0x3d4650, metalness: 0.55, roughness: 0.4 }),
  // platforms & railings — dark industrial metal
  slate: new THREE.MeshStandardMaterial({ color: 0x262a2e, metalness: 0.5, roughness: 0.45 }),
  rackSteel: new THREE.MeshStandardMaterial({ color: 0x454e57, metalness: 0.48, roughness: 0.46 }),
  // piping — metallic with subtle variation vs. structural steel
  pipeMain: new THREE.MeshStandardMaterial({ color: 0x747f8a, metalness: 0.5, roughness: 0.36 }),
  navy: new THREE.MeshStandardMaterial({ color: 0x1a252b, metalness: 0.18, roughness: 0.48 }),
  // restrained AgniKawach accent — used sparingly on selected process lines
  orange: new THREE.MeshStandardMaterial({ color: 0xc24a1d, metalness: 0.12, roughness: 0.4 }),
  amber: new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.18, roughness: 0.5 }),
  // concrete family
  concrete: new THREE.MeshStandardMaterial({ color: 0xc3bcae, metalness: 0.02, roughness: 0.88 }),
  concreteDark: new THREE.MeshStandardMaterial({ color: 0x9e9788, metalness: 0.02, roughness: 0.92 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x2b3138, metalness: 0.4, roughness: 0.25 }),
  grating: new THREE.MeshStandardMaterial({ color: 0x585f65, metalness: 0.45, roughness: 0.45 }),
  // site dressing
  soil: new THREE.MeshStandardMaterial({ color: 0x7c6249, metalness: 0, roughness: 0.96 }),
  asphalt: new THREE.MeshStandardMaterial({ color: 0x2b2d30, metalness: 0.05, roughness: 0.85 }),
  asphaltLine: new THREE.MeshStandardMaterial({ color: 0xcfc9ba, metalness: 0, roughness: 0.6 }),
  grass: new THREE.MeshStandardMaterial({ color: 0x6f8f57, metalness: 0, roughness: 0.95 }),
  grassDark: new THREE.MeshStandardMaterial({ color: 0x577345, metalness: 0, roughness: 0.95 }),
  fence: new THREE.MeshStandardMaterial({ color: 0x2f3236, metalness: 0.55, roughness: 0.5 }),
  foliage: new THREE.MeshStandardMaterial({ color: 0x5f7a4a, metalness: 0, roughness: 0.85 }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x7a6248, metalness: 0, roughness: 0.9 }),
};

const cast = (m) => {
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};

/* ---- equipment builders (geometry unchanged; materials above upgraded) ---- */

function buildTank(radius, height, { ladder = true, alt = false } = {}) {
  const g = new THREE.Group();
  const mat = alt ? MAT.tankAlt : MAT.tank;

  const base = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.28, radius + 0.28, 0.3, 28), MAT.steelDark);
  base.position.y = 0.15;
  g.add(cast(base));

  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 32), mat);
  body.position.y = height / 2 + 0.3;
  g.add(cast(body));

  const cap = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  cap.position.y = height + 0.3;
  g.add(cast(cap));

  [0.32, 0.68].forEach((f) => {
    const band = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.015, 0.045, 6, 28), MAT.steelDark);
    band.position.y = height * f + 0.3;
    band.rotation.x = Math.PI / 2;
    g.add(cast(band));
  });

  const trim = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.02, 0.075, 6, 28), MAT.orange);
  trim.position.y = height * 0.14 + 0.3;
  trim.rotation.x = Math.PI / 2;
  g.add(cast(trim));

  if (ladder) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, height, 0.06), MAT.slate);
    rail.position.set(radius + 0.1, height / 2 + 0.3, 0.25);
    g.add(cast(rail));
    for (let i = 0; i < Math.round(height / 0.75); i++) {
      const rung = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.04), MAT.slate);
      rung.position.set(radius + 0.1, 0.5 + i * 0.75, 0.25);
      g.add(rung);
    }
  }

  const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.4, 8), MAT.steelDark);
  vent.position.set(0, height + 0.5, 0);
  g.add(cast(vent));

  return g;
}

function buildHorizontalVessel(radius, length) {
  const g = new THREE.Group();
  const y = radius + 0.75;

  [-length / 3, length / 3].forEach((z) => {
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.5, 0.45, radius * 1.8), MAT.concrete);
    plinth.position.set(0, 0.22, z);
    g.add(cast(plinth));
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.3, 0.5, radius * 1.6), MAT.steelDark);
    saddle.position.set(0, 0.7, z);
    g.add(cast(saddle));
  });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 28), MAT.tank);
  body.rotation.x = Math.PI / 2;
  body.position.y = y;
  g.add(cast(body));

  [-length / 2 + radius * 0.65, length / 2 - radius * 0.65].forEach((z) => {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 10), MAT.tank);
    cap.position.set(0, y, z);
    g.add(cast(cap));
  });

  const girth = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.02, 0.06, 6, 28), MAT.steelDark);
  girth.rotation.y = 0;
  girth.position.set(0, y, 0);
  g.add(cast(girth));

  const manway = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 16), MAT.steelDark);
  manway.rotation.x = Math.PI / 2;
  manway.position.set(radius + 0.02, y, 0);
  g.add(cast(manway));

  return g;
}

function buildValve(pipeRadius = 0.1) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(pipeRadius * 1.8, pipeRadius * 1.8, pipeRadius * 2.2, 12), MAT.slate);
  g.add(cast(body));
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(pipeRadius * 0.22, pipeRadius * 0.22, pipeRadius * 2.4, 6), MAT.steelDark);
  stem.position.y = pipeRadius * 2.6;
  g.add(cast(stem));
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(pipeRadius * 1.3, pipeRadius * 0.2, 8, 16), MAT.amber);
  wheel.position.y = pipeRadius * 4;
  g.add(cast(wheel));
  return g;
}

function buildFlange(pipeRadius = 0.1) {
  return cast(new THREE.Mesh(new THREE.TorusGeometry(pipeRadius * 1.3, 0.03, 6, 16), MAT.steelDark));
}

function buildPipe(a, b, radius = 0.09, material = MAT.steelDark) {
  const start = new THREE.Vector3(a.x, a.y, a.z);
  const end = new THREE.Vector3(b.x, b.y, b.z);
  const dir = new THREE.Vector3().subVectors(end, start);
  const length = dir.length();
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 12), material);
  pipe.position.copy(new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5));
  pipe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return cast(pipe);
}

// A right-angle routed run: straight segments between successive points,
// with a small elbow fitting at each interior joint. This is what makes
// equipment-to-rack connections read as engineered piping rather than a
// diagonal line cutting through open air.
function buildRoutedPipe(points, radius = 0.09, material = MAT.steelDark) {
  const g = new THREE.Group();
  for (let i = 0; i < points.length - 1; i++) {
    g.add(buildPipe(points[i], points[i + 1], radius, material));
  }
  for (let i = 1; i < points.length - 1; i++) {
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.35, 12, 10), material);
    elbow.position.set(points[i].x, points[i].y, points[i].z);
    g.add(cast(elbow));
  }
  return g;
}

function buildTrestle(topY, spanX) {
  const g = new THREE.Group();
  [-spanX / 2, spanX / 2].forEach((x) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, topY, 8), MAT.rackSteel);
    post.position.set(x, topY / 2, 0);
    g.add(cast(post));
  });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(spanX + 0.2, 0.09, 0.09), MAT.rackSteel);
  beam.position.y = topY;
  g.add(cast(beam));
  const brace = new THREE.Mesh(new THREE.BoxGeometry(spanX * 0.8, 0.05, 0.05), MAT.rackSteel);
  brace.position.y = topY * 0.55;
  brace.rotation.z = Math.PI / 10;
  g.add(cast(brace));
  return g;
}

function buildPipeRack(a, b, { trestles = 3, lines = 2, valveAt = null } = {}) {
  const g = new THREE.Group();
  const start = new THREE.Vector3(a.x, a.y, a.z);
  const end = new THREE.Vector3(b.x, b.y, b.z);
  const dir = new THREE.Vector3().subVectors(end, start);
  const across = new THREE.Vector3(-dir.z, 0, dir.x).normalize().multiplyScalar(0.24);
  const yaw = Math.atan2(dir.x, dir.z);

  for (let i = 0; i < lines; i++) {
    const off = across.clone().multiplyScalar(i - (lines - 1) / 2);
    const p1 = start.clone().add(off);
    const p2 = end.clone().add(off);
    g.add(buildPipe(p1, p2, i === 0 ? 0.12 : 0.08, i === 0 ? MAT.orange : MAT.pipeMain));
    [0.22, 0.5, 0.78].forEach((t) => {
      const fl = buildFlange(i === 0 ? 0.12 : 0.08);
      fl.position.copy(new THREE.Vector3().lerpVectors(p1, p2, t));
      fl.rotation.y = yaw;
      fl.rotation.x = Math.PI / 2;
      g.add(fl);
    });
  }

  for (let i = 0; i <= trestles; i++) {
    const t = i / trestles;
    const p = new THREE.Vector3().lerpVectors(start, end, t);
    const trestle = buildTrestle(p.y, 0.9);
    trestle.rotation.set(0, yaw + Math.PI / 2, 0);
    trestle.position.set(p.x, 0, p.z);
    g.add(trestle);
  }

  if (valveAt != null) {
    const p = new THREE.Vector3().lerpVectors(start, end, valveAt).add(across.clone().multiplyScalar(-1));
    const v = buildValve(0.11);
    v.position.copy(p);
    v.rotation.y = yaw;
    v.rotation.x = Math.PI / 2;
    g.add(v);
  }

  return g;
}

function buildRailedPlatform(innerR, outerR, y) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.RingGeometry(innerR, outerR, 32), MAT.grating);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = y;
  g.add(cast(ring));

  const rail = new THREE.Mesh(new THREE.TorusGeometry(outerR - 0.03, 0.025, 6, 32), MAT.slate);
  rail.rotation.x = -Math.PI / 2;
  rail.position.y = y + 0.85;
  g.add(cast(rail));

  const postCount = 14;
  for (let i = 0; i < postCount; i++) {
    const a = (i / postCount) * Math.PI * 2;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 6), MAT.slate);
    post.position.set(Math.cos(a) * (outerR - 0.03), y + 0.425, Math.sin(a) * (outerR - 0.03));
    g.add(post);
  }
  return g;
}

function buildStair(fromY, toY, x, z, steps = 8) {
  const g = new THREE.Group();
  const dz = 1.6;
  for (let i = 0; i < steps; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, dz / steps), MAT.grating);
    step.position.set(0, fromY + ((toY - fromY) * (i + 1)) / steps, -i * (dz / steps));
    g.add(cast(step));
  }
  [-0.42, 0.42].forEach((xOff) => {
    const stringer = new THREE.Mesh(new THREE.BoxGeometry(0.05, toY - fromY, dz), MAT.slate);
    stringer.position.set(xOff, fromY + (toY - fromY) / 2, -dz / 2);
    g.add(cast(stringer));
  });
  g.position.set(x, 0, z);
  return g;
}

function buildTower(radius, height) {
  const g = new THREE.Group();

  const base = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.45, radius + 0.45, 0.35, 28), MAT.steelDark);
  base.position.y = 0.18;
  g.add(cast(base));

  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.06, height, 28), MAT.tank);
  body.position.y = height / 2 + 0.18;
  g.add(cast(body));

  [0.22, 0.45, 0.7, 0.9].forEach((f) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.02, 0.045, 6, 28), MAT.steelDark);
    ring.position.y = height * f + 0.18;
    ring.rotation.x = Math.PI / 2;
    g.add(cast(ring));
  });

  const navyBand = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.025, radius + 0.025, height * 0.07, 28), MAT.navy);
  navyBand.position.y = height * 0.38 + 0.18;
  g.add(cast(navyBand));

  const platformY = height * 0.62 + 0.18;
  g.add(buildRailedPlatform(radius + 0.15, radius + 1.5, platformY));
  g.add(buildStair(0.3, platformY, radius + 2.6, -0.5, 9));

  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, height, 0.06), MAT.slate);
  rail.position.set(radius + 0.15, height / 2 + 0.18, radius * 0.4);
  g.add(cast(rail));

  const capCone = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.85, radius * 1.1, 20), MAT.steelDark);
  capCone.position.y = height + (radius * 1.1) / 2 + 0.18;
  g.add(cast(capCone));

  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.2, 12), MAT.steelDark);
  stack.position.y = height + radius * 1.1 + 1.1 + 0.18;
  g.add(cast(stack));

  return g;
}

function buildPumpSkid() {
  const g = new THREE.Group();
  const skid = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.16, 1.15), MAT.steelDark);
  skid.position.y = 0.08;
  g.add(cast(skid));

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.5, 0.65), MAT.slate);
  body.position.set(-0.3, 0.16 + 0.25, 0);
  g.add(cast(body));

  const volute = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.26, 16), MAT.tank);
  volute.rotation.x = Math.PI / 2;
  volute.position.set(-0.3, 0.16 + 0.26, 0.42);
  g.add(cast(volute));

  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.5), MAT.amber);
  guard.position.set(0.08, 0.16 + 0.24, 0);
  g.add(cast(guard));

  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.55, 16), MAT.tank);
  motor.rotation.z = Math.PI / 2;
  motor.position.set(0.55, 0.16 + 0.24, 0);
  g.add(cast(motor));

  return g;
}

function buildBuilding(w, d, h) {
  const g = new THREE.Group();
  const pad = new THREE.Mesh(new THREE.BoxGeometry(w + 1, 0.2, d + 1), MAT.concreteDark);
  pad.position.y = 0.1;
  g.add(cast(pad));

  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), MAT.concrete);
  body.position.y = h / 2 + 0.2;
  g.add(cast(body));

  const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.35, 0.16, d + 0.35), MAT.navy);
  roof.position.y = h + 0.38;
  g.add(cast(roof));

  const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.5, 0.06), MAT.slate);
  door.position.set(0, 0.95, d / 2 + 0.03);
  g.add(door);

  const win = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.65, 0.05), MAT.glass);
  win.position.set(w / 3, h * 0.6 + 0.2, d / 2 + 0.03);
  g.add(win);

  return g;
}

function buildTree(scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.5 * scale, 6), MAT.trunk);
  trunk.position.y = 0.25 * scale;
  g.add(cast(trunk));
  const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.34 * scale, 8, 6), MAT.foliage);
  foliage.position.y = 0.58 * scale;
  g.add(cast(foliage));
  return g;
}

function buildLeakCloud(position, sourceY) {
  const group = new THREE.Group();
  group.position.set(position.x, 0, position.z);

  // Soft fog texture
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(
    128, 128, 5,
    128, 128, 128
  );

  gradient.addColorStop(0, "rgba(255, 125, 55, 0.30)");
  gradient.addColorStop(0.22, "rgba(255, 130, 60, 0.20)");
  gradient.addColorStop(0.45, "rgba(255, 140, 70, 0.11)");
  gradient.addColorStop(0.70, "rgba(255, 150, 80, 0.045)");
  gradient.addColorStop(1, "rgba(255, 155, 90, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const particleMaterial = new THREE.SpriteMaterial({
    map: texture,
    color: 0xff9a62,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
  });

  /*
   * x spread
   * y height above release
   * alpha
   * size
   * phase
   */
  const seeds = [
    [ 0.00,  0.0, 0.20, 2.4, 0.10],
    [ 0.35,  0.35, 0.16, 2.8, 0.42],
    [-0.40,  0.55, 0.15, 3.0, 0.73],

    [ 0.65,  0.85, 0.13, 3.4, 0.18],
    [-0.70,  1.00, 0.12, 3.5, 0.56],
    [ 0.15,  1.15, 0.13, 3.8, 0.88],

    [ 0.95,  1.45, 0.10, 4.0, 0.31],
    [-0.95,  1.65, 0.095, 4.2, 0.67],
    [ 0.35,  1.85, 0.10, 4.4, 0.12],

    [-0.45,  2.05, 0.085, 4.6, 0.49],
    [ 1.10,  2.25, 0.075, 4.8, 0.82],
    [-1.10,  2.45, 0.070, 4.9, 0.25],

    [ 0.60,  2.70, 0.060, 5.1, 0.61],
    [-0.65,  2.90, 0.055, 5.2, 0.94],

    [ 1.30,  3.15, 0.045, 5.3, 0.37],
    [-1.25,  3.35, 0.040, 5.4, 0.71],

    [ 0.30,  3.60, 0.035, 5.6, 0.16],
    [-0.35,  3.85, 0.030, 5.7, 0.53],
  ];

  const particles = [];

  seeds.forEach(([x, y, alpha, size, phase]) => {
    const sprite = new THREE.Sprite(particleMaterial.clone());

    sprite.position.set(
      x,
      sourceY + y,
      (Math.sin(phase * Math.PI * 2) * 0.5)
    );

    sprite.scale.set(size, size, 1);

    sprite.userData = {
      baseX: x,
      baseY: sourceY + y,
      baseZ: Math.sin(phase * Math.PI * 2) * 0.5,

      phase,

      speed: 0.22 + phase * 0.16,

      // Wider movement higher up
      spread: 0.35 + y * 0.20,

      baseOpacity: alpha,
      baseScale: size,
    };

    sprite.material.opacity = alpha;

    group.add(sprite);
    particles.push(sprite);
  });

  group.userData.leakParticles = particles;

  return group;
}

// Restrained, stylized "potential release point" — not the Results
// screen's LFL/half/quarter palette or geometry. Children tagged with
// userData.pulse animate a slow, subtle breathing opacity in the render
// loop so it reads as a live conceptual visualization, not a static decal.
function buildReleaseCue(position, tallY) {
  const g = new THREE.Group();
  g.position.set(position.x, 0, position.z);

  [
    { r: 2.3, base: 0.26, phase: 0 },
    { r: 3.7, base: 0.16, phase: 1.1 },
  ].forEach(({ r, base, phase }) => {
    const mat = new THREE.MeshBasicMaterial({ color: 0xc24a1d, transparent: true, opacity: base, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.12, 48), mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;
    ring.userData = { pulse: true, base, phase };
    g.add(ring);
  });

  const discMat = new THREE.MeshBasicMaterial({ color: 0xf2a679, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(2.3, 48), discMat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.05;
  disc.userData = { pulse: true, base: 0.12, phase: 0.6 };
  g.add(disc);

  const beamMat = new THREE.MeshBasicMaterial({ color: 0xe6672f, transparent: true, opacity: 0.13, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.4, tallY, 16, 1, true), beamMat);
  beam.position.y = tallY / 2;
  beam.userData = { pulse: true, base: 0.13, phase: 1.8 };
  g.add(beam);

  return g;
}

function buildGroundGlow() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  grad.addColorStop(0, "rgba(150,180,210,0.35)");
  grad.addColorStop(1, "rgba(150,180,210,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(24, 48),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.02;
  return mesh;
}

// Soft dark radial-gradient decal used as a cheap contact-shadow / AO
// hint under equipment that doesn't already carry its own concrete
// foundation geometry (tanks, tower, pump skids).
function buildContactShadow(radius, opacity = 0.32) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, `rgba(18,18,16,${opacity})`);
  grad.addColorStop(0.7, `rgba(18,18,16,${opacity * 0.35})`);
  grad.addColorStop(1, "rgba(18,18,16,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 32),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.022;
  return mesh;
}

/* ---- site dressing: soil, engineered pad, roads, fence, grass ---- */

function buildRoadSegment(x1, z1, x2, z2, width = 3.2) {
  const g = new THREE.Group();
  const axisX = Math.abs(x2 - x1) >= Math.abs(z2 - z1);
  const length = axisX ? Math.abs(x2 - x1) : Math.abs(z2 - z1);
  const midX = (x1 + x2) / 2;
  const midZ = (z1 + z2) / 2;

  const roadGeo = axisX
    ? new THREE.BoxGeometry(length + width, 0.05, width)
    : new THREE.BoxGeometry(width, 0.05, length + width);
  const road = new THREE.Mesh(roadGeo, MAT.asphalt);
  road.position.set(midX, 0.025, midZ);
  road.receiveShadow = true;
  g.add(road);

  const lineGeo = axisX
    ? new THREE.BoxGeometry(Math.max(length * 0.85, 0.5), 0.01, 0.08)
    : new THREE.BoxGeometry(0.08, 0.01, Math.max(length * 0.85, 0.5));
  const line = new THREE.Mesh(lineGeo, MAT.asphaltLine);
  line.position.set(midX, 0.058, midZ);
  g.add(line);

  return g;
}

function buildFenceLine(x1, z1, x2, z2, axis) {
  const g = new THREE.Group();
  const height = 1.9;
  const length = axis === "x" ? Math.abs(x2 - x1) : Math.abs(z2 - z1);
  if (length < 0.3) return g;
  const midX = (x1 + x2) / 2;
  const midZ = (z1 + z2) / 2;
  const spacing = 3.3;
  const count = Math.max(1, Math.round(length / spacing));

  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const px = x1 + (x2 - x1) * t;
    const pz = z1 + (z2 - z1) * t;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, height, 6), MAT.fence);
    post.position.set(px, height / 2, pz);
    g.add(cast(post));
  }

  [0.55, 1.55].forEach((ry) => {
    const rail =
      axis === "x"
        ? new THREE.Mesh(new THREE.BoxGeometry(length, 0.035, 0.035), MAT.fence)
        : new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, length), MAT.fence);
    rail.position.set(midX, ry, midZ);
    g.add(cast(rail));
  });

  const fabric = new THREE.Mesh(
    new THREE.PlaneGeometry(length, height * 0.72),
    new THREE.MeshBasicMaterial({ color: 0x3a3d40, transparent: true, opacity: 0.14, side: THREE.DoubleSide })
  );
  fabric.position.set(midX, height * 0.42, midZ);
  if (axis === "z") fabric.rotation.y = Math.PI / 2;
  g.add(fabric);

  return g;
}

function buildFence(half, gate) {
  const g = new THREE.Group();
  const gw = gate.width / 2;
  // south edge, split around the entrance gate
  g.add(buildFenceLine(-half, half, gate.x - gw, half, "x"));
  g.add(buildFenceLine(gate.x + gw, half, half, half, "x"));
  // north edge
  g.add(buildFenceLine(-half, -half, half, -half, "x"));
  // west + east edges
  g.add(buildFenceLine(-half, -half, -half, half, "z"));
  g.add(buildFenceLine(half, -half, half, half, "z"));
  return g;
}

function buildGrassPatch(x, z, r, dark = false) {
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(r, 18), dark ? MAT.grassDark : MAT.grass);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.012, z);
  mesh.receiveShadow = true;
  return mesh;
}

function buildGround(half) {
  const g = new THREE.Group();
  g.add(buildGroundGlow());

  // soil base spanning the full site
  const soil = new THREE.Mesh(new THREE.PlaneGeometry(half * 2, half * 2), MAT.soil);
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = -0.03;
  soil.receiveShadow = true;
  g.add(soil);

  // engineered process pad under the tank farm / tower / vessel / pumps —
  // scoped to the process cluster rather than the whole plot, so the
  // building, roads, soil and grass stay visually distinct around it.
  const padW = 19;
  const padD = 14.5;
  const padX = -0.3;
  const padZ = 0.4;
  const pad = new THREE.Mesh(new THREE.BoxGeometry(padW, 0.16, padD), MAT.concrete);
  pad.position.set(padX, 0.05, padZ);
  pad.receiveShadow = true;
  g.add(cast(pad));

  const padTrim = new THREE.Mesh(new THREE.BoxGeometry(padW + 0.5, 0.05, padD + 0.5), MAT.concreteDark);
  padTrim.position.set(padX, 0.015, padZ);
  g.add(padTrim);

  for (let i = -2; i <= 2; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(padW - 0.6, 0.01, 0.05), MAT.concreteDark);
    line.position.set(padX, 0.135, padZ + i * (padD / 5.2));
    g.add(line);
  }

  // access road: enters from the south perimeter, threads past the
  // process pad, and branches to the utility building.
  const gateX = -6;
  g.add(buildRoadSegment(gateX, half, gateX, -2, 3.2));
  g.add(buildRoadSegment(gateX, -2, -10, -2, 3.0));
  g.add(buildRoadSegment(-10, -2, -10, -6.2, 2.6));

  // perimeter security fence with a gate opening aligned to the road
  g.add(buildFence(half * 0.94, { x: gateX, width: 5.5 }));

  // grass patches between the engineered core and the fence line
  const grassSpots = [
    { x: -11.4, z: 9.4, r: 3.3 },
    { x: -12, z: -9.2, r: 3.0, dark: true },
    { x: 10.4, z: -9.6, r: 3.6, dark: true },
    { x: 10.7, z: 8.5, r: 3.1 },
    { x: 0.8, z: 11.7, r: 3.8, dark: true },
    { x: -8.6, z: 0.2, r: 2.1 },
    { x: 4.6, z: -11.1, r: 2.5 },
    { x: 7.4, z: 10.3, r: 2.2, dark: true },
  ];
  grassSpots.forEach((s) => g.add(buildGrassPatch(s.x, s.z, s.r, s.dark)));

  // subtle walkway accent on the pad itself, kept from the original design
  const walkway = new THREE.Mesh(
    new THREE.RingGeometry(half * 0.5, half * 0.53, 4, 1, Math.PI / 4),
    new THREE.MeshStandardMaterial({ color: 0xdfe3e6, metalness: 0, roughness: 1, side: THREE.DoubleSide })
  );
  walkway.rotation.x = -Math.PI / 2;
  walkway.position.y = 0.14;
  g.add(walkway);

  // perimeter trees, rooted in the grass rather than on bare concrete
  const treeSpots = [
    { x: -11.3, z: 9.6, s: 1 },
    { x: -12.6, z: -9.5, s: 0.85 },
    { x: 11, z: -9.9, s: 1.05 },
    { x: 11.3, z: 8.7, s: 0.9 },
    { x: 0.9, z: 12.2, s: 1 },
    { x: 7.6, z: 10.6, s: 0.8 },
  ];
  treeSpots.forEach((t) => {
    const tree = buildTree(t.s);
    tree.position.set(t.x, 0, t.z);
    g.add(tree);
  });

  return g;
}

/* ---- rig layout (also defines annotation anchors, keyed by id) ---- */

function buildRig() {
  const rig = new THREE.Group();
  const GROUND_HALF = 14;
  rig.add(buildGround(GROUND_HALF));

  const towerPos = { x: 1.5, z: -0.5 };
  const towerHeight = 10.5;
  const tower = buildTower(1.15, towerHeight);
  tower.position.set(towerPos.x, 0, towerPos.z);
  rig.add(tower);
  const towerShadow = buildContactShadow(3.2, 0.3);
  towerShadow.position.set(towerPos.x, 0.022, towerPos.z);
  rig.add(towerShadow);

  const tanks = [
    { pos: { x: -7.2, z: 4.5 }, r: 2.3, h: 7.6, alt: false },
    { pos: { x: -3.6, z: 7.4 }, r: 1.65, h: 5.6, alt: true },
    { pos: { x: -9.4, z: -1.2 }, r: 1.3, h: 4.4, alt: false },
    { pos: { x: -5.6, z: -4.4 }, r: 1.05, h: 3.6, alt: true },
  ];
  tanks.forEach((t) => {
    const tank = buildTank(t.r, t.h, { alt: t.alt });
    tank.position.set(t.pos.x, 0, t.pos.z);
    rig.add(tank);
    const shadow = buildContactShadow(t.r * 2.0, 0.3);
    shadow.position.set(t.pos.x, 0.022, t.pos.z);
    rig.add(shadow);
  });

  const vessel = buildHorizontalVessel(1.05, 4.6);
  vessel.position.set(6.8, 0, -6.2);
  vessel.rotation.y = Math.PI / 5;
  rig.add(vessel);
  const vesselShadow = buildContactShadow(3.6, 0.26);
  vesselShadow.position.set(6.8, 0.022, -6.2);
  rig.add(vesselShadow);

  const pumps = [{ x: 5.6, z: -2.4 }, { x: 8, z: 1.6 }];
  pumps.forEach((p, i) => {
    const pump = buildPumpSkid();
    pump.rotation.y = i * 0.4;
    pump.position.set(p.x, 0, p.z);
    rig.add(pump);
    const shadow = buildContactShadow(1.5, 0.28);
    shadow.position.set(p.x, 0.022, p.z);
    rig.add(shadow);
  });

  const building = buildBuilding(3.4, 2.6, 2.2);
  building.position.set(-10, 0, -7.2);
  rig.add(building);

  const apron = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.2), MAT.concreteDark);
  apron.rotation.x = -Math.PI / 2;
  apron.position.set(6.8, 0.03, 1.8);
  rig.add(apron);

  // Internal network: tanks -> rack -> tower, plus routed (right-angle)
  // connections from the pumps into the process equipment.
  rig.add(buildPipeRack({ x: -7.2, y: 1.6, z: 6.2 }, { x: -3.6, y: 1.6, z: 8.6 }, { trestles: 1, lines: 2 }));
  rig.add(buildPipeRack({ x: -7.2, y: 1.6, z: 6.2 }, { x: towerPos.x - 0.9, y: 2.4, z: towerPos.z + 2.4 }, { trestles: 3, lines: 2, valveAt: 0.5 }));
  rig.add(buildPipeRack({ x: -9.4, y: 1.4, z: 0.6 }, { x: towerPos.x - 1.4, y: 1.4, z: towerPos.z + 0.4 }, { trestles: 2, lines: 1 }));

  rig.add(
    buildRoutedPipe(
      [
        { x: 5.6, y: 0.9, z: -2.4 },
        { x: 5.6, y: 0.9, z: -0.9 },
        { x: towerPos.x + 1.3, y: 0.9, z: -0.9 },
      ],
      0.09,
      MAT.pipeMain
    )
  );
  rig.add(
    buildRoutedPipe(
      [
        { x: 8, y: 0.9, z: 1.6 },
        { x: 8, y: 0.9, z: -6.2 },
        { x: 7.85, y: 1.9, z: -6.2 },
      ],
      0.08,
      MAT.pipeMain
    )
  );

  // Extra engineered connections so the equipment reads as one linked
  // process network rather than isolated objects on a plot: a return
  // line from the horizontal vessel up into the tower, and a header
  // tying the two pump skids together.
  rig.add(
    buildRoutedPipe(
      [
        { x: 6.8, y: 1.9, z: -6.2 },
        { x: 6.8, y: 3.1, z: -3.4 },
        { x: towerPos.x + 1.0, y: 3.1, z: towerPos.z - 0.8 },
        { x: towerPos.x + 1.0, y: 2.0, z: towerPos.z - 0.8 },
      ],
      0.085,
      MAT.pipeMain
    )
  );
  rig.add(
    buildRoutedPipe(
      [
        { x: 5.6, y: 0.55, z: -2.4 },
        { x: 8, y: 0.55, z: -2.4 },
        { x: 8, y: 0.55, z: 1.6 },
      ],
      0.07,
      MAT.pipeMain
    )
  );

  // Perimeter header rack along two back edges — the primary structural
  // read of the plot, tied back into the internal network at two points
  // rather than left as a disconnected decorative loop.
  const rackY = 2.9;
  const edge = GROUND_HALF * 0.82;
  rig.add(buildPipeRack({ x: -edge, y: rackY, z: -edge }, { x: edge, y: rackY, z: -edge }, { trestles: 5, lines: 2 }));
  rig.add(buildPipeRack({ x: -edge, y: rackY, z: -edge }, { x: -edge, y: rackY, z: edge }, { trestles: 5, lines: 2 }));
  const cornerElbow = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), MAT.pipeMain);
  cornerElbow.position.set(-edge, rackY, -edge);
  rig.add(cast(cornerElbow));

  rig.add(
    buildRoutedPipe(
      [
        { x: 6, y: rackY, z: -edge },
        { x: 6, y: rackY, z: -6.2 },
        { x: 6.8, y: 1.9, z: -6.2 },
      ],
      0.1,
      MAT.pipeMain
    )
  );
  rig.add(
    buildRoutedPipe(
      [
        { x: -edge, y: rackY, z: -1.2 },
        { x: -9.4, y: rackY, z: -1.2 },
        { x: -9.4, y: 4.7, z: -1.2 },
      ],
      0.1,
      MAT.pipeMain
    )
  );

const releaseCue = buildReleaseCue(
  { x: towerPos.x, z: towerPos.z },
  towerHeight + 5
);
rig.add(releaseCue);

const leakCloud = buildLeakCloud(
  { x: towerPos.x, z: towerPos.z },
  towerHeight + 1.8
);
rig.add(leakCloud);

const pulseMeshes = [];
  releaseCue.traverse((o) => {
    if (o.userData && o.userData.pulse) pulseMeshes.push(o);
  });

  const anchors = {
    hazards: new THREE.Vector3(towerPos.x, towerHeight + 3.2, towerPos.z),
    impact: new THREE.Vector3(-6.2, 9.2, 5.6),
    decisions: new THREE.Vector3(-10, 3.4, -7.2),
  };

  return { rig, anchors, pulseMeshes, leakCloud };
}

export default function SetupScene({ annotations = [] }) {
  const containerRef = useRef(null);
  const labelRefs = useRef({});

  useEffect(() => {
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = null;

    const aspect = width / height;
    const viewSize = 12.3;
    const camera = new THREE.OrthographicCamera(-viewSize * aspect, viewSize * aspect, viewSize, -viewSize, 0.1, 200);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.98;
    if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Contrasty three-point directional lighting rather than an
    // environment map — a bright uniform env map was flattening every
    // metal surface toward white; direct light + a modest hemisphere
    // fill keeps the steel/concrete/orange hierarchy readable.
    scene.add(new THREE.HemisphereLight(0xeef2f6, 0xb7ab98, 0.55));
    const key = new THREE.DirectionalLight(0xfff4e6, 1.5);
    key.position.set(16, 26, 14);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -20;
    key.shadow.camera.right = 20;
    key.shadow.camera.top = 20;
    key.shadow.camera.bottom = -20;
    key.shadow.bias = -0.0012;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xcfe0ff, 0.3);
    fill.position.set(-14, 10, -12);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffd9b0, 0.28);
    rim.position.set(-6, 8, -18);
    scene.add(rim);
    scene.add(new THREE.AmbientLight(0xffffff, 0.16));

    const { rig, anchors, pulseMeshes, leakCloud } = buildRig();
    scene.add(rig);

    // ---- default camera view ----
    const target = new THREE.Vector3(-1.0, 2.2, 0.5);
    const azimuth0 = Math.PI / 4;
    const elevAngle = Math.PI / 8;
    const dist = 40;

    const applyCamera = (az) => {
      const horiz = dist * Math.cos(elevAngle);
      camera.position.set(
        target.x + horiz * Math.sin(az),
        target.y + dist * Math.sin(elevAngle),
        target.z + horiz * Math.cos(az)
      );
      camera.lookAt(target);
    };
    applyCamera(azimuth0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.enableZoom = false;
    const polar = Math.PI / 2 - elevAngle;
    controls.minPolarAngle = polar - 0.32;
    controls.maxPolarAngle = polar + 0.22;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.update();

    let resumeTimer = null;
    const handleStart = () => {
      controls.autoRotate = false;
      if (resumeTimer) clearTimeout(resumeTimer);
    };
    const handleEnd = () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        controls.autoRotate = true;
      }, 2200);
    };
    controls.addEventListener("start", handleStart);
    controls.addEventListener("end", handleEnd);

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      const a = w / h;
      camera.left = -viewSize * a;
      camera.right = viewSize * a;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const projected = new THREE.Vector3();
    let t = 0;
    let raf;
    const tick = () => {
      t += 0.006;
      controls.update();

      pulseMeshes.forEach((m) => {
        m.material.opacity = m.userData.base * (0.72 + 0.28 * Math.sin(t * 0.9 + m.userData.phase));
      });

    const leakParticles = leakCloud?.userData?.leakParticles || [];

      leakParticles.forEach((particle) => {
        const data = particle.userData;

        const drift = Math.sin(
          t * data.speed + data.phase * Math.PI * 2
        );

        particle.position.x =
          data.baseX + drift * data.spread;

        particle.position.z =
          data.baseZ +
          Math.cos(t * data.speed * 0.8 + data.phase * 5) *
            data.spread;

        particle.position.y =
          data.baseY + Math.sin(t * 0.35 + data.phase * 6) * 0.16;

        const pulse =
          0.88 +
          0.12 * Math.sin(t * 0.8 + data.phase * 7);

        particle.material.opacity =
          data.baseOpacity * pulse;

        particle.scale.setScalar( data.baseScale * (0.94 + 0.08 * Math.sin(t * 0.45 + data.phase * 5)) );

      });

      renderer.render(scene, camera);

      const rect = container.getBoundingClientRect();
      Object.entries(anchors).forEach(([id, vec]) => {
        const el = labelRefs.current[id];
        if (!el) return;
        projected.copy(vec).project(camera);
        if (projected.z > 1) {
          el.style.opacity = "0";
          return;
        }
        const x = (projected.x * 0.5 + 0.5) * rect.width;
        const y = (-projected.y * 0.5 + 0.5) * rect.height;
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.style.opacity = "1";
      });

      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      if (resumeTimer) clearTimeout(resumeTimer);
      controls.removeEventListener("start", handleStart);
      controls.removeEventListener("end", handleEnd);
      controls.dispose();
      ro.disconnect();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {annotations.map((a) => (
        <div
          key={a.id}
          ref={(el) => (labelRefs.current[a.id] = el)}
          className="absolute pointer-events-none"
          style={{ left: 0, top: 0, opacity: 0, transition: "opacity 0.4s ease" }}
        >
          <span
            className="absolute rounded-full"
            style={{ left: -3, top: -3, width: 6, height: 6, background: COLORS.brand }}
          />
          <span
            className="absolute"
            style={{ left: -0.5, top: -34, width: 1, height: 32, background: "rgba(194,74,29,0.4)" }}
          />
          <div
            className="absolute flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{
              left: 0,
              top: -40,
              transform: "translate(-50%, -100%)",
              whiteSpace: "nowrap",
              background: "rgba(255,255,255,0.94)",
              border: `1px solid ${COLORS.border}`,
              boxShadow: "0 6px 18px rgba(20,23,27,0.08)",
            }}
          >
            <span
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{ width: 22, height: 22, background: "#EEF0F1" }}
            >
              <a.icon size={12} color={COLORS.brandSecondary} />
            </span>
            <span style={{ fontFamily: fontUI, fontSize: 12, fontWeight: 600, color: COLORS.textPrimary }}>
              {a.title}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
