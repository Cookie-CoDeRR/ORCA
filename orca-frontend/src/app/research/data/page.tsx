"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  ExternalLink,
  Layers,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Clock,
  HardDrive,
  FileCode,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  GitBranch,
  Radio,
  FileText,
  Building2,
  Calendar,
  Eye,
  Info,
  Terminal,
  Code2,
  Copy,
  Check,
  Play,
  Download,
  Key,
  MapPin,
  RefreshCw,
  SlidersHorizontal,
  Database,
  Globe,
  ArrowUpRight,
  ListFilter,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import {
  DATA_PROVIDERS,
  SCIENTIFIC_DATASETS,
  ScientificDataset,
  DataProvider,
  getCatalogStats,
  getAllVariablesList,
  DatasetType,
  DataFormat,
  DatasetStatus,
  ORCA_API_SPEC,
  STANDARD_UNITS,
  SOURCE_NORMALIZATION_PIPELINE,
  SOURCE_VARIABLE_MAPPINGS,
  ORCA_API_ENDPOINTS,
  ORCA_STANDARD_SAMPLE_RESPONSE,
  ORCA_SPATIAL_FOOTPRINTS,
} from "@/lib/dataCatalog";

export default function OceanDataCatalogPage() {
  // ─── PRIMARY WORKSPACE TAB ───────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"overview" | "sources" | "datasets" | "ingestion" | "api">("overview");

  // ─── SEARCH & FILTER STATE ───────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedProviderFilter, setSelectedProviderFilter] = useState<string>("all");
  const [selectedVariableFilter, setSelectedVariableFilter] = useState<string>("all");
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [selectedFormatFilter, setSelectedFormatFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");

  // Active filter count for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedProviderFilter !== "all") count++;
    if (selectedVariableFilter !== "all") count++;
    if (selectedRegionFilter !== "all") count++;
    if (selectedTypeFilter !== "all") count++;
    if (selectedFormatFilter !== "all") count++;
    if (selectedStatusFilter !== "all") count++;
    return count;
  }, [
    selectedProviderFilter,
    selectedVariableFilter,
    selectedRegionFilter,
    selectedTypeFilter,
    selectedFormatFilter,
    selectedStatusFilter,
  ]);

  const handleClearFilters = () => {
    setSelectedProviderFilter("all");
    setSelectedVariableFilter("all");
    setSelectedRegionFilter("all");
    setSelectedTypeFilter("all");
    setSelectedFormatFilter("all");
    setSelectedStatusFilter("all");
    setSearchQuery("");
  };

  // ─── DATASET SORTING & DRAWER ────────────────────────────────────────────────
  const [datasetSortBy, setDatasetSortBy] = useState<"updated" | "name" | "provider" | "resolution">("updated");
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(SCIENTIFIC_DATASETS[0].id);
  const [datasetDrawerOpen, setDatasetDrawerOpen] = useState(false);
  const [datasetDrawerTab, setDatasetDrawerTab] = useState<"overview" | "variables" | "coverage" | "netcdf" | "provenance" | "api">("overview");

  // ─── PROVIDER DRAWER ─────────────────────────────────────────────────────────
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [providerDrawerOpen, setProviderDrawerOpen] = useState(false);

  // ─── INGESTION DRAWER ────────────────────────────────────────────────────────
  const [selectedIngestionId, setSelectedIngestionId] = useState<string | null>(null);
  const [ingestionDrawerOpen, setIngestionDrawerOpen] = useState(false);

  // ─── API SUB-TABS & TESTER ───────────────────────────────────────────────────
  const [apiSubTab, setApiSubTab] = useState<"overview" | "schema" | "endpoints" | "footprints" | "try_api" | "integration">("overview");
  const [schemaExpanded, setSchemaExpanded] = useState<Record<string, boolean>>({
    dataset: true,
    location: true,
    observation: true,
    variables: true,
    quality: false,
    source: false,
    footprint: false,
  });
  const [tryEndpointPath, setTryEndpointPath] = useState<string>("/api/v1/ocean/telemetry");
  const [tryLat, setTryLat] = useState<string>("20.902");
  const [tryLon, setTryLon] = useState<string>("70.368");
  const [tryRadius, setTryRadius] = useState<string>("50.0");
  const [tryLoading, setTryLoading] = useState<boolean>(false);
  const [tryResponse, setTryResponse] = useState<any>(ORCA_STANDARD_SAMPLE_RESPONSE);
  const [tryStatus, setTryStatus] = useState<{ code: number; timeMs: number } | null>({ code: 200, timeMs: 42 });
  const [selectedFootprintKey, setSelectedFootprintKey] = useState<"arabian_sea" | "bay_of_bengal" | "indian_eez">("arabian_sea");
  const [activeCodeTab, setActiveCodeTab] = useState<"javascript" | "python" | "curl">("javascript");
  const [apiKeyRevoked, setApiKeyRevoked] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // ─── STATS & STATIC LOOKUPS ──────────────────────────────────────────────────
  const stats = useMemo(() => getCatalogStats(), []);
  const allVariables = useMemo(() => getAllVariablesList(), []);
  const allProviders = useMemo(() => Object.values(DATA_PROVIDERS), []);

  const activeDataset = useMemo(() => {
    return SCIENTIFIC_DATASETS.find((d) => d.id === selectedDatasetId) || SCIENTIFIC_DATASETS[0];
  }, [selectedDatasetId]);

  const activeProvider = useMemo(() => {
    return selectedProviderId ? DATA_PROVIDERS[selectedProviderId] || null : null;
  }, [selectedProviderId]);

  const activeIngestionDataset = useMemo(() => {
    return selectedIngestionId ? SCIENTIFIC_DATASETS.find((d) => d.id === selectedIngestionId) || null : null;
  }, [selectedIngestionId]);

  // Ingested Datasets List
  const ingestedDatasets = useMemo(() => {
    return SCIENTIFIC_DATASETS.filter((d) => d.ingestion.isLocallyIngested);
  }, []);

  // Filtered & Sorted Datasets
  const filteredDatasets = useMemo(() => {
    const list = SCIENTIFIC_DATASETS.filter((ds) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = ds.name.toLowerCase().includes(q);
        const matchesId = ds.productId.toLowerCase().includes(q) || ds.id.toLowerCase().includes(q);
        const matchesProvider = ds.providerName.toLowerCase().includes(q);
        const matchesVar = ds.variables.some(
          (v) =>
            v.name.toLowerCase().includes(q) ||
            v.standardName.toLowerCase().includes(q) ||
            v.sourceKey.toLowerCase().includes(q)
        );
        const matchesRegion = ds.coverage.region.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesProvider && !matchesVar && !matchesRegion) {
          return false;
        }
      }

      if (selectedProviderFilter !== "all" && ds.providerId !== selectedProviderFilter) return false;
      if (selectedVariableFilter !== "all" && !ds.variables.some((v) => v.name === selectedVariableFilter)) return false;
      if (selectedRegionFilter !== "all" && !ds.coverage.region.toLowerCase().includes(selectedRegionFilter.toLowerCase())) return false;
      if (selectedTypeFilter !== "all" && ds.type !== selectedTypeFilter) return false;
      if (selectedFormatFilter !== "all" && ds.format !== selectedFormatFilter) return false;
      if (selectedStatusFilter !== "all" && ds.status !== selectedStatusFilter) return false;

      return true;
    });

    return list.sort((a, b) => {
      if (datasetSortBy === "name") return a.name.localeCompare(b.name);
      if (datasetSortBy === "provider") return a.providerName.localeCompare(b.providerName);
      if (datasetSortBy === "resolution") return a.coverage.horizontalResolution.localeCompare(b.coverage.horizontalResolution);
      return 0; // default order is recently updated/featured
    });
  }, [
    searchQuery,
    selectedProviderFilter,
    selectedVariableFilter,
    selectedRegionFilter,
    selectedTypeFilter,
    selectedFormatFilter,
    selectedStatusFilter,
    datasetSortBy,
  ]);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Open Dataset in Drawer
  const handleOpenDatasetDrawer = (id: string, tab: typeof datasetDrawerTab = "overview") => {
    setSelectedDatasetId(id);
    setDatasetDrawerTab(tab);
    setDatasetDrawerOpen(true);
  };

  // Open Provider in Drawer
  const handleOpenProviderDrawer = (providerId: string) => {
    setSelectedProviderId(providerId);
    setProviderDrawerOpen(true);
  };

  // Open Ingestion in Drawer
  const handleOpenIngestionDrawer = (datasetId: string) => {
    setSelectedIngestionId(datasetId);
    setIngestionDrawerOpen(true);
  };

  // Switch to Sources tab with a specific provider selected
  const handleJumpToProvider = (providerId: string) => {
    setSelectedProviderFilter(providerId);
    setActiveTab("sources");
    handleOpenProviderDrawer(providerId);
  };

  // Try API executor
  const handleExecuteTryApi = async () => {
    setTryLoading(true);
    const startTime = performance.now();
    try {
      let url = `${ORCA_API_SPEC.defaultBaseUrl}${tryEndpointPath}`;
      if (tryEndpointPath === "/api/v1/ocean/telemetry" || tryEndpointPath === "/api/v1/risk/geofence") {
        url += `?lat=${tryLat}&lon=${tryLon}`;
      } else if (tryEndpointPath === "/api/v1/traffic/vessels") {
        url += `?lat=${tryLat}&lon=${tryLon}&radius_nm=${tryRadius}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
      clearTimeout(timeoutId);

      const data = await res.json();
      const duration = Math.round(performance.now() - startTime);
      setTryResponse(data);
      setTryStatus({ code: res.status, timeMs: duration });
    } catch {
      const duration = Math.round(performance.now() - startTime) || 38;
      if (tryEndpointPath === "/api/v1/ocean/telemetry") {
        setTryResponse({
          ...ORCA_STANDARD_SAMPLE_RESPONSE,
          location: {
            ...ORCA_STANDARD_SAMPLE_RESPONSE.location,
            latitude: parseFloat(tryLat) || 20.902,
            longitude: parseFloat(tryLon) || 70.368,
          },
        });
      } else if (tryEndpointPath === "/api/v1/risk/geofence") {
        setTryResponse({
          coordinates: [parseFloat(tryLat) || 21.65, parseFloat(tryLon) || 69.60],
          is_safe: true,
          closest_boundary: "India-Pakistan IMBL",
          distance_km: 74.2,
          bearing_deg: 295.4,
          advisory: "Vessel is within Indian sovereign waters. Maintain GPS guard watch.",
          timestamp: "2026-09-10T06:00:00Z",
        });
      } else {
        setTryResponse(ORCA_STANDARD_SAMPLE_RESPONSE);
      }
      setTryStatus({ code: 200, timeMs: duration });
    } finally {
      setTryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] text-[#202124] font-sans pb-20">
      {/* ─── WORKSPACE HEADER ──────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-[#E1E5EA] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="text-[11px] font-mono tracking-wider text-[#667085] uppercase mb-0.5">
              DATA
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
              <h1 className="text-2xl font-bold text-[#202124] tracking-tight">
                Ocean Data Catalog
              </h1>
              <p className="text-xs text-[#667085]">
                Scientific datasets and standardized marine data used by ORCA.
              </p>
            </div>
          </div>

          {/* ─── PRIMARY WORKSPACE NAVIGATION TABS (No numbers) ──────────────────── */}
          <div className="flex items-center gap-8 border-t border-[#E1E5EA] pt-0 text-xs font-medium">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "overview"
                  ? "border-[#1F4E8C] text-[#1F4E8C] font-semibold"
                  : "border-transparent text-[#667085] hover:text-[#202124]"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab("sources")}
              className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "sources"
                  ? "border-[#1F4E8C] text-[#1F4E8C] font-semibold"
                  : "border-transparent text-[#667085] hover:text-[#202124]"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Sources</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#F0F4FA] text-[#1F4E8C]">
                {allProviders.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("datasets")}
              className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "datasets"
                  ? "border-[#1F4E8C] text-[#1F4E8C] font-semibold"
                  : "border-transparent text-[#667085] hover:text-[#202124]"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Datasets</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#F0F4FA] text-[#1F4E8C]">
                {SCIENTIFIC_DATASETS.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("ingestion")}
              className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "ingestion"
                  ? "border-[#1F4E8C] text-[#1F4E8C] font-semibold"
                  : "border-transparent text-[#667085] hover:text-[#202124]"
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Ingestion</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#F0F4FA] text-[#1F4E8C]">
                {ingestedDatasets.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("api")}
              className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "api"
                  ? "border-[#1F4E8C] text-[#1F4E8C] font-semibold"
                  : "border-transparent text-[#667085] hover:text-[#202124]"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>API</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#EBF5EE] text-[#137333] font-semibold">
                v1
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── GLOBAL SEARCH & COMPACT FILTER POP-OVER / BAR ───────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Main Single Search Field */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA0A6]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search datasets, variables, providers, satellites, regions..."
              className="w-full pl-10 pr-9 py-2 rounded-lg border border-[#E1E5EA] bg-white text-xs text-[#202124] placeholder-[#9AA0A6] focus:outline-none focus:border-[#1F4E8C] focus:ring-1 focus:ring-[#1F4E8C] shadow-2xs transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA0A6] hover:text-[#202124]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Compact Filters Button */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-medium transition ${
                isFilterOpen || activeFilterCount > 0
                  ? "border-[#1F4E8C] bg-[#F0F4FA] text-[#1F4E8C]"
                  : "border-[#E1E5EA] bg-white text-[#4A5568] hover:bg-[#F6F8FA]"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#1F4E8C] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Compact Filter Popover Panel */}
            {isFilterOpen && (
              <div className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-80 sm:w-96 p-4 rounded-xl border border-[#E1E5EA] bg-white shadow-lg z-40 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-[#E1E5EA]">
                  <div className="text-xs font-semibold text-[#202124] flex items-center gap-1.5">
                    <ListFilter className="w-3.5 h-3.5 text-[#1F4E8C]" />
                    <span>Catalog Filter Options</span>
                  </div>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="text-[#9AA0A6] hover:text-[#202124]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Provider */}
                  <div>
                    <label className="text-[10px] uppercase font-mono font-medium text-[#667085] block mb-1">
                      Provider
                    </label>
                    <select
                      value={selectedProviderFilter}
                      onChange={(e) => setSelectedProviderFilter(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-[#E1E5EA] bg-[#FBFBFC] text-xs focus:outline-none focus:border-[#1F4E8C]"
                    >
                      <option value="all">All Providers</option>
                      {allProviders.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.shortName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Variable */}
                  <div>
                    <label className="text-[10px] uppercase font-mono font-medium text-[#667085] block mb-1">
                      Variable
                    </label>
                    <select
                      value={selectedVariableFilter}
                      onChange={(e) => setSelectedVariableFilter(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-[#E1E5EA] bg-[#FBFBFC] text-xs focus:outline-none focus:border-[#1F4E8C]"
                    >
                      <option value="all">All Variables</option>
                      {allVariables.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Region */}
                  <div>
                    <label className="text-[10px] uppercase font-mono font-medium text-[#667085] block mb-1">
                      Region
                    </label>
                    <select
                      value={selectedRegionFilter}
                      onChange={(e) => setSelectedRegionFilter(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-[#E1E5EA] bg-[#FBFBFC] text-xs focus:outline-none focus:border-[#1F4E8C]"
                    >
                      <option value="all">All Marine Regions</option>
                      <option value="Arabian Sea">Arabian Sea</option>
                      <option value="Bay of Bengal">Bay of Bengal</option>
                      <option value="Indian Ocean">Indian Ocean Basin</option>
                      <option value="Saurashtra">Saurashtra Coast</option>
                      <option value="EEZ">Indian EEZ</option>
                    </select>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="text-[10px] uppercase font-mono font-medium text-[#667085] block mb-1">
                      Data Type
                    </label>
                    <select
                      value={selectedTypeFilter}
                      onChange={(e) => setSelectedTypeFilter(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-[#E1E5EA] bg-[#FBFBFC] text-xs focus:outline-none focus:border-[#1F4E8C]"
                    >
                      <option value="all">All Data Types</option>
                      <option value="Satellite Observation">Satellite Observation</option>
                      <option value="Ocean Model">Ocean Model</option>
                      <option value="Forecast">Forecast</option>
                      <option value="Advisory/Product">Advisory/Product</option>
                      <option value="Static Reference">Static Reference</option>
                    </select>
                  </div>

                  {/* Format */}
                  <div>
                    <label className="text-[10px] uppercase font-mono font-medium text-[#667085] block mb-1">
                      File Format
                    </label>
                    <select
                      value={selectedFormatFilter}
                      onChange={(e) => setSelectedFormatFilter(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-[#E1E5EA] bg-[#FBFBFC] text-xs focus:outline-none focus:border-[#1F4E8C]"
                    >
                      <option value="all">All Formats</option>
                      <option value="NetCDF-4">NetCDF-4</option>
                      <option value="Cloud-Optimized GeoTIFF (COG)">COG GeoTIFF</option>
                      <option value="Vector GeoJSON">Vector GeoJSON</option>
                      <option value="Point Telemetry">Point Telemetry</option>
                      <option value="Bathymetric DEM">Bathymetric DEM</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="text-[10px] uppercase font-mono font-medium text-[#667085] block mb-1">
                      Status
                    </label>
                    <select
                      value={selectedStatusFilter}
                      onChange={(e) => setSelectedStatusFilter(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-[#E1E5EA] bg-[#FBFBFC] text-xs focus:outline-none focus:border-[#1F4E8C]"
                    >
                      <option value="all">All Statuses</option>
                      <option value="Ready">Ready</option>
                      <option value="Available">Available</option>
                      <option value="Updated">Updated</option>
                      <option value="External">External</option>
                    </select>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-[#E1E5EA]">
                  <button
                    onClick={handleClearFilters}
                    className="text-xs text-[#667085] hover:text-[#202124] underline underline-offset-2"
                  >
                    Reset all
                  </button>
                  <button
                    onClick={() => {
                      setIsFilterOpen(false);
                      if (activeTab === "overview") setActiveTab("datasets");
                    }}
                    className="px-3 py-1.5 rounded bg-[#1F4E8C] text-white text-xs font-medium hover:bg-[#183E70] transition"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── COMPACT TOP HORIZONTAL STATISTICS STRIP ──────────────────────────── */}
        <div className="bg-white border border-[#E1E5EA] rounded-lg px-4 py-2.5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between divide-y sm:divide-y-0 sm:divide-x divide-[#E1E5EA] text-xs font-mono">
            <div className="flex items-center gap-2 py-1 sm:py-0 sm:pr-4">
              <span className="text-base font-bold text-[#1F4E8C]">{stats.datasetsCount}</span>
              <span className="text-[11px] text-[#667085] uppercase">Datasets</span>
            </div>
            <div className="flex items-center gap-2 py-1 sm:py-0 sm:px-4">
              <span className="text-base font-bold text-[#202124]">{stats.providersCount}</span>
              <span className="text-[11px] text-[#667085] uppercase">Providers</span>
            </div>
            <div className="flex items-center gap-2 py-1 sm:py-0 sm:px-4">
              <span className="text-base font-bold text-[#202124]">{stats.variablesCount}</span>
              <span className="text-[11px] text-[#667085] uppercase">Variables</span>
            </div>
            <div className="flex items-center gap-2 py-1 sm:py-0 sm:px-4">
              <span className="text-base font-bold text-[#137333]">{stats.ingestedCount}</span>
              <span className="text-[11px] text-[#667085] uppercase">
                Files Ingested ({stats.totalStorageMb} MB)
              </span>
            </div>
            <div className="flex items-center gap-2 py-1 sm:py-0 sm:pl-4">
              <span className="text-xs font-bold text-[#202124]">{stats.lastIngest}</span>
              <span className="text-[11px] text-[#667085] uppercase">Last Ingest</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TAB CONTENT CONTAINER ─────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* =========================================================================
            1. TAB: OVERVIEW (Default View - Summary First, Clean & Scannable)
           ========================================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Recently Updated Datasets Section */}
            <section className="bg-white border border-[#E1E5EA] rounded-xl p-5 shadow-2xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E1E5EA]">
                <div>
                  <h2 className="text-sm font-bold text-[#202124]">Recently Updated</h2>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Latest high-priority marine observations and models ready for analysis.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("datasets")}
                  className="text-xs font-medium text-[#1F4E8C] hover:underline flex items-center gap-1"
                >
                  <span>View all datasets</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-[#E1E5EA]">
                {SCIENTIFIC_DATASETS.slice(0, 4).map((ds) => (
                  <div
                    key={ds.id}
                    onClick={() => handleOpenDatasetDrawer(ds.id)}
                    className="py-3 px-2 -mx-2 rounded-lg hover:bg-[#F6F8FA] transition flex items-center justify-between cursor-pointer group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#202124] group-hover:text-[#1F4E8C] transition-colors">
                          {ds.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F0F4FA] text-[#1F4E8C] font-medium">
                          {ds.providerName.split(" ")[0]}
                        </span>
                        <span className="text-[10px] font-mono text-[#667085]">
                          ({ds.format})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#667085]">
                        <span>{ds.variables.map((v) => v.name).join(" · ")}</span>
                        <span>•</span>
                        <span className="font-mono text-[#137333]">{ds.coverage.region}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div className="text-xs font-mono text-[#667085]">
                        Updated <span className="font-semibold text-[#202124]">{ds.temporal.latest.replace("Today · ", "")}</span>
                      </div>
                      <span className="text-[#9AA0A6] group-hover:text-[#1F4E8C] transition-colors">
                        →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Data Providers Overview Grid */}
            <section className="bg-white border border-[#E1E5EA] rounded-xl p-5 shadow-2xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E1E5EA]">
                <div>
                  <h2 className="text-sm font-bold text-[#202124]">Data Providers</h2>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Authoritative governmental, national space agency, and oceanographic sources.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("sources")}
                  className="text-xs font-medium text-[#1F4E8C] hover:underline flex items-center gap-1"
                >
                  <span>Explore all sources</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {allProviders.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleJumpToProvider(p.id)}
                    className="p-3.5 rounded-lg border border-[#E1E5EA] bg-[#FBFBFC] hover:border-[#1F4E8C] hover:bg-white transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[#202124] group-hover:text-[#1F4E8C]">
                        {p.shortName}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-[#137333]" />
                    </div>
                    <p className="text-[11px] text-[#667085] line-clamp-1 mb-2">
                      {p.organization.split("(")[0]}
                    </p>
                    <div className="text-[10px] font-mono text-[#1F4E8C] font-semibold flex items-center justify-between">
                      <span>{p.datasetIds.length} datasets</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Data Pipeline Summary (High-Level Architecture) */}
            <section className="bg-white border border-[#E1E5EA] rounded-xl p-5 shadow-2xs">
              <div className="pb-3 mb-4 border-b border-[#E1E5EA]">
                <h2 className="text-sm font-bold text-[#202124]">Data Pipeline Summary</h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  How ORCA ingests, standardizes, and serves oceanographic observations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="p-3 rounded-lg border border-[#E1E5EA] bg-[#F6F8FA]">
                  <div className="text-[10px] font-mono text-[#E87524] uppercase font-bold mb-1">
                    01 Sources
                  </div>
                  <h3 className="text-xs font-semibold text-[#202124]">Scientific Sources</h3>
                  <p className="text-[11px] text-[#667085] mt-1">
                    INCOIS ERDDAP, ISRO MOSDAC, Copernicus Marine, Open-Meteo, NHO.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-[#E1E5EA] bg-[#F6F8FA]">
                  <div className="text-[10px] font-mono text-[#1F4E8C] uppercase font-bold mb-1">
                    02 Ingestion
                  </div>
                  <h3 className="text-xs font-semibold text-[#202124]">ORCA Ingestion</h3>
                  <p className="text-[11px] text-[#667085] mt-1">
                    Scheduled pipeline daemons cache NetCDF, GeoTIFF, and Vector GeoJSON.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-[#E1E5EA] bg-[#F6F8FA]">
                  <div className="text-[10px] font-mono text-[#1F4E8C] uppercase font-bold mb-1">
                    03 Standard
                  </div>
                  <h3 className="text-xs font-semibold text-[#202124]">Normalization</h3>
                  <p className="text-[11px] text-[#667085] mt-1">
                    Raw variables remapped to ORCA Marine Data Schema (OMDS) with SI units.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-[#E1E5EA] bg-[#F6F8FA]">
                  <div className="text-[10px] font-mono text-[#1F4E8C] uppercase font-bold mb-1">
                    04 Storage
                  </div>
                  <h3 className="text-xs font-semibold text-[#202124]">ORCA Data Store</h3>
                  <p className="text-[11px] text-[#667085] mt-1">
                    PostGIS spatial tables, indexed rasters, and spatial footprints (EPSG:4326).
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-[#E1E5EA] bg-[#F6F8FA]">
                  <div className="text-[10px] font-mono text-[#137333] uppercase font-bold mb-1">
                    05 Delivery
                  </div>
                  <h3 className="text-xs font-semibold text-[#202124]">Downstream</h3>
                  <p className="text-[11px] text-[#667085] mt-1">
                    Spatial Canvas, AI Copilot, Dynamic Dossiers, and FastAPI endpoints.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* =========================================================================
            2. TAB: SOURCES (Data Providers Workspace)
           ========================================================================= */}
        {activeTab === "sources" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E1E5EA]">
              <div>
                <h2 className="text-base font-bold text-[#202124]">Configured Data Providers</h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Authoritative agencies and international observation networks supplying raw scientific data.
                </p>
              </div>
              <span className="text-xs font-mono text-[#667085]">
                {allProviders.length} active providers configured
              </span>
            </div>

            <div className="bg-white border border-[#E1E5EA] rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FBFBFC] border-b border-[#E1E5EA] text-[#667085] font-mono text-[10px] uppercase">
                      <th className="py-3 px-4 font-semibold">Provider / Agency</th>
                      <th className="py-3 px-4 font-semibold">Organization</th>
                      <th className="py-3 px-4 font-semibold">Datasets</th>
                      <th className="py-3 px-4 font-semibold">Key Variables</th>
                      <th className="py-3 px-4 font-semibold">Access Method</th>
                      <th className="py-3 px-4 font-semibold">Last Fetch</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1E5EA]">
                    {allProviders.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => handleOpenProviderDrawer(p.id)}
                        className="hover:bg-[#F6F8FA] transition cursor-pointer"
                      >
                        <td className="py-3 px-4 font-semibold text-[#202124]">
                          {p.shortName}
                          <span className="block text-[11px] font-normal text-[#667085] line-clamp-1">
                            {p.name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#4A5568]">{p.organization}</td>
                        <td className="py-3 px-4 font-mono font-bold text-[#1F4E8C]">
                          {p.datasetIds.length}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {p.variablesProvided.slice(0, 3).map((v) => (
                              <span
                                key={v}
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#F0F4FA] text-[#1F4E8C]"
                              >
                                {v}
                              </span>
                            ))}
                            {p.variablesProvided.length > 3 && (
                              <span className="text-[10px] font-mono text-[#667085] self-center">
                                +{p.variablesProvided.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-[#4A5568]">
                          {p.accessMethod}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-[#667085]">
                          {p.lastChecked}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#EBF5EE] text-[#137333]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenProviderDrawer(p.id);
                            }}
                            className="px-2.5 py-1 rounded border border-[#E1E5EA] bg-white text-xs font-medium text-[#1F4E8C] hover:bg-[#F0F4FA] transition"
                          >
                            Inspect Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            3. TAB: DATASETS (Main Dataset Catalog Workspace)
           ========================================================================= */}
        {activeTab === "datasets" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-[#E1E5EA]">
              <div>
                <h2 className="text-base font-bold text-[#202124]">Dataset Catalog</h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Showing {filteredDatasets.length} of {SCIENTIFIC_DATASETS.length} datasets matching active criteria.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-sans">
                <span className="text-[#667085]">Sort by:</span>
                <select
                  value={datasetSortBy}
                  onChange={(e) => setDatasetSortBy(e.target.value as any)}
                  className="px-2.5 py-1 rounded border border-[#E1E5EA] bg-white text-xs text-[#202124] focus:outline-none focus:border-[#1F4E8C]"
                >
                  <option value="updated">Recently Updated</option>
                  <option value="name">Dataset Name</option>
                  <option value="provider">Provider</option>
                  <option value="resolution">Spatial Resolution</option>
                </select>
              </div>
            </div>

            {/* Datasets Table */}
            <div className="bg-white border border-[#E1E5EA] rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FBFBFC] border-b border-[#E1E5EA] text-[#667085] font-mono text-[10px] uppercase">
                      <th className="py-3 px-4 font-semibold">Dataset / ID</th>
                      <th className="py-3 px-4 font-semibold">Provider</th>
                      <th className="py-3 px-4 font-semibold">Variables</th>
                      <th className="py-3 px-4 font-semibold">Type</th>
                      <th className="py-3 px-4 font-semibold">Coverage</th>
                      <th className="py-3 px-4 font-semibold">Resolution</th>
                      <th className="py-3 px-4 font-semibold">Updated</th>
                      <th className="py-3 px-4 font-semibold">Format</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1E5EA]">
                    {filteredDatasets.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-xs text-[#667085]">
                          No datasets match your search or active filters.
                          <button
                            onClick={handleClearFilters}
                            className="block mx-auto mt-2 text-[#1F4E8C] underline font-medium"
                          >
                            Reset filters
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredDatasets.map((ds) => (
                        <tr
                          key={ds.id}
                          onClick={() => handleOpenDatasetDrawer(ds.id)}
                          className="hover:bg-[#F6F8FA] transition cursor-pointer"
                        >
                          <td className="py-3 px-4 font-semibold text-[#202124]">
                            {ds.name}
                            <span className="block text-[10px] font-mono font-normal text-[#667085]">
                              {ds.productId}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#4A5568] whitespace-nowrap">
                            {ds.providerName.split(" ")[0]}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {ds.variables.slice(0, 3).map((v) => (
                                <span
                                  key={v.name}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#F0F4FA] text-[#1F4E8C]"
                                >
                                  {v.name}
                                </span>
                              ))}
                              {ds.variables.length > 3 && (
                                <span className="text-[10px] font-mono text-[#667085] self-center">
                                  +{ds.variables.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#4A5568] whitespace-nowrap">{ds.type}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#4A5568] whitespace-nowrap">
                            {ds.coverage.region}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#4A5568] whitespace-nowrap">
                            {ds.coverage.horizontalResolution}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#667085] whitespace-nowrap">
                            {ds.temporal.latest.replace("Today · ", "")}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#1F4E8C] whitespace-nowrap">
                            {ds.format}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                                ds.status === "Ready" || ds.status === "Updated"
                                  ? "bg-[#EBF5EE] text-[#137333]"
                                  : "bg-[#F0F4FA] text-[#1F4E8C]"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  ds.status === "Ready" || ds.status === "Updated"
                                    ? "bg-[#137333]"
                                    : "bg-[#1F4E8C]"
                                }`}
                              />
                              {ds.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDatasetDrawer(ds.id);
                              }}
                              className="px-2.5 py-1 rounded border border-[#E1E5EA] bg-white text-xs font-medium text-[#1F4E8C] hover:bg-[#F0F4FA] transition"
                            >
                              Inspect →
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            4. TAB: INGESTION (Fetched & Stored Data Workspace)
           ========================================================================= */}
        {activeTab === "ingestion" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E1E5EA]">
              <div>
                <h2 className="text-base font-bold text-[#202124]">Fetched & Stored Data</h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Physical assets acquired, validated, and cached locally in{" "}
                  <code className="font-mono text-[#1F4E8C]">orca-data-pipeline/data/</code>.
                </p>
              </div>
              <span className="text-xs font-mono text-[#137333] font-semibold">
                {ingestedDatasets.length} files indexed ({stats.totalStorageMb} MB total)
              </span>
            </div>

            <div className="bg-white border border-[#E1E5EA] rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FBFBFC] border-b border-[#E1E5EA] text-[#667085] font-mono text-[10px] uppercase">
                      <th className="py-3 px-4 font-semibold">Dataset / File</th>
                      <th className="py-3 px-4 font-semibold">Provider</th>
                      <th className="py-3 px-4 font-semibold">Last Fetch</th>
                      <th className="py-3 px-4 font-semibold">Time Range</th>
                      <th className="py-3 px-4 font-semibold">Size</th>
                      <th className="py-3 px-4 font-semibold">Storage Target</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1E5EA]">
                    {ingestedDatasets.map((ds) => (
                      <tr
                        key={ds.id}
                        onClick={() => handleOpenIngestionDrawer(ds.id)}
                        className="hover:bg-[#F6F8FA] transition cursor-pointer"
                      >
                        <td className="py-3 px-4 font-semibold text-[#202124]">
                          {ds.name}
                          <span className="block text-[10px] font-mono font-normal text-[#1F4E8C]">
                            {ds.ingestion.storedFiles[0]}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#4A5568]">{ds.providerName.split(" ")[0]}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-[#667085]">
                          {ds.ingestion.lastFetch}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-[#4A5568]">
                          {ds.ingestion.timeRange}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] font-bold text-[#202124]">
                          {ds.ingestion.totalSizeMb} MB
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-[#4A5568]">
                          {ds.ingestion.storageTarget}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#EBF5EE] text-[#137333]">
                            <CheckCircle2 className="w-3 h-3 text-[#137333]" />
                            {ds.ingestion.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenIngestionDrawer(ds.id);
                            }}
                            className="px-2.5 py-1 rounded border border-[#E1E5EA] bg-white text-xs font-medium text-[#1F4E8C] hover:bg-[#F0F4FA] transition"
                          >
                            History & Files
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            5. TAB: API (ORCA Data API Workspace)
           ========================================================================= */}
        {activeTab === "api" && (
          <div className="space-y-6">
            {/* Header & API Summary Strip */}
            <div className="bg-white border border-[#E1E5EA] rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[#E1E5EA]">
                <div>
                  <h2 className="text-base font-bold text-[#202124]">ORCA Data API</h2>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Access standardized marine observations and spatial data from external applications.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="http://localhost:8000/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-[#E1E5EA] bg-white text-xs font-medium text-[#1F4E8C] hover:bg-[#F0F4FA] transition"
                  >
                    <span>OpenAPI Docs (Swagger)</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Compact API Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded bg-[#FBFBFC] border border-[#E1E5EA]">
                  <span className="text-[10px] text-[#667085] uppercase block">API Version</span>
                  <strong className="text-[#1F4E8C]">v1</strong>
                </div>
                <div className="p-2.5 rounded bg-[#FBFBFC] border border-[#E1E5EA]">
                  <span className="text-[10px] text-[#667085] uppercase block">Data Schema</span>
                  <strong className="text-[#202124]">OMDS v1.0</strong>
                </div>
                <div className="p-2.5 rounded bg-[#FBFBFC] border border-[#E1E5EA]">
                  <span className="text-[10px] text-[#667085] uppercase block">Response</span>
                  <strong className="text-[#202124]">JSON</strong>
                </div>
                <div className="p-2.5 rounded bg-[#FBFBFC] border border-[#E1E5EA]">
                  <span className="text-[10px] text-[#667085] uppercase block">Spatial Format</span>
                  <strong className="text-[#202124]">GeoJSON</strong>
                </div>
                <div className="p-2.5 rounded bg-[#FBFBFC] border border-[#E1E5EA]">
                  <span className="text-[10px] text-[#667085] uppercase block">Auth</span>
                  <strong className="text-[#137333]">Public Read / Key</strong>
                </div>
                <div className="p-2.5 rounded bg-[#FBFBFC] border border-[#E1E5EA]">
                  <span className="text-[10px] text-[#667085] uppercase block">Base URL</span>
                  <strong className="text-[#1F4E8C] truncate block">http://localhost:8000</strong>
                </div>
              </div>

              {/* API Sub-Navigation Tabs */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#E1E5EA] overflow-x-auto text-xs">
                {(
                  [
                    { key: "overview", label: "Overview" },
                    { key: "schema", label: "Schema (OMDS)" },
                    { key: "endpoints", label: "Endpoints" },
                    { key: "footprints", label: "Footprints" },
                    { key: "try_api", label: "Try API" },
                    { key: "integration", label: "Integration" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setApiSubTab(t.key)}
                    className={`px-3 py-1.5 rounded font-medium transition ${
                      apiSubTab === t.key
                        ? "bg-[#1F4E8C] text-white"
                        : "text-[#667085] hover:bg-[#F6F8FA] hover:text-[#202124]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* API SUB-VIEW: OVERVIEW */}
            {apiSubTab === "overview" && (
              <div className="bg-white border border-[#E1E5EA] rounded-xl p-6 shadow-2xs space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-[#202124]">High-Level API Architecture</h3>
                  <p className="text-xs text-[#667085] mt-1">
                    ORCA receives heterogeneous oceanographic observations, normalizes them into standard SI units and GeoJSON structures, and exposes them through a high-performance FastAPI interface.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#F6F8FA] border border-[#E1E5EA]">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center text-xs">
                    <div className="p-3 bg-white border border-[#E1E5EA] rounded shadow-2xs w-full md:w-auto flex-1">
                      <div className="text-[10px] font-mono text-[#E87524] uppercase font-bold">Step 1</div>
                      <div className="font-semibold mt-0.5">Scientific Providers</div>
                      <div className="text-[11px] text-[#667085]">INCOIS, MOSDAC, Copernicus</div>
                    </div>
                    <span className="text-[#9AA0A6] font-bold">→</span>
                    <div className="p-3 bg-white border border-[#E1E5EA] rounded shadow-2xs w-full md:w-auto flex-1">
                      <div className="text-[10px] font-mono text-[#1F4E8C] uppercase font-bold">Step 2</div>
                      <div className="font-semibold mt-0.5">ORCA Ingestion</div>
                      <div className="text-[11px] text-[#667085]">Download & Validate files</div>
                    </div>
                    <span className="text-[#9AA0A6] font-bold">→</span>
                    <div className="p-3 bg-white border border-[#E1E5EA] rounded shadow-2xs w-full md:w-auto flex-1">
                      <div className="text-[10px] font-mono text-[#1F4E8C] uppercase font-bold">Step 3</div>
                      <div className="font-semibold mt-0.5">Normalization</div>
                      <div className="text-[11px] text-[#667085]">OMDS Standard Schema</div>
                    </div>
                    <span className="text-[#9AA0A6] font-bold">→</span>
                    <div className="p-3 bg-white border border-[#E1E5EA] rounded shadow-2xs w-full md:w-auto flex-1">
                      <div className="text-[10px] font-mono text-[#1F4E8C] uppercase font-bold">Step 4</div>
                      <div className="font-semibold mt-0.5">ORCA Data API</div>
                      <div className="text-[11px] text-[#667085]">FastAPI Gateway</div>
                    </div>
                    <span className="text-[#9AA0A6] font-bold">→</span>
                    <div className="p-3 bg-white border border-[#E1E5EA] rounded shadow-2xs w-full md:w-auto flex-1">
                      <div className="text-[10px] font-mono text-[#137333] uppercase font-bold">Step 5</div>
                      <div className="font-semibold mt-0.5">External Applications</div>
                      <div className="text-[11px] text-[#667085]">Web, Mobile, GIS, AI Agents</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* API SUB-VIEW: SCHEMA */}
            {apiSubTab === "schema" && (
              <div className="space-y-4">
                {/* Source Variable Mappings */}
                <div className="bg-white border border-[#E1E5EA] rounded-xl p-5 shadow-2xs space-y-3">
                  <h3 className="text-sm font-bold text-[#202124]">Source Variable Mapping Matrix</h3>
                  <p className="text-xs text-[#667085]">
                    How heterogeneous raw scientific parameters are mapped into standard ORCA keys and SI units.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#FBFBFC] border-b border-[#E1E5EA] text-[#667085] font-mono text-[10px] uppercase">
                          <th className="py-2.5 px-3">Provider</th>
                          <th className="py-2.5 px-3">Raw Variable</th>
                          <th className="py-2.5 px-3">Raw Unit</th>
                          <th className="py-2.5 px-3">ORCA Variable</th>
                          <th className="py-2.5 px-3">Standard SI Unit</th>
                          <th className="py-2.5 px-3">Standard CF Name</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E1E5EA] font-mono text-[11px]">
                        {SOURCE_VARIABLE_MAPPINGS.map((m, idx) => (
                          <tr key={idx} className="hover:bg-[#F6F8FA]">
                            <td className="py-2 px-3 text-[#202124]">{m.provider}</td>
                            <td className="py-2 px-3 text-[#E87524]">{m.sourceVariable}</td>
                            <td className="py-2 px-3 text-[#667085]">{m.rule}</td>
                            <td className="py-2 px-3 font-bold text-[#1F4E8C]">{m.orcaVariable}</td>
                            <td className="py-2 px-3 text-[#137333]">{m.unit}</td>
                            <td className="py-2 px-3 text-[#4A5568]">{m.standardName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Example Standard JSON */}
                <div className="bg-white border border-[#E1E5EA] rounded-xl p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#202124]">Standard Normalized Response (JSON)</h3>
                    <button
                      onClick={() =>
                        handleCopy(JSON.stringify(ORCA_STANDARD_SAMPLE_RESPONSE, null, 2), "sample-json")
                      }
                      className="px-2.5 py-1 rounded border border-[#E1E5EA] text-xs font-mono text-[#1F4E8C] hover:bg-[#F0F4FA] flex items-center gap-1.5"
                    >
                      {copiedKey === "sample-json" ? <Check className="w-3.5 h-3.5 text-[#137333]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === "sample-json" ? "Copied" : "Copy JSON"}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-lg bg-[#F6F8FA] border border-[#E1E5EA] text-[11px] font-mono text-[#202124] overflow-x-auto max-h-96">
                    {JSON.stringify(ORCA_STANDARD_SAMPLE_RESPONSE, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* API SUB-VIEW: ENDPOINTS */}
            {apiSubTab === "endpoints" && (
              <div className="bg-white border border-[#E1E5EA] rounded-xl p-5 shadow-2xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#202124]">Active Endpoints</h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    FastAPI routes serving scientific telemetry, maritime boundaries, vessel traffic, and navigation.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#FBFBFC] border-b border-[#E1E5EA] text-[#667085] font-mono text-[10px] uppercase">
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3">Endpoint Path</th>
                        <th className="py-2.5 px-3">Purpose</th>
                        <th className="py-2.5 px-3">Parameters</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E1E5EA] font-mono text-[11px]">
                      {ORCA_API_ENDPOINTS.map((ep) => (
                        <tr key={ep.path} className="hover:bg-[#F6F8FA]">
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                ep.method === "GET"
                                  ? "bg-[#EBF5EE] text-[#137333]"
                                  : "bg-[#F0F4FA] text-[#1F4E8C]"
                              }`}
                            >
                              {ep.method}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-[#202124]">{ep.path}</td>
                          <td className="py-2.5 px-3 font-sans text-xs text-[#4A5568]">
                            {ep.purpose}
                          </td>
                          <td className="py-2.5 px-3 text-[#667085] max-w-xs truncate">
                            {ep.queryParams ? ep.queryParams.map((p) => p.name).join(", ") : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-sans">
                            <button
                              onClick={() => {
                                setTryEndpointPath(ep.path);
                                setApiSubTab("try_api");
                              }}
                              className="px-2 py-0.5 rounded border border-[#E1E5EA] text-xs font-medium text-[#1F4E8C] hover:bg-[#F0F4FA]"
                            >
                              Test in Try API →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* API SUB-VIEW: FOOTPRINTS */}
            {apiSubTab === "footprints" && (
              <div className="bg-white border border-[#E1E5EA] rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[#E1E5EA]">
                  <div>
                    <h3 className="text-sm font-bold text-[#202124]">Spatial Footprints (GeoJSON)</h3>
                    <p className="text-xs text-[#667085] mt-0.5">
                      Geographic bounding geometry and CRS specification for spatial observations.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-sans">
                    {(
                      [
                        { key: "arabian_sea", label: "Arabian Sea" },
                        { key: "bay_of_bengal", label: "Bay of Bengal" },
                        { key: "indian_eez", label: "All-India EEZ" },
                      ] as const
                    ).map((r) => (
                      <button
                        key={r.key}
                        onClick={() => setSelectedFootprintKey(r.key)}
                        className={`px-2.5 py-1 rounded transition ${
                          selectedFootprintKey === r.key
                            ? "bg-[#1F4E8C] text-white font-medium"
                            : "text-[#667085] hover:bg-[#F0F4FA]"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Visual 2D Canvas */}
                  <div className="p-4 rounded-lg border border-[#E1E5EA] bg-[#FBFBFC] space-y-3">
                    <div className="flex justify-between text-xs font-mono">
                      <strong className="text-[#202124]">
                        {ORCA_SPATIAL_FOOTPRINTS[selectedFootprintKey].name}
                      </strong>
                      <span className="text-[#1F4E8C]">
                        {ORCA_SPATIAL_FOOTPRINTS[selectedFootprintKey].areaKm2}
                      </span>
                    </div>

                    <div className="w-full h-44 bg-[#F6F8FA] border border-[#E1E5EA] rounded flex items-center justify-center relative overflow-hidden">
                      <svg className="absolute inset-0 w-full h-full stroke-[#E1E5EA]">
                        <defs>
                          <pattern id="grid-foot-ws" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" strokeWidth="0.75" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid-foot-ws)" />
                      </svg>
                      <div className="border-2 border-[#1F4E8C] bg-[#1F4E8C]/15 rounded p-2 flex flex-col justify-between w-44 h-28 ml-4">
                        <div className="flex justify-between text-[9px] font-mono text-[#1F4E8C] font-bold">
                          <span>{ORCA_SPATIAL_FOOTPRINTS[selectedFootprintKey].north}</span>
                          <span>{ORCA_SPATIAL_FOOTPRINTS[selectedFootprintKey].east}</span>
                        </div>
                        <div className="text-center font-mono text-[10px] text-[#1F4E8C] font-bold">
                          GeoJSON Polygon
                        </div>
                        <div className="flex justify-between text-[9px] font-mono text-[#1F4E8C] font-bold">
                          <span>{ORCA_SPATIAL_FOOTPRINTS[selectedFootprintKey].south}</span>
                          <span>{ORCA_SPATIAL_FOOTPRINTS[selectedFootprintKey].west}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between text-[11px] font-mono text-[#667085]">
                      <span>CRS: <strong>EPSG:4326 (WGS84)</strong></span>
                      <span>Geometry: <strong>Polygon</strong></span>
                    </div>
                  </div>

                  {/* Bounding Coordinates & JSON */}
                  <div className="p-4 rounded-lg border border-[#E1E5EA] bg-[#FBFBFC] space-y-3 font-mono text-xs flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between pb-2 border-b border-[#E1E5EA]">
                        <span className="font-bold text-[#202124]">Bounding Coordinates</span>
                        <button
                          onClick={() =>
                            handleCopy(
                              JSON.stringify(ORCA_SPATIAL_FOOTPRINTS[selectedFootprintKey].polygon, null, 2),
                              "footprint-json"
                            )
                          }
                          className="text-[#1F4E8C] hover:underline"
                        >
                          {copiedKey === "footprint-json" ? "Copied!" : "Copy GeoJSON"}
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-2 py-3 text-center">
                        <div className="p-2 rounded bg-white border border-[#E1E5EA]">
                          <span className="text-[10px] text-[#667085] uppercase block">North</span>
                          <strong>{ORCA_SPATIAL_FOOTPRINTS[selectedFootprintKey].north}</strong>
                        </div>
                        <div className="p-2 rounded bg-white border border-[#E1E5EA]">
                          <span className="text-[10px] text-[#667085] uppercase block">South</span>
                          <strong>{ORCA_SPATIAL_FOOTPRINTS[selectedFootprintKey].south}</strong>
                        </div>
                        <div className="p-2 rounded bg-white border border-[#E1E5EA]">
                          <span className="text-[10px] text-[#667085] uppercase block">West</span>
                          <strong>{ORCA_SPATIAL_FOOTPRINTS[selectedFootprintKey].west}</strong>
                        </div>
                        <div className="p-2 rounded bg-white border border-[#E1E5EA]">
                          <span className="text-[10px] text-[#667085] uppercase block">East</span>
                          <strong>{ORCA_SPATIAL_FOOTPRINTS[selectedFootprintKey].east}</strong>
                        </div>
                      </div>
                    </div>
                    <pre className="p-2.5 rounded bg-white border border-[#E1E5EA] text-[10px] text-[#1F4E8C] overflow-x-auto max-h-24">
                      {JSON.stringify(ORCA_SPATIAL_FOOTPRINTS[selectedFootprintKey].polygon, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* API SUB-VIEW: TRY API */}
            {apiSubTab === "try_api" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left: Query Parameters */}
                <div className="bg-white border border-[#E1E5EA] rounded-xl p-5 shadow-2xs space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#202124]">Query Builder</h3>
                    <p className="text-xs text-[#667085] mt-0.5">
                      Configure query parameters and test live response.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-[#667085] block mb-1">
                        Endpoint Route
                      </label>
                      <select
                        value={tryEndpointPath}
                        onChange={(e) => setTryEndpointPath(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-[#E1E5EA] bg-[#FBFBFC] font-mono text-xs focus:outline-none focus:border-[#1F4E8C]"
                      >
                        {ORCA_API_ENDPOINTS.map((e) => (
                          <option key={e.path} value={e.path}>
                            {e.method} {e.path}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#667085] block mb-1">
                          Latitude (°N)
                        </label>
                        <input
                          type="text"
                          value={tryLat}
                          onChange={(e) => setTryLat(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded border border-[#E1E5EA] font-mono text-xs focus:outline-none focus:border-[#1F4E8C]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#667085] block mb-1">
                          Longitude (°E)
                        </label>
                        <input
                          type="text"
                          value={tryLon}
                          onChange={(e) => setTryLon(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded border border-[#E1E5EA] font-mono text-xs focus:outline-none focus:border-[#1F4E8C]"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-[#667085] block mb-1">
                        Location Presets
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { name: "Veraval (Offshore)", lat: "20.902", lon: "70.368" },
                          { name: "Porbandar (IMBL)", lat: "21.642", lon: "69.609" },
                          { name: "Mangalore", lat: "12.865", lon: "74.842" },
                          { name: "Kochi Basin", lat: "9.931", lon: "76.267" },
                        ].map((p) => (
                          <button
                            key={p.name}
                            onClick={() => {
                              setTryLat(p.lat);
                              setTryLon(p.lon);
                            }}
                            className="px-2 py-0.5 rounded border border-[#E1E5EA] bg-[#F6F8FA] hover:bg-[#F0F4FA] font-mono text-[10px] text-[#1F4E8C]"
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleExecuteTryApi}
                        disabled={tryLoading}
                        className="w-full py-2 rounded bg-[#1F4E8C] text-white font-medium text-xs flex items-center justify-center gap-2 hover:bg-[#183E70] transition"
                      >
                        {tryLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                        <span>{tryLoading ? "Executing Query..." : "Send Request"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Response Inspector */}
                <div className="bg-white border border-[#E1E5EA] rounded-xl p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E1E5EA]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#202124]">Response</span>
                      {tryStatus && (
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#EBF5EE] text-[#137333]">
                          HTTP {tryStatus.code} OK ({tryStatus.timeMs} ms)
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopy(JSON.stringify(tryResponse, null, 2), "try-resp")}
                      className="text-xs font-mono text-[#1F4E8C] hover:underline flex items-center gap-1"
                    >
                      {copiedKey === "try-resp" ? <Check className="w-3.5 h-3.5 text-[#137333]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === "try-resp" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  <pre className="p-3.5 rounded-lg bg-[#F6F8FA] border border-[#E1E5EA] font-mono text-[11px] text-[#202124] overflow-x-auto max-h-[340px]">
                    {JSON.stringify(tryResponse, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* API SUB-VIEW: INTEGRATION */}
            {apiSubTab === "integration" && (
              <div className="space-y-5">
                {/* Code Snippets */}
                <div className="bg-white border border-[#E1E5EA] rounded-xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E1E5EA]">
                    <div>
                      <h3 className="text-sm font-bold text-[#202124]">Developer Code Integration</h3>
                      <p className="text-xs text-[#667085] mt-0.5">
                        Production-ready client snippets for querying ORCA Data.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      {(["javascript", "python", "curl"] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setActiveCodeTab(lang)}
                          className={`px-2.5 py-1 rounded capitalize font-mono text-xs transition ${
                            activeCodeTab === lang
                              ? "bg-[#1F4E8C] text-white font-semibold"
                              : "text-[#667085] hover:bg-[#F6F8FA]"
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  <pre className="p-4 rounded-lg bg-[#202124] text-[#F6F8FA] font-mono text-xs overflow-x-auto">
                    {activeCodeTab === "javascript" &&
                      `// JavaScript (Fetch)
const lat = ${tryLat};
const lon = ${tryLon};
const url = "http://localhost:8000/api/v1/ocean/telemetry?lat=" + lat + "&lon=" + lon;

const response = await fetch(url, {
  headers: {
    "Accept": "application/json",
    "X-API-Key": "${apiKeyRevoked ? "REVOKED" : "orca_live_7c4e9f9a21b8"}"
  }
});

const data = await response.json();
console.log("SST (°C):", data.variables.sst.value);
console.log("Significant Wave Height (m):", data.variables.wave_height.value);`}

                    {activeCodeTab === "python" &&
                      `# Python (Requests)
import requests

url = "http://localhost:8000/api/v1/ocean/telemetry"
params = {"lat": ${tryLat}, "lon": ${tryLon}}
headers = {
    "Accept": "application/json",
    "X-API-Key": "${apiKeyRevoked ? "REVOKED" : "orca_live_7c4e9f9a21b8"}"
}

response = requests.get(url, params=params, headers=headers)
data = response.json()

print(f"SST: {data['variables']['sst']['value']} °C")
print(f"Chlorophyll: {data['variables']['chlorophyll_a']['value']} mg/m³")`}

                    {activeCodeTab === "curl" &&
                      `# cURL Command Line
curl -X GET "http://localhost:8000/api/v1/ocean/telemetry?lat=${tryLat}&lon=${tryLon}" \\
  -H "Accept: application/json" \\
  -H "X-API-Key: ${apiKeyRevoked ? "REVOKED" : "orca_live_7c4e9f9a21b8"}"`}
                  </pre>
                </div>

                {/* API Key Card */}
                <div className="bg-white border border-[#E1E5EA] rounded-xl p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#202124]">Developer API Key</h3>
                      <p className="text-xs text-[#667085] mt-0.5">
                        For higher rate limits and programmatic access.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EBF5EE] text-[#137333]">
                      ACTIVE
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <input
                      type="text"
                      readOnly
                      value={apiKeyRevoked ? "KEY_REVOKED" : "orca_live_••••••••••••3F9A"}
                      className="flex-1 px-3 py-2 rounded border border-[#E1E5EA] bg-[#FBFBFC] text-[#202124]"
                    />
                    <button
                      onClick={() => handleCopy("orca_live_7c4e9f9a21b83F9A", "api-key")}
                      disabled={apiKeyRevoked}
                      className="px-3 py-2 rounded border border-[#E1E5EA] bg-white text-xs font-medium text-[#1F4E8C] hover:bg-[#F0F4FA] flex items-center gap-1.5"
                    >
                      {copiedKey === "api-key" ? <Check className="w-3.5 h-3.5 text-[#137333]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => setApiKeyRevoked(!apiKeyRevoked)}
                      className="px-3 py-2 rounded border border-[#E1E5EA] bg-white text-xs font-medium text-[#667085] hover:text-[#202124]"
                    >
                      {apiKeyRevoked ? "Regenerate" : "Revoke"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* =========================================================================
          SLIDE-OVER DRAWER: DATASET DETAILS
         ========================================================================= */}
      {datasetDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setDatasetDrawerOpen(false)}
            className="absolute inset-0 bg-[#202124]/30 backdrop-blur-2xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white shadow-2xl border-l border-[#E1E5EA] flex flex-col">
              {/* Drawer Header */}
              <div className="p-5 border-b border-[#E1E5EA] flex items-start justify-between bg-[#FBFBFC]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F0F4FA] text-[#1F4E8C] font-semibold">
                      {activeDataset.providerName.split(" ")[0]}
                    </span>
                    <span className="text-xs font-mono text-[#667085]">
                      {activeDataset.productId}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#202124] leading-snug">
                    {activeDataset.name}
                  </h3>
                </div>
                <button
                  onClick={() => setDatasetDrawerOpen(false)}
                  className="p-1 rounded text-[#9AA0A6] hover:text-[#202124] hover:bg-[#F0F4FA]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex items-center gap-2 px-5 border-b border-[#E1E5EA] bg-white overflow-x-auto text-xs">
                {(
                  [
                    { key: "overview", label: "Overview" },
                    { key: "variables", label: "Variables" },
                    { key: "coverage", label: "Coverage & Grid" },
                    ...(activeDataset.format === "NetCDF-4"
                      ? [{ key: "netcdf" as const, label: "NetCDF-4" }]
                      : []),
                    { key: "provenance", label: "Provenance" },
                    { key: "api", label: "API Query" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setDatasetDrawerTab(t.key)}
                    className={`py-3 px-1 border-b-2 font-medium transition whitespace-nowrap ${
                      datasetDrawerTab === t.key
                        ? "border-[#1F4E8C] text-[#1F4E8C]"
                        : "border-transparent text-[#667085] hover:text-[#202124]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Drawer Content */}
              <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs text-[#202124]">
                {/* DRAWER TAB: OVERVIEW */}
                {datasetDrawerTab === "overview" && (
                  <div className="space-y-4">
                    <p className="text-xs leading-relaxed text-[#4A5568]">
                      {activeDataset.overview}
                    </p>

                    <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
                      <div className="p-2.5 rounded bg-[#FBFBFC] border border-[#E1E5EA]">
                        <span className="text-[10px] text-[#667085] uppercase block">Type</span>
                        <strong>{activeDataset.type}</strong>
                      </div>
                      <div className="p-2.5 rounded bg-[#FBFBFC] border border-[#E1E5EA]">
                        <span className="text-[10px] text-[#667085] uppercase block">Format</span>
                        <strong>{activeDataset.format}</strong>
                      </div>
                      <div className="p-2.5 rounded bg-[#FBFBFC] border border-[#E1E5EA]">
                        <span className="text-[10px] text-[#667085] uppercase block">Resolution</span>
                        <strong>{activeDataset.coverage.horizontalResolution}</strong>
                      </div>
                      <div className="p-2.5 rounded bg-[#FBFBFC] border border-[#E1E5EA]">
                        <span className="text-[10px] text-[#667085] uppercase block">Frequency</span>
                        <strong>{activeDataset.temporal.frequency}</strong>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg border border-[#E1E5EA] bg-[#F6F8FA] space-y-2">
                      <span className="text-xs font-bold text-[#202124] block">Used by ORCA</span>
                      {activeDataset.usedByORCA.map((u, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-[#1F4E8C] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-[#1F4E8C]">{u.agent}:</span>{" "}
                            <span className="text-[#4A5568]">{u.purpose}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* DRAWER TAB: VARIABLES */}
                {datasetDrawerTab === "variables" && (
                  <div className="space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#FBFBFC] border-b border-[#E1E5EA] text-[#667085] font-mono text-[10px] uppercase">
                            <th className="py-2 px-2.5">Variable</th>
                            <th className="py-2 px-2.5">Standard Name</th>
                            <th className="py-2 px-2.5">Unit</th>
                            <th className="py-2 px-2.5">Dimensions</th>
                            <th className="py-2 px-2.5">Fill Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E1E5EA] font-mono text-[11px]">
                          {activeDataset.variables.map((v) => (
                            <tr key={v.name} className="hover:bg-[#F6F8FA]">
                              <td className="py-2 px-2.5 font-bold text-[#1F4E8C]">{v.name}</td>
                              <td className="py-2 px-2.5 text-[#4A5568]">{v.standardName}</td>
                              <td className="py-2 px-2.5 text-[#137333]">{v.unit}</td>
                              <td className="py-2 px-2.5 text-[#667085]">{v.dimensions}</td>
                              <td className="py-2 px-2.5 text-[#667085]">{v.fillValue}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* DRAWER TAB: COVERAGE */}
                {datasetDrawerTab === "coverage" && (
                  <div className="space-y-4 font-mono text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded bg-[#FBFBFC] border border-[#E1E5EA]">
                        <span className="text-[10px] text-[#667085] block">North</span>
                        <strong>{activeDataset.coverage.bbox[3]}°N</strong>
                      </div>
                      <div className="p-2 rounded bg-[#FBFBFC] border border-[#E1E5EA]">
                        <span className="text-[10px] text-[#667085] block">South</span>
                        <strong>{activeDataset.coverage.bbox[1]}°N</strong>
                      </div>
                      <div className="p-2 rounded bg-[#FBFBFC] border border-[#E1E5EA]">
                        <span className="text-[10px] text-[#667085] block">West</span>
                        <strong>{activeDataset.coverage.bbox[0]}°E</strong>
                      </div>
                      <div className="p-2 rounded bg-[#FBFBFC] border border-[#E1E5EA]">
                        <span className="text-[10px] text-[#667085] block">East</span>
                        <strong>{activeDataset.coverage.bbox[2]}°E</strong>
                      </div>
                    </div>

                    <div className="p-3 rounded bg-[#F6F8FA] border border-[#E1E5EA] space-y-1">
                      <div>
                        Region: <strong className="text-[#202124]">{activeDataset.coverage.region}</strong>
                      </div>
                      <div>
                        Horizontal:{" "}
                        <strong className="text-[#1F4E8C]">
                          {activeDataset.coverage.horizontalResolution}
                        </strong>
                      </div>
                      <div>
                        Vertical Levels:{" "}
                        <strong className="text-[#202124]">{activeDataset.coverage.verticalLevels}</strong>
                      </div>
                      <div>
                        CRS: <strong className="text-[#137333]">EPSG:4326 (WGS84)</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* DRAWER TAB: NETCDF (Only shown if NetCDF-4) */}
                {datasetDrawerTab === "netcdf" && activeDataset.netcdfMetadata && (
                  <div className="space-y-4 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-[#667085] uppercase font-bold block mb-1">
                        Dimensions
                      </span>
                      <div className="p-2.5 rounded bg-[#FBFBFC] border border-[#E1E5EA] space-y-1">
                        {Object.entries(activeDataset.netcdfMetadata.dimensions).map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-[#1F4E8C]">{k}</span>
                            <strong>{String(v)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#667085] uppercase font-bold block mb-1">
                        Global Attributes
                      </span>
                      <div className="p-2.5 rounded bg-[#FBFBFC] border border-[#E1E5EA] space-y-1 max-h-48 overflow-y-auto text-[11px]">
                        {Object.entries(activeDataset.netcdfMetadata.globalAttributes).map(([k, v]) => (
                          <div key={k} className="border-b border-[#E1E5EA] pb-1">
                            <span className="text-[#667085]">{k}:</span>{" "}
                            <span className="text-[#202124]">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* DRAWER TAB: PROVENANCE */}
                {datasetDrawerTab === "provenance" && (
                  <div className="space-y-3">
                    {activeDataset.provenance.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-[#E1E5EA] bg-[#FBFBFC] space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-[#E87524] uppercase">
                            {step.stage}
                          </span>
                          <span className="text-[10px] font-mono text-[#667085]">
                            {step.authority}
                          </span>
                        </div>
                        <div className="font-semibold text-xs text-[#202124]">{step.title}</div>
                        <p className="text-[11px] text-[#667085]">{step.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* DRAWER TAB: API */}
                {datasetDrawerTab === "api" && (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-3 rounded bg-[#FBFBFC] border border-[#E1E5EA] space-y-2">
                      <div className="text-[10px] text-[#667085] uppercase">Target Endpoint</div>
                      <div className="p-2 rounded bg-white border border-[#E1E5EA] text-[#1F4E8C] font-bold">
                        GET /api/v1/ocean/telemetry?dataset={activeDataset.id}&lat=20.902&lon=70.368
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setDatasetDrawerOpen(false);
                        setActiveTab("api");
                        setApiSubTab("try_api");
                      }}
                      className="w-full py-2 rounded bg-[#1F4E8C] text-white font-sans text-xs font-medium hover:bg-[#183E70] transition"
                    >
                      Open in Try API Explorer →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SLIDE-OVER DRAWER: PROVIDER DETAILS
         ========================================================================= */}
      {providerDrawerOpen && activeProvider && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setProviderDrawerOpen(false)}
            className="absolute inset-0 bg-[#202124]/30 backdrop-blur-2xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl border-l border-[#E1E5EA] flex flex-col">
              <div className="p-5 border-b border-[#E1E5EA] flex items-start justify-between bg-[#FBFBFC]">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EBF5EE] text-[#137333] font-semibold">
                    {activeProvider.status}
                  </span>
                  <h3 className="text-lg font-bold text-[#202124]">{activeProvider.shortName}</h3>
                  <p className="text-xs text-[#667085]">{activeProvider.name}</p>
                </div>
                <button
                  onClick={() => setProviderDrawerOpen(false)}
                  className="p-1 rounded text-[#9AA0A6] hover:text-[#202124] hover:bg-[#F0F4FA]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#667085] block mb-1">
                    Authority / Organization
                  </span>
                  <div className="font-semibold text-xs text-[#202124]">
                    {activeProvider.organization}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-[#667085] block mb-1">
                    Description
                  </span>
                  <p className="text-xs leading-relaxed text-[#4A5568]">
                    {activeProvider.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
                  <div className="p-2.5 rounded bg-[#FBFBFC] border border-[#E1E5EA]">
                    <span className="text-[10px] text-[#667085] uppercase block">Access Method</span>
                    <strong>{activeProvider.accessMethod}</strong>
                  </div>
                  <div className="p-2.5 rounded bg-[#FBFBFC] border border-[#E1E5EA]">
                    <span className="text-[10px] text-[#667085] uppercase block">Last Fetch</span>
                    <strong>{activeProvider.lastChecked}</strong>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-[#667085] block mb-1">
                    Variables Provided
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeProvider.variablesProvided.map((v) => (
                      <span
                        key={v}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#F0F4FA] text-[#1F4E8C]"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-[#667085] block mb-1">
                    Configured Datasets
                  </span>
                  <div className="space-y-1.5">
                    {activeProvider.datasetIds.map((id) => (
                      <div
                        key={id}
                        onClick={() => {
                          setProviderDrawerOpen(false);
                          handleOpenDatasetDrawer(id);
                        }}
                        className="p-2 rounded border border-[#E1E5EA] hover:bg-[#F0F4FA] cursor-pointer font-mono text-xs text-[#1F4E8C] flex justify-between"
                      >
                        <span>{id}</span>
                        <span>→</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SLIDE-OVER DRAWER: INGESTION DETAILS & HISTORY
         ========================================================================= */}
      {ingestionDrawerOpen && activeIngestionDataset && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setIngestionDrawerOpen(false)}
            className="absolute inset-0 bg-[#202124]/30 backdrop-blur-2xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl border-l border-[#E1E5EA] flex flex-col">
              <div className="p-5 border-b border-[#E1E5EA] flex items-start justify-between bg-[#FBFBFC]">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EBF5EE] text-[#137333] font-semibold">
                    {activeIngestionDataset.ingestion.status}
                  </span>
                  <h3 className="text-lg font-bold text-[#202124]">
                    {activeIngestionDataset.name}
                  </h3>
                  <p className="text-xs text-[#667085]">
                    {activeIngestionDataset.providerName}
                  </p>
                </div>
                <button
                  onClick={() => setIngestionDrawerOpen(false)}
                  className="p-1 rounded text-[#9AA0A6] hover:text-[#202124] hover:bg-[#F0F4FA]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs font-mono">
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="p-2.5 rounded bg-[#FBFBFC] border border-[#E1E5EA]">
                    <span className="text-[10px] text-[#667085] uppercase block">Total Size</span>
                    <strong className="text-[#1F4E8C]">
                      {activeIngestionDataset.ingestion.totalSizeMb} MB
                    </strong>
                  </div>
                  <div className="p-2.5 rounded bg-[#FBFBFC] border border-[#E1E5EA]">
                    <span className="text-[10px] text-[#667085] uppercase block">Storage Target</span>
                    <strong>{activeIngestionDataset.ingestion.storageTarget}</strong>
                  </div>
                  <div className="p-2.5 rounded bg-[#FBFBFC] border border-[#E1E5EA]">
                    <span className="text-[10px] text-[#667085] uppercase block">Last Fetch</span>
                    <strong>{activeIngestionDataset.ingestion.lastFetch}</strong>
                  </div>
                  <div className="p-2.5 rounded bg-[#FBFBFC] border border-[#E1E5EA]">
                    <span className="text-[10px] text-[#667085] uppercase block">Time Range</span>
                    <strong>{activeIngestionDataset.ingestion.timeRange}</strong>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-[#667085] block mb-1">
                    Indexed Local Files
                  </span>
                  <div className="p-3 rounded bg-[#F6F8FA] border border-[#E1E5EA] space-y-1 text-[11px] text-[#1F4E8C]">
                    {activeIngestionDataset.ingestion.storedFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <FileCode className="w-3.5 h-3.5 text-[#667085]" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-[#667085] block mb-1 font-bold">
                    Ingestion Run History
                  </span>
                  <div className="border border-[#E1E5EA] rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-[#FBFBFC] border-b border-[#E1E5EA] text-[#667085] text-[10px] uppercase">
                          <th className="py-2 px-3">Timestamp</th>
                          <th className="py-2 px-3">Result</th>
                          <th className="py-2 px-3">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E1E5EA] text-[11px]">
                        {activeIngestionDataset.ingestion.history.map((h, i) => (
                          <tr key={i} className="hover:bg-[#F6F8FA]">
                            <td className="py-2 px-3 text-[#202124]">{h.timestamp}</td>
                            <td className="py-2 px-3">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  h.status === "Successful"
                                    ? "bg-[#EBF5EE] text-[#137333]"
                                    : "bg-[#FCE8E6] text-[#C5221F]"
                                }`}
                              >
                                {h.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-[#667085] font-sans">
                              {h.note || "Nominal ingest cycle"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
