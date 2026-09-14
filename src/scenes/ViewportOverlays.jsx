import { Wind, Info, Eye, EyeOff } from "lucide-react";
import { COLORS, ZONE_META, fontUI, fontMono } from "../styles/tokens";
import { compassLabel } from "../utils/geo";

/* =========================================================================
   OVERLAYS — zone legend & compass, positioned on top of the 3D canvas.
   Moved as-is from the original single-file implementation.
   ========================================================================= */

export function ZoneLegend({ zones, visibleZones, onToggle }) {
  return (
    <div
      className="absolute top-4 left-4 rounded-sm px-3 py-2.5"
      style={{ background: "rgba(20,23,27,0.82)", border: `1px solid ${COLORS.viewportGrid}`, backdropFilter: "blur(2px)" }}
    >
      <div className="text-[11px] mb-2" style={{ color: "#9BA3AB", fontFamily: fontUI }}>
        Hazard zones
      </div>
      <div className="flex flex-col gap-1.5">
        {zones.map((z) => {
          const on = visibleZones[z.styleKey] !== false;
          return (
            <button
              key={z.id}
              onClick={() => onToggle(z.styleKey)}
              className="flex items-center gap-2 text-left focus-ring"
              style={{ opacity: on ? 1 : 0.45 }}
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: ZONE_META[z.styleKey].swatch }}
              />
              <span style={{ color: "#E7E9EB", fontFamily: fontUI, fontSize: 12.5 }}>{z.label}</span>
              {on ? <Eye size={13} color="#9BA3AB" /> : <EyeOff size={13} color="#9BA3AB" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CompassBadge({ windSpeedMS, windDirectionDeg }) {
  const blowsToward = (windDirectionDeg + 180) % 360;
  return (
    <div
      className="absolute top-4 right-4 rounded-sm px-3 py-2.5 flex items-center gap-3"
      style={{ background: "rgba(20,23,27,0.82)", border: `1px solid ${COLORS.viewportGrid}` }}
    >
      <div className="relative w-9 h-9 flex-shrink-0">
        <div className="absolute inset-0 rounded-full" style={{ border: "1px solid #444B52" }} />
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `rotate(${blowsToward}deg)` }}
        >
          <Wind size={16} color="#E6672F" strokeWidth={2.4} />
        </div>
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px]" style={{ color: "#8B9198", fontFamily: fontUI }}>N</span>
      </div>
      <div style={{ fontFamily: fontUI }}>
        <div style={{ color: "#E7E9EB", fontSize: 12.5, fontFamily: fontMono }}>{windSpeedMS.toFixed(1)} m/s</div>
        <div style={{ color: "#9BA3AB", fontSize: 11 }}>
          from {windDirectionDeg}° ({compassLabel(windDirectionDeg)})
        </div>
      </div>
    </div>
  );
}

export function MockBadge() {
  return (
    <div
      className="absolute bottom-4 left-4 rounded-sm px-2.5 py-1.5 flex items-center gap-1.5"
      style={{ background: "rgba(20,23,27,0.82)", border: `1px solid ${COLORS.viewportGrid}` }}
    >
      <Info size={12} color="#C77C1F" />
      <span style={{ color: "#C7CBCF", fontSize: 11, fontFamily: fontUI }}>
        Illustrative mock data — no simulation was run
      </span>
    </div>
  );
}
