import { COLORS, ZONE_META, fontUI, fontMono } from "../../styles/tokens";
import SectionHeading from "../../components/SectionHeading";

export default function HazardZoneList({ zones, selectedZoneId, onSelectZone }) {
  return (
    <div>
      <SectionHeading>Hazard zones</SectionHeading>
      <div className="px-2 pb-2">
        {zones.map((z) => {
          const selected = z.id === selectedZoneId;
          return (
            <button
              key={z.id}
              onClick={() => onSelectZone(selected ? null : z.id)}
              className="w-full text-left rounded-sm px-2.5 py-2 mb-1 flex items-center gap-2.5"
              style={{
                background: selected ? "#F5EDE8" : "transparent",
                border: `1px solid ${selected ? COLORS.brand : "transparent"}`,
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ZONE_META[z.styleKey].swatch }} />
              <div className="flex-1 min-w-0">
                <div style={{ fontFamily: fontUI, fontSize: 13, color: COLORS.textPrimary, fontWeight: 500 }}>{z.label}</div>
                <div style={{ fontFamily: fontUI, fontSize: 11.5, color: COLORS.textSecondary }}>{z.thresholdType}</div>
              </div>
              <div className="text-right" style={{ fontFamily: fontMono }}>
                <div style={{ fontSize: 12.5, color: COLORS.textPrimary }}>{z.distanceDownwindM.toFixed(1)} m</div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{z.areaM2.toLocaleString()} m²</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
