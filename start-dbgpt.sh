#!/bin/bash

# DB-GPT Startup Script
# This script ensures DB-GPT starts cleanly every time with all dependencies
# Usage: ./start-dbgpt.sh [dev]
#   dev: Start frontend in development mode with hot reload

set -e  # Exit on any error

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check for dev flag
DEV_MODE=false
if [[ "$1" == "dev" || "$1" == "--dev" ]]; then
    DEV_MODE=true
    print_status "Development mode enabled - frontend will run with hot reload"
fi

print_status "Starting DB-GPT initialization..."

# 1. Stop any existing containers
print_status "Stopping any existing DB-GPT containers..."
docker compose down 2>/dev/null || true

# 2. Create necessary directories
print_status "Creating necessary directories..."
mkdir -p pilot/meta_data
mkdir -p pilot/meta_data/alembic/versions
mkdir -p data
mkdir -p data/models
mkdir -p logs

# 3. Initialize SQLite database if it doesn't exist
if [ ! -f "pilot/meta_data/dbgpt.db" ]; then
    print_status "Initializing SQLite database..."
    sqlite3 pilot/meta_data/dbgpt.db "CREATE TABLE IF NOT EXISTS _temp_init (id INTEGER PRIMARY KEY);"
    print_success "SQLite database initialized"
else
    print_status "SQLite database already exists"
fi

# 4. Verify OpenAI API key is set
if [ -f ".env" ] && grep -q "OPENAI_API_KEY=sk-proj-" .env; then
    print_success "OpenAI API key is configured"
else
    print_error "OpenAI API key not found in .env file"
    print_error "Please ensure OPENAI_API_KEY is set in .env file"
    exit 1
fi

# 5. Clean up any orphaned containers or volumes
print_status "Cleaning up orphaned containers and volumes..."
docker system prune -f --volumes 2>/dev/null || true

# 6. Pull latest images (optional - uncomment if you want to always pull latest)
# print_status "Pulling latest Docker images..."
# docker compose pull

# 7. Start the application
print_status "Starting DB-GPT application..."
docker compose up -d

# 8. Wait for services to be ready
print_status "Waiting for services to start..."
sleep 10

# 9. Check if webserver is responding
print_status "Checking if webserver is responding..."
for i in {1..30}; do
    if curl -s -f http://localhost:5670 > /dev/null 2>&1; then
        print_success "DB-GPT webserver is running!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Webserver failed to start after 30 attempts"
        print_error "Check logs with: docker compose logs webserver"
        exit 1
    fi
    sleep 2
done

# 10. Display status
print_status "Checking container status..."
docker compose ps

# 11. Show logs for a few seconds
print_status "Showing recent logs..."
docker compose logs --tail=20

# 12. Start frontend dev server if in dev mode
if [ "$DEV_MODE" = true ]; then
    print_status "Starting frontend development server..."
    
    # Kill any existing process on port 3000
    print_status "Cleaning up port 3000..."
    if lsof -ti:3000 > /dev/null 2>&1; then
        print_status "Killing existing process on port 3000..."
        kill -9 $(lsof -ti:3000) 2>/dev/null || true
        sleep 1
    fi
    
    # Check if yarn is installed
    if command -v yarn &> /dev/null; then
        print_status "Using yarn to start dev server on port 3000..."
        cd web
        PORT=3000 yarn dev &
        FRONTEND_PID=$!
        cd ..
        print_success "Frontend dev server started with PID: $FRONTEND_PID"
        print_warning "Frontend will be available at: http://localhost:3000"
        print_warning "To stop frontend dev server: kill $FRONTEND_PID"
    else
        print_error "yarn not found. Please install yarn to use dev mode."
        print_error "You can install it with: npm install -g yarn"
        exit 1
    fi
fi

echo ""
print_success "=== DB-GPT Started Successfully! ==="
if [ "$DEV_MODE" = true ]; then
    print_success "Frontend (Dev): http://localhost:3000 (with hot reload)"
    print_success "Backend API: http://localhost:5670"
else
    print_success "Web Interface: http://localhost:5670"
fi
print_success "Database: MySQL (external connections) + SQLite (metadata)"
print_success "LLM Model: OpenAI o3"
print_success "Embeddings: OpenAI text-embedding-3-small"
echo ""
print_status "Useful commands:"
print_status "  View logs: docker compose logs -f webserver"
print_status "  Stop app: docker compose down"
if [ "$DEV_MODE" = true ]; then
    print_status "  Restart (dev): ./start-dbgpt.sh dev"
    print_status "  Restart (prod): ./start-dbgpt.sh"
else
    print_status "  Restart: ./start-dbgpt.sh"
    print_status "  Dev mode: ./start-dbgpt.sh dev"
fi
echo "" 