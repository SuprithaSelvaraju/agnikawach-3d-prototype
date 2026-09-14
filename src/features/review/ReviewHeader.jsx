import { COLORS, fontUI } from "../../styles/tokens";
import BrandMark from "../../components/BrandMark";

/* =========================================================================
   REVIEW HEADER — same pattern as features/defineRelease/DefineReleaseHeader,
   kept as its own small component so neither Results' Header nor Define
   Release's header need to change.
   ========================================================================= */

export default function ReviewHeader({ studyName }) {
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
          <span className="truncate" style={{ color: COLORS.textTertiary }}>{studyName}</span>
          <span style={{ color: COLORS.textTertiary }}>/</span>
          <span className="truncate" style={{ color: COLORS.textPrimary, fontWeight: 500 }}>Review</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: COLORS.textTertiary }} />
        <span className="header-status-label" style={{ fontFamily: fontUI, fontSize: 12.5, color: COLORS.textSecondary }}>Draft — ready to run</span>
      </div>
    </header>
  );
}
