from fastapi import APIRouter, Query, HTTPException, Depends
from typing import List, Optional, Dict, Any
from services import get_db_service
from models import Food, Region, FoodDetail, SimilarityResult

router = APIRouter(prefix="/foods", tags=["Foods"])

@router.get("", response_model=List[Dict[str, Any]])
def get_foods(
    category: Optional[str] = Query(None, description="Filter by category (e.g. Pickle, Sweet)"),
    vegetarian: Optional[bool] = Query(None, description="Filter by vegetarian/non-vegetarian"),
    spice_level: Optional[str] = Query(None, description="Filter by spice level (Low, Medium, High)"),
    region: Optional[str] = Query(None, description="Filter by origin region name"),
    service=Depends(get_db_service)
):
    try:
        return service.get_foods(
            category=category,
            vegetarian=vegetarian,
            spice_level=spice_level,
            region=region
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")

@router.get("/discovery/regional", response_model=List[Dict[str, Any]])
def get_regional_discovery(
    region: Optional[str] = Query(None, description="Filter by origin region"),
    festival: Optional[str] = Query(None, description="Filter by festival served during"),
    service=Depends(get_db_service)
):
    try:
        return service.get_regional_festival_foods(
            region_name=region,
            festival_name=festival
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Discovery query failed: {str(e)}")

@router.get("/{food_id}", response_model=Dict[str, Any])
def get_food_details(
    food_id: str,
    service=Depends(get_db_service)
):
    try:
        details = service.get_food_details(food_id)
        if not details:
            raise HTTPException(status_code=404, detail=f"Food item '{food_id}' not found.")
            
        similar = service.get_food_similarity(food_id, limit=5)
        
        return {
            "details": details,
            "similar_foods": similar
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Details query failed: {str(e)}")
