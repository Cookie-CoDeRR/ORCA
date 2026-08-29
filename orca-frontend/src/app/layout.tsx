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
    <html lang="en" className="bg-black scroll-smooth">
      <body className="bg-black text-white antialiased min-h-screen selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}
