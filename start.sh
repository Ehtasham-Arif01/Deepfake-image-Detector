#!/bin/bash

echo "================================================"
echo "       Deepfake Detector - Startup Script       "
echo "================================================"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR=~/Desktop/deepfake-detector
FRONTEND_DIR=$PROJECT_DIR/frontend

# ── Step 1: Check project folder ──
echo -e "\n${YELLOW}[1/6] Checking project folder...${NC}"
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}✗ Project folder not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Project folder found${NC}"

# ── Step 2: Check model files ──
echo -e "\n${YELLOW}[2/6] Checking model files...${NC}"
if [ ! -f "$PROJECT_DIR/deepfake_detector_v2.pth" ]; then
    echo -e "${RED}✗ Face model not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Face model found${NC}"

if [ ! -f "$PROJECT_DIR/picture_model.pth" ]; then
    echo -e "${RED}✗ Picture model not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Picture model found${NC}"

# ── Step 3: Check virtual environment ──
echo -e "\n${YELLOW}[3/6] Checking virtual environment...${NC}"
if [ ! -d "$PROJECT_DIR/venv" ]; then
    echo -e "${RED}✗ Virtual environment not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Virtual environment found${NC}"

# ── Step 4: Check frontend ──
echo -e "\n${YELLOW}[4/6] Checking frontend...${NC}"
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}⚠ Installing frontend dependencies...${NC}"
    cd $FRONTEND_DIR && npm install
fi
echo -e "${GREEN}✓ Frontend ready${NC}"

# ── Step 5: Kill old processes ──
echo -e "\n${YELLOW}[5/6] Cleaning up old processes...${NC}"
fuser -k 8000/tcp 2>/dev/null
fuser -k 3000/tcp 2>/dev/null
sleep 2
echo -e "${GREEN}✓ Ports cleared${NC}"

# ── Step 6: Start backend ──
echo -e "\n${YELLOW}[6/6] Starting backend...${NC}"
cd $PROJECT_DIR
source venv/bin/activate

# Start backend in background and log output
uvicorn main:app --host 127.0.0.1 --port 8000 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
echo -e "${YELLOW}Waiting for backend to start...${NC}"
for i in {1..15}; do
    sleep 1
    BACKEND_CHECK=$(curl -s http://127.0.0.1:8000/ 2>/dev/null)
    if echo "$BACKEND_CHECK" | grep -q "running"; then
        echo -e "${GREEN}✓ Backend running at http://127.0.0.1:8000${NC}"
        break
    fi
    if [ $i -eq 15 ]; then
        echo -e "${RED}✗ Backend failed to start. Log:${NC}"
        cat /tmp/backend.log
        exit 1
    fi
    echo -n "."
done

# ── Start frontend ──
echo -e "\n${YELLOW}Starting frontend...${NC}"
cd $FRONTEND_DIR
BROWSER=none npm start > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend
echo -e "${YELLOW}Waiting for frontend to start...${NC}"
for i in {1..20}; do
    sleep 1
    FRONTEND_CHECK=$(curl -s http://localhost:3000 2>/dev/null)
    if [ ! -z "$FRONTEND_CHECK" ]; then
        echo -e "${GREEN}✓ Frontend running at http://localhost:3000${NC}"
        break
    fi
    if [ $i -eq 20 ]; then
        echo -e "${YELLOW}⚠ Frontend taking longer than expected, opening browser anyway...${NC}"
        break
    fi
    echo -n "."
done

# Open browser
sleep 2
xdg-open http://localhost:3000 2>/dev/null &

# ── Summary ──
echo -e "\n================================================"
echo -e "${GREEN}  ✓ Deepfake Detector is running!${NC}"
echo -e "  Backend  → http://127.0.0.1:8000"
echo -e "  Frontend → http://localhost:3000"
echo -e "  API Docs → http://127.0.0.1:8000/docs"
echo -e "================================================"
echo -e "\nPress Ctrl+C to stop all servers\n"

# Handle exit
trap "echo -e '\n${RED}Shutting down...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; fuser -k 8000/tcp 2>/dev/null; fuser -k 3000/tcp 2>/dev/null; echo -e '${GREEN}Stopped!${NC}'; exit 0" SIGINT SIGTERM

wait $BACKEND_PID