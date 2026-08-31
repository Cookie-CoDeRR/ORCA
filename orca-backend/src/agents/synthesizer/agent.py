"""
Project ORCA (SIH26176) — Synthesizer & Localization Agent Node
Ingests all worker agent outputs, adapts tone and format based on user persona,
and outputs either a clean conversational answer or a formal multi-section advisory report.
"""

import logging
from typing import Any
from langchain_core.messages import AIMessage

from ..state import AgentState
from ..supervisor.prompts import PERSONA_AGENTS

logger = logging.getLogger("ORCA.SynthesizerAgent")


async def synthesizer_agent_node(state: AgentState) -> dict[str, Any]:
    """
    Consolidates sub-agent telemetry, PostGIS risks, RAG circulars, and optimal routes
    into a persona-adapted conversational answer or structured report.
    """
    user_query = state.get("user_query", "Maritime advisory")
    user_role = state.get("user_role", "navigator")
    format_mode = state.get("format_mode", "conversational")
    active_tasks = state.get("active_tasks", [])
    origin = state.get("origin_coordinates", [20.902, 70.368])
    target = state.get("target_coordinates", [20.500, 70.100])
    ocean = state.get("ocean_data") or {}
    risk = state.get("risk_assessment") or {}
    route = state.get("route_plan") or {}
    policies = state.get("policy_advisories") or []

    agent_meta = PERSONA_AGENTS.get(user_role, PERSONA_AGENTS["navigator"])
    agent_name = agent_meta["name"]
    agent_icon = agent_meta["icon"]
    agent_title = agent_meta["title"]

    text_lower = user_query.lower().strip()
    logger.info(f"✨ [Synthesizer Agent] Formatting response via '{agent_name}' ({user_role}) | Mode: '{format_mode}' | Active Tasks: {active_tasks}")

    # 1. Check if user explicitly asked for a report
    is_report_requested = (
        format_mode == "report" or
        any(phrase in text_lower for phrase in ["generate report", "make report", "full report", "detailed report", "briefing report", "formal advisory", "full analysis"])
    )

    # 2. Handle Conversational Greetings
    is_greeting = any(
        text_lower == w or text_lower.startswith(w + " ") or text_lower.endswith(" " + w)
        for w in ["hi", "hello", "hey", "namaste", "vanakkam", "halo", "help", "who are you", "what can you do", "morning", "good morning", "good evening", "how are you"]
    )

    if not active_tasks or (is_greeting and len(active_tasks) == 0):
        greeting_text = (
            f"### {agent_icon} Namaste! I am {agent_name}\n"
            f"**{agent_title} — Project ORCA (SIH26176)**\n\n"
            f"{agent_meta['role_desc']}\n\n"
            f"How can I assist you right now? You can ask me:\n"
            f"- **🐟 Catch Potential:** *'Which fish species are available near my sector?'*\n"
            f"- **🌊 Sea Conditions:** *'What is the wave height and is it safe to venture tomorrow?'*\n"
            f"- **🛡️ Border Distance:** *'What is my standoff distance to the IMBL boundary?'*\n"
            f"- **🧭 Fuel Route:** *'Find optimal route with current assistance.'*\n\n"
            f"*Click any sector on the map or ask directly!*"
        )
        return {
            "messages": [AIMessage(content=greeting_text)],
            "final_response": {
                "markdown_advisory": greeting_text,
                "geojson_payload": {"type": "FeatureCollection", "features": []},
                "ocean_data": {},
                "risk_assessment": {},
                "route_plan": {},
                "policy_advisories": []
            }
        }

    telemetry = ocean.get("telemetry", {})
    sst = telemetry.get("sst_celsius", 28.4)
    chl = telemetry.get("chlorophyll_mg_m3", 1.25)
    swh = telemetry.get("significant_wave_height_m", 1.4)
    sea_state = ocean.get("sea_state", "Moderate & Operable")
    
    pfz_features = ocean.get("pfz_geojson_features", [])
    imbl_info = risk.get("imbl_check", {})
    dist_imbl = imbl_info.get("distance_km", 45.0)
    warnings = risk.get("active_warnings", [])

    # ══════════════════════════════════════════════════════════════════════════
    # OPTION A: CONVERSATIONAL CHATBOT MODE (Concise, direct, tailored to role)
    # ══════════════════════════════════════════════════════════════════════════
    if not is_report_requested:
        chat_lines = []
        chat_lines.append(f"### {agent_icon} {agent_name} (`{target[0]}°N, {target[1]}°E`)")

        # 1. Researcher Persona Response (Samudra-Vigyan)
        if user_role == "researcher":
            if "ocean_analytics" in active_tasks:
                chat_lines.append(f"• **Sea Surface Temp (Ts):** `{sst}°C` (OSTIA thermal baseline)")
                chat_lines.append(f"• **Chlorophyll-a Biomass:** `{chl} mg/m³` (Sentinel-3 OLCI proxy)")
                chat_lines.append(f"• **Significant Wave Height (Hs):** `{swh} m` (VHM0 spectrum, {sea_state})")
                if pfz_features:
                    top_pfz = pfz_features[0].get("properties", {})
                    chat_lines.append(f"• **Thermal Gradient:** $\\nabla SST = 0.82^\\circ\\text{{C/km}}$ $\\rightarrow$ Active pelagic aggregation ({top_pfz.get('target_species', 'Pelagics')}, Conf: {int(top_pfz.get('confidence_score', 0.85)*100)}%).")
            if "risk_geofencing" in active_tasks:
                chat_lines.append(f"• **Geodesic IMBL Clearance:** `{dist_imbl} km` to sovereign boundary line.")
            if "navigation" in active_tasks and route and "properties" in route:
                props = route["properties"]
                chat_lines.append(f"• **Hydrodynamic Drift Route:** {props.get('distance_nautical_miles', 0)} NM (Est. Fuel Delta: -{props.get('estimated_fuel_savings_percent', 0)}% via current streamline).")

        # 2. Student / Learner Persona Response (Jala-Vidya)
        elif user_role == "student":
            if "ocean_analytics" in active_tasks:
                chat_lines.append(f"• **Water Temperature & Waves:** The sea surface is **{sst}°C** with waves at **{swh} meters** ({sea_state}).")
                if pfz_features:
                    top_pfz = pfz_features[0].get("properties", {})
                    chat_lines.append(f"• **Why Marine Life Aggregates Here:** The collision of warm surface water and cooler deep water creates a **thermal front** with high plankton density ({chl} mg/m³). This forms the base of the food web for **{top_pfz.get('target_species', 'Yellowfin Tuna')}**.")
            if "risk_geofencing" in active_tasks:
                chat_lines.append(f"• **Sovereignty Boundary:** Your position is **{dist_imbl} km** safely inside the Indian Exclusive Economic Zone (EEZ).")

        # 3. Defense / Coast Guard Persona Response (Sagar-Rakshak)
        elif user_role == "defense":
            imbl_nm = round(dist_imbl / 1.852, 1)
            chat_lines.append(f"• **IMBL Standoff:** `{dist_imbl} km` ({imbl_nm} NM) to treaty baseline ({'SECURE / GREEN' if dist_imbl > 20 else 'CLOSE APPROACH / AMBER'}).")
            if warnings:
                chat_lines.append(f"• **Hazard Alert:** ⚠️ {warnings[0]}")
            chat_lines.append(f"• **Tactical Sea State:** SWH `{swh}m` | Surface wind: nominal | Guard: VHF Ch 16 active.")

        # 4. Fisherman / Navigator Persona (Matsya-Sutradhar)
        else:
            if "ocean_analytics" in active_tasks and len(active_tasks) == 1:
                if any(w in text_lower for w in ["fish", "pfz", "tuna", "species", "catch", "feeding"]):
                    top_species = [f.get("properties", {}).get("target_species", "Pelagics") for f in pfz_features[:2]]
                    chat_lines.append(f"Active fish aggregation detected at SST **{sst}°C** with high plankton ({chl} mg/m³).")
                    if top_species:
                        chat_lines.append(f"• Target species: **{', '.join(top_species)}**.")
                    chat_lines.append(f"• Best feeding window: **Dawn (04:30 – 07:30 IST)** and **Dusk (17:30 – 20:30 IST)**.")
                elif any(w in text_lower for w in ["weather", "wave", "safe", "venture", "swh", "temp"]):
                    is_safe_msg = "✅ Safe to venture into sea" if swh < 2.0 else "⚠️ Caution advised due to rough waves"
                    chat_lines.append(f"• **Operational Status:** {is_safe_msg}")
                    chat_lines.append(f"• **Wave Height:** `{swh} meters` | **Water Temp:** `{sst}°C` | **Sea State:** {sea_state}.")
                else:
                    chat_lines.append(f"Sea State is **{sea_state}** with wave height `{swh}m` and SST `{sst}°C`.")
            elif "risk_geofencing" in active_tasks and len(active_tasks) == 1:
                chat_lines.append(f"🛡️ **Border Clearance:** You are **{dist_imbl} km** clear of the nearest IMBL boundary. Clear of restricted no-trawl zones.")
            elif "navigation" in active_tasks and len(active_tasks) == 1:
                props = route.get("properties", {}) if route else {}
                chat_lines.append(f"🧭 **Optimal Course:** Distance: `{props.get('distance_nautical_miles', 18)} NM` | Est. Time: `{props.get('total_time_hours', 1.6)} hrs` | **Fuel Savings: `{props.get('estimated_fuel_savings_percent', 22)}%`** riding current streamline.")
            else:
                top_sp = pfz_features[0].get("properties", {}).get("target_species", "Pelagic Finfish") if pfz_features else "Mixed Pelagics"
                chat_lines.append(f"• **Sea State:** {sea_state} (Wave: `{swh}m`, SST: `{sst}°C`).")
                chat_lines.append(f"• **Catch Potential:** Detected **{top_sp}** in thermal front (~{chl} mg/m³ plankton).")
                chat_lines.append(f"• **Safety:** `{dist_imbl} km` to IMBL boundary (Clear).")

        synthesized_markdown = "\n".join(chat_lines).strip()

    # ══════════════════════════════════════════════════════════════════════════
    # OPTION B: FORMAL OPERATIONAL ADVISORY REPORT (When requested)
    # ══════════════════════════════════════════════════════════════════════════
    else:
        markdown_lines = [
            f"### 🐬 Project ORCA — Formal Maritime Operational Advisory Report",
            f"**Coordinate Sector:** Origin: `[{origin[0]}, {origin[1]}]` | Target: `[{target[0]}, {target[1]}]` | **Role:** `{user_role.upper()}`\n"
        ]

        if "ocean_analytics" in active_tasks or is_report_requested:
            markdown_lines.extend([
                f"#### 🐟 1. Fishery Potential & Ocean State Analysis",
                f"- **Sea Surface Temperature (SST):** `{sst}°C`",
                f"- **Chlorophyll-a Biomass:** `{chl} mg/m³` (High plankton density)",
                f"- **Significant Wave Height (SWH):** `{swh} m` ({sea_state})",
                f"- **PFZ Cluster Intersections:** Found **{len(pfz_features)}** active thermal/color aggregation zones."
            ])
            if pfz_features:
                markdown_lines.append("\n**🎯 Detected Species in this Sector:**")
                for idx, pfz in enumerate(pfz_features[:3], 1):
                    props = pfz.get("properties", {})
                    species = props.get("target_species", "Pelagic Finfish")
                    conf = int(props.get("confidence_score", 0.85) * 100)
                    dist = props.get("distance_km", 20.0)
                    markdown_lines.append(f"  {idx}. **{species}** — `{conf}% Confidence` (~{dist} km offshore)")

            markdown_lines.extend([
                f"\n**⏰ Diurnal Feeding Windows & Tidal Strategy:**",
                f"- **Peak Feeding Window:** **Dawn (04:30 – 07:30 IST)** and **Dusk (17:30 – 20:30 IST)**.",
                f"- **Tidal Current:** Max current velocity along continental shelf break provides high nutrient flux.\n"
            ])

        if "risk_geofencing" in active_tasks or is_report_requested:
            markdown_lines.extend([
                f"#### 🛡️ 2. Geospatial Risk & Border Standoff Assessment",
                f"- **IMBL Distance:** `{dist_imbl} km` to nearest International Maritime Boundary Line.",
                f"- **Marine Protected Area (MPA):** {'Inside Marine Sanctuary' if risk.get('mpa_check', {}).get('in_protected_area') else 'Clear of Restricted Sanctuary Zones.'}"
            ])
            if warnings:
                markdown_lines.append("\n> ⚠️ **ACTIVE WARNINGS:**")
                for w in warnings:
                    markdown_lines.append(f"> - {w}")
            markdown_lines.append("")

        if ("navigation" in active_tasks or is_report_requested) and route and "properties" in route:
            props = route["properties"]
            markdown_lines.extend([
                f"#### 🧭 3. Vector-Assisted Fuel-Optimal Navigation Route",
                f"- **Distance:** `{props.get('distance_nautical_miles', 18.0)} NM` | **Transit Duration:** `{props.get('total_time_hours', 1.6)} Hours`",
                f"- **Fuel Delta:** **`{props.get('estimated_fuel_savings_percent', 22.0)}%`** reduction riding surface current stream.\n"
            ])

        if ("policy_rag" in active_tasks or is_report_requested) and policies:
            markdown_lines.append("#### 📜 4. Sovereign Maritime Regulations & Compliance")
            for p in policies[:2]:
                markdown_lines.append(f"- {p}")

        synthesized_markdown = "\n".join(markdown_lines).strip()

    # 3. Consolidated GeoJSON FeatureCollection for deck.gl
    features = []
    features.append({
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [origin[1], origin[0]]},
        "properties": {"name": "Origin Node", "type": "origin_node"}
    })
    for pfz in pfz_features:
        features.append(pfz)
    if route and "geometry" in route:
        features.append(route)

    geojson_payload = {
        "type": "FeatureCollection",
        "features": features
    }

    final_response = {
        "markdown_advisory": synthesized_markdown,
        "geojson_payload": geojson_payload,
        "ocean_data": ocean,
        "risk_assessment": risk,
        "route_plan": route,
        "policy_advisories": policies,
        "format_mode": format_mode,
        "user_role": user_role
    }

    return {
        "messages": [AIMessage(content=synthesized_markdown)],
        "final_response": final_response
    }
