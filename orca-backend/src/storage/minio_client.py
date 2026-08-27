"""
Project ORCA (SIH26176) — MinIO Scientific Object Storage Client
Provides asynchronous/synchronous helpers for uploading, downloading,
and generating presigned URLs for Cloud-Optimized GeoTIFFs (COGs),
NetCDF rasters, GeoJSON vector layers, and agent audit logs.
"""

import os
import io
import json
import logging
from typing import Any
from pathlib import Path

from minio import Minio
from minio.error import S3Error

logger = logging.getLogger("ORCA.MinIOStorage")

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "orca_minio_admin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "orca_minio_secret_2026")
MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"

DEFAULT_BUCKETS = ["ocean-rasters", "geospatial-vectors", "agent-logs"]


class MinIOStorageClient:
    """
    S3-compatible Object Storage Manager for Project ORCA.
    Stores heavy raster datasets (COGs, NetCDF) and lightweight vector assets.
    """

    def __init__(self):
        logger.info(f"Connecting to MinIO storage at {MINIO_ENDPOINT} (Secure: {MINIO_SECURE})...")
        self.client = Minio(
            endpoint=MINIO_ENDPOINT,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=MINIO_SECURE
        )
        self._ensure_default_buckets()

    def _ensure_default_buckets(self):
        """Provisions default storage buckets if they do not already exist."""
        try:
            for bucket in DEFAULT_BUCKETS:
                if not self.client.bucket_exists(bucket):
                    self.client.make_bucket(bucket)
                    logger.info(f"Created MinIO bucket: '{bucket}'")
            logger.info("✅ MinIO buckets initialized.")
        except Exception as e:
            logger.warning(f"Could not initialize MinIO buckets on startup ({e}). Will retry on write.")

    def upload_file(
        self,
        bucket_name: str,
        object_name: str,
        file_path: Path | str,
        content_type: str = "application/octet-stream"
    ) -> bool:
        """Uploads a local file (e.g. COG .tif or NetCDF .nc) to MinIO."""
        file_path = Path(file_path)
        if not file_path.exists():
            logger.error(f"File to upload does not exist: {file_path}")
            return False

        try:
            if not self.client.bucket_exists(bucket_name):
                self.client.make_bucket(bucket_name)

            self.client.fput_object(
                bucket_name=bucket_name,
                object_name=object_name,
                file_path=str(file_path),
                content_type=content_type
            )
            logger.info(f"Uploaded '{file_path.name}' -> minio://{bucket_name}/{object_name}")
            return True
        except S3Error as e:
            logger.error(f"MinIO upload error: {e}")
            return False

    def download_file(self, bucket_name: str, object_name: str, target_path: Path | str) -> bool:
        """Downloads an object from MinIO to a local path."""
        target_path = Path(target_path)
        target_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            self.client.fget_object(
                bucket_name=bucket_name,
                object_name=object_name,
                file_path=str(target_path)
            )
            logger.info(f"Downloaded minio://{bucket_name}/{object_name} -> '{target_path}'")
            return True
        except S3Error as e:
            logger.error(f"MinIO download error: {e}")
            return False

    def get_presigned_url(self, bucket_name: str, object_name: str, expires_hours: int = 24) -> str | None:
        """
        Generates a presigned GET URL for streaming COGs directly to TiTiler
        or the client map layer without exposing private S3 credentials.
        """
        from datetime import timedelta
        try:
            url = self.client.presigned_get_object(
                bucket_name=bucket_name,
                object_name=object_name,
                expires=timedelta(hours=expires_hours)
            )
            return url
        except S3Error as e:
            logger.error(f"Error generating presigned URL: {e}")
            return None

    def put_json(self, bucket_name: str, object_name: str, data: dict | list) -> bool:
        """Uploads a dictionary/list as a JSON object directly from memory."""
        try:
            if not self.client.bucket_exists(bucket_name):
                self.client.make_bucket(bucket_name)

            json_bytes = json.dumps(data, indent=2).encode("utf-8")
            stream = io.BytesIO(json_bytes)

            self.client.put_object(
                bucket_name=bucket_name,
                object_name=object_name,
                data=stream,
                length=len(json_bytes),
                content_type="application/json"
            )
            return True
        except S3Error as e:
            logger.error(f"Failed to put JSON to MinIO: {e}")
            return False

    def get_json(self, bucket_name: str, object_name: str) -> Any | None:
        """Downloads and parses a JSON object from MinIO."""
        try:
            response = self.client.get_object(bucket_name, object_name)
            data = json.loads(response.read().decode("utf-8"))
            response.close()
            response.release_conn()
            return data
        except Exception as e:
            logger.error(f"Failed to get JSON from MinIO: {e}")
            return None


# Global singleton instance
_minio_client: MinIOStorageClient | None = None


def get_minio_client() -> MinIOStorageClient:
    """Returns or initializes the global MinIO client instance."""
    global _minio_client
    if _minio_client is None:
        _minio_client = MinIOStorageClient()
    return _minio_client
