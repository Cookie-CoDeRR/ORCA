# 🐬 Project ORCA — Frontend Tactical Command Portal

> **Next.js 16 (Turbopack) + Deck.GL 2.5D Bathymetric Marine Radar**
> Comprehensive 4-view command portal for Smart India Hackathon (SIH-26176).

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables (`.env.local`)
Create or verify `.env.local` in the `orca-frontend` folder:
```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_CARTO_API_KEY=cb1_2dhp_1_9403bbcac732699b29121f7e
NEXT_PUBLIC_AIS_API_KEY=
```

### 3. Run Development Server
```bash
npm run dev
```

Open **[http://localhost:3000/dashboard](http://localhost:3000/dashboard)** in your browser.

---

## 🏛️ 4 Core Portal Views

1. **🧭 Tactical Command (`/dashboard`)**: 2.5D Deck.GL Tactical Map, Target HUD, Thought Stream, Synthesized Action Card, Voice Mic, and Contextual Bottom Telemetry Strip.
2. **🕸️ Agent Swarm Mesh (`/dashboard` $\rightarrow$ Agent Swarm Mesh)**: 3Blue1Brown-inspired Synaptic Neural Flow Graph with dense cubic Bézier filaments, deterministic triggering, and node inspection drawer.
3. **🛰️ Earth Observation Data Hub (`/dashboard` $\rightarrow$ Data Hub)**: 7-layer dataset provenance catalog and 72-hour temporal timeline scrubber.
4. **⚖️ Regulatory Policy Vault (`/dashboard` $\rightarrow$ Regulatory Vault)**: 61-day Monsoon Trawl Ban matrix, pgvector semantic search, and Coast Guard MRCC emergency directory.

---

For full multi-agent architecture and backend setup, see the **[Master README.md](../README.md)** in the repository root.
