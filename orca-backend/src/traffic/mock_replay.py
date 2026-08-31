"""
Project ORCA (SIH26176) — Synthetic AIS Vessel Replay Engine (Air-Gapped Fallback)
Provides realistic kinematic propagation of commercial, fishing, defense, and tanker vessels
across Indian territorial waters and exclusive economic zones when live AISStream is unavailable.
"""

import json
import time
import math
import asyncio
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

from .traffic_cache import TrafficCache, VesselState, decode_ship_type, traffic_cache

logger = logging.getLogger("ORCA.MockReplay")

MOCK_FEED_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "mock_ais_feed.json"


class MockAisReplayer:
    """
    Simulates real-time AIS vessel movements over time using true dead-reckoning kinematics.
    """

    def __init__(self, cache: Optional[TrafficCache] = None, data_path: Optional[Path] = None):
        self.cache = cache or traffic_cache
        self.data_path = data_path or MOCK_FEED_PATH
        self._raw_vessels: list[dict] = []
        self._sim_vessels: dict[int, dict] = {}
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._load_seed_data()

    def _load_seed_data(self) -> None:
        """Loads static mock vessel seeds from JSON."""
        if self.data_path.exists():
            try:
                with open(self.data_path, "r", encoding="utf-8") as f:
                    self._raw_vessels = json.load(f)
                logger.info(f"Loaded {len(self._raw_vessels)} seed vessels from {self.data_path.name}")
            except Exception as e:
                logger.error(f"Failed to read mock AIS data: {e}")
                self._raw_vessels = []
        else:
            logger.warning(f"Mock AIS seed file not found at {self.data_path}. Creating fallback seed.")
            self._raw_vessels = [
                {
                    "mmsi": 419001234,
                    "name": "MV MAERSK BHARAT",
                    "ship_type": 70,
                    "lat": 18.910,
                    "lon": 72.750,
                    "sog_knots": 14.8,
                    "cog_deg": 185.0,
                    "heading": 185.0,
                    "destination": "IN BOM (JNPT)",
                    "flag": "IND",
                }
            ]

        # Initialize internal simulation states
        for v in self._raw_vessels:
            mmsi = v["mmsi"]
            self._sim_vessels[mmsi] = {
                "mmsi": mmsi,
                "name": v["name"],
                "ship_type": v["ship_type"],
                "lat": float(v["lat"]),
                "lon": float(v["lon"]),
                "sog_knots": float(v["sog_knots"]),
                "cog_deg": float(v["cog_deg"]),
                "heading": float(v.get("heading", v["cog_deg"])),
                "destination": v.get("destination"),
                "flag": v.get("flag", "IND"),
                "length": v.get("length", 120.0),
                "width": v.get("width", 20.0),
                "initial_lat": float(v["lat"]),
                "initial_lon": float(v["lon"]),
                "turn_counter": 0,
            }

    def step(self, delta_seconds: float = 2.0) -> list[VesselState]:
        """
        Advances the simulation by delta_seconds.
        Calculates dead reckoning:
            d_lat = (sog * dt / 3600) * cos(cog) / 60
            d_lon = (sog * dt / 3600) * sin(cog) / (60 * cos(lat))
        """
        now_epoch = time.time()
        now_iso = datetime.now(timezone.utc).isoformat()
        updated_states: list[VesselState] = []

        for mmsi, v in self._sim_vessels.items():
            sog = v["sog_knots"]
            cog = v["cog_deg"]
            lat = v["lat"]
            lon = v["lon"]

            if sog > 0.1:
                # Nautical dead reckoning
                dist_nm = (sog * delta_seconds) / 3600.0
                cog_rad = math.radians(cog)
                lat_cos = math.cos(math.radians(lat)) or 1.0

                d_lat = (dist_nm * math.cos(cog_rad)) / 60.0
                d_lon = (dist_nm * math.sin(cog_rad)) / (60.0 * lat_cos)

                new_lat = lat + d_lat
                new_lon = lon + d_lon

                # Boundary bounce / turnaround for simulation continuity
                # Keep vessels in the Indian Ocean basin (0°N-26°N, 60°E-96°E)
                if new_lat < 2.0 or new_lat > 25.0 or new_lon < 62.0 or new_lon > 95.0:
                    v["cog_deg"] = (cog + 180.0) % 360.0
                    v["heading"] = v["cog_deg"]
                else:
                    v["lat"] = new_lat
                    v["lon"] = new_lon

                # Subtle realistic wander (slight yaw adjustments)
                v["turn_counter"] += 1
                if v["turn_counter"] % 15 == 0:
                    wander = math.sin(v["turn_counter"] * 0.1) * 2.5
                    v["cog_deg"] = (v["cog_deg"] + wander) % 360.0
                    v["heading"] = v["cog_deg"]

            category = decode_ship_type(v["ship_type"])
            state = VesselState(
                mmsi=mmsi,
                name=v["name"],
                ship_type=v["ship_type"],
                ship_category=category,
                lat=round(v["lat"], 5),
                lon=round(v["lon"], 5),
                sog_knots=round(v["sog_knots"], 1),
                cog_deg=round(v["cog_deg"], 1),
                heading=round(v["heading"], 1),
                timestamp=now_iso,
                last_seen_epoch=now_epoch,
                destination=v["destination"],
                flag=v["flag"],
                length=v["length"],
                width=v["width"],
            )

            self.cache.upsert_vessel(state)
            updated_states.append(state)

        return updated_states

    async def run_loop(self, interval_seconds: float = 2.0) -> None:
        """Asynchronous execution loop updating cache at steady frequency."""
        self._running = True
        logger.info(f"Started synthetic AIS mock replay loop (interval: {interval_seconds}s, {len(self._sim_vessels)} vessels).")
        try:
            while self._running:
                self.step(interval_seconds)
                await asyncio.sleep(interval_seconds)
        except asyncio.CancelledError:
            logger.info("Mock AIS replay loop cancelled.")
        finally:
            self._running = False

    def start(self, interval_seconds: float = 2.0) -> None:
        """Starts the mock replay as a background asyncio task."""
        if not self._running:
            self._task = asyncio.create_task(self.run_loop(interval_seconds))

    def stop(self) -> None:
        """Stops the mock replay background loop."""
        self._running = False
        if self._task and not self._task.done():
            self._task.cancel()


# Global Mock Replay Singleton
mock_replayer = MockAisReplayer()
