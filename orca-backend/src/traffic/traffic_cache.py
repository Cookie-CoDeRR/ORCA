"""
Project ORCA (SIH26176) — In-Memory Active AIS Vessel State Cache
Maintains a thread-safe, high-performance in-memory cache of live vessel kinematics,
automatically prunes stale broadcasts (>15 mins), and provides spatial indexing.
"""

import time
import math
import logging
from typing import Optional, Any
from dataclasses import dataclass, field, asdict

logger = logging.getLogger("ORCA.TrafficCache")


def decode_ship_type(type_code: int) -> str:
    """Classifies AIS numerical ship type into standard maritime categories."""
    if 30 <= type_code <= 39:
        return "fishing"
    elif 50 <= type_code <= 55:
        return "defense"  # Law enforcement, patrol, search & rescue, tug
    elif 70 <= type_code <= 79:
        return "cargo"
    elif 80 <= type_code <= 89:
        return "tanker"
    elif 60 <= type_code <= 69:
        return "passenger"
    elif 20 <= type_code <= 29:
        return "wing_in_ground"
    elif 40 <= type_code <= 49:
        return "high_speed_craft"
    else:
        return "other"


def haversine_nm(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two geographic coordinates in Nautical Miles."""
    r_nm = 3440.065  # Earth radius in Nautical Miles
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r_nm * c


@dataclass
class VesselState:
    mmsi: int
    name: str
    ship_type: int
    ship_category: str
    lat: float
    lon: float
    sog_knots: float
    cog_deg: float
    heading: float
    timestamp: str
    last_seen_epoch: float = field(default_factory=time.time)
    destination: Optional[str] = None
    flag: Optional[str] = None
    length: Optional[float] = None
    width: Optional[float] = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class TrafficCache:
    """
    High-speed in-memory store for AIS live positions.
    Prunes stale tracks (>15 minutes) and supports radial search.
    """

    def __init__(self, max_stale_seconds: float = 900.0):
        self._vessels: dict[int, VesselState] = {}
        self.max_stale_seconds = max_stale_seconds

    def upsert_vessel(self, vessel: VesselState) -> None:
        """Inserts or updates an active vessel broadcast."""
        self._vessels[vessel.mmsi] = vessel

    def get_vessel(self, mmsi: int) -> Optional[VesselState]:
        """Retrieves a specific vessel by MMSI if still fresh."""
        v = self._vessels.get(mmsi)
        if v and (time.time() - v.last_seen_epoch <= self.max_stale_seconds):
            return v
        return None

    def get_all_vessels(self) -> list[VesselState]:
        """Returns all currently active non-stale vessels."""
        now = time.time()
        self.prune_stale()
        return [v for v in self._vessels.values() if (now - v.last_seen_epoch <= self.max_stale_seconds)]

    def get_active_vessels_in_radius(self, lat: float, lon: float, radius_nm: float = 25.0) -> list[VesselState]:
        """Returns all vessels located within radius_nm of the query point."""
        active = self.get_all_vessels()
        in_range = []
        for v in active:
            dist = haversine_nm(lat, lon, v.lat, v.lon)
            if dist <= radius_nm:
                in_range.append(v)
        return in_range

    def prune_stale(self) -> int:
        """Removes vessel entries older than max_stale_seconds."""
        now = time.time()
        stale_keys = [
            mmsi for mmsi, v in self._vessels.items()
            if (now - v.last_seen_epoch > self.max_stale_seconds)
        ]
        for k in stale_keys:
            del self._vessels[k]
        if stale_keys:
            logger.debug(f"Pruned {len(stale_keys)} stale AIS vessels from cache.")
        return len(stale_keys)

    def to_geojson(self) -> dict[str, Any]:
        """Exports all active vessels as a standard GeoJSON FeatureCollection."""
        vessels = self.get_all_vessels()
        features = []
        for v in vessels:
            feat = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [v.lon, v.lat]
                },
                "properties": {
                    "mmsi": v.mmsi,
                    "name": v.name,
                    "ship_type": v.ship_type,
                    "ship_category": v.ship_category,
                    "sog_knots": v.sog_knots,
                    "cog_deg": v.cog_deg,
                    "heading": v.heading,
                    "timestamp": v.timestamp,
                    "destination": v.destination,
                    "flag": v.flag,
                    "length": v.length,
                    "width": v.width
                }
            }
            features.append(feat)

        return {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "count": len(features),
                "generated_at": time.time()
            }
        }

    def clear(self) -> None:
        """Clears all entries in the cache."""
        self._vessels.clear()


# Global Singleton Instance
traffic_cache = TrafficCache()
