import React, { useState, useEffect } from "react";
import { api } from "../api";
import type { Recommendation } from "../api";
import { Sparkles, GitMerge, MapPin, Heart } from "lucide-react";
import { Link } from "react-router-dom";

interface RecommendationsProps {
  activeUser: string;
}

export const Recommendations: React.FC<RecommendationsProps> = ({ activeUser }) => {
  const [recs, setRecs] = useState<{ by_taste: Recommendation[]; by_region: Recommendation[] }>({
    by_taste: [],
    by_region: []
  });
  const [userLikes, setUserLikes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadRecommendations = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      if (activeUser) {
        const data = await api.getRecommendations(activeUser, 6);
        setRecs(data);

        const likes = await api.getUserLikes(activeUser);
        setUserLikes(likes.map(l => l.food_id));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to retrieve recommendations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [activeUser]);

  const handleToggleLike = async (foodId: string) => {
    const isLiked = userLikes.includes(foodId);
    try {
      await api.toggleUserLike(activeUser, foodId, !isLiked);
      if (isLiked) {
        setUserLikes(prev => prev.filter(id => id !== foodId));
      } else {
        setUserLikes(prev => [...prev, foodId]);
      }
      // Reload recommendation lists
      loadRecommendations();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-900 pb-5 space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-100 flex items-center space-x-2">
          <Sparkles className="h-6 w-6 text-brand-500" />
          <span>Personalized Culinary Discovery</span>
        </h1>
        <p className="text-slate-400 text-sm max-w-3xl">
          Graph databases excel at querying relationships. Traditional relational databases require expensive multi-table 
          JOIN operations, whereas CognoDB traverses nodes along pre-indexed edges instantly. Below is your tailored selection 
          and the Cypher traversal paths that mapped them.
        </p>
      </div>

      {/* Traversal Theory / Explainers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Taste-based Explainer */}
        <div className="bg-slate-900/40 border border-indigo-900/20 bg-gradient-to-br from-indigo-950/5 to-slate-900/60 p-5 rounded-2xl space-y-3">
          <div className="flex items-center space-x-2">
            <GitMerge className="h-4.5 w-4.5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-200">Taste Profile Matching (Traversal Q1)</h3>
          </div>
          <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-850 font-mono text-[10px] text-indigo-300 leading-normal overflow-x-auto whitespace-nowrap">
            (User: {activeUser}) -[:LIKES]-&gt; (Food) -[:HAS_TASTE]-&gt; (Taste) &lt;-[:HAS_TASTE]- (RecFood)
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Recommends dishes that match the <strong>taste profiles</strong> (e.g., Sweet, Spicy, Sour) of foods you already like. 
            For example, liking <em>Bobbatlu</em> (Sweet) causes the database to traverse to the <em>Sweet</em> Taste node, and then 
            find other sweet nodes like <em>Pootharekulu</em>.
          </p>
        </div>

        {/* Region-based Explainer */}
        <div className="bg-slate-900/40 border border-blue-900/20 bg-gradient-to-br from-blue-950/5 to-slate-900/60 p-5 rounded-2xl space-y-3">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4.5 w-4.5 text-blue-400" />
            <h3 className="text-sm font-bold text-slate-200">Regional Affinity matching (Traversal Q2)</h3>
          </div>
          <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-850 font-mono text-[10px] text-blue-300 leading-normal overflow-x-auto whitespace-nowrap">
            (User: {activeUser}) -[:LIKES]-&gt; (Food) -[:ORIGINATED_FROM]-&gt; (Region) &lt;-[:ORIGINATED_FROM]- (RecFood)
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Recommends dishes originating from the same <strong>geographical region</strong> (e.g., Coastal Andhra, Telangana) 
            as foods you already like. Liking multiple Coastal Andhra chutneys alerts the recommender that you favor Coastal recipes.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pulse-skeleton">
          <div className="h-48 bg-slate-900/50 rounded-2xl" />
          <div className="h-48 bg-slate-900/50 rounded-2xl" />
        </div>
      ) : errorMsg ? (
        <div className="text-center p-8 bg-slate-900/30 rounded-2xl border border-slate-850">
          <p className="text-sm text-rose-400">{errorMsg}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Taste List */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-200 flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <span>Taste Traversal Recommendations ({recs.by_taste.length})</span>
            </h2>

            {recs.by_taste.length > 0 ? (
              <div className="space-y-4">
                {recs.by_taste.map((rec) => (
                  <div key={rec.food.id} className="glass-panel rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between h-44">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-950/20 text-indigo-400 border border-indigo-900/30">
                          {rec.food.category}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                          Match Strength: {rec.score}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-200">{rec.food.name}</h3>
                      <p className="text-xs text-slate-450 leading-relaxed line-clamp-2">{rec.food.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-850/40">
                      <span className="text-[10px] text-slate-500 font-semibold">{rec.reasons[0]?.description}</span>
                      <div className="flex items-center space-x-2">
                        <Link to={`/explorer?selected=${rec.food.id}`} className="text-xs font-bold text-indigo-400 hover:underline">
                          View details
                        </Link>
                        <button
                          onClick={() => handleToggleLike(rec.food.id)}
                          className="p-1.5 rounded-full border border-slate-800 bg-slate-950 text-rose-500 hover:bg-slate-900"
                        >
                          <Heart className={`h-4.5 w-4.5 ${userLikes.includes(rec.food.id) ? "fill-rose-500" : ""}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel rounded-2xl p-8 text-center text-slate-550 border border-dashed border-slate-850">
                No taste recommendations. Try liking more sweet or spicy foods to bridge taste connections.
              </div>
            )}
          </div>

          {/* Region List */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-200 flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Regional Traversal Recommendations ({recs.by_region.length})</span>
            </h2>

            {recs.by_region.length > 0 ? (
              <div className="space-y-4">
                {recs.by_region.map((rec) => (
                  <div key={rec.food.id} className="glass-panel rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between h-44">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-950/20 text-blue-400 border border-blue-900/30">
                          {rec.food.category}
                        </span>
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                          Match Strength: {rec.score}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-200">{rec.food.name}</h3>
                      <p className="text-xs text-slate-450 leading-relaxed line-clamp-2">{rec.food.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-850/40">
                      <span className="text-[10px] text-slate-500 font-semibold">{rec.reasons[0]?.description}</span>
                      <div className="flex items-center space-x-2">
                        <Link to={`/explorer?selected=${rec.food.id}`} className="text-xs font-bold text-blue-400 hover:underline">
                          View details
                        </Link>
                        <button
                          onClick={() => handleToggleLike(rec.food.id)}
                          className="p-1.5 rounded-full border border-slate-800 bg-slate-950 text-rose-500 hover:bg-slate-900"
                        >
                          <Heart className={`h-4.5 w-4.5 ${userLikes.includes(rec.food.id) ? "fill-rose-500" : ""}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel rounded-2xl p-8 text-center text-slate-550 border border-dashed border-slate-850">
                No regional recommendations. Try liking foods originating from Coastal Andhra or Rayalaseema to seed affinities.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
