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
        logger.info(f"DEBUG - get_or_create_multi_resource_app called with resources: {resources}")
        # Create a deterministic app code based on resources
        resource_key = json.dumps(sorted(resources, key=lambda x: x['name']), sort_keys=True)
        app_code = f"multi_resource_{hash(resource_key)}"
        
        # Check cache first
        if app_code in self._app_cache:
            return self._app_cache[app_code]
        
        # Check if app already exists in database
        existing_app = self.gpts_app_dao.app_detail(app_code)
        if existing_app:
            logger.info(f"DEBUG - Found existing app with team_mode: {existing_app.team_mode}")
            # For multi-resource apps, always recreate to ensure correct configuration
            if existing_app.team_mode != TeamMode.AUTO_PLAN.value:
                logger.warning(f"Existing app has incorrect team_mode: {existing_app.team_mode}, deleting and recreating")
                try:
                    # Delete the incorrect app
                    self.gpts_app_dao.delete(app_code)
                    logger.info(f"Deleted app with incorrect team_mode")
                    # Clear from cache
                    if app_code in self._app_cache:
                        del self._app_cache[app_code]
                except Exception as e:
                    logger.error(f"Failed to delete app: {e}")
                    # Even if delete fails, recreate the app
            else:
                # App has correct team mode, use it
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
                agent_name="Summarizer",  # Use Summarizer role (SummaryAssistantAgent's role name)
                node_id="coordinator",
                resources=[],  # Coordinator doesn't need direct resource access
                prompt_template="",
                llm_strategy="default",
                llm_strategy_value=None,
            )
            # Note: agent_profile field doesn't exist in GptsAppDetail model
            # The profile will be configured differently through the agent itself
            agent_details.append(coordinator_detail)
        
        # Create specialist agents for each resource
        for idx, resource in enumerate(resources):
            resource_name = resource['name']
            resource_type = resource['type']
            
            # Choose appropriate agent type
            if resource_type == 'database':
                # For database resources, use DataScientist
                agent_name = 'DataScientist'  # Use the role name, not class name
                role = f"Database Analyst"
                goal = f"Analyze and query data from {resource_name} database using SQL"
                constraints = [
                    f"Only query {resource_name} database",
                    "Write accurate SQL queries",
                    "Explain results clearly",
                    f"This agent ONLY has access to {resource_name} database, not to any knowledge spaces"
                ]
            else:  # knowledge
                # For knowledge resources, use AI Assistant to avoid conflicts
                if len(resources) > 1:
                    # Use AI Assistant for knowledge when we have a coordinator
                    agent_name = 'AI Assistant'  # SimpleAssistantAgent's role name
                else:
                    # Use Summarizer when it's the only resource
                    agent_name = 'Summarizer'
                role = f"Knowledge Expert"
                goal = f"Search and retrieve information from {resource_name} knowledge space"
                constraints = [
                    f"Only search {resource_name} knowledge space",
                    "Provide relevant information from the knowledge base",
                    "Cite sources when available",
                    f"This agent ONLY has access to {resource_name} knowledge space, not to any databases"
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
            
            # Note: agent_profile field doesn't exist in GptsAppDetail model
            # The agent's behavior is configured through the agent_name and resources
            
            agent_details.append(agent_detail)
        
        # Create the app
        app_name = f"Multi-Resource Assistant ({len(resources)} sources)"
        app_describe = f"Access to: {', '.join([r['name'] for r in resources])}"
        
        logger.info(f"DEBUG - Creating app with team_mode: {TeamMode.AUTO_PLAN.value}")
        logger.info(f"DEBUG - Agent details count: {len(agent_details)}")
        
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
        
        logger.info(f"DEBUG - Created app object with team_mode: {app.team_mode}")
        
        return app


# Singleton instance
_multi_resource_handler = None


def get_multi_resource_handler(system_app: SystemApp) -> MultiResourceHandler:
    """Get or create the multi-resource handler singleton."""
    global _multi_resource_handler
    if _multi_resource_handler is None:
        _multi_resource_handler = MultiResourceHandler(system_app)
    return _multi_resource_handler