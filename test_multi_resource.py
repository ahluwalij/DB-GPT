#!/usr/bin/env python3
"""Test script to verify how DB-GPT agents handle multiple resources."""

from dbgpt.agent.resource import ResourcePack, RDBMSConnectorResource
from dbgpt.agent.resource.knowledge import KnowledgeSpaceRetrieverResource
from dbgpt_ext.datasource.rdbms.conn_sqlite import SQLiteTempConnector

# Example of creating multiple resources
def create_multi_resource_example():
    # Create a database resource
    db_connector = SQLiteTempConnector.create_temporary_db()
    db_resource = RDBMSConnectorResource("test_db", connector=db_connector)
    
    # Create a knowledge resource (placeholder - would need actual retriever)
    # knowledge_resource = KnowledgeSpaceRetrieverResource(
    #     name="test_knowledge",
    #     space_name="example_space"
    # )
    
    # Create a ResourcePack with multiple resources
    multi_resource = ResourcePack(
        resources=[db_resource],  # Add more resources here
        name="Multi-Resource Pack"
    )
    
    return multi_resource

if __name__ == "__main__":
    multi_resource = create_multi_resource_example()
    print(f"Created ResourcePack with {len(multi_resource.sub_resources)} resources")
    print(f"Resource names: {[r.name for r in multi_resource.sub_resources]}")