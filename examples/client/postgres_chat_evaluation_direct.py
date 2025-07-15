#!/usr/bin/env python3
"""
Direct Postgres Chat Evaluation (Out of the Box)

This uses the evaluation API correctly by passing datasets directly 
in the request, bypassing the broken dataset upload functionality.
This is the true "out of the box" approach.
"""

import asyncio
import json
import sys

import httpx

# Configuration
DBGPT_API_KEY = "dbgpt"
BASE_URL = "http://localhost:5670"

async def run_postgres_chat_evaluation_direct():
    """Run evaluation directly with inline datasets (the correct way)."""
    print("🎯 Running Postgres Chat Evaluation (Direct/Out of the Box)")
    print("=" * 60)
    
    # This is the CORRECT way - datasets directly in the evaluation request
    evaluation_request = {
        "scene_key": "app",
        "scene_value": "chat_with_db_execute",  # Your Chat Data app
        "context": {
            "top_k": 5,
            "model": "zhipu_proxyllm",
            "prompt": "40207dcb3dfb4b9eb55d795620267b49"
        },
        "evaluate_metrics": ["AnswerRelevancyMetric"],
        "parallel_num": 1,
        "datasets": [  # Datasets are passed DIRECTLY here - no upload needed!
            {
                "query": "What tables are available in the database?",
                "doc_name": "database_schema"
            },
            {
                "query": "Show me the structure of the main tables",
                "doc_name": "table_structure"  
            },
            {
                "query": "What is the total number of records in the database?",
                "doc_name": "record_count"
            },
            {
                "query": "List the columns in the user table",
                "doc_name": "user_table_info"
            },
            {
                "query": "What are the recent entries in the database?",
                "doc_name": "recent_data"
            },
            {
                "query": "Show me data from the last week", 
                "doc_name": "weekly_data"
            },
            {
                "query": "What are the primary keys in each table?",
                "doc_name": "primary_keys"
            }
        ]
    }
    
    print("📊 Evaluation Request:")
    print(json.dumps(evaluation_request, indent=2))
    print("\n🔄 Sending to evaluation API...")
    
    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(
            f"{BASE_URL}/api/v1/evaluate/evaluation",
            headers={
                "Authorization": f"Bearer {DBGPT_API_KEY}",
                "Content-Type": "application/json"
            },
            json=evaluation_request
        )
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("✅ Postgres Chat Evaluation completed successfully!")
                print("\n📈 EVALUATION RESULTS:")
                print("=" * 40)
                
                evaluation_data = result.get("data", [])
                for i, query_results in enumerate(evaluation_data):
                    query_info = evaluation_request["datasets"][i]
                    print(f"\n🔍 Query {i+1}: {query_info['query']}")
                    print(f"📄 Doc: {query_info['doc_name']}")
                    
                    if query_results:
                        for metric_result in query_results:
                            score = metric_result.get("score", "N/A")
                            metric = metric_result.get("metric_name", "Unknown")
                            passing = metric_result.get("passing", False)
                            status = "✅ PASS" if passing else "❌ FAIL"
                            print(f"   📊 {metric}: {score} {status}")
                    else:
                        print("   ❌ No results")
                
                print(f"\n🎉 Evaluation completed! This is the TRUE out-of-the-box approach.")
                print(f"💡 No dataset upload needed - datasets are passed directly!")
                return result
            else:
                print(f"❌ Evaluation failed: {result.get('err_msg')}")
                print(f"📄 Full response: {json.dumps(result, indent=2)}")
                return None
        else:
            print(f"❌ HTTP Error {response.status_code}")
            print(f"📄 Response: {response.text}")
            return None

async def main():
    """Main function."""
    print("🚀 This is how evaluation SHOULD work out of the box!")
    print("🔧 Bypassing the broken dataset upload UI")
    print("📋 Using the correct API approach\n")
    
    await run_postgres_chat_evaluation_direct()
    
    print(f"\n💡 Key Insight:")
    print(f"   • Dataset upload UI is broken/unimplemented")
    print(f"   • But evaluation works by passing datasets directly")
    print(f"   • This IS the out-of-the-box approach!")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Evaluation interrupted")
    except Exception as e:
        print(f"❌ Evaluation failed: {e}")
        sys.exit(1) 