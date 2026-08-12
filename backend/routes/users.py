from fastapi import APIRouter, Query, HTTPException, Depends
from typing import List, Dict, Any
from services import get_db_service
from models import User, UserCreate

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[Dict[str, Any]])
def get_users(service=Depends(get_db_service)):
    try:
        return service.get_users()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=User)
def create_or_update_user(user_in: UserCreate, service=Depends(get_db_service)):
    try:
        if not user_in.name.strip():
            raise HTTPException(status_code=400, detail="Username cannot be empty")
        return service.create_user(
            name=user_in.name.strip(),
            food_pref=user_in.food_preference,
            spice_pref=user_in.spice_preference
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{username}/likes", response_model=List[Dict[str, str]])
def get_user_likes(username: str, service=Depends(get_db_service)):
    try:
        return service.get_user_likes(username)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{username}/likes/{food_id}")
def add_user_like(username: str, food_id: str, service=Depends(get_db_service)):
    try:
        created = service.add_user_like(username, food_id)
        if not created:
            return {"status": "ignored", "message": "Already liked or user/food not found"}
        return {"status": "success", "message": "Successfully liked food"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{username}/likes/{food_id}")
def remove_user_like(username: str, food_id: str, service=Depends(get_db_service)):
    try:
        deleted = service.remove_user_like(username, food_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Like relationship not found")
        return {"status": "success", "message": "Successfully removed liked food"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
