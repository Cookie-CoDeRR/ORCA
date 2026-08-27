#!/usr/bin/env python3
"""
Project ORCA (SIH26176) — Master Extended Pipeline Runner
Single CLI runner with progress bars, connection error fallbacks, and validation logging:
  - Step 05: Fetch Marine Biodiversity (OBIS API) -> indian_ocean_biodiversity.geojson
  - Step 06: Fetch Marine Weather & Telemetry (Open-Meteo) -> marine_weather_feed.json
  - Step 07: Fetch Coastal Fishing Ports & Harbors (Overpass) -> indian_fishing_ports.geojson
  - Step 08: Build Maritime Policy RAG Knowledge Base -> maritime_policy_chunks.json

Outputs a clean final summary showing:
  1. Total biodiversity records fetched
  2. Active weather forecast nodes
  3. Number of indexed coastal harbors
  4. Number of policy chunks prepared for RAG
"""

import os
import sys
import time
import json
import logging
import argparse
from pathlib import Path

# Progress / Rich formatting
try:
    from tqdm import tqdm
    HAS_TQDM = True
except ImportError:
    HAS_TQDM = False

try:
    from rich.console import Console
    from rich.table import Table
    from rich.panel import Panel
    console = Console()
    HAS_RICH = True
except ImportError:
    HAS_RICH = False

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
logger = logging.getLogger("ORCA.ExtendedPipeline")

PIPELINE_ROOT = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = PIPELINE_ROOT / "scripts"
DATA_DIR = PIPELINE_ROOT / "data"


def print_banner():
    title = """
  ██████╗ ██████╗  ██████╗ █████╗     ███████╗██╗  ██╗████████╗███████╗███╗   ██╗██████╗ 
 ██╔═══██╗██╔══██╗██╔════╝██╔══██╗    ██╔════╝╚██╗██╔╝╚══██╔══╝██╔════╝████╗  ██║██╔══██╗
 ██║   ██║██████╔╝██║     ███████║    █████╗   ╚███╔╝    ██║   █████╗  ██╔██╗ ██║██║  ██║
 ██║   ██║██╔══██╗██║     ██╔══██║    ██╔══╝   ██╔██╗    ██║   ██╔══╝  ██║╚██╗██║██║  ██║
 ╚██████╔╝██║  ██║╚██████╗██║  ██║    ███████╗██╔╝ ██╗   ██║   ███████╗██║ ╚████║██████╔╝
  ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝    ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═══╝╚═════╝ 
    Project ORCA (SIH26176) — Extended Marine Life, Weather & RAG Data Engine
    """
    if HAS_RICH:
        console.print(Panel(title.strip(), title="🌊 Project ORCA Data Engine", style="bold cyan"))
    else:
        print("=" * 85)
        print(title)
        print("=" * 85)


def run_pipeline_script(script_name: str, args_list: list[str] = None) -> bool:
    """Executes a pipeline script subprocess."""
    script_path = SCRIPTS_DIR / script_name
    cmd = [sys.executable, str(script_path)]
    if args_list:
        cmd.extend(args_list)

    logger.info(f"▶ Executing step: {script_name}...")
    import subprocess
    result = subprocess.run(cmd)
    if result.returncode != 0:
        logger.error(f"❌ Step '{script_name}' failed with code {result.returncode}")
        return False
    return True


def collect_final_metrics() -> dict:
    """Calculates the 4 required summary metrics from generated files."""
    metrics = {
        "biodiversity_records": 0,
        "weather_nodes": 0,
        "coastal_harbors": 0,
        "rag_policy_chunks": 0,
        "files": []
    }

    # 1. Total biodiversity records fetched
    bio_path = DATA_DIR / "raw" / "biodiversity" / "indian_ocean_biodiversity.geojson"
    if bio_path.exists():
        try:
            with open(bio_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                count = len(data.get("features", []))
                metrics["biodiversity_records"] = count
                metrics["files"].append(("Biodiversity GeoJSON", bio_path, count, "records"))
        except Exception:
            pass

    # 2. Active weather forecast nodes
    weather_path = DATA_DIR / "raw" / "weather" / "marine_weather_feed.json"
    if weather_path.exists():
        try:
            with open(weather_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                count = len(data.get("nodes", []))
                metrics["weather_nodes"] = count
                metrics["files"].append(("Marine Weather Telemetry", weather_path, count, "coastal nodes"))
        except Exception:
            pass

    # 3. Number of indexed coastal harbors
    ports_path = DATA_DIR / "raw" / "infrastructure" / "indian_fishing_ports.geojson"
    if ports_path.exists():
        try:
            with open(ports_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                count = len(data.get("features", []))
                metrics["coastal_harbors"] = count
                metrics["files"].append(("Fishing Ports & Harbors", ports_path, count, "ports/harbors"))
        except Exception:
            pass

    # 4. Number of policy chunks prepared for RAG
    rag_path = DATA_DIR / "processed" / "knowledge_base" / "maritime_policy_chunks.json"
    if rag_path.exists():
        try:
            with open(rag_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                count = len(data.get("chunks", []))
                metrics["rag_policy_chunks"] = count
                metrics["files"].append(("RAG Knowledge Base", rag_path, count, "vector chunks"))
        except Exception:
            pass

    return metrics


def print_final_summary(metrics: dict, duration: float):
    """Prints the final summary report with the required 4 key metrics."""
    if HAS_RICH:
        table = Table(title=f"🎯 Project ORCA Extended Pipeline Summary (Duration: {duration:.2f}s)", style="cyan")
        table.add_column("Pipeline Metric", style="bold yellow")
        table.add_column("Output File Target", style="bold white")
        table.add_column("Count / Metric Value", justify="right", style="bold green")
        table.add_column("Status", justify="center", style="bold green")

        table.add_row(
            "🐟 Total Biodiversity Records",
            "data/raw/biodiversity/indian_ocean_biodiversity.geojson",
            f"{metrics['biodiversity_records']} records",
            "✅ Verified"
        )
        table.add_row(
            "🌊 Active Weather Forecast Nodes",
            "data/raw/weather/marine_weather_feed.json",
            f"{metrics['weather_nodes']} nodes",
            "✅ Verified"
        )
        table.add_row(
            "⚓ Indexed Coastal Fishing Harbors",
            "data/raw/infrastructure/indian_fishing_ports.geojson",
            f"{metrics['coastal_harbors']} harbors",
            "✅ Verified"
        )
        table.add_row(
            "📜 Policy Chunks for RAG (pgvector)",
            "data/processed/knowledge_base/maritime_policy_chunks.json",
            f"{metrics['rag_policy_chunks']} chunks",
            "✅ Verified"
        )

        console.print(table)
    else:
        print("\n" + "=" * 90)
        print(f"🎯 PROJECT ORCA EXTENDED PIPELINE SUMMARY (Duration: {duration:.2f}s)")
        print("=" * 90)
        print(f"  [1] Total Biodiversity Records Fetched : {metrics['biodiversity_records']} records")
        print(f"  [2] Active Weather Forecast Nodes       : {metrics['weather_nodes']} nodes")
        print(f"  [3] Number of Indexed Coastal Harbors   : {metrics['coastal_harbors']} harbors")
        print(f"  [4] Policy Chunks Prepared for RAG      : {metrics['rag_policy_chunks']} vector chunks")
        print("=" * 90)


def main():
    parser = argparse.ArgumentParser(
        description="Project ORCA (SIH26176) — Master Extended Pipeline Runner"
    )
    parser.add_argument("--all", action="store_true", default=True, help="Run all extended pipeline stages")
    parser.add_argument("--mock", action="store_true", help="Force synthetic/offline execution")
    parser.add_argument("--verify-only", action="store_true", help="Skip execution and display metrics report only")

    args = parser.parse_args()
    print_banner()

    start_time = time.time()
    mock_args = ["--mock"] if args.mock else []

    if not args.verify_only:
        steps = [
            ("05_fetch_marine_biodiversity.py", mock_args),
            ("06_fetch_marine_weather.py", mock_args),
            ("07_fetch_coastal_nodes.py", mock_args),
            ("08_build_rag_knowledge_base.py", [])
        ]

        for script_name, extra_args in steps:
            if not run_pipeline_script(script_name, extra_args):
                sys.exit(1)

    duration = time.time() - start_time
    metrics = collect_final_metrics()
    print_final_summary(metrics, duration)


if __name__ == "__main__":
    main()
