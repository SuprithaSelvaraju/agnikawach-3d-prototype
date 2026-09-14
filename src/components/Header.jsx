import { CheckCircle2 } from "lucide-react";
import { COLORS, fontUI } from "../styles/tokens";
import BrandMark from "./BrandMark";

/* =========================================================================
   HEADER — no workflow stepper. Breadcrumb + status only.
   Moved as-is from the original single-file implementation.
   ========================================================================= */

export default function Header({ study, onBackToSetup }) {
  return (
    <header
      className="flex items-center justify-between px-5 flex-shrink-0 app-header"
      style={{ height: 56, background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}` }}
    >
      <div className="flex items-center gap-4 min-w-0">
        <BrandMark />
        <div className="w-px h-4 header-divider" style={{ background: COLORS.border }} />
        <div className="flex items-center gap-1.5 min-w-0 header-breadcrumb" style={{ fontFamily: fontUI, fontSize: 13 }}>
          <span style={{ color: COLORS.textTertiary }}>Studies</span>
          <span style={{ color: COLORS.textTertiary }}>/</span>
          <span className="truncate" style={{ color: COLORS.textPrimary, fontWeight: 500 }}>{study.name}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={14} color="#3A4A55" />
          <span className="header-status-label" style={{ fontFamily: fontUI, fontSize: 12.5, color: "#3A4A55", fontWeight: 500 }}>Completed</span>
        </div>
        <button
          onClick={onBackToSetup}
          style={{ fontFamily: fontUI, fontSize: 12.5, color: COLORS.textSecondary }}
          className="hover:underline focus-ring rounded-sm"
        >
          Back to setup
        </button>
      </div>
    </header>
  );
}
