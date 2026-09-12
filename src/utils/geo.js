import * as THREE from "three";

/* =========================================================================
   MATH / FORMATTING HELPERS
   Shared by the 3D scene builders and the Results UI (e.g. compassLabel is
   used both on the compass badge and the Environment strip).
   ========================================================================= */

export const degToRad = (d) => (d * Math.PI) / 180;

// Compass bearing (0 = North = +Z, clockwise, East = +X) -> unit vector in XZ plane.
export function bearingToVector(bearingDeg) {
  const r = degToRad(bearingDeg);
  return new THREE.Vector3(Math.sin(r), 0, Math.cos(r));
}

export function compassLabel(deg) {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}
