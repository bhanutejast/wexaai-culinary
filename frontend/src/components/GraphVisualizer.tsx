import React, { useEffect, useRef } from "react";
import cytoscape from "cytoscape";
import type { GraphNode, GraphEdge } from "../api";

interface GraphVisualizerProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeSelect?: (node: GraphNode) => void;
  layoutName?: "cose" | "circle" | "grid" | "concentric";
}

export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
  nodes,
  edges,
  onNodeSelect,
  layoutName = "cose"
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Convert API nodes/edges into Cytoscape format
    const cyNodes = nodes.map(node => ({
      data: {
        id: node.id,
        label: node.label,
        title: node.title,
        properties: node.properties
      }
    }));

    const cyEdges = edges.map(edge => ({
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        properties: edge.properties
      }
    }));

    // Initialize Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements: [...cyNodes, ...cyEdges],
      style: [
        {
          selector: "node",
          style: {
            "label": "data(title)",
            "color": "#cbd5e1", // text slate-300
            "font-size": "10px",
            "font-family": "Inter, system-ui, sans-serif",
            "text-valign": "bottom",
            "text-margin-y": 6,
            "background-color": "#475569",
            "border-width": "3px",
            "border-color": "#1e293b",
            "width": "24px",
            "height": "24px",
            "transition-property": "background-color, border-color, width, height",
            "transition-duration": 0.2,
            "overlay-opacity": 0
          }
        },
        {
          selector: "node[label='Food']",
          style: {
            "background-color": "#f97316", // brand Orange
            "border-color": "#431407", // dark orange
            "width": "36px",
            "height": "36px",
            "font-weight": "bold",
            "color": "#f97316"
          }
        },
        {
          selector: "node[label='User']",
          style: {
            "background-color": "#ef4444", // Spicy red
            "border-color": "#450a0a",
            "width": "34px",
            "height": "34px",
            "font-weight": "bold",
            "color": "#ef4444"
          }
        },
        {
          selector: "node[label='Ingredient']",
          style: {
            "background-color": "#10b981", // Forest green
            "border-color": "#022c22",
            "width": "22px",
            "height": "22px"
          }
        },
        {
          selector: "node[label='Region']",
          style: {
            "background-color": "#3b82f6", // Royal blue
            "border-color": "#172554",
            "width": "28px",
            "height": "28px",
            "font-weight": "bold"
          }
        },
        {
          selector: "node[label='TasteProfile']",
          style: {
            "background-color": "#6366f1", // Indigo
            "border-color": "#1e1b4b",
            "width": "24px",
            "height": "24px"
          }
        },
        {
          selector: "node[label='Festival']",
          style: {
            "background-color": "#a855f7", // Purple
            "border-color": "#2e1065",
            "width": "26px",
            "height": "26px"
          }
        },
        {
          selector: "node[label='Restaurant']",
          style: {
            "background-color": "#ec4899", // Pink
            "border-color": "#500724",
            "width": "26px",
            "height": "26px"
          }
        },
        {
          selector: "node[label='Nutrition']",
          style: {
            "background-color": "#eab308", // Yellow
            "border-color": "#422006",
            "width": "20px",
            "height": "20px"
          }
        },
        {
          selector: "edge",
          style: {
            "width": 2,
            "line-color": "#334155", // slate-700
            "target-arrow-color": "#334155",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "control-point-step-size": 40,
            "label": "data(type)",
            "font-size": "7px",
            "font-weight": "bold",
            "color": "#94a3b8", // slate-400
            "text-rotation": "autorotate",
            "text-background-opacity": 0.8,
            "text-background-color": "#020617", // slate-950
            "text-background-padding": "2px",
            "text-background-shape": "roundrectangle",
            "overlay-opacity": 0
          }
        },
        {
          selector: "edge[type='LIKES']",
          style: {
            "line-color": "#ef4444",
            "target-arrow-color": "#ef4444",
            "width": 2.5
          }
        },
        {
          selector: "edge[type='CONTAINS']",
          style: {
            "line-color": "#0f766e"
          }
        },
        {
          selector: "node:selected",
          style: {
            "border-color": "#f97316",
            "border-width": "4px"
          }
        }
      ],
      layout: {
        name: layoutName as any,
        animate: true,
        fit: true,
        padding: 50,
        nodeOverlap: 20,
        componentSpacing: 100,
        refresh: 20,
        idealEdgeLength: () => 60,
        edgeElasticity: () => 100
      } as any
    });

    cyRef.current = cy;

    // Handle node selection events
    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      if (onNodeSelect) {
        onNodeSelect({
          id: node.data("id"),
          label: node.data("label"),
          title: node.data("title"),
          properties: node.data("properties") || {}
        });
      }
    });

    // Cleanup on unmount
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [nodes, edges, layoutName]);

  // Adjust zoom fit
  const handleRecenter = () => {
    if (cyRef.current) {
      cyRef.current.fit();
      cyRef.current.animate({ zoom: cyRef.current.zoom() * 0.9 }, { duration: 300 });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <div ref={containerRef} className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden" />
      <button
        onClick={handleRecenter}
        className="absolute bottom-4 right-4 z-10 px-3 py-2 text-xs font-bold bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors shadow-lg backdrop-blur-sm"
      >
        Recenter Graph
      </button>
    </div>
  );
};
