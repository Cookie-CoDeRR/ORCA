-- ==============================================================================
-- PROJECT ORCA (SIH26176) — SOVEREIGN SPATIAL & VECTOR DATABASE INITIALIZATION
-- ==============================================================================

-- 1. Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Marine Regulatory & Advisory Corpus for RAG Storage (pgvector 768-dim)
CREATE TABLE IF NOT EXISTS marine_advisories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_id VARCHAR(100) NOT NULL,
    chunk_id VARCHAR(120) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,            -- 'Monsoon Fishing Ban', 'Maritime Safety & Distress', etc.
    source TEXT NOT NULL,
    authority VARCHAR(150),
    jurisdiction VARCHAR(150),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    embedding VECTOR(768),                     -- 768-dimensional dense vector embedding for RAG
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cosine Distance HNSW Index for Sub-Millisecond Vector Similarity Search
CREATE INDEX IF NOT EXISTS idx_marine_advisories_embedding 
ON marine_advisories USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_marine_advisories_category 
ON marine_advisories (category);

-- 3. Coastal Landing Centers & Harbors Gazetteer (PostGIS Geometry)
CREATE TABLE IF NOT EXISTS coastal_nodes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    vernacular_names JSONB DEFAULT '{}',       -- e.g. {"gu": "વેરાવળ", "hi": "वेरावल", "ta": "வேராவல்"}
    state VARCHAR(80) NOT NULL,
    district VARCHAR(100),
    facility_type VARCHAR(100),
    geom GEOMETRY(Point, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_coastal_nodes_geom ON coastal_nodes USING GIST(geom);

-- 4. Maritime Boundary Lines (IMBL, EEZ, Baseline)
CREATE TABLE IF NOT EXISTS maritime_boundaries (
    id SERIAL PRIMARY KEY,
    boundary_id VARCHAR(80) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    boundary_type VARCHAR(50) NOT NULL,        -- 'IMBL', 'EEZ', 'TERRITORIAL'
    country_a VARCHAR(50) NOT NULL,
    country_b VARCHAR(50),
    treaty_reference TEXT,
    severity_level VARCHAR(50) DEFAULT 'CRITICAL_BORDER',
    buffer_alert_km FLOAT DEFAULT 10.0,
    geom GEOMETRY(MultiLineString, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_maritime_boundaries_geom ON maritime_boundaries USING GIST(geom);

-- 5. Marine Protected Areas & Sanctuaries
CREATE TABLE IF NOT EXISTS marine_protected_areas (
    id SERIAL PRIMARY KEY,
    mpa_id VARCHAR(80) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    state VARCHAR(80) NOT NULL,
    category VARCHAR(100) NOT NULL,            -- 'NO_FISHING_CORE_ZONE', 'SEASONAL_SANCTUARY'
    legal_act VARCHAR(200),
    prohibited_activities TEXT[],
    buffer_km FLOAT DEFAULT 5.0,
    geom GEOMETRY(MultiPolygon, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mpa_geom ON marine_protected_areas USING GIST(geom);

-- 6. Multi-Agent Query & Explainable AI (XAI) Audit Log
CREATE TABLE IF NOT EXISTS query_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id VARCHAR(120) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    raw_query TEXT NOT NULL,
    resolved_coordinates JSONB,
    ocean_telemetry_payload JSONB,
    spatial_risk_payload JSONB,
    policy_rag_payload JSONB,
    synthesized_response TEXT,
    execution_time_ms INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_thread_id ON query_audit_logs (thread_id);
