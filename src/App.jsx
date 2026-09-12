import { useState, useCallback, useMemo } from "react";
import STUDY_DATA from "./data/mockStudy";
import { createInitialScenarioDraft } from "./data/scenarioDraft";
import { runAnalysis } from "./data/runAnalysis";
import { COLORS, FONT_IMPORT_HREF } from "./styles/tokens";
import Header from "./components/Header";
import FacilityScene from "./scenes/FacilityScene";
import { ZoneLegend, CompassBadge, MockBadge } from "./scenes/ViewportOverlays";
import ResultsPanel from "./features/results/ResultsPanel";
import DefineReleaseScreen from "./features/defineRelease/DefineReleaseScreen";
import ReviewScreen from "./features/review/ReviewScreen";

/* =========================================================================
   ROOT APP — orchestration and state only. All presentation lives in
   ./data, ./styles, ./scenes and ./features/results.

   Flow: mockStudy -> scenarioDraft -> Review -> Run Analysis ->
         analysisResult -> Results

   scenarioDraft is the single source of truth for Define Release and
   Review. Run Analysis calls runAnalysis(scenarioDraft) to produce
   analysisResult, which is what the Results screen actually renders.
   runAnalysis is mocked today (see data/runAnalysis.js) but the seam is
   real: swapping in an API/solver later means changing that one
   function, not this component or the Results screen.
   ========================================================================= */

export default function App() {
  const [screen, setScreen] = useState("defineRelease");
  const [scenarioDraft, setScenarioDraft] = useState(() => createInitialScenarioDraft(STUDY_DATA));
  const [analysisResult, setAnalysisResult] = useState(null);

  const [selectedEquipmentId, setSelectedEquipmentId] = useState(null);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [visibleZones, setVisibleZones] = useState({ lfl: true, half_lfl: true, quarter_lfl: true });

  // Results renders analysisResult, not mockStudy directly. Falls back to
  // STUDY_DATA only as a defensive guard; in practice analysisResult is
  // always set by the time this screen is reachable.
  const data = analysisResult || STUDY_DATA;

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

  const handleDraftChange = useCallback((field, value) => {
    setScenarioDraft((d) => ({ ...d, [field]: value }));
  }, []);

  const handleRunAnalysis = useCallback(() => {
    setAnalysisResult(runAnalysis(scenarioDraft));
    setScreen("results");
  }, [scenarioDraft]);

  if (screen === "defineRelease") {
    return (
      <DefineReleaseScreen
        draft={scenarioDraft}
        onChange={handleDraftChange}
        onContinue={() => setScreen("review")}
      />
    );
  }

  if (screen === "review") {
    return (
      <ReviewScreen
        draft={scenarioDraft}
        onEdit={() => setScreen("defineRelease")}
        onRunAnalysis={handleRunAnalysis}
      />
    );
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
