"""Handler for multi-resource chat scenarios."""
import json
import logging
from typing import List, Dict, Any, Optional

from dbgpt_serve.agent.db.gpts_app import GptsApp, GptsAppDao, GptsAppDetail
from dbgpt_serve.agent.team.base import TeamMode
from dbgpt.component import SystemApp

logger = logging.getLogger(__name__)


class MultiResourceHandler:
    """Handles dynamic multi-resource agent app creation."""
    
    def __init__(self, system_app: SystemApp):
        self.system_app = system_app
        self.gpts_app_dao = GptsAppDao()
        self._app_cache = {}  # Cache for dynamically created apps
    
    def get_or_create_multi_resource_app(
        self, 
        resources: List[Dict[str, str]],
        user_code: Optional[str] = None
    ) -> GptsApp:
        """Get or create a multi-resource app for the given resources.
        
        Args:
            resources: List of resources with 'name' and 'type' keys
            user_code: User who is creating this app
            
        Returns:
            GptsApp instance
        """
        # Create a deterministic app code based on resources
        resource_key = json.dumps(sorted(resources, key=lambda x: x['name']), sort_keys=True)
        app_code = f"multi_resource_{hash(resource_key)}"
        
        # Check cache first
        if app_code in self._app_cache:
            return self._app_cache[app_code]
        
        # Check if app already exists in database
        existing_app = self.gpts_app_dao.app_detail(app_code)
        if existing_app:
            self._app_cache[app_code] = existing_app
            return existing_app
        
        # Create new app
        app = self._create_multi_resource_app(resources, app_code, user_code)
        
        # Save to database
        try:
            self.gpts_app_dao.create(app)
            self._app_cache[app_code] = app
            logger.info(f"Created multi-resource app: {app_code}")
        except Exception as e:
            logger.error(f"Failed to save multi-resource app: {e}")
            # Return the app anyway for this session
            self._app_cache[app_code] = app
        
        return app
    
    def _create_multi_resource_app(
        self,
        resources: List[Dict[str, str]], 
        app_code: str,
        user_code: Optional[str] = None
    ) -> GptsApp:
        """Create a new multi-resource app configuration.
        
        Args:
            resources: List of resources with 'name' and 'type' keys
            app_code: Unique code for this app
            user_code: User creating the app
            
        Returns:
            GptsApp configuration
        """
        # Create agent details for each resource
        agent_details = []
        
        # Add a coordinator agent if there are multiple resources
        if len(resources) > 1:
            coordinator_detail = GptsAppDetail(
                app_code=app_code,
                agent_name="ConversableAgent",
                node_id="coordinator",
                resources=[],  # Coordinator doesn't need direct resource access
                prompt_template="",
                llm_strategy="default",
                llm_strategy_value=None,
            )
            # Set coordinator profile
            coordinator_detail.agent_profile = {
                "name": "Multi-Resource Coordinator",
                "role": "Coordinator",
                "goal": "Coordinate between different data sources to provide comprehensive answers",
                "constraints": [
                    "Delegate queries to appropriate specialist agents",
                    "Combine results from multiple sources",
                    "Ensure all relevant sources are consulted"
                ],
                "desc": "I coordinate between multiple data sources to answer your questions comprehensively."
            }
            agent_details.append(coordinator_detail)
        
        # Create specialist agents for each resource
        for idx, resource in enumerate(resources):
            resource_name = resource['name']
            resource_type = resource['type']
            
            # Choose appropriate agent type
            if resource_type == 'database':
                agent_name = 'DataScientistAgent'
                role = f"Database Analyst"
                goal = f"Analyze and query data from {resource_name} database"
                constraints = [
                    f"Only query {resource_name} database",
                    "Write accurate SQL queries",
                    "Explain results clearly"
                ]
            else:  # knowledge
                agent_name = 'ToolAssistantAgent'
                role = f"Knowledge Expert"
                goal = f"Search and retrieve information from {resource_name}"
                constraints = [
                    f"Only search {resource_name} knowledge space",
                    "Provide relevant information",
                    "Cite sources when available"
                ]
            
            agent_detail = GptsAppDetail(
                app_code=app_code,
                agent_name=agent_name,
                node_id=f"agent_{idx}",
                resources=[{
                    "type": "database" if resource_type == 'database' else "knowledge",
                    "name": resource_name,
                    "value": resource_name
                }],
                prompt_template="",
                llm_strategy="default",
                llm_strategy_value=None,
            )
            
            # Set agent profile
            agent_detail.agent_profile = {
                "name": f"{resource_type.title()} Expert - {resource_name}",
                "role": role,
                "goal": goal,
                "constraints": constraints,
                "desc": f"I specialize in {resource_type} {resource_name}"
            }
            
            agent_details.append(agent_detail)
        
        # Create the app
        app_name = f"Multi-Resource Assistant ({len(resources)} sources)"
        app_describe = f"Access to: {', '.join([r['name'] for r in resources])}"
        
        app = GptsApp(
            app_code=app_code,
            app_name=app_name,
            app_describe=app_describe,
            team_mode=TeamMode.AUTO_PLAN.value,  # Use auto-planning for coordination
            language="en",
            team_context=None,
            user_code=user_code or "system",
            sys_code="dbgpt",
            published="Y",
            hot_value=0,
            details=agent_details,
            icon=None,
        )
        
        return app


# Singleton instance
_multi_resource_handler = None


def get_multi_resource_handler(system_app: SystemApp) -> MultiResourceHandler:
    """Get or create the multi-resource handler singleton."""
    global _multi_resource_handler
    if _multi_resource_handler is None:
        _multi_resource_handler = MultiResourceHandler(system_app)
    return _multi_resource_handler