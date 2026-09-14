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
import SetupScreen from "./features/setup/SetupScreen";

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

   GLOBAL_STYLE below was previously only rendered inside the Results
   branch, so the Inter/IBM Plex Mono font import never actually loaded
   on Setup, Define Release or Review — they were silently falling back
   to system fonts. It's now rendered once, unconditionally, alongside a
   small set of shared focus-state and responsive rules used across every
   screen. No screen's own JSX/logic changes as a result.
   ========================================================================= */

const GLOBAL_STYLE = `
  @import url('${FONT_IMPORT_HREF}');

  /* ---- consistent focus/hover affordances across the whole app ---- */
  .focus-ring:focus-visible {
    outline: 2px solid rgba(194, 74, 29, 0.45);
    outline-offset: 1px;
  }
  input.focus-ring:focus, select.focus-ring:focus, textarea.focus-ring:focus {
    outline: none;
    border-color: ${COLORS.brand} !important;
    box-shadow: 0 0 0 3px rgba(194, 74, 29, 0.14);
  }
  button.focus-ring:focus:not(:focus-visible) { outline: none; }

  /* ================= RESPONSIVE ================= */

  /* ---- Setup: form | 3D two-column hero ---- */
  @media (max-width: 900px) {
    .setup-hero-row { flex-direction: column; overflow-y: auto !important; }
    .setup-form-col { width: 100% !important; max-width: none !important; padding: 28px 24px 8px !important; }
    .setup-3d-col { flex: none !important; width: 100% !important; height: 360px !important; }
    .setup-h1 { font-size: 27px !important; }
  }
  @media (max-width: 480px) {
    .setup-form-col { padding: 20px 16px 8px !important; }
    .setup-3d-col { height: 280px !important; }
    .setup-h1 { font-size: 23px !important; }
    .setup-header { padding-left: 16px !important; padding-right: 16px !important; }
    .setup-journey > div:last-child { line-height: 1.9 !important; }
  }

  /* ---- shared app header (Results / Define Release / Review) ---- */
  @media (max-width: 640px) {
    .app-header { padding-left: 12px !important; padding-right: 12px !important; }
    .header-breadcrumb, .header-divider { display: none !important; }
  }
  @media (max-width: 420px) {
    .header-status-label { display: none !important; }
  }

  /* ---- Define Release / Review: field-grid | facility-context two-column ---- */
  @media (max-width: 900px) {
    .setup-like-two-col { flex-direction: column; overflow-y: auto !important; }
    .two-col-side { width: 100% !important; order: -1; border-left: none !important; border-bottom: 1px solid ${COLORS.border}; }
    .two-col-main { border-right: none !important; overflow-y: visible !important; }
  }
  @media (max-width: 560px) {
    .field-grid-2 { grid-template-columns: 1fr !important; }
    .summary-strip { row-gap: 6px !important; }
  }

  /* ---- Results: 3D viewport | side panel ---- */
  @media (max-width: 900px) {
    .results-row { flex-direction: column; }
    .results-3d-col { flex: none !important; height: 46vh !important; min-height: 260px; }
    .results-panel-col { width: 100% !important; }
  }

  /* ---- generic small-viewport safety net: no horizontal overflow ---- */
  html, body, #root { max-width: 100%; overflow-x: hidden; }
`;

export default function App() {
  const [screen, setScreen] = useState("setup");
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

  // Back to setup preserves scenarioDraft/analysisResult in memory exactly
  // as they are — navigating back and forward again does not reset them.
  const handleBackToSetup = useCallback(() => {
    setScreen("setup");
  }, []);

  let content;

  if (screen === "setup") {
    content = <SetupScreen onStartStudy={() => setScreen("defineRelease")} />;
  } else if (screen === "defineRelease") {
    content = (
      <DefineReleaseScreen
        draft={scenarioDraft}
        onChange={handleDraftChange}
        onContinue={() => setScreen("review")}
      />
    );
  } else if (screen === "review") {
    content = (
      <ReviewScreen
        draft={scenarioDraft}
        onEdit={() => setScreen("defineRelease")}
        onRunAnalysis={handleRunAnalysis}
      />
    );
  } else {
    content = (
      <div className="w-full h-screen flex flex-col overflow-hidden" style={{ background: COLORS.appBg }}>
        <Header study={data.study} onBackToSetup={handleBackToSetup} />

        <div className="flex-1 flex min-h-0 results-row">
          {/* 3D viewport — hero element */}
          <div className="flex-1 relative min-w-0 results-3d-col">
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

  return (
    <>
      <style>{GLOBAL_STYLE}</style>
      {content}
    </>
  );
}
