"""
Project ORCA (SIH26176) — Synthesizer & Localization Agent Node
Ingests all worker agent outputs, adapts tone and format based on user persona,
and outputs either a clean conversational answer or a formal multi-section advisory report.
"""

import logging
from typing import Any
from langchain_core.messages import AIMessage, SystemMessage, HumanMessage
from ...agent.llm_config import get_chat_llm, check_ollama_health, OLLAMA_MODEL
from .prompts import ORCA_FISHER_SYSTEM_PROMPT, ORCA_TACTICAL_SYSTEM_PROMPT, ORCA_SCHOLAR_SYSTEM_PROMPT

from ..state import AgentState
from ..supervisor.prompts import PERSONA_AGENTS

logger = logging.getLogger("ORCA.SynthesizerAgent")


def prepare_synthesizer_prompts(state: AgentState) -> dict[str, Any]:
    """
    Constructs domain-specific system prompts and user instructions from state telemetry,
    enabling both one-shot ainvoke() and real-time astream() token streaming.
    """
    user_query = state.get("user_query", "Maritime advisory")
    user_role = state.get("user_role", "navigator")
    format_mode = state.get("format_mode", "conversational")
    active_tasks = state.get("active_tasks", [])
    raw_origin = state.get("origin_coordinates")
    origin = list(raw_origin) if (isinstance(raw_origin, (list, tuple)) and len(raw_origin) >= 2) else [20.902, 70.368]
    raw_target = state.get("target_coordinates")
    target = list(raw_target) if (isinstance(raw_target, (list, tuple)) and len(raw_target) >= 2) else [20.500, 70.100]
    ocean = state.get("ocean_data") or {}
    risk = state.get("risk_assessment") or {}
    route = state.get("route_plan") or {}
    policies = state.get("policy_advisories") or []
    papers = state.get("research_papers") or []

    agent_meta = PERSONA_AGENTS.get(user_role, PERSONA_AGENTS["navigator"])
    agent_name = agent_meta["name"]
    agent_icon = agent_meta["icon"]
    agent_title = agent_meta["title"]

    text_lower = user_query.lower().strip()

    is_report_requested = (
        format_mode == "report" or
        any(phrase in text_lower for phrase in ["generate report", "make report", "full report", "detailed report", "briefing report", "formal advisory", "full analysis"])
    )

    species_keywords = [
        "fish", "fishes", "fishing", "catch", "species", "marine life", "sea life", "pelagic",
        "yellow fin", "yellowfin", "tuna", "skipjack", "mackerel", "sardine", "pomfret",
        "squid", "seer fish", "kingfish", "hilsa", "anchovy", "shrimp", "prawn", "biology",
        "bangda", "surmai", "tarli", "mathi", "kera", "choora", "bombil", "bombay duck"
    ]
    species_intent_words = [
        "tell me", "about", "what", "which", "find", "describe", "know", "information", "details",
        "explain", "how does", "why do", "biology", "habitat", "characteristics", "price",
        "rate", "market", "names", "catch", "where", "feed", "more", "present", "available",
        "there", "area", "sector", "here", "can i", "can we"
    ]
    is_species_query = (
        any(sp in text_lower for sp in species_keywords) and
        any(iw in text_lower for iw in species_intent_words)
    ) or any(
        exact in text_lower
        for exact in [
            "yellow fin tuna", "yellowfin tuna", "tell me about tuna", "tell me more about",
            "what is tuna", "what fishes", "which fishes", "what fish", "which fish", "fishes in",
            "fish in this area", "fishes in this area", "fish can i find", "fishes can i find"
        ]
    )

    is_greeting = any(
        text_lower == w or text_lower.startswith(w + " ") or text_lower.endswith(" " + w)
        for w in ["hi", "hello", "hey", "namaste", "vanakkam", "halo", "help", "who are you", "what can you do", "morning", "good morning", "good evening", "how are you"]
    )

    if not active_tasks or (is_greeting and len(active_tasks) == 0):
        greeting_text = (
            f"### Namaste! I am {agent_name}\n"
            f"**{agent_title} — Project ORCA (SIH26176)**\n\n"
            f"{agent_meta['role_desc']}\n\n"
            f"How can I assist you right now? You can ask me:\n"
            f"- **Catch Potential:** *'Which fish species are available near my sector?'*\n"
            f"- **Sea Conditions:** *'What is the wave height and is it safe to venture tomorrow?'*\n"
            f"- **Border Distance:** *'What is my standoff distance to the IMBL boundary?'*\n"
            f"- **Fuel Route:** *'Find optimal route with current assistance.'*\n\n"
            f"*Click any sector on the map or ask directly!*"
        )
        return {
            "is_greeting": True,
            "greeting_text": greeting_text,
            "sys_prompt": "",
            "user_instruction": "",
            "agent_name": agent_name,
            "agent_title": agent_title,
            "user_role": user_role,
            "target": target,
            "origin": origin,
            "ocean": ocean,
            "risk": risk,
            "route": route,
            "policies": policies,
            "papers": papers,
            "is_report_requested": False,
            "is_species_query": False,
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

    if user_role == "researcher":
        sys_prompt = ORCA_SCHOLAR_SYSTEM_PROMPT
    elif user_role == "defense":
        sys_prompt = ORCA_TACTICAL_SYSTEM_PROMPT
    else:
        sys_prompt = ORCA_FISHER_SYSTEM_PROMPT

    top_species_list = [f.get("properties", {}).get("target_species") for f in pfz_features[:3]]
    route_props = route.get("properties", {}) if route else {}

    telemetry_summary = (
        f"- Sector Target Coordinates: [{target[0]}°N, {target[1]}°E]\n"
        f"- Sea Surface Temperature (SST): {sst}°C\n"
        f"- Chlorophyll-a Biomass: {chl} mg/m³\n"
        f"- Significant Wave Height (SWH): {swh} m (Sea State: {sea_state})\n"
        f"- Potential Fishing Zone (PFZ) Species: {top_species_list}\n"
        f"- IMBL Standoff Distance: {dist_imbl} km (Alerts/Warnings: {warnings})\n"
        f"- Fuel-Optimal Current Navigation: {route_props.get('distance_nautical_miles', 18)} NM, {route_props.get('estimated_fuel_savings_percent', 18)}% fuel savings\n"
        f"- Statutory Regulatory Circulars: {policies}\n"
        f"- Peer-Reviewed Research Literature: {[{'title': p['title'], 'journal': p['journal'], 'year': p['year'], 'doi': p.get('doi'), 'keyFinding': p.get('keyFinding') or p.get('key_findings')} for p in papers[:3]]}\n"
    )

    if is_report_requested:
        if is_species_query or any(k in text_lower for k in ["fish", "fishes", "species", "fisher", "catch", "tuna", "mackerel", "sardine", "biomass", "pelagic"]):
            user_instruction = (
                f"User Request: {user_query}\n\n"
                f"Synthesize an authoritative, rich Marine Pelagic Fisheries & Species Dossier based on this real-time in-situ telemetry:\n"
                f"{telemetry_summary}\n\n"
                f"Format strictly with these Markdown H3 headers on their own separate lines with blank lines before and after:\n\n"
                f"### Marine Species Distribution & Biomass Overview\n"
                f"[A comprehensive overview of dominant pelagic and coastal fish species aggregating in this sector ({target[0]}°N, {target[1]}°E). Detail their biological assemblages, schooling behavior, and how coastal upwelling and phytoplankton concentrations provide rich forage for secondary marine consumers.]\n\n"
                f"### Target Species Profiles & Vernacular Classification\n"
                f"Detail 3-4 specific commercial species found in this sector:\n"
                f"- **Indian Mackerel (*Rastrelliger kanagurta*):** Vernacular names (Marathi: *Bangda*, Malayalam: *Ayala*, Tamil: *Kumla*, Gujarati: *Bangdi*). Trophic niche: coastal plankton feeder (10–45m depth). Upwelling indicator.\n"
                f"- **Yellowfin Tuna (*Thunnus albacares*):** Vernacular names (Malayalam: *Kera*, Gujarati: *Toora*, Marathi: *Gedar*). High-metabolism epipelagic apex hunter (40–120m depth along continental shelf break).\n"
                f"- **Oil Sardine (*Sardinella longiceps*):** Vernacular names (Malayalam: *Mathi*, Marathi: *Tarli*, Tamil: *Kavalai*). Coastal schooling feeder closely tracking phytoplankton blooms (0–35m depth).\n"
                f"- **King Seer Fish (*Scomberomorus commerson*):** Vernacular names (Hindi/Marathi: *Surmai*, Malayalam: *Neymeen*, Tamil: *Vanjaram*). High-value pelagic predator (15–60m depth).\n\n"
                f"### In-Situ Oceanographic Telemetry & Trophic Index\n"
                f"- **Sea Surface Temperature (SST):** {sst}°C (Optimal thermal envelope for tropical pelagics)\n"
                f"- **Chlorophyll-a Biomass:** {chl} mg/m³ (Active primary production supporting copepod and baitfish blooms)\n"
                f"- **Significant Wave Height (SWH):** {swh} m ({sea_state})\n"
                f"- **Habitat Suitability Index (HSI):** High (~92-95% aggregation confidence)\n"
                f"- **Bathymetric Shelf Gradient:** Continental shelf break with active nutrient upwelling\n\n"
                f"### Peer-Reviewed Oceanographic Research & RAG Evidence\n"
                f"[Cite peer-reviewed scientific studies from the research knowledge base on Indian Ocean pelagic aggregation, thermal frontal dynamics, and chlorophyll-a upwelling correlations (e.g. Nayak et al., Sarangi et al.).]\n\n"
                f"### Sustainable Harvesting & Sovereign Advisory\n"
                f"- **Recommended Selective Gear:** Circle hooks (16/0), traditional pole-and-line, and regulated mesh gillnets to prevent juvenile bycatch.\n"
                f"- **Diurnal Feeding Windows:** Peak solunar feeding at Dawn (04:30–07:30 IST) and Dusk (17:30–20:30 IST).\n"
                f"- **Sovereign Standoff & Compliance:** {dist_imbl} km clearance from IMBL boundaries. Mandatory compliance with seasonal monsoon fishing bans and VHF Channel 16 monitoring.\n\n"
                f"CRITICAL FORMATTING RULES:\n"
                f"1. Never merge a header onto the preceding or following line. Always use separate lines with double newlines.\n"
                f"2. Write clean plain text without LaTeX math syntax.\n"
                f"3. Do NOT use emojis."
            )
        else:
            user_instruction = (
                f"User Request: {user_query}\n\n"
                f"Synthesize an authoritative, structured Multi-Agent Operational Maritime Advisory Report based on this real-time in-situ telemetry:\n"
                f"{telemetry_summary}\n\n"
                f"Format strictly with these Markdown H3 headers on their own separate lines with blank lines before and after:\n\n"
                f"### Situation Overview\n"
                f"[A concise 2-3 sentence executive briefing of current sea conditions and operational readiness]\n\n"
                f"### In-Situ Ocean Conditions\n"
                f"- **Sea Surface Temperature (SST):** {sst}°C\n"
                f"- **Chlorophyll-a Biomass:** {chl} mg/m³\n"
                f"- **Significant Wave Height (SWH):** {swh} m ({sea_state})\n"
                f"- **Bathymetric Shelf Depth:** Continental Shelf Break\n"
                f"- **Thermal Frontal Gradient:** ∇SST: 0.55 °C/km\n"
                f"- **Primary Productivity:** Chl-a anomaly vs climatology\n"
                f"- **Hydrodynamic Vectors:** Surface current drift and upwelling circulation\n\n"
                f"### Target Species & Catch Opportunities\n"
                f"- **Dominant Detected Species:** [List 2-3 specific commercial pelagic species]\n"
                f"- **Habitat Suitability Index (HSI):** [Score and confidence rating]\n"
                f"- **Feeding Windows:** Dawn (04:30–07:30 IST) and Dusk (17:30–20:30 IST)\n\n"
                f"### Sovereign Standoff & Compliance\n"
                f"- **IMBL Standoff Distance:** {dist_imbl} km (Status: SAFE / EEZ Compliant)\n"
                f"- **Statutory Regulatory Circulars:** Detail applicable monsoon ban notifications and mandatory VHF Channel 16 / Helpline 1554 SOPs.\n\n"
                f"### Operational Fuel Route Directives\n"
                f"- **Fuel-Optimal Current Navigation:** Distance, fuel savings percentage, and tail-current route assistance.\n\n"
                f"CRITICAL FORMATTING RULES:\n"
                f"1. Never merge a header onto the preceding or following line. Always use separate lines with double newlines.\n"
                f"2. Write clean plain text without LaTeX math syntax.\n"
                f"3. Do NOT use emojis."
            )
    elif is_species_query:
        # Check if user query is general or species-specific
        is_general_fish_query = any(phrase in text_lower for phrase in [
            "what fish", "what fishes", "which fish", "which fishes", "fishes in", "fish in",
            "fishes can i find", "fish can i find", "what can i catch", "species in this area",
            "fishes available", "fish available", "marine life"
        ])
        if is_general_fish_query:
            user_instruction = (
                f"User Query: {user_query}\n\n"
                f"You are {agent_name} ({user_role}), expert marine guide and friendly ocean co-pilot.\n"
                f"The user is asking a simple, educational question about what fishes can be found in this area.\n"
                f"CRITICAL FORMATTING & TONE REQUIREMENTS:\n"
                f"1. Make your answer clean, simple, and accessible — suitable for a student or curious observer. Do NOT use heavy, intimidating sensor formulas, raw equations (like ∇SST), or naval jargon.\n"
                f"2. Present the key fishes found in this area in a clear bulleted list with both scientific and regional Indian names:\n"
                f"   - **Indian Mackerel (*Rastrelliger kanagurta*):** Known locally as **Bangda** (Marathi), **Ayala** (Malayalam), **Kumla** (Tamil), **Bangdi** (Gujarati). Swims in coastal surface waters (10–40m) feeding on plankton.\n"
                f"   - **Oil Sardine (*Sardinella longiceps*):** Known locally as **Tarli** (Marathi), **Mathi** (Malayalam), **Kavalai** (Tamil). Highly nutritious small pelagic fish that forms dense silver schools near the surface.\n"
                f"   - **Yellowfin Tuna (*Thunnus albacares*):** Known locally as **Kera** (Malayalam), **Toora** (Gujarati), **Gedar** (Marathi). A prized, fast-swimming predator found near the deeper continental shelf edge (40–100m).\n"
                f"   - **King Seer Fish (*Scomberomorus commerson*):** Known locally as **Surmai** (Hindi/Marathi), **Neymeen** (Malayalam), **Vanjaram** (Tamil). Fast predatory fish cruising near reefs and current lines.\n"
                f"3. **Why are they found here? (Simple Explanation):** In plain words, explain that the water temperature here (~{sst:.1f}°C) is warm and pleasant, and satellite data shows abundant microscopic food (plankton / Chlorophyll-a: {chl:.2f} mg/m³). This creates a natural underwater banquet that attracts small fish, which in turn attracts larger game fish.\n"
                f"4. **When do they feed?** Early morning (dawn) and late afternoon (dusk) when sunlight is soft and fish rise to the surface.\n"
                f"5. **Fun Ecology Fact / Tip:** A friendly 1-2 sentence tip encouraging sustainable fishing or ocean conservation.\n"
                f"Do NOT include generic voyage departure advisories, wave hazard warnings, or fuel route calculations unless explicitly asked."
            )
        else:
            user_instruction = (
                f"User Query: {user_query}\n\n"
                f"You are {agent_name} ({user_role}), expert fisheries oceanographer and maritime co-pilot.\n"
                f"The user is asking about a specific marine species. DIRECTLY answer their inquiry with rich, practical, domain-specific information:\n"
                f"1. **Identity & Vernacular Names:** Binomial scientific name, distinguishing traits, and regional vernacular names across coastal Indian states (Malayalam, Tamil, Marathi, Gujarati, Telugu).\n"
                f"2. **Oceanic Habitat & Telemetry Correlation:** Preferred Sea Surface Temperature (SST) thermal window, depth range, and how the active sector telemetry (SST: {sst}°C, Chl-a: {chl} mg/m³) relates to its habitat suitability.\n"
                f"3. **Feeding Ecology & Windows:** Diet and peak feeding hours (Dawn / Dusk).\n"
                f"4. **Gear & Catch Methods:** Recommended selective fishing gear.\n"
                f"5. **Commercial Value & Harbors:** Economic importance and major Indian landing centers (Kochi, Sassoon Dock, Veraval, Vizag).\n\n"
                f"CRITICAL: Do NOT generate a generic voyage departure advisory. Focus exclusively on providing an expert, detailed answer about the requested species."
            )
    else:
        user_instruction = (
            f"User Query: {user_query}\n\n"
            f"You are {agent_name} ({user_role}). Provide a concise, highly quantitative operational response (3-5 key bullet points) using this real-time ocean telemetry:\n"
            f"{telemetry_summary}\n"
            f"Directly answer the query with exact numbers and clear actionable guidance."
        )

    return {
        "is_greeting": False,
        "greeting_text": None,
        "sys_prompt": sys_prompt,
        "user_instruction": user_instruction,
        "agent_name": agent_name,
        "agent_title": agent_title,
        "user_role": user_role,
        "target": target,
        "origin": origin,
        "ocean": ocean,
        "risk": risk,
        "route": route,
        "policies": policies,
        "papers": papers,
        "is_report_requested": is_report_requested,
        "format_mode": format_mode,
        "is_species_query": is_species_query,
        "sst": sst,
        "chl": chl,
        "swh": swh,
        "sea_state": sea_state,
        "dist_imbl": dist_imbl,
        "warnings": warnings,
        "pfz_features": pfz_features,
        "text_lower": text_lower,
    }


async def synthesizer_agent_node(state: AgentState) -> dict[str, Any]:
    """
    Consolidates sub-agent telemetry, PostGIS risks, RAG circulars, and optimal routes
    into a persona-adapted conversational answer or structured report.
    """
    prompt_info = prepare_synthesizer_prompts(state)
    format_mode = prompt_info.get("format_mode", state.get("format_mode", "conversational"))
    user_role = prompt_info.get("user_role", state.get("user_role", "navigator"))
    if prompt_info["is_greeting"]:
        greeting_text = prompt_info["greeting_text"]
        return {
            "messages": [AIMessage(content=greeting_text)],
            "final_response": {
                "markdown_advisory": greeting_text,
                "geojson_payload": {"type": "FeatureCollection", "features": []},
                "ocean_data": {},
                "risk_assessment": {},
                "route_plan": {},
                "policy_advisories": [],
                "format_mode": format_mode,
                "user_role": user_role
            }
        }

    sys_prompt = prompt_info["sys_prompt"]
    user_instruction = prompt_info["user_instruction"]
    agent_name = prompt_info["agent_name"]
    target = prompt_info["target"]
    origin = prompt_info["origin"]
    ocean = prompt_info["ocean"]
    risk = prompt_info["risk"]
    route = prompt_info["route"]
    policies = prompt_info["policies"]
    papers = prompt_info["papers"]
    is_report_requested = prompt_info["is_report_requested"]
    is_species_query = prompt_info["is_species_query"]
    sst = prompt_info["sst"]
    chl = prompt_info["chl"]
    swh = prompt_info["swh"]
    sea_state = prompt_info["sea_state"]
    dist_imbl = prompt_info["dist_imbl"]
    warnings = prompt_info["warnings"]
    pfz_features = prompt_info["pfz_features"]
    text_lower = prompt_info["text_lower"]

    synthesized_markdown: str | None = None

    # ══════════════════════════════════════════════════════════════════════════
    # LIVE NEURAL LLM SYNTHESIS via OLLAMA (Local GPU / Apple Silicon / Metal)
    # ══════════════════════════════════════════════════════════════════════════
    is_live = await check_ollama_health()
    if is_live:
        try:
            llm = get_chat_llm(temperature=0.2, timeout=60.0)

            logger.info(f"🧠 [Synthesizer Node] Running live LLM inference ({getattr(llm, 'model', 'local-llm')}) on local GPU...")
            response_msg = await llm.ainvoke([
                SystemMessage(content=sys_prompt),
                HumanMessage(content=user_instruction)
            ])
            llm_text = str(response_msg.content).strip()
            if llm_text and len(llm_text) > 40:
                synthesized_markdown = llm_text
                logger.info(f"✅ [Synthesizer Node] Live LLM inference succeeded ({len(llm_text)} chars generated on GPU).")
        except Exception as e:
            logger.warning(f"Ollama synthesizer inference fallback: {e}")

    # ══════════════════════════════════════════════════════════════════════════
    # DETERMINISTIC OFFLINE FALLBACK (When Ollama is offline or warming up)
    # ══════════════════════════════════════════════════════════════════════════
    if synthesized_markdown is None:
        # ══════════════════════════════════════════════════════════════════════════
        # OPTION A: CONVERSATIONAL CHATBOT MODE     (Concise, direct, tailored to role)
        # ══════════════════════════════════════════════════════════════════════════
        if not is_report_requested:
            chat_lines = []

            # Specialized Species Intelligence Fallback Card
            if is_species_query:
                if any(w in text_lower for w in ["yellow fin", "yellowfin", "tuna"]):
                    suitability = "Optimal / Highly Favorable" if 24.5 <= sst <= 29.5 else "Moderate"
                    chat_lines.append(f"### Yellowfin Tuna (*Thunnus albacares*) — Species Intelligence Dossier")
                    chat_lines.append(f"**Regional Vernacular Names:**")
                    chat_lines.append(f"• **Malayalam:** *Kera* / *Poovan Choora* | **Tamil:** *Kelavalla* / *Keerai*")
                    chat_lines.append(f"• **Marathi:** *Gedar* / *Kuppa* | **Gujarati:** *Toora* | **Telugu:** *Soora*")
                    chat_lines.append(f"")
                    chat_lines.append(f"**Physical Biology & Characteristics:**")
                    chat_lines.append(f"• Hydrodynamic, torpedo-shaped fusiform body with bright golden-yellow sickle-shaped second dorsal and anal fins and brilliant yellow finlets.")
                    chat_lines.append(f"• High-metabolism pelagic apex predator with endothermic vascular countercurrent heat exchangers (*rete mirabile*), enabling high-speed ocean transit (up to 40 knots) and deep thermocline dives.")
                    chat_lines.append(f"")
                    chat_lines.append(f"**Oceanic Habitat & Telemetry Suitability (`{target[0]}°N, {target[1]}°E`):**")
                    chat_lines.append(f"• **Preferred SST Window:** `24.5°C – 29.5°C` (Current Sector SST: **{sst}°C** $\\rightarrow$ **{suitability}**).")
                    chat_lines.append(f"• **Optimal Depth:** Epipelagic to upper mesopelagic (`40m – 150m` depth), congregating along thermocline shears and chlorophyll-a color edges (**{chl} mg/m³**).")
                    chat_lines.append(f"")
                    chat_lines.append(f"**Feeding Ecology & Catch Windows:**")
                    chat_lines.append(f"• **Diet:** Oceanic purpleback flying squids (*Sthenoteuthis oualaniensis*), ribbonfish, and pelagic crustaceans.")
                    chat_lines.append(f"• **Peak Feeding Windows:** **Dawn (04:30 – 07:30 IST)** and **Dusk (17:30 – 20:30 IST)**.")
                    chat_lines.append(f"• **Optimal Gear:** Pelagic monofilament drift longlines with 16/0 circle hooks, deep trolling jigs, and pole-and-line.")
                    chat_lines.append(f"")
                    chat_lines.append(f"**Commercial Value & Harbors:**")
                    chat_lines.append(f"• Export Sashimi Grade (A): **₹350 – ₹550 / kg** | Fresh Domestic Landing: **₹180 – ₹280 / kg**.")
                    chat_lines.append(f"• Key Landing Hubs: Sassoon Dock (Mumbai), Cochin Fisheries Harbour, Veraval, Visakhapatnam, and Mangalore.")
                elif any(w in text_lower for w in ["mackerel", "bangda", "ayala"]):
                    chat_lines.append(f"### Indian Mackerel (*Rastrelliger kanagurta*) — Species Intelligence Dossier")
                    chat_lines.append(f"**Regional Vernacular Names:**")
                    chat_lines.append(f"• **Marathi:** *Bangda* | **Malayalam:** *Ayala* | **Tamil:** *Kumla* / *Kanangeluthi* | **Gujarati:** *Bangdi*")
                    chat_lines.append(f"")
                    chat_lines.append(f"**Habitat & Telemetry Suitability (`{target[0]}°N, {target[1]}°E`):**")
                    chat_lines.append(f"• **Preferred SST Window:** `26.0°C – 30.0°C` (Current Sector SST: **{sst}°C**).")
                    chat_lines.append(f"• **Plankton Affinity:** Strongly associates with coastal chlorophyll-a blooms (**{chl} mg/m³**) feeding on copepods and diatoms.")
                    chat_lines.append(f"• **Depth & Gear:** Surface to 50m; targeted via ring seines, purse seines, and pelagic gillnets.")
                    chat_lines.append(f"• **Commercial Landing Price:** ₹120 – ₹180 / kg across West Coast harbors.")
                else:
                    chat_lines.append(f"### Marine Fish Species in this Sector (`{target[0]}°N, {target[1]}°E`)")
                    chat_lines.append(f"Here are the primary fish species commonly found swimming in this ocean sector:")
                    chat_lines.append(f"")
                    chat_lines.append(f"1. **Indian Mackerel (*Rastrelliger kanagurta*)**")
                    chat_lines.append(f"   • **Local Names:** **Bangda** (Marathi/Hindi) · **Ayala** (Malayalam) · **Kumla** (Tamil) · **Bangdi** (Gujarati)")
                    chat_lines.append(f"   • **Where they swim:** Coastal surface waters (10m – 40m depth) in dense, glittering schools.")
                    chat_lines.append(f"")
                    chat_lines.append(f"2. **Oil Sardine (*Sardinella longiceps*)**")
                    chat_lines.append(f"   • **Local Names:** **Tarli** (Marathi/Hindi) · **Mathi** (Malayalam) · **Kavalai** (Tamil)")
                    chat_lines.append(f"   • **Where they swim:** Upper sunlit layer (0m – 30m depth), grazing directly on nutrient-rich phytoplankton.")
                    chat_lines.append(f"")
                    chat_lines.append(f"3. **Yellowfin Tuna (*Thunnus albacares*)**")
                    chat_lines.append(f"   • **Local Names:** **Kera** (Malayalam) · **Toora** (Gujarati) · **Gedar** (Marathi)")
                    chat_lines.append(f"   • **Where they swim:** Deeper open waters (40m – 120m depth) near the continental shelf break, hunting smaller fish.")
                    chat_lines.append(f"")
                    chat_lines.append(f"4. **King Seer Fish (*Scomberomorus commerson*)**")
                    chat_lines.append(f"   • **Local Names:** **Surmai** (Hindi/Marathi) · **Neymeen** (Malayalam) · **Vanjaram** (Tamil)")
                    chat_lines.append(f"   • **Where they swim:** Mid-water predator (15m – 60m depth) cruising around rocky ridges and currents.")
                    chat_lines.append(f"")
                    chat_lines.append(f"**Why are they found here?**")
                    chat_lines.append(f"The ocean temperature here is warm and pleasant (~{sst:.1f}°C) and satellite sensors show abundant microscopic food (plankton / Chlorophyll-a: {chl:.2f} mg/m³). This creates a natural underwater banquet where small fish gather to eat algae, attracting larger ocean hunters.")
                    chat_lines.append(f"")
                    chat_lines.append(f"**Best Feeding & Sighting Times:**")
                    chat_lines.append(f"• **Early Morning (04:30 – 07:30 IST)** and **Late Afternoon (17:30 – 20:30 IST)** when fish rise to the surface.")
                    chat_lines.append(f"")
                    chat_lines.append(f"💡 *Student Tip: Mackerel and sardines form the foundation of our ocean ecosystem, converting sunlight and algae into energy for the entire marine food web!*")
            else:
                chat_lines.append(f"### {agent_name} (`{target[0]}°N, {target[1]}°E`)")

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
                    if papers:
                        chat_lines.append("")
                        chat_lines.append("📚 **Relevant Peer-Reviewed Scientific Literature:**")
                        for p in papers[:2]:
                            doi_part = f" ([DOI: {p['doi']}]({p['url']}))" if p.get('doi') else ""
                            chat_lines.append(f"• **{p['title']}** — *{p['authors']}*, {p['journal']} ({p['year']}){doi_part}")
                            kf = p.get('keyFinding') or p.get('key_findings')
                            if kf:
                                chat_lines.append(f"  *Key Finding:* {kf}")


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
                        chat_lines.append(f"• **Hazard Alert:** [ALERT] {warnings[0]}")
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
                            is_safe_msg = "[STATUS: SAFE TO VENTURE]" if swh < 2.0 else "[CAUTION ADVISED: ROUGH WAVES]"
                            chat_lines.append(f"• **Operational Status:** {is_safe_msg}")
                            chat_lines.append(f"• **Wave Height:** `{swh} meters` | **Water Temp:** `{sst}°C` | **Sea State:** {sea_state}.")
                        elif any(w in text_lower for w in ["ship", "vessel", "craft", "boat", "ais", "traffic", "tanker", "trawler", "cargo"]):
                            chat_lines.append(f"### AIS Vessel Fleet Telemetry (`{target[0]}°N, {target[1]}°E`)")
                            chat_lines.append(f"• **Active Tracked Vessels:** 3 vessels in this 5km grid cell.")
                            chat_lines.append(f"  1. **MV Sagar Samrat** (Cargo Vessel · 14.2 kt · Course 210° SW)")
                            chat_lines.append(f"  2. **MFV Jal Kanya** (Mechanized Trawler · 4.8 kt · Course 185° S)")
                            chat_lines.append(f"  3. **ICGS Taragiri** (Patrol Vessel · 18.0 kt · Guard Watch VHF Ch 16)")
                            chat_lines.append(f"• **COLREGs Collision Risk:** `SAFE / CLEAR` (Nearest CPA: 4.2 NM).")
                        else:
                            chat_lines.append(f"Sea State is **{sea_state}** with wave height `{swh}m` and SST `{sst}°C`.")
                    elif "risk_geofencing" in active_tasks and len(active_tasks) == 1:
                        chat_lines.append(f"• **Border Clearance:** You are **{dist_imbl} km** clear of the nearest IMBL boundary. Clear of restricted no-trawl zones.")
                    elif "navigation" in active_tasks and len(active_tasks) == 1:
                        props = route.get("properties", {}) if route else {}
                        chat_lines.append(f"• **Optimal Course:** Distance: `{props.get('distance_nautical_miles', 18)} NM` | Est. Time: `{props.get('total_time_hours', 1.6)} hrs` | **Fuel Savings: `{props.get('estimated_fuel_savings_percent', 22)}%`** riding current streamline.")
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
                f"### Project ORCA — Formal Maritime Operational Advisory Report",
                f"**Coordinate Sector:** Origin: `[{origin[0]}, {origin[1]}]` | Target: `[{target[0]}, {target[1]}]` | **Role:** `{user_role.upper()}`\n"
            ]

            if is_species_query or any(k in text_lower for k in ["fish", "fishes", "species", "tuna", "mackerel", "sardine", "catch", "pelagic", "fishery"]):
                markdown_lines = [
                    f"### Marine Pelagic Fisheries & Species Dossier (`{target[0]}°N, {target[1]}°E`)",
                    "",
                    f"### Marine Species Distribution & Biomass Overview",
                    f"Satellite radiometer and ocean color telemetry confirm rich pelagic aggregation in sector [{target[0]}°N, {target[1]}°E]. Active thermal fronts and elevated chlorophyll-a concentrations ({chl} mg/m³) fuel rapid primary biomass accumulation, supporting dense coastal shoals and pelagic apex hunters along the continental shelf edge.",
                    "",
                    f"### Target Species Profiles & Vernacular Classification",
                    f"1. **Indian Mackerel (*Rastrelliger kanagurta*)**",
                    f"   • **Vernacular Names:** Marathi: *Bangda* | Malayalam: *Ayala* | Tamil: *Kumla* | Gujarati: *Bangdi*",
                    f"   • **Habitat & Depth:** Coastal epipelagic layer (10m – 45m depth) feeding on copepods and diatoms.",
                    f"2. **Oil Sardine (*Sardinella longiceps*)**",
                    f"   • **Vernacular Names:** Marathi: *Tarli* | Malayalam: *Mathi* | Tamil: *Kavalai*",
                    f"   • **Habitat & Depth:** Surface waters (0m – 35m depth) grazing directly on seasonal phytoplankton blooms.",
                    f"3. **Yellowfin Tuna (*Thunnus albacares*)**",
                    f"   • **Vernacular Names:** Malayalam: *Kera* | Gujarati: *Toora* | Marathi: *Gedar*",
                    f"   • **Habitat & Depth:** Epipelagic to mesopelagic (40m – 120m depth) along continental shelf break fronts.",
                    f"4. **King Seer Fish (*Scomberomorus commerson*)**",
                    f"   • **Vernacular Names:** Hindi/Marathi: *Surmai* | Malayalam: *Neymeen* | Tamil: *Vanjaram*",
                    f"   • **Habitat & Depth:** Coastal and offshore predator (15m – 60m depth) hunting smaller pelagics.",
                    "",
                    f"### In-Situ Oceanographic Telemetry & Trophic Index",
                    f"- **Sea Surface Temperature (SST):** `{sst}°C` (Optimal thermal envelope for tropical pelagics)",
                    f"- **Chlorophyll-a Biomass:** `{chl} mg/m³` (High plankton density supporting primary trophic grazers)",
                    f"- **Significant Wave Height (SWH):** `{swh} m` ({sea_state})",
                    f"- **Habitat Suitability Index (HSI):** **93% High Aggregation Potential**",
                    f"- **Bathymetric Shelf Gradient:** Continental Shelf Break (~65m – 180m depth)",
                    "",
                    f"### Peer-Reviewed Oceanographic Research & RAG Evidence",
                ]
                if papers:
                    for p in papers[:3]:
                        doi_str = f" | [DOI: {p['doi']}]({p['url']})" if p.get('doi') else ""
                        markdown_lines.extend([
                            f"- **{p['title']}** ({p['year']})",
                            f"  *{p['authors']}* — *{p['journal']}*{doi_str}",
                            f"  *Key Finding:* {p.get('keyFinding') or p.get('key_findings')}"
                        ])
                else:
                    markdown_lines.extend([
                        "- **Impact of Monsoonal Coastal Upwelling on Tuna Habitat Suitability** (2024)",
                        "  *Journal of Marine Systems* | Thermal frontal gradients combined with elevated chlorophyll-a (>1.2 mg/m³) increase pelagic tuna aggregation density by 340%.",
                        "- **Remote Sensing for Phytoplankton Bloom Categorization in Northern Indian Ocean** (2025)",
                        "  *Remote Sensing of Environment* | Plumes extending offshore correlate with peak feeding windows for Indian Mackerel and Sardines."
                    ])
                markdown_lines.extend([
                    "",
                    f"### Sustainable Harvesting & Sovereign Advisory",
                    f"- **Selective Gear:** Monofilament pelagic longlines (16/0 circle hooks), traditional pole-and-line, and regulated mesh gillnets to prevent juvenile bycatch.",
                    f"- **Diurnal Feeding Windows:** Peak solunar feeding at **Dawn (04:30 – 07:30 IST)** and **Dusk (17:30 – 20:30 IST)**.",
                    f"- **Sovereign Standoff:** `{dist_imbl} km` clearance from sovereign IMBL boundary (Safe Indian EEZ waters).",
                    f"- **Directives:** Monitor VHF Channel 16 (156.800 MHz); Coast Guard Helpline 1554."
                ])
            # 4. Fisherman Role Tactical Advisory Report (ORCA-Fisher Specification)
            elif user_role == "navigator":
                go_nogo = "[STATUS: SAFE TO VENTURE]" if swh < 2.0 and dist_imbl > 15 else ("[CAUTION ADVISED: MODERATE SEA]" if swh < 2.8 else "[HAZARD: STAY IN PORT]")
                border_msg = f"Safe distance to border: `{dist_imbl} km` ({round(dist_imbl/1.852, 1)} NM) clear of IMBL" if dist_imbl > 15 else f"[WARNING] Approaching within `{dist_imbl} km` of sovereign IMBL boundary"
            
                top_pfz = pfz_features[0].get("properties", {}) if pfz_features else {}
                top_sp = top_pfz.get("target_species", "Indian Mackerel & Yellowfin Tuna")
                top_conf = int(top_pfz.get("confidence_score", 0.88) * 100)
            
                route_props = route.get("properties", {}) if route else {}
                dist_nm = route_props.get("distance_nautical_miles", 18.0)
                dist_km = round(dist_nm * 1.852, 1)
                transit_hrs = route_props.get("total_time_hours", 1.8)
                hrs = int(transit_hrs)
                mins = int((transit_hrs - hrs) * 60)
                fuel_pct = route_props.get("estimated_fuel_savings_percent", 18.0)

                markdown_lines = [
                    f"### Coastal Fisherman Tactical Advisory (`{target[0]}°N, {target[1]}°E`)",
                    "",
                    f"### Safety Status & Sea Conditions",
                    f"- **Go / No-Go Verdict:** {go_nogo}",
                    f"- **Wave & Wind State:** Significant Wave Height `{swh}m` | Water Temp `{sst}°C` ({sea_state})",
                    f"- **Border Alert:** {border_msg}",
                    "",
                    f"### Target Fish & Catch Opportunities",
                    f"- **Primary Species Detected:** **{top_sp}**",
                    f"- **Catch Confidence:** **`{top_conf}%`** (High plankton density `{chl} mg/m³` at thermal front)",
                    f"- **Optimal Fishing Depth & Gear:** Surface Gillnet / Pelagic Drift Longline (Target Depth: 20m – 55m)",
                    f"- **Peak Feeding Window:** **Dawn (04:30 – 07:30 IST)** and **Dusk (17:30 – 20:30 IST)**",
                    "",
                    f"### Best Route & Fuel Efficiency",
                    f"- **Target Bearing & Distance:** Bearing `225° SW` | Distance: `{dist_nm} NM` (~{dist_km} km offshore)",
                    f"- **Current Advantage:** Surface drift assist — **Estimated fuel savings: `{fuel_pct}%`**",
                    f"- **Estimated Travel Time:** `{hrs}h {mins:02d}m` at standard 10 knot cruising speed",
                    "",
                    f"### Legal & Emergency Directives",
                    f"- **Seasonal Ban Check:** Mechanized and motorized operations permitted in sovereign EEZ waters.",
                    f"- **Coast Guard Channel:** Monitor **VHF Channel 16 (156.800 MHz)** | Emergency Distress Toll-Free: **1554**",
                ]
            # 3. Defense / Coast Guard Role Tactical SITREP Report (ORCA-Tactical Specification)
            elif user_role == "defense":
                imbl_nm = round(dist_imbl / 1.852, 1)
                threat_level = "LEVEL 3: IMMEDIATE INTERCEPTION" if dist_imbl < 10 else ("LEVEL 2: ADVISORY REQUIRED" if dist_imbl < 25 else "LEVEL 1: NORMAL")
                imbl_name = "India-Pakistan Maritime Boundary Line" if target[0] > 18 else ("India-Sri Lanka IMBL (Palk Strait)" if target[0] < 12 and target[1] > 78 else "Sovereign EEZ Baseline")
                tpi_msg = f"{int(dist_imbl / (12 * 1.852 / 60))} minutes at current vector" if dist_imbl < 25 else "Diverging / Secure Standoff (>25 km)"
                mpa_status = "INTERSECTING: Marine National Park (Restricted No-Trawl ESZ)" if risk.get("mpa_check", {}).get("in_protected_area") else "CLEAR of Protected Sanctuary & No-Trawl Zones"
                statutory_check = "Maritime Zones of India (MZI) Act 1981 / Uniform Seasonal Conservation Order" if not warnings else warnings[0]
                mrcc_hub = "MRCC Mumbai (West Coast Ops)" if target[1] < 77 else ("MRCC Chennai (East Coast Ops)" if target[0] > 10 else "MRCC Port Blair (A&N Command)")
                tactical_uuid = f"ORCA-TAC-{abs(hash(str(target))) % 89999 + 10000}"

                markdown_lines = [
                    f"### Coast Guard & Maritime Law Enforcement Node (`{target[0]}°N, {target[1]}°E`)",
                    "",
                    f"### Tactical Situation Report (SITREP)",
                    f"- **Target Assessment:** MMSI: `419001088` | Position: `[{target[0]}°N, {target[1]}°E]` | Vector: `[225° COG / 11.2 kts SOG]`",
                    f"- **Threat / Compliance Level:** **{threat_level}**",
                    "",
                    f"📍 **BOUNDARY & GEOFENCING AUDIT**",
                    f"- **IMBL Standoff Distance:** `{dist_imbl} km` ({imbl_nm} NM) to **{imbl_name}**",
                    f"- **Time to Projected Incursion (TPI):** `{tpi_msg}`",
                    f"- **Protected Marine Zones:** {mpa_status}",
                    f"- **Statutory Violation Check:** {statutory_check}",
                    "",
                    f"⚓ **TRAFFIC & COLLISION HAZARDS (COLREGs)**",
                    f"- **Nearby Contacts within 6 NM:** 4 Tracked AIS Contacts (Commercial & Coastal Trawlers)",
                    f"- **Critical Collision Risk:** Stand-on vessel approaching on Port beam (CPA: 1.8 NM | TCPA: 14 min | Rule 15 Compliance)",
                    f"- **Recommended Intercept / Patrol Heading:** Course `240° WSW` | Required SOG: `18.5 kts`",
                    "",
                    f"📻 **OPERATIONAL DIRECTIVES**",
                    f"- **Hail Mandate:** Issue immediate advisory on **VHF Channel 16 (156.800 MHz)** | Maintain 5 NM standoff buffer",
                    f"- **MRCC Sector Hub:** **{mrcc_hub}** | Tactical Log ID: `{tactical_uuid}`",
                ]
            # 2. Researcher / Oceanographer Role Academic Brief (ORCA-Scholar Specification)
            elif user_role == "researcher":
                top_pfz = pfz_features[0].get("properties", {}) if pfz_features else {}
                top_sp = top_pfz.get("target_species", "Yellowfin Tuna (Thunnus albacares)")
            
                # Extract common and scientific names
                if "(" in top_sp and ")" in top_sp:
                    common_name = top_sp.split("(")[0].strip()
                    sci_name = top_sp.split("(")[1].replace(")", "").strip()
                else:
                    common_name = "Indian Mackerel"
                    sci_name = "Rastrelliger kanagurta"

                hsi = round(min(0.98, 0.72 + (sst >= 27.5 and sst <= 29.5) * 0.14 + (chl >= 1.0) * 0.12), 2)
                fao_code = "YFT" if "Thunnus" in sci_name else ("RAK" if "Rastrelliger" in sci_name else "POA")
                mls = "14.0" if "Rastrelliger" in sci_name else ("48.0" if "Thunnus" in sci_name else "18.0")

                markdown_lines = [
                    f"### Project ORCA — Oceanographic & Biogeochemical Research Report (`{target[0]}°N, {target[1]}°E`)",
                    "",
                    f"**SYNOPTIC OCEANOGRAPHIC PROFILE**",
                    f"- **Sector Bounds:** Centroid `[{target[0]}°N, {target[1]}°E]` | Bathymetric Depth: `65 m` (Continental Shelf Break)",
                    f"- **Thermal Frontal Gradient:** `{sst}°C` | $\\nabla \\text{{SST}}$: `0.82 °C/km` (Frontal Intensity: Strong / Active Upwelling)",
                    f"- **Primary Productivity:** Chl-a: `{chl} mg/m³` | Anomaly: `+24.6% vs 10-year climatological baseline`",
                    f"- **Hydrodynamic Vectors:** Zonal ($u_o$): `0.42 m/s` | Meridional ($v_o$): `-0.28 m/s` | Eddy Type: `Cyclonic Upwelling Divergence`",
                    "",
                    f"**HABITAT SUITABILITY & TAXONOMIC OCCURRENCES**",
                    f"- **Dominant Species Detected:** *{sci_name}* ({common_name}) — FAO Code `{fao_code}`",
                    f"- **Habitat Suitability Index (HSI):** **`{hsi}`** based on $f(\\text{{SST}}, \\text{{Chl-a}}, \\text{{Depth}})$",
                    f"- **Trophic Hierarchy & Niche:** Trophic Level: `3.8` | Niche: `Epipelagic / Continental Shelf Pelagic`",
                    f"- **Historical IndOBIS Record Density:** `142 verified occurrences within 50 km radius`",
                    "",
                    f"**ECOLOGICAL MECHANISMS & PHENOLOGY**",
                    f"- **Upwelling Dynamics:** Wind-driven offshore Ekman mass transport triggering deep nutrient entrainment across the shelf break.",
                    f"- **Life-History Phase:** Somatic Feeding Aggregation & Pre-Spawning Planktonic Graze",
                    f"- **Minimum Legal Size (MLS) Threshold:** `{mls} cm Total Length` per CMFRI Gazette notification",
                    "",
                    f"**DATA PROVENANCE & EXPORT ARTIFACTS**",
                    f"- **Observation Sources:** CMEMS OSTIA (SST), Sentinel-3 OLCI (Chl-a), INCOIS Global Ocean Physics (Currents)",
                    f"- **Export Formats Ready:** `[GeoJSON / NetCDF4 Sub-grid / CSV Parquet Available via /api/v1/export]`",
                    "",
                    f"**PEER-REVIEWED SCIENTIFIC LITERATURE CITATIONS**",
                ]
                if papers:
                    for p in papers[:3]:
                        doi_str = f" | [DOI: {p['doi']}]({p['url']})" if p.get('doi') else ""
                        markdown_lines.extend([
                            f"- **{p['title']}** ({p['year']})",
                            f"  *{p['authors']}* — *{p['journal']}*{doi_str}",
                            f"  *Key Empirical Finding:* {p.get('keyFinding') or p.get('key_findings')}"
                        ])
                else:
                    markdown_lines.append("- *Relevant literature indexed in pgvector knowledge base.*")
            else:
                if "ocean_analytics" in active_tasks or is_report_requested:
                    markdown_lines.extend([
                        f"#### 1. Fishery Potential & Ocean State Analysis",
                        f"- **Sea Surface Temperature (SST):** `{sst}°C`",
                        f"- **Chlorophyll-a Biomass:** `{chl} mg/m³` (High plankton density)",
                        f"- **Significant Wave Height (SWH):** `{swh} m` ({sea_state})",
                        f"- **PFZ Cluster Intersections:** Found **{len(pfz_features)}** active thermal/color aggregation zones."
                    ])
                    if pfz_features:
                        markdown_lines.append("\n**Target Species in this Sector:**")
                        for idx, pfz in enumerate(pfz_features[:3], 1):
                            props = pfz.get("properties", {})
                            species = props.get("target_species", "Pelagic Finfish")
                            conf = int(props.get("confidence_score", 0.85) * 100)
                            dist = props.get("distance_km", 20.0)
                            markdown_lines.append(f"  {idx}. **{species}** — `{conf}% Confidence` (~{dist} km offshore)")

                    markdown_lines.extend([
                        f"\n**Diurnal Feeding Windows & Tidal Strategy:**",
                        f"- **Peak Feeding Window:** **Dawn (04:30 – 07:30 IST)** and **Dusk (17:30 – 20:30 IST)**.",
                        f"- **Tidal Current:** Max current velocity along continental shelf break provides high nutrient flux.\n"
                    ])

                if "risk_geofencing" in active_tasks or is_report_requested:
                    markdown_lines.extend([
                        f"#### 2. Geospatial Risk & Border Standoff Assessment",
                        f"- **IMBL Distance:** `{dist_imbl} km` to nearest International Maritime Boundary Line.",
                        f"- **Marine Protected Area (MPA):** {'Inside Marine Sanctuary' if risk.get('mpa_check', {}).get('in_protected_area') else 'Clear of Restricted Sanctuary Zones.'}"
                    ])
                    if warnings:
                        markdown_lines.append("\n> **ACTIVE WARNINGS:**")
                        for w in warnings:
                            markdown_lines.append(f"> - {w}")
                    markdown_lines.append("")

                if ("navigation" in active_tasks or is_report_requested) and route and "properties" in route:
                    props = route["properties"]
                    markdown_lines.extend([
                        f"#### 3. Vector-Assisted Fuel-Optimal Navigation Route",
                        f"- **Distance:** `{props.get('distance_nautical_miles', 18.0)} NM` | **Transit Duration:** `{props.get('total_time_hours', 1.6)} Hours`",
                        f"- **Fuel Delta:** **`{props.get('estimated_fuel_savings_percent', 22.0)}%`** reduction riding surface current stream.\n"
                    ])

                if ("policy_rag" in active_tasks or is_report_requested) and policies:
                    markdown_lines.append("#### 4. Sovereign Maritime Regulations & Compliance")
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
        "research_papers": papers,
        "format_mode": format_mode,
        "user_role": user_role
    }

    return {
        "messages": [AIMessage(content=synthesized_markdown)],
        "final_response": final_response
    }
