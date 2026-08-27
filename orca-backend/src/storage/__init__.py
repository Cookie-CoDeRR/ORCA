"""
Project ORCA — Scientific Object Storage Package (MinIO S3 Client)
"""

from .minio_client import get_minio_client, MinIOStorageClient

__all__ = [
    "get_minio_client",
    "MinIOStorageClient"
]
