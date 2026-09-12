/* =========================================================================
   SCENARIO DRAFT
   The user's current, editable scenario selections. Seeded once from the
   locked mockStudy contract, then owned by App state and edited by
   Define Release. Review reads it read-only. Run Analysis passes it to
   runAnalysis(scenarioDraft) — nothing downstream reads mockStudy's
   scenario/environment values directly once a draft exists.

   Flow: mockStudy -> scenarioDraft -> Review -> Run Analysis ->
         analysisResult -> Results
   ========================================================================= */

export function createInitialScenarioDraft(study) {
  const { scenario, environment } = study;
  return {
    material: scenario.material.name,
    releaseEquipmentId: scenario.releaseEquipmentId,
    holeSizeMm: scenario.holeSizeMm,
    vesselPressureBarA: scenario.vesselPressureBarA,
    processTemperatureC: scenario.processTemperatureC,
    releaseType: scenario.releaseType,
    windSpeedMS: environment.windSpeedMS,
    windDirectionDeg: environment.windDirectionDeg,
    stabilityClass: environment.weatherStabilityClass,
  };
}
