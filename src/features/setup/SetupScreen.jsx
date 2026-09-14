import React, { useMemo, useState } from "react";
import { ChevronDown, ShieldAlert, Wind, TrendingUp, ArrowRight, User } from "lucide-react";
import { COLORS, fontUI, fontMono } from "../../styles/tokens";
import BrandMark from "../../components/BrandMark";
import SetupScene from "./SetupScene";

/* =========================================================================
   SETUP — Create New Study. The prototype's entry point.

   Composition note: the 3D visualization bleeds across most of the
   viewport as the hero element, with a localized orange leak atmosphere
   layered behind it; the form floats on top of a subtle blueprint-grid
   panel rather than sitting in a rigid form|canvas split. The three
   callouts are rendered by SetupScene itself as on-scene annotations (see
   that file) so they read as part of the visualization, not stacked
   cards. The journey caption below the form is a small explanatory line,
   not a sticky step tracker. Form fields are local UI state only — the
   locked mockStudy contract isn't touched.

   Responsive: this file is self-contained — a local <style> block below
   900px converts the absolute-overlap hero into a stacked layout (3D on
   top, form below), hiding the desktop-only leak-atmosphere/fade-mask
   decoration rather than trying to reposition it. No other file needs to
   change for this to work.
   ========================================================================= */

const JOURNEY_STEPS = ["Define your study", "describe the release", "review assumptions", "run analysis", "explore results"];

const ANNOTATIONS = [
  { id: "hazards", icon: ShieldAlert, title: "Identify Hazards" },
  { id: "impact", icon: Wind, title: "Assess Impact" },
  { id: "decisions", icon: TrendingUp, title: "Make Safer Decisions" },
];


function SetupHeader() {
  return (
    <header
      className="flex items-center justify-between px-8 flex-shrink-0 su-header"
      style={{ height: 64, background: "rgba(255,255,255,0.85)", borderBottom: `1px solid ${COLORS.border}`, backdropFilter: "blur(6px)" }}
    >
    <div className="flex items-center">
      <BrandMark />

      <div
        style={{
          height: 20,
          width: 1,
          background: COLORS.border,
          marginLeft: 18,
          marginRight: 16,
        }}
      />

      <div
        className="flex items-center"
        style={{
          fontFamily: fontUI,
          fontSize: 12,
          color: COLORS.textSecondary,
          whiteSpace: "nowrap",
        }}
      >
        {JOURNEY_STEPS.map((step, i) => (
          <React.Fragment key={step}>
            <span
              style={{
                color: i === 0 ? COLORS.textPrimary : COLORS.textSecondary,
              }}
            >
              {step}
            </span>

            {i < JOURNEY_STEPS.length - 1 && (
              <span
                style={{
                  margin: "0 8px",
                  color: COLORS.borderStrong,
                }}
              >
                /
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>

<button className="flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1.5 focus-ring" style={{ border: `1px solid ${COLORS.border}` }}>
        <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#EEF0F1" }}>
          <User size={13} color={COLORS.textSecondary} />
        </span>
        <span style={{ fontFamily: fontUI, fontSize: 13, color: COLORS.textPrimary }}>User</span>
        <ChevronDown size={14} color={COLORS.textTertiary} />
      </button>
    </header>
  );
}

const fieldStyle = {
  fontFamily: fontUI,
  fontSize: 13.5,
  color: COLORS.textPrimary,
  background: COLORS.surface,
  border: `1px solid ${COLORS.borderStrong}`,
  borderRadius: 3,
  padding: "10px 12px",
  width: "100%",
};

export default function SetupScreen({ onStartStudy }) {
  const [studyName, setStudyName] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [description, setDescription] = useState("");

  const canStart = studyName.trim().length > 0 && facilityName.trim().length > 0;

  // Stable reference so SetupScene's effect isn't re-triggered every render.
  const annotations = useMemo(() => ANNOTATIONS, []);

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden" style={{ background: COLORS.appBg }}>
      <SetupHeader />

      <div
        className="flex-1 relative overflow-hidden su-hero"
        style={{
          backgroundImage: `radial-gradient(circle, ${COLORS.brandSecondary}14 1px, transparent 1px)`,
          backgroundSize: "26px 26px",
        }}
      >

        {/* localized orange leak source */}
        <div
          className="absolute pointer-events-none su-leak"
          style={{
            width: "16%",
            height: "20%",
            right: "20%",
            top: "31%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255, 103, 30, 0.34) 0%, rgba(255, 103, 30, 0.18) 28%, rgba(255, 103, 30, 0.05) 55%, transparent 75%)",
            filter: "blur(10px)",
            zIndex: 0,
          }}
        />

        {/* spreading leak cloud */}
        <div
          className="absolute pointer-events-none su-leak"
          style={{
            width: "35%",
            height: "45%",
            right: "10%",
            top: "18%",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at 42% 55%, rgba(255, 126, 55, 0.18) 0%, rgba(255, 126, 55, 0.10) 25%, rgba(255, 126, 55, 0.045) 48%, transparent 72%)",
            filter: "blur(20px)",
            transform: "rotate(-12deg)",
            zIndex: 0,
          }}
        />

        {/* very soft outer atmospheric diffusion */}
        <div
          className="absolute pointer-events-none su-leak"
          style={{
            width: "48%",
            height: "58%",
            right: "3%",
            top: "10%",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at 40% 55%, rgba(255, 143, 78, 0.07) 0%, rgba(255, 143, 78, 0.035) 40%, transparent 72%)",
            filter: "blur(28px)",
            zIndex: 0,
          }}
        />

        {/* 3D hero — bleeds across most of the viewport */}
        <div className="absolute inset-y-0 right-0 su-3d-wrap" style={{ top: "8%", bottom: "1%", width: "68%", zIndex: 1 }}>
            <SetupScene annotations={annotations} />
        </div>

        {/* soft blend so the hero fades into the panel rather than a hard split */}
        <div
          className="absolute inset-y-0 left-0 pointer-events-none su-leak"
          style={{ width: 340, background: `linear-gradient(to right, ${COLORS.appBg} 25%, transparent)` }}
        />

        {/* floating content column */}
        <div className="relative z-10 h-full flex items-center su-form-wrap" style={{ maxWidth: 620, padding: "0 56px" }}>
          <div>
            {/* <div className="flex items-center gap-2 mb-3">
              <span style={{ width: 7, height: 7, borderRadius: 999, background: COLORS.brand, display: "inline-block" }} />
              <span style={{ fontFamily: fontUI, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: COLORS.brand }}>
                SAFETY ANALYSIS PLATFORM
              </span>
            </div> */}
            <h1 className="su-h1" style={{ fontFamily: fontUI, fontWeight: 700, fontSize: 38, lineHeight: 1.15, color: COLORS.brandSecondary, marginBottom: 12, letterSpacing: "-0.01em" }}>
              Create a New Study
            </h1>
            <p style={{ fontFamily: fontUI, fontSize: 14.5, color: COLORS.textSecondary, lineHeight: 1.6, maxWidth: 420, marginBottom: 28 }}>
              Set up your facility and analysis scenario to assess potential hazards and improve safety outcomes.
            </p>

            <div
              className="rounded-sm p-6"
              style={{ background: "rgba(255,255,255,0.88)", border: `1px solid ${COLORS.border}`,borderTop: `2px solid ${COLORS.brand}`, backdropFilter: "blur(4px)", maxWidth: 460, boxShadow: "0 12px 30px rgba(20,23,27,0.06)" }}
            >
              <div className="mb-4">
                <label style={{ fontFamily: fontUI, fontSize: 12.5, color: COLORS.textSecondary, fontWeight: 500 }}>
                  Study Name <span style={{ color: COLORS.brand }}>*</span>
                </label>
                <input
                  type="text"
                  value={studyName}
                  onChange={(e) => setStudyName(e.target.value)}
                  placeholder="e.g. Refinery Safety Analysis"
                  className="focus-ring"
                  style={{ ...fieldStyle, marginTop: 6 }}
                />
              </div>

              <div className="mb-4">
                <label style={{ fontFamily: fontUI, fontSize: 12.5, color: COLORS.textSecondary, fontWeight: 500 }}>
                  Facility / Project Name <span style={{ color: COLORS.brand }}>*</span>
                </label>
                <input
                  type="text"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder="e.g. LPG Storage Facility"
                  className="focus-ring"
                  style={{ ...fieldStyle, marginTop: 6 }}
                />
              </div>

              <div className="mb-5">
                <div className="flex items-baseline justify-between">
                  <label style={{ fontFamily: fontUI, fontSize: 12.5, color: COLORS.textSecondary, fontWeight: 500 }}>
                    Description (optional)
                  </label>
                  <span style={{ fontFamily: fontMono, fontSize: 10.5, color: COLORS.textTertiary }}>
                    {description.length}/500
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  placeholder="Add a brief description of your study..."
                  rows={3}
                  className="focus-ring"
                  style={{ ...fieldStyle, marginTop: 6, resize: "none" }}
                />
              </div>

              <button
                onClick={onStartStudy}
                disabled={!canStart}
                className="w-full flex items-center justify-center gap-2 rounded-sm py-2.5 focus-ring"
                style={{
                  background: canStart ? COLORS.brand : "rgba(194,74,29,0.16)",
                  color: canStart ? "#fff" : "rgba(194,74,29,0.75)",
                  fontFamily: fontUI,
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: canStart ? "pointer" : "not-allowed",
                  boxShadow: canStart ? "0 6px 16px rgba(194,74,29,0.28)" : "none",
                  transition: "background 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                Start Study
                <ArrowRight size={15} />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}