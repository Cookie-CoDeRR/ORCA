"""
Project ORCA (SIH26176) — Asynchronous AISStream.io Ingestion Client
Subscribes to high-frequency WebSocket AIS feed over the Indian Ocean Bounding Box,
decodes PositionReport and ShipStaticData messages, updates in-memory TrafficCache,
and automatically fails over to synthetic mock_replay on network disconnects or auth failures.
"""

import os
import json
import time
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

import websockets

from .traffic_cache import TrafficCache, VesselState, decode_ship_type, traffic_cache
from .mock_replay import mock_replayer

logger = logging.getLogger("ORCA.AisClient")

AISSTREAM_WS_URL = "wss://stream.aisstream.io/v0/stream"
# Indian Ocean Exclusive Economic Zone & Arabian Sea / Bay of Bengal bounding box
INDIAN_OCEAN_BBOX = [[[0.0, 50.0], [26.0, 100.0]]]


class AisStreamClient:
    """
    Asynchronous AISStream.io client with resilient reconnects and seamless fallback to mock replay.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        cache: Optional[TrafficCache] = None,
        auto_fallback: bool = True
    ):
        self.api_key = api_key or os.getenv("AISSTREAM_API_KEY", "").strip()
        self.cache = cache or traffic_cache
        self.auto_fallback = auto_fallback
        self._running = False
        self._connected = False
        self._is_using_fallback = False
        self._task: Optional[asyncio.Task] = None

    @property
    def is_connected(self) -> bool:
        return self._connected

    @property
    def is_fallback(self) -> bool:
        return self._is_using_fallback

    def _normalize_position_report(self, msg: dict) -> Optional[VesselState]:
        """Parses AIS PositionReport message into normalized VesselState."""
        try:
            meta = msg.get("MetaData", {})
            pos = msg.get("Message", {}).get("PositionReport", {})

            mmsi = int(meta.get("MMSI") or pos.get("UserID") or 0)
            if not mmsi:
                return None

            lat = float(pos.get("Latitude") if pos.get("Latitude") is not None else meta.get("latitude_deg", 0.0))
            lon = float(pos.get("Longitude") if pos.get("Longitude") is not None else meta.get("longitude_deg", 0.0))

            # Discard invalid/uncalibrated AIS GPS coordinates
            if lat == 91.0 or lon == 181.0 or lat == 0.0 or lon == 0.0:
                return None
            if not (0.0 <= lat <= 30.0 and 50.0 <= lon <= 105.0):
                return None

            sog = float(pos.get("Sog", 0.0))
            cog = float(pos.get("Cog", 0.0))
            heading = float(pos.get("TrueHeading", cog))
            if heading == 511.0:  # 511 indicates heading not available in AIS NMEA
                heading = cog

            ship_name = str(meta.get("ShipName") or f"MMSI-{mmsi}").strip()
            ship_type = int(meta.get("ShipType") or 0)
            category = decode_ship_type(ship_type)

            now_epoch = time.time()
            now_iso = meta.get("time_utc") or datetime.now(timezone.utc).isoformat()

            # Preserve existing static data if known
            existing = self.cache.get_vessel(mmsi)
            dest = existing.destination if existing else None
            flag = str(mmsi)[:3]
            length = existing.length if existing else None
            width = existing.width if existing else None

            return VesselState(
                mmsi=mmsi,
                name=ship_name if ship_name != f"MMSI-{mmsi}" or not existing else existing.name,
                ship_type=ship_type if ship_type != 0 or not existing else existing.ship_type,
                ship_category=category if category != "other" or not existing else existing.ship_category,
                lat=round(lat, 5),
                lon=round(lon, 5),
                sog_knots=round(sog, 1),
                cog_deg=round(cog, 1),
                heading=round(heading, 1),
                timestamp=now_iso,
                last_seen_epoch=now_epoch,
                destination=dest,
                flag=flag,
                length=length,
                width=width
            )
        except Exception as e:
            logger.debug(f"Error parsing position report: {e}")
            return None

    def _update_static_data(self, msg: dict) -> None:
        """Parses AIS ShipStaticData message to update vessel dimensions & destination."""
        try:
            meta = msg.get("MetaData", {})
            static = msg.get("Message", {}).get("ShipStaticData", {})
            mmsi = int(meta.get("MMSI") or static.get("UserID") or 0)
            if not mmsi:
                return

            vessel = self.cache.get_vessel(mmsi)
            if vessel:
                if static.get("Name"):
                    vessel.name = str(static.get("Name")).strip()
                if static.get("Type"):
                    vessel.ship_type = int(static.get("Type"))
                    vessel.ship_category = decode_ship_type(vessel.ship_type)
                if static.get("Destination"):
                    vessel.destination = str(static.get("Destination")).strip()
                dim = static.get("Dimension", {})
                if dim:
                    a = dim.get("A", 0)
                    b = dim.get("B", 0)
                    c = dim.get("C", 0)
                    d = dim.get("D", 0)
                    vessel.length = float(a + b) if (a + b) > 0 else None
                    vessel.width = float(c + d) if (c + d) > 0 else None
                self.cache.upsert_vessel(vessel)
        except Exception as e:
            logger.debug(f"Error parsing static data: {e}")

    async def _listen_ws(self) -> None:
        """Connects to AISStream.io and handles incoming telemetry packets."""
        sub_message = {
            "APIKey": self.api_key,
            "BoundingBoxes": [INDIAN_OCEAN_BBOX],
            "FilterMessageTypes": ["PositionReport", "ShipStaticData"]
        }

        logger.info(f"Connecting to AISStream.io WebSocket ({AISSTREAM_WS_URL})...")
        async with websockets.connect(AISSTREAM_WS_URL, ping_interval=20, ping_timeout=20) as ws:
            await ws.send(json.dumps(sub_message))
            logger.info("📡 Successfully subscribed to live AISStream.io Indian Ocean feed.")
            self._connected = True

            # If fallback was running, gracefully stop it
            if self._is_using_fallback:
                mock_replayer.stop()
                self._is_using_fallback = False
                logger.info("Switched from synthetic fallback to live AISStream feed.")

            while self._running:
                raw_msg = await ws.recv()
                data = json.loads(raw_msg)
                msg_type = data.get("MessageType")

                if msg_type == "PositionReport":
                    state = self._normalize_position_report(data)
                    if state:
                        self.cache.upsert_vessel(state)
                elif msg_type == "ShipStaticData":
                    self._update_static_data(data)

    async def run(self) -> None:
        """Master service loop with auto-reconnect and seamless mock replay failover."""
        self._running = True

        if not self.api_key:
            logger.warning("No AISSTREAM_API_KEY provided. Initiating synthetic mock AIS stream fallback.")
            self._is_using_fallback = True
            mock_replayer.start(interval_seconds=2.0)
            return

        backoff = 2
        while self._running:
            try:
                await self._listen_ws()
            except Exception as e:
                self._connected = False
                logger.warning(f"AISStream.io connection lost ({e}). Reconnecting in {backoff}s...")

                # Trigger mock fallback during outage
                if self.auto_fallback and not self._is_using_fallback:
                    logger.info("Activating synthetic AIS mock replay during network/API outage.")
                    self._is_using_fallback = True
                    mock_replayer.start(interval_seconds=2.0)

                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 60)

    def start(self) -> None:
        """Starts the AIS client background task."""
        if not self._running:
            self._task = asyncio.create_task(self.run())

    def stop(self) -> None:
        """Stops the AIS client and any active fallback streams."""
        self._running = False
        self._connected = False
        if self._task and not self._task.done():
            self._task.cancel()
        if self._is_using_fallback:
            mock_replayer.stop()


# Global Singleton Client
ais_client = AisStreamClient()
