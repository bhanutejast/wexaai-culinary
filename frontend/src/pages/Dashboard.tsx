import React, { useState, useEffect } from "react";
import { Search, Flame, MapPin, Sparkles, Compass, Heart } from "lucide-react";
import { api } from "../api";
import type { Food, Region, Recommendation } from "../api";
import { Link } from "react-router-dom";

interface DashboardProps {
  activeUser: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ activeUser }) => {
  const [foods, setFoods] = useState<Array<{ f: Food; r: Region | null }>>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [userLikes, setUserLikes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [vegFilter, setVegFilter] = useState<string>("All");
  const [spiceFilter, setSpiceFilter] = useState<string>("All");
  const [regionFilter, setRegionFilter] = useState<string>("All");

  const [stats, setStats] = useState({
    foodCount: 0,
    regionCount: 3,
    ingredientCount: 10,
    activeUserLikes: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch filtered foods (base list)
      const params: any = {};
      if (vegFilter !== "All") params.vegetarian = vegFilter === "Veg";
      if (spiceFilter !== "All") params.spice_level = spiceFilter;
      if (regionFilter !== "All") params.region = regionFilter;
      
      const foodsData = await api.getFoods(params);
      setFoods(foodsData);
      
      // 2. Fetch recommendations for active user
      if (activeUser) {
        const recs = await api.getRecommendations(activeUser, 3);
        // Combine recommendations, prioritizing taste matches
        const combined = [...recs.by_taste, ...recs.by_region];
        // Deduplicate
        const uniqueRecs: Recommendation[] = [];
        const seenIds = new Set<string>();
        for (const r of combined) {
          if (!seenIds.has(r.food.id)) {
            seenIds.add(r.food.id);
            uniqueRecs.push(r);
          }
        }
        setRecommendations(uniqueRecs);

        // Fetch active user likes
        const likes = await api.getUserLikes(activeUser);
        setUserLikes(likes.map(l => l.food_id));
        
        // Update stats
        setStats(prev => ({
          ...prev,
          foodCount: foodsData.length,
          activeUserLikes: likes.length
        }));
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeUser, vegFilter, spiceFilter, regionFilter]);

  const handleToggleLike = async (foodId: string) => {
    const isLiked = userLikes.includes(foodId);
    try {
      await api.toggleUserLike(activeUser, foodId, !isLiked);
      if (isLiked) {
        setUserLikes(prev => prev.filter(id => id !== foodId));
        setStats(prev => ({ ...prev, activeUserLikes: prev.activeUserLikes - 1 }));
      } else {
        setUserLikes(prev => [...prev, foodId]);
        setStats(prev => ({ ...prev, activeUserLikes: prev.activeUserLikes + 1 }));
      }
      // Re-fetch recommendations when likes change
      const recs = await api.getRecommendations(activeUser, 3);
      const combined = [...recs.by_taste, ...recs.by_region];
      const uniqueRecs: Recommendation[] = [];
      const seenIds = new Set<string>();
      for (const r of combined) {
        if (!seenIds.has(r.food.id)) {
          seenIds.add(r.food.id);
          uniqueRecs.push(r);
        }
      }
      setRecommendations(uniqueRecs);
    } catch (err) {
      console.error("Error toggling food like:", err);
    }
  };

  // Filter foods locally by search string
  const filteredFoods = foods.filter(item => 
    item.f.name.toLowerCase().includes(search.toLowerCase()) ||
    item.f.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header */}
      <div className="text-center py-6 max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Discover the Flavors of{" "}
          <span className="bg-gradient-to-r from-brand-500 to-spice-500 bg-clip-text text-transparent">
            Andhra Pradesh
          </span>
        </h1>
        <p className="text-slate-400 text-base sm:text-lg">
          Explore regional delicacies, festival affinities, and ingredients mapped inside our culinary knowledge graph. Toggle user profiles to see graph traversals deliver personalized dishes.
        </p>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Available Dishes", count: stats.foodCount, desc: "Seeded recipes", icon: Compass, color: "text-brand-500" },
          { label: "Origin Regions", count: stats.regionCount, desc: "Andhra & Telangana", icon: MapPin, color: "text-blue-500" },
          { label: "Total Ingredients", count: stats.ingredientCount, desc: "Aromatic botanicals", icon: Flame, color: "text-emerald-500" },
          { label: "Liked by You", count: stats.activeUserLikes, desc: "Active bookmarks", icon: Heart, color: "text-rose-500" }
        ].map((stat, idx) => (
          <div key={idx} className="glass-panel rounded-xl p-5 border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-slate-100">{stat.count}</span>
              <p className="text-xs text-slate-400 mt-1">{stat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Personalized Recommendations Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-brand-500" />
          <h2 className="text-xl font-bold text-slate-100">Personalized Recommendations for {activeUser}</h2>
        </div>

        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map((rec) => (
              <div key={rec.food.id} className="glass-panel rounded-2xl border border-brand-500/20 bg-gradient-to-b from-brand-950/20 to-slate-900/60 p-6 flex flex-col justify-between space-y-4 shadow-lg shadow-brand-500/5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      {rec.food.category}
                    </span>
                    <span className="text-xs font-bold text-brand-500 flex items-center space-x-1">
                      <span>Graph Match Score: {rec.score}</span>
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">{rec.food.name}</h3>
                  <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">{rec.food.description}</p>
                </div>

                <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 text-xs text-slate-300">
                  <span className="font-semibold text-brand-400 block mb-1">Recommendation Path:</span>
                  {rec.reasons[0]?.description}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Link
                    to={`/explorer?selected=${rec.food.id}`}
                    className="text-xs font-bold text-slate-300 hover:text-brand-400 transition-colors"
                  >
                    View Node Connections →
                  </Link>
                  <button
                    onClick={() => handleToggleLike(rec.food.id)}
                    className="p-2 rounded-full border border-slate-800 bg-slate-950/40 hover:bg-slate-900 text-rose-500 transition-colors"
                  >
                    <Heart className="h-4 w-4 fill-rose-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-6 text-center border border-dashed border-slate-800/80">
            <Compass className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <span className="text-sm font-semibold text-slate-400 block">No recommendations yet.</span>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Add some liked foods by clicking the heart button on recipes below to populate your personalized culinary graph.
            </p>
          </div>
        )}
      </div>

      {/* Main Browse Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
          <h2 className="text-xl font-bold text-slate-100">Browse Andhra Culinary Nodes</h2>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </span>
            <input
              type="text"
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900/60 border border-slate-850 rounded-xl pl-9 pr-4 py-2 w-full text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
        </div>

        {/* Filters Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/30 border border-slate-850/60 rounded-2xl p-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Dietary Filter</label>
            <div className="mt-2 flex space-x-1 bg-slate-950/80 p-1 rounded-lg border border-slate-850">
              {["All", "Veg", "Non-Veg"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setVegFilter(opt)}
                  className={`flex-1 text-center py-1 text-xs font-semibold rounded-md transition-colors ${
                    vegFilter === opt ? "bg-brand-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Spice Level</label>
            <div className="mt-2 flex space-x-1 bg-slate-950/80 p-1 rounded-lg border border-slate-850">
              {["All", "Low", "Medium", "High"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSpiceFilter(opt)}
                  className={`flex-1 text-center py-1 text-xs font-semibold rounded-md transition-colors ${
                    spiceFilter === opt ? "bg-spice-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Origin Region</label>
            <div className="mt-2 flex space-x-1 bg-slate-950/80 p-1 rounded-lg border border-slate-850">
              {["All", "Coastal Andhra", "Rayalaseema", "Telangana"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setRegionFilter(opt)}
                  className={`flex-1 text-center py-1 text-xs font-semibold rounded-md transition-colors ${
                    regionFilter === opt ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recipe Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass-panel rounded-2xl p-6 space-y-4 pulse-skeleton border border-slate-850">
                <div className="h-4 bg-slate-800 rounded w-1/4" />
                <div className="h-6 bg-slate-800 rounded w-3/4" />
                <div className="space-y-2">
                  <div className="h-4 bg-slate-800 rounded" />
                  <div className="h-4 bg-slate-800 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredFoods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredFoods.map(({ f, r }) => {
              const isLiked = userLikes.includes(f.id);
              return (
                <div key={f.id} className="glass-panel glass-panel-hover rounded-2xl p-6 border border-slate-800/80 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-850 border border-slate-800 text-slate-400">
                        {f.category}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Flame className={`h-4 w-4 ${f.spice_level === "High" ? "text-spice-500 animate-pulse" : f.spice_level === "Medium" ? "text-amber-500" : "text-emerald-500"}`} />
                        <span className="text-xs font-semibold text-slate-400">{f.spice_level} Spice</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-100">{f.name}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">{f.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-850/50">
                    <span className="text-xs text-slate-500 flex items-center space-x-1">
                      <MapPin className="h-3.5 w-3.5 text-blue-500" />
                      <span>{r?.name || "Unknown Region"}</span>
                    </span>

                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/explorer?selected=${f.id}`}
                        className="text-xs font-bold text-brand-500 hover:underline"
                      >
                        Explore Graph
                      </Link>
                      <button
                        onClick={() => handleToggleLike(f.id)}
                        className={`p-2 rounded-full border ${
                          isLiked 
                            ? "bg-rose-950/20 border-rose-900 text-rose-500" 
                            : "bg-slate-950/40 border-slate-800 text-slate-500 hover:text-rose-500"
                        } transition-colors`}
                      >
                        <Heart className={`h-4 w-4 ${isLiked ? "fill-rose-500" : ""}`} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-12 text-center border border-slate-850">
            <Compass className="h-10 w-10 text-slate-650 mx-auto mb-2" />
            <span className="text-base font-semibold text-slate-400 block">No recipes found matching these filters.</span>
            <p className="text-xs text-slate-500 mt-1">Try broadening your search criteria or resetting filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};
