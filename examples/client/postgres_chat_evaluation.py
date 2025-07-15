#!/usr/bin/env python3
"""
Postgres Chat Data Evaluation Script

This script evaluates the Chat Data application that connects to your Postgres database.
It uses the "app" scene to test how well your chat system answers questions about your data.
"""

import asyncio
import json
import sys

import httpx

# Configuration
DBGPT_API_KEY = "dbgpt"
BASE_URL = "http://localhost:5670"
FRONTEND_URL = "http://localhost:3000"

# App configuration for Chat Data (uses your Postgres connector)
CHAT_DATA_APP_CODE = "chat_with_db_execute"

async def run_chat_data_evaluation():
    """Run evaluation on the Chat Data app using Postgres database."""
    print(f"🔍 Running Chat Data evaluation on Postgres-connected app")
    
    # Evaluation request for the Chat Data app
    evaluation_request = {
        "scene_key": "app",
        "scene_value": CHAT_DATA_APP_CODE,
        "context": {
            "top_k": 5,
            "model": "zhipu_proxyllm"
        },
        "evaluate_metrics": [
            "AnswerRelevancyMetric"  # Evaluates answer quality
        ],
        "datasets": [
            {
                "query": "What tables are in the database?",
                "doc_name": "database_schema"
            },
            {
                "query": "Show me the user data",
                "doc_name": "user_table"
            },
            {
                "query": "What is the total count of records?",
                "doc_name": "record_count"
            },
            {
                "query": "Describe the structure of the main tables",
                "doc_name": "table_structure"
            },
            {
                "query": "What are the recent entries in the database?",
                "doc_name": "recent_data"
            }
        ]
    }
    
    print(f"📊 Evaluation Request:")
    print(json.dumps(evaluation_request, indent=2))
    
    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(
            f"{BASE_URL}/api/v2/serve/evaluate/evaluation",
            headers={
                "Authorization": f"Bearer {DBGPT_API_KEY}",
                "Content-Type": "application/json"
            },
            json=evaluation_request
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("✅ Chat Data Evaluation completed successfully!")
                print(f"📈 Results:")
                print(json.dumps(result.get("data"), indent=2))
                return result
            else:
                print(f"❌ Evaluation failed: {result.get('err_msg')}")
                return None
        else:
            print(f"❌ HTTP Error {response.status_code}: {response.text}")
            return None

async def run_database_qa_evaluation():
    """Run evaluation on the Chat DB app for database metadata questions."""
    print(f"🔍 Running Database Q&A evaluation")
    
    evaluation_request = {
        "scene_key": "app", 
        "scene_value": "chat_with_db_qa",
        "context": {
            "top_k": 5,
            "model": "zhipu_proxyllm"
        },
        "evaluate_metrics": [
            "AnswerRelevancyMetric"
        ],
        "datasets": [
            {
                "query": "What columns does the user table have?",
                "doc_name": "db_metadata"
            },
            {
                "query": "Explain the relationships between tables",
                "doc_name": "table_relationships"
            },
            {
                "query": "What are the primary keys in the database?",
                "doc_name": "primary_keys"
            }
        ]
    }
    
    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(
            f"{BASE_URL}/api/v2/serve/evaluate/evaluation",
            headers={
                "Authorization": f"Bearer {DBGPT_API_KEY}",
                "Content-Type": "application/json"
            },
            json=evaluation_request
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("✅ Database Q&A Evaluation completed successfully!")
                print(f"📈 Results:")
                print(json.dumps(result.get("data"), indent=2))
                return result
            else:
                print(f"❌ Evaluation failed: {result.get('err_msg')}")
                return None
        else:
            print(f"❌ HTTP Error {response.status_code}: {response.text}")
            return None

async def main():
    """Main function to run Postgres chat evaluations."""
    print("🎯 DB-GPT Postgres Chat Data Evaluation")
    print("=" * 50)
    
    print("🗃️  This evaluates your Chat Data app that connects to Postgres")
    print("📋 Testing how well it answers questions about your database\n")
    
    # Run Chat Data evaluation (your main use case)
    chat_result = await run_chat_data_evaluation()
    
    print("\n" + "="*50)
    
    # Also run Database Q&A evaluation for comparison
    qa_result = await run_database_qa_evaluation()
    
    print("\n🎉 Evaluations completed!")
    print(f"   • View detailed results in the UI: {FRONTEND_URL}/evaluation")
    print(f"   • Test your chat app directly: {FRONTEND_URL}/chat")
    print(f"   • Manage database connections: {FRONTEND_URL}/construct/database")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Evaluation interrupted by user")
    except Exception as e:
        print(f"❌ Evaluation failed: {e}")
        sys.exit(1) 