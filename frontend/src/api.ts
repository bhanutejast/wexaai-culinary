const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:8000/api" : "/api");

export interface User {
  id: string;
  name: string;
  food_preference: string;
  spice_preference: string;
}

export interface Food {
  id: string;
  name: string;
  category: string;
  vegetarian: boolean;
  spice_level: string;
  description: string;
}

export interface Region {
  id: string;
  name: string;
  district_or_state: string;
}

export interface Ingredient {
  id: string;
  name: string;
  category: string;
}

export interface TasteProfile {
  id: string;
  taste: string;
}

export interface Festival {
  id: string;
  name: string;
}

export interface Restaurant {
  id: string;
  name: string;
  location: string;
}

export interface Nutrition {
  calories: number;
  protein: string;
  health_type: string;
}

export interface FoodDetail {
  food: Food;
  region: Region | null;
  ingredients: Ingredient[];
  taste: TasteProfile | null;
  festivals: Festival[];
  restaurants: Restaurant[];
  nutrition: Nutrition | null;
}

export interface SimilarFoodResult {
  food: Food;
  shared_ingredients_count: number;
  shared_ingredients: string[];
}

export interface FoodDetailResponse {
  details: FoodDetail;
  similar_foods: SimilarFoodResult[];
}

export interface RecommendationReason {
  type: "taste" | "region" | "ingredient";
  description: string;
}

export interface Recommendation {
  food: Food;
  score: number;
  reasons: RecommendationReason[];
}

export interface RecommendationsResponse {
  by_taste: Recommendation[];
  by_region: Recommendation[];
}

export interface GraphNode {
  id: string;
  label: string;
  title: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface DbHealth {
  status: string;
  message: string;
  database: {
    mode: string;
    connected: boolean;
    error: string | null;
  };
}

export const api = {
  getHealth: async (): Promise<DbHealth> => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  seedDatabase: async (): Promise<{ status: string; message: string; nodes_created: number; relationships_created: number }> => {
    const res = await fetch(`${API_BASE}/seed`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Seeding failed");
    }
    return res.json();
  },

  getFoods: async (params?: { category?: string; vegetarian?: boolean; spice_level?: string; region?: string }): Promise<Array<{ f: Food; r: Region | null }>> => {
    const query = new URLSearchParams();
    if (params) {
      if (params.category) query.append("category", params.category);
      if (params.vegetarian !== undefined) query.append("vegetarian", String(params.vegetarian));
      if (params.spice_level) query.append("spice_level", params.spice_level);
      if (params.region) query.append("region", params.region);
    }
    const res = await fetch(`${API_BASE}/foods?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch foods");
    return res.json();
  },

  getFoodDetails: async (foodId: string): Promise<FoodDetailResponse> => {
    const res = await fetch(`${API_BASE}/foods/${foodId}`);
    if (!res.ok) {
      if (res.status === 404) throw new Error("Food not found");
      throw new Error("Failed to fetch food details");
    }
    return res.json();
  },

  getRegionalDiscovery: async (region?: string, festival?: string): Promise<Array<{ f: Food; r: Region | null; fest: Festival | null }>> => {
    const query = new URLSearchParams();
    if (region) query.append("region", region);
    if (festival) query.append("festival", festival);
    const res = await fetch(`${API_BASE}/foods/discovery/regional?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch regional discovery data");
    return res.json();
  },

  getUsers: async (): Promise<Array<{ u: User; liked_foods: string[] }>> => {
    const res = await fetch(`${API_BASE}/users`);
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
  },

  createUser: async (user: { name: string; food_preference: string; spice_preference: string }): Promise<User> => {
    const res = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to create user");
    }
    return res.json();
  },

  getUserLikes: async (username: string): Promise<Array<{ food_id: string; food_name: string }>> => {
    const res = await fetch(`${API_BASE}/users/${encodeURIComponent(username)}/likes`);
    if (!res.ok) throw new Error("Failed to fetch user likes");
    return res.json();
  },

  toggleUserLike: async (username: string, foodId: string, liked: boolean): Promise<any> => {
    const method = liked ? "POST" : "DELETE";
    const res = await fetch(`${API_BASE}/users/${encodeURIComponent(username)}/likes/${foodId}`, { method });
    if (!res.ok) throw new Error("Failed to update like status");
    return res.json();
  },

  getRecommendations: async (username: string, limit: number = 5): Promise<RecommendationsResponse> => {
    const res = await fetch(`${API_BASE}/recommendations?username=${encodeURIComponent(username)}&limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch recommendations");
    return res.json();
  },

  getGraphData: async (limit: number = 50): Promise<GraphData> => {
    const res = await fetch(`${API_BASE}/graph?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch graph data");
    return res.json();
  },

  getUserGraphData: async (username: string): Promise<GraphData> => {
    const res = await fetch(`${API_BASE}/graph/user/${encodeURIComponent(username)}`);
    if (!res.ok) throw new Error("Failed to fetch user graph data");
    return res.json();
  }
};
