from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Dict, Any, List
from services import get_db_service
from models import Recommendation

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

@router.get("", response_model=Dict[str, List[Recommendation]])
def get_recommendations(
    username: str = Query(..., description="The name of the user to get recommendations for"),
    limit: int = Query(5, description="Maximum number of recommendations per category"),
    service=Depends(get_db_service)
):
    if not username.strip():
        raise HTTPException(status_code=400, detail="Username cannot be empty")
        
    try:
        # Recommedations based on liked foods -> tastes -> other foods
        by_taste = service.recommend_by_taste(username, limit=limit)
        
        # Recommendations based on liked foods -> region -> other foods
        by_region = service.recommend_by_region(username, limit=limit)
        
        return {
            "by_taste": by_taste,
            "by_region": by_region
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation system error: {str(e)}")
