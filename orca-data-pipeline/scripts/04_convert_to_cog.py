#!/usr/bin/env python3
"""
Project ORCA (SIH26176) — Script 04: NetCDF to Cloud-Optimized GeoTIFF (COG) Converter
Extracts multi-dimensional ocean variables (SST, Chlorophyll, Surface Currents) from NetCDF4
and converts them into standard Cloud-Optimized GeoTIFFs (COGs) with internal tiling and overviews.
Output COGs are placed in data/processed/cogs/ for low-latency streaming in TiTiler and deck.gl.
"""

import os
import sys
import logging
import argparse
from pathlib import Path

import numpy as np

# Load environment variables
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
    else:
        load_dotenv()
except ImportError:
    pass

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("ORCA.COGConverter")

DEFAULT_INPUT_NC = Path(__file__).resolve().parent.parent / "data" / "raw" / "copernicus" / "copernicus_ocean_telemetry_latest.nc"
DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parent.parent / "data" / "processed" / "cogs"


def convert_variable_to_cog(
    data_array: np.ndarray,
    lons: np.ndarray,
    lats: np.ndarray,
    output_tif: Path,
    variable_name: str,
    units: str = "",
    nodata_val: float = -999.0
) -> Path:
    """
    Writes a 2D numpy array to a valid Cloud-Optimized GeoTIFF (COG)
    with EPSG:4326 coordinate system, internal tiles, and overviews.
    """
    try:
        import rasterio
        from rasterio.transform import from_bounds
        from rasterio.enums import Resampling
    except ImportError:
        logger.error("rasterio is required for GeoTIFF generation. Run: pip install rasterio")
        sys.exit(1)

    output_tif.parent.mkdir(parents=True, exist_ok=True)

    # Clean array and handle orientations
    arr = np.squeeze(data_array).astype(np.float32)

    # Ensure latitude is in descending order (North to South) for standard raster row ordering
    if lats[0] < lats[-1]:
        arr = np.flipud(arr)
        min_lat, max_lat = float(lats[0]), float(lats[-1])
    else:
        min_lat, max_lat = float(lats[-1]), float(lats[0])

    min_lon, max_lon = float(lons.min()), float(lons.max())
    height, width = arr.shape

    # Calculate Affine Transform from bounding coordinates
    transform = from_bounds(min_lon, min_lat, max_lon, max_lat, width, height)

    # Temporary un-overviewed GeoTIFF path
    temp_tif = output_tif.with_suffix(".tmp.tif")

    tile_size = int(os.getenv("COG_TILE_SIZE", "256"))
    # Adjust tile size if array is smaller than tile_size
    blockx = min(tile_size, 16 * (width // 16)) if width >= 16 else width
    blocky = min(tile_size, 16 * (height // 16)) if height >= 16 else height
    if blockx <= 0 or blocky <= 0:
        blockx, blocky = width, height

    profile = {
        "driver": "GTiff",
        "height": height,
        "width": width,
        "count": 1,
        "dtype": "float32",
        "crs": "EPSG:4326",
        "transform": transform,
        "nodata": nodata_val,
        "tiled": True,
        "blockxsize": blockx,
        "blockysize": blocky,
        "compress": "DEFLATE",
        "predictor": 2
    }

    logger.info(f"Writing raster for '{variable_name}' [{width}x{height}] -> {temp_tif.name}...")
    with rasterio.open(temp_tif, "w", **profile) as dst:
        dst.write(arr, 1)
        dst.update_tags(
            variable=variable_name,
            units=units,
            source="Project ORCA (SIH26176) Ocean Telemetry Engine",
            created_by="ORCA-Data-Pipeline"
        )
        # Build overviews/pyramids for multi-scale web zooming
        if width >= 64 and height >= 64:
            factors = [2, 4, 8]
            dst.build_overviews(factors, Resampling.bilinear)
            dst.update_tags(ns="rio_overview", resampling="bilinear")

    # Try creating optimized COG with rio-cogeo if available, otherwise promote temp_tif
    try:
        from rio_cogeo.cogeo import cog_translate
        from rio_cogeo.profiles import cog_profiles

        dst_profile = cog_profiles.get("deflate")
        dst_profile.update({"blockxsize": blockx, "blockysize": blocky})
        cog_translate(
            temp_tif,
            output_tif,
            dst_profile,
            in_memory=True,
            quiet=True
        )
        if temp_tif.exists():
            temp_tif.unlink()
        logger.info(f"Generated optimized Cloud-Optimized GeoTIFF: {output_tif} ({output_tif.stat().st_size / 1024:.1f} KB)")
    except ImportError:
        # Fallback to standard rasterio output
        if output_tif.exists():
            output_tif.unlink()
        temp_tif.rename(output_tif)
        logger.info(f"Generated GeoTIFF with Pyramids: {output_tif} ({output_tif.stat().st_size / 1024:.1f} KB)")

    return output_tif


def process_netcdf_to_cogs(input_nc_path: Path, output_dir: Path) -> dict[str, Path]:
    """
    Parses a NetCDF4 ocean dataset and converts all available ocean variables
    into individual COG files.
    """
    try:
        import xarray as xr
    except ImportError:
        logger.error("xarray is required. Run: pip install xarray netCDF4")
        sys.exit(1)

    if not input_nc_path.exists():
        logger.error(f"Input NetCDF file not found: {input_nc_path}")
        logger.info("Please run 'python scripts/01_download_copernicus.py' first.")
        sys.exit(1)

    logger.info(f"Opening NetCDF ocean telemetry file: {input_nc_path}...")
    ds = xr.open_dataset(input_nc_path)

    # Coordinate discovery
    lon_name = next((c for c in ["longitude", "lon", "x"] if c in ds.coords), None)
    lat_name = next((c for c in ["latitude", "lat", "y"] if c in ds.coords), None)

    if not lon_name or not lat_name:
        logger.error(f"Could not identify latitude/longitude coordinates in {list(ds.coords.keys())}")
        sys.exit(1)

    lons = ds[lon_name].values
    lats = ds[lat_name].values

    generated_cogs = {}

    # Target oceanographic variables mapping: (NetCDF var -> COG filename, Unit)
    variables_to_process = [
        ("sst", "sst_india_latest.tif", "Celsius"),
        ("chlorophyll", "chlorophyll_india_latest.tif", "mg/m^3"),
        ("current_speed", "ocean_currents_speed_latest.tif", "m/s"),
        ("uo", "currents_u_eastward_latest.tif", "m/s"),
        ("vo", "currents_v_northward_latest.tif", "m/s")
    ]

    for var_name, output_name, unit in variables_to_process:
        if var_name in ds.data_vars:
            data = ds[var_name].values
            # Slice first time dimension if present
            if data.ndim == 3:
                data = data[0, :, :]
            elif data.ndim == 4:
                data = data[0, 0, :, :]

            out_path = output_dir / output_name
            convert_variable_to_cog(
                data_array=data,
                lons=lons,
                lats=lats,
                output_tif=out_path,
                variable_name=var_name,
                units=unit
            )
            generated_cogs[var_name] = out_path
        else:
            logger.debug(f"Variable '{var_name}' not present in NetCDF dataset.")

    ds.close()
    return generated_cogs


def main():
    parser = argparse.ArgumentParser(
        description="Project ORCA — Convert NetCDF Ocean Rasters to Cloud-Optimized GeoTIFFs (COGs)"
    )
    parser.add_argument("--input-nc", type=str, default=str(DEFAULT_INPUT_NC), help="Input NetCDF (.nc) file path")
    parser.add_argument("--output-dir", type=str, default=str(DEFAULT_OUTPUT_DIR), help="Output directory for COGs")
    args = parser.parse_args()

    input_path = Path(args.input_nc)
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    cogs = process_netcdf_to_cogs(input_path, out_dir)
    logger.info(f"Successfully converted {len(cogs)} ocean rasters to Cloud-Optimized GeoTIFFs.")


if __name__ == "__main__":
    main()
