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
    <html lang="en" className="bg-[#f8fafc] scroll-smooth">
      <body className="bg-[#f8fafc] text-zinc-900 antialiased min-h-screen selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
