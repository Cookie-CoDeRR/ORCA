"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Download,
  Trash2,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  GitCompare,
  X,
  Plus,
  Compass,
  Layers,
  Thermometer,
  FlaskConical,
  Waves,
} from "lucide-react";

import { Report } from "@/lib/reportTypes";
import { reportStore } from "@/lib/reportStore";
import ReportView from "@/components/ReportView";

export default function SynthesisStudioPage() {
  // Report Store State
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Comparison State
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareReportAId, setCompareReportAId] = useState<string>("");
  const [compareReportBId, setCompareReportBId] = useState<string>("");

  // Sync with reportStore
  useEffect(() => {
    const list = reportStore.getReportHistory();
    setReports(list);

    const unsubscribe = reportStore.subscribe((history) => {
      setReports(history);
    });
    return unsubscribe;
  }, []);

  // Filtered Reports
  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      // Category filter
      if (activeCategory !== "all") {
        if (activeCategory === "fisheries" && rep.reportType !== "fisheries_advisory") return false;
        if (activeCategory === "ocean" && rep.reportType !== "ocean_state" && rep.reportType !== "chlorophyll_bloom") return false;
        if (activeCategory === "weather" && rep.reportType !== "marine_weather") return false;
        if (activeCategory === "hazards" && rep.reportType !== "wave_hazard" && rep.reportType !== "cyclone_assessment") return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = rep.title.toLowerCase().includes(q);
        const matchesTopic = rep.topic.toLowerCase().includes(q);
        const matchesRegion = rep.region.toLowerCase().includes(q);
        const matchesLocation = rep.location.toLowerCase().includes(q);
        return matchesTitle || matchesTopic || matchesRegion || matchesLocation;
      }

      return true;
    });
  }, [reports, activeCategory, searchQuery]);

  // Active Selected Report
  const activeReport = useMemo(() => {
    if (!selectedReportId) return null;
    return reports.find((r) => r.id === selectedReportId) || null;
  }, [selectedReportId, reports]);

  // Comparison Target Reports
  const reportA = useMemo(() => reports.find((r) => r.id === compareReportAId) || reports[0], [reports, compareReportAId]);
  const reportB = useMemo(() => reports.find((r) => r.id === compareReportBId) || (reports[1] || reports[0]), [reports, compareReportBId]);

  const handleDeleteReport = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to remove this report from history?")) {
      reportStore.deleteReport(id);
      if (selectedReportId === id) {
        setSelectedReportId(null);
      }
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // VIEW: ACTIVE REPORT OPENED
  // ───────────────────────────────────────────────────────────────────────────
  if (activeReport) {
    return (
      <div className="w-full min-h-screen bg-[#F6F8FA]">
        {/* Workspace Sticky Return Strip */}
        <div className="sticky top-0 z-40 bg-white/95 border-b border-[#E1E5EA] shadow-xs px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedReportId(null)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-sans font-medium text-[#1F4E8C] bg-[#F0F4FA] hover:bg-[#E1E5EA] border border-[#CBD5E1] transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Report Workspace</span>
            </button>
            <span className="text-[#98A2B3] hidden sm:inline">/</span>
            <span className="text-xs font-bold text-[#202124] truncate max-w-[200px] sm:max-w-xs">
              {activeReport.title}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {reports.length > 1 && (
              <button
                onClick={() => {
                  setCompareReportAId(activeReport.id);
                  const other = reports.find((r) => r.id !== activeReport.id);
                  if (other) setCompareReportBId(other.id);
                  setIsCompareOpen(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-sans text-[#202124] hover:bg-[#F6F8FA] border border-[#E1E5EA] transition"
              >
                <GitCompare className="h-3.5 w-3.5 text-[#1F4E8C]" />
                <span className="hidden sm:inline">Compare</span>
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-sans font-medium text-white bg-[#1F4E8C] hover:bg-[#173F72] transition shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Dynamic Report Renderer */}
        <ReportView
          report={activeReport}
          showBackToGlobeButton={false}
          basinName={activeReport.region}
          coordinates={activeReport.coordinates}
        />
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VIEW: DEFAULT REPORT WORKSPACE & HISTORY LIST
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F6F8FA] text-[#202124] pb-24 font-sans select-none">
      
      {/* ─── STICKY SUB-NAV ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 border-b border-[#E1E5EA] shadow-xs backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-sans font-medium text-[#1F4E8C] bg-[#F0F4FA] hover:bg-[#E1E5EA] border border-[#CBD5E1] transition shadow-xs"
              title="Return to 3D Earth Globe"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Globe</span>
            </Link>
            <span className="text-xs font-bold text-[#202124]">Synthesis Studio</span>
          </div>

          <div className="text-xs font-mono text-[#667085] flex items-center gap-2">
            <span>Stored Reports:</span>
            <strong className="text-[#202124]">{reports.length}</strong>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* WORKSPACE HEADER                                                      */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <header className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#E87524] uppercase tracking-wider">
            <span>SYNTHESIS</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#202124]">
                Synthesis Studio
              </h1>
              <p className="text-sm text-[#667085] mt-1 max-w-2xl leading-relaxed">
                Generated marine assessments and evidence-backed ORCA reports.
              </p>
            </div>

            {/* Top Compare Action */}
            {reports.length >= 2 && (
              <button
                onClick={() => {
                  setCompareReportAId(reports[0]?.id || "");
                  setCompareReportBId(reports[1]?.id || "");
                  setIsCompareOpen(true);
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-sans font-medium text-[#202124] bg-white border border-[#CBD5E1] hover:bg-[#F0F4FA] transition shadow-xs whitespace-nowrap self-start md:self-auto"
              >
                <GitCompare className="h-4 w-4 text-[#1F4E8C]" />
                <span>Compare Reports</span>
              </button>
            )}
          </div>
        </header>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SEARCH & CATEGORY FILTERS                                             */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#98A2B3]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by title, topic, region, or species..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E1E5EA] bg-white text-xs font-sans text-[#202124] placeholder-[#98A2B3] focus:border-[#1F4E8C] outline-none shadow-xs"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
            {[
              { id: "all", label: "All Reports" },
              { id: "fisheries", label: "Fisheries" },
              { id: "ocean", label: "Ocean Conditions" },
              { id: "weather", label: "Weather" },
              { id: "hazards", label: "Hazards" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-md font-medium transition whitespace-nowrap ${
                  activeCategory === cat.id
                    ? "bg-[#1F4E8C] text-white shadow-xs"
                    : "bg-white text-[#667085] hover:text-[#202124] border border-[#E1E5EA]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* REPORTS INVENTORY TABLE                                               */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div className="border border-[#E1E5EA] rounded-lg bg-white overflow-hidden shadow-xs">
          {filteredReports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F6F8FA] border-b border-[#E1E5EA] text-[#667085] font-sans font-medium text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Report Title & Topic</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4">Region & Coordinates</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4">Sections</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E5EA]">
                  {filteredReports.map((rep) => (
                    <tr
                      key={rep.id}
                      onClick={() => setSelectedReportId(rep.id)}
                      className="hover:bg-[#F6F8FA] cursor-pointer transition group"
                    >
                      <td className="py-3.5 px-4 max-w-[280px]">
                        <div className="font-bold text-[#202124] group-hover:text-[#1F4E8C] transition text-sm">
                          {rep.title}
                        </div>
                        <div className="text-[11px] text-[#667085] truncate mt-0.5" title={rep.topic}>
                          {rep.topic}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F0F4FA] text-[#1F4E8C] border border-[#CBD5E1] font-semibold">
                          {rep.reportType.replace(/_/g, " ")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#202124]">{rep.region}</div>
                        {rep.coordinates && (
                          <div className="font-mono text-[10px] text-[#667085]">
                            {rep.coordinates.lat.toFixed(3)}°N, {rep.coordinates.lon.toFixed(3)}°E
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#667085] whitespace-nowrap">
                        {rep.createdAt}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#202124]">
                        {rep.sections?.length || 0} sections
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#F0FDF4] text-[#228B5A] border border-[#BBF7D0]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#228B5A]" />
                          <span>Ready</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReportId(rep.id);
                            }}
                            className="px-2.5 py-1 rounded text-xs font-sans font-medium text-[#1F4E8C] hover:bg-[#E1E5EA] transition"
                          >
                            Open Report →
                          </button>
                          <button
                            onClick={(e) => handleDeleteReport(e, rep.id)}
                            className="p-1 text-[#98A2B3] hover:text-red-600 transition"
                            title="Delete Report"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center space-y-3">
              <FileText className="h-8 w-8 text-[#98A2B3] mx-auto" />
              <h3 className="text-sm font-bold text-[#202124]">
                No reports generated yet
              </h3>
              <p className="text-xs text-[#667085] max-w-md mx-auto leading-relaxed">
                Ask ORCA Copilot to generate a report from a selected location or topic. Generated dossiers will be persisted here for review, comparison, and export.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-sans font-medium text-white bg-[#1F4E8C] hover:bg-[#173F72] transition shadow-xs mt-2"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#E87524]" />
                <span>Open Copilot to Generate Report</span>
              </Link>
            </div>
          )}
        </div>

      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* REPORT COMPARISON MODAL                                               */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {isCompareOpen && reportA && reportB && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E1E5EA] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E1E5EA] bg-[#F6F8FA] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-[#1F4E8C]" />
                <h3 className="text-sm font-bold text-[#202124]">Compare Marine Reports</h3>
              </div>
              <button
                onClick={() => setIsCompareOpen(false)}
                className="text-[#667085] hover:text-[#202124] p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Selectors Strip */}
            <div className="grid grid-cols-2 gap-4 p-4 border-b border-[#E1E5EA] bg-white">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#667085] block mb-1">Report A:</span>
                <select
                  value={compareReportAId}
                  onChange={(e) => setCompareReportAId(e.target.value)}
                  className="w-full p-2 rounded-md border border-[#E1E5EA] text-xs font-semibold text-[#202124] outline-none"
                >
                  {reports.map((r) => (
                    <option key={r.id} value={r.id}>{r.title} ({r.createdAt})</option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-[#667085] block mb-1">Report B:</span>
                <select
                  value={compareReportBId}
                  onChange={(e) => setCompareReportBId(e.target.value)}
                  className="w-full p-2 rounded-md border border-[#E1E5EA] text-xs font-semibold text-[#202124] outline-none"
                >
                  {reports.map((r) => (
                    <option key={r.id} value={r.id}>{r.title} ({r.createdAt})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison Grid */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                {/* Report A Summary */}
                <div className="p-4 rounded-lg bg-[#FBFBFC] border border-[#E1E5EA] space-y-3">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-[#1F4E8C] border border-[#CBD5E1] font-semibold">
                      {reportA.reportType.replace(/_/g, " ")}
                    </span>
                    <h4 className="text-sm font-bold text-[#202124] mt-1.5">{reportA.title}</h4>
                    <p className="text-[11px] text-[#667085] mt-0.5">{reportA.region}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-[#E1E5EA]">
                    <div>
                      <span className="text-[#667085] block">SST:</span>
                      <strong className="text-[#202124]">{reportA.telemetry?.sst || "28.4 °C"}</strong>
                    </div>
                    <div>
                      <span className="text-[#667085] block">Waves:</span>
                      <strong className="text-[#202124]">{reportA.telemetry?.waves || "1.6 m"}</strong>
                    </div>
                    <div>
                      <span className="text-[#667085] block">Chlorophyll:</span>
                      <strong className="text-[#202124]">{reportA.telemetry?.chla || "1.26 mg/m³"}</strong>
                    </div>
                    <div>
                      <span className="text-[#667085] block">Wind:</span>
                      <strong className="text-[#202124]">{reportA.telemetry?.wind || "12 kt"}</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#667085] leading-relaxed pt-1">
                    {reportA.summary}
                  </p>
                </div>

                {/* Report B Summary */}
                <div className="p-4 rounded-lg bg-[#FBFBFC] border border-[#E1E5EA] space-y-3">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-[#1F4E8C] border border-[#CBD5E1] font-semibold">
                      {reportB.reportType.replace(/_/g, " ")}
                    </span>
                    <h4 className="text-sm font-bold text-[#202124] mt-1.5">{reportB.title}</h4>
                    <p className="text-[11px] text-[#667085] mt-0.5">{reportB.region}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-[#E1E5EA]">
                    <div>
                      <span className="text-[#667085] block">SST:</span>
                      <strong className="text-[#202124]">{reportB.telemetry?.sst || "28.1 °C"}</strong>
                    </div>
                    <div>
                      <span className="text-[#667085] block">Waves:</span>
                      <strong className="text-[#202124]">{reportB.telemetry?.waves || "1.8 m"}</strong>
                    </div>
                    <div>
                      <span className="text-[#667085] block">Chlorophyll:</span>
                      <strong className="text-[#202124]">{reportB.telemetry?.chla || "1.15 mg/m³"}</strong>
                    </div>
                    <div>
                      <span className="text-[#667085] block">Wind:</span>
                      <strong className="text-[#202124]">{reportB.telemetry?.wind || "14 kt"}</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#667085] leading-relaxed pt-1">
                    {reportB.summary}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E1E5EA] bg-[#F6F8FA] flex items-center justify-end">
              <button
                onClick={() => setIsCompareOpen(false)}
                className="px-4 py-1.5 rounded-md text-xs font-sans font-medium text-[#202124] bg-white border border-[#CBD5E1] hover:bg-[#E1E5EA] transition"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
