import uuid
from typing import List, Optional, Dict, Any
from models import (
    User, Food, Ingredient, Region, TasteProfile, Festival, Restaurant, Nutrition,
    FoodDetail, Recommendation, RecommendationReason, SimilarityResult, GraphNode, GraphEdge, GraphData
)

# --- Raw Seed Data ---

SEED_DATA = {
    "users": [
        {"id": "u1", "name": "Srinivas", "food_preference": "Veg", "spice_preference": "High", "likes": ["gongura_pachadi", "gutti_vankaya"]},
        {"id": "u2", "name": "Ananya", "food_preference": "Veg", "spice_preference": "Low", "likes": ["bobbatlu", "pootharekulu"]},
        {"id": "u3", "name": "Karthik", "food_preference": "Non-Veg", "spice_preference": "High", "likes": ["biryani", "kodi_vepudu", "avakaya"]},
        {"id": "u4", "name": "Haritha", "food_preference": "Any", "spice_preference": "Medium", "likes": ["pesarattu", "pulihora"]}
    ],
    "foods": [
        {"id": "gongura_pachadi", "name": "Gongura Pachadi", "category": "Pickle", "vegetarian": True, "spice_level": "High", "description": "A famous spicy and tangy Andhra chutney made of Gongura (Sorrel leaves) and green chillies."},
        {"id": "pulihora", "name": "Pulihora", "category": "Rice Dish", "vegetarian": True, "spice_level": "Medium", "description": "Traditional tamarind rice, sour and spicy, commonly prepared during festivals like Ugadi and Sankranti."},
        {"id": "pesarattu", "name": "Pesarattu", "category": "Breakfast", "vegetarian": True, "spice_level": "Medium", "description": "A healthy crepe made of green gram (moong dal), ginger, and green chillies, served with ginger pickle."},
        {"id": "bobbatlu", "name": "Bobbatlu", "category": "Sweet", "vegetarian": True, "spice_level": "Low", "description": "Also known as Puran Poli, a sweet flatbread stuffed with sweet lentil and jaggery filling."},
        {"id": "avakaya", "name": "Avakaya", "category": "Pickle", "vegetarian": True, "spice_level": "High", "description": "The iconic, fiery Andhra raw mango pickle made with mustard powder and oil, seasoned to perfection."},
        {"id": "gutti_vankaya", "name": "Gutti Vankaya", "category": "Main Course", "vegetarian": True, "spice_level": "High", "description": "Stuffed brinjal curry in a rich peanut and sesame gravy, a signature dish of Andhra feasts."},
        {"id": "pootharekulu", "name": "Pootharekulu", "category": "Sweet", "vegetarian": True, "spice_level": "Low", "description": "A paper-thin sweet wrapper made from rice starch, stuffed with sugar/jaggery and dry fruits, cooked with ghee."},
        {"id": "biryani", "name": "Andhra Special Biryani", "category": "Main Course", "vegetarian": False, "spice_level": "High", "description": "Fiery long grain basmati rice cooked with marinated chicken, local Andhra spices, and herbs."},
        {"id": "kodi_vepudu", "name": "Kodi Vepudu", "category": "Starter", "vegetarian": False, "spice_level": "High", "description": "Spicy pan-fried chicken dish seasoned with caramelized onions, curry leaves, and a special spice mix."}
    ],
    "ingredients": [
        {"id": "rice", "name": "Rice", "category": "Grain"},
        {"id": "gongura", "name": "Gongura", "category": "Leafy Vegetable"},
        {"id": "tamarind", "name": "Tamarind", "category": "Fruit"},
        {"id": "mango", "name": "Mango", "category": "Fruit"},
        {"id": "green_chilli", "name": "Green Chilli", "category": "Spice"},
        {"id": "dal", "name": "Dal (Lentils)", "category": "Legume"},
        {"id": "brinjal", "name": "Brinjal", "category": "Vegetable"},
        {"id": "jaggery", "name": "Jaggery", "category": "Sweetener"},
        {"id": "chicken", "name": "Chicken", "category": "Meat"},
        {"id": "spices", "name": "Andhra Spices", "category": "Spice"}
    ],
    "regions": [
        {"id": "coastal_andhra", "name": "Coastal Andhra", "state": "Andhra Pradesh"},
        {"id": "rayalaseema", "name": "Rayalaseema", "state": "Andhra Pradesh"},
        {"id": "telangana", "name": "Telangana", "state": "Telangana"}
    ],
    "tastes": [
        {"id": "sour", "taste": "Sour"},
        {"id": "spicy", "taste": "Spicy"},
        {"id": "sweet", "taste": "Sweet"},
        {"id": "tangy", "taste": "Tangy"},
        {"id": "savory", "taste": "Savory"}
    ],
    "festivals": [
        {"id": "ugadi", "name": "Ugadi"},
        {"id": "sankranti", "name": "Sankranti"},
        {"id": "weddings", "name": "Weddings"}
    ],
    "restaurants": [
        {"id": "subbayya_gari_hotel", "name": "Subbayya Gari Hotel", "location": "Kakinada & Hyderabad"},
        {"id": "rayalaseema_ruchulu", "name": "Rayalaseema Ruchulu", "location": "Hyderabad"},
        {"id": "kakatiya_mess", "name": "Kakatiya Mess", "location": "Hyderabad"},
        {"id": "spicy_venue", "name": "The Spicy Venue", "location": "Hyderabad"}
    ],
    "nutrition": {
        "gongura_pachadi": {"calories": 120, "protein": "2g", "health_type": "Healthy"},
        "pulihora": {"calories": 320, "protein": "5g", "health_type": "Moderate"},
        "pesarattu": {"calories": 210, "protein": "9g", "health_type": "Healthy"},
        "bobbatlu": {"calories": 280, "protein": "4g", "health_type": "Indulgent"},
        "avakaya": {"calories": 150, "protein": "1g", "health_type": "Moderate"},
        "gutti_vankaya": {"calories": 290, "protein": "6g", "health_type": "Moderate"},
        "pootharekulu": {"calories": 180, "protein": "2g", "health_type": "Indulgent"},
        "biryani": {"calories": 650, "protein": "32g", "health_type": "Indulgent"},
        "kodi_vepudu": {"calories": 380, "protein": "28g", "health_type": "Moderate"}
    },
    "relations": {
        # Food -> Ingredient
        "food_ingredients": {
            "gongura_pachadi": ["gongura", "green_chilli", "spices"],
            "pulihora": ["rice", "tamarind", "green_chilli", "spices"],
            "pesarattu": ["dal", "green_chilli"],
            "bobbatlu": ["dal", "jaggery"],
            "avakaya": ["mango", "green_chilli", "spices"],
            "gutti_vankaya": ["brinjal", "green_chilli", "spices"],
            "pootharekulu": ["rice", "jaggery"],
            "biryani": ["rice", "chicken", "spices"],
            "kodi_vepudu": ["chicken", "spices", "green_chilli"]
        },
        # Food -> Region
        "food_regions": {
            "gongura_pachadi": "coastal_andhra",
            "pulihora": "coastal_andhra",
            "pesarattu": "coastal_andhra",
            "bobbatlu": "rayalaseema",
            "avakaya": "coastal_andhra",
            "gutti_vankaya": "rayalaseema",
            "pootharekulu": "coastal_andhra",
            "biryani": "telangana",
            "kodi_vepudu": "telangana"
        },
        # Food -> Taste
        "food_tastes": {
            "gongura_pachadi": ["sour", "spicy"],
            "pulihora": ["tangy", "spicy"],
            "pesarattu": ["savory", "spicy"],
            "bobbatlu": ["sweet"],
            "avakaya": ["spicy", "sour"],
            "gutti_vankaya": ["savory", "spicy"],
            "pootharekulu": ["sweet"],
            "biryani": ["spicy", "savory"],
            "kodi_vepudu": ["spicy", "savory"]
        },
        # Food -> Festival
        "food_festivals": {
            "pulihora": ["ugadi", "sankranti"],
            "bobbatlu": ["ugadi", "sankranti"],
            "pootharekulu": ["sankranti", "weddings"],
            "gutti_vankaya": ["weddings"],
            "biryani": ["weddings"]
        },
        # Food -> Restaurant
        "food_restaurants": {
            "gongura_pachadi": ["subbayya_gari_hotel", "kakatiya_mess"],
            "pulihora": ["subbayya_gari_hotel"],
            "pesarattu": ["subbayya_gari_hotel", "spicy_venue"],
            "bobbatlu": ["subbayya_gari_hotel", "rayalaseema_ruchulu"],
            "avakaya": ["subbayya_gari_hotel", "kakatiya_mess", "rayalaseema_ruchulu"],
            "gutti_vankaya": ["spicy_venue", "rayalaseema_ruchulu"],
            "pootharekulu": ["subbayya_gari_hotel"],
            "biryani": ["spicy_venue", "rayalaseema_ruchulu"],
            "kodi_vepudu": ["kakatiya_mess", "spicy_venue"]
        }
    }
}


class MockService:
    def __init__(self):
        self.reset_mock_db()

    def reset_mock_db(self):
        # We maintain a state copy in memory that users can modify (like creating users or liking foods)
        self.users = [dict(u) for u in SEED_DATA["users"]]
        self.foods = [Food(**f) for f in SEED_DATA["foods"]]
        self.ingredients = [Ingredient(**i) for i in SEED_DATA["ingredients"]]
        self.regions = [Region(**r) for r in SEED_DATA["regions"]]
        self.tastes = [TasteProfile(**t) for t in SEED_DATA["tastes"]]
        self.festivals = [Festival(**f) for f in SEED_DATA["festivals"]]
        self.restaurants = [Restaurant(**r) for r in SEED_DATA["restaurants"]]
        self.nutrition = SEED_DATA["nutrition"]
        self.relations = SEED_DATA["relations"]

    def seed_data(self) -> Dict[str, Any]:
        self.reset_mock_db()
        nodes_created = len(self.users) + len(self.foods) + len(self.ingredients) + len(self.regions) + len(self.tastes) + len(self.festivals) + len(self.restaurants) + len(self.nutrition)
        
        # Calculate relationships count
        rel_count = 0
        for u in self.users:
            rel_count += len(u.get("likes", []))
        for key, val in self.relations.items():
            if isinstance(val, dict):
                for k, v in val.items():
                    rel_count += len(v) if isinstance(v, list) else (1 if v else 0)
            
        return {
            "status": "success",
            "message": "In-memory Mock Database seeded successfully",
            "nodes_created": nodes_created,
            "relationships_created": rel_count
        }

    def get_foods(self, category: Optional[str] = None, vegetarian: Optional[bool] = None, 
                  spice_level: Optional[str] = None, region: Optional[str] = None) -> List[Dict[str, Any]]:
        results = []
        for food in self.foods:
            # Filters
            if category and food.category != category:
                continue
            if vegetarian is not None and food.vegetarian != vegetarian:
                continue
            if spice_level and food.spice_level != spice_level:
                continue
            
            # Region filter
            reg_id = self.relations["food_regions"].get(food.id)
            reg_node = next((r for r in self.regions if r.id == reg_id), None)
            if region and (not reg_node or reg_node.name != region):
                continue
                
            results.append({
                "f": food,
                "r": reg_node
            })
        return results

    def get_food_details(self, food_id: str) -> Optional[FoodDetail]:
        food = next((f for f in self.foods if f.id == food_id), None)
        if not food:
            return None
            
        # Region
        reg_id = self.relations["food_regions"].get(food_id)
        region = next((r for r in self.regions if r.id == reg_id), None)
        
        # Ingredients
        ing_ids = self.relations["food_ingredients"].get(food_id, [])
        ingredients = [i for i in self.ingredients if i.id in ing_ids]
        
        # Taste
        taste_ids = self.relations["food_tastes"].get(food_id, [])
        taste = next((t for t in self.tastes if t.id in taste_ids), None) # Returns first taste profile
        
        # Festivals
        fest_ids = self.relations["food_festivals"].get(food_id, [])
        festivals = [f for f in self.festivals if f.id in fest_ids]
        
        # Restaurants
        rest_ids = self.relations["food_restaurants"].get(food_id, [])
        restaurants = [r for r in self.restaurants if r.id in rest_ids]
        
        # Nutrition
        nut_dict = self.nutrition.get(food_id)
        nutrition = Nutrition(**nut_dict) if nut_dict else None
        
        return FoodDetail(
            food=food,
            region=region,
            ingredients=ingredients,
            taste=taste,
            festivals=festivals,
            restaurants=restaurants,
            nutrition=nutrition
        )

    def get_food_similarity(self, food_id: str, limit: int = 5) -> List[SimilarityResult]:
        target_ings = set(self.relations["food_ingredients"].get(food_id, []))
        if not target_ings:
            return []
            
        results = []
        for food in self.foods:
            if food.id == food_id:
                continue
            ings = set(self.relations["food_ingredients"].get(food.id, []))
            shared = target_ings.intersection(ings)
            if shared:
                # Get ingredient names
                names = [i.name for i in self.ingredients if i.id in shared]
                results.append(SimilarityResult(
                    food=food,
                    shared_ingredients_count=len(shared),
                    shared_ingredients=names
                ))
                
        results.sort(key=lambda x: (-x.shared_ingredients_count, x.food.name))
        return results[:limit]

    def recommend_by_taste(self, username: str, limit: int = 5) -> List[Recommendation]:
        # Find user
        user = next((u for u in self.users if u["name"].lower() == username.lower()), None)
        if not user:
            return []
            
        liked_food_ids = user.get("likes", [])
        food_pref = user.get("food_preference", "Any")
        spice_pref = user.get("spice_preference", "Any")
        
        # Gather tastes of liked foods
        user_liked_tastes = []
        for f_id in liked_food_ids:
            user_liked_tastes.extend(self.relations["food_tastes"].get(f_id, []))
            
        if not user_liked_tastes:
            return []
            
        recs = {}
        for food in self.foods:
            # Exclude already liked
            if food.id in liked_food_ids:
                continue
            # Apply preferences
            if food_pref != "Any" and food.vegetarian != (food_pref == "Veg"):
                continue
            if spice_pref != "Any" and food.spice_level != spice_pref:
                continue
                
            food_tastes = self.relations["food_tastes"].get(food.id, [])
            shared_tastes = [t for t in food_tastes if t in user_liked_tastes]
            
            if shared_tastes:
                score = len(shared_tastes)
                # Map taste IDs to display names
                taste_names = [next((t_p.taste for t_p in self.tastes if t_p.id == t_id), t_id) for t_id in shared_tastes]
                recs[food.id] = Recommendation(
                    food=food,
                    score=float(score),
                    reasons=[RecommendationReason(
                        type="taste",
                        description=f"Shares {', '.join(taste_names)} taste profile(s) with foods you like."
                    )]
                )
                
        sorted_recs = sorted(recs.values(), key=lambda r: (-r.score, r.food.name))
        return sorted_recs[:limit]

    def recommend_by_region(self, username: str, limit: int = 5) -> List[Recommendation]:
        user = next((u for u in self.users if u["name"].lower() == username.lower()), None)
        if not user:
            return []
            
        liked_food_ids = user.get("likes", [])
        food_pref = user.get("food_preference", "Any")
        spice_pref = user.get("spice_preference", "Any")
        
        # Gather regions of liked foods
        liked_regions = []
        for f_id in liked_food_ids:
            reg_id = self.relations["food_regions"].get(f_id)
            if reg_id:
                liked_regions.append(reg_id)
                
        if not liked_regions:
            return []
            
        recs = {}
        for food in self.foods:
            if food.id in liked_food_ids:
                continue
            if food_pref != "Any" and food.vegetarian != (food_pref == "Veg"):
                continue
            if spice_pref != "Any" and food.spice_level != spice_pref:
                continue
                
            reg_id = self.relations["food_regions"].get(food.id)
            if reg_id in liked_regions:
                # Count matches
                score = liked_regions.count(reg_id)
                reg_name = next((r.name for r in self.regions if r.id == reg_id), reg_id)
                recs[food.id] = Recommendation(
                    food=food,
                    score=float(score),
                    reasons=[RecommendationReason(
                        type="region",
                        description=f"Originates from {reg_name}, which matches the region of food you like."
                    )]
                )
                
        sorted_recs = sorted(recs.values(), key=lambda r: (-r.score, r.food.name))
        return sorted_recs[:limit]

    def get_regional_festival_foods(self, region_name: Optional[str] = None, 
                                     festival_name: Optional[str] = None) -> List[Dict[str, Any]]:
        results = []
        for food in self.foods:
            # Region filter
            reg_id = self.relations["food_regions"].get(food.id)
            region = next((r for r in self.regions if r.id == reg_id), None)
            if region_name and (not region or region.name.lower() != region_name.lower()):
                continue
                
            # Festival filter
            fest_ids = self.relations["food_festivals"].get(food.id, [])
            festivals = [f for f in self.festivals if f.id in fest_ids]
            
            if festival_name:
                matched_fest = next((f for f in festivals if f.name.lower() == festival_name.lower()), None)
                if not matched_fest:
                    continue
                # If matched, we just return this specific pairing
                results.append({
                    "f": food,
                    "r": region,
                    "fest": matched_fest
                })
            else:
                # If no festival filter, return pairs for each connected festival or just one record if none
                if festivals:
                    for fest in festivals:
                        results.append({
                            "f": food,
                            "r": region,
                            "fest": fest
                        })
                else:
                    results.append({
                        "f": food,
                        "r": region,
                        "fest": None
                    })
        return results

    def get_subgraph(self, limit: int = 100) -> GraphData:
        nodes_dict = {}
        edges = []
        
        # Add all major nodes
        for r in self.regions:
            nodes_dict[r.id] = GraphNode(id=r.id, label="Region", title=r.name, properties={"state": r.state})
        for t in self.tastes:
            nodes_dict[t.id] = GraphNode(id=t.id, label="TasteProfile", title=t.taste, properties={"taste": t.taste})
        for f in self.festivals:
            nodes_dict[f.id] = GraphNode(id=f.id, label="Festival", title=f.name)
        for rest in self.restaurants:
            nodes_dict[rest.id] = GraphNode(id=rest.id, label="Restaurant", title=rest.name, properties={"location": rest.location})
        for i in self.ingredients:
            nodes_dict[i.id] = GraphNode(id=i.id, label="Ingredient", title=i.name, properties={"category": i.category})
            
        food_count = 0
        for food in self.foods:
            if food_count >= limit:
                break
            food_count += 1
            
            nodes_dict[food.id] = GraphNode(
                id=food.id, 
                label="Food", 
                title=food.name, 
                properties={
                    "category": food.category,
                    "vegetarian": food.vegetarian,
                    "spice_level": food.spice_level,
                    "description": food.description
                }
            )
            
            # Edges
            # Food -> Region
            reg_id = self.relations["food_regions"].get(food.id)
            if reg_id and reg_id in nodes_dict:
                edges.append(GraphEdge(
                    id=f"{food.id}-ORIGINATED_FROM-{reg_id}",
                    source=food.id,
                    target=reg_id,
                    type="ORIGINATED_FROM"
                ))
                
            # Food -> Taste
            for taste_id in self.relations["food_tastes"].get(food.id, []):
                if taste_id in nodes_dict:
                    edges.append(GraphEdge(
                        id=f"{food.id}-HAS_TASTE-{taste_id}",
                        source=food.id,
                        target=taste_id,
                        type="HAS_TASTE"
                    ))
                    
            # Food -> Ingredient
            for ing_id in self.relations["food_ingredients"].get(food.id, []):
                if ing_id in nodes_dict:
                    edges.append(GraphEdge(
                        id=f"{food.id}-CONTAINS-{ing_id}",
                        source=food.id,
                        target=ing_id,
                        type="CONTAINS"
                    ))
                    
            # Food -> Festival
            for fest_id in self.relations["food_festivals"].get(food.id, []):
                if fest_id in nodes_dict:
                    edges.append(GraphEdge(
                        id=f"{food.id}-SERVED_DURING-{fest_id}",
                        source=food.id,
                        target=fest_id,
                        type="SERVED_DURING"
                    ))
                    
            # Food -> Restaurant
            for rest_id in self.relations["food_restaurants"].get(food.id, []):
                if rest_id in nodes_dict:
                    edges.append(GraphEdge(
                        id=f"{food.id}-AVAILABLE_AT-{rest_id}",
                        source=food.id,
                        target=rest_id,
                        type="AVAILABLE_AT"
                    ))
                    
            # Add nutrition properties to the food node directly to keep layout tidy,
            # or we can add it as a separate node. Let's add it as properties to keep it simple,
            # but wait, the model specifies Nutrition is a separate node: (Food)-[:HAS_NUTRITION]->(Nutrition)
            nut_dict = self.nutrition.get(food.id)
            if nut_dict:
                nut_id = f"nut_{food.id}"
                nodes_dict[nut_id] = GraphNode(
                    id=nut_id,
                    label="Nutrition",
                    title=f"{nut_dict['calories']} kcal",
                    properties=nut_dict
                )
                edges.append(GraphEdge(
                    id=f"{food.id}-HAS_NUTRITION-{nut_id}",
                    source=food.id,
                    target=nut_id,
                    type="HAS_NUTRITION"
                ))

        # We also need to add active users and their like edges if applicable
        for u in self.users:
            nodes_dict[u["id"]] = GraphNode(
                id=u["id"],
                label="User",
                title=u["name"],
                properties={
                    "food_preference": u["food_preference"],
                    "spice_preference": u["spice_preference"]
                }
            )
            for f_id in u.get("likes", []):
                if f_id in nodes_dict:
                    edges.append(GraphEdge(
                        id=f"{u['id']}-LIKES-{f_id}",
                        source=u["id"],
                        target=f_id,
                        type="LIKES"
                    ))
                    
        return GraphData(nodes=list(nodes_dict.values()), edges=edges)

    def get_user_subgraph(self, username: str) -> Optional[GraphData]:
        user = next((u for u in self.users if u["name"].lower() == username.lower()), None)
        if not user:
            return None
            
        nodes_dict = {}
        edges = []
        
        # User node
        nodes_dict[user["id"]] = GraphNode(
            id=user["id"],
            label="User",
            title=user["name"],
            properties={
                "food_preference": user["food_preference"],
                "spice_preference": user["spice_preference"]
            }
        )
        
        # Likes
        liked_food_ids = user.get("likes", [])
        for f_id in liked_food_ids:
            food = next((f for f in self.foods if f.id == f_id), None)
            if not food:
                continue
                
            nodes_dict[food.id] = GraphNode(
                id=food.id,
                label="Food",
                title=food.name,
                properties={
                    "category": food.category,
                    "vegetarian": food.vegetarian,
                    "spice_level": food.spice_level
                }
            )
            
            edges.append(GraphEdge(
                id=f"{user['id']}-LIKES-{food.id}",
                source=user["id"],
                target=food.id,
                type="LIKES"
            ))
            
            # Connections of this food: Taste
            for taste_id in self.relations["food_tastes"].get(food.id, []):
                taste = next((t for t in self.tastes if t.id == taste_id), None)
                if taste:
                    nodes_dict[taste.id] = GraphNode(id=taste.id, label="TasteProfile", title=taste.taste)
                    edges.append(GraphEdge(
                        id=f"{food.id}-HAS_TASTE-{taste.id}",
                        source=food.id,
                        target=taste.id,
                        type="HAS_TASTE"
                    ))
                    
            # Connections of this food: Region
            reg_id = self.relations["food_regions"].get(food.id)
            if reg_id:
                region = next((r for r in self.regions if r.id == reg_id), None)
                if region:
                    nodes_dict[region.id] = GraphNode(id=region.id, label="Region", title=region.name)
                    edges.append(GraphEdge(
                        id=f"{food.id}-ORIGINATED_FROM-{region.id}",
                        source=food.id,
                        target=region.id,
                        type="ORIGINATED_FROM"
                    ))
                    
        return GraphData(nodes=list(nodes_dict.values()), edges=edges)

    def get_users(self) -> List[Dict[str, Any]]:
        results = []
        for u in self.users:
            # Map liked food names
            liked_names = []
            for f_id in u.get("likes", []):
                food = next((f for f in self.foods if f.id == f_id), None)
                if food:
                    liked_names.append(food.name)
            results.append({
                "u": User(id=u["id"], name=u["name"], food_preference=u["food_preference"], spice_preference=u["spice_preference"]),
                "liked_foods": liked_names
            })
        return results

    def create_user(self, name: str, food_pref: str, spice_pref: str) -> User:
        # Check if already exists
        existing = next((u for u in self.users if u["name"].lower() == name.lower()), None)
        if existing:
            existing["food_preference"] = food_pref
            existing["spice_preference"] = spice_pref
            return User(id=existing["id"], name=existing["name"], food_preference=food_pref, spice_preference=spice_pref)
            
        new_user = {
            "id": f"u_{str(uuid.uuid4())[:8]}",
            "name": name,
            "food_preference": food_pref,
            "spice_preference": spice_pref,
            "likes": []
        }
        self.users.append(new_user)
        return User(id=new_user["id"], name=new_user["name"], food_preference=food_pref, spice_preference=spice_pref)

    def get_user_likes(self, username: str) -> List[Dict[str, str]]:
        user = next((u for u in self.users if u["name"].lower() == username.lower()), None)
        if not user:
            return []
        likes = []
        for f_id in user.get("likes", []):
            food = next((f for f in self.foods if f.id == f_id), None)
            if food:
                likes.append({"food_id": food.id, "food_name": food.name})
        return likes

    def add_user_like(self, username: str, food_id: str) -> int:
        user = next((u for u in self.users if u["name"].lower() == username.lower()), None)
        if not user:
            return 0
        if food_id not in user.get("likes", []):
            user.setdefault("likes", []).append(food_id)
            return 1
        return 0

    def remove_user_like(self, username: str, food_id: str) -> int:
        user = next((u for u in self.users if u["name"].lower() == username.lower()), None)
        if not user:
            return 0
        if food_id in user.get("likes", []):
            user["likes"].remove(food_id)
            return 1
        return 0
