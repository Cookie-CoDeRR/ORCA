Here are the specific, highly relevant research papers and technical references you can use to build your presentation (PPT) and synopsis. Citing these will prove to the ISRO jury that your ORCA architecture is grounded in state-of-the-art AI research and established marine science.

### 1. Multi-Agent System (MAS) Architecture References

To justify your LangGraph agentic workflow, you should reference recent literature on how multiple LLM agents collaborate to solve complex, multi-step problems better than a single model.

- **Paper:** _"ORCA: Orchestrated Reasoning with Collaborative Agents"_ (March 2026)
- **What it covers:** This paper introduces a multi-agent framework that uses coordinated agents for query decomposition, specialized processing paths, and collaborative reasoning. It features a reasoning agent that breaks queries into logical steps and a routing mechanism that activates task-specific agents from a specialized dock.
- **How to use it in your PPT:** Use this as the foundational citation for your architecture slide. Explain that your LangGraph Supervisor Agent is directly inspired by this orchestrated reasoning framework, ensuring that marine queries are correctly decomposed and routed to specialist tools (like PostGIS or NetCDF scripts).

- **Paper:** _"Multi-Agent Collaboration Mechanisms: A Survey of LLMs"_ (2025)
- **What it covers:** An extensive survey detailing how LLM-based Multi-Agent Systems (MASs) enable groups of intelligent agents to perceive, learn, reason, and act collaboratively to solve complex tasks at scale.
- **How to use it in your PPT:** Cite this in your synopsis to explain your design choice. Highlight that your multi-agent approach achieves collective intelligence by distributing tasks among specialized models rather than relying on an isolated, monolithic model.

### 2. Marine Visual Understanding & Ocean Data References

Since ISRO expects your agents to reason over marine data and satellite observations, grounding your data processing in recognized marine research is critical.

- **Paper / Dataset:** _"ORCA: Object Recognition and Comprehension for Archiving Marine Species"_ (Winter Conference on Applications of Computer Vision, 2026)
- **What it covers:** This research introduces a multi-modal benchmark for marine visual understanding, capturing diverse morphology-oriented attributes across marine species for visual grounding and instance captioning.
- **How to use it in your PPT:** If your solution processes satellite or underwater imagery alongside numerical data, cite this paper to show that your model leverages the latest multi-modal benchmarks for marine ecosystems.

- **Technical Reference:** _INCOIS Potential Fishing Zone (PFZ) Advisory WebGIS_
- **What it covers:** The Indian National Centre for Ocean Information Services (INCOIS) utilizes WebGIS to provide accurate, online geo-referenced data on PFZs for approximately 1,223 nodes along the Indian sub-continent coastline.
- **How to use it in your PPT:** On your "Scientific Validity" slide, cite INCOIS's WebGIS system to prove that your Ocean Analytics Agent uses the exact same data sources (Sea Surface Temperature and Chlorophyll) and geospatial mapping techniques utilized by the Indian Government.

### How to Structure Your Synopsis References

When writing your SIH 2026 project synopsis, include a dedicated **"Scientific & Technological Foundation"** section formatted like this:

> **Scientific Foundation:** Our architecture is driven by the latest advancements in Multi-Agent Systems (MAS), specifically utilizing orchestrated reasoning frameworks where tasks are dynamically decomposed and routed to specialized agents. For maritime accuracy, our deterministic data agents pull from verified INCOIS methodologies, ensuring that all Potential Fishing Zone (PFZ) and Sea Surface Temperature (SST) computations align with established Indian marine WebGIS standards. Furthermore, our visual reasoning capabilities are informed by the 2026 ORCA marine visual understanding benchmark.
