"use client";

import React from "react";

export interface EarthSceneProps {
  activeBaseLayer?: string;
  activeOverlays?: Set<string> | string[];
  sstRange?: [number, number];
  waveMax?: number;
}

export default function EarthScene(_props: EarthSceneProps) {
  return null;
}
