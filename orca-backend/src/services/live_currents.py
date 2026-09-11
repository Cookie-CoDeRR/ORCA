"""
Project ORCA (SIH26176) — Live Ocean Currents Service
Integrates real-time tracked ocean currents (velocity, direction, drift vectors u/v, wave state)
assimilated from Copernicus Marine Service (CMEMS) / NOAA models via the Open-Meteo Marine API.
Guarded by a strict 10-minute (600s) spatial TTL cache to minimize external network requests.
"""

import math
import time
import json
import asyncio
import logging
import urllib.request
from datetime import datetime, timezone
from typing import Any, Optional

logger = logging.getLogger("ORCA.LiveCurrentsService")

CACHE_TTL_SECONDS = 600  # 10 Minutes strict cache delay
REQUEST_TIMEOUT_SECONDS = 6.0


def degrees_to_cardinal(deg: float) -> str:
    """Converts azimuth degrees (0-360) to 16-point cardinal compass directions."""
    directions = [
        "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
        "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
    ]
    idx = int((deg + 11.25) / 22.5) % 16
    return directions[idx]


def classify_flow_regime(lat: float, lon: float, knots: float) -> str:
    """Classifies local hydrodynamic regime across the Indian Ocean / EEZ."""
    if knots < 0.25:
        return "Slack Ocean Water (Minimal Drift)"
    
    # West Coast of India
    if 8.0 <= lat <= 22.0 and 68.0 <= lon <= 74.0:
        return "West India Coastal Current (WICC Drift)"
    
    # East Coast of India & Bay of Bengal
    if 10.0 <= lat <= 22.0 and 80.0 <= lon <= 89.0:
        return "East India Coastal Current (EICC Stream)"
    
    # Somali Jet & Arabian Sea Gyre
    if 4.0 <= lat <= 15.0 and 50.0 <= lon <= 65.0:
        return "Somali Jet Boundary Circulation"
    
    # Equatorial Current System
    if 0.0 <= lat < 5.0:
        return "Equatorial Counter Current (ECC)"
    
    if knots >= 1.8:
        return "High-Velocity Pelagic Current Jet"
    elif knots >= 1.0:
        return "Moderate Mesoscale Current Drift"
    else:
        return "Mild Surface Ocean Drift"


class LiveOceanCurrentsService:
    def __init__(self):
        # In-memory spatial cache: key = "lat_round,lon_round" -> cache entry dict
        self._cache: dict[str, dict[str, Any]] = {}
        self._lock = asyncio.Lock()

    def _quantize_key(self, lat: float, lon: float) -> str:
        """Quantizes coordinates to a 0.1 degree (~11 km) grid cell."""
        return f"{round(lat, 1):.1f},{round(lon, 1):.1f}"

    def _fetch_external_sync(self, lat: float, lon: float) -> dict[str, Any]:
        """Synchronous HTTP call to Open-Meteo Marine API with Copernicus assimilation."""
        url = (
            f"https://marine-api.open-meteo.com/v1/marine?"
            f"latitude={lat:.3f}&longitude={lon:.3f}&"
            f"current=ocean_current_velocity,ocean_current_direction,wave_height,wave_direction"
        )
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Project-ORCA-Sovereign-Maritime/1.0",
                "Accept": "application/json"
            }
        )
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            if response.status != 200:
                raise RuntimeError(f"External marine API responded with HTTP {response.status}")
            raw_bytes = response.read()
            return json.loads(raw_bytes.decode("utf-8"))

    def _generate_synthetic_fallback(self, lat: float, lon: float) -> dict[str, Any]:
        """
        Deterministic physical approximation based on Indian Ocean monsoonal hydrodynamics
        when external connectivity is unavailable.
        """
        lat_rad = math.radians(lat)
        lon_rad = math.radians(lon)
        
        # WICC + Somali Jet + Bay of Bengal eddy approximation
        u_sim = 0.35 * math.sin(lat_rad * 4.0) + 0.15 * math.cos(lon_rad * 3.0)
        v_sim = -0.40 * math.cos(lat_rad * 3.0) + 0.20 * math.sin(lon_rad * 4.0)
        
        speed_mps = math.hypot(u_sim, v_sim)
        speed_knots = speed_mps * 1.94384
        dir_deg = (math.degrees(math.atan2(u_sim, v_sim)) + 360.0) % 360.0
        
        now_utc = datetime.now(timezone.utc)
        return {
            "coordinates": [round(lat, 4), round(lon, 4)],
            "velocity_mps": round(speed_mps, 2),
            "velocity_knots": round(speed_knots, 2),
            "direction_deg": round(dir_deg, 1),
            "cardinal_direction": degrees_to_cardinal(dir_deg),
            "flow_regime": classify_flow_regime(lat, lon, speed_knots),
            "u_vector": round(u_sim, 3),
            "v_vector": round(v_sim, 3),
            "wave_height_m": 1.4,
            "wave_direction_deg": 220.0,
            "observation_time": now_utc.isoformat(),
            "cached_at": now_utc.isoformat(),
            "cache_age_seconds": 0,
            "next_sync_seconds": CACHE_TTL_SECONDS,
            "is_live": False,
            "is_cached_fallback": True,
            "source": "Project ORCA Hydrodynamic Simulation (Offline Fallback)"
        }

    async def get_live_current(self, lat: float, lon: float, force_refresh: bool = False) -> dict[str, Any]:
        """
        Retrieves real-time tracked ocean current telemetry for specified coordinates.
        Checks spatial cache first: if fresh (< 600s old), returns instantly.
        Otherwise triggers an external fetch and updates the cache.
        """
        key = self._quantize_key(lat, lon)
        now = time.time()

        async with self._lock:
            cached_entry = self._cache.get(key)
            if cached_entry and not force_refresh:
                age = int(now - cached_entry["_cached_timestamp"])
                if age < CACHE_TTL_SECONDS:
                    # Return fresh cached data instantly (Zero external network call)
                    res = dict(cached_entry)
                    res.pop("_cached_timestamp", None)
                    res["cache_age_seconds"] = age
                    res["next_sync_seconds"] = max(0, CACHE_TTL_SECONDS - age)
                    res["is_cached"] = True
                    return res

        # Cache miss or expired: fetch from Open-Meteo Marine API
        try:
            raw_data = await asyncio.to_thread(self._fetch_external_sync, lat, lon)
            current = raw_data.get("current", {})
            
            # ocean_current_velocity is reported in km/h by Open-Meteo
            vel_kmh = float(current.get("ocean_current_velocity") or 0.0)
            vel_mps = vel_kmh / 3.6
            vel_knots = vel_mps * 1.94384
            dir_deg = float(current.get("ocean_current_direction") or 0.0) % 360.0
            
            # Mathematical Eulerian vector breakdown (u: eastward, v: northward)
            rad = math.radians(dir_deg)
            u_vec = vel_mps * math.sin(rad)
            v_vec = vel_mps * math.cos(rad)
            
            wave_height = float(current.get("wave_height") or 1.2)
            wave_dir = float(current.get("wave_direction") or dir_deg)
            
            obs_time_raw = current.get("time")
            now_utc = datetime.now(timezone.utc)
            obs_time_str = obs_time_raw if obs_time_raw else now_utc.isoformat()

            processed = {
                "coordinates": [round(lat, 4), round(lon, 4)],
                "velocity_mps": round(vel_mps, 2),
                "velocity_knots": round(vel_knots, 2),
                "direction_deg": round(dir_deg, 1),
                "cardinal_direction": degrees_to_cardinal(dir_deg),
                "flow_regime": classify_flow_regime(lat, lon, vel_knots),
                "u_vector": round(u_vec, 3),
                "v_vector": round(v_vec, 3),
                "wave_height_m": round(wave_height, 2),
                "wave_direction_deg": round(wave_dir, 1),
                "observation_time": obs_time_str,
                "cached_at": now_utc.isoformat(),
                "cache_age_seconds": 0,
                "next_sync_seconds": CACHE_TTL_SECONDS,
                "is_live": True,
                "is_cached": False,
                "source": "Copernicus Marine (CMEMS) via Open-Meteo Live Marine Telemetry",
                "_cached_timestamp": now
            }

            async with self._lock:
                self._cache[key] = processed

            result = dict(processed)
            result.pop("_cached_timestamp", None)
            logger.info(f"🌊 Updated live ocean currents for ({lat:.2f}, {lon:.2f}): {vel_knots:.2f} kn @ {dir_deg:.0f}°")
            return result

        except Exception as e:
            logger.warning(f"External ocean currents fetch failed for ({lat}, {lon}): {e}. Checking fallback.")
            # If expired cache exists, return it with warning
            async with self._lock:
                if key in self._cache:
                    stale = dict(self._cache[key])
                    age = int(now - stale.pop("_cached_timestamp", now))
                    stale["cache_age_seconds"] = age
                    stale["next_sync_seconds"] = 0
                    stale["is_cached"] = True
                    stale["warning"] = "External feed temporarily unreachable. Serving last known reading."
                    return stale

            # Otherwise return synthetic physical fallback
            return self._generate_synthetic_fallback(lat, lon)


# Singleton instance
live_currents_service = LiveOceanCurrentsService()
