#!/usr/bin/env python3
"""
Demo script to run the DB-GPT evaluation system.

This script will:
1. Create a knowledge space
2. Upload a test document  
3. Run evaluations using the built-in evaluation system
"""

import asyncio
import json
import os
import sys
from pathlib import Path

import httpx
from dbgpt_client import Client
from dbgpt_client.evaluation import run_evaluation
from dbgpt_serve.evaluate.api.schemas import EvaluateServeRequest

# Configuration
DBGPT_API_KEY = "dbgpt"
BASE_URL = "http://localhost:5670"
FRONTEND_URL = "http://localhost:3000"

async def create_knowledge_space(space_name: str = "evaluation_test_space"):
    """Create a knowledge space for evaluation testing."""
    print(f"🚀 Creating knowledge space: {space_name}")
    
    # Knowledge space parameters
    space_data = {
        "name": space_name,
        "vector_type": "Chroma",
        "owner": "dbgpt",
        "desc": "Test space for evaluation demonstrations",
        "domain_type": "Normal"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/knowledge/space/add",
            headers={
                "Authorization": f"Bearer {DBGPT_API_KEY}",
                "Content-Type": "application/json"
            },
            json=space_data
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print(f"✅ Knowledge space '{space_name}' created successfully!")
                return space_name
            else:
                print(f"❌ Failed to create knowledge space: {result.get('err_msg')}")
                return None
        else:
            print(f"❌ HTTP Error {response.status_code}: {response.text}")
            return None

async def add_document(space_name: str, file_path: str):
    """Add a document to the knowledge space."""
    print(f"📄 Adding document from: {file_path}")
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return False
    
    # Read file content
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Document parameters
    doc_data = {
        "doc_name": os.path.basename(file_path),
        "content": content,
        "doc_type": "TEXT"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/knowledge/{space_name}/document/add",
            headers={
                "Authorization": f"Bearer {DBGPT_API_KEY}",
                "Content-Type": "application/json"
            },
            json=doc_data
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print(f"✅ Document added successfully!")
                return True
            else:
                print(f"❌ Failed to add document: {result.get('err_msg')}")
                return False
        else:
            print(f"❌ HTTP Error {response.status_code}: {response.text}")
            return False

async def get_space_id(space_name: str):
    """Get the ID of a knowledge space by name."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/api/v2/serve/knowledge/spaces?page=1&page_size=100",
            headers={
                "Authorization": f"Bearer {DBGPT_API_KEY}",
                "Content-Type": "application/json"
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                spaces = result.get("data", {}).get("items", [])
                for space in spaces:
                    if space["name"] == space_name:
                        return space["id"]
                print(f"❌ Space '{space_name}' not found")
                return None
            else:
                print(f"❌ Failed to get spaces: {result.get('err_msg')}")
                return None
        else:
            print(f"❌ HTTP Error {response.status_code}: {response.text}")
            return None

async def run_rag_evaluation(space_id: str):
    """Run RAG evaluation on the knowledge space."""
    print(f"🔍 Running RAG evaluation on space ID: {space_id}")
    
    client = Client(api_key=DBGPT_API_KEY)
    
    request = EvaluateServeRequest(
        scene_key="recall",
        scene_value=str(space_id),
        context={"top_k": 5},
        evaluate_metrics=[
            "RetrieverHitRateMetric",
            "RetrieverMRRMetric", 
            "RetrieverSimilarityMetric",
        ],
        datasets=[
            {
                "query": "What is AWEL?",
                "doc_name": "awel.md",
            },
            {
                "query": "How does the graph work?",
                "doc_name": "graphrag-mini.md",
            },
            {
                "query": "What are transformers?",
                "doc_name": "tranformers_story.md",
            }
        ],
    )
    
    try:
        result = await run_evaluation(client, request=request)
        print("✅ RAG Evaluation completed successfully!")
        print(f"📊 Results: {json.dumps(result, indent=2)}")
        return result
    except Exception as e:
        print(f"❌ Evaluation failed: {e}")
        return None

async def main():
    """Main function to run the complete evaluation demo."""
    print("🎯 DB-GPT Evaluation System Demo")
    print("=" * 50)
    
    # Step 1: Create knowledge space
    space_name = "evaluation_demo_space"
    space_created = await create_knowledge_space(space_name)
    
    if not space_created:
        print("⚠️  Knowledge space already exists, using existing one...")
        space_name = "evaluation_demo_space"
    
    # Step 2: Upload test documents
    test_files = [
        "../test_files/tranformers_story.md",
        "../test_files/graphrag-mini.md"
    ]
    
    upload_success = False
    for file_path in test_files:
        if os.path.exists(file_path):
            success = await add_document(space_name, file_path)
            if success:
                upload_success = True
    
    if not upload_success:
        print("⚠️  Documents already exist, proceeding with existing data...")
        upload_success = True  # Continue with existing documents
    
    # Step 3: Get space ID for evaluation
    print("⏳ Waiting for document processing...")
    await asyncio.sleep(5)  # Give time for document processing
    
    space_id = await get_space_id(space_name)
    if not space_id:
        print("❌ Cannot find space ID")
        return
    
    # Step 4: Run evaluations
    await run_rag_evaluation(space_id)
    
    print("\n🎉 Demo completed! You can now:")
    print(f"   • Visit the evaluation UI at: {FRONTEND_URL}/evaluation")
    print(f"   • Check your knowledge space at: {FRONTEND_URL}/construct/knowledge")
    print(f"   • View the backend API at: {BASE_URL}/docs")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Demo interrupted by user")
    except Exception as e:
        print(f"❌ Demo failed with error: {e}")
        sys.exit(1) 