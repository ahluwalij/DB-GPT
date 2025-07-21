# DB-GPT Repository Knowledge for Claude

## Repository Overview
DB-GPT is a comprehensive AI database system that provides intelligent data analysis, multi-agent orchestration, and natural language database interactions. This repository contains agents, models, tools, and frameworks for building AI-powered data applications.

NEVER INCLUDE IN COMMIT MESSAGES CO AUTHORED BY CLAUDE OR ANTHROPIC

## Project Structure

### Core Packages
- **packages/dbgpt-core/**: Core functionality including agents, memory, resources, and base classes
- **packages/dbgpt-app/**: Main application with web server, chat interfaces, and UI components  
- **packages/dbgpt-ext/**: Extensions for datasources, storage, vector stores, and integrations

### Key Directories
- **docs/**: Comprehensive documentation including agents, installation, API references
- **configs/**: Configuration files for different deployment scenarios
- **pilot/**: Legacy components and examples
- **examples/**: Code examples and tutorials

## Agent System Architecture

### Core Agent Components

#### 1. Memory System
Located in: `packages/dbgpt-core/src/dbgpt/agent/memory/`

**Memory Types:**
- **SensoryMemory**: Immediate input reception with configurable buffer
- **ShortTermMemory**: FIFO buffered memory for recent context
- **EnhancedShortTermMemory**: Similarity-based memory enhancement using embeddings
- **LongTermMemory**: Vector-based persistent storage with importance scoring
- **HybridMemory**: Orchestrates all memory types for comprehensive memory management

**Key Features:**
- Memory fragments with importance scoring and timestamps
- Similarity-based memory enhancement and consolidation
- Time-weighted retrieval for long-term memory
- Customizable memory reading/writing through agent overrides

#### 2. Planning System
Located in: `packages/dbgpt-core/src/dbgpt/agent/plan/`

**Planning Components:**
- **AutoPlanChatManager**: Automatic task decomposition and agent assignment
- **WrappedAWELLayoutManager**: Sequential workflow execution with AWEL integration
- **Plan**: Task representation with dependencies and execution status

**Capabilities:**
- Complex task decomposition into subtasks
- Multi-agent coordination and task assignment
- Dependency management and execution ordering
- Progress tracking and status reporting

#### 3. Resource System
Located in: `packages/dbgpt-core/src/dbgpt/agent/resource/`

**Resource Types:**
- **Tools**: Function-based tools with @tool decorator
- **Databases**: RDBMS connectors (PostgreSQL, MySQL, SQLite, etc.)
- **Knowledge**: Retriever-based knowledge access
- **APIs**: Third-party API integrations
- **Files**: File system access and manipulation

**Database Resources:**
- **RDBMSConnectorResource**: Generic RDBMS connector
- **SQLiteDBResource**: SQLite-specific implementation
- **DatasourceResource**: DB-GPT datasource integration

#### 4. Action System
Located in: `packages/dbgpt-core/src/dbgpt/agent/action/`

**Action Framework:**
- **Action**: Base class for all agent actions
- **ActionOutput**: Standardized action result format
- **Agent Actions**: Custom actions for specific agent behaviors

### Agent Types

#### Built-in Agents
- **ConversableAgent**: Base conversational agent with memory and resource binding
- **UserProxyAgent**: Human user proxy for agent interactions
- **DataScientistAgent**: Specialized for data analysis and SQL generation
- **ToolAssistantAgent**: Tool-focused agent for function calling
- **SummaryAssistantAgent**: Text summarization and analysis

#### Custom Agent Development
- **ProfileConfig**: Agent identity, role, goals, and constraints
- **Custom Actions**: Specialized behaviors and operations
- **Resource Binding**: Database, tool, and knowledge integration
- **Memory Customization**: Custom read/write memory patterns

## Database Integration

### Supported Databases
- PostgreSQL, MySQL, SQLite
- ClickHouse, Apache Doris, DuckDB
- Hive, MSSQL, OceanBase
- StarRocks, Vertica, TuGraph

### PostgreSQL Integration
Installation: `uv sync --extra "datasource_postgres"`

**Connector Setup:**
```python
from dbgpt_ext.datasource.rdbms.conn_postgresql import PostgreSQLConnector
from dbgpt.agent.resource import RDBMSConnectorResource

connector = PostgreSQLConnector.from_uri_db(
    host="localhost", port=5432,
    user="username", pwd="password", 
    db_name="database"
)
db_resource = RDBMSConnectorResource("resource_name", connector=connector)
```

### Database Agent Features
- Natural language to SQL translation
- Query execution and result formatting
- Data visualization with GPT-Vis protocol
- Schema introspection and analysis
- Business intelligence and KPI calculation

## Tool System

### Tool Creation Methods

#### 1. @tool Decorator
```python
from dbgpt.agent.resource import tool

@tool
def function_name(param: type) -> return_type:
    """Tool description for LLM."""
    return result
```

#### 2. FunctionTool Class
```python
from dbgpt.agent.resource import FunctionTool

tool = FunctionTool("tool_name", function_reference)
```

#### 3. Custom Tool Classes
```python
from dbgpt.agent.resource import BaseTool

class CustomTool(BaseTool):
    def execute(self, *args, **kwargs):
        return result
```

### Tool Management
- **ToolPack**: Collection of related tools
- **Resource Binding**: Tools bound to agents for execution
- **Parameter Schemas**: Pydantic models for tool inputs
- **Async Execution**: Support for asynchronous tool operations

## Configuration and Environment

### Environment Variables
- **OPENAI_API_KEY**: OpenAI API access (required for embeddings and LLM)
- **OPENAI_API_BASE**: OpenAI API base URL
- **Database credentials**: Host, port, username, password for database connections
- **Storage paths**: Vector store and memory persistence locations

### Configuration Files
- **configs/dbgpt-proxy-openai.toml**: OpenAI proxy configuration
- **Model configurations**: LLM and embedding model settings
- **Service configurations**: Web server and API settings
- **Storage configurations**: Vector stores and databases

### Dependencies Installation
```bash
# Basic agent functionality
pip install "dbgpt[agent,simple_framework]>=0.7.0" "dbgpt_ext>=0.7.0"

# PostgreSQL support
uv sync --extra "datasource_postgres"

# Full installation with all extras
uv sync --all-packages --extra "base" --extra "rag" --extra "storage_chromadb"
```

## Memory and Vector Storage

### Vector Stores
- **ChromaDB**: Default vector storage for embeddings
- **Milvus**: Scalable vector database option
- **PGVector**: PostgreSQL vector extension
- **Elasticsearch**: Full-text and vector search

### Embedding Models
- **OpenAI Embeddings**: API-based embeddings
- **Local Models**: text2vec and other local embedding models
- **Remote Embeddings**: DB-GPT cluster embedding service

## Key Documentation Links

### Agent Documentation
- **Introduction**: `/docs/docs/agents/introduction/`
- **Custom Agents**: `/docs/docs/agents/introduction/custom_agents.md`
- **Database Integration**: `/docs/docs/agents/introduction/database.md`
- **Planning**: `/docs/docs/agents/introduction/planning.md`
- **Tools**: `/docs/docs/agents/introduction/tools.md`

### Memory System
- **Memory Overview**: `/docs/docs/agents/modules/memory/memory.md`
- **Short-term Memory**: `/docs/docs/agents/modules/memory/short_term_memory.md`
- **Long-term Memory**: `/docs/docs/agents/modules/memory/long_term_memory.md`
- **Hybrid Memory**: `/docs/docs/agents/modules/memory/hybrid_memory.md`

### Resources and Tools
- **Tools**: `/docs/docs/agents/modules/resource/tools.md`
- **Database Resources**: `/docs/docs/agents/modules/resource/database.md`
- **Knowledge Resources**: `/docs/docs/agents/modules/resource/knowledge.md`

### Installation and Setup
- **PostgreSQL**: `/docs/docs/installation/integrations/postgres_install.md`
- **Other Integrations**: `/docs/docs/installation/integrations/`

## Implementation Patterns

### Agent Builder Pattern
```python
agent = (
    await AgentClass()
    .bind(context)
    .bind(LLMConfig(llm_client=llm_client))
    .bind(agent_memory)
    .bind(resources)
    .build()
)
```

### Memory Configuration Pattern
```python
hybrid_memory = HybridMemory(
    sensory_memory=SensoryMemory(buffer_size=5),
    short_term_memory=EnhancedShortTermMemory(...),
    long_term_memory=LongTermMemory(...)
)
agent_memory = AgentMemory(memory=hybrid_memory)
```

### Multi-Agent Conversation Pattern
```python
await user_proxy.initiate_chat(
    recipient=target_agent,
    reviewer=reviewer_agent,
    message="User query or task"
)
```

## Chat Data Agent Implementation

### Custom Agent Requirements
For implementing a Chat Data Agent with memory and PostgreSQL access:

1. **Memory Setup**: Hybrid memory with user preference tracking
2. **Database Integration**: PostgreSQL connector with business logic
3. **Custom Tools**: Business metric calculations and acronym definitions
4. **Planning Integration**: Auto-planning for complex data analysis
5. **Custom Actions**: Enhanced data analysis with business context

### Key Implementation Files
- **Main Implementation**: `CHAT_DATA_AGENT_IMPLEMENTATION.md`
- **Agent Class**: Custom ConversableAgent with business logic
- **Custom Actions**: ChatDataAction for enhanced data analysis
- **Business Tools**: Acronym definitions, metric calculations, formatting
- **Memory Enhancement**: Business context prioritization in memory

### Integration Points
- **Web Interface**: Integration with DB-GPT chat dashboard
- **Database Queries**: Natural language to SQL with business context
- **Memory Persistence**: User preferences and conversation history
- **Planning**: Complex analysis task decomposition
- **Visualization**: GPT-Vis protocol for charts and tables

## Development Workflow

### Testing Commands
- **Run Tests**: `pytest tests/`
- **Type Checking**: `mypy packages/`
- **Linting**: `ruff check packages/`
- **Start Server**: `uv run dbgpt start webserver --config configs/dbgpt-proxy-openai.toml`

### Common Development Tasks
1. **Environment Setup**: Install dependencies with uv
2. **Database Connection**: Configure PostgreSQL credentials
3. **Agent Development**: Implement custom agents with ProfileConfig
4. **Tool Creation**: Add business-specific tools with @tool decorator
5. **Memory Customization**: Override read_memories and write_memories
6. **Testing**: Create test scenarios for agent interactions

This knowledge base provides comprehensive understanding of DB-GPT's agent system, database integration, memory management, and implementation patterns needed for building sophisticated AI-powered data analysis applications.