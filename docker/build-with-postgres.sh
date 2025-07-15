#!/bin/bash

# DB-GPT Docker Build Script with PostgreSQL Support
# This script builds a custom DB-GPT Docker image that always includes PostgreSQL support

set -e

echo "🚀 Building DB-GPT Docker image with PostgreSQL support..."

# Change to the script's directory
cd "$(dirname "$0")"

# Build the image with PostgreSQL support included
docker build \
    --build-arg EXTRAS=base,proxy_openai,rag,storage_chromadb,dbgpts,datasource_postgres,datasource_mysql \
    --build-arg BASE_IMAGE=ubuntu:22.04 \
    --build-arg PYTHON_VERSION=3.11 \
    --build-arg PIP_INDEX_URL=https://pypi.org/simple \
    -f base/Dockerfile \
    -t dbgpt-postgres:latest \
    ../

echo "✅ Docker image 'dbgpt-postgres:latest' built successfully with PostgreSQL support!"
echo ""
echo "🔧 To run with docker-compose, use:"
echo "   docker compose up -d"
echo ""
echo "🔗 PostgreSQL libraries included:"
echo "   - psycopg2-binary (PostgreSQL adapter)"
echo "   - All standard DB-GPT features"
echo ""
echo "🌐 Once running, access DB-GPT at: http://localhost:5670" 