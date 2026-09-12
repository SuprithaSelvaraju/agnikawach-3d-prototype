import { useState } from "react";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { COLORS, fontUI, fontMono } from "../../styles/tokens";

export default function EvidencePanel({ evidence, analysis }) {
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
