import STUDY_DATA from "../../data/mockStudy";
import { COLORS, fontUI } from "../../styles/tokens";
import { compassLabel } from "../../utils/geo";
import ReviewHeader from "./ReviewHeader";
import {
  ComputedField,
  GroupHeading,
  Divider,
  FacilityMiniMap,
} from "../defineRelease/DefineReleaseScreen";

import {
  STABILITY_OPTIONS,
  RELEASE_TYPE_LABEL,
} from "../defineRelease/defineReleaseOptions";

/* =========================================================================
   REVIEW — a read-only confirmation of the current scenarioDraft.
   No inputs, no new fields, no hazard results. Every value shown here
   comes from the draft prop (or a fixed contract lookup for the two
   derived values) — nothing is hardcoded or duplicated.

   "Run Analysis" hands scenarioDraft to runAnalysis(); today that
   returns the same illustrative mock result regardless of the values
   below, and the caption next to the button says so explicitly.
   ========================================================================= */

function stabilityLabel(stabilityClass) {
  const opt = STABILITY_OPTIONS.find((o) => o.value === stabilityClass);
  return opt ? `${opt.label} (${opt.sublabel})` : stabilityClass;
}

export default function ReviewScreen({ draft, onEdit, onRunAnalysis }) {
  const { facility } = STUDY_DATA;
  const {
    material,
    releaseEquipmentId,
    holeSizeMm,
    windSpeedMS,
    windDirectionDeg,
    stabilityClass,
    vesselPressureBarA,
    processTemperatureC,
    releaseType,
  } = draft;

  const selectedEquipment = facility.equipment.find((eq) => eq.id === releaseEquipmentId);

  // Read-only, system-derived — fixed contract lookups, not recalculated
  // from the draft (only Propane is modeled in this prototype).
  const estimatedReleaseRateKgS = STUDY_DATA.scenario.estimatedReleaseRateKgS;
  const hazardType = STUDY_DATA.scenario.material.hazardType;
  const hazardTypeLabel = hazardType.charAt(0).toUpperCase() + hazardType.slice(1);

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden" style={{ background: COLORS.appBg }}>
      <ReviewHeader studyName={STUDY_DATA.study.name} />

      <div className="flex-1 flex min-h-0">
        {/* LEFT — read-only summary, same grouping as Define Release, no inputs */}
        <div className="flex-1 overflow-y-auto" style={{ borderRight: `1px solid ${COLORS.border}` }}>
          <div className="mx-auto" style={{ maxWidth: 640, padding: "28px 32px 40px" }}>
            <div style={{ fontFamily: fontUI, fontSize: 12.5, color: COLORS.textSecondary, marginBottom: 20, lineHeight: 1.5 }}>
              Confirm the release definition below before running the analysis. Use Edit to change any value.
            </div>

            <GroupHeading index="01" title="Material Properties" />
            <div className="grid grid-cols-2 gap-3">
              <ComputedField label="Material" value={material} />
              <ComputedField label="Hazard type" value={hazardTypeLabel} />
            </div>
            <div className="mt-3">
              <ComputedField label="Release equipment" value={selectedEquipment ? selectedEquipment.name : "—"} />
            </div>

            <Divider />

            <GroupHeading index="02" title="Inlet Boundary Conditions" />
            <div className="grid grid-cols-2 gap-3">
              <ComputedField label="Hole size" value={`${holeSizeMm} mm`} />
              <ComputedField label="Estimated release rate" value={`${estimatedReleaseRateKgS.toFixed(1)} kg/s`} />
              <ComputedField label="Vessel pressure" value={`${vesselPressureBarA} bar (a)`} />
              <ComputedField label="Process temperature" value={`${processTemperatureC} °C`} />
              <ComputedField label="Release type" value={RELEASE_TYPE_LABEL[releaseType]} />
              <ComputedField label="Source model" value="Choked-orifice discharge" />
            </div>

            <Divider />

            <GroupHeading index="03" title="Atmospheric Boundary Conditions" />
            <div className="grid grid-cols-2 gap-3">
              <ComputedField label="Wind speed" value={`${windSpeedMS.toFixed(1)} m/s`} />
              <ComputedField
                label="Wind direction"
                value={`${windDirectionDeg}° (from ${compassLabel(windDirectionDeg)})`}
              />
            </div>
            <div className="mt-3">
              <ComputedField label="Atmospheric stability" value={`Class ${stabilityClass} · ${stabilityLabel(stabilityClass)}`} />
            </div>
          </div>
        </div>

        {/* RIGHT — same facility context panel as Define Release */}
        <div className="flex-shrink-0 overflow-y-auto" style={{ width: 300, background: COLORS.surface }}>
          <div style={{ padding: "24px 22px" }}>
            <div style={{ fontFamily: fontUI, fontSize: 11, color: COLORS.textTertiary, marginBottom: 10 }}>
              Release point in facility
            </div>
            <FacilityMiniMap
              equipment={facility.equipment}
              boundary={facility.boundary}
              selectedId={releaseEquipmentId}
              windDirectionDeg={windDirectionDeg}
            />
            <div style={{ fontFamily: fontUI, fontSize: 11.5, color: COLORS.textSecondary, marginTop: 10 }}>
              {selectedEquipment ? selectedEquipment.name : "No equipment selected"}
            </div>
          </div>
        </div>
      </div>

      {/* Action footer */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-6 py-3.5"
        style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.border}` }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onEdit}
            className="rounded-sm px-4 py-2.5"
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.borderStrong}`,
              color: COLORS.textPrimary,
              fontFamily: fontUI,
              fontSize: 13.5,
              fontWeight: 500,
            }}
          >
            Edit
          </button>
          <span style={{ fontFamily: fontUI, fontSize: 11.5, color: COLORS.textTertiary, maxWidth: 360 }}>
            This prototype's analysis step returns the existing illustrative example result — inputs above
            are not yet connected to a solver.
          </span>
        </div>
        <button
          onClick={onRunAnalysis}
          className="rounded-sm px-5 py-2.5"
          style={{ background: COLORS.brand, color: "#fff", fontFamily: fontUI, fontSize: 13.5, fontWeight: 600 }}
        >
          Run analysis
        </button>
      </div>
    </div>
  );
}
