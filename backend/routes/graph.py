from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional
from services import get_db_service
from models import GraphData

router = APIRouter(prefix="/graph", tags=["Graph Visualization"])

@router.get("", response_model=GraphData)
def get_graph(
    limit: int = Query(50, description="Max number of food nodes to fetch"),
    service=Depends(get_db_service)
):
    try:
        return service.get_subgraph(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{username}", response_model=GraphData)
def get_user_subgraph(
    username: str,
    service=Depends(get_db_service)
):
    try:
        subgraph = service.get_user_subgraph(username)
        if not subgraph:
            raise HTTPException(status_code=404, detail=f"User '{username}' or their liked foods not found.")
        return subgraph
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
