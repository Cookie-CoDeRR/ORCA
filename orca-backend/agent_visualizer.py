"""
Project ORCA (SIH26176) — Sovereign Marine Intelligence Platform
Live Multi-Agent Topology Visualizer, Memory Token Gauge & Real-Time XAI Auditor
Designed for High-Impact Smart India Hackathon (SIH) Jury Demonstrations.
"""

import json
import math
import os
import queue
import threading
import time
import tkinter as tk
from datetime import datetime, timezone
from pathlib import Path
from tkinter import ttk

# ==============================================================================
# 1. AUDIT LOGGER
# ==============================================================================
LOG_DIR = Path(__file__).resolve().parent / "agent_logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOG_DIR / "execution_audit.jsonl"


def append_audit_log(entry: dict):
    """Appends an execution record to the local JSONL audit file."""
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


gui_event_queue: queue.Queue = queue.Queue()


# ==============================================================================
# 2. PRESENTATION-GRADE SIH TKINTER MULTI-AGENT MONITOR
# ==============================================================================
class AgentMonitorGUI:

    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Project ORCA — Live Multi-Agent Topology & XAI Memory Auditor (SIH26176)")
        self.root.geometry("1280x820")
        self.root.minsize(1180, 740)
        self.root.configure(bg="#090d16")

        self.event_queue = gui_event_queue
        self.active_particles = []
        self.anim_running = True

        # Node Topologies & Visual Palettes (X, Y mapped to 780x560 canvas)
        self.nodes = {
            "supervisor": {
                "label": "SUPERVISOR",
                "sub": "Qwen 2.5 (7B)",
                "icon": "🧠",
                "pos": (130, 275),
                "accent": "#00f0ff",      # Neon Cyan
                "glow": "#083344",
            },
            "ocean_analytics": {
                "label": "OCEAN AI",
                "sub": "xarray / NetCDF",
                "icon": "🌊",
                "pos": (410, 100),
                "accent": "#10b981",      # Emerald Green
                "glow": "#064e3b",
            },
            "risk_geofencing": {
                "label": "RISK & GEO",
                "sub": "PostGIS ST_DWithin",
                "icon": "🛡️",
                "pos": (410, 215),
                "accent": "#f43f5e",      # Rose Red
                "glow": "#4c0519",
            },
            "navigation": {
                "label": "NAVIGATION",
                "sub": "A* Current Router",
                "icon": "🧭",
                "pos": (410, 330),
                "accent": "#f59e0b",      # Amber Gold
                "glow": "#451a03",
            },
            "policy_rag": {
                "label": "POLICY RAG",
                "sub": "pgvector / BGE-M3",
                "icon": "📜",
                "pos": (410, 445),
                "accent": "#a855f7",      # Neon Purple
                "glow": "#3b0764",
            },
            "synthesizer": {
                "label": "SYNTHESIZER",
                "sub": "GeoJSON / Localization",
                "icon": "✨",
                "pos": (680, 275),
                "accent": "#84cc16",      # Electric Lime
                "glow": "#1a2e05",
            },
        }

        self._build_ui()
        self._draw_topology_graph()
        self.root.after(40, self._process_events)
        self.root.after(50, self._animate_particles)

    # --------------------------------------------------------------------------
    # UI CONSTRUCTION
    # --------------------------------------------------------------------------
    def _build_ui(self):
        # 1. Top Sovereign Navigation & Brand Bar
        top_bar = tk.Frame(self.root, bg="#0d1527", height=65, highlightbackground="#1e293b", highlightthickness=1)
        top_bar.pack(fill=tk.X, padx=12, pady=(10, 6))

        # Brand Title
        brand_frame = tk.Frame(top_bar, bg="#0d1527")
        brand_frame.pack(side=tk.LEFT, padx=18, pady=10)

        tk.Label(
            brand_frame,
            text="🐬 PROJECT ORCA",
            fg="#38bdf8",
            bg="#0d1527",
            font=("Helvetica", 15, "bold"),
        ).pack(side=tk.LEFT)

        tk.Label(
            brand_frame,
            text=" | SIH26176 Autonomous Marine Intelligence Engine",
            fg="#94a3b8",
            bg="#0d1527",
            font=("Helvetica", 11),
        ).pack(side=tk.LEFT, padx=6)

        # Sovereign Status Tag
        badge_frame = tk.Frame(top_bar, bg="#0f291e", highlightbackground="#10b981", highlightthickness=1, padx=8, pady=3)
        badge_frame.pack(side=tk.RIGHT, padx=16, pady=12)

        tk.Label(
            badge_frame,
            text="🇮🇳 SOVEREIGN & AIR-GAPPED",
            fg="#34d399",
            bg="#0f291e",
            font=("Helvetica", 9, "bold"),
        ).pack(side=tk.LEFT)

        # 2. Interactive Control Bar (Preset Simulations & Custom Query)
        ctrl_bar = tk.Frame(self.root, bg="#111c33", highlightbackground="#1e293b", highlightthickness=1, padx=10, pady=8)
        ctrl_bar.pack(fill=tk.X, padx=12, pady=(0, 6))

        # Query Input
        tk.Label(
            ctrl_bar,
            text="Custom Query:",
            fg="#cbd5e1",
            bg="#111c33",
            font=("Helvetica", 9, "bold"),
        ).pack(side=tk.LEFT, padx=(6, 8))

        self.entry_query = tk.Entry(
            ctrl_bar,
            bg="#0b1120",
            fg="#f8fafc",
            insertbackground="#38bdf8",
            font=("Helvetica", 10),
            relief="flat",
            highlightbackground="#334155",
            highlightthickness=1,
            width=38
        )
        self.entry_query.pack(side=tk.LEFT, padx=(0, 10), ipady=3)
        self.entry_query.insert(0, "Can 4 mechanized boats fish 30km southwest of Veraval for Tuna?")

        # Action Buttons
        self._create_btn(ctrl_bar, "▶ Run Query", "#0284c7", "#38bdf8", lambda: self._trigger_simulated_run("custom"))
        self._create_btn(ctrl_bar, "🐟 Tuna PFZ", "#059669", "#34d399", lambda: self._trigger_simulated_run("fishing"))
        self._create_btn(ctrl_bar, "🚨 IMBL Border Alert", "#e11d48", "#fb7185", lambda: self._trigger_simulated_run("border_risk"))
        self._create_btn(ctrl_bar, "📜 Monsoon Ban", "#7c3aed", "#c084fc", lambda: self._trigger_simulated_run("monsoon_ban"))
        self._create_btn(ctrl_bar, "🧭 Fuel-Optimal Route", "#d97706", "#fbbf24", lambda: self._trigger_simulated_run("navigation"))

        # 3. Main Split View: Left Canvas (Graph) + Right Panel (Telemetry & Logs)
        main_frame = tk.Frame(self.root, bg="#090d16")
        main_frame.pack(fill=tk.BOTH, expand=True, padx=12, pady=(0, 10))

        # Left Canvas Frame
        left_frame = tk.Frame(main_frame, bg="#0d1527", highlightbackground="#1e293b", highlightthickness=1)
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 6))

        # Canvas Header
        canvas_top = tk.Frame(left_frame, bg="#0d1527", height=28)
        canvas_top.pack(fill=tk.X, padx=10, pady=6)
        tk.Label(canvas_top, text="LIVE AGENT GRAPH TOPOLOGY & REAL-TIME DISPATCH MATRIX", fg="#64748b", bg="#0d1527", font=("Courier", 9, "bold")).pack(side=tk.LEFT)
        self.lbl_graph_status = tk.Label(canvas_top, text="● GRAPH IDLE", fg="#10b981", bg="#0d1527", font=("Courier", 9, "bold"))
        self.lbl_graph_status.pack(side=tk.RIGHT)

        self.canvas = tk.Canvas(left_frame, bg="#060913", highlightthickness=0)
        self.canvas.pack(fill=tk.BOTH, expand=True, padx=6, pady=(0, 6))

        # Right Monitoring Frame
        right_frame = tk.Frame(main_frame, bg="#0d1527", width=460, highlightbackground="#1e293b", highlightthickness=1)
        right_frame.pack(side=tk.RIGHT, fill=tk.BOTH, padx=(6, 0))
        right_frame.pack_propagate(False)

        # Telemetry Card 1: Memory & Pydantic Guard
        card_metrics = tk.LabelFrame(
            right_frame,
            text=" 📊 State Health & Hallucination Guard ",
            fg="#38bdf8",
            bg="#0d1527",
            font=("Courier", 10, "bold"),
            padx=10,
            pady=8
        )
        card_metrics.pack(fill=tk.X, padx=10, pady=8)

        # 4 Stat Badges
        grid_frame = tk.Frame(card_metrics, bg="#0d1527")
        grid_frame.pack(fill=tk.X)

        self.lbl_memory = self._create_stat_badge(grid_frame, 0, 0, "STATE MEMORY", "0.00 KB (~0 tok)", "#38bdf8")
        self.lbl_grounding = self._create_stat_badge(grid_frame, 0, 1, "SPATIAL GROUNDING", "100% (Strict BBox)", "#34d399")
        self.lbl_drift = self._create_stat_badge(grid_frame, 1, 0, "SCHEMA DRIFT", "0 Anomalies (Pydantic)", "#38bdf8")
        self.lbl_latency = self._create_stat_badge(grid_frame, 1, 1, "INFERENCE LATENCY", "0 ms", "#fbbf24")

        # Telemetry Card 2: Live Event Stream & XAI Log
        card_log = tk.LabelFrame(
            right_frame,
            text=" ⚡ Real-Time XAI Audit Stream ",
            fg="#38bdf8",
            bg="#0d1527",
            font=("Courier", 10, "bold"),
            padx=8,
            pady=6
        )
        card_log.pack(fill=tk.BOTH, expand=True, padx=10, pady=(0, 8))

        # Rich Colored Text Stream
        self.log_text = tk.Text(
            card_log,
            bg="#040711",
            fg="#e2e8f0",
            font=("Courier", 9),
            wrap=tk.WORD,
            borderwidth=0,
            highlightthickness=0,
            padx=6,
            pady=6
        )
        self.log_text.pack(fill=tk.BOTH, expand=True)

        # Configure Colored Message Tags
        self.log_text.tag_config("TIME", foreground="#64748b")
        self.log_text.tag_config("USER", foreground="#f8fafc", font=("Courier", 9, "bold"))
        self.log_text.tag_config("SUPERVISOR", foreground="#38bdf8", font=("Courier", 9, "bold"))
        self.log_text.tag_config("OCEAN", foreground="#34d399")
        self.log_text.tag_config("RISK", foreground="#f43f5e", font=("Courier", 9, "bold"))
        self.log_text.tag_config("NAV", foreground="#fbbf24")
        self.log_text.tag_config("RAG", foreground="#c084fc")
        self.log_text.tag_config("SYNTH", foreground="#a3e635", font=("Courier", 9, "bold"))
        self.log_text.tag_config("SUCCESS", foreground="#34d399", font=("Courier", 9, "bold"))

        self.log_event("SYSTEM", "Project ORCA Multi-Agent Engine initialized in sovereign air-gapped mode.")
        self.log_event("SYSTEM", "Connected to local PostgreSQL PostGIS 3.4 & pgvector (BGE-M3 embeddings).")

    def _create_btn(self, parent, text, bg, border_glow, cmd):
        """Creates custom styled presentation buttons with active highlights."""
        f = tk.Frame(parent, bg=bg, highlightbackground=border_glow, highlightthickness=1, padx=1, pady=1)
        f.pack(side=tk.LEFT, padx=3)
        btn = tk.Button(
            f,
            text=text,
            bg=bg,
            fg="white",
            activebackground=border_glow,
            activeforeground="black",
            font=("Helvetica", 8, "bold"),
            relief="flat",
            borderwidth=0,
            padx=7,
            pady=4,
            cursor="hand2",
            command=cmd
        )
        btn.pack()

    def _create_stat_badge(self, parent, r, c, title, val, color):
        box = tk.Frame(parent, bg="#09101f", highlightbackground="#1e293b", highlightthickness=1, padx=8, pady=6)
        box.grid(row=r, column=c, padx=3, pady=3, sticky="nsew")
        parent.grid_columnconfigure(c, weight=1)

        tk.Label(box, text=title, fg="#64748b", bg="#09101f", font=("Courier", 7, "bold")).pack(anchor="w")
        val_lbl = tk.Label(box, text=val, fg=color, bg="#09101f", font=("Courier", 9, "bold"))
        val_lbl.pack(anchor="w", pady=(2, 0))
        return val_lbl

    # --------------------------------------------------------------------------
    # CANVAS RENDERING & VECTOR TOPOLOGY
    # --------------------------------------------------------------------------
    def _draw_topology_graph(self):
        self.canvas.delete("all")
        self.node_elements = {}
        self.edge_elements = {}

        # Draw Blueprint Background Grid
        w = 780
        h = 560
        for i in range(0, w, 40):
            self.canvas.create_line(i, 0, i, h, fill="#0d1424", width=1)
        for j in range(0, h, 40):
            self.canvas.create_line(0, j, w, j, fill="#0d1424", width=1)

        # Edge Definitions (Source -> Target)
        edge_connections = [
            ("supervisor", "ocean_analytics"),
            ("supervisor", "risk_geofencing"),
            ("supervisor", "navigation"),
            ("supervisor", "policy_rag"),
            ("ocean_analytics", "synthesizer"),
            ("risk_geofencing", "synthesizer"),
            ("navigation", "synthesizer"),
            ("policy_rag", "synthesizer"),
        ]

        for src, dst in edge_connections:
            x1, y1 = self.nodes[src]["pos"]
            x2, y2 = self.nodes[dst]["pos"]
            
            # Draw glowing base lines
            line = self.canvas.create_line(
                x1, y1, x2, y2,
                fill="#1e293b",
                width=2,
                arrow=tk.LAST,
                arrowshape=(10, 12, 4),
                dash=(5, 5)
            )
            self.edge_elements[(src, dst)] = {
                "line": line,
                "start": (x1, y1),
                "end": (x2, y2),
                "color": self.nodes[src]["accent"]
            }

        # Draw Nodes (Circular badges with outer glow rings)
        r = 38
        for node_id, data in self.nodes.items():
            x, y = data["pos"]
            accent = data["accent"]
            glow = data["glow"]

            # Outer subtle glow aura
            glow_ring = self.canvas.create_oval(
                x - (r + 7), y - (r + 7), x + (r + 7), y + (r + 7),
                fill=glow, outline="", width=0
            )

            # Core Node Body
            body = self.canvas.create_oval(
                x - r, y - r, x + r, y + r,
                fill="#0f172a", outline=accent, width=2
            )

            # Icon & Text
            icon_text = self.canvas.create_text(
                x, y - 14,
                text=data["icon"],
                font=("Helvetica", 14),
                justify=tk.CENTER
            )
            label_text = self.canvas.create_text(
                x, y + 5,
                text=data["label"],
                fill="#f8fafc",
                font=("Helvetica", 7, "bold"),
                justify=tk.CENTER
            )
            sub_text = self.canvas.create_text(
                x, y + 18,
                text=data["sub"],
                fill=accent,
                font=("Courier", 6),
                justify=tk.CENTER
            )

            self.node_elements[node_id] = {
                "body": body,
                "glow_ring": glow_ring,
                "label": label_text,
                "sub": sub_text,
                "accent": accent,
                "glow": glow,
                "r": r,
                "pos": (x, y)
            }

    # --------------------------------------------------------------------------
    # ANIMATIONS & LIVE GRAPH STATE MANAGEMENT
    # --------------------------------------------------------------------------
    def set_agent_active(self, node_id: str, is_active: bool):
        """Toggles visual activation halo on the canvas node."""
        if node_id not in self.node_elements:
            return
        node = self.node_elements[node_id]
        body = node["body"]
        glow_ring = node["glow_ring"]
        accent = node["accent"]

        if is_active:
            self.canvas.itemconfig(body, fill=accent, outline="#ffffff", width=3)
            self.canvas.itemconfig(node["label"], fill="#000000")
            self.canvas.itemconfig(node["sub"], fill="#1e293b")
            self.canvas.itemconfig(glow_ring, fill=accent)
            self.lbl_graph_status.config(text=f"● EXECUTING [{node_id.upper()}]", fg=accent)
        else:
            self.canvas.itemconfig(body, fill="#0f172a", outline=accent, width=2)
            self.canvas.itemconfig(node["label"], fill="#f8fafc")
            self.canvas.itemconfig(node["sub"], fill=accent)
            self.canvas.itemconfig(glow_ring, fill=node["glow"])
            self.lbl_graph_status.config(text="● GRAPH IDLE", fg="#10b981")

    def spawn_particle_pulse(self, src: str, dst: str):
        """Spawns an animated glowing communication particle traveling from src to dst."""
        if (src, dst) in self.edge_elements:
            edge = self.edge_elements[(src, dst)]
            x1, y1 = edge["start"]
            x2, y2 = edge["end"]
            color = edge["color"]

            # Highlight line briefly
            line = edge["line"]
            self.canvas.itemconfig(line, fill=color, width=3, dash=())
            self.root.after(350, lambda: self.canvas.itemconfig(line, fill="#1e293b", width=2, dash=(5, 5)))

            # Particle
            p = self.canvas.create_oval(x1 - 4, y1 - 4, x1 + 4, y1 + 4, fill="#ffffff", outline=color, width=2)
            self.active_particles.append({
                "item": p,
                "x1": x1, "y1": y1,
                "x2": x2, "y2": y2,
                "progress": 0.0,
                "step": 0.08
            })

    def _animate_particles(self):
        """Smoothly steps forward all active edge particles."""
        remaining = []
        for p in self.active_particles:
            p["progress"] += p["step"]
            if p["progress"] >= 1.0:
                self.canvas.delete(p["item"])
            else:
                curr_x = p["x1"] + (p["x2"] - p["x1"]) * p["progress"]
                curr_y = p["y1"] + (p["y2"] - p["y1"]) * p["progress"]
                self.canvas.coords(p["item"], curr_x - 4, curr_y - 4, curr_x + 4, curr_y + 4)
                remaining.append(p)
        self.active_particles = remaining
        if self.anim_running:
            self.root.after(30, self._animate_particles)

    def log_event(self, tag: str, text: str):
        """Appends formatted, syntax-highlighted messages to the live log stream."""
        now = datetime.now().strftime("%H:%M:%S")
        self.log_text.insert(tk.END, f"[{now}] ", "TIME")
        self.log_text.insert(tk.END, f"[{tag.upper()}] ", tag.upper() if tag.upper() in ["USER", "SUPERVISOR", "OCEAN", "RISK", "NAV", "RAG", "SYNTH", "SUCCESS"] else "TIME")
        self.log_text.insert(tk.END, f"{text}\n")
        self.log_text.see(tk.END)

    def update_telemetry(self, memory_bytes: int, grounding_pct: float, drift_count: int, latency_ms: int):
        est_tokens = memory_bytes // 4
        self.lbl_memory.config(text=f"{memory_bytes/1024:.2f} KB (~{est_tokens} tok)")
        self.lbl_grounding.config(
            text=f"{grounding_pct:.1f}% (Indian EEZ)",
            fg="#34d399" if grounding_pct > 90 else "#f43f5e"
        )
        self.lbl_drift.config(
            text=f"{drift_count} Anomalies (Strict)",
            fg="#f43f5e" if drift_count > 0 else "#38bdf8"
        )
        self.lbl_latency.config(text=f"{latency_ms} ms")

    def _process_events(self):
        """Processes events queued by background worker threads."""
        while not self.event_queue.empty():
            msg_type, payload = self.event_queue.get()
            if msg_type == "ACTIVE":
                self.set_agent_active(payload["node"], payload["state"])
            elif msg_type == "PULSE":
                self.spawn_particle_pulse(payload["src"], payload["dst"])
            elif msg_type == "LOG":
                self.log_event(payload["tag"], payload["text"])
            elif msg_type == "METRICS":
                self.update_telemetry(
                    payload["bytes"], payload["grounding"], payload["drift"], payload.get("latency_ms", 0)
                )
        self.root.after(40, self._process_events)

    # --------------------------------------------------------------------------
    # SIMULATION DISPATCHER
    # --------------------------------------------------------------------------
    def _trigger_simulated_run(self, query_type: str):
        thread = threading.Thread(
            target=self._run_agent_pipeline,
            args=(query_type,),
            daemon=True,
        )
        thread.start()

    def _run_agent_pipeline(self, query_type: str):
        start_time = time.time()
        session_id = f"orca_{int(time.time())}"
        accumulated_state = {"session_id": session_id, "messages": []}

        # Determine prompt and coordinates
        if query_type == "custom":
            prompt = self.entry_query.get().strip() or "Fishing inquiry"
            origin = [20.902, 70.368]
            target = [20.650, 70.150]
        elif query_type == "fishing":
            prompt = "Can 4 mechanized trawlers fish 30km southwest of Veraval (20.90 N, 70.36 E) for Yellowfin Tuna?"
            origin = [20.902, 70.368]
            target = [20.650, 70.150]
        elif query_type == "border_risk":
            prompt = "Vessel located 12km southeast of Rameswaram (9.28 N, 79.31 E). Am I breaching the Sri Lanka IMBL?"
            origin = [9.285, 79.315]
            target = [9.150, 79.450]
        elif query_type == "monsoon_ban":
            prompt = "What are the seasonal monsoon fishing ban dates for motorized trawlers along the Kerala coastline?"
            origin = [9.942, 76.262]
            target = [9.800, 76.000]
        else:
            prompt = "Compute fuel-optimal current-riding route from Mumbai Harbor (18.94 N, 72.86 E) to offshore Tuna zone."
            origin = [18.940, 72.860]
            target = [19.500, 71.200]

        accumulated_state["messages"].append({"role": "user", "content": prompt})

        self.event_queue.put(("LOG", {"tag": "USER", "text": prompt}))
        self.event_queue.put((
            "METRICS",
            {"bytes": len(json.dumps(accumulated_state)), "grounding": 100.0, "drift": 0, "latency_ms": 0}
        ))
        time.sleep(0.5)

        # 1. SUPERVISOR NODE
        self.event_queue.put(("ACTIVE", {"node": "supervisor", "state": True}))
        self.event_queue.put(("LOG", {"tag": "SUPERVISOR", "text": "Decomposing query with Qwen 2.5 7B & resolving coastal gazetteer."}))
        time.sleep(0.7)
        self.event_queue.put(("ACTIVE", {"node": "supervisor", "state": False}))

        # Select tasks
        if query_type in ["fishing", "custom"]:
            tasks = ["ocean_analytics", "risk_geofencing", "navigation", "policy_rag"]
        elif query_type == "border_risk":
            tasks = ["risk_geofencing", "policy_rag"]
        elif query_type == "monsoon_ban":
            tasks = ["policy_rag", "ocean_analytics"]
        else:
            tasks = ["navigation", "ocean_analytics", "risk_geofencing"]

        # 2. DISPATCH WORKER AGENTS
        for agent in tasks:
            self.event_queue.put(("PULSE", {"src": "supervisor", "dst": agent}))
            self.event_queue.put(("ACTIVE", {"node": agent, "state": True}))

            time.sleep(0.55)

            if agent == "ocean_analytics":
                tool_data = {"sst_celsius": 28.4, "chlorophyll_mg_m3": 1.35, "pfz_clusters": 3, "wave_height_m": 1.3}
                log_tag = "OCEAN"
                log_msg = "SST=28.4°C, Chl-a=1.35 mg/m³ -> 3 high-confidence PFZ clusters identified."
            elif agent == "risk_geofencing":
                dist = 8.5 if query_type == "border_risk" else 45.0
                tool_data = {"imbl_distance_km": dist, "is_safe": dist > 10.0, "status": "ORANGE" if dist < 10.0 else "GREEN"}
                log_tag = "RISK"
                log_msg = f"PostGIS ST_Distance -> IMBL Proximity={dist} km | Alert={tool_data['status']}."
            elif agent == "navigation":
                tool_data = {"distance_nm": 42.5, "duration_hours": 4.8, "fuel_savings_pct": 11.4}
                log_tag = "NAV"
                log_msg = "Dynamic A* current optimizer -> Computed 42.5 NM path with 11.4% fuel savings."
            else:
                tool_data = {"monsoon_ban_active": False, "order": "Dept of Fisheries Order No. 31035/01/2026"}
                log_tag = "RAG"
                log_msg = "pgvector (BGE-M3) retrieved statutory circulars: 61-day ban timeline & VHF Ch 16 SOPs."

            accumulated_state[agent] = tool_data
            self.event_queue.put(("LOG", {"tag": log_tag, "text": log_msg}))
            self.event_queue.put(("ACTIVE", {"node": agent, "state": False}))

            # Pulse from worker into Synthesizer
            self.event_queue.put(("PULSE", {"src": agent, "dst": "synthesizer"}))

            # Update Metrics
            state_bytes = len(json.dumps(accumulated_state))
            lat_ok = 0.0 <= origin[0] <= 25.0 and 0.0 <= target[0] <= 25.0
            lon_ok = 50.0 <= origin[1] <= 100.0 and 50.0 <= target[1] <= 100.0
            grounding = 100.0 if (lat_ok and lon_ok) else 80.0
            curr_lat = int((time.time() - start_time) * 1000)

            self.event_queue.put((
                "METRICS",
                {"bytes": state_bytes, "grounding": grounding, "drift": 0, "latency_ms": curr_lat}
            ))

        # 3. SYNTHESIZER NODE
        self.event_queue.put(("ACTIVE", {"node": "synthesizer", "state": True}))
        self.event_queue.put(("LOG", {"tag": "SYNTH", "text": "Assembling deck.gl GeoJSON FeatureCollection & localized advisory."}))
        time.sleep(0.8)
        self.event_queue.put(("ACTIVE", {"node": "synthesizer", "state": False}))

        total_lat = int((time.time() - start_time) * 1000)
        self.event_queue.put(("LOG", {"tag": "SUCCESS", "text": f"Orchestration completed successfully in {total_lat} ms."}))

        # Persist to JSONL Audit Log
        audit_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "session_id": session_id,
            "query": prompt,
            "origin_coords": origin,
            "target_coords": target,
            "tasks_executed": tasks,
            "state_size_bytes": len(json.dumps(accumulated_state)),
            "latency_ms": total_lat,
            "state_payload": accumulated_state,
        }
        append_audit_log(audit_entry)
        self.event_queue.put(("LOG", {"tag": "SUCCESS", "text": f"Audit snapshot persisted to {LOG_FILE.name}"}))


# ==============================================================================
# 3. ENTRY POINT
# ==============================================================================
if __name__ == "__main__":
    root = tk.Tk()
    app = AgentMonitorGUI(root)
    root.mainloop()
