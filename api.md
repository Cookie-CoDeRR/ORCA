Here are the direct links to the official developer portals, API registration pages, and required tools for building Project ORCA.

### 1. Indian Government Data & API Portals (Requires Registration)

- **MOSDAC (ISRO) Data Portal**
- **Purpose:** To download archived NetCDF and HDF5 files for Sea Surface Temperature, Ocean Currents, and wind vectors.
- **Registration Link:** [https://mosdac.gov.in/signup/](https://mosdac.gov.in/signup/)
- **Downloads Link:** [https://www.mosdac.gov.in/downloads](https://www.mosdac.gov.in/downloads)

- **INCOIS ERDDAP Data Server**
- **Purpose:** To query live and forecasted marine data, including Potential Fishing Zones (PFZs), significant wave heights, and ocean state forecasts. ERDDAP allows you to fetch data via RESTful APIs in JSON, CSV, or NetCDF formats.
- **API Portal Link:** [https://erddap.incois.gov.in/](https://erddap.incois.gov.in/)

- **Bhashini API (Ministry of Electronics and IT)**
- **Purpose:** The official API for translating the Synthesizer Agent's outputs into 22 Indian regional languages and converting it to audio (Text-to-Speech).
- **Developer Registration Link:** [https://bhashini.gov.in/ulca/user/register](https://bhashini.gov.in/ulca/user/register)

### 2. Low-Bandwidth Delivery / Notification APIs

- **WhatsApp Cloud API (Meta)**
- **Purpose:** To build the SMS/WhatsApp fallback gateway so fishermen can query the system without needing the high-bandwidth 3D web dashboard.
- **Developer Portal:** [https://whatsappbusiness.com/developers/developer-hub/](https://whatsappbusiness.com/developers/developer-hub/)

### 3. Open-Source Infrastructure (No API Keys Required)

You will need to pull these docker images or install these libraries locally to maintain the "air-gapped" security architecture.

- **LLM Inference (Ollama / vLLM):**
- Ollama: [https://ollama.com/](https://ollama.com/)
- vLLM: [https://docs.vllm.ai/](https://docs.vllm.ai/)

- **Multi-Agent Orchestration (LangGraph):**
- Docs: [https://python.langchain.com/docs/langgraph](https://python.langchain.com/docs/langgraph)

- **Database & Geofencing (PostgreSQL + PostGIS + pgvector):**
- PostGIS: [https://postgis.net/](https://postgis.net/)
- pgvector: [https://github.com/pgvector/pgvector](https://github.com/pgvector/pgvector)

- **Scientific Object Storage (MinIO):**
- Download: [https://min.io/](https://min.io/)

- **Dynamic Tile Server (TiTiler):**
- Docs: [https://developmentseed.org/titiler/](https://developmentseed.org/titiler/)

- **High-Performance Frontend (MapLibre + deck.gl):**
- MapLibre GL JS: [https://maplibre.org/](https://maplibre.org/)
- deck.gl: [https://deck.gl/](https://deck.gl/)
