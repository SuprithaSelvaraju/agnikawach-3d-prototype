import { useState, useCallback, useMemo } from "react";
import STUDY_DATA from "./data/mockStudy";
import { COLORS, FONT_IMPORT_HREF } from "./styles/tokens";
import Header from "./components/Header";
import FacilityScene from "./scenes/FacilityScene";
import { ZoneLegend, CompassBadge, MockBadge } from "./scenes/ViewportOverlays";
import ResultsPanel from "./features/results/ResultsPanel";
import DefineReleaseScreen from "./features/defineRelease/DefineReleaseScreen";

/* =========================================================================
   ROOT APP — orchestration and state only. All presentation lives in
   ./data, ./styles, ./scenes and ./features/results.

   Minimal screen switch: Define Release is the entry point (it comes
   first in the real journey). Its Continue button is wired forward, but
   Review doesn't exist yet, so it lands on the existing Results screen —
   a placeholder destination, not a built Review step.
   ========================================================================= */

export default function App() {
  const [screen, setScreen] = useState("defineRelease");
  const data = STUDY_DATA;
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(null);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [visibleZones, setVisibleZones] = useState({ lfl: true, half_lfl: true, quarter_lfl: true });

  const zonesById = useMemo(() => Object.fromEntries(data.hazardZones.map((z) => [z.id, z])), [data]);

  const toggleZone = useCallback((styleKey) => {
    setVisibleZones((v) => ({ ...v, [styleKey]: v[styleKey] === false ? true : false }));
  }, []);

  const handleSelectEquipment = useCallback((id) => {
    setSelectedEquipmentId(id);
  }, []);

  const handleSelectZone = useCallback((id) => {
    setSelectedZoneId(id);
  }, []);

  if (screen === "defineRelease") {
    return <DefineReleaseScreen onContinue={() => setScreen("results")} />;
  }

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden" style={{ background: COLORS.appBg }}>
      <style>{`@import url('${FONT_IMPORT_HREF}');`}</style>
      <Header study={data.study} />

      <div className="flex-1 flex min-h-0">
        {/* 3D viewport — hero element */}
        <div className="flex-1 relative min-w-0">
          <FacilityScene
            data={data}
            selectedEquipmentId={selectedEquipmentId}
            selectedZoneId={selectedZoneId}
            visibleZones={visibleZones}
            onSelectEquipment={handleSelectEquipment}
            onSelectZone={handleSelectZone}
          />
          <ZoneLegend zones={data.hazardZones} visibleZones={visibleZones} onToggle={toggleZone} />
          <CompassBadge windSpeedMS={data.environment.windSpeedMS} windDirectionDeg={data.environment.windDirectionDeg} />
          <MockBadge />
        </div>

        <ResultsPanel
          data={data}
          zonesById={zonesById}
          selectedZoneId={selectedZoneId}
          selectedEquipmentId={selectedEquipmentId}
          onSelectZone={handleSelectZone}
          onSelectEquipment={handleSelectEquipment}
        />
      </div>
    </div>
  );
}
