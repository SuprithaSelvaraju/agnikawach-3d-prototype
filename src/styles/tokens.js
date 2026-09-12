/* =========================================================================
   DESIGN TOKENS
   Light, neutral, high-contrast app chrome. Orange reserved for brand /
   action. Hazard colors reserved exclusively for hazard zones + receptor
   status. The 3D viewport itself is a dark, instrument-panel surface —
   a deliberate, common CAD/engineering-tool convention that makes the
   translucent hazard geometry legible, distinct from the light app chrome.
   ========================================================================= */

export const COLORS = {
  appBg: "#EEF0F1",
  surface: "#FFFFFF",
  border: "#DEE1E4",
  borderStrong: "#C6CACF",
  textPrimary: "#14171A",
  textSecondary: "#5B6169",
  textTertiary: "#8B9198",

  brand: "#C24A1D",
  brandHover: "#A23C15",

  viewportBg: "#E8EFF5",
  viewportGrid: "#C7D3DE",

  hazard: {
    lfl: "#C0392B",
    half_lfl: "#C77C1F",
    quarter_lfl: "#3F8556",
  },

  status: {
    at_risk: "#B23A2E",
    caution: "#B9791E",
    clear: "#6B7A70",
  },
};

export const ZONE_META = {
  lfl: { swatch: COLORS.hazard.lfl, threeColor: 0xc0392b, baseOpacity: 0.55 },
  half_lfl: { swatch: COLORS.hazard.half_lfl, threeColor: 0xc77c1f, baseOpacity: 0.4 },
  quarter_lfl: { swatch: COLORS.hazard.quarter_lfl, threeColor: 0x3f8556, baseOpacity: 0.26 },
};

export const STATUS_LABEL = { at_risk: "At risk", caution: "Caution", clear: "Clear" };

export const FONT_IMPORT_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap";

export const fontUI = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
export const fontMono = "'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace";
