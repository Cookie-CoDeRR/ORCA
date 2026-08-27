Here are the core research papers, foundational datasets, and methodologies you need to reference in your presentation and synopsis to prove the scientific validity of your ORCA architecture.

### I. Multi-Agent AI and Geospatial Reasoning

To validate the LangGraph architecture and the use of LLMs for geospatial tool execution, you must cite recent advancements in spatial AI agents.

- **Reference Paper:** "GeoJSON Agents: A Multi-Agent LLM Architecture for Geospatial Analysis—Function Calling vs Code Generation".
- **Key Concept to Include in PPT:** This paper introduces a multi-agent framework specifically designed for geographic information systems (GIS). It validates the exact architecture you are building: a "Planner agent" that decomposes natural language tasks, and "Worker agents" that process spatial data by invoking APIs or executing Python code.
- **Application for ORCA:** Cite this to justify why your Supervisor Agent uses function calling for structured operations (like querying PostGIS) and why the final output is formatted as reusable GeoJSON for the frontend map.

### II. Potential Fishing Zone (PFZ) & Ocean State Methodology

ISRO and INCOIS rely on specific satellite parameters to define safe and productive ocean zones. Your Ocean Analytics Agent must use these exact methodologies.

- **Reference Paper:** "Multiple ocean parameter-based potential fishing zone (PFZ) location generation and validation in the Western Bay of Bengal".
- **Key Concept to Include in PPT:** Modern PFZ forecasting relies on tracking thermal fronts, cyclonic eddies, and high chlorophyll patches. The methodology uses data from the Moderate Resolution Imaging Spectroradiometer (MODIS) for chlorophyll and Sea Surface Temperature (SST), alongside SCATSAT-1 for ocean surface winds.
- **Application for ORCA:** Use this to explain the deterministic math in your Ocean Analytics Agent. Show the jury that your Python scripts are replicating the Canny algorithm for chlorophyll fronts and tracking SST gradients to find fish aggregations, just as INCOIS does.
- **Reference Paper:** "A remote sensing approach to monitor potential fishing zone associated with sea surface temperature and chlorophyll concentration".
- **Key Concept to Include in PPT:** This paper validates that regions with low SST (24–27°C) combined with high chlorophyll concentrations are assigned the highest rank for Potential Fishing Zones. It also highlights that fish aggregation often moves closer to international maritime boundary lines, increasing the risk for fishermen.
- **Application for ORCA:** This justifies your Risk & Geofencing Agent. Because PFZs often drift near maritime borders, your PostGIS `ST_Intersects` boundary check is a scientifically proven safety necessity.

### III. Multilingual Localization (The Bhashini / Indic Pipeline)

To fulfill the mandate for regional language support, you must reference the state-of-the-art open-source models developed for Indian vernaculars.

- **Reference Paper:** "IndicTrans2: Toward High-Quality and Accessible Machine Translation Models for all 22 Scheduled Indian Languages" (AI4Bharat).
- **Key Concept to Include in PPT:** IndicTrans2 is the first open-source transformer-based multilingual model supporting high-quality translations across all 22 scheduled Indic languages. It was trained on the Bharat Parallel Corpus Collection (BPCC), which contains roughly 230 million bitext pairs.
- **Application for ORCA:** Cite this as the engine behind your Synthesizer Agent. Explain that your text responses are translated using the IndicTrans2 architecture to ensure accurate coastal vernaculars.
- **Reference Paper:** "IndicConformer / IndicWhisper" (AI4Bharat ASR Suite).
- **Key Concept to Include in PPT:** These are state-of-the-art Automatic Speech Recognition (ASR) models fine-tuned on datasets like Vistaar (10,700 hours of labeled audio) and Shruti to handle diverse Indian accents and dialects.
- **Application for ORCA:** Mention this if you build a WhatsApp audio-bot feature, proving your speech-to-text pipeline can handle the dialects of rural fishermen.

### IV. Structuring the Synopsis

When drafting the hackathon synopsis, structure it around these peer-reviewed pillars:

1. **The Problem:** Fragmented marine data and the risk of crossing maritime boundaries.
2. **The AI Innovation:** Implementing a Multi-Agent GeoJSON architecture to process natural language into deterministic spatial functions.
3. **The Scientific Engine:** Utilizing MODIS and ISRO satellite data to track SST and chlorophyll gradients for accurate PFZ mapping.
4. **The Accessibility Layer:** Integrating IndicTrans2 transformer models to deliver the spatial intelligence in 22 regional languages.
