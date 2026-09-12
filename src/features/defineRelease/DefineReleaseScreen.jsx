import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import STUDY_DATA from "../../data/mockStudy";
import { COLORS, fontUI, fontMono } from "../../styles/tokens";
import { compassLabel } from "../../utils/geo";
import DefineReleaseHeader from "./DefineReleaseHeader";
import {
  RELEASABLE_TYPES,
  MATERIAL_OPTIONS,
  STABILITY_OPTIONS,
  RELEASE_TYPE_OPTIONS,
  RELEASE_TYPE_LABEL,
} from "./defineReleaseOptions";
/* =========================================================================
   DEFINE RELEASE — essential setup fields, collapsed advanced fields, and
   the two existing read-only derived values. No hazard results here.

   Visual refinement pass only: same fields, same state, same data source
   (STUDY_DATA). Composition changed from stacked white cards to a
   two-column engineering-sheet layout — continuous field groups on the
   left, a facility mini-map + computed-values rail on the right, tying
   the form back to the plant it describes without touching the 3D scene.
   ========================================================================= */

/* ---- shared control styling (unchanged values, refined chrome) ---- */

const controlBase = {
  fontFamily: fontUI,
  fontSize: 13.5,
  color: COLORS.textPrimary,
  background: COLORS.surface,
  border: `1px solid ${COLORS.borderStrong}`,
  borderRadius: 2,
  padding: "7px 10px",
  width: "100%",
};

const numberInputStyle = { ...controlBase, fontFamily: fontMono, width: 104, textAlign: "right" };

/* ---- local field primitives ---- */

function FieldRow({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label style={{ fontFamily: fontUI, fontSize: 12, color: COLORS.textSecondary, fontWeight: 500 }}>{label}</label>
        {hint && <span style={{ fontFamily: fontUI, fontSize: 10.5, color: COLORS.textTertiary }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function SliderField({ value, min, max, step, unit, onChange }) {
  return (
    <div className="flex items-center gap-2.5">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1"
        style={{ accentColor: COLORS.brand }}
      />
      <div className="flex items-center gap-1 flex-shrink-0" style={{ width: 104 }}>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={numberInputStyle}
        />
        <span style={{ fontFamily: fontUI, fontSize: 11.5, color: COLORS.textTertiary }}>{unit}</span>
      </div>
    </div>
  );
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="flex-1 text-left"
            style={{
              borderRadius: 2,
              padding: "7px 10px",
              border: `1px solid ${selected ? COLORS.brand : COLORS.borderStrong}`,
              background: selected ? "#FBF0EA" : COLORS.surface,
            }}
          >
            <div style={{ fontFamily: fontUI, fontSize: 12, color: COLORS.textPrimary, fontWeight: 500 }}>{opt.label}</div>
            <div style={{ fontFamily: fontMono, fontSize: 10.5, color: COLORS.textTertiary }}>
              {opt.sublabel} · {opt.value}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// A field cell whose value is computed, not typed — visually distinct from
// every editable control on the page: muted panel, monospace, no border.
export function ComputedField({ label, value }) {
  return (
    <div className="rounded-sm px-3 py-2" style={{ background: "#EEF0F1" }}>
      <div style={{ fontFamily: fontUI, fontSize: 10.5, color: COLORS.textTertiary, marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: fontMono, fontSize: 13, color: COLORS.textPrimary }}>{value}</div>
    </div>
  );
}

export function GroupHeading({ index, title }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span style={{ width: 3, height: 15, background: COLORS.brandSecondary, display: "inline-block" }} />
      <span style={{ fontFamily: fontMono, fontSize: 11, color: COLORS.textTertiary }}>{index}</span>
      <span style={{ fontFamily: fontUI, fontSize: 13.5, fontWeight: 600, color: COLORS.textPrimary }}>{title}</span>
    </div>
  );
}

export function Divider() {
  return <div style={{ height: 1, background: COLORS.border, margin: "26px 0" }} />;
}

// Flat top-down schematic — deliberately restrained (no 3D, no interaction)
// so the release definition stays visually tied to the plant it describes.
export function FacilityMiniMap({ equipment, boundary, selectedId, windDirectionDeg }) {
  const hw = boundary.widthX / 2;
  const hd = boundary.depthZ / 2;
  const { originOffset } = boundary;
  const minX = originOffset.x - hw;
  const maxZ = originOffset.z + hd;
  const toSvg = (x, z) => ({ x: x - minX, y: maxZ - z });

  const blowsToward = ((windDirectionDeg + 180) % 360) * (Math.PI / 180);
  const dx = Math.sin(blowsToward);
  const dy = -Math.cos(blowsToward);
  const center = toSvg(0, 0);
  const arrowLen = 26;

  return (
    <svg viewBox={`0 0 ${boundary.widthX} ${boundary.depthZ}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x={0} y={0} width={boundary.widthX} height={boundary.depthZ} fill="#F4F5F6" />
      <rect x={1} y={1} width={boundary.widthX - 2} height={boundary.depthZ - 2} fill="none" stroke={COLORS.border} strokeWidth={1} />

      {equipment.map((eq) => {
        const p = toSvg(eq.position.x, eq.position.z);
        const selected = eq.id === selectedId;
        const r = eq.type === "building" ? 6 : selected ? 6 : 4.5;
        return (
          <g key={eq.id}>
            <circle
              cx={p.x}
              cy={p.y}
              r={r}
              fill={selected ? COLORS.brand : COLORS.brandSecondary}
              opacity={selected ? 1 : 0.55}
            />
            {selected && <circle cx={p.x} cy={p.y} r={r + 4} fill="none" stroke={COLORS.brand} strokeWidth={1.2} />}
          </g>
        );
      })}

      <line
        x1={center.x - dx * arrowLen * 0.4}
        y1={center.y - dy * arrowLen * 0.4}
        x2={center.x + dx * arrowLen}
        y2={center.y + dy * arrowLen}
        stroke={COLORS.textTertiary}
        strokeWidth={1.4}
      />
      <circle cx={center.x + dx * arrowLen} cy={center.y + dy * arrowLen} r={2} fill={COLORS.textTertiary} />

      <text x={hw} y={11} textAnchor="middle" style={{ fontFamily: fontMono, fontSize: 9, fill: COLORS.textTertiary }}>
        N
      </text>
    </svg>
  );
}

export default function DefineReleaseScreen({ draft, onChange, onContinue }) {
  const { facility } = STUDY_DATA;

  // Advanced-section disclosure is local UI state, not scenario data.
  const [advancedOpen, setAdvancedOpen] = useState(false);

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

  const releasableEquipment = facility.equipment.filter((eq) => RELEASABLE_TYPES.has(eq.type));
  const selectedEquipment = facility.equipment.find((eq) => eq.id === releaseEquipmentId);

  // Read-only, system-derived — never user input, unchanged from the contract.
  // (Only Propane is modeled, so this stays a fixed lookup rather than a
  // real per-material calculation.)
  const estimatedReleaseRateKgS = STUDY_DATA.scenario.estimatedReleaseRateKgS;
  const hazardType = STUDY_DATA.scenario.material.hazardType;
  const hazardTypeLabel = hazardType.charAt(0).toUpperCase() + hazardType.slice(1);

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden" style={{ background: COLORS.appBg }}>
      <DefineReleaseHeader studyName={STUDY_DATA.study.name} />

      {/* Live release summary — single line, always current, no separate copy of state */}
      <div
        className="flex-shrink-0 px-6 py-2 flex items-center gap-x-5 gap-y-1 flex-wrap"
        style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}` }}
      >
        {[
          ["Material", material],
          ["equipment", selectedEquipment ? selectedEquipment.name.split(" ")[0] : "—"],
          ["Inlet", `${holeSizeMm} mm · ${RELEASE_TYPE_LABEL[releaseType]}`],
          ["Conditions", `${windSpeedMS.toFixed(1)} m/s from ${compassLabel(windDirectionDeg)} · Class ${stabilityClass}`],
        ].map(([label, value]) => (
          <span key={label} style={{ fontFamily: fontUI, fontSize: 12 }}>
            <span style={{ color: COLORS.textTertiary }}>{label} </span>
            <span style={{ color: COLORS.textPrimary, fontWeight: 500 }}>{value}</span>
          </span>
        ))}
      </div>

      <div className="flex-1 flex min-h-0">
        {/* LEFT — continuous field groups, no repeated card chrome */}
        <div className="flex-1 overflow-y-auto" style={{ borderRight: `1px solid ${COLORS.border}` }}>
          <div className="mx-auto" style={{ maxWidth: 640, padding: "28px 32px 40px" }}>
            <GroupHeading index="01" title="Material Properties" />
            <div className="grid grid-cols-2 gap-5">
              <FieldRow label="Material" hint="Propane only in this prototype">
                <select value={material} onChange={(e) => onChange("material", e.target.value)} style={controlBase}>
                  {MATERIAL_OPTIONS.map((m) => (
                    <option key={m} value={m} disabled={m !== "Propane"}>
                      {m}
                    </option>
                  ))}
                </select>
              </FieldRow>
              <FieldRow label="Release equipment">
                <select value={releaseEquipmentId} onChange={(e) => onChange("releaseEquipmentId", e.target.value)} style={controlBase}>
                  {releasableEquipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name}
                    </option>
                  ))}
                </select>
              </FieldRow>
            </div>

            <Divider />

            <GroupHeading index="02" title="Inlet Boundary Conditions" />
            <FieldRow label="Hole size" hint="Equivalent opening diameter">
              <SliderField value={holeSizeMm} min={1} max={50} step={1} unit="mm" onChange={(v) => onChange("holeSizeMm", v)} />
            </FieldRow>

            <button
              onClick={() => setAdvancedOpen((v) => !v)}
              className="w-full flex items-center justify-between mt-5 pt-3"
              style={{ borderTop: `1px solid ${COLORS.border}` }}
            >
              <span style={{ fontFamily: fontUI, fontSize: 12, fontWeight: 500, color: COLORS.textSecondary }}>
                Advanced
              </span>
              {advancedOpen ? (
                <ChevronDown size={14} color={COLORS.textSecondary} />
              ) : (
                <ChevronRight size={14} color={COLORS.textSecondary} />
              )}
            </button>

            {advancedOpen && (
              <div className="grid grid-cols-2 gap-5 mt-4">
                <FieldRow label="Vessel pressure" hint="bar (a)">
                  <input
                    type="number"
                    value={vesselPressureBarA}
                    onChange={(e) => onChange("vesselPressureBarA", parseFloat(e.target.value))}
                    style={{ ...controlBase, fontFamily: fontMono }}
                  />
                </FieldRow>
                <FieldRow label="Process temperature" hint="°C">
                  <input
                    type="number"
                    value={processTemperatureC}
                    onChange={(e) => onChange("processTemperatureC", parseFloat(e.target.value))}
                    style={{ ...controlBase, fontFamily: fontMono }}
                  />
                </FieldRow>
                <FieldRow label="Release type">
                  <select value={releaseType} onChange={(e) => onChange("releaseType", e.target.value)} style={controlBase}>
                    {RELEASE_TYPE_OPTIONS.map((rt) => (
                      <option key={rt} value={rt}>
                        {RELEASE_TYPE_LABEL[rt]}
                      </option>
                    ))}
                  </select>
                </FieldRow>
                <ComputedField label="Source model" value="Choked-orifice discharge" />
              </div>
            )}

            <Divider />

            <GroupHeading index="03" title="Atmospheric Boundary Conditions" />
            <div className="grid grid-cols-2 gap-5">
              <FieldRow label="Wind speed">
                <SliderField value={windSpeedMS} min={0} max={20} step={0.1} unit="m/s" onChange={(v) => onChange("windSpeedMS", v)} />
              </FieldRow>
              <FieldRow label="Wind direction" hint={`from ${compassLabel(windDirectionDeg)}`}>
                <SliderField value={windDirectionDeg} min={0} max={359} step={1} unit="°" onChange={(v) => onChange("windDirectionDeg", v)} />
              </FieldRow>
            </div>
            <div className="mt-5">
              <FieldRow label="Atmospheric stability">
                <SegmentedControl options={STABILITY_OPTIONS} value={stabilityClass} onChange={(v) => onChange("stabilityClass", v)} />
              </FieldRow>
            </div>
          </div>
        </div>

        {/* RIGHT — facility context + computed values, not another form column */}
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

            <Divider />

            <div style={{ fontFamily: fontUI, fontSize: 11, color: COLORS.textTertiary, marginBottom: 10 }}>
              Derived — not editable
            </div>
            <div className="flex flex-col gap-2.5">
              <ComputedField label="Hazard type" value={hazardTypeLabel} />
              <ComputedField label="Estimated release rate" value={`${estimatedReleaseRateKgS.toFixed(1)} kg/s`} />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky action footer */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-6 py-3.5"
        style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.border}` }}
      >
        <span style={{ fontFamily: fontUI, fontSize: 11.5, color: COLORS.textTertiary }}>
          Hazard results are calculated on the next steps.
        </span>
        <button
          onClick={onContinue}
          className="rounded-sm px-5 py-2.5"
          style={{ background: COLORS.brand, color: "#fff", fontFamily: fontUI, fontSize: 13.5, fontWeight: 600 }}
        >
          Continue to review
        </button>
      </div>
    </div>
  );
}
