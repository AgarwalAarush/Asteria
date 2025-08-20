import { useCallback } from "react";
import { useReactFlow } from "reactflow";
import { layoutDAGAll, layoutDAGIncremental } from "../lib/layout";

export function useAutoLayout() {
  const { getNodes, setNodes, getEdges } = useReactFlow();

  const relayoutAll = useCallback(() => {
    const nodes = getNodes(); 
    const edges = getEdges();
    setNodes(layoutDAGAll(nodes, edges));
  }, [getNodes, getEdges, setNodes]);

  const relayoutFrom = useCallback((changedId: string) => {
    const nodes = getNodes(); 
    const edges = getEdges();
    setNodes(layoutDAGIncremental(nodes, edges, changedId));
  }, [getNodes, getEdges, setNodes]);

  return { relayoutAll, relayoutFrom };
}