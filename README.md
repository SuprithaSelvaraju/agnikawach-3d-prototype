# AgniKawach Frontend Prototype

A frontend visualization prototype for exploring hazardous-release consequence modelling workflows in industrial facilities.

> **Status:** Work in progress  
> **Analysis:** Illustrative mock/precomputed data — no production solver or CFD calculation is executed.

## Overview

This prototype demonstrates how a future AgniKawach web application could connect:

**Scenario definition → Review → Analysis → Consequence visualization**

It focuses on the frontend experience around a simplified LPG storage and process facility, including:

- industrial facility visualization
- release/scenario configuration
- hazard-zone visualization
- affected-receptor identification
- environmental context
- evidence, assumptions and provenance
- a data flow designed for a future analysis backend

The prototype intentionally does **not** implement the underlying physics, CFD solver, backend infrastructure, CAD ingestion, authentication, or production QRA workflow.

## Prototype Goal

The intended journey is:

```text
Create Study
    ↓
Define Release
    ↓
Review
    ↓
Run Analysis
    ↓
Explore Results
```

The current implementation is being developed incrementally, with the Results + 3D experience serving as the core visualization milestone.

## Current Experience

### Explore Results

The Results experience combines a simplified 3D industrial facility with consequence information.

It demonstrates:

- five identifiable facility equipment objects
- procedural industrial geometry
- LFL / Flammable zone
- 1/2 LFL / Caution zone
- 1/4 LFL / Low-concentration zone
- release-point marker
- meteorological wind vector
- hazard-zone visibility controls
- equipment selection
- hazard-zone selection
- synchronized selection between the 3D scene and Results panels
- affected-receptor status
- environmental conditions
- evidence, assumptions and provenance
- explicit mock-data disclaimer

### Define Release

The Define Release experience provides the scenario configuration interface.

It includes:

- material
- release equipment
- hole size
- wind speed
- wind direction
- atmospheric stability
- advanced release parameters
- derived/read-only values

The UI is intentionally structured as an engineering workflow rather than a generic SaaS form.

### Review

Review is intended to be a read-only confirmation of the user's current scenario configuration.

The intended data flow is:

```text
mockStudy
    ↓
scenarioDraft
    ↓
Review
    ↓
runAnalysis()
    ↓
analysisResult
    ↓
Results
```

At the current prototype stage, `runAnalysis()` remains mocked. The interface is structured so a future real analysis service can replace the mock implementation without requiring the Results UI to be redesigned.

## Facility Model

The facility represents a compact:

**LPG Storage & Process Area**

with a fixed site boundary of approximately **220 m × 160 m**.

The five contract equipment objects are:

| ID    | Equipment              |
| ----- | ---------------------- |
| T-104 | Propane Storage Vessel |
| P-204 | Process Feed Line      |
| V-301 | Separator              |
| P-106 | Transfer Pump          |
| —     | Control Building       |

The facility is intentionally simplified. Procedural geometry provides spatial context without turning the prototype into a detailed plant-modelling project.

The five contract equipment objects remain the meaningful selectable/receptor-linked objects.

## Scenario

The current illustrative scenario models a continuous propane release from T-104.

Representative mock inputs:

- **Material:** Propane (`C3H8`)
- **Hazard type:** Flammable
- **Release type:** Continuous gas release
- **Source model:** Choked-orifice discharge
- **Hole diameter:** 12 mm
- **Pressure:** 8 bar(a)
- **Process temperature:** 32°C
- **Estimated release rate:** 0.9 kg/s
- **Wind speed:** 5.2 m/s
- **Wind direction:** 247° meteorological (`WSW`)
- **Atmospheric stability:** Class D / Neutral

These values are illustrative prototype data, not results from a production solver.

## Hazard Visualization

The prototype uses three nested consequence zones:

| Zone                   | Threshold | Downwind distance |     Area |
| ---------------------- | --------: | ----------------: | -------: |
| Flammable zone         |       LFL |            86.4 m |   420 m² |
| Caution zone           |   1/2 LFL |           124.7 m |   760 m² |
| Low-concentration zone |   1/4 LFL |           162.3 m | 1,240 m² |

Zone geometry is read directly from the locked mock study data.

The frontend uses semantic `styleKey` values to determine zone presentation rather than storing presentation-specific colors in the data contract.

## Coordinate Convention

The prototype uses:

- **X:** East
- **Z:** North
- **Y:** Up
- **Heading:** 0° North, clockwise

Wind direction follows the meteorological **"from"** convention.

For example:

```text
Wind from 247°
       ↓
Plume travels toward 67°
```

This convention is shared by the facility geometry, release point, hazard-zone geometry and wind visualization.

## Affected Receptors

The Results interface demonstrates how consequence zones can be related to facility receptors.

Current illustrative receptors include:

- T-104 Storage Tank
- P-204 Process Line
- V-301 Separator
- P-106 Transfer Pump
- Control Building

Each receptor can display:

- zone membership
- distance
- status

Example statuses:

- **At risk**
- **Caution**
- **Clear**

This establishes the core product concept of connecting **how far the consequence reaches** with **what is inside that boundary**.

## Architecture

The prototype deliberately keeps the architecture small:

```text
src/
├── App.jsx
├── data/
│   └── mockStudy.js
├── styles/
│   └── tokens.js
├── utils/
│   └── geo.js
├── components/
│   ├── Header.jsx
│   └── SectionHeading.jsx
├── scenes/
│   ├── sceneBuilders.js
│   ├── FacilityScene.jsx
│   └── ViewportOverlays.jsx
└── features/
    └── results/
        ├── ResultsPanel.jsx
        ├── HazardZoneList.jsx
        ├── ReceptorList.jsx
        ├── EnvironmentStrip.jsx
        └── EvidencePanel.jsx
```

### Design principles

**Single source of truth**  
Mock study data lives separately from UI and visualization code.

**Shared state**  
Selection state is shared between the 3D scene and Results UI.

**Semantic visualization data**  
Hazard zones use semantic identifiers such as `styleKey`; visual styling remains a frontend concern.

**Incremental architecture**  
The project is intentionally not over-engineered. Components are separated where they represent meaningful reusable or independently understandable pieces.

**Future backend compatibility**  
The frontend should eventually be able to replace the mock analysis with a real analysis service without changing the fundamental Results experience.

## Technology

- React
- JavaScript
- Tailwind CSS
- Three.js
- React Three Fiber / Three.js-compatible scene architecture where appropriate

The facility visualization primarily uses procedural geometry.

## Out of Scope

This repository is a frontend prototype.

It does **not** implement:

- real consequence calculations
- CFD
- GPU solver execution
- quantitative risk calculations
- real atmospheric modelling
- CAD import
- plant-model normalization
- backend APIs
- authentication
- database infrastructure
- production report generation
- emergency-planning or safety-report workflows

The purpose is to prototype the **frontend interaction model and visualization experience** around these future capabilities.

## Data and Provenance

The prototype uses mock/precomputed illustrative values and explicitly communicates this limitation.

The UI includes a disclaimer along the lines of:

> Illustrative only. Not a simulation result. Do not use for design, siting, emergency planning or a safety report.

The evidence section also records assumptions and provenance so mock results are not presented as real engineering analysis.

## Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

The exact available scripts depend on the project scaffold.

## Development Direction

The prototype is being developed in focused increments:

1. Establish Results + 3D visualization.
2. Separate the frontend into maintainable components.
3. Build Define Release.
4. Connect scenario inputs through shared `scenarioDraft` state.
5. Build Review as a read-only scenario confirmation.
6. Add a lightweight mocked Run Analysis transition.
7. Connect the flow into Explore Results.
8. Perform a final end-to-end UX and visual polish pass.

The priority is not maximum feature count. The priority is a convincing, coherent demonstration of the product workflow.

## Disclaimer

This project is a conceptual frontend prototype for demonstration and development purposes.

All scenario values, hazard-zone geometry, receptor relationships and analysis outputs currently shown by the application are illustrative/mock data.
