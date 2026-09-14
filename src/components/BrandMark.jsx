import { COLORS, fontUI } from "../styles/tokens";

/* =========================================================================
   BRAND MARK — the single AgniKawach logo treatment used by every header
   in the app (Setup, Define Release, Review, Results). Previously Setup
   used a hexagon mark while the other three headers used an unrelated
   orange-square "AK" badge; this consolidates on one mark, reused, not
   redesigned.
   ========================================================================= */

export function HexLogo({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" style={{ flexShrink: 0 }}>
      <polygon
        points="17,2 29.5,9.5 29.5,24.5 17,32 4.5,24.5 4.5,9.5"
        fill="none"
        stroke={COLORS.brandSecondary}
        strokeWidth="1.6"
      />
      <text
        x="17"
        y="20.5"
        textAnchor="middle"
        style={{ fontFamily: fontUI, fontWeight: 700, fontSize: 10.5, fill: COLORS.brandSecondary }}
      >
        AK
      </text>
    </svg>
  );
}

export default function BrandMark({ logoSize = 26, wordmarkSize = 15 }) {
  return (
    <div className="flex items-center gap-2.5 brand-mark" style={{ minWidth: 0 }}>
      <HexLogo size={logoSize} />
      <span
        className="brand-wordmark"
        style={{
          fontFamily: fontUI,
          fontWeight: 700,
          fontSize: wordmarkSize,
          color: COLORS.brandSecondary,
          letterSpacing: "0.01em",
          whiteSpace: "nowrap",
        }}
      >
        AgniKawach<sup style={{ fontSize: wordmarkSize * 0.55 }}>™</sup>
      </span>
    </div>
  );
}
