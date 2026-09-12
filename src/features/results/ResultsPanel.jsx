import { COLORS } from "../../styles/tokens";
import HazardZoneList from "./HazardZoneList";
import ReceptorList from "./ReceptorList";
import EnvironmentStrip from "./EnvironmentStrip";
import EvidencePanel from "./EvidencePanel";

/* =========================================================================
   RESULTS PANEL — the right-hand rail. Composes the four Results
   sub-panels exactly as they were previously composed inline in App.
   ========================================================================= */

export default function ResultsPanel({
  data,
  zonesById,
  selectedZoneId,
  selectedEquipmentId,
  onSelectZone,
  onSelectEquipment,
}) {
  return (
    <div
      className="flex-shrink-0 flex flex-col overflow-y-auto"
      style={{ width: 360, background: COLORS.surface, borderLeft: `1px solid ${COLORS.border}` }}
    >
      <HazardZoneList zones={data.hazardZones} selectedZoneId={selectedZoneId} onSelectZone={onSelectZone} />
      <div className="border-t" style={{ borderColor: COLORS.border }} />
      <ReceptorList
        receptors={data.affectedReceptors}
        zonesById={zonesById}
        selectedEquipmentId={selectedEquipmentId}
        onSelectEquipment={onSelectEquipment}
      />
      <div className="border-t" style={{ borderColor: COLORS.border }} />
      <EnvironmentStrip scenario={data.scenario} environment={data.environment} />
      <div className="flex-1" />
      <EvidencePanel evidence={data.evidence} analysis={data.analysis} />
    </div>
  );
}
