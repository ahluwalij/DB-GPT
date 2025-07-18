"""Multi-Resource Agent for handling multiple databases and knowledge spaces."""
import json
import logging
from typing import List, Optional, Dict, Any

from dbgpt.agent import (
    Agent,
    AgentContext,
    AgentMemory,
    AutoPlanChatManager,
    ConversableAgent,
    DataScientistAgent,
    ToolAssistantAgent,
    LLMConfig,
    ResourceType,
    ResourcePack,
    Resource,
)
from dbgpt.agent.resource import (
    RDBMSConnectorResource,
    KnowledgeResource,
)
from dbgpt_serve.agent.db.gpts_app import GptsApp, GptsAppDetail
from dbgpt_serve.agent.team.base import TeamMode

logger = logging.getLogger(__name__)


class MultiResourceAgentBuilder:
    """Builder for creating multi-resource agent configurations."""
    
    @staticmethod
    def create_app_for_resources(
        resources: List[Dict[str, str]], 
        app_name: str = "Multi-Resource Assistant",
        model_name: str = None
    ) -> GptsApp:
        """Create a GptsApp configuration for multiple resources.
        
        Args:
            resources: List of resource dictionaries with 'name' and 'type' keys
            app_name: Name for the app
            model_name: LLM model to use
            
        Returns:
            GptsApp configuration
        """
        app_code = f"multi_resource_{hash(json.dumps(resources))}"
        
        # Create agent details for each resource
        agent_details = []
        
        for idx, resource in enumerate(resources):
            resource_name = resource['name']
            resource_type = resource['type']
            
            # Choose appropriate agent type based on resource
            if resource_type == 'database':
                agent_class = 'DataScientistAgent'
                agent_role = f"Database Analyst for {resource_name}"
                agent_goal = f"Analyze and query data from {resource_name} database using SQL"
                agent_constraints = [
                    f"Only query data from {resource_name} database",
                    "Provide accurate SQL queries",
                    "Explain query results clearly"
                ]
            else:  # knowledge
                agent_class = 'ToolAssistantAgent'
                agent_role = f"Knowledge Expert for {resource_name}"
                agent_goal = f"Search and retrieve relevant information from {resource_name} knowledge space"
                agent_constraints = [
                    f"Only search in {resource_name} knowledge space",
                    "Provide relevant and accurate information",
                    "Cite sources when possible"
                ]
            
            agent_detail = GptsAppDetail(
                app_code=app_code,
                agent_name=agent_class,
                node_id=f"agent_{idx}",
                resources=[{
                    "type": "database" if resource_type == 'database' else "knowledge",
                    "name": resource_name,
                    "value": resource_name
                }],
                prompt_template="",
                llm_strategy="default",
                llm_strategy_value=None,
                created_at=None,
                updated_at=None
            )
            agent_details.append(agent_detail)
        
        # Create the app
        app = GptsApp(
            app_code=app_code,
            app_name=app_name,
            app_describe=f"Multi-resource assistant with access to {len(resources)} data sources",
            team_mode=TeamMode.AUTO_PLAN.value,
            language="en",
            team_context=None,
            user_code="system",
            sys_code="dbgpt",
            published="Y",
            hot_value=0,
            details=agent_details
        )
        
        return app
    
    @staticmethod
    def create_single_resource_config(resource_name: str, resource_type: str) -> Dict[str, Any]:
        """Create configuration for single resource scenario.
        
        Args:
            resource_name: Name of the resource
            resource_type: Type of resource ('database' or 'knowledge')
            
        Returns:
            Configuration dictionary
        """
        return {
            "select_param": resource_name,
            "chat_mode": "chat_with_db_execute" if resource_type == "database" else "chat_knowledge"
        }


class MultiResourceCoordinator(ConversableAgent):
    """Coordinator agent for multi-resource scenarios."""
    
    profile: str = "Multi-Resource Coordinator"
    goal: str = (
        "Coordinate between different data sources and agents to provide "
        "comprehensive answers by combining information from multiple sources."
    )
    constraints: List[str] = [
        "Delegate database queries to database specialists",
        "Delegate knowledge searches to knowledge experts", 
        "Synthesize information from multiple sources",
        "Ensure all relevant sources are consulted",
        "Provide clear attribution of information sources"
    ]
    desc: str = (
        "I coordinate between multiple data sources including databases and "
        "knowledge spaces to provide comprehensive answers to your questions."
    )
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._resource_agents = []
    
    def add_resource_agent(self, agent: Agent):
        """Add a resource-specific agent to coordinate."""
        self._resource_agents.append(agent)
    
    async def act(self) -> Optional[str]:
        """Override to implement coordination logic."""
        # The AutoPlanChatManager will handle the actual coordination
        # This is a placeholder for any custom coordination logic
        return await super().act()


def create_multi_resource_team(
    resources: List[Dict[str, str]],
    context: AgentContext,
    agent_memory: AgentMemory,
    llm_config: LLMConfig,
    resource_manager
) -> List[Agent]:
    """Create a team of agents for multi-resource scenarios.
    
    Args:
        resources: List of resources with 'name' and 'type'
        context: Agent context
        agent_memory: Shared agent memory
        llm_config: LLM configuration
        resource_manager: Resource manager instance
        
    Returns:
        List of configured agents
    """
    agents = []
    
    # Create coordinator if multiple resources
    if len(resources) > 1:
        coordinator = MultiResourceCoordinator()
        coordinator = (
            coordinator
            .bind(context)
            .bind(agent_memory)
            .bind(llm_config)
            .build()
        )
        agents.append(coordinator)
    
    # Create specialist agents for each resource
    for resource in resources:
        if resource['type'] == 'database':
            # Create database agent
            db_resource = resource_manager.get_resource(
                resource['name'], 
                ResourceType.DB
            )
            agent = DataScientistAgent()
            agent = (
                agent
                .bind(context)
                .bind(agent_memory)
                .bind(llm_config)
                .bind(db_resource)
                .build()
            )
        else:  # knowledge
            # Create knowledge agent
            knowledge_resource = resource_manager.get_resource(
                resource['name'],
                ResourceType.Knowledge
            )
            agent = ToolAssistantAgent()
            agent = (
                agent
                .bind(context)
                .bind(agent_memory)
                .bind(llm_config)
                .bind(knowledge_resource)
                .build()
            )
        
        agents.append(agent)
    
    return agents