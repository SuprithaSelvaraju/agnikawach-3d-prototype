import STUDY_DATA from "./mockStudy";

/* =========================================================================
   RUN ANALYSIS (mock)
   Takes the current scenarioDraft and produces an analysisResult.

   This is deliberately a no-op today: it ignores scenarioDraft and
   returns the locked, illustrative mock study unchanged. Nothing here
   performs, or implies, a real consequence calculation.

   Replacing this function's body with a real API/solver call is the
   only change needed to make analysis real — callers (App.jsx) pass
   scenarioDraft in and receive analysisResult back either way.
   ========================================================================= */

export function runAnalysis() {
  // scenarioDraft is intentionally unused for now — see comment above.
  return STUDY_DATA;
}
