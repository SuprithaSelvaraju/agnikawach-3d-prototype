import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { COLORS, STATUS_LABEL, fontUI, fontMono } from "../../styles/tokens";
import SectionHeading from "../../components/SectionHeading";

export default function ReceptorList({ receptors, zonesById, selectedEquipmentId, onSelectEquipment }) {
  return (
    <div>
      <SectionHeading>Affected receptors</SectionHeading>
      <div className="px-2 pb-2">
        {receptors.map((r) => {
          const selected = r.facilityEquipmentId === selectedEquipmentId;
          const zone = r.zoneId ? zonesById[r.zoneId] : null;
          return (
            <button
              key={r.id}
              onClick={() => onSelectEquipment(selected ? null : r.facilityEquipmentId)}
              className="w-full text-left rounded-sm px-2.5 py-2 mb-1 flex items-center gap-2.5"
              style={{
                background: selected ? "#F5EDE8" : "transparent",
                border: `1px solid ${selected ? COLORS.brand : "transparent"}`,
              }}
            >
              {r.status === "clear" ? (
                <CheckCircle2 size={14} color={COLORS.status.clear} className="flex-shrink-0" />
              ) : (
                <AlertTriangle size={14} color={COLORS.status[r.status]} className="flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div style={{ fontFamily: fontUI, fontSize: 13, color: COLORS.textPrimary, fontWeight: 500 }}>{r.name}</div>
                <div style={{ fontFamily: fontUI, fontSize: 11.5, color: COLORS.textSecondary }}>
                  {zone ? zone.label : "Outside modelled zones"}
                </div>
              </div>
              <div className="text-right">
                <div style={{ fontFamily: fontMono, fontSize: 12.5, color: COLORS.textPrimary }}>
                  {r.distanceFromReleaseM.toFixed(1)} m
                </div>
                <div style={{ fontFamily: fontUI, fontSize: 11, color: COLORS.status[r.status], fontWeight: 500 }}>
                  {STATUS_LABEL[r.status]}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
