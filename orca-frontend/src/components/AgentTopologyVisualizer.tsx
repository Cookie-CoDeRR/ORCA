"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Brain, Waves, ShieldAlert, Compass, BookOpen, Sparkles,
  Play, RotateCcw, CheckCircle2, AlertTriangle,
  ArrowLeft, Layers, FileCode2, Search,
  Fish, Wind, Check, Download, ChevronRight,
  ZoomIn, ZoomOut, Maximize2, X, Clock, Database, CheckCheck,
  Send, Server
} from "lucide-react";

// ─── Types & Definitions ──────────────────────────────────────────────────────

export type AgentId =
  | "orchestrator"
  | "ocean"
  | "species"
  | "hazard"
  | "weather"
  | "risk"
  | "navigation"
  | "research"
  | "policy"
  | "validation"
  | "synthesizer";

export interface AgentDefinition {
  id: AgentId;
  label: string;
  role: string;
  category: "core" | "specialist" | "validation";
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  toolsUsed: string[];
  defaultInputs: string[];
  defaultOutputs: string[];
  dataSources: string[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  source: AgentId;
  target?: AgentId;
  message: string;
  type: "dispatch" | "result" | "validation" | "synthesis";
  latencyMs: number;
}

export interface PresetScenario {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  query: string;
  activeSpecialists: AgentId[];
  logs: Omit<AuditLogEntry, "id" | "timestamp">[];
  finalOutput: string;
  edgePayloads: Record<string, { summary: string; variables: string[]; source: string }>;
  agentSpecificData: Partial<Record<AgentId, { task: string; inputs: string[]; output: string; latency: number }>>;
}

// ─── Agent Registry ───────────────────────────────────────────────────────────

const AGENTS_REGISTRY: Record<AgentId, AgentDefinition> = {
  orchestrator: {
    id: "orchestrator",
    label: "ORCA Orchestrator",
    role: "Breaks user request into subtasks and coordinates specialist execution.",
    category: "core",
    icon: Brain,
    toolsUsed: ["intent_classifier", "task_planner", "agent_router"],
    defaultInputs: ["User Natural Language Query", "Spatial Coordinates", "Temporal Bounds"],
    defaultOutputs: ["Structured Task DAG", "Agent Invocation Manifest"],
    dataSources: ["Internal Task Planner", "Registry DB"],
  },
  ocean: {
    id: "ocean",
    label: "Ocean Agent",
    role: "Analyzes oceanographic parameters (SST, Chlorophyll-a, salinity, currents).",
    category: "specialist",
    icon: Waves,
    toolsUsed: ["netcdf_reader", "sst_anomaly_extractor", "current_vector_calculator"],
    defaultInputs: ["MODIS/VIIRS SST", "OCM-2 Chlorophyll", "OSCAR Currents"],
    defaultOutputs: ["Thermal front analysis", "Chlorophyll anomaly score", "Current drift vector"],
    dataSources: ["INCOIS Ocean Portal", "Copernicus Marine (CMEMS)", "Sentinel-3 OLCI"],
  },
  species: {
    id: "species",
    label: "Species & Fisheries Agent",
    role: "Evaluates marine species habitat, biological suitability, and PFZ cues.",
    category: "specialist",
    icon: Fish,
    toolsUsed: ["habitat_suitability_model", "pfz_index_engine", "catch_history_query"],
    defaultInputs: ["Species Biology Matrix", "Ocean Thermal Gradient", "Historical Catch Records"],
    defaultOutputs: ["Yellowfin Tuna suitability score (0-1)", "Aggregation probability", "Depth band"],
    dataSources: ["INCOIS PFZ Advisories", "CMFRI Catch Logs", "FishBase Taxonomy"],
  },
  hazard: {
    id: "hazard",
    label: "Hazard & Safety Agent",
    role: "Assesses marine hazards, severe swell, high wind warnings, and vessel risks.",
    category: "specialist",
    icon: AlertTriangle,
    toolsUsed: ["swell_surge_index", "hazard_geofence_checker", "cyclone_risk_estimator"],
    defaultInputs: ["Wave Watch III Forecasts", "IMD Cyclone Bulletins", "Swell Surge Alerts"],
    defaultOutputs: ["Hazard Level Index (1-5)", "Operational Advisory", "Safe distance buffer"],
    dataSources: ["IMD Marine Warnings", "INCOIS Early Warning Center", "ECMWF Wave Model"],
  },
  weather: {
    id: "weather",
    label: "Weather Agent",
    role: "Analyzes atmospheric conditions, surface winds, barometric pressure, and squalls.",
    category: "specialist",
    icon: Wind,
    toolsUsed: ["gfs_wind_extractor", "barometric_trend_analyzer", "precipitation_radar"],
    defaultInputs: ["GFS 0.25° Wind Grids", "INSAT-3D Satellite Imagery", "Barometric pressure logs"],
    defaultOutputs: ["Beaufort scale rating", "Gust speed (knots)", "Precipitation probability"],
    dataSources: ["India Meteorological Dept (IMD)", "NOAA GFS", "INSAT-3DR Rapid Scan"],
  },
  risk: {
    id: "risk",
    label: "Risk & Geo Agent",
    role: "Performs spatial geofence, EEZ boundary, and maritime boundary (IMBL) checks.",
    category: "specialist",
    icon: ShieldAlert,
    toolsUsed: ["imbl_proximity_calculator", "eez_boundary_verifier", "mpa_geofence_checker"],
    defaultInputs: ["Vessel GPS Coordinates", "IMBL Vector Line", "Indian EEZ Shapefile"],
    defaultOutputs: ["Distance to IMBL (nm)", "Sovereign jurisdiction status", "Geofence alert level"],
    dataSources: ["Survey of India Maritime Limits", "DG Shipping Geofence DB", "UNCLOS EEZ Base"],
  },
  navigation: {
    id: "navigation",
    label: "Navigation Agent",
    role: "Computes optimal navigation routes, heading, fuel savings, and current assist.",
    category: "specialist",
    icon: Compass,
    toolsUsed: ["isochrone_router", "current_efficiency_evaluator", "fuel_burn_estimator"],
    defaultInputs: ["Departure Port", "Destination Coordinates", "Surface Current Vector Field"],
    defaultOutputs: ["Recommended heading", "Estimated transit time", "Projected fuel efficiency savings %"],
    dataSources: ["Navionics Chart Basemap", "INCOIS Surface Currents", "AIS Density Maps"],
  },
  research: {
    id: "research",
    label: "Research Agent",
    role: "Retrieves peer-reviewed oceanographic literature and empirical scientific evidence.",
    category: "specialist",
    icon: BookOpen,
    toolsUsed: ["rag_evidence_retriever", "semantic_literature_search", "citation_validator"],
    defaultInputs: ["Ecosystem Query Vectors", "Regional Marine Taxa Index"],
    defaultOutputs: ["Evidence corroboration score", "Literature citations", "Empirical thresholds"],
    dataSources: ["ORCA Scientific RAG Index", "INCOIS Technical Bulletins", "Springer/Elsevier Marine"],
  },
  policy: {
    id: "policy",
    label: "Policy & Regulations Agent",
    role: "Checks regulatory bans, seasonal monsoon restrictions, and fishing permits.",
    category: "specialist",
    icon: FileCode2,
    toolsUsed: ["ban_calendar_evaluator", "gear_restriction_checker", "permit_validator"],
    defaultInputs: ["Calendar Date", "Craft Category (Mechanized/Motorized)", "Coastal State Rules"],
    defaultOutputs: ["Ban applicability status", "Permitted gear types", "Regulatory reference"],
    dataSources: ["Dept of Fisheries Notification Gazettes", "CRZ & State Maritime Acts"],
  },
  validation: {
    id: "validation",
    label: "Cross-Agent Validation",
    role: "Compares findings across agents, verifies evidence, and resolves contradictions.",
    category: "validation",
    icon: CheckCircle2,
    toolsUsed: ["consensus_matrix_evaluator", "evidence_source_verifier", "uncertainty_scorer"],
    defaultInputs: ["Specialist Agent Output Payloads", "Research Evidence Citations"],
    defaultOutputs: ["Consensus Agreement (0-100%)", "Contradiction flags", "Validation Confidence"],
    dataSources: ["Cross-Agent Consensus Engine", "Automated Fact-Checking Layer"],
  },
  synthesizer: {
    id: "synthesizer",
    label: "Synthesizer",
    role: "Combines validated multi-agent findings into a definitive, evidence-backed advisory.",
    category: "core",
    icon: Sparkles,
    toolsUsed: ["consensus_synthesizer", "structured_advisory_formatter"],
    defaultInputs: ["Cross-Validated Specialist Findings", "Spatial Bounds", "Confidence Index"],
    defaultOutputs: ["Final Actionable Maritime Advisory", "Structured GeoJSON metadata"],
    dataSources: ["ORCA Synthesis Engine"],
  },
};

// ─── Demo Scenarios ───────────────────────────────────────────────────────────

const DEMO_SCENARIOS: PresetScenario[] = [
  {
    id: "tuna",
    name: "Tuna PFZ Verification",
    icon: Fish,
    query: "Can boats fish southwest of Veraval for Yellowfin Tuna?",
    activeSpecialists: ["ocean", "species", "risk", "navigation", "research"],
    finalOutput:
      "Yes, craft can safely operate southwest of Veraval. Favorable oceanographic conditions for Yellowfin Tuna (PFZ) are confirmed with SST at 28.2°C and Chlorophyll front at 0.35 mg/m³. The target position is 42 nm southwest of Veraval harbor, well within the Indian sovereign EEZ (38 nm clear of the IMBL). Southward current assistance provides ~14% fuel efficiency on outbound heading 224°.",
    edgePayloads: {
      "orchestrator->ocean": { summary: "Ocean State Request", variables: ["SST", "Chlorophyll-a", "Wave Height"], source: "Internal Dispatch" },
      "orchestrator->species": { summary: "Habitat Suitability Request", variables: ["Yellowfin Tuna Biomass", "Thermal Gradient"], source: "Internal Dispatch" },
      "orchestrator->risk": { summary: "Maritime Boundary Check", variables: ["Coordinates", "IMBL Distance", "EEZ"], source: "Internal Dispatch" },
      "orchestrator->navigation": { summary: "Route Optimization", variables: ["Veraval Port Coordinates", "Current Assistance"], source: "Internal Dispatch" },
      "orchestrator->research": { summary: "Scientific Literature Retrieval", variables: ["Thunnus albacares Arabian Sea Cues"], source: "Internal Dispatch" },
      "ocean->validation": { summary: "Thermal & Color Front Data", variables: ["SST: 28.2°C", "Chl-a: 0.35 mg/m³", "Wave: 1.2m"], source: "INCOIS OCM-2 & MODIS" },
      "species->validation": { summary: "Biological Suitability Score", variables: ["Habitat Score: 0.88", "Depth: 60-120m"], source: "INCOIS PFZ Model" },
      "risk->validation": { summary: "Boundary Verification Result", variables: ["Distance to IMBL: 38.4 nm", "Zone: Sovereign EEZ"], source: "Survey of India EEZ" },
      "navigation->validation": { summary: "Navigation Trajectory Result", variables: ["Heading: 224°", "Fuel Savings: 14.2%"], source: "Navionics & OSCAR" },
      "research->validation": { summary: "Empirical Validation Evidence", variables: ["Literature Match: 94%", "DO Threshold: >2.1 ml/L"], source: "ORCA Literature DB" },
      "validation->synthesizer": { summary: "Consensus Approved", variables: ["Consensus Agreement: 100%", "Contradictions: 0"], source: "Cross-Agent Validator" },
    },
    agentSpecificData: {
      orchestrator: { task: "Deconstruct Tuna PFZ query into ocean, habitat, geofence, and route tasks.", inputs: ["Query text", "Target: SW Veraval"], output: "5 specialist subtasks dispatched.", latency: 18 },
      ocean: { task: "Extract SST fronts and chlorophyll gradients southwest of Veraval.", inputs: ["INCOIS SST 28.2°C", "Chlorophyll 0.35 mg/m³", "Waves 1.2m"], output: "Stable thermal front identified indicating forage concentration.", latency: 112 },
      species: { task: "Assess habitat suitability index for Thunnus albacares.", inputs: ["SST range 27-29°C", "Thermal gradient delta 0.6°C/km"], output: "PFZ suitability score: 0.88 (High commercial potential).", latency: 95 },
      risk: { task: "Calculate distance to International Maritime Boundary Line (IMBL).", inputs: ["Target: 20.45°N, 69.80°E", "IMBL baseline"], output: "Distance: 38.4 nm inside Indian EEZ. No border violation risk.", latency: 74 },
      navigation: { task: "Calculate efficient route from Veraval harbor with current assistance.", inputs: ["Speed: 10 kn", "Current: 0.8 kn southwards"], output: "Optimum heading 224°, estimated transit 3.8h, 14.2% fuel reduction.", latency: 86 },
      research: { task: "Corroborate findings against historical Arabian Sea tuna forage studies.", inputs: ["Arabian Sea PFZ research corpus", "Dissolved Oxygen profiles"], output: "Findings confirmed by CMFRI 2021 and INCOIS technical reports.", latency: 130 },
      validation: { task: "Verify cross-agent consensus and evidence validity.", inputs: ["5 specialist output vectors"], output: "No spatial or biological conflicts. Consensus score: 1.0.", latency: 42 },
      synthesizer: { task: "Generate comprehensive actionable advisory for vessel master.", inputs: ["Validated consensus payload"], output: "Evidence-backed advisory generated.", latency: 54 },
    },
    logs: [
      { source: "orchestrator", target: "ocean", message: "Dispatched oceanographic analysis for southwest of Veraval.", type: "dispatch", latencyMs: 18 },
      { source: "orchestrator", target: "species", message: "Dispatched Yellowfin Tuna habitat suitability query.", type: "dispatch", latencyMs: 22 },
      { source: "orchestrator", target: "risk", message: "Dispatched IMBL proximity and sovereign EEZ check.", type: "dispatch", latencyMs: 15 },
      { source: "orchestrator", target: "navigation", message: "Dispatched fuel-optimal route computation from Veraval.", type: "dispatch", latencyMs: 20 },
      { source: "orchestrator", target: "research", message: "Dispatched empirical evidence retrieval for tuna forage cues.", type: "dispatch", latencyMs: 24 },
      { source: "ocean", target: "validation", message: "Ocean state confirmed: SST front 28.2°C, Chl-a 0.35 mg/m³.", type: "result", latencyMs: 112 },
      { source: "species", target: "validation", message: "Habitat suitability score 0.88: High aggregation likelihood.", type: "result", latencyMs: 95 },
      { source: "risk", target: "validation", message: "Boundary safe: 38.4 nm inside EEZ clear of IMBL.", type: "result", latencyMs: 74 },
      { source: "navigation", target: "validation", message: "Route planned: Heading 224°, 14% fuel savings with current assist.", type: "result", latencyMs: 86 },
      { source: "research", target: "validation", message: "Peer-reviewed literature corroborates Arabian Sea PFZ alignment.", type: "result", latencyMs: 130 },
      { source: "validation", target: "synthesizer", message: "Cross-agent validation passed. Consensus: 100% agreement.", type: "validation", latencyMs: 42 },
      { source: "synthesizer", message: "Evidence-backed synthesis finalized with 5 verified sources.", type: "synthesis", latencyMs: 54 },
    ],
  },
  {
    id: "cyclone",
    name: "Cyclone Risk Assessment",
    icon: Wind,
    query: "Generate a cyclone risk assessment for southwest Saurashtra coast.",
    activeSpecialists: ["ocean", "weather", "hazard", "research"],
    finalOutput:
      "No immediate tropical cyclone threat detected along the Saurashtra coast in the next 48 hours. A developing deep depression centered 420 nm south-southeast is moving north-northwest at 11 knots. Nearshore wave heights remain manageable at 1.4m to 1.8m, but offshore outer bands are forecast to bring 2.8m swells after 36 hours. Vessels operating beyond 30 nm should maintain HF radio watch.",
    edgePayloads: {
      "orchestrator->ocean": { summary: "Sea Surface State Request", variables: ["Tropical Cyclone Heat Potential", "SST"], source: "Internal Dispatch" },
      "orchestrator->weather": { summary: "Atmospheric Pressure & Winds", variables: ["GFS 850hPa Vorticity", "Barometric Trend"], source: "Internal Dispatch" },
      "orchestrator->hazard": { summary: "Hazard & Swell Surge Index", variables: ["Wave Watch III", "IMD Cyclone Tracks"], source: "Internal Dispatch" },
      "orchestrator->research": { summary: "Historical Cyclone Analogs", variables: ["Arabian Sea Pre-monsoon Cyclones"], source: "Internal Dispatch" },
      "ocean->validation": { summary: "TCHP & SST Report", variables: ["SST: 29.5°C", "TCHP: 65 kJ/cm²"], source: "INCOIS & CMEMS" },
      "weather->validation": { summary: "Pressure & Wind Field", variables: ["Central Pressure: 1002 hPa", "Max Wind: 28 kn"], source: "IMD Synoptic Bulletin" },
      "hazard->validation": { summary: "Swell & Surge Risk Level", variables: ["Nearshore: Low (1)", "Offshore 36h: Moderate (3)"], source: "INCOIS Early Warning" },
      "research->validation": { summary: "Analog Trajectory Match", variables: ["Historical Track Alignment: 88%"], source: "IMD Cyclone e-Atlas" },
      "validation->synthesizer": { summary: "Cyclone Findings Validated", variables: ["No Contradictions", "Risk: Level 2 (Advisory)"], source: "Cross-Agent Validator" },
    },
    agentSpecificData: {
      orchestrator: { task: "Dispatch atmospheric, wave, and historical cyclone evaluation.", inputs: ["Query: Saurashtra coast", "Horizon: 48h"], output: "4 cyclone specialist subtasks dispatched.", latency: 19 },
      ocean: { task: "Compute Tropical Cyclone Heat Potential (TCHP) in the region.", inputs: ["SST: 29.5°C", "Isotherm 26°C depth: 75m"], output: "TCHP at 65 kJ/cm² — capable of sustaining moderate cyclogenesis.", latency: 104 },
      weather: { task: "Analyze IMD synoptic charts and GFS barometric pressure drop.", inputs: ["Surface pressure: 1002 hPa", "Pressure tendency: -1.2 hPa/3h"], output: "Low pressure area intensifying into depression 420 nm south.", latency: 118 },
      hazard: { task: "Evaluate swell propagation and coastal wave surge threats.", inputs: ["Significant wave height: 1.6m", "Peak period: 11s"], output: "Nearshore safe (<2m); offshore swell increase to 2.8m in 36h.", latency: 92 },
      research: { task: "Match current atmospheric parameters against Arabian Sea cyclone analogs.", inputs: ["Track direction: NNW", "Historical season: Pre-monsoon"], output: "Track analog model predicts curve towards Oman/Pakistan.", latency: 125 },
      validation: { task: "Verify consistency across atmospheric and wave forecasts.", inputs: ["4 specialist output payloads"], output: "Consensus achieved: No immediate coastal landfall risk.", latency: 48 },
      synthesizer: { task: "Format maritime cyclone bulletin.", inputs: ["Validated hazard status"], output: "Synthesized marine safety bulletin ready.", latency: 50 },
    },
    logs: [
      { source: "orchestrator", target: "ocean", message: "Dispatched TCHP and sea surface temperature analysis.", type: "dispatch", latencyMs: 19 },
      { source: "orchestrator", target: "weather", message: "Dispatched barometric pressure and wind field assessment.", type: "dispatch", latencyMs: 23 },
      { source: "orchestrator", target: "hazard", message: "Dispatched swell surge and coastal hazard index computation.", type: "dispatch", latencyMs: 17 },
      { source: "orchestrator", target: "research", message: "Dispatched cyclone track analog retrieval.", type: "dispatch", latencyMs: 21 },
      { source: "ocean", target: "validation", message: "SST 29.5°C, TCHP 65 kJ/cm²: Sufficient heat for depression.", type: "result", latencyMs: 104 },
      { source: "weather", target: "validation", message: "Depression center 420 nm south; wind gusts 28 kn.", type: "result", latencyMs: 118 },
      { source: "hazard", target: "validation", message: "Nearshore safe (<2m); offshore swell increases to 2.8m in 36h.", type: "result", latencyMs: 92 },
      { source: "research", target: "validation", message: "Historical analog matches NNW re-curvature away from coast.", type: "result", latencyMs: 125 },
      { source: "validation", target: "synthesizer", message: "Cross-agent validation passed. Risk level: Advisory (Level 2).", type: "validation", latencyMs: 48 },
      { source: "synthesizer", message: "Cyclone safety advisory synthesized for maritime craft.", type: "synthesis", latencyMs: 50 },
    ],
  },
  {
    id: "imbl",
    name: "IMBL Proximity Alert",
    icon: ShieldAlert,
    query: "Verify vessel position relative to the International Maritime Boundary Line.",
    activeSpecialists: ["ocean", "risk", "navigation", "policy"],
    finalOutput:
      "CRITICAL PROXIMITY ALERT: Vessel position (20°12.4'N, 68°34.1'E) is 1.4 nautical miles east of the International Maritime Boundary Line (IMBL). While legally inside Indian sovereign waters, the vessel is within the 2.0 nm High Risk Buffer Zone. Recommend immediate course change to Heading 062° (East-Northeast) to open distance from the boundary.",
    edgePayloads: {
      "orchestrator->risk": { summary: "IMBL Distance Calculation", variables: ["GPS Lat/Long", "IMBL Vector Line"], source: "Internal Dispatch" },
      "orchestrator->navigation": { summary: "Evasive Heading Plan", variables: ["Current Speed", "Turning Radius"], source: "Internal Dispatch" },
      "orchestrator->policy": { summary: "Maritime Detention Regulations", variables: ["UNCLOS Buffer Protocols"], source: "Internal Dispatch" },
      "orchestrator->ocean": { summary: "Current Drift Vector Check", variables: ["Surface Drift Direction"], source: "Internal Dispatch" },
      "risk->validation": { summary: "Proximity Critical Result", variables: ["IMBL Distance: 1.4 nm", "Buffer Status: ALERT"], source: "Survey of India Maritime Line" },
      "navigation->validation": { summary: "Safe Vector Calculated", variables: ["Recommended Heading: 062°", "Clearance: 4.8 nm in 30m"], source: "ORCA Navigation Engine" },
      "policy->validation": { summary: "Detention Risk Warning", variables: ["MHA Guidelines", "Coast Guard Advisory #14"], source: "Ministry of Home Affairs" },
      "ocean->validation": { summary: "Cross-Drift Warning", variables: ["Drift: 1.1 kn Westward (Towards IMBL)"], source: "INCOIS Current Radar" },
      "validation->synthesizer": { summary: "Geofence Alert Validated", variables: ["Unanimous High-Priority Alert"], source: "Cross-Agent Validator" },
    },
    agentSpecificData: {
      orchestrator: { task: "Initiate high-priority IMBL boundary compliance assessment.", inputs: ["Vessel GPS: 20°12.4'N, 68°34.1'E"], output: "4 compliance specialist subtasks dispatched.", latency: 14 },
      risk: { task: "Calculate precise geodesic distance to the IMBL line.", inputs: ["WGS84 Coordinates", "IMBL Treaty Coordinates"], output: "Distance to IMBL: 1.4 nm (Inside 2.0 nm buffer threshold).", latency: 58 },
      navigation: { task: "Compute immediate evasive heading to clear boundary buffer zone.", inputs: ["Current speed: 8 kn", "Drift rate: 1.1 kn west"], output: "Recommended heading: 062° to gain 4.8 nm clearance in 30 min.", latency: 64 },
      policy: { task: "Review Indian Coast Guard advisory on IMBL buffer transgressions.", inputs: ["Gazette notification on sensitive border waters"], output: "Strict compliance required. Violation risks detention under UNCLOS.", latency: 45 },
      ocean: { task: "Check surface currents for westward drift risks towards boundary.", inputs: ["OSCAR surface current grid"], output: "Westward drift of 1.1 knots actively pushing vessel toward IMBL.", latency: 72 },
      validation: { task: "Validate boundary proximity alert and heading safety.", inputs: ["Risk, navigation, policy, and drift vectors"], output: "High-priority alert verified. No contradictory data.", latency: 32 },
      synthesizer: { task: "Generate high-priority border proximity warning.", inputs: ["Validated alert payload"], output: "Border alert synthesized with immediate corrective actions.", latency: 40 },
    },
    logs: [
      { source: "orchestrator", target: "risk", message: "Dispatched high-priority IMBL boundary verification.", type: "dispatch", latencyMs: 14 },
      { source: "orchestrator", target: "navigation", message: "Dispatched evasive heading and clearance calculation.", type: "dispatch", latencyMs: 16 },
      { source: "orchestrator", target: "ocean", message: "Dispatched current drift assessment towards boundary line.", type: "dispatch", latencyMs: 18 },
      { source: "orchestrator", target: "policy", message: "Dispatched maritime border detention protocols check.", type: "dispatch", latencyMs: 15 },
      { source: "risk", target: "validation", message: "Proximity Alert: 1.4 nm from IMBL (Buffer threshold: 2.0 nm).", type: "result", latencyMs: 58 },
      { source: "ocean", target: "validation", message: "Drift warning: 1.1 kn westward surface current pushing toward border.", type: "result", latencyMs: 72 },
      { source: "navigation", target: "validation", message: "Course change computed: Heading 062° opens clearance by 4.8 nm in 30 min.", type: "result", latencyMs: 64 },
      { source: "policy", target: "validation", message: "Advisory: Transgression risk high under Coast Guard guidelines.", type: "result", latencyMs: 45 },
      { source: "validation", target: "synthesizer", message: "Cross-agent validation passed. Unanimous Critical Advisory flag.", type: "validation", latencyMs: 32 },
      { source: "synthesizer", message: "Border alert synthesized with immediate corrective heading.", type: "synthesis", latencyMs: 40 },
    ],
  },
  {
    id: "monsoon",
    name: "Monsoon Restriction Check",
    icon: FileCode2,
    query: "Is mechanized fishing permitted off the Gujarat coast during June-July?",
    activeSpecialists: ["ocean", "weather", "hazard", "policy", "research"],
    finalOutput:
      "RESTRICTED: Mechanized fishing is strictly prohibited in the Gujarat EEZ during the annual 61-day uniform monsoon fishing ban (active June 1 to July 31). This restriction applies to all mechanized trawlers and purse-seiners to protect fish breeding grounds and safeguard fishermen from dangerous rough-sea conditions (significant waves 3.2m to 4.5m). Non-motorized traditional craft are exempt within 12 nm.",
    edgePayloads: {
      "orchestrator->policy": { summary: "Monsoon Ban Calendar Verification", variables: ["Gujarat Fisheries Act", "Dates: June 1 - July 31"], source: "Internal Dispatch" },
      "orchestrator->ocean": { summary: "Rough Sea State Check", variables: ["Monsoon Swell Heights", "Currents"], source: "Internal Dispatch" },
      "orchestrator->weather": { summary: "Southwest Monsoon Wind Speeds", variables: ["Squall Probability", "Winds >35 kn"], source: "Internal Dispatch" },
      "orchestrator->hazard": { summary: "Marine Safety Risk Index", variables: ["Capsizing Hazard", "Rough Sea Alert"], source: "Internal Dispatch" },
      "orchestrator->research": { summary: "Spawning Conservation Evidence", variables: ["Spawning Biomass Protection Data"], source: "Internal Dispatch" },
      "policy->validation": { summary: "Ban Legally Enforced", variables: ["Status: Prohibited", "Craft: Mechanized", "Exempt: Traditional"], source: "Dept of Fisheries Gazette" },
      "ocean->validation": { summary: "High Wave Conditions", variables: ["Wave Height: 3.8m", "Roughness: Severe"], source: "INCOIS Wave Watch" },
      "weather->validation": { summary: "Monsoon Wind Gale", variables: ["Winds: 34-42 kn", "Squall Alert: Active"], source: "IMD Marine Monsoon Unit" },
      "hazard->validation": { summary: "Extreme Safety Hazard", variables: ["Hazard Level: 4/5 (High Capsizing Risk)"], source: "INCOIS Early Warning" },
      "research->validation": { summary: "Spawning Season Evidence", variables: ["Recruitment Protection Index: 92%"], source: "CMFRI Fishery Science Bulletin" },
      "validation->synthesizer": { summary: "Ban Consensus Validated", variables: ["Policy & Safety Unanimously Restrictive"], source: "Cross-Agent Validator" },
    },
    agentSpecificData: {
      orchestrator: { task: "Verify regulatory ban status and maritime safety conditions during monsoon.", inputs: ["Dates: June-July", "Region: Gujarat EEZ"], output: "5 regulatory and safety specialist subtasks dispatched.", latency: 16 },
      policy: { task: "Query uniform 61-day West Coast fishing ban regulations.", inputs: ["Gujarat Fisheries Act 2003", "Central Gazette #2024"], output: "Mechanized ban active June 1 - July 31. Penalty: License suspension.", latency: 52 },
      ocean: { task: "Extract monsoon wave heights and turbulence index.", inputs: ["Significant wave height: 3.8m", "Sea state: Rough (Code 6)"], output: "High wave turbulence incompatible with safe trawling.", latency: 98 },
      weather: { task: "Analyze SW monsoon wind gusts and squall frequency.", inputs: ["Southwest monsoon jet: 36 kn", "Squall frequency: 4/day"], output: "Dangerous gale conditions active along coastal strip.", latency: 88 },
      hazard: { task: "Calculate capsizing risk index for fishing craft <24m.", inputs: ["Wave steepness >0.06", "High wind shear"], output: "Hazard Level 4/5 (Severe risk of vessel capsizing).", latency: 76 },
      research: { task: "Validate biological rationale for juvenile fish recruitment protection.", inputs: ["Pelagic spawning data June-July"], output: "Crucial spawning window; conservation ban justified scientifically.", latency: 114 },
      validation: { task: "Corroborate regulatory restriction with physical ocean safety data.", inputs: ["Policy, ocean, weather, hazard, and research outputs"], output: "100% consensus: Mechanized fishing strictly banned.", latency: 36 },
      synthesizer: { task: "Generate comprehensive seasonal ban and safety advisory.", inputs: ["Validated consensus payload"], output: "Monsoon restriction advisory compiled.", latency: 44 },
    },
    logs: [
      { source: "orchestrator", target: "policy", message: "Dispatched regulatory ban calendar and legal compliance query.", type: "dispatch", latencyMs: 16 },
      { source: "orchestrator", target: "ocean", message: "Dispatched monsoon sea state and wave height analysis.", type: "dispatch", latencyMs: 20 },
      { source: "orchestrator", target: "weather", message: "Dispatched SW monsoon wind velocity and squall frequency check.", type: "dispatch", latencyMs: 18 },
      { source: "orchestrator", target: "hazard", message: "Dispatched vessel stability and capsizing hazard computation.", type: "dispatch", latencyMs: 15 },
      { source: "orchestrator", target: "research", message: "Dispatched spawning biomass and recruitment protection retrieval.", type: "dispatch", latencyMs: 22 },
      { source: "policy", target: "validation", message: "Legal Restriction: 61-day uniform monsoon ban active until July 31.", type: "result", latencyMs: 52 },
      { source: "ocean", target: "validation", message: "Sea state severe: Significant wave height 3.8m, period 9s.", type: "result", latencyMs: 98 },
      { source: "weather", target: "validation", message: "Wind warning: SW gale 34-42 knots, high squall probability.", type: "result", latencyMs: 88 },
      { source: "hazard", target: "validation", message: "Hazard Level 4/5: Extreme capsizing risk for mechanized craft.", type: "result", latencyMs: 76 },
      { source: "research", target: "validation", message: "Scientific corroboration: Critical spawning window for pelagic species.", type: "result", latencyMs: 114 },
      { source: "validation", target: "synthesizer", message: "Validation confirmed: Unanimous restriction recommendation.", type: "validation", latencyMs: 36 },
      { source: "synthesizer", message: "Monsoon restriction advisory synthesized.", type: "synthesis", latencyMs: 44 },
    ],
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AgentTopologyVisualizer() {
  const [activeScenario, setActiveScenario] = useState<PresetScenario>(DEMO_SCENARIOS[0]);
  const [customQuery, setCustomQuery] = useState(DEMO_SCENARIOS[0].query);
  const [isRunning, setIsRunning] = useState(false);
  const [executionStep, setExecutionStep] = useState(0);
  const [displayedLogs, setDisplayedLogs] = useState<AuditLogEntry[]>([]);
  const [activeNodes, setActiveNodes] = useState<AgentId[]>([]);
  const [activeEdges, setActiveEdges] = useState<{ source: AgentId; target: AgentId }[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentId | null>("ocean");
  const [selectedEdge, setSelectedEdge] = useState<{ source: AgentId; target: AgentId } | null>(null);
  const [showRegistryDrawer, setShowRegistryDrawer] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // ─── Dynamic Layout Engine (Left-to-Right Horizontal DAG matching user design) ───

  const layoutNodes = useMemo(() => {
    const nodes: (AgentDefinition & { x: number; y: number })[] = [];

    // Stage 1: Orchestrator (Far Left)
    nodes.push({ ...AGENTS_REGISTRY.orchestrator, x: 11, y: 50 });

    // Stage 2: Specialist Agents (Stacked Vertically in Column 2)
    const specialists = activeScenario.activeSpecialists;
    const numSpec = specialists.length;
    specialists.forEach((spId, idx) => {
      let y = 50;
      if (numSpec > 1) {
        const topY = numSpec >= 5 ? 16 : (numSpec === 4 ? 20 : 28);
        const bottomY = numSpec >= 5 ? 84 : (numSpec === 4 ? 80 : 72);
        y = topY + ((bottomY - topY) / (numSpec - 1)) * idx;
      }
      nodes.push({ ...AGENTS_REGISTRY[spId], x: 40, y });
    });

    // Stage 3: Cross-Agent Validation (Middle-Right)
    nodes.push({ ...AGENTS_REGISTRY.validation, x: 69, y: 50 });

    // Stage 4: Synthesizer (Far Right)
    nodes.push({ ...AGENTS_REGISTRY.synthesizer, x: 89, y: 50 });

    return nodes;
  }, [activeScenario]);

  // List of active edges in the DAG
  const graphEdges = useMemo(() => {
    const edges: { source: AgentId; target: AgentId; label?: string }[] = [];
    const specIds = activeScenario.activeSpecialists;
    
    specIds.forEach(sp => {
      // Orchestrator -> Specialist
      edges.push({
        source: "orchestrator",
        target: sp,
        label: AGENTS_REGISTRY[sp].label.split(" ")[0]
      });
      // Specialist -> Validation
      edges.push({
        source: sp,
        target: "validation",
        label: "Findings"
      });
    });

    // Validation -> Synthesizer
    edges.push({
      source: "validation",
      target: "synthesizer",
      label: "Consensus"
    });

    return edges;
  }, [activeScenario]);

  // ─── Workflow Execution Engine ─────────────────────────────────────────────

  const executeWorkflow = useCallback((scenario: PresetScenario) => {
    setIsRunning(true);
    setDisplayedLogs([]);
    setExecutionStep(0);
    setActiveNodes(["orchestrator"]);
    setActiveEdges([]);
    setSelectedEdge(null);

    const logs = scenario.logs;
    let step = 0;

    const interval = setInterval(() => {
      if (step < logs.length) {
        const entry = logs[step];
        const newLog: AuditLogEntry = {
          ...entry,
          id: `log-${step}-${Date.now().toString(36)}`,
          timestamp: new Date().toLocaleTimeString("en-IN", { hour12: false }),
        };

        // Deduplicate logs if identical id already present
        setDisplayedLogs(prev => {
          if (prev.some(l => l.id === newLog.id)) return prev;
          return [...prev, newLog];
        });

        setExecutionStep(step + 1);

        const currentActive: AgentId[] = [entry.source];
        if (entry.target) currentActive.push(entry.target);
        setActiveNodes(currentActive);

        if (entry.target) {
          setActiveEdges([{ source: entry.source, target: entry.target }]);
        } else {
          setActiveEdges([]);
        }

        step++;
      } else {
        clearInterval(interval);
        setIsRunning(false);
        setActiveNodes(["synthesizer"]);
        setActiveEdges([]);
      }
    }, 850);

    return () => clearInterval(interval);
  }, []);

  // Initial mount execution
  useEffect(() => {
    executeWorkflow(activeScenario);
  }, []);

  // Scroll logs smoothly
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedLogs]);

  // ─── Canvas Rendering & Particle Animation ──────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 900);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 540);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: {
      startX: number;
      startY: number;
      targetX: number;
      targetY: number;
      progress: number;
      speed: number;
    }[] = [];

    // Particle spawner along active horizontal edges
    const spawnTimer = setInterval(() => {
      if (!isRunning) return;
      
      const candidateEdges = activeEdges.length > 0 ? activeEdges : graphEdges;
      if (candidateEdges.length === 0) return;
      const edge = candidateEdges[Math.floor(Math.random() * candidateEdges.length)];
      const sourceNode = layoutNodes.find(n => n.id === edge.source);
      const targetNode = layoutNodes.find(n => n.id === edge.target);
      if (!sourceNode || !targetNode) return;

      const sourceHalfW = sourceNode.id === "orchestrator" ? 78 : 77;
      const targetHalfW = targetNode.id === "orchestrator" ? 78 : 77;

      particles.push({
        startX: (sourceNode.x / 100) * width + sourceHalfW,
        startY: (sourceNode.y / 100) * height,
        targetX: (targetNode.x / 100) * width - targetHalfW,
        targetY: (targetNode.y / 100) * height,
        progress: 0,
        speed: 0.022 + Math.random() * 0.015,
      });
    }, 380);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw all Directed Horizontal Bezier Curves matching screenshot
      graphEdges.forEach(edge => {
        const sourceNode = layoutNodes.find(n => n.id === edge.source);
        const targetNode = layoutNodes.find(n => n.id === edge.target);
        if (!sourceNode || !targetNode) return;

        const sourceHalfW = sourceNode.id === "orchestrator" ? 78 : 77;
        const targetHalfW = targetNode.id === "orchestrator" ? 78 : 77;

        const sx = (sourceNode.x / 100) * width + sourceHalfW;
        const sy = (sourceNode.y / 100) * height;
        const tx = (targetNode.x / 100) * width - targetHalfW;
        const ty = (targetNode.y / 100) * height;

        const isEdgeActive = isRunning && activeEdges.some(e => e.source === edge.source && e.target === edge.target);
        const isEdgeSelected = selectedEdge?.source === edge.source && selectedEdge?.target === edge.target;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        // Horizontal S-curve bezier control points
        const midX = (sx + tx) / 2;
        ctx.bezierCurveTo(midX, sy, midX, ty, tx, ty);

        if (isEdgeSelected) {
          ctx.strokeStyle = "#1F4E8C";
          ctx.lineWidth = 2.2;
          ctx.stroke();
        } else if (isEdgeActive) {
          ctx.save();
          ctx.shadowColor = "#3b82f6";
          ctx.shadowBlur = 8;
          ctx.strokeStyle = "#2563eb";
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.strokeStyle = "#E2E8F0"; // Soft light blue-gray exactly like screenshot
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // Draw Animated Message Pulse along horizontal curve ONLY when running
      if (isRunning) {
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.progress += p.speed;

          const t = p.progress;
          const invT = 1 - t;
          const midX = (p.startX + p.targetX) / 2;

          const px = invT * invT * invT * p.startX + 3 * invT * invT * t * midX + 3 * invT * t * t * midX + t * t * t * p.targetX;
          const py = invT * invT * invT * p.startY + 3 * invT * invT * t * p.startY + 3 * invT * t * t * p.targetY + t * t * t * p.targetY;

          ctx.save();
          ctx.shadowColor = "#3b82f6";
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = "#2563eb";
          ctx.fill();
          ctx.restore();

          if (p.progress >= 1) particles.splice(i, 1);
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      clearInterval(spawnTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, [layoutNodes, graphEdges, isRunning, activeEdges, selectedEdge]);

  // ─── Scenario Switch Handler ───────────────────────────────────────────────

  const handleSelectScenario = (sc: PresetScenario) => {
    setActiveScenario(sc);
    setCustomQuery(sc.query);
    setSelectedEdge(null);
    setSelectedAgent(sc.activeSpecialists[0] || "orchestrator");
    executeWorkflow(sc);
  };

  const handleNodeClick = (id: AgentId) => {
    setSelectedAgent(id);
    setSelectedEdge(null);
  };

  const handleEdgeClick = (edge: { source: AgentId; target: AgentId }) => {
    setSelectedEdge(edge);
    setSelectedAgent(null);
  };

  // ─── Derived Inspector Data ────────────────────────────────────────────────

  const selectedAgentDef = selectedAgent ? AGENTS_REGISTRY[selectedAgent] : null;
  const agentScenarioData = selectedAgent ? activeScenario.agentSpecificData[selectedAgent] : null;

  const edgeKey = selectedEdge ? `${selectedEdge.source}->${selectedEdge.target}` : null;
  const edgePayload = edgeKey ? activeScenario.edgePayloads[edgeKey] : null;

  const totalRegisteredSpecialists = Object.values(AGENTS_REGISTRY).filter(a => a.category === "specialist").length;
  const activeSpecialistCount = activeScenario.activeSpecialists.length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased font-sans select-none pb-16 pt-3">
      <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 space-y-4">

        {/* ─── 1. STREAMLINED TOP HEADER ──────────────────────────────────────── */}
        <header className="border-b border-slate-200 pb-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Globe</span>
            </Link>

            <div className="h-4 w-px bg-slate-200" />

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  Agent Workflow
                </span>
                <h1 className="text-base font-semibold text-slate-900 leading-tight">
                  ORCA Multi-Agent Runtime
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Dynamic task execution, cross-agent evidence validation and synthesis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => executeWorkflow(activeScenario)}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-all shadow-xs"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${isRunning ? "animate-spin" : ""}`} />
              <span>{isRunning ? "Executing..." : "Run Agent Workflow"}</span>
            </button>
          </div>
        </header>

        {/* ─── 2. COMPACT CONTROL BAR: SCENARIOS & QUERY ──────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Test Scenarios:</span>
              <div className="flex flex-wrap gap-1.5">
                {DEMO_SCENARIOS.map((sc) => {
                  const isSelected = activeScenario.id === sc.id;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => handleSelectScenario(sc)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        isSelected
                          ? "bg-blue-50 text-blue-700 border border-blue-200 font-semibold"
                          : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <sc.icon className="h-3 w-3" />
                      <span>{sc.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowRegistryDrawer(!showRegistryDrawer)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <Layers className="h-3 w-3 text-blue-600" />
                <span>Agents {activeSpecialistCount} / {totalRegisteredSpecialists}</span>
              </button>

              {/* Compact Registry Popover */}
              {showRegistryDrawer && (
                <div className="absolute right-0 top-8 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold text-slate-900">Agent Registry</span>
                    <button onClick={() => setShowRegistryDrawer(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1.5 tracking-wider">
                      Active For Task ({activeSpecialistCount})
                    </div>
                    <div className="space-y-1">
                      {activeScenario.activeSpecialists.map(id => {
                        const ag = AGENTS_REGISTRY[id];
                        return (
                          <div key={id} className="flex items-center justify-between py-0.5">
                            <span className="flex items-center gap-1.5 text-slate-700">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              {ag.label}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-medium">Selected</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1.5 tracking-wider">
                      Available on Standby ({totalRegisteredSpecialists - activeSpecialistCount})
                    </div>
                    <div className="space-y-1">
                      {Object.values(AGENTS_REGISTRY)
                        .filter(a => a.category === "specialist" && !activeScenario.activeSpecialists.includes(a.id))
                        .map(ag => (
                          <div key={ag.id} className="flex items-center justify-between py-0.5 text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full border border-slate-300" />
                              {ag.label}
                            </span>
                            <span className="text-[10px]">Standby</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search / Ask Input */}
          <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Ask ORCA agents a maritime question..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 outline-none transition-colors"
              />
            </div>
            <button
              onClick={() => executeWorkflow({ ...activeScenario, query: customQuery })}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-2xs"
            >
              <span>Execute</span>
              <Send className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* ─── 3. WORKFLOW STATUS STRIP ──────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-900 flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${isRunning ? "bg-blue-600 animate-ping" : "bg-emerald-500"}`} />
              {activeScenario.name}
            </span>
            <div className="h-3 w-px bg-slate-200" />
            <div className="text-slate-500 flex items-center gap-2">
              {isRunning ? (
                <span className="text-blue-600 font-medium">
                  Running Step {executionStep} / {activeScenario.logs.length}
                </span>
              ) : (
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Workflow Complete · Validation Passed
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500">
            <span>Specialists: <strong className="text-slate-800">{activeSpecialistCount}</strong></span>
            <span>Latency: <strong className="text-slate-800">485ms</strong></span>
            <span>Consensus: <strong className="text-emerald-600">100%</strong></span>
          </div>
        </div>

        {/* ─── 4. MAIN WORKSPACE: GRAPH (72%) + DOCKED INSPECTOR (28%) ────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          
          {/* Main Runtime DAG Canvas (Col 1-8 / 9) - Expanded to fill available space */}
          <div className="lg:col-span-8 xl:col-span-9 bg-[#FBFCFE] border border-[#E4E9F0] rounded-xl relative overflow-hidden shadow-2xs flex flex-col min-h-[600px] lg:min-h-[630px]">
            
            {/* Minimal Clean Canvas Toolbar */}
            <div className="px-4 py-2.5 border-b border-[#E4E9F0] flex items-center justify-between bg-white/80 backdrop-blur-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs sm:text-sm text-[#1E293B] font-sans">
                  Runtime Agent Graph
                </span>
                <span className="text-[11px] text-slate-500 font-normal font-sans">
                  Dynamic Topology
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoomScale(s => Math.min(s + 0.1, 1.3))}
                  className="h-6 w-6 inline-flex items-center justify-center rounded text-slate-500 hover:text-[#1F4E8C] hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setZoomScale(s => Math.max(s - 0.1, 0.8))}
                  className="h-6 w-6 inline-flex items-center justify-center rounded text-slate-500 hover:text-[#1F4E8C] hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setZoomScale(1)}
                  className="h-6 w-6 inline-flex items-center justify-center rounded text-slate-500 hover:text-[#1F4E8C] hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Fit View"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => executeWorkflow(activeScenario)}
                  className="h-6 w-6 inline-flex items-center justify-center rounded text-slate-500 hover:text-[#1F4E8C] hover:bg-slate-100 transition-colors cursor-pointer ml-1"
                  title="Replay Workflow"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Canvas Stage with Nodes - Expanded */}
            <div
              className="relative flex-1 w-full min-h-[540px] lg:min-h-[570px] bg-[#FBFCFE] overflow-hidden"
              style={{ transform: `scale(${zoomScale})`, transformOrigin: "center center", transition: "transform 0.2s ease" }}
            >
              {/* HTML5 Canvas for Curves & Particles */}
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

              {/* Dynamic Agent Nodes matching user design exactly */}
              {layoutNodes.map((node) => {
                const isSelected = selectedAgent === node.id;
                const isExecuting = isRunning && activeNodes.includes(node.id);
                
                // Track if agent finished execution
                const isCompleted = !isRunning || (!isExecuting && activeNodes.length > 0 && node.id !== "synthesizer");

                const isOrchestrator = node.id === "orchestrator";
                const isValidation = node.id === "validation";
                const isSynthesizer = node.id === "synthesizer";

                // Base dimensions
                let cardDims = isOrchestrator || isValidation || isSynthesizer ? "w-[155px] h-[74px]" : "w-[155px] h-[66px]";

                // Default Complete styling (clean green border, emerald icon, static Complete checkmark)
                let cardBorder = isOrchestrator
                  ? "border-2 border-[#1F4E8C] ring-1 ring-[#1F4E8C] ring-offset-2 ring-offset-white"
                  : isSynthesizer
                  ? "border border-blue-600"
                  : "border border-emerald-500";
                let cardBg = "bg-white";
                let iconColor = isSynthesizer ? "text-blue-700" : "text-emerald-600";
                let iconAnim = "";
                let statusIcon = <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
                let statusText = "Complete";
                let statusTextColor = "text-emerald-600";
                let pulseHalo = false;

                if (isExecuting) {
                  // Vibrant colors and animation ONLY when working!
                  pulseHalo = true;
                  cardBg = "bg-gradient-to-r from-blue-50/95 via-sky-50/90 to-indigo-50/90";
                  cardBorder = "border-2 border-blue-600 shadow-md shadow-blue-500/25";
                  iconColor = "text-blue-600";
                  iconAnim = "animate-bounce";
                  statusTextColor = "text-blue-700 font-semibold";
                  statusText = isOrchestrator ? "Dispatching..." : isValidation ? "Validating..." : isSynthesizer ? "Synthesizing..." : "Working...";
                  statusIcon = (
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                      </span>
                      <RotateCcw className="h-3 w-3 text-blue-700 animate-spin shrink-0" />
                    </div>
                  );
                } else if (!isRunning) {
                  // All complete when idle
                  statusText = "Complete";
                  statusTextColor = "text-emerald-600";
                  statusIcon = <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
                } else if (isCompleted) {
                  statusText = "Complete";
                  statusTextColor = "text-emerald-600";
                  statusIcon = <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
                } else {
                  // Waiting state before agent starts
                  cardBorder = "border border-slate-200";
                  cardBg = "bg-white";
                  iconColor = "text-slate-400";
                  statusText = "Waiting";
                  statusTextColor = "text-slate-400";
                  statusIcon = <div className="h-2 w-2 rounded-full bg-slate-300 shrink-0" />;
                }

                // Render structured labels matching screenshot
                const renderTitle = () => {
                  if (isOrchestrator) return <>ORCA<br />Orchestrator</>;
                  if (node.id === "risk") return <>Risk & Geo<br />Agent</>;
                  if (node.id === "navigation") return <>Navigation<br />Agent</>;
                  if (isValidation) return <>Cross-Agent<br />Validation</>;
                  return <>{node.label}</>;
                };

                const selectedStyle = isSelected
                  ? { boxShadow: "0 0 0 3px rgba(31, 78, 140, 0.15)" }
                  : {};

                return (
                  <div
                    key={node.id}
                    onClick={() => handleNodeClick(node.id)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all rounded-xl p-2.5 flex flex-col justify-between shadow-2xs z-20 select-none ${cardBg} ${cardDims} ${cardBorder} ${isExecuting ? "scale-[1.03]" : ""}`}
                    style={{ left: `${node.x}%`, top: `${node.y}%`, ...selectedStyle }}
                  >
                    {/* Animated Halo ONLY when working */}
                    {pulseHalo && (
                      <span className="absolute -inset-[3px] rounded-xl bg-blue-500/25 animate-pulse -z-10 pointer-events-none" />
                    )}

                    <div className="flex items-center gap-2">
                      <node.icon className={`h-4 w-4 shrink-0 ${iconColor} ${iconAnim}`} />
                      <div className="text-[12px] font-semibold text-slate-900 leading-tight font-sans">
                        {renderTitle()}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-medium font-sans">
                      {statusIcon}
                      <span className={statusTextColor}>{statusText}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Docked Inspector Beside Graph (Col 9-12 / 3-4) */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
            
            {/* 4A. Selected Node or Edge Inspector */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs min-h-[300px]">
              
              {/* Edge Inspector View */}
              {selectedEdge && edgePayload ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-blue-700">Communication</div>
                      <div className="font-semibold text-xs text-slate-900">
                        {AGENTS_REGISTRY[selectedEdge.source].label} → {AGENTS_REGISTRY[selectedEdge.target].label}
                      </div>
                    </div>
                    <button onClick={() => setSelectedEdge(null)} className="text-slate-400 hover:text-slate-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div>
                    <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Payload Summary</div>
                    <div className="text-xs font-semibold text-slate-800 mt-0.5">{edgePayload.summary}</div>
                  </div>

                  <div>
                    <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Parameters Exchanged</div>
                    <div className="mt-1 space-y-1">
                      {edgePayload.variables.map((v, i) => (
                        <div key={i} className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-700 font-mono">
                          {v}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
                    <span>Source Authority:</span>
                    <strong className="text-slate-700">{edgePayload.source}</strong>
                  </div>
                </div>
              ) : selectedAgentDef ? (
                /* Node Inspector View */
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                      <selectedAgentDef.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-900">{selectedAgentDef.label}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{selectedAgentDef.category} Layer</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Scientific Role</div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{selectedAgentDef.role}</p>
                  </div>

                  {agentScenarioData && (
                    <div>
                      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Assigned Task</div>
                      <p className="text-xs text-slate-800 font-medium mt-0.5 leading-relaxed bg-slate-50 p-2 rounded border border-slate-200">
                        {agentScenarioData.task}
                      </p>
                    </div>
                  )}

                  <div>
                    <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Data Sources</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedAgentDef.dataSources.map((ds, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          {ds}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Tools Used</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedAgentDef.toolsUsed.map((t, i) => (
                        <span key={i} className="font-mono text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {agentScenarioData && (
                    <div className="pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-500 flex justify-between">
                      <span>Execution Latency:</span>
                      <strong className="text-slate-800">{agentScenarioData.latency}ms</strong>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  Click any agent node or connection line to inspect details.
                </div>
              )}
            </div>

            {/* 4B. Compact Execution Trace Timeline */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col h-[230px]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-semibold text-xs text-slate-900">Execution Trace</span>
                <button
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(displayedLogs, null, 2));
                    const dl = document.createElement("a");
                    dl.setAttribute("href", dataStr);
                    dl.setAttribute("download", `orca-audit-${activeScenario.id}.json`);
                    dl.click();
                  }}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  <span>Export JSON</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pt-2 space-y-2.5 pr-1">
                {displayedLogs.map((log) => (
                  <div key={log.id} className="relative pl-3 text-[11px] border-l-2 border-slate-200 ml-1">
                    <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-blue-600" />
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                      <span>{log.timestamp}</span>
                      <span>{log.latencyMs}ms</span>
                    </div>
                    <div className="font-medium text-slate-800 text-[11px] leading-tight mt-0.5">
                      {AGENTS_REGISTRY[log.source]?.label} {log.target ? `→ ${AGENTS_REGISTRY[log.target]?.label}` : ""}
                    </div>
                    <div className="text-slate-500 text-[10px] mt-0.5 line-clamp-2">
                      {log.message}
                    </div>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>

          </div>
        </div>

        {/* ─── 5. FINAL SYNTHESIS COMPONENT ──────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs border-l-4 border-l-emerald-500">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-emerald-50 text-emerald-700">
                <Sparkles className="h-4 w-4" />
              </span>
              <h2 className="font-semibold text-xs text-slate-900">FINAL SYNTHESIS</h2>
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Evidence-backed result · Cross-agent validated
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono">
              <span>Validation: <strong className="text-emerald-700">Passed</strong></span>
              <span>Agents: <strong className="text-slate-800">{activeSpecialistCount}</strong></span>
              <span>Sources: <strong className="text-slate-800">4 Verified</strong></span>
            </div>
          </div>

          <p className="text-xs text-slate-800 leading-relaxed font-normal">
            {activeScenario.finalOutput}
          </p>
        </div>

        {/* ─── 6. COLLAPSIBLE TECHNICAL RUNTIME DETAILS ───────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <button
            onClick={() => setShowTechDetails(!showTechDetails)}
            className="w-full flex items-center justify-between p-3.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Server className="h-3.5 w-3.5 text-slate-500" />
              <span>Technical Runtime Details</span>
            </span>
            <ChevronRight className={`h-4 w-4 transition-transform ${showTechDetails ? "rotate-90" : ""}`} />
          </button>

          {showTechDetails && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3 font-mono text-xs text-slate-600">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2 bg-white rounded border border-slate-200">
                  <div className="text-[10px] text-slate-400">Runtime Model</div>
                  <div className="font-semibold text-slate-800 text-[11px] mt-0.5">Qwen2.5-7B-Instruct (4-bit AWQ)</div>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <div className="text-[10px] text-slate-400">Execution Mode</div>
                  <div className="font-semibold text-emerald-700 text-[11px] mt-0.5">Local / Sovereign (No API Call)</div>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <div className="text-[10px] text-slate-400">Total Latency</div>
                  <div className="font-semibold text-slate-800 text-[11px] mt-0.5">485ms (P95: 520ms)</div>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <div className="text-[10px] text-slate-400">KV Cache Hit Rate</div>
                  <div className="font-semibold text-slate-800 text-[11px] mt-0.5">88.4% · 1,420 Tokens Cached</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 text-[11px]">
                <div className="text-slate-500 mb-1 font-sans font-semibold text-xs">Participating Agent Execution Timings:</div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {activeScenario.activeSpecialists.map(spId => {
                    const ag = AGENTS_REGISTRY[spId];
                    const data = activeScenario.agentSpecificData[spId];
                    return (
                      <div key={spId} className="flex justify-between bg-white px-2 py-1 rounded border border-slate-200 text-[10px]">
                        <span>{ag.label.split(" ")[0]}:</span>
                        <span className="font-semibold text-slate-800">{data?.latency || 90}ms</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
