import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project ORCA — Sovereign Marine Intelligence & Navigation Platform (SIH26176)",
  description: "Autonomous multi-agent system for Indian maritime safety, PFZ fisheries, and fuel-optimal routing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full w-full bg-[#060913]">
      <body className="h-full w-full overflow-hidden bg-[#060913] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
