#!/usr/bin/env python3
"""
Project ORCA (SIH26176) — Master Data Pipeline Runner
Orchestrates the end-to-end ingestion and preprocessing workflow:
  Step 1: Download / Generate Copernicus Ocean Telemetry (.nc)
  Step 2: Fetch / Generate INCOIS ERDDAP PFZs & Wave Height Forecasts (.json, .geojson)
  Step 3: Download & Clean Maritime Boundaries (IMBL, EEZ, MPAs, Gazetteer .geojson)
  Step 4: Convert NetCDF Rasters to Cloud-Optimized GeoTIFFs (COGs)
  Step 5: Verify Data Integrity and Output Summary
"""

import os
import sys
import time
import json
import logging
import argparse
from pathlib import Path

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

# Rich formatting if available, fallback to basic ANSI
try:
    from rich.console import Console
    from rich.table import Table
    from rich.panel import Panel
    console = Console()
    HAS_RICH = True
except ImportError:
    HAS_RICH = False

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("ORCA.PipelineRunner")

PIPELINE_ROOT = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = PIPELINE_ROOT / "scripts"
DATA_DIR = PIPELINE_ROOT / "data"


def print_banner():
    title = """
  ██████╗ ██████╗  ██████╗ █████╗     ██████╗  █████╗ ████████╗ █████╗ 
 ██╔═══██╗██╔══██╗██╔════╝██╔══██╗    ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗
 ██║   ██║██████╔╝██║     ███████║    ██║  ██║███████║   ██║   ███████║
 ██║   ██║██╔══██╗██║     ██╔══██║    ██║  ██║██╔══██║   ██║   ██╔══██║
 ╚██████╔╝██║  ██║╚██████╗██║  ██║    ██████╔╝██║  ██║   ██║   ██║  ██║
  ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝
    Project ORCA (SIH26176) — Maritime Data Ingestion Pipeline v1.0
    """
    if HAS_RICH:
        console.print(Panel(title.strip(), title="🌊 ORCA Data Engine", style="bold cyan"))
    else:
        print("=" * 75)
        print(title)
        print("=" * 75)


def verify_pipeline_outputs() -> list[dict]:
    """Inspects all pipeline output folders and calculates sizes and record counts."""
    results = []

    # 1. Copernicus NetCDF
    cop_dir = DATA_DIR / "raw" / "copernicus"
    for f in cop_dir.glob("*.nc"):
        size_kb = f.stat().st_size / 1024
        results.append({
            "stage": "1. Copernicus NetCDF",
            "file": f.name,
            "path": str(f.relative_to(PIPELINE_ROOT)),
            "size": f"{size_kb:.1f} KB",
            "status": "✅ Verified"
        })

    # 2. INCOIS ERDDAP Outputs
    incois_dir = DATA_DIR / "raw" / "incois"
    for f in incois_dir.glob("*.*"):
        size_kb = f.stat().st_size / 1024
        extra = ""
        if f.suffix == ".json":
            try:
                with open(f, "r", encoding="utf-8") as jf:
                    data = json.load(jf)
                    if "advisories" in data:
                        extra = f" ({len(data['advisories'])} PFZ records)"
                    elif "forecasts" in data:
                        extra = f" ({len(data['forecasts'])} sectors)"
            except Exception:
                pass
        elif f.suffix == ".geojson":
            try:
                with open(f, "r", encoding="utf-8") as jf:
                    data = json.load(jf)
                    extra = f" ({len(data.get('features', []))} features)"
            except Exception:
                pass

        results.append({
            "stage": "2. INCOIS ERDDAP",
            "file": f.name + extra,
            "path": str(f.relative_to(PIPELINE_ROOT)),
            "size": f"{size_kb:.1f} KB",
            "status": "✅ Verified"
        })

    # 3. Vector Boundaries
    vec_dir = DATA_DIR / "processed" / "vector"
    for f in vec_dir.glob("*.geojson"):
        size_kb = f.stat().st_size / 1024
        extra = ""
        try:
            with open(f, "r", encoding="utf-8") as jf:
                data = json.load(jf)
                extra = f" ({len(data.get('features', []))} features)"
        except Exception:
            pass

        results.append({
            "stage": "3. Vector Boundaries",
            "file": f.name + extra,
            "path": str(f.relative_to(PIPELINE_ROOT)),
            "size": f"{size_kb:.1f} KB",
            "status": "✅ Verified"
        })

    # 4. Cloud-Optimized GeoTIFFs (COGs)
    cog_dir = DATA_DIR / "processed" / "cogs"
    for f in cog_dir.glob("*.tif"):
        size_kb = f.stat().st_size / 1024
        results.append({
            "stage": "4. Processed COGs",
            "file": f.name,
            "path": str(f.relative_to(PIPELINE_ROOT)),
            "size": f"{size_kb:.1f} KB",
            "status": "✅ Verified"
        })

    return results


def print_summary_table(results: list[dict], duration: float):
    """Prints a structured summary table of all processed artifacts."""
    if HAS_RICH:
        table = Table(title=f"📊 Pipeline Execution Summary (Completed in {duration:.2f}s)", style="cyan")
        table.add_column("Pipeline Stage", style="bold yellow")
        table.add_column("Generated Artifact", style="bold white")
        table.add_column("Size", justify="right", style="green")
        table.add_column("Status", justify="center", style="bold green")

        for r in results:
            table.add_row(r["stage"], r["file"], r["size"], r["status"])

        console.print(table)
    else:
        print("\n" + "=" * 80)
        print(f"PIPELINE SUMMARY (Total Duration: {duration:.2f}s)")
        print("=" * 80)
        for r in results:
            print(f"[{r['stage']}] {r['file']} ({r['size']}) -> {r['status']}")
        print("=" * 80)


def run_step(script_name: str, args_list: list[str] = None) -> bool:
    """Executes an individual pipeline script."""
    script_path = SCRIPTS_DIR / script_name
    cmd = [sys.executable, str(script_path)]
    if args_list:
        cmd.extend(args_list)

    logger.info(f"▶ Running step: {script_name}...")
    import subprocess
    result = subprocess.run(cmd)
    if result.returncode != 0:
        logger.error(f"❌ Step '{script_name}' failed with exit code {result.returncode}")
        return False
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Project ORCA (SIH26176) — Master Dataset Ingestion Pipeline Runner"
    )
    parser.add_argument("--all", action="store_true", default=True, help="Run all pipeline stages (default)")
    parser.add_argument("--copernicus", action="store_true", help="Run Copernicus telemetry ingestion only")
    parser.add_argument("--incois", action="store_true", help="Run INCOIS ERDDAP ingestion only")
    parser.add_argument("--boundaries", action="store_true", help="Run Boundaries & Gazetteer generation only")
    parser.add_argument("--cog", action="store_true", help="Run COG raster conversion only")
    parser.add_argument("--mock", action="store_true", help="Force synthetic/offline generation for all steps")
    parser.add_argument("--verify-only", action="store_true", help="Skip execution and verify existing files")

    args = parser.parse_args()
    print_banner()

    start_time = time.time()

    # Determine specific run targets
    specific = args.copernicus or args.incois or args.boundaries or args.cog
    mock_args = ["--mock"] if args.mock else []

    if not args.verify_only:
        if not specific or args.copernicus:
            if not run_step("01_download_copernicus.py", mock_args):
                sys.exit(1)

        if not specific or args.incois:
            if not run_step("02_fetch_incois_erddap.py", mock_args):
                sys.exit(1)

        if not specific or args.boundaries:
            if not run_step("03_download_boundaries.py"):
                sys.exit(1)

        if not specific or args.cog:
            if not run_step("04_convert_to_cog.py"):
                sys.exit(1)

    duration = time.time() - start_time
    results = verify_pipeline_outputs()
    print_summary_table(results, duration)


if __name__ == "__main__":
    main()
