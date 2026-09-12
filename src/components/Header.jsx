import { CheckCircle2 } from "lucide-react";
import { COLORS, fontUI } from "../styles/tokens";

/* =========================================================================
   HEADER — no workflow stepper. Breadcrumb + status only.
   Moved as-is from the original single-file implementation.
   ========================================================================= */

export default function Header({ study }) {
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
