# Chat Data Agent with Memory and Database Access Implementation Guide

## Overview

This document provides a comprehensive guide for implementing a Chat Data Agent in DB-GPT that includes:
- **Memory Management** (hybrid memory for user preferences and conversation history)
- **Database Access** (PostgreSQL integration)
- **Tool Use** (data analysis and custom business logic tools)
- **Planning** (for complex data analysis tasks)
- **Custom Business Logic** (acronym definitions, domain-specific knowledge)

## Architecture Overview

```
User Query → Chat Interface → Chat Data Agent
                                    ↓
                    Memory System (Hybrid: Sensory + Short-term + Long-term)
                                    ↓
                    Planning Module (Auto-planning for complex tasks)
                                    ↓
                    Resource Manager (Database + Tools + Custom Knowledge)
                                    ↓
                    Action Execution → Database Queries + Analysis
                                    ↓
                    Response with Memory Update
```

## Core Components

### 1. Memory System Implementation

The agent uses a **Hybrid Memory** system combining:

#### Memory Types:
- **Sensory Memory**: Immediate input reception (buffer_size=5)
- **Enhanced Short-term Memory**: Context retention with similarity enhancement
- **Long-term Memory**: Persistent storage using vector embeddings
- **Hybrid Memory**: Orchestrates all memory types

#### Memory Features:
- **User Preference Tracking**: Stores user preferences, frequently used acronyms, preferred data formats
- **Conversation History**: Maintains context across sessions
- **Data Access Patterns**: Learns which data sources user frequently accesses
- **Domain Knowledge**: Custom business logic and acronym definitions

```python
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from dbgpt.agent import (
    SensoryMemory,
    EnhancedShortTermMemory, 
    LongTermMemory,
    HybridMemory,
    AgentMemory,
)

# Enhanced memory configuration for business context
hybrid_memory = HybridMemory(
    now=datetime.now(),
    sensory_memory=SensoryMemory(buffer_size=5),
    short_term_memory=EnhancedShortTermMemory(
        embeddings=embeddings,
        buffer_size=10,
        enhance_similarity_threshold=0.7,
        enhance_threshold=3,
        executor=ThreadPoolExecutor(),
    ),
    long_term_memory=LongTermMemory(
        executor=ThreadPoolExecutor(),
        vector_store=vector_store,
        _default_importance=0.6
    ),
)
```

### 2. Database Integration (PostgreSQL)

#### Installation Requirements:
```bash
uv sync --all-packages \
--extra "base" \
--extra "datasource_postgres" \
--extra "rag" \
--extra "storage_chromadb" \
--extra "dbgpts"
```

#### Database Connector:
```python
from dbgpt_ext.datasource.rdbms.conn_postgresql import PostgreSQLConnector
from dbgpt.agent.resource import RDBMSConnectorResource

# PostgreSQL connection
postgres_connector = PostgreSQLConnector.from_uri_db(
    host="localhost",
    port=5432,
    user="your_username", 
    pwd="your_password",
    db_name="your_database",
    engine_args={"connect_args": {"sslmode": "prefer"}}
)

# Create database resource
db_resource = RDBMSConnectorResource("postgres_data", connector=postgres_connector)
```

### 3. Custom Tools for Data Analysis

#### Business Logic Tools:

```python
from dbgpt.agent.resource import tool, ToolPack
from typing_extensions import Annotated, Doc

@tool
def define_acronym(acronym: Annotated[str, Doc("Business acronym to define")]) -> str:
    """Define business-specific acronyms and technical terms."""
    acronym_dict = {
        "KPI": "Key Performance Indicator",
        "ROI": "Return on Investment", 
        "EBITDA": "Earnings Before Interest, Taxes, Depreciation, and Amortization",
        "CAC": "Customer Acquisition Cost",
        "LTV": "Lifetime Value",
        "ARR": "Annual Recurring Revenue",
        "MRR": "Monthly Recurring Revenue",
        "CAGR": "Compound Annual Growth Rate"
    }
    return acronym_dict.get(acronym.upper(), f"Acronym '{acronym}' not found in business dictionary.")

@tool  
def calculate_business_metrics(
    metric_type: Annotated[str, Doc("Type of metric: revenue_growth, conversion_rate, churn_rate")],
    current_value: Annotated[float, Doc("Current period value")],
    previous_value: Annotated[float, Doc("Previous period value")]
) -> dict:
    """Calculate common business metrics and KPIs."""
    
    if metric_type == "revenue_growth":
        growth_rate = ((current_value - previous_value) / previous_value) * 100
        return {
            "metric": "Revenue Growth Rate",
            "current_value": current_value,
            "previous_value": previous_value, 
            "growth_rate_percent": round(growth_rate, 2),
            "interpretation": "Positive indicates growth" if growth_rate > 0 else "Negative indicates decline"
        }
    elif metric_type == "conversion_rate":
        conversion_rate = (current_value / previous_value) * 100
        return {
            "metric": "Conversion Rate",
            "conversions": current_value,
            "total_visitors": previous_value,
            "conversion_rate_percent": round(conversion_rate, 2)
        }
    elif metric_type == "churn_rate":
        churn_rate = (current_value / previous_value) * 100
        return {
            "metric": "Churn Rate", 
            "churned_customers": current_value,
            "total_customers": previous_value,
            "churn_rate_percent": round(churn_rate, 2),
            "retention_rate_percent": round(100 - churn_rate, 2)
        }

@tool
def format_data_for_presentation(
    data_type: Annotated[str, Doc("Type: table, chart, summary")],
    data: Annotated[str, Doc("Raw data to format")],
    user_preference: Annotated[str, Doc("User's preferred format style")] = "business"
) -> dict:
    """Format data according to user preferences and business standards."""
    
    formatting_styles = {
        "business": {
            "table": "Clean tabular format with business-friendly column names",
            "chart": "Executive dashboard style with clear legends and titles",
            "summary": "Executive summary with key insights and action items"
        },
        "technical": {
            "table": "Detailed technical format with metadata",
            "chart": "Technical charts with detailed annotations", 
            "summary": "Technical analysis with statistical significance"
        }
    }
    
    return {
        "formatted_data": data,
        "style_applied": formatting_styles.get(user_preference, {}).get(data_type),
        "recommendations": "Consider adding trend analysis" if data_type == "chart" else "Add executive summary"
    }

# Create tool pack
business_tools = ToolPack([
    define_acronym,
    calculate_business_metrics,
    format_data_for_presentation
])
```

### 4. Custom Chat Data Agent

```python
from typing import Optional, Dict, Any, List, Tuple
from dbgpt.agent import (
    ConversableAgent,
    ProfileConfig,
    AgentMessage,
    ActionOutput,
    Action,
    AgentResource,
    ResourceType
)
from dbgpt.agent.expand.data_scientist_agent import DataScientistAgent
from pydantic import BaseModel, Field

class ChatDataActionInput(BaseModel):
    analysis_type: str = Field(description="Type of data analysis to perform")
    query: str = Field(description="SQL query or analysis request")
    business_context: str = Field(description="Business context and requirements")

class ChatDataAction(Action[ChatDataActionInput]):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
    
    @property
    def resource_need(self) -> Optional[ResourceType]:
        return ResourceType.Database
    
    @property 
    def render_protocol(self) -> Optional[Any]:
        return None
    
    @property
    def out_model_type(self):
        return ChatDataActionInput
    
    async def run(
        self,
        ai_message: str,
        resource: Optional[AgentResource] = None,
        rely_action_out: Optional[ActionOutput] = None,
        need_vis_render: bool = True,
        **kwargs,
    ) -> ActionOutput:
        try:
            param: ChatDataActionInput = self._input_convert(ai_message, ChatDataActionInput)
            
            # Enhanced business logic processing
            enhanced_response = {
                "analysis_type": param.analysis_type,
                "query": param.query,
                "business_context": param.business_context,
                "timestamp": datetime.now().isoformat(),
                "user_preferences_applied": kwargs.get("user_preferences", {}),
                "domain_knowledge_used": True
            }
            
            return ActionOutput(
                is_exe_success=True,
                content=enhanced_response
            )
            
        except Exception as e:
            return ActionOutput(
                is_exe_success=False,
                content=f"Error in chat data analysis: {str(e)}"
            )

class ChatDataAgent(ConversableAgent):
    profile: ProfileConfig = ProfileConfig(
        name="DataInsight",
        role="Business Data Analyst", 
        goal=(
            "Provide intelligent data analysis with business context understanding, "
            "remember user preferences, and deliver actionable insights from database queries."
        ),
        desc=(
            "An AI business analyst that combines technical data analysis capabilities "
            "with business domain knowledge. Specializes in translating complex data "
            "into business-friendly insights while maintaining conversation context "
            "and user preferences."
        ),
        constraints=[
            "Always consider business context when analyzing data",
            "Remember and apply user preferences for data presentation",
            "Provide actionable insights, not just raw data",
            "Explain acronyms and technical terms for business users",
            "Maintain conversation history to build on previous analyses",
            "Format responses according to user's preferred style (business/technical)",
            "Suggest follow-up questions and deeper analysis opportunities"
        ]
    )
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._init_actions([ChatDataAction])
        
        # Business context knowledge base
        self.business_context = {
            "common_metrics": ["revenue", "profit", "growth_rate", "conversion", "retention"],
            "report_formats": ["executive_summary", "detailed_analysis", "dashboard"],
            "data_granularity": ["daily", "weekly", "monthly", "quarterly", "yearly"]
        }
    
    async def read_memories(self, question: str) -> str:
        """Enhanced memory reading with business context prioritization."""
        memories = await self.memory.read(observation=question)
        
        # Prioritize business-relevant memories
        business_memories = []
        general_memories = []
        
        for memory in memories:
            if any(term in memory.raw_observation.lower() for term in self.business_context["common_metrics"]):
                business_memories.append(memory)
            else:
                general_memories.append(memory)
        
        # Combine with business context prioritized
        prioritized_memories = business_memories + general_memories
        recent_context = "\n".join([m.raw_observation for m in prioritized_memories[-5:]])
        
        return recent_context
    
    async def write_memories(
        self,
        question: str,
        ai_message: str, 
        action_output: Optional[ActionOutput] = None,
        check_pass: bool = True,
        check_fail_reason: Optional[str] = None,
    ) -> None:
        """Enhanced memory writing with user preference tracking."""
        
        if not action_output:
            return
            
        # Extract user preferences and business context
        memory_content = {
            "user_query": question,
            "assistant_response": ai_message,
            "business_context": getattr(action_output, 'business_context', ''),
            "analysis_type": getattr(action_output, 'analysis_type', ''),
            "timestamp": datetime.now().isoformat()
        }
        
        # Enhanced memory template for business context
        write_memory_template = """
        Business Query: {{ user_query }}
        Analysis Type: {{ analysis_type }}
        Response: {{ assistant_response }}
        Business Context: {{ business_context }}
        Timestamp: {{ timestamp }}
        """
        
        rendered_memory = self._render_template(write_memory_template, **memory_content)
        
        from dbgpt.agent import AgentMemoryFragment
        fragment = AgentMemoryFragment(rendered_memory)
        await self.memory.write(fragment)
    
    def prepare_act_param(
        self,
        received_message: Optional[AgentMessage],
        sender: Any,
        rely_messages: Optional[List[AgentMessage]] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Prepare action parameters with user preferences."""
        
        # Extract user preferences from memory or defaults
        user_preferences = {
            "format_style": "business",  # business or technical
            "detail_level": "summary",   # summary or detailed  
            "include_recommendations": True,
            "preferred_charts": ["bar", "line", "pie"],
            "business_focus": ["revenue", "growth", "efficiency"]
        }
        
        return {
            "user_preferences": user_preferences,
            "business_context": self.business_context
        }
```

### 5. Planning Integration

```python
from dbgpt.agent import AutoPlanChatManager, WrappedAWELLayoutManager

class ChatDataPlanningAgent:
    """Planning coordinator for complex data analysis tasks."""
    
    def __init__(self, llm_client, context, agent_memory):
        self.llm_client = llm_client
        self.context = context
        self.agent_memory = agent_memory
    
    async def create_auto_planner(self, specialists: List[Any]) -> AutoPlanChatManager:
        """Create auto-planning manager for complex analysis."""
        
        manager = (
            await AutoPlanChatManager()
            .bind(self.context)
            .bind(self.agent_memory)
            .bind(LLMConfig(llm_client=self.llm_client))
            .build()
        )
        
        manager.hire(specialists)
        return manager
    
    async def create_sequential_planner(self, specialists: List[Any]) -> WrappedAWELLayoutManager:
        """Create sequential workflow planner."""
        
        manager = (
            await WrappedAWELLayoutManager()
            .bind(self.context)
            .bind(self.agent_memory) 
            .bind(LLMConfig(llm_client=self.llm_client))
            .build()
        )
        
        manager.hire(specialists)
        return manager
```

### 6. Complete Implementation

```python
import asyncio
import os
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

async def create_chat_data_agent():
    """Complete Chat Data Agent setup."""
    
    # 1. LLM Configuration
    llm_client = OpenAILLMClient(
        model_alias="gpt-4o",
        api_base=os.getenv("OPENAI_API_BASE"),
        api_key=os.getenv("OPENAI_API_KEY"),
    )
    
    # 2. Agent Context
    context = AgentContext(
        conv_id="chat_data_session",
        language="en",
        temperature=0.7,
        max_new_tokens=2048
    )
    
    # 3. Memory System Setup
    embeddings = DefaultEmbeddingFactory.openai(
        api_url=os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1") + "/embeddings",
        api_key=os.getenv("OPENAI_API_KEY")
    )
    
    vector_store = ChromaStore(
        vector_store_config=ChromaVectorConfig(persist_path="./chat_data_memory"),
        name="chat_data_memory",
        embedding_fn=embeddings,
    )
    
    hybrid_memory = HybridMemory(
        now=datetime.now(),
        sensory_memory=SensoryMemory(buffer_size=5),
        short_term_memory=EnhancedShortTermMemory(
            embeddings=embeddings,
            buffer_size=10,
            enhance_similarity_threshold=0.7,
            enhance_threshold=3,
            executor=ThreadPoolExecutor(),
        ),
        long_term_memory=LongTermMemory(
            executor=ThreadPoolExecutor(),
            vector_store=vector_store,
            _default_importance=0.6
        ),
    )
    
    agent_memory = AgentMemory(memory=hybrid_memory)
    
    # 4. Database Resource Setup
    postgres_connector = PostgreSQLConnector.from_uri_db(
        host="localhost",
        port=5432,
        user=os.getenv("POSTGRES_USER"),
        pwd=os.getenv("POSTGRES_PASSWORD"),
        db_name=os.getenv("POSTGRES_DB"),
    )
    db_resource = RDBMSConnectorResource("postgres_data", connector=postgres_connector)
    
    # 5. Tools Setup
    business_tools = ToolPack([
        define_acronym,
        calculate_business_metrics,
        format_data_for_presentation
    ])
    
    # 6. Agent Creation
    chat_data_agent = (
        await ChatDataAgent()
        .bind(context)
        .bind(LLMConfig(llm_client=llm_client))
        .bind(agent_memory)
        .bind(db_resource)
        .bind(business_tools)
        .build()
    )
    
    # 7. Data Scientist Specialist  
    data_scientist = (
        await DataScientistAgent()
        .bind(context)
        .bind(LLMConfig(llm_client=llm_client))
        .bind(agent_memory)
        .bind(db_resource)
        .build()
    )
    
    # 8. Planning Manager
    planning_agent = ChatDataPlanningAgent(llm_client, context, agent_memory)
    auto_planner = await planning_agent.create_auto_planner([chat_data_agent, data_scientist])
    
    # 9. User Proxy
    user_proxy = await UserProxyAgent().bind(agent_memory).bind(context).build()
    
    return {
        "chat_agent": chat_data_agent,
        "data_scientist": data_scientist,
        "planner": auto_planner,
        "user_proxy": user_proxy,
        "memory": agent_memory
    }

# Usage Example
async def main():
    agents = await create_chat_data_agent()
    
    # Simple query
    await agents["user_proxy"].initiate_chat(
        recipient=agents["chat_agent"],
        reviewer=agents["user_proxy"],
        message="Show me the revenue trends for Q3, and remember I prefer executive summaries with charts"
    )
    
    # Complex analysis with planning
    await agents["user_proxy"].initiate_chat(
        recipient=agents["planner"],
        reviewer=agents["user_proxy"],
        message="Analyze customer acquisition costs across all channels, calculate ROI, and provide recommendations for optimization"
    )
    
    # Print memory contents
    print("\nMemory Contents:")
    print(await agents["memory"].gpts_memory.app_link_chat_message("chat_data_session"))

if __name__ == "__main__":
    asyncio.run(main())
```

## Key Features

### Memory Management
- **User Preference Persistence**: Remembers preferred data formats, chart types, detail levels
- **Business Context Retention**: Maintains understanding of business domain and terminology  
- **Conversation Continuity**: Builds on previous analyses and maintains context
- **Adaptive Learning**: Improves responses based on user feedback patterns

### Database Integration
- **PostgreSQL Support**: Full integration with PostgreSQL databases
- **Query Optimization**: Intelligent query generation and optimization
- **Data Visualization**: Automatic chart and table generation
- **Business Intelligence**: KPI calculation and trend analysis

### Custom Business Logic
- **Acronym Dictionary**: Expandable business acronym definitions
- **Metric Calculations**: Common business metric calculations (ROI, CAC, LTV, etc.)
- **Format Preferences**: User-specific formatting and presentation styles
- **Domain Knowledge**: Industry-specific insights and recommendations

### Planning Capabilities  
- **Auto-Planning**: Automatic task decomposition for complex analyses
- **Sequential Workflows**: Step-by-step analysis execution
- **Multi-Agent Coordination**: Coordination between specialized agents
- **Progress Tracking**: Task completion monitoring and reporting

## Integration with Chat Interface

The agent integrates seamlessly with chat interfaces by:
1. **Natural Language Processing**: Understanding business queries in plain English
2. **Context Awareness**: Maintaining conversation state and user preferences
3. **Interactive Responses**: Providing actionable insights with follow-up suggestions
4. **Multi-modal Output**: Supporting text, tables, charts, and executive summaries

## Extension Points

- **Custom Tools**: Add domain-specific analysis tools
- **Additional Databases**: Extend to other database systems (MySQL, ClickHouse, etc.)
- **Advanced Memory**: Implement specialized memory for different business contexts
- **Integration APIs**: Connect to external business systems (CRM, ERP, etc.)
- **Custom Visualizations**: Add specialized chart types and dashboard components

This implementation provides a robust foundation for building intelligent chat-based data analysis systems that understand business context, remember user preferences, and provide actionable insights through natural conversation.