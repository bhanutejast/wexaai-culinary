# Cypher Queries for Andhra Culinary Knowledge Graph

# Clear database
CLEAR_DATABASE = """
MATCH (n) DETACH DELETE n
"""

# Create unique constraints
CREATE_CONSTRAINTS = [
    "CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE",
    "CREATE CONSTRAINT food_id_unique IF NOT EXISTS FOR (f:Food) REQUIRE f.id IS UNIQUE",
    "CREATE CONSTRAINT ingredient_id_unique IF NOT EXISTS FOR (i:Ingredient) REQUIRE i.id IS UNIQUE",
    "CREATE CONSTRAINT region_id_unique IF NOT EXISTS FOR (r:Region) REQUIRE r.id IS UNIQUE",
    "CREATE CONSTRAINT taste_id_unique IF NOT EXISTS FOR (t:TasteProfile) REQUIRE t.id IS UNIQUE",
    "CREATE CONSTRAINT festival_id_unique IF NOT EXISTS FOR (f:Festival) REQUIRE f.id IS UNIQUE",
    "CREATE CONSTRAINT restaurant_id_unique IF NOT EXISTS FOR (r:Restaurant) REQUIRE r.id IS UNIQUE"
]

# Fetch foods with basic filters
GET_FOODS = """
MATCH (f:Food)
WHERE ($category IS NULL OR f.category = $category)
  AND ($vegetarian IS NULL OR f.vegetarian = $vegetarian)
  AND ($spice_level IS NULL OR f.spice_level = $spice_level)
OPTIONAL MATCH (f)-[:ORIGINATED_FROM]->(r:Region)
WHERE ($region IS NULL OR r.name = $region)
WITH f, r
WHERE ($region IS NULL OR r IS NOT NULL)
RETURN f, r
ORDER BY f.name
"""

# Fetch single food details with all relations
GET_FOOD_DETAILS = """
MATCH (f:Food {id: $food_id})
OPTIONAL MATCH (f)-[:ORIGINATED_FROM]->(r:Region)
OPTIONAL MATCH (f)-[:CONTAINS]->(i:Ingredient)
OPTIONAL MATCH (f)-[:HAS_TASTE]->(t:TasteProfile)
OPTIONAL MATCH (f)-[:SERVED_DURING]->(fest:Festival)
OPTIONAL MATCH (f)-[:AVAILABLE_AT]->(rest:Restaurant)
OPTIONAL MATCH (f)-[:HAS_NUTRITION]->(nut:Nutrition)
RETURN f, r, collect(distinct i) as ingredients, t, collect(distinct fest) as festivals, collect(distinct rest) as restaurants, nut
"""

# Get food similarity (sharing ingredients)
GET_FOOD_SIMILARITY = """
MATCH (f1:Food {id: $food_id})-[:CONTAINS]->(i:Ingredient)<-[:CONTAINS]-(f2:Food)
RETURN f2, count(i) as shared_ingredients_count, collect(i.name) as shared_ingredients
ORDER BY shared_ingredients_count DESC, f2.name ASC
LIMIT $limit
"""

# Get personalized recommendation based on user preferences and liked foods
# Traversal: User -> LIKES -> Food -> HAS_TASTE -> TasteProfile <- HAS_TASTE - RecommendedFood
RECOMMEND_BY_TASTE = """
MATCH (u:User {name: $username})-[:LIKES]->(f1:Food)-[:HAS_TASTE]->(t:TasteProfile)<-[:HAS_TASTE]-(f2:Food)
WHERE NOT (u)-[:LIKES]->(f2)
  AND ($food_pref = 'Any' OR f2.vegetarian = ($food_pref = 'Veg'))
  AND ($spice_pref = 'Any' OR f2.spice_level = $spice_pref)
RETURN f2, count(t) as score, collect(t.taste) as details, 'taste' as reason_type
ORDER BY score DESC
LIMIT $limit
"""

# Traversal: User -> LIKES -> Food -> ORIGINATED_FROM -> Region <- ORIGINATED_FROM - RecommendedFood
RECOMMEND_BY_REGION = """
MATCH (u:User {name: $username})-[:LIKES]->(f1:Food)-[:ORIGINATED_FROM]->(r:Region)<-[:ORIGINATED_FROM]-(f2:Food)
WHERE NOT (u)-[:LIKES]->(f2)
  AND ($food_pref = 'Any' OR f2.vegetarian = ($food_pref = 'Veg'))
  AND ($spice_pref = 'Any' OR f2.spice_level = $spice_pref)
RETURN f2, count(r) as score, collect(r.name) as details, 'region' as reason_type
ORDER BY score DESC
LIMIT $limit
"""

# Regional and Festival Discovery
GET_REGIONAL_FESTIVAL_FOODS = """
MATCH (f:Food)-[:ORIGINATED_FROM]->(r:Region)
WHERE ($region_name IS NULL OR r.name = $region_name)
OPTIONAL MATCH (f)-[:SERVED_DURING]->(fest:Festival)
WHERE ($festival_name IS NULL OR fest.name = $festival_name)
WITH f, r, fest
WHERE ($festival_name IS NULL OR fest IS NOT NULL)
RETURN f, r, fest
ORDER BY f.name
"""

# Graph visualization query (nodes and relationships)
# Get a subgraph of foods and their immediate connections
GET_SUBGRAPH = """
MATCH (f:Food)
OPTIONAL MATCH (f)-[r1:CONTAINS]->(i:Ingredient)
OPTIONAL MATCH (f)-[r2:ORIGINATED_FROM]->(reg:Region)
OPTIONAL MATCH (f)-[r3:HAS_TASTE]->(t:TasteProfile)
OPTIONAL MATCH (f)-[r4:SERVED_DURING]->(fest:Festival)
OPTIONAL MATCH (f)-[r5:AVAILABLE_AT]->(rest:Restaurant)
OPTIONAL MATCH (f)-[r6:HAS_NUTRITION]->(nut:Nutrition)
RETURN f, 
       collect(distinct {rel: r1, node: i}) as ingredients, 
       collect(distinct {rel: r2, node: reg}) as regions, 
       collect(distinct {rel: r3, node: t}) as tastes,
       collect(distinct {rel: r4, node: fest}) as festivals,
       collect(distinct {rel: r5, node: rest}) as restaurants,
       collect(distinct {rel: r6, node: nut}) as nutritions
LIMIT $limit
"""

# User specific graph query (User likes and connections)
GET_USER_SUBGRAPH = """
MATCH (u:User {name: $username})
OPTIONAL MATCH (u)-[r_likes:LIKES]->(f:Food)
OPTIONAL MATCH (f)-[r_taste:HAS_TASTE]->(t:TasteProfile)
OPTIONAL MATCH (f)-[r_region:ORIGINATED_FROM]->(reg:Region)
RETURN u, 
       collect(distinct {rel: r_likes, node: f}) as foods,
       collect(distinct {rel: r_taste, node: t}) as tastes,
       collect(distinct {rel: r_region, node: reg}) as regions
"""

# Basic User CRUD
GET_ALL_USERS = """
MATCH (u:User)
OPTIONAL MATCH (u)-[:LIKES]->(f:Food)
RETURN u, collect(f.name) as liked_foods
ORDER BY u.name
"""

CREATE_USER = """
MERGE (u:User {name: $name})
ON CREATE SET u.id = $id, u.food_preference = $food_preference, u.spice_preference = $spice_preference
ON MATCH SET u.food_preference = $food_preference, u.spice_preference = $spice_preference
RETURN u
"""

GET_USER_LIKES = """
MATCH (u:User {name: $username})-[:LIKES]->(f:Food)
RETURN f.id as food_id, f.name as food_name
"""

ADD_USER_LIKE = """
MATCH (u:User {name: $username})
MATCH (f:Food {id: $food_id})
MERGE (u)-[r:LIKES]->(f)
RETURN count(r) as created
"""

REMOVE_USER_LIKE = """
MATCH (u:User {name: $username})-[r:LIKES]->(f:Food {id: $food_id})
DELETE r
RETURN count(r) as deleted
"""
