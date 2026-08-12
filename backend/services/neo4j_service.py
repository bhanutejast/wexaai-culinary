import logging
from typing import List, Optional, Dict, Any
from database import get_driver
from models import (
    User, Food, Ingredient, Region, TasteProfile, Festival, Restaurant, Nutrition,
    FoodDetail, Recommendation, RecommendationReason, SimilarityResult, GraphNode, GraphEdge, GraphData
)
import queries.cypher_queries as q
from services.mock_service import SEED_DATA

logger = logging.getLogger("neo4j_service")

class Neo4jService:
    def __init__(self):
        pass

    def seed_data(self) -> Dict[str, Any]:
        driver = get_driver()
        if not driver:
            raise Exception("Neo4j database connection unavailable.")
            
        with driver.session() as session:
            # 1. Clear database
            logger.info("Clearing database...")
            session.run(q.CLEAR_DATABASE)
            
            # 2. Create constraints
            logger.info("Creating constraints...")
            for constraint in q.CREATE_CONSTRAINTS:
                try:
                    session.run(constraint)
                except Exception as e:
                    logger.warning(f"Constraint creation status: {e}")
            
            nodes_created = 0
            relationships_created = 0
            
            # 3. Create Regions
            logger.info("Seeding Regions...")
            for r in SEED_DATA["regions"]:
                session.run(
                    "MERGE (reg:Region {id: $id}) ON CREATE SET reg.name = $name, reg.state = $state",
                    id=r["id"], name=r["name"], state=r["state"]
                )
                nodes_created += 1
                
            # 4. Create Tastes
            logger.info("Seeding Tastes...")
            for t in SEED_DATA["tastes"]:
                session.run(
                    "MERGE (taste:TasteProfile {id: $id}) ON CREATE SET taste.taste = $taste",
                    id=t["id"], taste=t["taste"]
                )
                nodes_created += 1
                
            # 5. Create Festivals
            logger.info("Seeding Festivals...")
            for f in SEED_DATA["festivals"]:
                session.run(
                    "MERGE (fest:Festival {id: $id}) ON CREATE SET fest.name = $name",
                    id=f["id"], name=f["name"]
                )
                nodes_created += 1
                
            # 6. Create Restaurants
            logger.info("Seeding Restaurants...")
            for rest in SEED_DATA["restaurants"]:
                session.run(
                    "MERGE (rest:Restaurant {id: $id}) ON CREATE SET rest.name = $name, rest.location = $location",
                    id=rest["id"], name=rest["name"], location=rest["location"]
                )
                nodes_created += 1
                
            # 7. Create Ingredients
            logger.info("Seeding Ingredients...")
            for i in SEED_DATA["ingredients"]:
                session.run(
                    "MERGE (ing:Ingredient {id: $id}) ON CREATE SET ing.name = $name, ing.category = $category",
                    id=i["id"], name=i["name"], category=i["category"]
                )
                nodes_created += 1
                
            # 8. Create Foods
            logger.info("Seeding Foods...")
            for f in SEED_DATA["foods"]:
                session.run(
                    """
                    MERGE (food:Food {id: $id}) 
                    ON CREATE SET food.name = $name, food.category = $category, 
                                  food.vegetarian = $vegetarian, food.spice_level = $spice_level, 
                                  food.description = $description
                    """,
                    id=f["id"], name=f["name"], category=f["category"], 
                    vegetarian=f["vegetarian"], spice_level=f["spice_level"], 
                    description=f["description"]
                )
                nodes_created += 1
                
                # Create Nutrition linked to Food
                nut = SEED_DATA["nutrition"].get(f["id"])
                if nut:
                    session.run(
                        """
                        MATCH (food:Food {id: $food_id})
                        CREATE (food)-[:HAS_NUTRITION]->(n:Nutrition {
                            calories: $calories, 
                            protein: $protein, 
                            health_type: $health_type
                        })
                        """,
                        food_id=f["id"], calories=nut["calories"], 
                        protein=nut["protein"], health_type=nut["health_type"]
                    )
                    nodes_created += 1
                    relationships_created += 1
                    
            # 9. Create Relationships
            logger.info("Seeding relationships...")
            # Food -> Region
            for f_id, reg_id in SEED_DATA["relations"]["food_regions"].items():
                session.run(
                    "MATCH (f:Food {id: $f_id}), (r:Region {id: $reg_id}) MERGE (f)-[:ORIGINATED_FROM]->(r)",
                    f_id=f_id, reg_id=reg_id
                )
                relationships_created += 1
                
            # Food -> Ingredient
            for f_id, ing_ids in SEED_DATA["relations"]["food_ingredients"].items():
                for ing_id in ing_ids:
                    session.run(
                        "MATCH (f:Food {id: $f_id}), (i:Ingredient {id: $ing_id}) MERGE (f)-[:CONTAINS]->(i)",
                        f_id=f_id, ing_id=ing_id
                    )
                    relationships_created += 1
                    
            # Food -> Taste
            for f_id, taste_ids in SEED_DATA["relations"]["food_tastes"].items():
                for taste_id in taste_ids:
                    session.run(
                        "MATCH (f:Food {id: $f_id}), (t:TasteProfile {id: $taste_id}) MERGE (f)-[:HAS_TASTE]->(t)",
                        f_id=f_id, taste_id=taste_id
                    )
                    relationships_created += 1
                    
            # Food -> Festival
            for f_id, fest_ids in SEED_DATA["relations"]["food_festivals"].items():
                for fest_id in fest_ids:
                    session.run(
                        "MATCH (f:Food {id: $f_id}), (fest:Festival {id: $fest_id}) MERGE (f)-[:SERVED_DURING]->(fest)",
                        f_id=f_id, fest_id=fest_id
                    )
                    relationships_created += 1
                    
            # Food -> Restaurant
            for f_id, rest_ids in SEED_DATA["relations"]["food_restaurants"].items():
                for rest_id in rest_ids:
                    session.run(
                        "MATCH (f:Food {id: $f_id}), (r:Restaurant {id: $rest_id}) MERGE (f)-[:AVAILABLE_AT]->(r)",
                        f_id=f_id, rest_id=rest_id
                    )
                    relationships_created += 1

            # 10. Seed Users
            logger.info("Seeding Users and User Likes...")
            for u in SEED_DATA["users"]:
                session.run(
                    """
                    MERGE (user:User {name: $name})
                    ON CREATE SET user.id = $id, user.food_preference = $food_preference, 
                                  user.spice_preference = $spice_preference
                    """,
                    name=u["name"], id=u["id"], food_preference=u["food_preference"], 
                    spice_preference=u["spice_preference"]
                )
                nodes_created += 1
                
                # Likes
                for f_id in u.get("likes", []):
                    session.run(
                        "MATCH (user:User {name: $name}), (f:Food {id: $f_id}) MERGE (user)-[:LIKES]->(f)",
                        name=u["name"], f_id=f_id
                    )
                    relationships_created += 1
                    
            return {
                "status": "success",
                "message": "CognoDB/Neo4j database seeded successfully",
                "nodes_created": nodes_created,
                "relationships_created": relationships_created
            }

    def _parse_food(self, node) -> Food:
        props = dict(node)
        return Food(
            id=props["id"],
            name=props["name"],
            category=props["category"],
            vegetarian=props["vegetarian"],
            spice_level=props["spice_level"],
            description=props["description"]
        )

    def _parse_region(self, node) -> Optional[Region]:
        if not node:
            return None
        props = dict(node)
        return Region(
            id=props["id"],
            name=props["name"],
            district_or_state=props.get("state") or props.get("district") or "Andhra Pradesh"
        )

    def get_foods(self, category: Optional[str] = None, vegetarian: Optional[bool] = None, 
                  spice_level: Optional[str] = None, region: Optional[str] = None) -> List[Dict[str, Any]]:
        driver = get_driver()
        with driver.session() as session:
            result = session.run(
                q.GET_FOODS,
                category=category,
                vegetarian=vegetarian,
                spice_level=spice_level,
                region=region
            )
            
            foods_list = []
            for record in result:
                f_node = record["f"]
                r_node = record["r"]
                
                foods_list.append({
                    "f": self._parse_food(f_node),
                    "r": self._parse_region(r_node)
                })
            return foods_list

    def get_food_details(self, food_id: str) -> Optional[FoodDetail]:
        driver = get_driver()
        with driver.session() as session:
            result = session.run(q.GET_FOOD_DETAILS, food_id=food_id)
            record = result.single()
            if not record:
                return None
                
            f_node = record["f"]
            if not f_node:
                return None
                
            food = self._parse_food(f_node)
            region = self._parse_region(record["r"])
            
            ingredients = []
            for ing_node in record["ingredients"]:
                if ing_node:
                    props = dict(ing_node)
                    ingredients.append(Ingredient(
                        id=props["id"],
                        name=props["name"],
                        category=props.get("category", "")
                    ))
                    
            taste = None
            if record["t"]:
                props = dict(record["t"])
                taste = TasteProfile(id=props["id"], taste=props["taste"])
                
            festivals = []
            for fest_node in record["festivals"]:
                if fest_node:
                    props = dict(fest_node)
                    festivals.append(Festival(
                        id=props["id"],
                        name=props["name"]
                    ))
                    
            restaurants = []
            for rest_node in record["restaurants"]:
                if rest_node:
                    props = dict(rest_node)
                    restaurants.append(Restaurant(
                        id=props["id"],
                        name=props["name"],
                        location=props["location"]
                    ))
                    
            nutrition = None
            if record["nut"]:
                props = dict(record["nut"])
                nutrition = Nutrition(
                    calories=props["calories"],
                    protein=props["protein"],
                    health_type=props["health_type"]
                )
                
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
        driver = get_driver()
        with driver.session() as session:
            result = session.run(q.GET_FOOD_SIMILARITY, food_id=food_id, limit=limit)
            similarity_list = []
            for record in result:
                f2_node = record["f2"]
                similarity_list.append(SimilarityResult(
                    food=self._parse_food(f2_node),
                    shared_ingredients_count=record["shared_ingredients_count"],
                    shared_ingredients=record["shared_ingredients"]
                ))
            return similarity_list

    def recommend_by_taste(self, username: str, limit: int = 5) -> List[Recommendation]:
        driver = get_driver()
        # First, fetch the user preferences to pass into query parameters
        with driver.session() as session:
            u_res = session.run("MATCH (u:User {name: $name}) RETURN u", name=username)
            u_rec = u_res.single()
            if not u_rec:
                return []
            u_props = dict(u_rec["u"])
            
            result = session.run(
                q.RECOMMEND_BY_TASTE,
                username=username,
                food_pref=u_props.get("food_preference", "Any"),
                spice_pref=u_props.get("spice_preference", "Any"),
                limit=limit
            )
            
            recs = []
            for record in result:
                food_node = record["f2"]
                tastes = record["details"] # List of tastes
                recs.append(Recommendation(
                    food=self._parse_food(food_node),
                    score=float(record["score"]),
                    reasons=[RecommendationReason(
                        type="taste",
                        description=f"Shares {', '.join(tastes)} taste profile(s) with foods you like."
                    )]
                ))
            return recs

    def recommend_by_region(self, username: str, limit: int = 5) -> List[Recommendation]:
        driver = get_driver()
        with driver.session() as session:
            u_res = session.run("MATCH (u:User {name: $name}) RETURN u", name=username)
            u_rec = u_res.single()
            if not u_rec:
                return []
            u_props = dict(u_rec["u"])
            
            result = session.run(
                q.RECOMMEND_BY_REGION,
                username=username,
                food_pref=u_props.get("food_preference", "Any"),
                spice_pref=u_props.get("spice_preference", "Any"),
                limit=limit
            )
            
            recs = []
            for record in result:
                food_node = record["f2"]
                regions = record["details"]
                recs.append(Recommendation(
                    food=self._parse_food(food_node),
                    score=float(record["score"]),
                    reasons=[RecommendationReason(
                        type="region",
                        description=f"Originates from {', '.join(regions)}, which matches the region of food you like."
                    )]
                ))
            return recs

    def get_regional_festival_foods(self, region_name: Optional[str] = None, 
                                     festival_name: Optional[str] = None) -> List[Dict[str, Any]]:
        driver = get_driver()
        with driver.session() as session:
            result = session.run(
                q.GET_REGIONAL_FESTIVAL_FOODS,
                region_name=region_name,
                festival_name=festival_name
            )
            
            foods_list = []
            for record in result:
                f_node = record["f"]
                r_node = record["r"]
                fest_node = record["fest"]
                
                # Parse nodes
                food = self._parse_food(f_node)
                region = self._parse_region(r_node)
                
                fest = None
                if fest_node:
                    props = dict(fest_node)
                    fest = Festival(id=props["id"], name=props["name"])
                    
                foods_list.append({
                    "f": food,
                    "r": region,
                    "fest": fest
                })
            return foods_list

    def get_subgraph(self, limit: int = 100) -> GraphData:
        driver = get_driver()
        with driver.session() as session:
            result = session.run(q.GET_SUBGRAPH, limit=limit)
            nodes_dict = {}
            edges = []
            
            # Helper to add a node to the dictionary
            def add_node(neo_node, label):
                if not neo_node:
                    return None
                props = dict(neo_node)
                n_id = props.get("id")
                # Nutrition has no id field, we use a compound key
                if label == "Nutrition":
                    n_id = f"nut_{props.get('calories')}"
                if n_id and n_id not in nodes_dict:
                    nodes_dict[n_id] = GraphNode(
                        id=n_id,
                        label=label,
                        title=props.get("name") or props.get("taste") or f"{props.get('calories')} kcal",
                        properties=props
                    )
                return n_id
                
            for record in result:
                f_node = record["f"]
                f_id = add_node(f_node, "Food")
                
                # Handle relationship lists
                for item in record["ingredients"]:
                    if item and item.get("node"):
                        target_id = add_node(item["node"], "Ingredient")
                        rel = item["rel"]
                        if f_id and target_id:
                            edges.append(GraphEdge(
                                id=f"{f_id}-CONTAINS-{target_id}",
                                source=f_id,
                                target=target_id,
                                type="CONTAINS"
                            ))
                            
                for item in record["regions"]:
                    if item and item.get("node"):
                        target_id = add_node(item["node"], "Region")
                        if f_id and target_id:
                            edges.append(GraphEdge(
                                id=f"{f_id}-ORIGINATED_FROM-{target_id}",
                                source=f_id,
                                target=target_id,
                                type="ORIGINATED_FROM"
                            ))
                            
                for item in record["tastes"]:
                    if item and item.get("node"):
                        target_id = add_node(item["node"], "TasteProfile")
                        if f_id and target_id:
                            edges.append(GraphEdge(
                                id=f"{f_id}-HAS_TASTE-{target_id}",
                                source=f_id,
                                target=target_id,
                                type="HAS_TASTE"
                            ))
                            
                for item in record["festivals"]:
                    if item and item.get("node"):
                        target_id = add_node(item["node"], "Festival")
                        if f_id and target_id:
                            edges.append(GraphEdge(
                                id=f"{f_id}-SERVED_DURING-{target_id}",
                                source=f_id,
                                target=target_id,
                                type="SERVED_DURING"
                            ))
                            
                for item in record["restaurants"]:
                    if item and item.get("node"):
                        target_id = add_node(item["node"], "Restaurant")
                        if f_id and target_id:
                            edges.append(GraphEdge(
                                id=f"{f_id}-AVAILABLE_AT-{target_id}",
                                source=f_id,
                                target=target_id,
                                type="AVAILABLE_AT"
                            ))
                            
                for item in record["nutritions"]:
                    if item and item.get("node"):
                        target_id = add_node(item["node"], "Nutrition")
                        if f_id and target_id:
                            edges.append(GraphEdge(
                                id=f"{f_id}-HAS_NUTRITION-{target_id}",
                                source=f_id,
                                target=target_id,
                                type="HAS_NUTRITION"
                            ))

            # Fetch users and user likes too to build a comprehensive graph
            users_res = session.run("MATCH (u:User) OPTIONAL MATCH (u)-[r:LIKES]->(f:Food) RETURN u, r, f")
            for record in users_res:
                u_node = record["u"]
                if u_node:
                    u_props = dict(u_node)
                    u_id = u_props["id"]
                    if u_id not in nodes_dict:
                        nodes_dict[u_id] = GraphNode(
                            id=u_id,
                            label="User",
                            title=u_props["name"],
                            properties={
                                "food_preference": u_props.get("food_preference"),
                                "spice_preference": u_props.get("spice_preference")
                            }
                        )
                    
                    f_node = record["f"]
                    if f_node:
                        f_props = dict(f_node)
                        f_id = f_props["id"]
                        if f_id in nodes_dict:
                            edges.append(GraphEdge(
                                id=f"{u_id}-LIKES-{f_id}",
                                source=u_id,
                                target=f_id,
                                type="LIKES"
                            ))
            
            return GraphData(nodes=list(nodes_dict.values()), edges=edges)

    def get_user_subgraph(self, username: str) -> Optional[GraphData]:
        driver = get_driver()
        with driver.session() as session:
            result = session.run(q.GET_USER_SUBGRAPH, username=username)
            record = result.single()
            if not record or not record["u"]:
                return None
                
            nodes_dict = {}
            edges = []
            
            # User node
            u_node = record["u"]
            u_props = dict(u_node)
            u_id = u_props["id"]
            nodes_dict[u_id] = GraphNode(
                id=u_id,
                label="User",
                title=u_props["name"],
                properties={
                    "food_preference": u_props.get("food_preference"),
                    "spice_preference": u_props.get("spice_preference")
                }
            )
            
            # Liked foods and relations
            for item in record["foods"]:
                if item and item.get("node"):
                    f_node = item["node"]
                    f_props = dict(f_node)
                    f_id = f_props["id"]
                    nodes_dict[f_id] = GraphNode(
                        id=f_id,
                        label="Food",
                        title=f_props["name"],
                        properties={
                            "category": f_props.get("category"),
                            "vegetarian": f_props.get("vegetarian"),
                            "spice_level": f_props.get("spice_level")
                        }
                    )
                    edges.append(GraphEdge(
                        id=f"{u_id}-LIKES-{f_id}",
                        source=u_id,
                        target=f_id,
                        type="LIKES"
                    ))
                    
            for item in record["tastes"]:
                if item and item.get("node"):
                    t_node = item["node"]
                    t_props = dict(t_node)
                    t_id = t_props["id"]
                    nodes_dict[t_id] = GraphNode(id=t_id, label="TasteProfile", title=t_props["taste"])
                    # Find which food liked connects to it
                    rel = item["rel"]
                    # In Cypher, the result returns a set of tuples. Since this is user-specific, we can rebuild the edges:
                    # Let's map it by running a query or matching IDs
                    
            # In order to hook up the sub-edges correctly, it is cleaner to match them inside cypher. 
            # Let's rebuild the edges by matching source and target.
            # We can find all foods in nodes_dict, and if a taste is in nodes_dict, query if the food has it.
            # But wait! A simpler way is: since we have the session, let's run a quick query that fetches the liked food's connections.
            # Wait, the GET_USER_SUBGRAPH returns list of tastes and regions connected to these foods.
            # Let's just query relationships between the elements we have:
            food_ids = [k for k, v in nodes_dict.items() if v.label == "Food"]
            if food_ids:
                rel_res = session.run(
                    """
                    MATCH (f:Food)-[r]->(target)
                    WHERE f.id IN $food_ids
                      AND labels(target)[0] IN ['TasteProfile', 'Region']
                    RETURN f.id as f_id, type(r) as r_type, target.id as t_id, labels(target)[0] as t_label, target
                    """,
                    food_ids=food_ids
                )
                for rel_rec in rel_res:
                    f_id = rel_rec["f_id"]
                    t_id = rel_rec["t_id"]
                    r_type = rel_rec["r_type"]
                    t_label = rel_rec["t_label"]
                    t_node = rel_rec["target"]
                    t_props = dict(t_node)
                    
                    if t_id not in nodes_dict:
                        nodes_dict[t_id] = GraphNode(
                            id=t_id,
                            label=t_label,
                            title=t_props.get("name") or t_props.get("taste") or t_id,
                            properties=t_props
                        )
                    edges.append(GraphEdge(
                        id=f"{f_id}-{r_type}-{t_id}",
                        source=f_id,
                        target=t_id,
                        type=r_type
                    ))
                    
            return GraphData(nodes=list(nodes_dict.values()), edges=edges)

    def get_users(self) -> List[Dict[str, Any]]:
        driver = get_driver()
        with driver.session() as session:
            result = session.run(q.GET_ALL_USERS)
            users_list = []
            for record in result:
                u_node = record["u"]
                u_props = dict(u_node)
                users_list.append({
                    "u": User(
                        id=u_props["id"],
                        name=u_props["name"],
                        food_preference=u_props.get("food_preference", "Any"),
                        spice_preference=u_props.get("spice_preference", "Any")
                    ),
                    "liked_foods": record["liked_foods"]
                })
            return users_list

    def create_user(self, name: str, food_pref: str, spice_pref: str) -> User:
        import uuid
        driver = get_driver()
        with driver.session() as session:
            result = session.run(
                q.CREATE_USER,
                id=f"u_{str(uuid.uuid4())[:8]}",
                name=name,
                food_preference=food_pref,
                spice_preference=spice_pref
            )
            record = result.single()
            u_node = record["u"]
            u_props = dict(u_node)
            return User(
                id=u_props["id"],
                name=u_props["name"],
                food_preference=u_props.get("food_preference"),
                spice_preference=u_props.get("spice_preference")
            )

    def get_user_likes(self, username: str) -> List[Dict[str, str]]:
        driver = get_driver()
        with driver.session() as session:
            result = session.run(q.GET_USER_LIKES, username=username)
            likes = []
            for record in result:
                likes.append({
                    "food_id": record["food_id"],
                    "food_name": record["food_name"]
                })
            return likes

    def add_user_like(self, username: str, food_id: str) -> int:
        driver = get_driver()
        with driver.session() as session:
            result = session.run(q.ADD_USER_LIKE, username=username, food_id=food_id)
            record = result.single()
            return record["created"] if record else 0

    def remove_user_like(self, username: str, food_id: str) -> int:
        driver = get_driver()
        with driver.session() as session:
            result = session.run(q.REMOVE_USER_LIKE, username=username, food_id=food_id)
            record = result.single()
            return record["deleted"] if record else 0
