import { COLORS, fontUI } from "../../styles/tokens";
import BrandMark from "../../components/BrandMark";

/* =========================================================================
   DEFINE RELEASE HEADER — deliberately separate from components/Header.jsx
   (which belongs to the Results screen) so nothing about Results is
   touched by this feature. Same visual language, no completion status —
   this study isn't finished yet.
   ========================================================================= */

export default function DefineReleaseHeader({ studyName }) {
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
          <span className="truncate" style={{ color: COLORS.textPrimary, fontWeight: 500 }}>Define Release</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: COLORS.textTertiary }} />
        <span className="header-status-label" style={{ fontFamily: fontUI, fontSize: 12.5, color: COLORS.textSecondary }}>Draft — not yet analyzed</span>
      </div>
    </header>
  );
}
