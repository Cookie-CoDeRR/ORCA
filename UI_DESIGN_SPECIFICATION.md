# 🐬 Project ORCA — Definitive UI/UX Design Specification

> **Sovereign Marine Intelligence & Earth Observation Platform (SIH26176)**
> **Design Language:** Between Google Maps' Operational Clarity & NASA's Scientific Immersion
> **Stack:** Next.js 14+ · MapLibre GL JS · deck.gl · Three.js Globe · Zustand · Framer Motion
> **Status:** Production Design Blueprint — v2.0

---

## 📑 Table of Contents
1. [Design Language & Visual System](#1-design-language--visual-system)
2. [Typography, Colors & Tokens](#2-typography-colors--tokens)
3. [Screen 1: Landing Page](#3-screen-1-landing-page--first-impression)
4. [Screen 2: Signup & Persona Selection Flow](#4-screen-2-signup--persona-selection-flow)
5. [Screen 3: Main Application — 3D Globe](#5-screen-3-the-main-application--3d-interactive-globe)
6. [Screen 4: Report Scroll View](#6-screen-4-report-scroll-view--after-ai-analysis)
7. [Jump Navigation — Right Side Quick Nav](#7-jump-navigation--section-anchors)
8. [Component Specs & Micro-Animations](#8-component-specifications--micro-animations)
9. [Responsive Breakpoints](#9-responsive-layout-breakpoints)
10. [Developer Implementation Notes](#10-developer-implementation-notes)

---

## 1. Design Language & Visual System

### The Core Aesthetic: "Operational Clarity × Scientific Immersion"

ORCA lives in the design space between two references:

| Dimension | Google Maps | NASA Website | ORCA Synthesis |
|---|---|---|---|
| **Color Palette** | Clean whites, sky blues | Deep space black, nebula purples | **Abyss black + Bioluminescent teal + Satellite gold** |
| **Typography** | Product Sans — geometric | Helvetica Neue — authoritative | **Inter UI + JetBrains Mono data + Roboto Condensed HUD** |
| **Data Density** | Medium, consumable | High, scientific audience | **Adaptive density per persona** |
| **Animation Style** | Smooth pans, fade cards | Cinematic slow pulses | **Globe spin + SSE token stream + data pulse rings** |
| **Map Rendering** | Flat vector tiles | Orthographic globe | **Full interactive 3D WebGL globe** |
| **Navigation** | Bottom bar / top minimal | Horizontal mega-nav | **Top search bar + vertical right jump nav + drawers** |

### Core Design Principles

1. **The Ocean Is the Canvas.** The globe is not a component — it *is* the page. Every element floats as glass over it.
2. **Glassmorphism × Scientific Precision.** All panels: `backdrop-filter: blur(18px)`, `rgba(4, 10, 20, 0.65)` fills. No flat solid backgrounds.
3. **Bioluminescence as a Feedback Language.** Green = Safe/Live · Amber = Caution · Red = Alert · Teal = Selected · Purple = AI activity.
4. **Data Feels Alive.** Numbers tick up on change. Lines draw themselves. Markers pulse. AI text streams character by character.
5. **Zero-Noise Loading.** No skeleton loaders. Globe keeps rendering; panels animate in from `opacity:0, y:16px → opacity:1, y:0`.

---

## 2. Typography, Colors & Tokens

```css
/* globals.css — ORCA Design Tokens */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Roboto+Condensed:wght@400;700&display=swap');

:root {
  /* Backgrounds — Oceanic Depth Scale */
  --color-void:          #020508;   /* Page background — absolute black */
  --color-abyss:         #040A14;   /* Globe scene */
  --color-trench:        #071422;   /* Sidebar / drawer fills */
  --color-deep:          #0B2034;   /* Card panels */
  --color-shelf:         #0F2D45;   /* Input backgrounds */
  --color-surface:       #163D5A;   /* Borders, dividers */

  /* Glass */
  --glass-bg:            rgba(4, 10, 20, 0.65);
  --glass-border:        rgba(0, 200, 180, 0.14);
  --glass-blur:          18px;

  /* Bioluminescent Teal — Primary */
  --color-biolum-400:    #00E5CC;
  --color-biolum-500:    #00C8B4;
  --color-biolum-600:    #00A896;
  --color-biolum-glow:   rgba(0, 200, 180, 0.35);

  /* Satellite Gold — Metrics & Data */
  --color-satellite-400: #FFD166;
  --color-satellite-500: #F0B429;
  --color-satellite-glow:rgba(240, 180, 41, 0.30);

  /* Signal Blue — AI & Agent Activity */
  --color-signal-400:    #4EAAFF;
  --color-signal-500:    #2D8EFF;

  /* Hazard Spectrum */
  --color-safe:          #06D6A0;
  --color-caution:       #FFB703;
  --color-danger:        #EF233C;
  --color-border-breach: #FF4D6D;

  /* Text */
  --text-primary:        #E8EEF5;
  --text-secondary:      #7E97B2;
  --text-muted:          #3D5A73;
  --text-accent:         var(--color-biolum-400);
  --text-code:           #94E2D5;

  /* Fonts */
  --font-ui:    'Inter', system-ui, sans-serif;
  --font-data:  'JetBrains Mono', monospace;
  --font-hud:   'Roboto Condensed', Arial, sans-serif;

  /* Type Scale */
  --text-xs:   0.6875rem;  /* 11px HUD labels */
  --text-sm:   0.8125rem;  /* 13px sidebar */
  --text-base: 0.9375rem;  /* 15px chat/cards */
  --text-lg:   1.125rem;   /* 18px section heads */
  --text-xl:   1.375rem;   /* 22px card titles */
  --text-2xl:  1.75rem;    /* 28px screen titles */
  --text-hero: 3.5rem;     /* 56px landing hero */

  /* Radii */
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  16px;
  --radius-xl:  24px;
  --radius-pill: 999px;

  /* Easings */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Shadows */
  --shadow-card:  0 4px 24px rgba(0, 200, 180, 0.08), 0 1px 3px rgba(0,0,0,0.5);
  --shadow-glow:  0 0 24px var(--color-biolum-glow);
  --shadow-panel: 0 8px 48px rgba(0, 0, 0, 0.8);
}
```

---

## 3. Screen 1: Landing Page — First Impression

Full-viewport hero with a **live rotating Three.js WebGL globe** centered in the viewport.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  TOP NAV BAR (64px, glass)                                                               │
│  [🐬 ORCA]                                  [About] [Docs] [API] [Sign In] [Launch →]   │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│                           🌐  LIVE THREE.JS GLOBE                                       │
│         (Rotating 0.04°/frame · SST texture · Current particle flow · PFZ pulses)       │
│                                                                                          │
│  ┌────────────────────────────────┐          (Stat pills — bottom right)                 │
│  │  🐬 ORCA                       │    ┌──────────────────────────────────────┐          │
│  │  Ocean Research &              │    │ 🟢  142 Vessels Tracked Live          │          │
│  │  Coastal Analytics             │    │ 🌡   28.4°C SST — Arabian Sea         │          │
│  │                                │    │ 🐟  93% PFZ Confidence — Veraval      │          │
│  │  India's Sovereign Multi-Agent │    │ 🛡   74.2 km to Nearest IMBL           │          │
│  │  Marine Intelligence Platform  │    └──────────────────────────────────────┘          │
│  │                                │                                                      │
│  │  [🚀 Launch Application]       │                                                      │
│  │  [→  Explore as Guest]         │                                                      │
│  │                                │                                                      │
│  │  Powered by:                   │                                                      │
│  │  ISRO · INCOIS · MOSDAC · CMFRI│                                                      │
│  └────────────────────────────────┘                                                      │
│                                                                                          │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  MARQUEE TICKER (24px, glass):                                                           │
│  📡 LIVE — SST: 28.4°C · Chl-a: 1.26 mg/m³ · SWH: 1.6m · AIS: 142 vessels · IMBL:74km │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Globe Behavior on Landing

- **Auto-Rotation:** `0.04°/frame` eastward drift. Halts on hover/drag.
- **SST Texture:** Three.js `SphereGeometry(r=66, 48, 48)` with NASA GIBS tiles mapped as `CanvasTexture` onto UV sphere.
- **Current Particles:** 2,000 teal dots (`#00E5CC`, 1.5px) flowing along $u_o, v_o$ vectors from the preloaded 4,714-node grid — accelerating through Somali Current and NE Counter-Current.
- **PFZ Glow Nodes:** 24 gold dome markers pulsing `scale: 1.0 → 1.4 → 1.0` every 2.5s.
- **AIS Vessel Dots:** 142 white dots, `opacity: 0.6`, updating kinematically every 2 seconds.
- **Hover Reticle:** Raycaster-detected lat/lon readout appears at cursor-sphere intersection.

### Below-the-Fold Content

**Row 1 — Feature Cards:**
```
┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
│ 🌊 Ocean Intelligence │  │ 🛡 Sovereign Security  │  │ 🐟 Fisheries Guidance │
│ SST, currents, Chl-a, │  │ IMBL geofencing, AIS  │  │ PFZ, tide times,      │
│ PFZ AI analysis.      │  │ COLREGs command.      │  │ species & markets.    │
└───────────────────────┘  └───────────────────────┘  └───────────────────────┘
```

**Row 2 — Live Stat Counter Bar** (numbers tick up via `countUp.js`):
```
  2.02M km²  |  142 Vessels  |  28.4°C SST  |  93% PFZ Accuracy  |  6 Languages
  Indian EEZ    Tracked Live    Arabian Sea    AI Confidence        Supported
```

**Row 3 — Final CTA:**
```
  Ready to explore India's maritime intelligence?
  [🚀 Get Started — Select Your Profile]    [→ Watch 90-second Demo]
```

---

## 4. Screen 2: Signup & Persona Selection Flow

Globe spins slowly at `opacity: 0.3` behind a centered 580px wide glass wizard card.

### Step 1 — Persona Selection
```
┌──────────────────────────────────────────────────────────┐
│                                                  Step 1  │
│  🐬  Welcome to ORCA                              ●○○    │
│  ─────────────────────────────────────────────────────   │
│  I am accessing ORCA as a...                             │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🧭  Fisherman / Navigator                          │  │
│  │     Daily catch planning, fuel-optimal routes      │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🔬  Marine Researcher / Scientist                  │  │
│  │     NetCDF analysis, scientific reports & export   │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🛡️  Coast Guard / Defense Operator                 │  │
│  │     IMBL monitoring, AIS threats, SITREPs          │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🎓  Student / Ocean Learner                        │  │
│  │     Ocean physics, marine biology, wave mechanics  │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🌊  Guest / Public Visitor (no signup required)    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│                                        [Continue →]      │
└──────────────────────────────────────────────────────────┘
```

On selection: card border glows teal `#00C8B4` with a `✓` badge top-right.

### Step 2 — Role Profile (Fisherman Example)
```
┌──────────────────────────────────────────────────────────┐
│                                                  Step 2  │
│  🧭  Complete Your Navigator Profile              ●●○    │
│  ─────────────────────────────────────────────────────   │
│  Full Name           [ Ramesh Patel              ]       │
│  Phone (WhatsApp)    [ +91 98765 43210            ]       │
│  Home Harbor         [ Veraval ▼                  ]       │
│  State               [ Gujarat ▼                  ]       │
│  Vessel License No.  [ GJ-11-MM-4029              ]       │
│  Primary Language    [ 🇮🇳 Gujarati ▼              ]       │
│                                                          │
│  Target Species (up to 3):                               │
│  [✓ Yellowfin Tuna] [✓ Mackerel] [ Sardine ]            │
│  [ Pomfret ] [ Squid ] [ King Fish ]                     │
│                                                          │
│  Fishing Distance:                                       │
│  ○ Near Shore (<12NM)  ● Offshore (12-100NM)  ○ Deep Sea │
│                                                          │
│  [← Back]                            [Continue →]       │
└──────────────────────────────────────────────────────────┘
```

### Step 3 — Account & Language
```
┌──────────────────────────────────────────────────────────┐
│                                                  Step 3  │
│  🔐  Secure Your Account                          ●●●    │
│  ─────────────────────────────────────────────────────   │
│  Email               [ ramesh@fishing.in          ]       │
│  Password            [ ••••••••••••••             ]       │
│  Confirm Password    [ ••••••••••••••             ]       │
│                                                          │
│  Display Language:                                       │
│  [EN] [हिं] [ગુ] [தமி] [తెలు] [ম] [മല]                  │
│                                                          │
│  [✓] Agree to ORCA Terms & Privacy Policy                │
│  [✓] I am a licensed marine operator                     │
│                                                          │
│  [← Back]                    [🚀 Launch ORCA →]          │
└──────────────────────────────────────────────────────────┘
```

**Transition on Launch:** Globe scales from `0.3 → 1.0 opacity`, panels fade in. `600ms ease-out-expo`.

---

## 5. Screen 3: The Main Application — 3D Interactive Globe

**The entire viewport is the 3D earth.** All controls float as glass panels over it.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  TOP NAV BAR — 56px (glass, full-width)                                                  │
├───┬──────────────────────────────────────────────────────────────────────────────┬───────┤
│   │                                                                              │       │
│ L │                                                                              │  R    │
│ E │              THREE.JS INTERACTIVE 3D GLOBE                                  │  I    │
│ F │                   (full-viewport WebGL canvas)                               │  G    │
│ T │                                                                              │  H    │
│   │      5×5 km spherical mesh visible at zoom > 7                               │  T    │
│ D │                                                                              │       │
│ O │      Hover cell → data tooltip card appears                                  │  J    │
│ C │      Click cell → AI auto-queries telemetry + geofence                       │  U    │
│ K │                                                                              │  M    │
│   │                                                                              │  P    │
│ 2 │                                                                              │       │
│ 0 │                                                                              │  N    │
│ 0 │                                                                              │  A    │
│ p │                                                                              │  V    │
│ x │                                                                              │       │
│   │                                                                              │ 32px  │
├───┴──────────────────────────────────────────────────────────────────────────────┴───────┤
│  BOTTOM STATUS BAR — 32px (glass)                                                        │
│  📡 AIS:LIVE | SST:28.4°C | SWH:1.6m | Wind:12kts | IMBL:74.2km | FPS:60               │
└──────────────────────────────────────────────────────────────────────────────────────────┘

     [AI pull tab on right wall — ◄ arrow sticking out, 32px wide × 120px tall]
```

---

### 5.1 Global Top Navigation Bar

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  [🐬 ORCA]   [🔍 Search locations, harbors, coordinates, species...]  [Arabian Sea ▼]    │
│              [🗺 Map] [📊 Data] [📄 Reports] [📜 Vault] [🤖 Agents] [👤 Profile]  🟢API │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

**Search Bar** (560px centered):
- On focus → drops panel:
  ```
  ┌────────────────────────────────────────────────┐
  │ 🏖️  Veraval Commercial Fishing Harbor, Gujarat  │
  │     20.902°N, 70.368°E · 82 trawlers registered│
  ├────────────────────────────────────────────────┤
  │ 🔍  Search "Veraval" in Research Papers         │
  │ 🗺️  Fly to Veraval on Map                       │
  │ 📡  Get Ocean Telemetry for Veraval             │
  └────────────────────────────────────────────────┘
  ```
- History saved to `GET /api/v1/search` and `localStorage`.

**Basin Selector:** Clicking `[Arabian Sea ▼]` shows pill group:
`[Arabian Sea] [Bay of Bengal] [Lakshadweep] [Andaman]`
— rotates globe to center on selected region.

**Nav Pills:** Each opens a specific panel/route:
- `[🗺 Map]` → stays on globe · `[📊 Data]` → EO Hub slide-in panel
- `[📄 Reports]` → scroll to report view · `[📜 Vault]` → Regulatory Vault
- `[🤖 Agents]` → Agent Synapse Graph modal · `[👤 Profile]` → profile dropdown

---

### 5.2 Left Wall — Layer & Filter Control Dock

Anchored left edge, **28px collapsed → 200px on hover/click**.

```
┌──────────────────────┐
│ (top — persona zone) │
│ 🧭 MATSYA-SUTRADHAR  │
│ Navigator Mode       │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│ 🟢 SAFE TO VENTURE   │
│ SWH:1.6m Wind:12kt   │
│                      │
│ ▼ LAYERS             │ ← collapsible header
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│ ☀️  SST Raster   [✓] │
│ 〜  Currents     [✓] │
│ 🐟  PFZ Clusters [✓] │
│ 🛡️  IMBL Borders [✓] │
│ ⚓  AIS Vessels  [✓] │
│ 🛤️  Route Line   [✓] │
│ 🌊  Bathymetry   [ ] │
│ 🔲  Shelf Break  [ ] │
│ 🔗  Graticule    [ ] │
│ ▓  Grid Mesh    [ ] │
│                      │
│ ▼ FILTERS            │ ← collapsible header
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│ SST Range            │
│ [██████████──]       │
│ 24°C ─── 32°C        │
│                      │
│ Wave Height Max      │
│ [████████────]       │
│ 0.0m ─── 4.0m        │
│                      │
│ PFZ Confidence Min   │
│ [████████───]        │
│ 0% ─── 100%          │
│                      │
│ Ship Type Filter     │
│ [✓ Cargo][✓ Fishing] │
│ [✓ Tanker][ Defense] │
│                      │
│ ▼ BASEMAP            │
│ ● Dark Matter        │
│ ○ Nautical           │
│ ○ Light Terrain      │
│ ○ Satellite (GIBS)   │
└──────────────────────┘
```

**Layer toggle design** — compact pill with teal ON state:
```
  [🐟  PFZ Clusters  ━━━━━━ ●]   ON  (teal track)
  [🌊  Bathymetry    ●━━━━━━ ]   OFF (dim gray)
```

---

### 5.3 The 3D Earth Globe with 5×5 km Mesh

#### Technology Stack
- **Engine:** Three.js `SphereGeometry(r=66, 72, 72)` globe body
- **Projection:** Custom `latLonToXYZ(lat, lon, r)` for placing data points on sphere
- **Layers:** All rendered as `THREE.Group` children of the globe — rotate together

#### Visual Layer Order (Bottom → Top)
```
Layer 0:  Globe Inner Void (MeshBasicMaterial #050507, opacity:0.95)
Layer 1:  SST Raster Texture  (CanvasTexture — NASA GIBS tiles)
Layer 2:  2° Graticule Wireframe (color:#52525B, opacity:0.14)
Layer 3:  5×5 km Mesh Overlay (see below)
Layer 4:  Ocean Current Particles (Points — 2000 teal #00E5CC dots)
Layer 5:  PFZ Dome Markers (SphereGeometry gold #FFD166, pulsing)
Layer 6:  IMBL Boundary Lines (Line2, color:#FF4D6D, emissive glow)
Layer 7:  AIS Vessel Dots (Points — white, 1px)
Layer 8:  Selected Coordinate Reticle (RingGeometry, teal, radar pulse)
Layer 9:  3D Route Path (TubeGeometry, color:#00E5CC, glowing cyan)
```

#### 5×5 km Spherical Mesh Grid

Visible when zoom > 7 (~300km viewport). Uses **Level of Detail (LOD)**:
- Zoom 7–9: 25×25 km cells (coarse)
- Zoom 9–11: 5×5 km cells (fine)
- Zoom >11: individual telemetry point view

**Cell coloring** by active layer:
```
SST Active:   teal→yellow→red colormap interpolated on cell SST value
PFZ Active:   transparent fill + gold pulsing ring at PFZ centroids
Risk Active:  green gradient → red hotspot near IMBL boundary
Default:      rgba(0, 200, 180, 0.04) — barely visible teal tint
```

#### Cell Hover → Data Tooltip
```
┌──────────────────────────────────────────────────────┐
│  📍  Cell: CELL_20N_70E_042                          │
│  ──────────────────────────────────────────────────  │
│  📍  20.90°N · 70.35°E   (5 × 5 km grid)            │
│  🌊  Depth: -42.5m  (Continental Shelf)              │
│  ──────────────────────────────────────────────────  │
│  🌡   SST:    28.3°C                                 │
│  🧪  Chl-a:   1.31 mg/m³                            │
│  〜  Current:  1.2 kts @ 142°                        │
│  💨  Waves:    1.4m SWH                              │
│  ──────────────────────────────────────────────────  │
│  🐟  PFZ ACTIVE   Confidence: 91%                    │
│      Species: Yellowfin Tuna                        │
│  ──────────────────────────────────────────────────  │
│  🛡   IMBL: 72.4 km  (GREEN SAFE)                    │
│  ⚓  Traffic: MODERATE density                       │
│                                                      │
│  [Click to Select & Ask AI ▶]                        │
└──────────────────────────────────────────────────────┘
```

Tooltip uses `backdrop-filter: blur(18px)`, `rgba(4, 10, 20, 0.85)` fill, teal border.

#### Cell Click Interaction
1. Globe cameras smooth-flies to cell center (`zoom: current+1.5`, `600ms`)
2. Radar reticle ring appears at click point
3. Concurrent API calls fire:
   - `GET /api/v1/ocean/telemetry?lat=...&lon=...`
   - `GET /api/v1/risk/geofence?lat=...&lon=...`
4. AI drawer pull-tab glows teal 3×, hinting at readiness
5. AI chat pre-populates: `"Analyze ocean conditions at 20.90°N, 70.35°E"`

#### Globe Control Buttons (Bottom-Right)
```
  ┌───┐
  │ + │  Zoom In
  ├───┤
  │ - │  Zoom Out
  ├───┤
  │ ⟳ │  Reset Orientation
  ├───┤
  │ 2D│  Toggle 2D/3D
  ├───┤
  │ ▤ │  Toggle Mesh Visibility
  └───┘
```

---

### 5.4 Right Wall — AI Copilot Side Chat Drawer

#### Pull Tab (Collapsed State)
A `32px × 120px` glass pill anchored to the right wall edge, center-vertically:
- Contains: `✦` sparkle icon + `◄` chevron
- On hover: `box-shadow: 0 0 16px rgba(0, 200, 180, 0.5)`

```
(right wall of viewport)
   ┌─────────────────────────────────┐
   │          [globe view]           ├──┐
   │                                 │✦ │  ← pull tab
   │                                 │AI│
   │                                 │  │
   │                                 │◄ │
   │                                 ├──┘
   └─────────────────────────────────┘
```

#### AI Chat Drawer (Open — 380px, slides in from right)

```
┌──────────────────────────────────────────────────────┐
│  ──────────────────────────────────────────────      │ ← drag handle
│  ✦ ORCA AI COPILOT                           [✕]     │
│  ──────────────────────────────────────────────      │
│  Persona: 🧭 Matsya-Sutradhar (Navigator)            │
│  Format: [Conversational ▼]   Basin: [Arabian ▼]    │
│  ──────────────────────────────────────────────      │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │  👤 You — 14:22                              │    │
│  │  What fish off Veraval today, low fuel?      │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │  ✦ ORCA-AI — thinking...                     │    │
│  │  🔄 Supervisor → Ocean Analytics             │    │
│  │  🔄 Ocean Worker: SST raster slice...        │    │
│  │  🔄 Navigation: A* route compute...          │    │
│  │  ✅ Synthesizer: Composing advisory...       │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │  ✦ Matsya-Sutradhar — 14:22                  │    │
│  │                                              │    │
│  │  🚨 Sea Status: 🟢 SAFE TO VENTURE           │    │
│  │                                              │    │
│  │  **Best target: Yellowfin Tuna**             │    │
│  │  Active PFZ at 20.75°N, 70.19°E. SST front  │    │
│  │  28.6°C, Chl-a surge 1.35 mg/m³.            │    │
│  │  Solunar peak: 04:30–07:30 IST.             │    │
│  │                                              │    │
│  │  🧭 Course: 215°  Distance: 28.4 NM          │    │
│  │  ⛽ Fuel saving: **18.4%**                   │    │
│  │  🛡️  IMBL: 74.2km — **GREEN SAFE**            │    │
│  │                                              │    │
│  │  [📄 Generate Full Report ▼]                 │    │  ← triggers Screen 4
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ──────────────────────────────────────────────      │
│  [🎤]  [Ask about this location...]    [Send ▶]      │
│  ──────────────────────────────────────────────      │
│  [📄 Report] [🗺 Route] [📋 Export] [🔊 Speak]       │
└──────────────────────────────────────────────────────┘
```

**Agent thought stream:** `type:"thought"` events render as collapsible trace rows with animated spinner → ✅ checkmark.

**Text streaming:** `type:"chunk"` events render character-by-character with blinking `▋` cursor.

**Message bubble styles:**
- User → right-aligned, `#163D5A` bg, radius `14px 14px 2px 14px`
- AI → left-aligned, glass bg, `3px solid #00C8B4` left border, radius `2px 14px 14px 14px`

---

## 6. Screen 4: Report Scroll View — After AI Analysis

**Trigger:** User clicks `[📄 Generate Full Report ▼]` in AI chat.

**Transition animation:**
1. Globe scales + fades → `scale: 0.7, opacity: 0.15`
2. White glow sweeps up from bottom
3. Report rises: `translateY(100vh) → 0` at `600ms ease-out-expo`
4. Globe continues faintly as parallax background

### Sticky Report Mini-Nav
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [← Back to Globe]  │  Report: Yellowfin Tuna · Veraval · Sep 8, 2026       │
│  Jump to: [Summary] [Parameters] [Species] [Glossary] [Papers] [References] │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 6.1 Report Header & Summary Card

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🐬 PROJECT ORCA — MARITIME ADVISORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Bulletin No: ORCA-ADV-2026-0908-NAV-001
  Issued:  September 08, 2026, 14:22 IST
  Sector:  Northwest Arabian Sea — Veraval Sector (Gujarat EEZ)
  Author:  ORCA-AI Matsya-Sutradhar (Multi-Agent LangGraph, Qwen2.5-7B)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌──────────────────────────────────────────────────────────────────┐
  │  GO / NO-GO VERDICT                                              │
  │  ──────────────────────────────────────────────────────────────  │
  │  🟢  SAFE TO VENTURE — All parameters within safe limits         │
  │                                                                  │
  │  Wave Height:    1.6 m   ✅  Below 2.5m threshold               │
  │  Wind Speed:    12 kts   ✅  Below 25 kt gale threshold          │
  │  IMBL Distance: 74.2 km  ✅  Well beyond 10km alert buffer       │
  │  Cyclone Active: NO       ✅  No active warnings in Indian Ocean  │
  └──────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────────┐
  │  MISSION SUMMARY                                                 │
  │  ──────────────────────────────────────────────────────────────  │
  │  Origin:   Veraval Harbor  (20.902°N, 70.368°E)                  │
  │  Target:   PFZ Cluster Alpha  (20.752°N, 70.188°E)               │
  │  Distance: 28.4 NM  |  Duration: ~2h 10m at 10 kts              │
  │  Fuel Saving: 18.4% via tailcurrent A* route (1.2 kt assist)    │
  └──────────────────────────────────────────────────────────────────┘
```

---

### 6.2 Telemetry & Oceanographic Parameter Cards

2×4 card grid (`gap: 16px`), each with icon, headline metric, and 48h sparkline:

```
  ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
  │ 🌡  SST             │ │ 🧪  Chlorophyll-a    │ │ 🌊  Wave Height     │ │ 💨  Wind Speed      │
  │  28.4°C             │ │  1.26 mg/m³          │ │  1.6m SWH           │ │  12 kts @ 220°      │
  │  Anomaly: +0.65°C   │ │  Anomaly: +18.4%     │ │  Period: 8.2s       │ │  Gale: 25kts ✅     │
  │  Trend: ↗ Rising    │ │  Trend: ↗ Rising     │ │  Swell: 1.2m        │ │  Beaufort: F5       │
  │  [▁▂▄▃▅▆▅▆▇]       │ │  [▁▂▃▅▆▇▆▅▇]        │ │  [▂▄▃▄▅▃▄▃▃]       │ │  [▂▃▄▄▃▃▄▅▃]      │
  └─────────────────────┘ └─────────────────────┘ └─────────────────────┘ └─────────────────────┘

  ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
  │ 〜  Ocean Current   │ │ 🐟  Tidal Prediction │ │ 📍  Bathymetry      │ │ ⚓  AIS Traffic     │
  │  1.2 kts @ 142°     │ │  HIGH: 3.42m @04:18  │ │  Depth: -42.5m      │ │  24 vessels nearby  │
  │  uo: +0.32 m/s      │ │  LOW:  0.82m @10:45  │ │  Zone: Shelf Break  │ │  Closest CPA: 1.4NM │
  │  vo: +0.18 m/s      │ │  Range: 2.60m        │ │  Substrate: Sandy   │ │  TCPA: 16.8 min     │
  │  [flow arrow]       │ │  [tide curve 24h]    │ │  [depth heatmap]    │ │  Rule 15: CAUTION   │
  └─────────────────────┘ └─────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

---

### 6.3 Species / Object Deep Dive Section

Context-adaptive: species info for fishermen, vessel info for defense, parameter deep-dive for researchers.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🐟  TARGET SPECIES PROFILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌──────────────────────────────────────────────────────────────┐
  │  [AI-generated stylized illustration of Yellowfin Tuna]     │
  │  [Swimming in warm bioluminescent blue water — art style]   │
  └──────────────────────────────────────────────────────────────┘

  Yellowfin Tuna — Thunnus albacares
  Local: કૂવા (Kuva-gu) · Choodai Kola (ml) · Thingala (ta)

  Habitat Suitability Index (HSI): ██████████░  0.93 / 1.00  (HIGH)

  Preferred Conditions:
    🌡  SST Window:    26°C – 30°C       (Current: 28.4°C ✅)
    🧪  Chl-a Range:   0.8 – 2.0 mg/m³  (Current: 1.26   ✅)
    📍  Depth Range:   20 – 300m         (Current: 42.5m  ✅)
    🌊  Wave Tolerance: up to 3.0m SWH  (Current: 1.6m   ✅)

  Solunar Feeding Windows (Sep 8, 2026):
    ● Primary:    🌅 04:30 – 07:30 IST  (Major — pre-dawn pelagic feed)
    ● Secondary:  ☀️  16:45 – 18:15 IST  (Minor — dusk convergence)

  Regulatory Constraints:
    📏 Min Legal Size:  35 cm  (CMFRI Gazette 2023)
    🪝 Permitted Gear:  Longline, Troll, Pole-and-Line
    🚫 Prohibited:      Bottom Trawl in this zone
    🔖 IUCN Status:     Near Threatened (NT)

  Landing Market Price — Veraval Harbor (Today):
    Grade A Export:   ₹ 265 / kg   (High: ₹290  Low: ₹240)
    Domestic Prime:   ₹ 210 / kg
    Price Trend:     📈 +6.4% vs yesterday
```

---

### 6.4 Glossary Inline Tooltip & Reference Block

Scientific terms in the report body have a `dotted teal underline`. On hover/tap:

```
Sentence: "Active Langmuir convergence zone with elevated chlorophyll-a concentration."
                   ──────────────────────            ─────────────────────────────────
                   (hover → tooltip)                 (hover → tooltip)

Tooltip for "Langmuir convergence zone":
┌────────────────────────────────────────────────────────────────┐
│  📖  Langmuir Convergence Zone                                 │
│  Wind-driven spiral circulation cells that concentrate         │
│  buoyant material (nutrients, organisms) into surface streaks. │
│  First described by Irving Langmuir (1938).                    │
│  → View Glossary entry  |  → Wikipedia                         │
└────────────────────────────────────────────────────────────────┘
```

**Full Glossary Block (`#glossary` anchor):**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖  GLOSSARY — TERMS USED IN THIS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Rendered as accordion (click to expand each term):

  [▶] Chlorophyll-a (Chl-a)
      Primary photosynthetic pigment in phytoplankton (mg/m³).
      High values indicate productive waters attracting fish.
      Source: Oceansat-3 OCM-3 / Sentinel-3 OLCI.

  [▶] Potential Fishing Zone (PFZ)
      INCOIS-identified zones of probable fish aggregation
      based on SST thermal fronts and ocean color analysis.

  [▶] IMBL (International Maritime Boundary Line)
      Agreed boundary between India and neighbouring nations.
      Unauthorized crossing constitutes an international offense.

  [▶] COLREGs Rule 15 — Crossing Situation
      IMO regulation: vessel with other on starboard side
      shall give way and avoid crossing ahead.

  [▶] Solunar Theory
      Theory by J.A. Knight (1936) predicting peak fish feeding
      based on relative sun and moon positions.

  [🔍 Search all 150 glossary terms...]
```

---

### 6.5 Research Papers & Scientific Articles Panel

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚  RELEVANT RESEARCH PAPERS & SCIENTIFIC ARTICLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌──────────────────────────────────────────────────────────────────┐
  │ 🟩 Peer-Reviewed                              Relevance: 94%    │
  │                                                                  │
  │  Habitat suitability of Thunnus albacares in the Indian Ocean    │
  │  in relation to SST fronts and chlorophyll-a dynamics            │
  │                                                                  │
  │  Pillai, N.G.K. et al. (CMFRI, Kochi)                           │
  │  Journal of Marine Biology, Vol. 142, 2024                       │
  │  DOI: 10.1007/s00227-024-04350-z                                │
  │                                                                  │
  │  "Yellowfin tuna aggregation shows strong correlation with       │
  │   SST thermal fronts in the 27–29°C range during the            │
  │   SW monsoon retreat phase in the Arabian Sea..."                │
  │                                                                  │
  │  [📄 Full Abstract]  [🔗 Publisher]  [📋 Cite APA]  [+ Add]     │
  └──────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────────┐
  │ 🟦 Technical Report                           Relevance: 87%    │
  │                                                                  │
  │  INCOIS Potential Fishing Zone Advisory: Operational             │
  │  Guidelines and Algorithm Description (2023 Edition)             │
  │                                                                  │
  │  INCOIS Technical Division · Hyderabad · 2023                   │
  │                                                                  │
  │  "PFZ algorithms combine Oceansat-3 SST and Chlorophyll          │
  │   with SCATSAT-1 wind vectors — 82% verification accuracy..."    │
  │                                                                  │
  │  [📄 Abstract]  [🔗 INCOIS Portal]  [📋 Cite APA]  [+ Add]     │
  └──────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────────┐
  │ 🟨 News Article                               Relevance: 76%    │
  │                                                                  │
  │  Gujarat Fisheries: Tuna Landings at Veraval Hit 10-Year High    │
  │  The Hindu Business Line · August 2026                           │
  │                                                                  │
  │  [🔗 Read Article]  [+ Add to Report]                            │
  └──────────────────────────────────────────────────────────────────┘

  [Load 8 more related papers →]
```

---

### 6.6 External Reference Links & Data Registry Footer

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗  EXTERNAL REFERENCES & OFFICIAL DATA REGISTRIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SATELLITE & EARTH OBSERVATION
  [🌐] ISRO MOSDAC — mosdac.gov.in · SST, Chl-a, Wind (Oceansat-3, INSAT-3D)
  [🌐] ISRO Bhuvan — bhuvan.nrsc.gov.in · National GIS & Coastal Bathymetry
  [🌐] INCOIS ERDDAP — erddap.incois.gov.in · PFZ, SWH Forecasts, Currents
  [🌐] NASA Worldview / GIBS — worldview.earthdata.nasa.gov · GHRSST L4 MUR SST
  [🌐] Copernicus CMEMS — marine.copernicus.eu · Ocean State Reanalysis

FISHERIES & BIODIVERSITY
  [🌐] ICAR-CMFRI — cmfri.org.in · Species data, Mesh regulations, Catch stats
  [🌐] IndOBIS — indobis.in · Marine species distribution & occurrence records
  [🌐] Fisheries Survey of India — fsi.gov.in · Annual marine fisheries surveys

MARITIME LAW & REGULATIONS
  [🌐] Dept of Fisheries — dof.gov.in · Gazette notifications, Monsoon ban orders
  [🌐] Maritime Zones of India Act 1981 — indiacode.nic.in · Full legal text
  [🌐] Indian Coast Guard — indiancoastguard.gov.in · VHF Ch 16, MRCC contacts

TECHNICAL TOOLS
  [🌐] AISStream.io — aisstream.io · Real-time AIS transponder WebSocket API
  [🌐] Open-Meteo Marine API — marine-api.open-meteo.com · Free ocean weather
  [🌐] GEBCO 2024 — gebco.net · Global seafloor bathymetry

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated by Project ORCA (SIH26176) · ISRO · INCOIS · AISStream
Data for advisory purposes. Always verify with Indian Coast Guard.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [⬆ Back to Globe]  [📄 Download Full PDF]  [📋 Copy Markdown]  [📧 Share]
```

---

## 7. Jump Navigation & Section Anchors

Vertical pill nav fixed to right edge of viewport during Report Scroll View. The AI drawer pull-tab temporarily hides.

```
Right edge of viewport:
  ┌───┐
  │ ▪ │  → on hover: [──── Summary ────]
  │ ▪ │  → on hover: [─── Parameters ──]
  │ ● │  ← ACTIVE:   [───── Species ────]  (teal, 32px wide pill)
  │ ▪ │  → on hover: [──── Glossary ───]
  │ ▪ │  → on hover: [───── Papers ────]
  │ ▪ │  → on hover: [── References ───]
  └───┘
```

```css
.section-nav-dot {
  width: 8px; height: 8px;
  border-radius: 999px;
  background: var(--color-surface);
  transition: all 200ms ease;
}
.section-nav-dot:hover,
.section-nav-dot.active {
  width: 80px;
  background: var(--color-biolum-500);
  box-shadow: 0 0 8px var(--color-biolum-glow);
}
```

Clicking any dot: `element.scrollIntoView({ behavior: 'smooth' })`

---

## 8. Component Specifications & Micro-Animations

### Glass Panel (Reusable Base)
```css
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-panel);
}
```

### Data Value Tick Animation
```tsx
// framer-motion: number changes animate vertically
<AnimatePresence mode="wait">
  <motion.span
    key={value}
    initial={{ y: -8, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 8, opacity: 0 }}
    transition={{ duration: 0.15 }}
  >
    {value}
  </motion.span>
</AnimatePresence>
```

### PFZ Pulse Ring (Three.js)
```js
const ringGeo = new THREE.RingGeometry(0.8, 1.0, 32);
const ringMat = new THREE.MeshBasicMaterial({
  color: 0xFFD166, transparent: true, side: THREE.DoubleSide
});
// In render loop:
ring.scale.setScalar(1.0 + 0.3 * Math.sin(Date.now() * 0.002));
ring.material.opacity = 0.8 - 0.3 * Math.sin(Date.now() * 0.002);
```

### AI Typing Cursor
```css
.streaming-cursor::after {
  content: '▋';
  animation: blink 0.8s infinite;
  color: var(--color-biolum-400);
}
@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
```

### Alert Badge States
```tsx
const alertColors = {
  SAFE:     { bg: 'rgba(6,214,160,0.15)',  border: '#06D6A0' },
  CAUTION:  { bg: 'rgba(255,183,3,0.15)',  border: '#FFB703' },
  CRITICAL: { bg: 'rgba(239,35,60,0.15)',  border: '#EF233C' },
};
```

### Drawer Slide-In
```css
.ai-drawer {
  transform: translateX(380px);
  transition: transform 300ms var(--ease-out-expo);
}
.ai-drawer.open {
  transform: translateX(0);
}
```

### Left Dock Expand
```css
.layer-dock {
  width: 28px;
  transition: width 300ms var(--ease-out-expo);
  overflow: hidden;
}
.layer-dock:hover, .layer-dock.expanded {
  width: 200px;
}
```

---

## 9. Responsive Layout Breakpoints

| Breakpoint | Width | Layout Description |
|---|---|---|
| **xs Mobile** | < 480px | Full-screen globe · Bottom-sheet AI chat · Bottom tab bar (4 icons) · Left dock hidden · Report full-width single column |
| **sm Tablet P** | 480–768px | Globe full-width · AI drawer 75vw · Left dock icon-only 48px · Search bar above globe |
| **md Tablet L** | 768–1024px | Globe fills rest · Left dock 48px collapsed · AI drawer 340px · Right jump nav visible |
| **lg Desktop** | 1024–1440px | Full layout as specified — all panels active |
| **xl Ultrawide** | > 1440px | Left dock 200px always open · AI drawer 420px · Globe canvas fills remaining center |

---

## 10. Developer Implementation Notes

### Dual Canvas Strategy
ORCA uses **two parallel rendering contexts** to avoid complexity of shared WebGL state:

1. **Three.js Canvas** (`canvas#globe`) — 3D rotating globe, surface textures, particles, mesh cells.
2. **Deck.GL + MapLibre Canvas** (`canvas#map`) — Flat 2D mode activated via `[2D]` toggle.

On toggle: Three.js canvas `opacity: 1 → 0` (600ms), MapLibre canvas `opacity: 0 → 1` (600ms). Deck.GL layers mount in this phase.

### Route Architecture
```
/                   → Landing page (Three.js globe hero + CTA)
/signup             → 3-step wizard (Persona → Profile → Account)
/app                → Main application:
    ?               → Globe view (default)
    ?report=true    → Report scroll view
    ?panel=data     → EO Telemetry Hub panel open
    ?panel=vault    → Regulatory Vault panel
    ?panel=agents   → Agent Synapse Graph modal
/defense            → Dedicated defense command center
```

### Zustand State Extensions (for new UI)
```typescript
// lib/store.ts additions
interface OrcaState {
  // Report state
  reportData:       ReportPayload | null;
  reportIsVisible:  boolean;

  // AI Chat state
  chatHistory:      ChatMessage[];
  chatIsOpen:       boolean;
  chatIsStreaming:  boolean;
  pendingSuggestion: string | null;

  // Globe state
  globeMode:        '3D' | '2D';
  meshVisible:      boolean;
  hoveredCellId:    string | null;
  selectedCellId:   string | null;

  // Actions
  openReport:       (data: ReportPayload) => void;
  closeReport:      () => void;
  setPendingSuggestion: (msg: string | null) => void;
  toggleGlobeMode:  () => void;
}
```

### Key Library Versions
| Library | Version | Purpose |
|---|---|---|
| `three` | `^0.166` | 3D globe, particles, mesh grid |
| `@deck.gl/react` | `^9.0` | 2D map data visualization |
| `react-map-gl` | `^7.1` | MapLibre React wrapper |
| `framer-motion` | `^11.0` | Transitions & micro-animations |
| `zustand` | `^4.5` | Global state |
| `recharts` | `^2.12` | Sparklines & telemetry charts |
| `react-markdown` | `^9.0` | Render AI streaming markdown |
| `@radix-ui/react-*` | `^1.1` | Accessible modal / tooltip / dropdown |

---

*Document maintained by Project ORCA Design & Frontend Engineering Team — September 2026.*
