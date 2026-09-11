import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Wind,
  Info,
  Eye,
  EyeOff,
} from "lucide-react";

/* =========================================================================
   DATA  —  data/mockStudy.js
   The locked v0.1 study contract. Single source of truth for both the
   3D scene and the Results UI. Nothing here is derived or recalculated —
   values are exactly as agreed in the data-contract review.
   ========================================================================= */

const STUDY_DATA = {
  coordinateSystem: {
    xAxis: "East",
    zAxis: "North",
    yAxis: "Up",
    headingConvention:
      "0° = North, increasing clockwise (East = 90°, South = 180°, West = 270°)",
    note: "Wind direction is meteorological 'from' — the plume travels toward (bearing + 180°).",
  },

  study: {
    id: "study-0001",
    name: "LPG Storage Facility — Scenario 01",
    status: "completed",
    facilityId: "facility-lpg-01",
    scenarioId: "scenario-0001",
    analysisId: "analysis-0001",
  },

  facility: {
    id: "facility-lpg-01",
    name: "LPG Storage & Process Area",
    units: "m",
    boundary: { shape: "rectangle", widthX: 220, depthZ: 160, originOffset: { x: 0, z: 0 } },
    equipment: [
      {
        id: "eq-vessel-01",
        name: "T-104 Propane Storage Vessel",
        type: "storage_tank",
        position: { x: 20, y: 0, z: 30 },
        rotationYDeg: 0,
        dimensions: { radius: 4, height: 10 },
      },
      {
        id: "eq-line-01",
        name: "P-204 Process Feed Line",
        type: "pipe_run",
        position: { x: 38, y: 2, z: 42 },
        rotationYDeg: 30,
        dimensions: { length: 25, radius: 0.15 },
      },
      {
        id: "eq-separator-01",
        name: "V-301 Separator",
        type: "vessel",
        position: { x: 60, y: 0, z: 55 },
        rotationYDeg: 0,
        dimensions: { radius: 2.2, height: 6 },
      },
      {
        id: "eq-pump-01",
        name: "P-106 Transfer Pump",
        type: "pump",
        position: { x: 44, y: 0, z: 24 },
        rotationYDeg: 0,
        dimensions: { width: 1.5, length: 2, height: 1.5 },
      },
      {
        id: "eq-control-building",
        name: "Control Building",
        type: "building",
        position: { x: -30, y: 0, z: 10 },
        rotationYDeg: 0,
        dimensions: { width: 15, depth: 10, height: 5 },
      },
    ],
  },

  scenario: {
    material: { name: "Propane", formula: "C3H8", hazardType: "flammable" },
    releaseEquipmentId: "eq-vessel-01",
    releasePoint: { x: 20, y: 1.5, z: 30 },
    releaseType: "continuous_gas_release",
    sourceModel: "choked_orifice",
    holeSizeMm: 12,
    vesselPressureBarA: 8,
    processTemperatureC: 32,
    estimatedReleaseRateKgS: 0.9,
    duration: "continuous",
  },

  environment: {
    windSpeedMS: 5.2,
    windDirectionDeg: 247,
    windDirectionConvention: "meteorological_from",
    ambientTemperatureC: 32,
    weatherStabilityClass: "D",
    weatherStabilityLabel: "Neutral (overcast / windy)",
  },

  analysis: {
    mode: "screening_equivalent",
    status: "completed",
    isMock: true,
    mockNote: "Precomputed illustrative values. No solver was executed.",
  },

  hazardZones: [
    {
      id: "zone-lfl",
      label: "Flammable zone",
      thresholdType: "LFL",
      thresholdDescription: "At or above LFL — ignition possible",
      styleKey: "lfl",
      distanceDownwindM: 86.4,
      maxCrosswindWidthM: 24,
      areaM2: 420,
      geometry: {
        planeYOffset: 0.2,
        pointsXZ: [
          [20, 30], [33.2, 43.2], [55.1, 57.9], [80.9, 63.5],
          [99.6, 63.8], [86.4, 50.5], [64.5, 35.8], [38.7, 30.3],
        ],
      },
    },
    {
      id: "zone-half-lfl",
      label: "Caution zone",
      thresholdType: "1/2 LFL",
      thresholdDescription: "Gas concentration reducing",
      styleKey: "half_lfl",
      distanceDownwindM: 124.7,
      maxCrosswindWidthM: 36,
      areaM2: 760,
      geometry: {
        planeYOffset: 0.15,
        pointsXZ: [
          [20, 30], [38.8, 49.5], [70.4, 70.9], [107.7, 78.7],
          [134.8, 78.7], [116.0, 59.3], [84.4, 37.8], [47.1, 30.0],
        ],
      },
    },
    {
      id: "zone-quarter-lfl",
      label: "Low-concentration zone",
      thresholdType: "1/4 LFL",
      thresholdDescription: "Gas diluted by air",
      styleKey: "quarter_lfl",
      distanceDownwindM: 162.3,
      maxCrosswindWidthM: 48,
      areaM2: 1240,
      geometry: {
        planeYOffset: 0.1,
        pointsXZ: [
          [20, 30], [44.4, 55.7], [85.3, 83.8], [134.0, 93.7],
          [169.4, 93.4], [145.0, 67.7], [104.1, 39.7], [55.4, 29.7],
        ],
      },
    },
  ],

  affectedReceptors: [
    {
      id: "aff-eq-vessel-01",
      facilityEquipmentId: "eq-vessel-01",
      name: "T-104 Storage Tank",
      receptorType: "equipment",
      zoneId: "zone-lfl",
      distanceFromReleaseM: 0,
      status: "at_risk",
    },
    {
      id: "aff-eq-line-01",
      facilityEquipmentId: "eq-line-01",
      name: "P-204 Process Line",
      receptorType: "equipment",
      zoneId: "zone-lfl",
      distanceFromReleaseM: 21.6,
      status: "at_risk",
    },
    {
      id: "aff-eq-separator-01",
      facilityEquipmentId: "eq-separator-01",
      name: "V-301 Separator",
      receptorType: "equipment",
      zoneId: "zone-half-lfl",
      distanceFromReleaseM: 47.2,
      status: "at_risk",
    },
    {
      id: "aff-eq-pump-01",
      facilityEquipmentId: "eq-pump-01",
      name: "P-106 Transfer Pump",
      receptorType: "equipment",
      zoneId: "zone-quarter-lfl",
      distanceFromReleaseM: 24.7,
      status: "caution",
    },
    {
      id: "aff-eq-control-building",
      facilityEquipmentId: "eq-control-building",
      name: "Control Building",
      receptorType: "equipment",
      zoneId: null,
      distanceFromReleaseM: 53.9,
      status: "clear",
    },
  ],

  evidence: {
    method:
      "Choked-orifice source term into a Pasquill–Gifford Gaussian plume, open-country coefficients.",
    assumptions: [
      "Flat, open ground — no terrain or building effects",
      "Point-source release, steady-state continuous discharge",
      "Neutral (D-class) atmospheric stability",
      "No congestion or ignition-source modelling included",
      "Zone geometry and receptor positions are simplified/schematic, not computed from a solved concentration field",
    ],
    modelVersion: "prototype-mock-v0.1",
    validityRange: {
      minDistanceM: 10,
      maxDistanceM: 500,
      note: "Illustrative range only — not a validated model boundary.",
    },
    provenance: { sourceType: "mock", generatedBy: "prototype-mock-data-set" },
    disclaimer:
      "Illustrative only. Not a simulation result. Do not use for design, siting, emergency planning or a safety report.",
  },

  visualization: {
    releaseMarker: { position: { x: 20, y: 1.5, z: 30 }, label: "Release Point" },
    windVector: { originOffset: { x: 20, y: 3, z: 30 }, arrowLengthM: 20 },
    scaleReference: { unit: "m", tickIntervalM: 25 },
  },
};

/* =========================================================================
   DESIGN TOKENS
   Light, neutral, high-contrast app chrome. Orange reserved for brand /
   action. Hazard colors reserved exclusively for hazard zones + receptor
   status. The 3D viewport itself is a dark, instrument-panel surface —
   a deliberate, common CAD/engineering-tool convention that makes the
   translucent hazard geometry legible, distinct from the light app chrome.
   ========================================================================= */

const COLORS = {
  appBg: "#EEF0F1",
  surface: "#FFFFFF",
  border: "#DEE1E4",
  borderStrong: "#C6CACF",
  textPrimary: "#14171A",
  textSecondary: "#5B6169",
  textTertiary: "#8B9198",

  brand: "#C24A1D",
  brandHover: "#A23C15",

  viewportBg: "#14171B",
  viewportGrid: "#2A2F35",

  hazard: {
    lfl: "#C0392B",
    half_lfl: "#C77C1F",
    quarter_lfl: "#3F8556",
  },

  status: {
    at_risk: "#B23A2E",
    caution: "#B9791E",
    clear: "#6B7A70",
  },
};

const ZONE_META = {
  lfl: { swatch: COLORS.hazard.lfl, threeColor: 0xc0392b, baseOpacity: 0.55 },
  half_lfl: { swatch: COLORS.hazard.half_lfl, threeColor: 0xc77c1f, baseOpacity: 0.4 },
  quarter_lfl: { swatch: COLORS.hazard.quarter_lfl, threeColor: 0x3f8556, baseOpacity: 0.26 },
};

const STATUS_LABEL = { at_risk: "At risk", caution: "Caution", clear: "Clear" };

const FONT_IMPORT_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap";

const fontUI = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const fontMono = "'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace";

/* =========================================================================
   MATH HELPERS
   ========================================================================= */

const degToRad = (d) => (d * Math.PI) / 180;

// Compass bearing (0 = North = +Z, clockwise, East = +X) -> unit vector in XZ plane.
function bearingToVector(bearingDeg) {
  const r = degToRad(bearingDeg);
  return new THREE.Vector3(Math.sin(r), 0, Math.cos(r));
}

function compassLabel(deg) {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

/* =========================================================================
   THREE.JS SCENE BUILDERS
   scenes/Equipment.js, scenes/HazardZones.js, scenes/ReleaseMarker.js,
   scenes/WindVector.js — consolidated here since this environment renders
   a single-file artifact. Each builder returns a THREE.Group; pickable
   groups carry userData = { kind, id }.
   ========================================================================= */

// ---- shared materials (module-level, reused across all builders) ----
const MAT = {
  steel: new THREE.MeshStandardMaterial({ color: 0xb7bec6, metalness: 0.35, roughness: 0.5 }),
  steelDark: new THREE.MeshStandardMaterial({ color: 0x7c838c, metalness: 0.3, roughness: 0.6 }),
  slate: new THREE.MeshStandardMaterial({ color: 0x4b535c, metalness: 0.25, roughness: 0.65 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0xc7c1b3, metalness: 0.02, roughness: 0.92 }),
  concreteDark: new THREE.MeshStandardMaterial({ color: 0x9a958a, metalness: 0.02, roughness: 0.95 }),
  trim: new THREE.MeshStandardMaterial({ color: 0x545a5f, metalness: 0.1, roughness: 0.8 }),
  safety: new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.2, roughness: 0.6 }),
  pipeRack: new THREE.MeshStandardMaterial({ color: 0x646b72, metalness: 0.3, roughness: 0.6 }),
  glassDark: new THREE.MeshStandardMaterial({ color: 0x2b3138, metalness: 0.4, roughness: 0.3 }),
  asphalt: new THREE.MeshStandardMaterial({ color: 0x22262a, metalness: 0, roughness: 1 }),
  tankDressing: new THREE.MeshStandardMaterial({ color: 0xa9b0b8, metalness: 0.3, roughness: 0.55 }),
};

const addShadow = (m) => {
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};

// ---- reusable industrial detail helpers ----

function makeTagSprite(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(20,23,27,0.88)";
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 2;
  const r = 10;
  ctx.beginPath();
  ctx.roundRect(2, 2, canvas.width - 4, canvas.height - 4, r);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#E7E9EB";
  ctx.font = "600 30px 'IBM Plex Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(5.6, 1.4, 1);
  return sprite;
}

function makeConcretePad(width, depth, thickness = 0.25) {
  const pad = new THREE.Mesh(new THREE.BoxGeometry(width, thickness, depth), MAT.concreteDark);
  pad.position.y = thickness / 2;
  return addShadow(pad);
}

// Small valve + handwheel spool, inserted inline along a pipe run.
function makeValve(pipeRadius = 0.15) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(pipeRadius * 1.8, pipeRadius * 1.8, pipeRadius * 2.2, 12), MAT.slate);
  group.add(addShadow(body));
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(pipeRadius * 0.25, pipeRadius * 0.25, pipeRadius * 2.4, 6), MAT.steelDark);
  stem.position.y = pipeRadius * 2.6;
  group.add(addShadow(stem));
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(pipeRadius * 1.3, pipeRadius * 0.22, 8, 16), MAT.safety);
  wheel.position.y = pipeRadius * 4;
  group.add(addShadow(wheel));
  return group;
}

function makeFlangeRing(pipeRadius = 0.15) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(pipeRadius * 1.3, pipeRadius * 0.28, 8, 16), MAT.steelDark);
  return addShadow(ring);
}

// H-frame trestle support used along pipe racks, carrying 1-2 parallel lines.
function makeTrestle(topY, spanX) {
  const group = new THREE.Group();
  const postGeo = new THREE.CylinderGeometry(0.14, 0.16, 1, 8);
  [-spanX / 2, spanX / 2].forEach((x) => {
    const post = new THREE.Mesh(postGeo, MAT.pipeRack);
    post.scale.y = topY;
    post.position.set(x, topY / 2, 0);
    group.add(addShadow(post));
  });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(spanX + 0.3, 0.14, 0.14), MAT.pipeRack);
  beam.position.y = topY;
  group.add(addShadow(beam));
  const brace = new THREE.Mesh(new THREE.BoxGeometry(spanX * 0.85, 0.08, 0.08), MAT.pipeRack);
  brace.position.y = topY * 0.5;
  group.add(addShadow(brace));
  return group;
}

function makeEquipmentMesh(eq) {
  const group = new THREE.Group();
  group.position.set(eq.position.x, eq.position.y, eq.position.z);
  group.rotation.y = degToRad(eq.rotationYDeg || 0);
  group.userData = { kind: "equipment", id: eq.id };

  const { steel, steelDark, slate, concrete, trim, safety, glassDark } = MAT;

  switch (eq.type) {
    case "storage_tank": {
      const { radius, height } = eq.dimensions;
      group.add(makeConcretePad(radius * 2.7, radius * 2.7, 0.25));

      const base = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.4, radius + 0.4, 0.3, 28), steelDark);
      base.position.y = 0.4;
      group.add(addShadow(base));

      const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 28), steel);
      body.position.y = height / 2 + 0.4;
      group.add(addShadow(body));

      const cap = new THREE.Mesh(new THREE.SphereGeometry(radius, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), steel);
      cap.position.y = height + 0.4;
      group.add(addShadow(cap));

      // Stiffening rings — reads as a real welded vessel, not a plain cylinder.
      [0.35, 0.65].forEach((f) => {
        const band = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.02, 0.05, 6, 24), steelDark);
        band.position.y = height * f + 0.4;
        band.rotation.x = Math.PI / 2;
        group.add(addShadow(band));
      });

      // Access ladder up one side.
      const ladderRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, height, 0.08), slate);
      ladderRail.position.set(radius + 0.15, height / 2 + 0.4, 0.3);
      group.add(addShadow(ladderRail));
      const rung = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), slate);
      for (let i = 0; i < 6; i++) {
        const rr = rung.clone();
        rr.position.set(radius + 0.15, 0.6 + i * (height / 6.5), 0.3);
        group.add(rr);
      }

      // Outlet nozzle toward the process area (release point side).
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.4, 10), steelDark);
      nozzle.rotation.z = Math.PI / 2;
      nozzle.position.set(radius + 0.7, 1.6, 0);
      group.add(addShadow(nozzle));
      group.add((() => {
        const v = makeValve(0.18);
        v.position.set(radius + 1.5, 1.6, 0);
        v.rotation.x = Math.PI / 2;
        return v;
      })());

      const tag = makeTagSprite("T-104");
      tag.position.set(0, height + 2.2, 0);
      group.add(tag);
      break;
    }
    case "vessel": {
      // Horizontal separator / pressure vessel on saddle supports with a concrete plinth.
      const { radius, height: length } = eq.dimensions;
      const bodyY = radius + 0.9;

      group.add(makeConcretePad(length + 1, radius * 2.6, 0.25));

      [-length / 3, length / 3].forEach((zOff) => {
        const plinth = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.6, 0.5, radius * 1.9), concrete);
        plinth.position.set(zOff, 0.25, 0);
        group.add(addShadow(plinth));
        const saddle = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.4, 0.5, radius * 1.7), steelDark);
        saddle.position.set(zOff, 0.75, 0);
        group.add(addShadow(saddle));
      });

      const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 24), steel);
      body.rotation.z = Math.PI / 2;
      body.position.y = bodyY;
      group.add(addShadow(body));

      [-length / 2 + radius * 0.7, length / 2 - radius * 0.7].forEach((zOff) => {
        const capEnd = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 10), steel);
        capEnd.position.set(zOff, bodyY, 0);
        group.add(addShadow(capEnd));
      });

      // Girth stiffening ring, mid-body — reads as a pressure vessel.
      const girth = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.02, 0.06, 6, 24), steelDark);
      girth.rotation.y = Math.PI / 2;
      girth.position.set(0, bodyY, 0);
      group.add(addShadow(girth));

      // Manway (side access hatch).
      const manway = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.15, 16), steelDark);
      manway.rotation.z = Math.PI / 2;
      manway.position.set(0, bodyY, radius + 0.05);
      group.add(addShadow(manway));

      // Top instrument nozzle + pressure-relief stack.
      const prv = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.1, 8), steelDark);
      prv.position.set(length / 2 - radius * 0.9, bodyY + radius + 0.55, 0);
      group.add(addShadow(prv));
      const prvHead = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.35, 10), safety);
      prvHead.position.set(length / 2 - radius * 0.9, bodyY + radius + 1.15, 0);
      group.add(addShadow(prvHead));

      const tag = makeTagSprite("V-301");
      tag.position.set(0, bodyY + radius + 1.8, 0);
      group.add(tag);
      break;
    }
    case "pipe_run": {
      const { length, radius } = eq.dimensions;
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 12), steelDark);
      pipe.rotation.z = Math.PI / 2;
      group.add(addShadow(pipe));

      // Flange joints at intervals along the run.
      [-length / 2 + 2, -length / 6, length / 6, length / 2 - 2].forEach((xOff) => {
        const fl = makeFlangeRing(radius);
        fl.rotation.z = Math.PI / 2;
        fl.position.set(xOff, 0, 0);
        group.add(fl);
      });

      [-length / 2 + 1.5, 0, length / 2 - 1.5].forEach((xOff) => {
        const legHeight = eq.position.y;
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, legHeight, 0.18), slate);
        leg.position.set(xOff, -legHeight / 2, 0);
        group.add(addShadow(leg));
      });

      const tag = makeTagSprite("P-204");
      tag.position.set(0, 1.6, 0);
      group.add(tag);
      break;
    }
    case "pump": {
      const { width, length, height } = eq.dimensions;
      group.add(makeConcretePad(width * 1.8, length * 1.8, 0.2));

      const skid = new THREE.Mesh(new THREE.BoxGeometry(width * 1.3, 0.2, length * 1.3), steelDark);
      skid.position.y = 0.3;
      group.add(addShadow(skid));

      const pumpBody = new THREE.Mesh(new THREE.BoxGeometry(width * 0.7, height * 0.4, length * 0.55), slate);
      pumpBody.position.set(-length * 0.18, 0.4 + (height * 0.4) / 2, 0);
      group.add(addShadow(pumpBody));

      const volute = new THREE.Mesh(new THREE.CylinderGeometry(width * 0.32, width * 0.32, width * 0.3, 16), steel);
      volute.rotation.x = Math.PI / 2;
      volute.position.set(-length * 0.18, 0.4 + height * 0.4 * 0.5, length * 0.32);
      group.add(addShadow(volute));

      // Coupling guard — small safety-yellow accent between pump and motor, restrained.
      const guard = new THREE.Mesh(new THREE.BoxGeometry(width * 0.22, height * 0.22, length * 0.16), safety);
      guard.position.set(length * 0.06, 0.4 + (height * 0.22) / 2, 0);
      group.add(addShadow(guard));

      const motor = new THREE.Mesh(new THREE.CylinderGeometry(width * 0.32, width * 0.32, length * 0.55, 16), steel);
      motor.rotation.z = Math.PI / 2;
      motor.position.set(length * 0.32, 0.4 + width * 0.32, 0);
      group.add(addShadow(motor));

      // Suction / discharge stubs toward the pipe rack.
      const stub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.9, 8), steelDark);
      stub.rotation.x = Math.PI / 2;
      stub.position.set(-length * 0.18, 0.4 + height * 0.2, length * 0.55);
      group.add(addShadow(stub));

      const tag = makeTagSprite("P-106");
      tag.position.set(0, height + 1.4, 0);
      group.add(tag);
      break;
    }
    case "building": {
      const { width, depth, height } = eq.dimensions;
      group.add(makeConcretePad(width + 1.5, depth + 1.5, 0.2));

      const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), concrete);
      body.position.y = height / 2 + 0.2;
      group.add(addShadow(body));

      const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 0.8, 0.35, depth + 0.8), trim);
      roof.position.y = height + 0.38;
      group.add(addShadow(roof));

      const band = new THREE.Mesh(new THREE.BoxGeometry(width + 0.05, 0.4, depth + 0.05), trim);
      band.position.y = height * 0.35 + 0.2;
      group.add(addShadow(band));

      // Door + a couple of window strips for readability at a glance.
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 0.1), MAT.slate);
      door.position.set(0, 1.4, depth / 2 + 0.02);
      group.add(door);
      [-width / 3, width / 3].forEach((xOff) => {
        const win = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 0.06), glassDark);
        win.position.set(xOff, height * 0.62 + 0.2, depth / 2 + 0.02);
        group.add(win);
      });

      const tag = makeTagSprite("CTRL BLDG");
      tag.position.set(0, height + 1.8, 0);
      group.add(tag);
      break;
    }
    default:
      break;
  }

  return group;
}

// Pipe-rack run between two world points, carried on trestle supports (dressing, not pickable).
function makePipeRackRun(a, b, { trestles = 3, valveAt = null } = {}) {
  const group = new THREE.Group();
  const start = new THREE.Vector3(a.x, a.y, a.z);
  const end = new THREE.Vector3(b.x, b.y, b.z);
  const dir = new THREE.Vector3().subVectors(end, start);
  const length = dir.length();
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());

  // Two parallel lines riding the rack, offset slightly across the run.
  const across = new THREE.Vector3(-dir.z, 0, dir.x).normalize().multiplyScalar(0.28);
  [across.clone().multiplyScalar(1), across.clone().multiplyScalar(-1)].forEach((offset, li) => {
    const radius = li === 0 ? 0.14 : 0.1;
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 10), MAT.pipeRack);
    pipe.position.copy(new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)).add(offset);
    pipe.quaternion.copy(quat);
    pipe.castShadow = true;
    group.add(pipe);
  });

  for (let i = 0; i <= trestles; i++) {
    const t = i / trestles;
    const p = new THREE.Vector3().lerpVectors(start, end, t);
    const trestle = makeTrestle(p.y, 0.9);
    // Orient the trestle's span across the run direction rather than along it.
    const yaw = Math.atan2(dir.x, dir.z);
    trestle.rotation.set(0, yaw + Math.PI / 2, 0);
    trestle.position.set(p.x, 0, p.z);
    group.add(trestle);
  }

  if (valveAt != null) {
    const p = new THREE.Vector3().lerpVectors(start, end, valveAt);
    const v = makeValve(0.14);
    v.position.copy(p).add(across);
    const yaw = Math.atan2(dir.x, dir.z);
    v.rotation.y = yaw;
    v.rotation.x = Math.PI / 2;
    group.add(v);
  }

  return group;
}

function makeGroundAndBoundary(facility) {
  const group = new THREE.Group();

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 2000),
    new THREE.MeshStandardMaterial({ color: 0x1b1f24, roughness: 1, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  const grid = new THREE.GridHelper(600, 600 / 25, 0x3a4048, 0x252a30);
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

function makeZoneMesh(zone, renderOrder) {
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

function makeReleaseMarker(pos) {
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

function makeWindArrow(originOffset, bearingDeg, lengthM) {
  const dir = bearingToVector((bearingDeg + 180) % 360); // meteorological "from" -> blows-toward
  const origin = new THREE.Vector3(originOffset.x, originOffset.y, originOffset.z);
  const arrow = new THREE.ArrowHelper(dir.normalize(), origin, lengthM, 0xf4f5f6, lengthM * 0.28, lengthM * 0.14);
  arrow.line.material.linewidth = 2;
  return arrow;
}

/* =========================================================================
   FACILITY SCENE — imperative Three.js, mounted once.
   OrbitControls is unavailable in this runtime, so camera orbit / pan /
   zoom is implemented directly with pointer + wheel listeners below.
   ========================================================================= */

function FacilityScene({ data, selectedEquipmentId, selectedZoneId, visibleZones, onSelectEquipment, onSelectZone }) {
  const containerRef = useRef(null);
  const stateRef = useRef(null); // holds all mutable three.js refs across renders

  // ---- one-time scene construction ----
  useEffect(() => {
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.viewportBg);
    scene.fog = new THREE.Fog(COLORS.viewportBg, 220, 480);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 2000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting
    const hemi = new THREE.HemisphereLight(0x9fb3c8, 0x1a1c1f, 0.65);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff2e0, 1.1);
    sun.position.set(-120, 160, -60);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -180;
    sun.shadow.camera.right = 180;
    sun.shadow.camera.top = 180;
    sun.shadow.camera.bottom = -180;
    sun.shadow.camera.far = 500;
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0x556070, 0.25));

    // Ground + boundary
    scene.add(makeGroundAndBoundary(data.facility));

    // Equipment (pickable)
    const equipmentMeshes = {};
    data.facility.equipment.forEach((eq) => {
      const mesh = makeEquipmentMesh(eq);
      scene.add(mesh);
      equipmentMeshes[eq.id] = mesh;
    });

    // Selection ring helper, one reusable ring per equipment id
    const selectionRings = {};
    data.facility.equipment.forEach((eq) => {
      const ringRadius = (eq.dimensions.radius || eq.dimensions.width || 3) + 1.6;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(ringRadius, ringRadius + 0.35, 40),
        new THREE.MeshBasicMaterial({ color: 0xc24a1d, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(eq.position.x, 0.06, eq.position.z);
      ring.visible = false;
      scene.add(ring);
      selectionRings[eq.id] = ring;
    });

    // Persistent receptor status tint (always-on, independent of selection)
    data.affectedReceptors.forEach((r) => {
      const eq = data.facility.equipment.find((e) => e.id === r.facilityEquipmentId);
      if (!eq) return;
      const color = r.zoneId ? ZONE_META[data.hazardZones.find((z) => z.id === r.zoneId).styleKey].threeColor : 0x6b7a70;
      const radius = (eq.dimensions.radius || eq.dimensions.width || 3) + 0.9;
      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(radius, 32),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22 })
      );
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(eq.position.x, 0.03, eq.position.z);
      scene.add(disc);
    });

    // Pipe racks (dressing, not pickable)
    const T104 = data.facility.equipment.find((e) => e.id === "eq-vessel-01").position;
    const P204 = data.facility.equipment.find((e) => e.id === "eq-line-01").position;
    const V301 = data.facility.equipment.find((e) => e.id === "eq-separator-01").position;
    scene.add(makePipeRackRun({ x: T104.x, y: 1.6, z: T104.z + 3 }, { x: P204.x, y: P204.y, z: P204.z + 3 }));
    scene.add(makePipeRackRun({ x: P204.x, y: P204.y, z: P204.z - 3 }, { x: V301.x, y: 2.6, z: V301.z - 4 }));

    // Hazard zones (pickable), ordered largest-first for correct blending
    const zoneMeshes = {};
    [...data.hazardZones]
      .sort((a, b) => b.areaM2 - a.areaM2)
      .forEach((zone, i) => {
        const { group, mesh } = makeZoneMesh(zone, i);
        scene.add(group);
        zoneMeshes[zone.id] = { group, mesh };
      });

    // Release marker + wind arrow
    scene.add(makeReleaseMarker(data.visualization.releaseMarker.position));
    scene.add(
      makeWindArrow(
        data.visualization.windVector.originOffset,
        data.environment.windDirectionDeg,
        data.visualization.windVector.arrowLengthM
      )
    );

    // ---- camera framing: upwind three-quarter aerial view ----
    const target = new THREE.Vector3(70, 2, 50);
    const camState = { theta: degToRad(data.environment.windDirectionDeg), elevation: degToRad(30), radius: 210 };

    const applyCamera = () => {
      const horiz = camState.radius * Math.cos(camState.elevation);
      const h = camState.radius * Math.sin(camState.elevation);
      camera.position.set(
        target.x + horiz * Math.sin(camState.theta),
        target.y + h,
        target.z + horiz * Math.cos(camState.theta)
      );
      camera.lookAt(target);
    };
    applyCamera();

    // ---- pointer / wheel controls (orbit, pan, zoom) ----
    const dom = renderer.domElement;
    dom.style.touchAction = "none";
    let dragging = false;
    let dragButton = 0;
    let lastX = 0;
    let lastY = 0;
    let moved = 0;

    const onPointerDown = (e) => {
      dragging = true;
      dragButton = e.button;
      lastX = e.clientX;
      lastY = e.clientY;
      moved = 0;
      dom.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);

      if (dragButton === 2 || e.shiftKey) {
        const panSpeed = camState.radius * 0.0016;
        const right = new THREE.Vector3(Math.cos(camState.theta), 0, -Math.sin(camState.theta));
        target.addScaledVector(right, -dx * panSpeed);
        target.y += dy * panSpeed;
      } else {
        camState.theta -= dx * 0.006;
        camState.elevation = Math.min(1.45, Math.max(0.08, camState.elevation + dy * 0.006));
      }
      applyCamera();
    };
    const onPointerUp = (e) => {
      dragging = false;
      dom.releasePointerCapture(e.pointerId);
      if (moved < 5) handleClick(e);
    };
    const onWheel = (e) => {
      e.preventDefault();
      camState.radius = Math.min(420, Math.max(50, camState.radius * (1 + e.deltaY * 0.001)));
      applyCamera();
    };
    const onContextMenu = (e) => e.preventDefault();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const findPickable = (obj) => {
      let cur = obj;
      while (cur) {
        if (cur.userData && cur.userData.kind) return cur.userData;
        cur = cur.parent;
      }
      return null;
    };
    const handleClick = (e) => {
      const rect = dom.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const pickables = [...Object.values(equipmentMeshes), ...Object.values(zoneMeshes).map((z) => z.group)];
      const hits = raycaster.intersectObjects(pickables, true);
      if (hits.length === 0) {
        onSelectEquipment(null);
        onSelectZone(null);
        return;
      }
      const hitData = findPickable(hits[0].object);
      if (!hitData) return;
      if (hitData.kind === "equipment") onSelectEquipment(hitData.id);
      if (hitData.kind === "zone") onSelectZone(hitData.id);
    };

    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("wheel", onWheel, { passive: false });
    dom.addEventListener("contextmenu", onContextMenu);

    // ---- resize ----
    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // ---- render loop ----
    let raf;
    const tick = () => {
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    stateRef.current = { equipmentMeshes, selectionRings, zoneMeshes };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("pointermove", onPointerMove);
      dom.removeEventListener("pointerup", onPointerUp);
      dom.removeEventListener("wheel", onWheel);
      dom.removeEventListener("contextmenu", onContextMenu);
      renderer.dispose();
      if (container.contains(dom)) container.removeChild(dom);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // ---- reactive highlight / visibility updates (no scene rebuild) ----
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    Object.entries(s.selectionRings).forEach(([id, ring]) => {
      ring.visible = id === selectedEquipmentId;
    });

    Object.values(s.zoneMeshes).forEach(({ mesh }) => {
      mesh.visible = visibleZones[mesh.userData.styleKey] !== false;
    });
  }, [selectedEquipmentId, visibleZones]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    const anySelected = !!selectedZoneId;
    Object.entries(s.zoneMeshes).forEach(([id, { mesh }]) => {
      const base = mesh.userData.baseOpacity;
      if (!anySelected) mesh.material.opacity = base;
      else mesh.material.opacity = id === selectedZoneId ? Math.min(0.85, base + 0.25) : base * 0.35;
    });
  }, [selectedZoneId]);

  return <div ref={containerRef} className="absolute inset-0" />;
}

/* =========================================================================
   OVERLAYS — zone legend & compass, positioned on top of the canvas
   ========================================================================= */

function ZoneLegend({ zones, visibleZones, onToggle }) {
  return (
    <div
      className="absolute top-4 left-4 rounded-sm px-3 py-2.5"
      style={{ background: "rgba(20,23,27,0.82)", border: `1px solid ${COLORS.viewportGrid}`, backdropFilter: "blur(2px)" }}
    >
      <div className="text-[11px] mb-2" style={{ color: "#9BA3AB", fontFamily: fontUI }}>
        Hazard zones
      </div>
      <div className="flex flex-col gap-1.5">
        {zones.map((z) => {
          const on = visibleZones[z.styleKey] !== false;
          return (
            <button
              key={z.id}
              onClick={() => onToggle(z.styleKey)}
              className="flex items-center gap-2 text-left"
              style={{ opacity: on ? 1 : 0.45 }}
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: ZONE_META[z.styleKey].swatch }}
              />
              <span style={{ color: "#E7E9EB", fontFamily: fontUI, fontSize: 12.5 }}>{z.label}</span>
              {on ? <Eye size={13} color="#9BA3AB" /> : <EyeOff size={13} color="#9BA3AB" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CompassBadge({ windSpeedMS, windDirectionDeg }) {
  const blowsToward = (windDirectionDeg + 180) % 360;
  return (
    <div
      className="absolute top-4 right-4 rounded-sm px-3 py-2.5 flex items-center gap-3"
      style={{ background: "rgba(20,23,27,0.82)", border: `1px solid ${COLORS.viewportGrid}` }}
    >
      <div className="relative w-9 h-9 flex-shrink-0">
        <div className="absolute inset-0 rounded-full" style={{ border: "1px solid #444B52" }} />
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `rotate(${blowsToward}deg)` }}
        >
          <Wind size={16} color="#E6672F" strokeWidth={2.4} />
        </div>
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px]" style={{ color: "#8B9198", fontFamily: fontUI }}>N</span>
      </div>
      <div style={{ fontFamily: fontUI }}>
        <div style={{ color: "#E7E9EB", fontSize: 12.5, fontFamily: fontMono }}>{windSpeedMS.toFixed(1)} m/s</div>
        <div style={{ color: "#9BA3AB", fontSize: 11 }}>
          from {windDirectionDeg}° ({compassLabel(windDirectionDeg)})
        </div>
      </div>
    </div>
  );
}

function MockBadge() {
  return (
    <div
      className="absolute bottom-4 left-4 rounded-sm px-2.5 py-1.5 flex items-center gap-1.5"
      style={{ background: "rgba(20,23,27,0.82)", border: `1px solid ${COLORS.viewportGrid}` }}
    >
      <Info size={12} color="#C77C1F" />
      <span style={{ color: "#C7CBCF", fontSize: 11, fontFamily: fontUI }}>
        Illustrative mock data — no simulation was run
      </span>
    </div>
  );
}

/* =========================================================================
   RESULTS PANELS — features/results/*
   ========================================================================= */

function SectionHeading({ children }) {
  return (
    <div className="px-4 pt-4 pb-2" style={{ fontFamily: fontUI, fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
      {children}
    </div>
  );
}

function HazardZoneList({ zones, selectedZoneId, onSelectZone }) {
  return (
    <div>
      <SectionHeading>Hazard zones</SectionHeading>
      <div className="px-2 pb-2">
        {zones.map((z) => {
          const selected = z.id === selectedZoneId;
          return (
            <button
              key={z.id}
              onClick={() => onSelectZone(selected ? null : z.id)}
              className="w-full text-left rounded-sm px-2.5 py-2 mb-1 flex items-center gap-2.5"
              style={{
                background: selected ? "#F5EDE8" : "transparent",
                border: `1px solid ${selected ? COLORS.brand : "transparent"}`,
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ZONE_META[z.styleKey].swatch }} />
              <div className="flex-1 min-w-0">
                <div style={{ fontFamily: fontUI, fontSize: 13, color: COLORS.textPrimary, fontWeight: 500 }}>{z.label}</div>
                <div style={{ fontFamily: fontUI, fontSize: 11.5, color: COLORS.textSecondary }}>{z.thresholdType}</div>
              </div>
              <div className="text-right" style={{ fontFamily: fontMono }}>
                <div style={{ fontSize: 12.5, color: COLORS.textPrimary }}>{z.distanceDownwindM.toFixed(1)} m</div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{z.areaM2.toLocaleString()} m²</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReceptorList({ receptors, zonesById, selectedEquipmentId, onSelectEquipment }) {
  return (
    <div>
      <SectionHeading>Affected receptors</SectionHeading>
      <div className="px-2 pb-2">
        {receptors.map((r) => {
          const selected = r.facilityEquipmentId === selectedEquipmentId;
          const zone = r.zoneId ? zonesById[r.zoneId] : null;
          return (
            <button
              key={r.id}
              onClick={() => onSelectEquipment(selected ? null : r.facilityEquipmentId)}
              className="w-full text-left rounded-sm px-2.5 py-2 mb-1 flex items-center gap-2.5"
              style={{
                background: selected ? "#F5EDE8" : "transparent",
                border: `1px solid ${selected ? COLORS.brand : "transparent"}`,
              }}
            >
              {r.status === "clear" ? (
                <CheckCircle2 size={14} color={COLORS.status.clear} className="flex-shrink-0" />
              ) : (
                <AlertTriangle size={14} color={COLORS.status[r.status]} className="flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div style={{ fontFamily: fontUI, fontSize: 13, color: COLORS.textPrimary, fontWeight: 500 }}>{r.name}</div>
                <div style={{ fontFamily: fontUI, fontSize: 11.5, color: COLORS.textSecondary }}>
                  {zone ? zone.label : "Outside modelled zones"}
                </div>
              </div>
              <div className="text-right">
                <div style={{ fontFamily: fontMono, fontSize: 12.5, color: COLORS.textPrimary }}>
                  {r.distanceFromReleaseM.toFixed(1)} m
                </div>
                <div style={{ fontFamily: fontUI, fontSize: 11, color: COLORS.status[r.status], fontWeight: 500 }}>
                  {STATUS_LABEL[r.status]}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EnvironmentStrip({ scenario, environment }) {
  const items = [
    { label: "Material", value: scenario.material.name },
    { label: "Wind", value: `${environment.windSpeedMS.toFixed(1)} m/s` },
    { label: "From", value: `${environment.windDirectionDeg}° ${compassLabel(environment.windDirectionDeg)}` },
    { label: "Stability", value: `Class ${environment.weatherStabilityClass}` },
  ];
  return (
    <div>
      <SectionHeading>Environment</SectionHeading>
      <div className="px-4 pb-4 grid grid-cols-2 gap-x-3 gap-y-2.5">
        {items.map((it) => (
          <div key={it.label}>
            <div style={{ fontFamily: fontUI, fontSize: 11, color: COLORS.textTertiary }}>{it.label}</div>
            <div style={{ fontFamily: fontMono, fontSize: 13, color: COLORS.textPrimary }}>{it.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EvidencePanel({ evidence, analysis }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t" style={{ borderColor: COLORS.border }}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-4 py-3">
        <span style={{ fontFamily: fontUI, fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
          Evidence &amp; assumptions
        </span>
        {open ? <ChevronDown size={15} color={COLORS.textSecondary} /> : <ChevronRight size={15} color={COLORS.textSecondary} />}
      </button>
      {open && (
        <div className="px-4 pb-4" style={{ fontFamily: fontUI }}>
          <div
            className="flex items-start gap-2 rounded-sm px-2.5 py-2 mb-3"
            style={{ background: "#FBF2EC", border: `1px solid #E9CDB8` }}
          >
            <Info size={14} color={COLORS.brand} className="flex-shrink-0 mt-0.5" />
            <span style={{ fontSize: 12, color: "#7A3B1C", lineHeight: 1.4 }}>{evidence.disclaimer}</span>
          </div>

          <div className="mb-3">
            <div style={{ fontSize: 11, color: COLORS.textTertiary, marginBottom: 3 }}>Method</div>
            <div style={{ fontSize: 12.5, color: COLORS.textPrimary, lineHeight: 1.5 }}>{evidence.method}</div>
          </div>

          <div className="mb-3">
            <div style={{ fontSize: 11, color: COLORS.textTertiary, marginBottom: 4 }}>Assumptions</div>
            <ul className="list-disc pl-4 space-y-1">
              {evidence.assumptions.map((a, i) => (
                <li key={i} style={{ fontSize: 12.5, color: COLORS.textSecondary, lineHeight: 1.4 }}>{a}</li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-3">
            <div>
              <div style={{ fontSize: 11, color: COLORS.textTertiary }}>Model version</div>
              <div style={{ fontSize: 12.5, color: COLORS.textPrimary, fontFamily: fontMono }}>{evidence.modelVersion}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: COLORS.textTertiary }}>Validity range</div>
              <div style={{ fontSize: 12.5, color: COLORS.textPrimary, fontFamily: fontMono }}>
                {evidence.validityRange.minDistanceM}–{evidence.validityRange.maxDistanceM} m
              </div>
            </div>
          </div>

          <div
            className="flex items-center gap-2 rounded-sm px-2.5 py-2"
            style={{ background: "#F2F3F4" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: analysis.isMock ? COLORS.status.caution : COLORS.status.clear }}
            />
            <span style={{ fontSize: 11.5, color: COLORS.textSecondary }}>{analysis.mockNote}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   HEADER — no workflow stepper. Breadcrumb + status only.
   ========================================================================= */

function Header({ study }) {
  return (
    <header
      className="flex items-center justify-between px-5 flex-shrink-0"
      style={{ height: 56, background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}` }}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className="w-6 h-6 rounded-sm flex items-center justify-center"
            style={{ background: COLORS.brand }}
          >
            <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: fontUI }}>AK</span>
          </div>
          <span style={{ fontFamily: fontUI, fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>AgniKawach</span>
        </div>
        <div className="w-px h-4" style={{ background: COLORS.border }} />
        <div className="flex items-center gap-1.5 min-w-0" style={{ fontFamily: fontUI, fontSize: 13 }}>
          <span style={{ color: COLORS.textTertiary }}>Studies</span>
          <span style={{ color: COLORS.textTertiary }}>/</span>
          <span className="truncate" style={{ color: COLORS.textPrimary, fontWeight: 500 }}>{study.name}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={14} color="#3A4A55" />
          <span style={{ fontFamily: fontUI, fontSize: 12.5, color: "#3A4A55", fontWeight: 500 }}>Completed</span>
        </div>
        <button
          style={{ fontFamily: fontUI, fontSize: 12.5, color: COLORS.textSecondary }}
          className="hover:underline"
        >
          Back to setup
        </button>
      </div>
    </header>
  );
}

/* =========================================================================
   ROOT APP
   ========================================================================= */

export default function App() {
  const data = STUDY_DATA;
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(null);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [visibleZones, setVisibleZones] = useState({ lfl: true, half_lfl: true, quarter_lfl: true });

  const zonesById = useMemo(() => Object.fromEntries(data.hazardZones.map((z) => [z.id, z])), [data]);

  const toggleZone = useCallback((styleKey) => {
    setVisibleZones((v) => ({ ...v, [styleKey]: v[styleKey] === false ? true : false }));
  }, []);

  const handleSelectEquipment = useCallback((id) => {
    setSelectedEquipmentId(id);
  }, []);

  const handleSelectZone = useCallback((id) => {
    setSelectedZoneId(id);
  }, []);

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden" style={{ background: COLORS.appBg }}>
      <style>{`@import url('${FONT_IMPORT_HREF}');`}</style>
      <Header study={data.study} />

      <div className="flex-1 flex min-h-0">
        {/* 3D viewport — hero element */}
        <div className="flex-1 relative min-w-0">
          <FacilityScene
            data={data}
            selectedEquipmentId={selectedEquipmentId}
            selectedZoneId={selectedZoneId}
            visibleZones={visibleZones}
            onSelectEquipment={handleSelectEquipment}
            onSelectZone={handleSelectZone}
          />
          <ZoneLegend zones={data.hazardZones} visibleZones={visibleZones} onToggle={toggleZone} />
          <CompassBadge windSpeedMS={data.environment.windSpeedMS} windDirectionDeg={data.environment.windDirectionDeg} />
          <MockBadge />
        </div>

        {/* Results rail */}
        <div
          className="flex-shrink-0 flex flex-col overflow-y-auto"
          style={{ width: 360, background: COLORS.surface, borderLeft: `1px solid ${COLORS.border}` }}
        >
          <HazardZoneList zones={data.hazardZones} selectedZoneId={selectedZoneId} onSelectZone={handleSelectZone} />
          <div className="border-t" style={{ borderColor: COLORS.border }} />
          <ReceptorList
            receptors={data.affectedReceptors}
            zonesById={zonesById}
            selectedEquipmentId={selectedEquipmentId}
            onSelectEquipment={handleSelectEquipment}
          />
          <div className="border-t" style={{ borderColor: COLORS.border }} />
          <EnvironmentStrip scenario={data.scenario} environment={data.environment} />
          <div className="flex-1" />
          <EvidencePanel evidence={data.evidence} analysis={data.analysis} />
        </div>
      </div>
    </div>
  );
}
