#!/bin/bash

# DB-GPT Stop Script
# This script cleanly stops all DB-GPT services

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_status "Stopping DB-GPT services..."

# Stop all containers
docker compose down

# Stop frontend dev server if running
print_status "Checking for frontend dev server..."
if lsof -ti:3000 > /dev/null 2>&1; then
    print_status "Stopping frontend dev server on port 3000..."
    kill -9 $(lsof -ti:3000) 2>/dev/null || true
    print_success "Frontend dev server stopped"
else
    print_status "No frontend dev server found on port 3000"
fi

# Also kill any remaining next dev processes as backup
if pgrep -f "next dev" > /dev/null; then
    print_status "Cleaning up any remaining next dev processes..."
    pkill -f "next dev" 2>/dev/null || true
fi

# Show final status
print_status "Final container status:"
docker compose ps

print_success "DB-GPT services stopped successfully!"
print_status "To restart, run: ./start-dbgpt.sh"
print_status "To restart with dev mode: ./start-dbgpt.sh dev" 