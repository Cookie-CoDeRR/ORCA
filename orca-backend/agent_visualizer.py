"""
Project ORCA (SIH26176) — Live Multi-Agent Topology Visualizer & Memory Auditor
Provides:
  1. Live Agent Topology Canvas with directed communication pulses
  2. Context Memory & Token Gauge (bytes, estimated tokens, state hops)
  3. Hallucination & Spatial Drift Guard (BBox grounding check [50-100 lon, 0-25 lat])
  4. Structured JSONL Audit Logger (persisted to ./agent_logs/execution_audit.jsonl)
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
# 1. STRUCTURED AUDIT LOGGER
# ==============================================================================
LOG_DIR = Path(__file__).resolve().parent / "agent_logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOG_DIR / "execution_audit.jsonl"


def append_audit_log(entry: dict):
    """Appends a structured audit record to the JSONL log file."""
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


# Global GUI Event Queue for thread-safe event dispatching from LangGraph
gui_event_queue: queue.Queue = queue.Queue()


def emit_gui_event(event_type: str, payload: dict):
    """Global helper for emitting events from inside LangGraph nodes."""
    gui_event_queue.put((event_type, payload))


# ==============================================================================
# 2. TKINTER MULTI-AGENT VISUALIZER
# ==============================================================================
class AgentMonitorGUI:

    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Project ORCA — Multi-Agent Live Topology & Memory Auditor (SIH26176)")
        self.root.geometry("1120x740")
        self.root.configure(bg="#0f172a")

        self.event_queue = gui_event_queue

        # Agent Node Definitions (Positions on Canvas & Display Colors)
        self.nodes = {
            "supervisor": {
                "label": "Supervisor\n(Qwen2.5 7B)",
                "pos": (200, 200),
                "color": "#38bdf8",
            },
            "ocean_analytics": {
                "label": "Ocean AI\n(xarray / NetCDF)",
                "pos": (540, 80),
                "color": "#34d399",
            },
            "risk_geofencing": {
                "label": "Risk & Geo\n(PostGIS)",
                "pos": (540, 160),
                "color": "#f87171",
            },
            "navigation": {
                "label": "Navigation\n(A* Currents)",
                "pos": (540, 240),
                "color": "#fbbf24",
            },
            "policy_rag": {
                "label": "Policy RAG\n(pgvector / bge-m3)",
                "pos": (540, 320),
                "color": "#c084fc",
            },
            "synthesizer": {
                "label": "Synthesizer\n(GeoJSON / XAI)",
                "pos": (880, 200),
                "color": "#a3e635",
            },
        }

        self._build_layout()
        self._draw_base_graph()
        self.root.after(50, self._process_events)

    def _build_layout(self):
        # Top Header Frame
        header = tk.Frame(self.root, bg="#1e293b", height=55)
        header.pack(fill=tk.X, padx=10, pady=6)

        title_frame = tk.Frame(header, bg="#1e293b")
        title_frame.pack(side=tk.LEFT, padx=15, pady=8)

        tk.Label(
            title_frame,
            text="🐬 PROJECT ORCA",
            fg="#38bdf8",
            bg="#1e293b",
            font=("Helvetica", 14, "bold"),
        ).pack(side=tk.LEFT)

        tk.Label(
            title_frame,
            text=" — Live Graph Inspector & Memory Auditor",
            fg="#f8fafc",
            bg="#1e293b",
            font=("Helvetica", 12),
        ).pack(side=tk.LEFT)

        # Control Simulation Buttons
        btn_frame = tk.Frame(header, bg="#1e293b")
        btn_frame.pack(side=tk.RIGHT, padx=10)

        tk.Button(
            btn_frame,
            text="▶ Simulate Tuna PFZ Query",
            bg="#0284c7",
            fg="white",
            font=("Helvetica", 9, "bold"),
            relief="flat",
            padx=8,
            pady=4,
            command=lambda: self._trigger_simulated_run("fishing"),
        ).pack(side=tk.LEFT, padx=4)

        tk.Button(
            btn_frame,
            text="⚠️ Simulate Border Risk Query",
            bg="#dc2626",
            fg="white",
            font=("Helvetica", 9, "bold"),
            relief="flat",
            padx=8,
            pady=4,
            command=lambda: self._trigger_simulated_run("border_risk"),
        ).pack(side=tk.LEFT, padx=4)

        tk.Button(
            btn_frame,
            text="📜 Simulate Monsoon Ban Query",
            bg="#9333ea",
            fg="white",
            font=("Helvetica", 9, "bold"),
            relief="flat",
            padx=8,
            pady=4,
            command=lambda: self._trigger_simulated_run("monsoon_ban"),
        ).pack(side=tk.LEFT, padx=4)

        # Main Paned Window
        main_pane = tk.PanedWindow(
            self.root, orient=tk.HORIZONTAL, bg="#0f172a"
        )
        main_pane.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)

        # Left: Graph Visualizer Canvas
        canvas_frame = tk.Frame(main_pane, bg="#1e293b")
        main_pane.add(canvas_frame, width=740)

        self.canvas = tk.Canvas(
            canvas_frame, bg="#0b1120", highlightthickness=0
        )
        self.canvas.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        # Right: Health, Memory, & Live Stream Panel
        right_panel = tk.Frame(main_pane, bg="#1e293b")
        main_pane.add(right_panel, width=360)

        # Telemetry & Hallucination Guard Metrics
        telemetry_box = tk.LabelFrame(
            right_panel,
            text=" State & Grounding Telemetry ",
            fg="#94a3b8",
            bg="#1e293b",
            font=("Courier", 10, "bold"),
        )
        telemetry_box.pack(fill=tk.X, padx=10, pady=5)

        self.lbl_memory = tk.Label(
            telemetry_box,
            text="State Memory: 0.00 KB (0 tokens)",
            fg="#38bdf8",
            bg="#1e293b",
            font=("Courier", 9),
            anchor="w",
        )
        self.lbl_memory.pack(fill=tk.X, padx=8, pady=2)

        self.lbl_grounding = tk.Label(
            telemetry_box,
            text="Spatial Grounding: 100% (Strict BBox)",
            fg="#34d399",
            bg="#1e293b",
            font=("Courier", 9),
            anchor="w",
        )
        self.lbl_grounding.pack(fill=tk.X, padx=8, pady=2)

        self.lbl_drift = tk.Label(
            telemetry_box,
            text="Schema Drift: 0 anomalies (Strict Pydantic)",
            fg="#38bdf8",
            bg="#1e293b",
            font=("Courier", 9),
            anchor="w",
        )
        self.lbl_drift.pack(fill=tk.X, padx=8, pady=2)

        self.lbl_active_agent = tk.Label(
            telemetry_box,
            text="Active Agent: IDLE",
            fg="#94a3b8",
            bg="#1e293b",
            font=("Courier", 9, "bold"),
            anchor="w",
        )
        self.lbl_active_agent.pack(fill=tk.X, padx=8, pady=2)

        # Live Event Log Stream
        log_box = tk.LabelFrame(
            right_panel,
            text=" Real-Time Agent Stream & XAI Log ",
            fg="#94a3b8",
            bg="#1e293b",
            font=("Courier", 10, "bold"),
        )
        log_box.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)

        self.log_text = tk.Text(
            log_box,
            bg="#020617",
            fg="#e2e8f0",
            font=("Courier", 8),
            wrap=tk.WORD,
            borderwidth=0,
        )
        self.log_text.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

    def _draw_base_graph(self):
        self.canvas.delete("all")
        self.node_elements = {}
        self.edge_elements = {}

        # Directed Static Edges
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
            line = self.canvas.create_line(
                x1, y1, x2, y2, fill="#334155", width=2, arrow=tk.LAST, dash=(4, 4)
            )
            self.edge_elements[(src, dst)] = line

        # Draw Agent Circles & Labels
        r = 38
        for node_id, data in self.nodes.items():
            x, y = data["pos"]
            # Base circle
            circle = self.canvas.create_oval(
                x - r,
                y - r,
                x + r,
                y + r,
                fill="#1e293b",
                outline="#475569",
                width=2,
            )
            # Text
            text = self.canvas.create_text(
                x,
                y,
                text=data["label"],
                fill="#f8fafc",
                font=("Courier", 8, "bold"),
                justify=tk.CENTER,
            )
            self.node_elements[node_id] = {
                "circle": circle,
                "text": text,
                "color": data["color"],
            }

    def set_agent_active(self, node_id: str, is_active: bool):
        if node_id not in self.node_elements:
            return
        circle = self.node_elements[node_id]["circle"]
        color = self.node_elements[node_id]["color"]
        if is_active:
            self.canvas.itemconfig(circle, fill=color, outline="#ffffff", width=3)
            self.lbl_active_agent.config(text=f"Active Agent: {node_id.upper()}", fg=color)
        else:
            self.canvas.itemconfig(
                circle, fill="#1e293b", outline="#475569", width=2
            )
            self.lbl_active_agent.config(text="Active Agent: IDLE", fg="#94a3b8")

    def pulse_edge(self, src: str, dst: str):
        if (src, dst) in self.edge_elements:
            line = self.edge_elements[(src, dst)]
            self.canvas.itemconfig(line, fill="#38bdf8", width=3, dash=())
            self.root.after(
                400,
                lambda: self.canvas.itemconfig(
                    line, fill="#334155", width=2, dash=(4, 4)
                ),
            )

    def log_event(self, text: str):
        self.log_text.insert(tk.END, f"[{datetime.now().strftime('%H:%M:%S')}] {text}\n")
        self.log_text.see(tk.END)

    def update_telemetry(self, memory_bytes: int, grounding_pct: float, drift_count: int):
        est_tokens = memory_bytes // 4
        self.lbl_memory.config(
            text=f"State Memory: {memory_bytes/1024:.2f} KB (~{est_tokens} tokens)"
        )
        self.lbl_grounding.config(
            text=f"Spatial Grounding: {grounding_pct:.1f}% (Indian EEZ)",
            fg="#34d399" if grounding_pct > 90 else "#f87171",
        )
        self.lbl_drift.config(
            text=f"Schema Drift: {drift_count} anomalies (Pydantic)",
            fg="#f87171" if drift_count > 0 else "#38bdf8",
        )

    def _process_events(self):
        while not self.event_queue.empty():
            msg_type, payload = self.event_queue.get()
            if msg_type == "ACTIVE":
                self.set_agent_active(payload["node"], payload["state"])
            elif msg_type == "EDGE":
                self.pulse_edge(payload["src"], payload["dst"])
            elif msg_type == "LOG":
                self.log_event(payload["text"])
            elif msg_type == "METRICS":
                self.update_telemetry(
                    payload["bytes"], payload["grounding"], payload["drift"]
                )
        self.root.after(50, self._process_events)

    # ----------------------------------------------------
    # Background Execution Simulator / Hook for LangGraph
    # ----------------------------------------------------
    def _trigger_simulated_run(self, query_type: str):
        thread = threading.Thread(
            target=self._run_agent_pipeline_simulation,
            args=(query_type,),
            daemon=True,
        )
        thread.start()

    def _run_agent_pipeline_simulation(self, query_type: str):
        session_id = f"orca_session_{int(time.time())}"
        accumulated_state = {"session_id": session_id, "messages": []}

        # Step 1: User Prompt Ingestion
        if query_type == "fishing":
            prompt = "Can 4 mechanized boats fish 30km southwest of Veraval (20.90 N, 70.36 E) for Tuna?"
            origin = [20.902, 70.368]
            target = [20.650, 70.150]
        elif query_type == "border_risk":
            prompt = "Heading 12km southeast of Rameswaram (9.28 N, 79.31 E). Am I near the Sri Lanka IMBL border?"
            origin = [9.285, 79.315]
            target = [9.150, 79.450]
        else:
            prompt = "What are the seasonal monsoon fishing ban dates for mechanized trawlers in Kerala?"
            origin = [9.942, 76.262]
            target = [9.800, 76.000]

        accumulated_state["messages"].append({"role": "user", "content": prompt})

        self.event_queue.put(("LOG", {"text": f"User query: '{prompt[:50]}...'"}))
        self.event_queue.put(
            (
                "METRICS",
                {
                    "bytes": len(json.dumps(accumulated_state)),
                    "grounding": 100.0,
                    "drift": 0,
                },
            )
        )
        time.sleep(0.6)

        # Step 2: Supervisor Planning
        self.event_queue.put(("ACTIVE", {"node": "supervisor", "state": True}))
        self.event_queue.put(
            ("LOG", {"text": "Supervisor: Parsing intent via Qwen2.5 7B & resolving gazetteer"})
        )
        time.sleep(0.8)
        self.event_queue.put(("ACTIVE", {"node": "supervisor", "state": False}))

        # Step 3: Dispatch Worker Agents
        tasks = (
            ["ocean_analytics", "navigation", "risk_geofencing", "policy_rag"]
            if query_type == "fishing"
            else (["risk_geofencing", "policy_rag"] if query_type == "border_risk" else ["policy_rag", "ocean_analytics"])
        )

        for agent in tasks:
            self.event_queue.put(("EDGE", {"src": "supervisor", "dst": agent}))
            self.event_queue.put(("ACTIVE", {"node": agent, "state": True}))

            time.sleep(0.6)
            if agent == "ocean_analytics":
                tool_data = {"sst_celsius": 28.4, "chlorophyll_mg_m3": 1.35, "pfz_clusters": 3, "wave_height_m": 1.3}
                log_msg = "Ocean AI: Sliced NetCDF rasters (SST=28.4°C, 3 PFZ clusters detected)"
            elif agent == "risk_geofencing":
                dist = 8.5 if query_type == "border_risk" else 45.0
                tool_data = {"imbl_distance_km": dist, "is_safe": dist > 10.0, "status": "ORANGE" if dist < 10.0 else "GREEN"}
                log_msg = f"Risk & Geo: PostGIS ST_Distance -> IMBL distance={dist} km ({tool_data['status']})"
            elif agent == "navigation":
                tool_data = {"distance_nm": 42.5, "duration_hours": 4.8, "fuel_savings_pct": 11.4}
                log_msg = "Navigation: Dynamic A* current-riding path computed (11.4% fuel savings)"
            else:
                tool_data = {"ban_active": False, "regulation": "West Coast Monsoon Ban active June 1 - July 31"}
                log_msg = "Policy RAG: Retrieved Department of Fisheries Order No. 31035/01/2026"

            accumulated_state[agent] = tool_data
            self.event_queue.put(("LOG", {"text": log_msg}))
            self.event_queue.put(("ACTIVE", {"node": agent, "state": False}))

            # Pulse toward Synthesizer
            self.event_queue.put(("EDGE", {"src": agent, "dst": "synthesizer"}))

            # Update Metrics
            state_bytes = len(json.dumps(accumulated_state))
            # Grounding check: verify coordinates are in Indian Ocean bbox [50-100 lon, 0-25 lat]
            lat_ok = 0.0 <= origin[0] <= 25.0 and 0.0 <= target[0] <= 25.0
            lon_ok = 50.0 <= origin[1] <= 100.0 and 50.0 <= target[1] <= 100.0
            grounding = 100.0 if (lat_ok and lon_ok) else 75.0

            self.event_queue.put(
                (
                    "METRICS",
                    {
                        "bytes": state_bytes,
                        "grounding": grounding,
                        "drift": 0,
                    },
                )
            )

        # Step 4: Synthesizer Node
        self.event_queue.put(("ACTIVE", {"node": "synthesizer", "state": True}))
        self.event_queue.put(
            ("LOG", {"text": "Synthesizer: Compiling GeoJSON FeatureCollection & localized advisory"})
        )
        time.sleep(0.9)
        self.event_queue.put(("ACTIVE", {"node": "synthesizer", "state": False}))

        # Write to JSONL Log
        audit_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "session_id": session_id,
            "query": prompt,
            "origin_coords": origin,
            "target_coords": target,
            "agents_invoked": tasks,
            "final_state_bytes": len(json.dumps(accumulated_state)),
            "state_snapshot": accumulated_state,
        }
        append_audit_log(audit_entry)
        self.event_queue.put(("LOG", {"text": f"✅ Audit trace persisted to {LOG_FILE}"}))


# ==============================================================================
# 3. ENTRY POINT
# ==============================================================================
if __name__ == "__main__":
    root = tk.Tk()
    app = AgentMonitorGUI(root)
    root.mainloop()
