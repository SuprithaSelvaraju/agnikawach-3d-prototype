import * as THREE from "three";
import { ZONE_META } from "../styles/tokens";
import { degToRad, bearingToVector } from "../utils/geo";

/* =========================================================================
   THREE.JS SCENE BUILDERS
   Each builder returns a THREE.Group; pickable groups carry
   userData = { kind, id }. Moved as-is from the original single-file
   implementation — no behavior changes.
   ========================================================================= */

export function makeEquipmentMesh(eq) {
  const group = new THREE.Group();
  group.position.set(eq.position.x, eq.position.y, eq.position.z);
  group.rotation.y = degToRad(eq.rotationYDeg || 0);
  group.userData = { kind: "equipment", id: eq.id };

  const steel = new THREE.MeshStandardMaterial({ color: 0xb7bec6, metalness: 0.35, roughness: 0.55 });
  const steelDark = new THREE.MeshStandardMaterial({ color: 0x7c838c, metalness: 0.3, roughness: 0.6 });
  const slate = new THREE.MeshStandardMaterial({ color: 0x4b535c, metalness: 0.25, roughness: 0.65 });
  const concrete = new THREE.MeshStandardMaterial({ color: 0xc7c1b3, metalness: 0.02, roughness: 0.92 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x545a5f, metalness: 0.1, roughness: 0.8 });

  const addShadow = (m) => {
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };

  switch (eq.type) {
    case "storage_tank": {
      const { radius, height } = eq.dimensions;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 28), steel);
      body.position.y = height / 2;
      group.add(addShadow(body));

      const cap = new THREE.Mesh(new THREE.SphereGeometry(radius, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), steel);
      cap.position.y = height;
      group.add(addShadow(cap));

      const base = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.4, radius + 0.4, 0.3, 28), steelDark);
      base.position.y = 0.15;
      group.add(addShadow(base));
      break;
    }
    case "vessel": {
      // Horizontal separator vessel on saddle supports.
      const { radius, height: length } = eq.dimensions;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 24), steel);
      body.rotation.z = Math.PI / 2;
      body.position.y = radius + 0.6;
      group.add(addShadow(body));

      [-length / 2 + radius * 0.7, length / 2 - radius * 0.7].forEach((zOff) => {
        const capEnd = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 10), steel);
        capEnd.position.set(zOff, radius + 0.6, 0);
        group.add(addShadow(capEnd));
      });

      [-length / 3, length / 3].forEach((zOff) => {
        const saddle = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.4, 0.6, radius * 1.6), steelDark);
        saddle.position.set(zOff, 0.3, 0);
        group.add(addShadow(saddle));
      });
      break;
    }
    case "pipe_run": {
      const { length, radius } = eq.dimensions;
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 12), steelDark);
      pipe.rotation.z = Math.PI / 2;
      group.add(addShadow(pipe));

      [-length / 2 + 1.5, 0, length / 2 - 1.5].forEach((xOff) => {
        const legHeight = eq.position.y;
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, legHeight, 0.18), slate);
        leg.position.set(xOff, -legHeight / 2, 0);
        group.add(addShadow(leg));
      });
      break;
    }
    case "pump": {
      const { width, length, height } = eq.dimensions;
      const skid = new THREE.Mesh(new THREE.BoxGeometry(width * 1.3, 0.2, length * 1.3), steelDark);
      skid.position.y = 0.1;
      group.add(addShadow(skid));

      const body = new THREE.Mesh(new THREE.BoxGeometry(width, height * 0.6, length), slate);
      body.position.y = 0.2 + (height * 0.6) / 2;
      group.add(addShadow(body));

      const motor = new THREE.Mesh(new THREE.CylinderGeometry(width * 0.32, width * 0.32, length * 0.7, 16), steel);
      motor.rotation.z = Math.PI / 2;
      motor.position.y = 0.2 + height * 0.6 + width * 0.32;
      group.add(addShadow(motor));
      break;
    }
    case "building": {
      const { width, depth, height } = eq.dimensions;
      const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), concrete);
      body.position.y = height / 2;
      group.add(addShadow(body));

      const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 0.8, 0.35, depth + 0.8), trim);
      roof.position.y = height + 0.18;
      group.add(addShadow(roof));

      const band = new THREE.Mesh(new THREE.BoxGeometry(width + 0.05, 0.4, depth + 0.05), trim);
      band.position.y = height * 0.35;
      group.add(addShadow(band));
      break;
    }
    default:
      break;
  }

  return group;
}

// Thin dressing pipe between two world points, purely visual (not pickable).
export function makePipeRackRun(a, b, radius = 0.12) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x646b72, metalness: 0.3, roughness: 0.6 });

  const start = new THREE.Vector3(a.x, a.y, a.z);
  const end = new THREE.Vector3(b.x, b.y, b.z);
  const dir = new THREE.Vector3().subVectors(end, start);
  const length = dir.length();

  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 10), mat);
  pipe.position.copy(new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5));
  pipe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  pipe.castShadow = true;
  group.add(pipe);

  const legMat = new THREE.MeshStandardMaterial({ color: 0x4b535c, metalness: 0.2, roughness: 0.7 });
  [0.28, 0.72].forEach((t) => {
    const p = new THREE.Vector3().lerpVectors(start, end, t);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, p.y, 0.14), legMat);
    leg.position.set(p.x, p.y / 2, p.z);
    leg.castShadow = true;
    group.add(leg);
  });

  return group;
}

export function makeGroundAndBoundary(facility) {
  const group = new THREE.Group();

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 2000),
    new THREE.MeshStandardMaterial({color: 0xe2e9ef, roughness: 1, metalness: 0})  
    );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  const grid = new THREE.GridHelper(600, 600 / 25, 0xc7d3de, 0xd8e2ea);
  grid.position.y = 0.01;
  group.add(grid);

  const { widthX, depthZ, originOffset } = facility.boundary;
  const hw = widthX / 2;
  const hd = depthZ / 2;
  const pts = [
    new THREE.Vector3(originOffset.x - hw, 0.05, originOffset.z - hd),
    new THREE.Vector3(originOffset.x + hw, 0.05, originOffset.z - hd),
    new THREE.Vector3(originOffset.x + hw, 0.05, originOffset.z + hd),
    new THREE.Vector3(originOffset.x - hw, 0.05, originOffset.z + hd),
    new THREE.Vector3(originOffset.x - hw, 0.05, originOffset.z - hd),
  ];
  const boundaryGeo = new THREE.BufferGeometry().setFromPoints(pts);
  const boundary = new THREE.Line(
    boundaryGeo,
    new THREE.LineDashedMaterial({ color: 0x565d64, dashSize: 3, gapSize: 2 })
  );
  boundary.computeLineDistances();
  group.add(boundary);

  return group;
}

function triangulateFlatPolygon(pointsXZ, y) {
  const vec2s = pointsXZ.map(([x, z]) => new THREE.Vector2(x, z));
  const triangles = THREE.ShapeUtils.triangulateShape(vec2s, []);
  const positions = [];
  pointsXZ.forEach(([x, z]) => positions.push(x, y, z));
  const indices = [];
  triangles.forEach((tri) => indices.push(tri[0], tri[1], tri[2]));

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function makeZoneMesh(zone, renderOrder) {
  const meta = ZONE_META[zone.styleKey];
  const geo = triangulateFlatPolygon(zone.geometry.pointsXZ, zone.geometry.planeYOffset);
  const mat = new THREE.MeshBasicMaterial({
    color: meta.threeColor,
    transparent: true,
    opacity: meta.baseOpacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = renderOrder;
  mesh.userData = { kind: "zone", id: zone.id, styleKey: zone.styleKey, baseOpacity: meta.baseOpacity };

  // Thin outline for readability against the dark viewport.
  const edgePts = zone.geometry.pointsXZ.map(([x, z]) => new THREE.Vector3(x, zone.geometry.planeYOffset + 0.02, z));
  edgePts.push(edgePts[0]);
  const edgeGeo = new THREE.BufferGeometry().setFromPoints(edgePts);
  const edge = new THREE.Line(edgeGeo, new THREE.LineBasicMaterial({ color: meta.threeColor, transparent: true, opacity: 0.9 }));
  edge.renderOrder = renderOrder + 0.1;

  const group = new THREE.Group();
  group.add(mesh);
  group.add(edge);
  group.userData = mesh.userData;
  return { group, mesh };
}

export function makeReleaseMarker(pos) {
  const group = new THREE.Group();
  group.position.set(pos.x, 0, pos.z);

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, pos.y + 1.5, 8),
    new THREE.MeshStandardMaterial({ color: 0xc24a1d, emissive: 0x5a1c0a, emissiveIntensity: 0.4 })
  );
  pole.position.y = (pos.y + 1.5) / 2;
  group.add(pole);

  const bead = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xe6672f, emissive: 0xc24a1d, emissiveIntensity: 0.7 })
  );
  bead.position.y = pos.y + 1.5;
  group.add(bead);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.1, 1.4, 32),
    new THREE.MeshBasicMaterial({ color: 0xc24a1d, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  group.add(ring);

  return group;
}

export function makeWindArrow(originOffset, bearingDeg, lengthM) {
  const dir = bearingToVector((bearingDeg + 180) % 360); // meteorological "from" -> blows-toward
  const origin = new THREE.Vector3(originOffset.x, originOffset.y, originOffset.z);
  const arrow = new THREE.ArrowHelper(dir.normalize(), origin, lengthM, 0xf4f5f6, lengthM * 0.28, lengthM * 0.14);
  arrow.line.material.linewidth = 2;
  return arrow;
}
