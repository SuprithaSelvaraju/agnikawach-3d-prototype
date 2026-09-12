export const RELEASABLE_TYPES = new Set([
  "storage_tank",
  "vessel",
  "pipe_run",
  "pump",
]);

export const MATERIAL_OPTIONS = [
  "Propane",
  "Natural gas",
  "LPG",
  "Hydrogen",
  "Ammonia",
  "Chlorine",
];

export const STABILITY_OPTIONS = [
  { value: "B", label: "Sunny", sublabel: "Unstable" },
  { value: "D", label: "Overcast", sublabel: "Neutral" },
  { value: "F", label: "Clear night", sublabel: "Stable" },
];

export const RELEASE_TYPE_OPTIONS = [
  "continuous_gas_release",
  "instantaneous_release",
];

export const RELEASE_TYPE_LABEL = {
  continuous_gas_release: "Continuous",
  instantaneous_release: "Instantaneous",
};