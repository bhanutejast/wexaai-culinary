from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# --- Node Models ---

class User(BaseModel):
    id: str
    name: str
    food_preference: str = Field(..., description="Veg, Non-Veg, or Any")
    spice_preference: str = Field(..., description="Low, Medium, High, or Any")

class UserCreate(BaseModel):
    name: str
    food_preference: str = Field("Any", description="Veg, Non-Veg, or Any")
    spice_preference: str = Field("Any", description="Low, Medium, High, or Any")

class Food(BaseModel):
    id: str
    name: str
    category: str = Field(..., description="Main Course, Snack, Pickle, Sweet, etc.")
    vegetarian: bool
    spice_level: str = Field(..., description="Low, Medium, High")
    description: str

class Ingredient(BaseModel):
    id: str
    name: str
    category: str

class Region(BaseModel):
    id: str
    name: str
    state: str = Field("Andhra Pradesh", alias="district_or_state")

    class Config:
        populate_by_name = True

class TasteProfile(BaseModel):
    id: str
    taste: str

class Festival(BaseModel):
    id: str
    name: str

class Restaurant(BaseModel):
    id: str
    name: str
    location: str

class Nutrition(BaseModel):
    calories: int
    protein: str
    health_type: str = Field(..., description="Healthy, Indulgent, Moderate")

# --- Relation / Response Models ---

class FoodDetail(BaseModel):
    food: Food
    region: Optional[Region] = None
    ingredients: List[Ingredient] = []
    taste: Optional[TasteProfile] = None
    festivals: List[Festival] = []
    restaurants: List[Restaurant] = []
    nutrition: Optional[Nutrition] = None

class RecommendationReason(BaseModel):
    type: str  # "taste" or "region" or "ingredient"
    description: str

class Recommendation(BaseModel):
    food: Food
    score: float
    reasons: List[RecommendationReason]

class SimilarityResult(BaseModel):
    food: Food
    shared_ingredients_count: int
    shared_ingredients: List[str]

# --- Graph Visualization Schema ---

class GraphNode(BaseModel):
    id: str
    label: str  # Label/Type of node: Food, Ingredient, Region, etc.
    title: str  # Display name
    properties: Dict[str, Any] = {}

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str  # Relationship type: CONTAINS, LIKES, etc.
    properties: Dict[str, Any] = {}

class GraphData(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

class SeedResponse(BaseModel):
    status: str
    message: str
    nodes_created: int
    relationships_created: int
