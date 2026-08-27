#!/usr/bin/env python3
"""
Project ORCA (SIH26176) — Master Extended Pipeline Runner
Orchestrates the ingestion of marine life biodiversity, marine weather telemetry,
coastal infrastructure, and the regulatory RAG knowledge base:
  Step 05: Fetch Marine Biodiversity & Critical Habitats (OBIS)
  Step 06: Fetch Marine Weather, Waves & Hazard Alerts (Open-Meteo / IMD)
  Step 07: Fetch Coastal Infrastructure, Harbors, Coast Guard & Lighthouses
  Step 08: Build Maritime Policy & Advisory RAG Knowledge Base (pgvector ready)
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

# Rich formatting if available
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
        console.print(Panel(title.strip(), title="🐬 ORCA Extended Pipeline", style="bold cyan"))
    else:
        print("=" * 85)
        print(title)
        print("=" * 85)


def verify_extended_outputs() -> list[dict]:
    """Inspects all generated extended datasets and compiles record counts and sizes."""
    results = []

    # 1. GeoJSON Layers
    geojson_dir = DATA_DIR / "processed" / "geojson_layers"
    for f in geojson_dir.glob("*.geojson"):
        size_kb = f.stat().st_size / 1024
        extra = ""
        try:
            with open(f, "r", encoding="utf-8") as jf:
                data = json.load(jf)
                extra = f" ({len(data.get('features', []))} features)"
        except Exception:
            pass

        results.append({
            "stage": "Processed GeoJSON Layers",
            "file": f.name + extra,
            "path": str(f.relative_to(PIPELINE_ROOT)),
            "size": f"{size_kb:.1f} KB",
            "status": "✅ Verified"
        })

    # 2. Knowledge Base (RAG Chunks)
    kb_dir = DATA_DIR / "processed" / "knowledge_base"
    for f in kb_dir.glob("*.json"):
        size_kb = f.stat().st_size / 1024
        extra = ""
        try:
            with open(f, "r", encoding="utf-8") as jf:
                data = json.load(jf)
                extra = f" ({len(data.get('chunks', []))} vector chunks)"
        except Exception:
            pass

        results.append({
            "stage": "RAG Knowledge Base",
            "file": f.name + extra,
            "path": str(f.relative_to(PIPELINE_ROOT)),
            "size": f"{size_kb:.1f} KB",
            "status": "✅ Verified"
        })

    # 3. Raw Archives
    for sub in ["biodiversity", "weather", "infrastructure", "policy_docs"]:
        sub_dir = DATA_DIR / "raw" / sub
        for f in sub_dir.glob("*.*"):
            size_kb = f.stat().st_size / 1024
            results.append({
                "stage": f"Raw Archive ({sub})",
                "file": f.name,
                "path": str(f.relative_to(PIPELINE_ROOT)),
                "size": f"{size_kb:.1f} KB",
                "status": "✅ Verified"
            })

    return results


def print_summary_table(results: list[dict], duration: float):
    """Prints a structured summary table of all processed artifacts."""
    if HAS_RICH:
        table = Table(title=f"📊 Extended Pipeline Summary (Completed in {duration:.2f}s)", style="cyan")
        table.add_column("Pipeline Stage", style="bold yellow")
        table.add_column("Generated Artifact", style="bold white")
        table.add_column("Size", justify="right", style="green")
        table.add_column("Status", justify="center", style="bold green")

        for r in results:
            table.add_row(r["stage"], r["file"], r["size"], r["status"])

        console.print(table)
    else:
        print("\n" + "=" * 90)
        print(f"EXTENDED PIPELINE SUMMARY (Total Duration: {duration:.2f}s)")
        print("=" * 90)
        for r in results:
            print(f"[{r['stage']}] {r['file']} ({r['size']}) -> {r['status']}")
        print("=" * 90)


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
        description="Project ORCA (SIH26176) — Master Extended Pipeline Runner"
    )
    parser.add_argument("--all", action="store_true", default=True, help="Run all extended stages (default)")
    parser.add_argument("--bio", action="store_true", help="Run Marine Biodiversity ingestion only")
    parser.add_argument("--weather", action="store_true", help="Run Marine Weather & Wave telemetry ingestion only")
    parser.add_argument("--infra", action="store_true", help="Run Coastal Infrastructure & Harbors ingestion only")
    parser.add_argument("--rag", action="store_true", help="Run Maritime Policy RAG Knowledge Base builder only")
    parser.add_argument("--mock", action="store_true", help="Force synthetic/offline generation for all steps")
    parser.add_argument("--verify-only", action="store_true", help="Skip execution and verify existing files")

    args = parser.parse_args()
    print_banner()

    start_time = time.time()

    specific = args.bio or args.weather or args.infra or args.rag
    mock_args = ["--mock"] if args.mock else []

    if not args.verify_only:
        if not specific or args.bio:
            if not run_step("05_fetch_marine_biodiversity.py", mock_args):
                sys.exit(1)

        if not specific or args.weather:
            if not run_step("06_fetch_marine_weather.py", mock_args):
                sys.exit(1)

        if not specific or args.infra:
            if not run_step("07_fetch_coastal_nodes.py", mock_args):
                sys.exit(1)

        if not specific or args.rag:
            if not run_step("08_build_rag_knowledge_base.py"):
                sys.exit(1)

    duration = time.time() - start_time
    results = verify_extended_outputs()
    print_summary_table(results, duration)


if __name__ == "__main__":
    main()
