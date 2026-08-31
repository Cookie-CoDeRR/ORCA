export default function TelemetryHubPage() {
  return (
    <div className="w-full h-full p-6 bg-[#090d16] overflow-y-auto">
      <h1 className="text-xl font-bold text-slate-100 mb-4 font-mono">Telemetry Hub</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 border border-slate-800 rounded-xl p-4 h-96 bg-[#0c1220] flex items-center justify-center text-slate-500 font-mono text-sm">
          Data Catalog
        </div>
        <div className="lg:col-span-2 border border-slate-800 rounded-xl p-4 h-96 bg-[#0c1220] flex items-center justify-center text-slate-500 font-mono text-sm">
          Recharts / 2D Graphs
        </div>
      </div>
    </div>
  );
}
