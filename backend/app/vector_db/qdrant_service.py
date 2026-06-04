import hashlib
import random
from typing import List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
import google.generativeai as genai
from app.config import settings

# Initialize Qdrant client using a distinct variable name to prevent module shadowing
client_instance = QdrantClient(url=settings.QDRANT_URL)
COLLECTION_NAME = "policy_clauses"

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

def get_embedding(text: str) -> List[float]:
    if not settings.GEMINI_API_KEY:
        h = hashlib.sha256(text.encode('utf-8')).hexdigest()
        random.seed(int(h, 16))
        return [random.uniform(-0.5, 0.5) for _ in range(768)]
    
    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        print(f"Error computing Gemini embedding: {e}. Falling back to mock embedder.")
        h = hashlib.sha256(text.encode('utf-8')).hexdigest()
        random.seed(int(h, 16))
        return [random.uniform(-0.5, 0.5) for _ in range(768)]

def init_qdrant_collection():
    try:
        collections = client_instance.get_collections().collections
        exists = any(c.name == COLLECTION_NAME for c in collections)
        
        if not exists:
            print(f"Creating Qdrant collection: {COLLECTION_NAME}")
            client_instance.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE)
            )
            print("Collection created successfully.")
        else:
            print(f"Qdrant collection '{COLLECTION_NAME}' already exists.")
    except Exception as e:
        print(f"Error communicating with Qdrant: {e}. Vector operations might fail.")

def upsert_policy_clauses(policy_id: str, clauses: List[str]):
    points = []
    for idx, clause in enumerate(clauses):
        vector = get_embedding(clause)
        point_uuid = hashlib.md5(f"{policy_id}_{idx}".encode('utf-8')).hexdigest()
        points.append(PointStruct(
            id=point_uuid,
            vector=vector,
            payload={
                "policy_id": policy_id,
                "clause_text": clause,
                "clause_index": idx
            }
        ))
    
    client_instance.upsert(
        collection_name=COLLECTION_NAME,
        points=points
    )
    print(f"Upserted {len(clauses)} clauses for Policy ID: {policy_id}")

def search_policy_clauses(policy_id: str, query: str, limit: int = 3) -> List[str]:
    query_vector = get_embedding(query)
    
    search_result = client_instance.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_vector,
        query_filter=Filter(
            must=[
                FieldCondition(
                    key="policy_id",
                    match=MatchValue(value=policy_id)
                )
            ]
        ),
        limit=limit
    )
    
    return [result.payload["clause_text"] for result in search_result]
