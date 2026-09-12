import { COLORS, fontUI } from "../../styles/tokens";

/* =========================================================================
   DEFINE RELEASE HEADER — deliberately separate from components/Header.jsx
   (which belongs to the Results screen) so nothing about Results is
   touched by this feature. Same visual language, no completion status —
   this study isn't finished yet.
   ========================================================================= */

export default function DefineReleaseHeader({ studyName }) {
  return (
    <header
      className="flex items-center justify-between px-5 flex-shrink-0"
      style={{ height: 56, background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}` }}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-6 h-6 rounded-sm flex items-center justify-center" style={{ background: COLORS.brand }}>
            <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: fontUI }}>AK</span>
          </div>
          <span style={{ fontFamily: fontUI, fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>AgniKawach</span>
        </div>
        <div className="w-px h-4" style={{ background: COLORS.border }} />
        <div className="flex items-center gap-1.5 min-w-0" style={{ fontFamily: fontUI, fontSize: 13 }}>
          <span style={{ color: COLORS.textTertiary }}>Studies</span>
          <span style={{ color: COLORS.textTertiary }}>/</span>
          <span className="truncate" style={{ color: COLORS.textTertiary }}>{studyName}</span>
          <span style={{ color: COLORS.textTertiary }}>/</span>
          <span className="truncate" style={{ color: COLORS.textPrimary, fontWeight: 500 }}>Define Release</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: COLORS.textTertiary }} />
        <span style={{ fontFamily: fontUI, fontSize: 12.5, color: COLORS.textSecondary }}>Draft — not yet analyzed</span>
      </div>
    </header>
  );
}
