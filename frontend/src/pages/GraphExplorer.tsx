import React, { useState, useEffect } from "react";
import { GraphVisualizer } from "../components/GraphVisualizer";
import { api } from "../api";
import type { GraphNode, GraphData } from "../api";
import { Network, Activity, HelpCircle, Sliders, RefreshCw, X } from "lucide-react";

interface GraphExplorerProps {
  activeUser: string;
}

export const GraphExplorer: React.FC<GraphExplorerProps> = ({ activeUser }) => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Settings
  const [layout, setLayout] = useState<"cose" | "circle" | "grid" | "concentric">("cose");
  const [graphType, setGraphType] = useState<"global" | "user">("global");
  
  // Selected Node Details
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const fetchGraph = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      let data: GraphData;
      if (graphType === "user") {
        data = await api.getUserGraphData(activeUser);
      } else {
        data = await api.getGraphData(60);
      }
      setGraphData(data);
      setSelectedNode(null); // Reset selection
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to load graph nodes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [graphType, activeUser]);

  const legendItems = [
    { label: "Food", color: "bg-[#f97316]", desc: "Orange (Central node)" },
    { label: "User", color: "bg-[#ef4444]", desc: "Red (Diet preferences)" },
    { label: "Region", color: "bg-[#3b82f6]", desc: "Blue (Culinary cradle)" },
    { label: "Ingredient", color: "bg-[#10b981]", desc: "Green (Recipe elements)" },
    { label: "TasteProfile", color: "bg-[#6366f1]", desc: "Indigo (Sensory notes)" },
    { label: "Festival", color: "bg-[#a855f7]", desc: "Purple (Celebration affinities)" },
    { label: "Restaurant", color: "bg-[#ec4899]", desc: "Pink (Sourcing joints)" },
    { label: "Nutrition", color: "bg-[#eab308]", desc: "Yellow (Calorie density)" }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-4rem)] flex flex-col space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-slate-900/40 border border-slate-850 p-4 rounded-2xl">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">Andhra Culinary Graph Canvas</h1>
            <p className="text-xs text-slate-400">Interactive spatial mapping of recipe networks</p>
          </div>
        </div>

        {/* Configurations */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Subgraph Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setGraphType("global")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                graphType === "global" ? "bg-brand-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Global network
            </button>
            <button
              onClick={() => setGraphType("user")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                graphType === "user" ? "bg-brand-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {activeUser}'s Likes
            </button>
          </div>

          {/* Layout Selector */}
          <select
            value={layout}
            onChange={(e: any) => setLayout(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-brand-500 transition-colors"
          >
            <option value="cose">Force-Directed (Cose)</option>
            <option value="circle">Circular Layout</option>
            <option value="concentric">Concentric Rings</option>
            <option value="grid">Orthogonal Grid</option>
          </select>

          {/* Refresh button */}
          <button
            onClick={fetchGraph}
            className="p-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 transition-colors"
            title="Reload graph data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Left Interactive Window */}
        <div className="flex-1 glass-panel rounded-2xl border border-slate-800/80 relative overflow-hidden flex flex-col justify-end">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-sm z-10 space-y-3">
              <Activity className="h-8 w-8 text-brand-500 animate-spin" />
              <span className="text-sm font-semibold text-slate-400">Constructing culinary network...</span>
            </div>
          ) : errorMsg ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 space-y-2">
              <span className="text-sm font-semibold text-rose-400">{errorMsg}</span>
              <p className="text-xs text-slate-500 max-w-sm">
                If the database is currently empty, make sure you trigger a database seed to populate nodes.
              </p>
            </div>
          ) : (
            <GraphVisualizer
              nodes={graphData.nodes}
              edges={graphData.edges}
              onNodeSelect={setSelectedNode}
              layoutName={layout}
            />
          )}

          {/* Legend Banner overlay */}
          <div className="absolute top-4 left-4 z-10 glass-panel border-slate-800/85 p-3 rounded-xl max-w-[200px] sm:max-w-xs space-y-2 shadow-2xl hidden sm:block">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Node Labels Legend</span>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
              {legendItems.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.color} shrink-0`} />
                  <span className="text-[10px] text-slate-350 truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Info Drawer */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
          {/* Legend for mobile */}
          <div className="sm:hidden glass-panel rounded-2xl border border-slate-800/80 p-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Node Color Legend</span>
            <div className="flex flex-wrap gap-2">
              {legendItems.map((item, idx) => (
                <span key={idx} className="inline-flex items-center space-x-1.5 px-2 py-1 rounded bg-slate-950 text-[10px] border border-slate-850">
                  <span className={`h-1.5 w-1.5 rounded-full ${item.color}`} />
                  <span className="text-slate-400 font-medium">{item.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Property Drawer */}
          <div className="flex-1 glass-panel rounded-2xl border border-slate-800/80 p-5 flex flex-col justify-between">
            {selectedNode ? (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-850 pb-3">
                  <div className="space-y-1.5">
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wide border ${
                      selectedNode.label === "Food" ? "bg-orange-950/30 border-orange-900 text-orange-400" :
                      selectedNode.label === "User" ? "bg-rose-950/30 border-rose-900 text-rose-400" :
                      selectedNode.label === "Region" ? "bg-blue-950/30 border-blue-900 text-blue-400" :
                      selectedNode.label === "Ingredient" ? "bg-emerald-950/30 border-emerald-900 text-emerald-400" :
                      "bg-slate-900 border-slate-850 text-slate-400"
                    }`}>
                      {selectedNode.label} Node
                    </span>
                    <h3 className="text-base font-extrabold text-slate-100">{selectedNode.title}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1 hover:bg-slate-800 text-slate-500 hover:text-slate-300 rounded-md transition-colors"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Properties list */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {Object.entries(selectedNode.properties || {}).length > 0 ? (
                    Object.entries(selectedNode.properties).map(([key, val]) => {
                      if (key === "id") return null;
                      return (
                        <div key={key} className="space-y-1 bg-slate-950/40 p-2.5 border border-slate-900 rounded-lg">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            {key.replace("_", " ")}
                          </span>
                          <span className="text-xs font-semibold text-slate-200 block break-words">
                            {typeof val === "boolean" ? (val ? "Yes" : "No") : String(val)}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-500 italic p-2 text-center">
                      No custom properties loaded for this node label.
                    </div>
                  )}
                </div>

                {/* Subgraph helper */}
                {selectedNode.label === "Food" && (
                  <div className="pt-2">
                    <a
                      href={`/explorer?selected=${selectedNode.id}`}
                      className="inline-flex justify-center w-full py-2 px-3 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg transition-colors text-center"
                    >
                      Browse Ingredients & Details
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
                <Sliders className="h-10 w-10 text-slate-650" />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 block">No Node Selected</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-[200px] mx-auto">
                    Click any node inside the canvas to inspect its full properties, categories, and connection tags.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Helper Notice */}
            <div className="mt-4 p-3 bg-slate-950/30 border border-slate-850 rounded-xl flex items-start space-x-2">
              <HelpCircle className="h-4.5 w-4.5 text-slate-600 shrink-0 mt-0.5" />
              <div className="text-[10px] text-slate-500 leading-normal">
                Use your mouse wheel to zoom. Click and drag nodes to customize the layout. Click "Recenter" to focus the viewport.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
