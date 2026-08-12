import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin, Users, Utensils, Flame, Sparkles, AlertTriangle, Apple, Heart } from "lucide-react";
import { api } from "../api";
import type { Food, Region, FoodDetail, SimilarFoodResult } from "../api";

interface FoodExplorerProps {
  activeUser: string;
}

export const FoodExplorer: React.FC<FoodExplorerProps> = ({ activeUser }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedParam = searchParams.get("selected");

  const [foods, setFoods] = useState<Array<{ f: Food; r: Region | null }>>([]);
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [foodDetail, setFoodDetail] = useState<FoodDetail | null>(null);
  const [similarFoods, setSimilarFoods] = useState<SimilarFoodResult[]>([]);
  const [userLikes, setUserLikes] = useState<string[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Load recipe list
  const loadFoodsList = async () => {
    setLoadingList(true);
    try {
      const data = await api.getFoods();
      setFoods(data);
      
      // Load user likes
      if (activeUser) {
        const likes = await api.getUserLikes(activeUser);
        setUserLikes(likes.map(l => l.food_id));
      }

      // If a food is pre-selected via query param, select it. Otherwise, default to first item
      if (selectedParam) {
        setSelectedFoodId(selectedParam);
      } else if (data.length > 0) {
        setSelectedFoodId(data[0].f.id);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load recipe list.");
    } finally {
      setLoadingList(false);
    }
  };

  // Load details whenever selected food changes
  const loadFoodDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const data = await api.getFoodDetails(id);
      setFoodDetail(data.details);
      setSimilarFoods(data.similar_foods);
    } catch (err) {
      console.error(err);
      setFoodDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadFoodsList();
  }, [activeUser]);

  useEffect(() => {
    if (selectedFoodId) {
      loadFoodDetail(selectedFoodId);
      // Sync selected param in URL
      if (searchParams.get("selected") !== selectedFoodId) {
        setSearchParams({ selected: selectedFoodId });
      }
    }
  }, [selectedFoodId]);

  const handleToggleLike = async (foodId: string) => {
    const isLiked = userLikes.includes(foodId);
    try {
      await api.toggleUserLike(activeUser, foodId, !isLiked);
      if (isLiked) {
        setUserLikes(prev => prev.filter(id => id !== foodId));
      } else {
        setUserLikes(prev => [...prev, foodId]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-4rem)] flex flex-col md:flex-row gap-6">
      {/* Left List Pane */}
      <div className="w-full md:w-80 flex flex-col glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-800 bg-slate-900/40">
          <h2 className="text-base font-bold text-slate-200">Andhra Foods</h2>
          <p className="text-xs text-slate-400 mt-1">Select a dish to explore its graph connections</p>
          {errorMsg && (
            <p className="text-xs text-rose-400 mt-1 font-medium bg-rose-950/20 border border-rose-900/30 rounded p-1.5">{errorMsg}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-850">
          {loadingList ? (
            [1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="p-4 space-y-2.5 pulse-skeleton">
                <div className="h-4 bg-slate-800 rounded w-2/3" />
                <div className="h-3 bg-slate-800 rounded w-1/2" />
              </div>
            ))
          ) : foods.length > 0 ? (
            foods.map(({ f, r }) => {
              const isSelected = f.id === selectedFoodId;
              const isLiked = userLikes.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFoodId(f.id)}
                  className={`w-full text-left p-4 transition-all duration-200 flex items-center justify-between ${
                    isSelected 
                      ? "bg-brand-500/10 border-l-4 border-l-brand-500 text-slate-200" 
                      : "hover:bg-slate-900/40 text-slate-400"
                  }`}
                >
                  <div className="space-y-1 pr-2 truncate">
                    <span className={`text-sm font-bold block ${isSelected ? "text-brand-400" : "text-slate-300"}`}>
                      {f.name}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-slate-600" />
                      <span className="truncate">{r?.name || "Unknown Region"}</span>
                    </span>
                  </div>
                  {isLiked && <Heart className="h-4.5 w-4.5 fill-rose-500 text-rose-500 shrink-0" />}
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              No dishes seeded. Please click "Reset & Seed" in the navbar.
            </div>
          )}
        </div>
      </div>

      {/* Right Details Canvas */}
      <div className="flex-1 overflow-y-auto glass-panel rounded-2xl border border-slate-800/80 p-6 space-y-6">
        {loadingDetail ? (
          <div className="space-y-6 py-4 pulse-skeleton">
            <div className="space-y-3">
              <div className="h-8 bg-slate-850 rounded w-1/3" />
              <div className="h-4 bg-slate-850 rounded w-3/4" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-28 bg-slate-850 rounded-xl" />
              <div className="h-28 bg-slate-850 rounded-xl" />
            </div>
          </div>
        ) : foodDetail ? (
          <>
            {/* Header info */}
            <div className="border-b border-slate-800 pb-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 flex items-center space-x-2">
                  <span>{foodDetail.food.name}</span>
                  <button 
                    onClick={() => handleToggleLike(foodDetail.food.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Heart className={`h-6 w-6 ${userLikes.includes(foodDetail.food.id) ? "fill-rose-500 text-rose-500" : ""}`} />
                  </button>
                </h1>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    foodDetail.food.vegetarian 
                      ? "bg-emerald-950/40 border-emerald-800 text-emerald-400" 
                      : "bg-rose-950/40 border-rose-900 text-rose-400"
                  }`}>
                    {foodDetail.food.vegetarian ? "Pure Veg" : "Non-Veg"}
                  </span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full border bg-slate-900 border-slate-800 text-slate-400">
                    {foodDetail.food.category}
                  </span>
                </div>
              </div>
              <p className="text-slate-350 text-sm leading-relaxed">{foodDetail.food.description}</p>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Region */}
              <div className="bg-slate-950/40 border border-slate-850/60 rounded-xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Origin Region</span>
                <span className="text-sm font-bold text-slate-200 flex items-center space-x-1">
                  <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
                  <span>{foodDetail.region?.name || "Not Specified"}</span>
                </span>
                <span className="text-xs text-slate-500 block">State: {foodDetail.region?.district_or_state}</span>
              </div>

              {/* Taste profile */}
              <div className="bg-slate-950/40 border border-slate-850/60 rounded-xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Taste Profile</span>
                <span className="text-sm font-bold text-slate-200 flex items-center space-x-1">
                  <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>{foodDetail.taste?.taste || "Classic"}</span>
                </span>
                <span className="text-xs text-slate-500 block">Spice Level: {foodDetail.food.spice_level}</span>
              </div>

              {/* Nutrition */}
              <div className="bg-slate-950/40 border border-slate-850/60 rounded-xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nutrition & Calories</span>
                <span className="text-sm font-bold text-slate-200 flex items-center space-x-1">
                  <Apple className="h-4 w-4 text-yellow-500 shrink-0" />
                  <span>{foodDetail.nutrition ? `${foodDetail.nutrition.calories} kcal` : "Uncharted"}</span>
                </span>
                <span className="text-xs text-slate-550 block">
                  {foodDetail.nutrition ? `Protein: ${foodDetail.nutrition.protein} • ${foodDetail.nutrition.health_type}` : "Standard values"}
                </span>
              </div>
            </div>

            {/* Ingredients & Festivals split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ingredients */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                  <Utensils className="h-4 w-4 text-brand-500" />
                  <span>Key Ingredients</span>
                </h3>
                {foodDetail.ingredients.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {foodDetail.ingredients.map(ing => (
                      <span 
                        key={ing.id} 
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-950/15 border border-emerald-900/40 text-emerald-400"
                      >
                        {ing.name} <span className="text-[10px] text-emerald-600 font-medium">({ing.category})</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No ingredients registered.</p>
                )}
              </div>

              {/* Festivals / Celebrations */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                  <Flame className="h-4 w-4 text-purple-400" />
                  <span>Served During</span>
                </h3>
                {foodDetail.festivals.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {foodDetail.festivals.map(fest => (
                      <span 
                        key={fest.id} 
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-950/15 border border-purple-900/40 text-purple-400"
                      >
                        🎉 {fest.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Everyday favorite (no specific festival connection).</p>
                )}
              </div>
            </div>

            {/* Restaurants */}
            <div className="space-y-3 border-t border-slate-900 pt-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                <Users className="h-4 w-4 text-pink-400" />
                <span>Available At Restaurants</span>
              </h3>
              {foodDetail.restaurants.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {foodDetail.restaurants.map(rest => (
                    <div key={rest.id} className="p-3 bg-slate-950/30 border border-slate-850 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">{rest.name}</span>
                        <span className="text-[10px] text-slate-500 block">{rest.location}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-950/20 text-pink-400 border border-pink-900/40">In Menu</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Not served in major commercial establishments, home recipe specialty.</p>
              )}
            </div>

            {/* Ingredient-sharing Similar Recipes */}
            <div className="space-y-4 border-t border-slate-900 pt-4">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="h-4.5 w-4.5 text-brand-500" />
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                  Similar Dishes (Shared Ingredients Graph Connection)
                </h3>
              </div>
              {similarFoods.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {similarFoods.map(({ food, shared_ingredients_count, shared_ingredients }) => (
                    <button
                      key={food.id}
                      onClick={() => setSelectedFoodId(food.id)}
                      className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl hover:border-brand-500/20 hover:bg-slate-900/80 transition-all text-left flex flex-col justify-between h-32"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">{food.name}</span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">{food.category} • {food.spice_level} Spice</span>
                      </div>
                      <div className="bg-slate-950/60 rounded-lg p-2 text-[10px] text-slate-400 border border-slate-850 mt-2 truncate w-full">
                        <span className="font-bold text-brand-400">{shared_ingredients_count} shared ingredients: </span>
                        {shared_ingredients.join(", ")}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No ingredient sharing matches.</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-2">
            <AlertTriangle className="h-8 w-8 text-slate-650" />
            <span className="text-sm font-semibold">Select a recipe to explore.</span>
          </div>
        )}
      </div>
    </div>
  );
};
