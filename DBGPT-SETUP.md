# DB-GPT Quick Start Guide

This setup provides a completely automated way to run DB-GPT with OpenAI GPT-4o.

## 🚀 Quick Start

### Start DB-GPT (Production Mode)
```bash
./start-dbgpt.sh
```

### Start DB-GPT (Development Mode)
```bash
./start-dbgpt.sh dev
```
*Development mode runs the frontend on port 3000 with hot reload for editing*

### Stop DB-GPT
```bash
./stop-dbgpt.sh
```

That's it! The script handles everything automatically.

## 📋 What the Script Does

The `start-dbgpt.sh` script automatically:

1. **Stops any existing containers** - Clean restart every time
2. **Creates necessary directories** - `pilot/meta_data`, `data`, `logs`, etc.
3. **Initializes SQLite database** - Creates `pilot/meta_data/dbgpt.db` if needed
4. **Verifies OpenAI API key** - Ensures configuration is correct
5. **Cleans up Docker resources** - Removes orphaned containers/volumes
6. **Starts the application** - Runs `docker compose up -d`
7. **Waits for services** - Checks that webserver is responding
8. **Cleans up port 3000** - Kills any processes using port 3000 (dev mode)
9. **Shows status and logs** - Displays container status and recent logs

## 🔧 Configuration

### Current Setup
- **LLM Model**: OpenAI GPT-4o
- **Embeddings**: OpenAI text-embedding-3-small
- **Metadata Database**: SQLite (`pilot/meta_data/dbgpt.db`)
- **External Database**: MySQL (for your data connections)
- **Web Interface**: 
  - **Production**: http://localhost:5670
  - **Development**: http://localhost:3000 (with hot reload)

### OpenAI API Key
The API key is hardcoded in `docker-compose.yml`:
```yaml
OPENAI_API_KEY=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
```

## 🛠️ Troubleshooting

### View Logs
```bash
docker compose logs -f webserver
```

### Check Container Status
```bash
docker compose ps
```

### Manual Stop
```bash
docker compose down
```

### Complete Reset
```bash
./stop-dbgpt.sh
rm -rf pilot/meta_data/dbgpt.db
./start-dbgpt.sh
```

## 📁 Directory Structure

```
DB-GPT-1/
├── start-dbgpt.sh          # Start script
├── stop-dbgpt.sh           # Stop script
├── docker-compose.yml      # Docker configuration
├── configs/                # Configuration files
│   └── dbgpt-proxy-openai.toml
├── pilot/
│   └── meta_data/
│       └── dbgpt.db        # SQLite metadata database
├── data/                   # Application data
└── logs/                   # Application logs
```

## 🔄 Development Workflow

### Frontend Development (with Hot Reload)
1. **Start in dev mode**: `./start-dbgpt.sh dev`
2. **Edit frontend code** in the `web/` directory
3. **Changes auto-reload** at http://localhost:3000
4. **Backend API available** at http://localhost:5670
5. **Stop when done**: `./stop-dbgpt.sh`

### Backend Development
1. **Make changes** to backend code or configuration
2. **Restart application**: `./start-dbgpt.sh`
3. **View logs**: `docker compose logs -f webserver`
4. **Stop when done**: `./stop-dbgpt.sh`

## 📊 Features

- ✅ **Zero-prep startup** - Works out of the box
- ✅ **Development mode** - Frontend hot reload with `./start-dbgpt.sh dev`
- ✅ **Automatic database initialization** - SQLite created automatically
- ✅ **OpenAI GPT-4o integration** - Latest model configured
- ✅ **MySQL support** - For external database connections
- ✅ **Health checks** - Verifies services are running
- ✅ **Colored output** - Easy to read status messages
- ✅ **Error handling** - Fails gracefully with helpful messages

## 🎯 Success Indicators

When the script completes successfully, you'll see:
- ✅ All containers running
- ✅ Web interface accessible at http://localhost:5670
- ✅ OpenAI API key configured
- ✅ Database initialized and ready

The application is ready to use for chat, database queries, and AI-powered data analysis! 