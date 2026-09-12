/* =========================================================================
   DATA  —  data/mockStudy.js
   The locked v0.1 study contract. Single source of truth for both the
   3D scene and the Results UI. Nothing here is derived or recalculated —
   values are exactly as agreed in the data-contract review.

   Do not modify without a corresponding data-contract review.
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

export default STUDY_DATA;
