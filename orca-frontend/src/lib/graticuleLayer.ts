/**
 * graticuleLayer.ts
 *
 * Generates lat/lon graticule (mesh grid) line data for DeckGL LineLayer.
 * Covers the Indian Ocean EEZ zone: 5°N–28°N, 58°E–96°E
 *
 * Minor grid: every 2°  → dim lines
 * Major grid: every 10° → slightly brighter lines
 */

export interface GraticuleLineData {
  sourcePosition: [number, number];
  targetPosition: [number, number];
  color: [number, number, number, number];
  width: number;
}

const LAT_MIN = 4;
const LAT_MAX = 28;
const LON_MIN = 57;
const LON_MAX = 97;
const STEP_MINOR = 2;
const STEP_MAJOR = 10;

// RGBA for minor vs major lines
const COLOR_MINOR: [number, number, number, number] = [255, 255, 255, 18];
const COLOR_MAJOR: [number, number, number, number] = [255, 255, 255, 45];

function isMajor(val: number) {
  return val % STEP_MAJOR === 0;
}

export function buildGraticuleLines(): GraticuleLineData[] {
  const lines: GraticuleLineData[] = [];

  // Horizontal latitude lines
  for (let lat = LAT_MIN; lat <= LAT_MAX; lat += STEP_MINOR) {
    const color = isMajor(lat) ? COLOR_MAJOR : COLOR_MINOR;
    const width = isMajor(lat) ? 1.5 : 0.8;
    lines.push({
      sourcePosition: [LON_MIN, lat],
      targetPosition: [LON_MAX, lat],
      color,
      width,
    });
  }

  // Vertical longitude lines
  for (let lon = LON_MIN; lon <= LON_MAX; lon += STEP_MINOR) {
    const color = isMajor(lon) ? COLOR_MAJOR : COLOR_MINOR;
    const width = isMajor(lon) ? 1.5 : 0.8;
    lines.push({
      sourcePosition: [lon, LAT_MIN],
      targetPosition: [lon, LAT_MAX],
      color,
      width,
    });
  }

  return lines;
}
