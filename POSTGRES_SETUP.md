# DB-GPT with PostgreSQL Support

This setup has been configured to **always include PostgreSQL support** in your Docker environment.

## 🔧 Changes Made

### 1. Docker Compose Configuration
- **Modified `docker-compose.yml`** to build a custom image locally instead of using the pre-built image
- **Added PostgreSQL support** (`datasource_postgres`) to the build extras
- **Added OpenAI API key** to environment variables

### 2. Environment Variables
- **Updated `.env` file** with your OpenAI API key
- **Added OPENAI_API_KEY** to docker-compose environment

### 3. Custom Build Script
- **Created `docker/build-with-postgres.sh`** for manual building with PostgreSQL support

## 🚀 Getting Started

### Option 1: Using Docker Compose (Recommended)
```bash
# Build and start all services
docker compose up -d --build

# Check logs
docker compose logs -f webserver

# Access DB-GPT at http://localhost:5670
```

### Option 2: Manual Build
```bash
# Build custom image with PostgreSQL support
./docker/build-with-postgres.sh

# Then run with docker compose
docker compose up -d
```

## 🔗 Testing PostgreSQL Connection

1. **Access DB-GPT web interface**: http://localhost:5670
2. **Navigate to Data Sources** section
3. **Add PostgreSQL database** with these test settings:
   - **Host**: your PostgreSQL server
   - **Port**: 5432 (default)
   - **Database**: your database name
   - **Username**: your username
   - **Password**: your password

## 🐛 No More "psycopg2" Errors!

The Docker image now includes:
- ✅ `psycopg2-binary` (PostgreSQL Python adapter)
- ✅ `libpq-dev` (PostgreSQL development libraries)
- ✅ All other standard database connectors (MySQL, SQLite, etc.)

## 📝 Configuration Details

### Build Arguments Used:
```
EXTRAS=base,proxy_openai,rag,storage_chromadb,dbgpts,datasource_postgres,datasource_mysql
```

### Environment Variables:
- `OPENAI_API_KEY`: Your OpenAI API key
- `SILICONFLOW_API_KEY`: Your SiliconFlow API key
- `MYSQL_*`: MySQL configuration for internal DB-GPT storage

## 🔄 Rebuilding

If you need to rebuild the image:
```bash
# Stop services
docker compose down

# Rebuild and restart
docker compose up -d --build
```

## 🆘 Troubleshooting

### If you still get psycopg2 errors:
1. Check that the image built successfully: `docker images | grep dbgpt`
2. Verify the container is using the new image: `docker compose ps`
3. Check the build logs: `docker compose logs webserver`

### To verify PostgreSQL support is installed:
```bash
# Execute into the container
docker compose exec webserver bash

# Test psycopg2 import
python -c "import psycopg2; print('PostgreSQL support available!')"
```

## 🎯 What's Next?

Your DB-GPT setup now has **permanent PostgreSQL support**. You can:
1. Connect to any PostgreSQL database
2. Use all DB-GPT features with PostgreSQL data
3. Run complex AI queries on your PostgreSQL databases
4. Build knowledge bases from PostgreSQL data 