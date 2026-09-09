#!/bin/bash
# ==============================================================================
# PROJECT ORCA — Sovereign Ocean Intelligence Platform (SIH-26176)
# Full Stack Start & Health Verification Script
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "  ___  ____   ____    _    "
echo " / _ \|  _ \ / ___|  / \   "
echo "| | | | |_) | |     / _ \  "
echo "| |_| |  _ <| |___ / ___ \ "
echo " \___/|_| \_\\\\____/_/   \_\\"
echo " Sovereign Marine Navigation & Swarm Intelligence"
echo -e "==============================================================${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/orca-backend"
FRONTEND_DIR="$SCRIPT_DIR/orca-frontend"

# 1. Start Docker Stack (PostGIS, MinIO, FastAPI Backend)
echo -e "\n${BLUE}[1/3] Checking Docker Compose Backend Stack...${NC}"
cd "$BACKEND_DIR"
docker compose up -d db minio minio-init backend

echo -e "${YELLOW}Waiting for services to report ready...${NC}"
sleep 2

# Check Backend API
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/ || echo "offline")
if [ "$BACKEND_STATUS" = "200" ]; then
  echo -e "${GREEN}✓ FastAPI Backend is ONLINE at http://localhost:8000${NC}"
else
  echo -e "${RED}✗ Backend status code: $BACKEND_STATUS (expected 200)${NC}"
fi

# 2. Check Next.js Frontend
echo -e "\n${BLUE}[2/3] Checking Next.js Frontend Server...${NC}"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ || echo "offline")

if [ "$FRONTEND_STATUS" = "200" ]; then
  echo -e "${GREEN}✓ Next.js Frontend is already running at http://localhost:3000${NC}"
else
  echo -e "${YELLOW}Starting Next.js Frontend on port 3000...${NC}"
  cd "$FRONTEND_DIR"
  nohup npm run dev > /tmp/orca-frontend.log 2>&1 &
  sleep 4
  echo -e "${GREEN}✓ Next.js Frontend dev server launched!${NC}"
fi

# 3. Print Active Access Endpoints
echo -e "\n${CYAN}=============================================================="
echo "          ORCA PLATFORM READY FOR PRESENTATION & TESTING      "
echo -e "==============================================================${NC}"
echo -e "  ${GREEN}▶ Landing Page:${NC}          http://localhost:3000/"
echo -e "  ${GREEN}▶ Interactive 3D Globe:${NC}  http://localhost:3000/dashboard"
echo -e "  ${GREEN}▶ Swarm Topology & XAI:${NC}  http://localhost:3000/dashboard/agents"
echo -e "  ${GREEN}▶ Telemetry & NetCDF Hub:${NC} http://localhost:3000/research/data"
echo -e "  ${GREEN}▶ Sovereign Defense Port:${NC} http://localhost:3000/defense"
echo -e "  ${GREEN}▶ PFZ Intelligence Doss:${NC} http://localhost:3000/report"
echo -e "  ${GREEN}▶ Onboarding Wizard:${NC}     http://localhost:3000/signup"
echo -e "  ------------------------------------------------------------"
echo -e "  ${BLUE}▶ Backend API Docs (OpenAPI):${NC} http://localhost:8000/docs"
echo -e "  ${BLUE}▶ MinIO S3 Console (Storage):${NC} http://localhost:9001"
echo -e "  ${BLUE}▶ PostGIS Spatial Database:${NC}   localhost:5432 (orca_db)"
echo -e "${CYAN}==============================================================${NC}\n"
