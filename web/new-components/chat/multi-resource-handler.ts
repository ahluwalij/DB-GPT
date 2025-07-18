import { ChatContentContext } from '@/pages/chat';
import { apiInterceptors, newDialogue } from '@/client/api';

export interface ResourceSelection {
  name: string;
  type: 'database' | 'knowledge';
}

export class MultiResourceHandler {
  /**
   * Creates a multi-agent app dynamically based on selected resources
   * Each resource gets its own agent, and they work together
   */
  static async createMultiResourceApp(
    resources: ResourceSelection[],
    modelName: string
  ): Promise<string> {
    // Create a unique app code for this multi-resource combination
    const appCode = `multi_resource_${Date.now()}`;
    
    // Prepare agent configurations for each resource
    const agents = resources.map((resource, index) => ({
      agent_name: resource.type === 'database' ? 'DataScientistAgent' : 'ToolAssistantAgent',
      resource_name: resource.name,
      resource_type: resource.type,
      role: `${resource.type}_specialist_${index}`,
      goal: resource.type === 'database' 
        ? `Analyze and query data from ${resource.name} database`
        : `Search and retrieve information from ${resource.name} knowledge space`,
      constraints: [
        `Only use data from ${resource.name}`,
        `Collaborate with other agents when needed`
      ],
      description: `Agent specialized in ${resource.type} ${resource.name}`
    }));

    // Create a coordinator agent if there are multiple resources
    if (resources.length > 1) {
      agents.unshift({
        agent_name: 'ConversableAgent',
        resource_name: null,
        resource_type: null,
        role: 'coordinator',
        goal: 'Coordinate between different data sources and synthesize results',
        constraints: [
          'Delegate tasks to appropriate specialist agents',
          'Combine results from multiple sources',
          'Provide unified responses'
        ],
        description: 'Coordinator agent for multi-resource queries'
      });
    }

    return appCode;
  }

  /**
   * Determines the appropriate chat mode based on selected resources
   */
  static determineChatMode(resources: ResourceSelection[]): string {
    if (resources.length === 0) {
      return 'chat_normal';
    }
    
    if (resources.length === 1) {
      // Single resource - use traditional chat modes
      return resources[0].type === 'database' 
        ? 'chat_with_db_execute' 
        : 'chat_knowledge';
    }
    
    // Multiple resources - use agent chat mode
    return 'chat_agent';
  }

  /**
   * Prepares the select_param based on resource selection
   */
  static prepareSelectParam(resources: ResourceSelection[]): any {
    if (resources.length === 0) {
      return null;
    }
    
    if (resources.length === 1) {
      // Single resource - return the resource name
      return resources[0].name;
    }
    
    // Multiple resources - create multi-agent app configuration
    return {
      app_type: 'multi_resource',
      resources: resources,
      team_mode: 'auto_plan' // Use AutoPlanChatManager
    };
  }

  /**
   * Creates appropriate conversation based on resource selection
   */
  static async createConversation(
    resources: ResourceSelection[],
    modelName: string
  ): Promise<{ conv_uid: string; chat_mode: string; app_code?: string }> {
    const chatMode = this.determineChatMode(resources);
    
    if (chatMode === 'chat_agent' && resources.length > 1) {
      // For multi-resource, create a multi-agent app
      const appCode = await this.createMultiResourceApp(resources, modelName);
      
      const [, res] = await apiInterceptors(
        newDialogue({ 
          chat_mode: chatMode, 
          model: modelName,
          app_code: appCode 
        })
      );
      
      return {
        conv_uid: res.conv_uid,
        chat_mode: chatMode,
        app_code: appCode
      };
    } else {
      // Single resource or no resource
      const [, res] = await apiInterceptors(
        newDialogue({ 
          chat_mode: chatMode, 
          model: modelName 
        })
      );
      
      return {
        conv_uid: res.conv_uid,
        chat_mode: chatMode
      };
    }
  }
}