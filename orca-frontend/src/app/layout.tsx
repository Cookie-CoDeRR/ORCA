import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import ScrollbarAutoHider from "@/components/ScrollbarAutoHider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600", "700"],
});

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
    <html lang="en" className={`${inter.variable} ${ibmPlexMono.variable} bg-white scroll-smooth`}>
      <body className={`${inter.className} bg-white text-slate-900 antialiased min-h-screen selection:bg-blue-600 selection:text-white`}>
        <ScrollbarAutoHider />
        {children}
      </body>
    </html>
  );
}
