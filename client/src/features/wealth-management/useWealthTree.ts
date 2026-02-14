import { useMemo, useCallback, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type OnConnect,
} from '@xyflow/react';
import type { RootState, AppDispatch } from '@/app/store';
import type { WealthNodeData, WealthEdgeData } from './types';
import { resetTree, addSourceNode, connectNodes } from './wealthManagementSlice';

const NODE_WIDTH = 220;
const H_GAP = 80;
const V_GAP = 180;

// Compute a structural fingerprint: changes only when nodes/edges are added or removed
function getStructureKey(tree: RootState['wealthManagement']['tree']): string {
  const nodeIds = Object.keys(tree.nodes).sort().join(',');
  const edgeIds = Object.keys(tree.edges).sort().join(',');
  return `${nodeIds}|${edgeIds}`;
}

function computeLayout(tree: RootState['wealthManagement']['tree']) {
  const { nodes: treeNodes, edges: treeEdges } = tree;

  // Build adjacency maps
  const childrenMap: Record<string, string[]> = {};
  const parentMap: Record<string, string[]> = {};

  for (const nodeId of Object.keys(treeNodes)) {
    childrenMap[nodeId] = [];
    parentMap[nodeId] = [];
  }

  for (const edge of Object.values(treeEdges)) {
    childrenMap[edge.sourceId]?.push(edge.targetId);
    parentMap[edge.targetId]?.push(edge.sourceId);
  }

  // Find root nodes (no incoming edges)
  const rootIds = Object.keys(treeNodes).filter(
    (id) => (parentMap[id] || []).length === 0
  );

  // For DAG layout, we need to assign levels (longest path from any root)
  const levels: Record<string, number> = {};

  // BFS from all roots to assign levels
  function assignLevels() {
    const queue: { id: string; level: number }[] = rootIds.map((id) => ({ id, level: 0 }));
    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      // Take the maximum level if visited from multiple paths
      if (levels[id] !== undefined && levels[id] >= level) continue;
      levels[id] = level;
      for (const childId of childrenMap[id] || []) {
        queue.push({ id: childId, level: level + 1 });
      }
    }
  }

  assignLevels();

  // Group nodes by level
  const levelGroups: Record<number, string[]> = {};
  for (const [nodeId, level] of Object.entries(levels)) {
    if (!levelGroups[level]) levelGroups[level] = [];
    levelGroups[level].push(nodeId);
  }

  // Position nodes: each level is a row, nodes spread horizontally
  const positions: Record<string, { x: number; y: number }> = {};
  const maxLevel = Math.max(...Object.values(levels), 0);

  for (let level = 0; level <= maxLevel; level++) {
    const nodesAtLevel = levelGroups[level] || [];
    const totalWidth = nodesAtLevel.length * NODE_WIDTH + (nodesAtLevel.length - 1) * H_GAP;
    let startX = -totalWidth / 2;

    for (const nodeId of nodesAtLevel) {
      positions[nodeId] = { x: startX, y: level * V_GAP };
      startX += NODE_WIDTH + H_GAP;
    }
  }

  return positions;
}

function buildFlowData(tree: RootState['wealthManagement']['tree'], positions: Record<string, { x: number; y: number }>) {
  const { nodes: treeNodes, edges: treeEdges } = tree;

  const childrenMap: Record<string, string[]> = {};
  const parentMap: Record<string, string[]> = {};

  for (const nodeId of Object.keys(treeNodes)) {
    childrenMap[nodeId] = [];
    parentMap[nodeId] = [];
  }

  for (const edge of Object.values(treeEdges)) {
    childrenMap[edge.sourceId]?.push(edge.targetId);
    parentMap[edge.targetId]?.push(edge.sourceId);
  }

  const flowNodes: Node<WealthNodeData & { hasChildren: boolean; hasParents: boolean }>[] =
    Object.values(treeNodes).map((node) => ({
      id: node.id,
      type: 'wealth',
      position: positions[node.id] || { x: 0, y: 0 },
      data: {
        ...node,
        hasChildren: (childrenMap[node.id] || []).length > 0,
        hasParents: (parentMap[node.id] || []).length > 0,
      },
    }));

  const flowEdges: Edge<WealthEdgeData>[] = Object.values(treeEdges).map((edge) => ({
    id: edge.id,
    source: edge.sourceId,
    target: edge.targetId,
    type: 'money',
    data: edge,
  }));

  return { nodes: flowNodes, edges: flowEdges };
}

export function useWealthTree() {
  const dispatch = useDispatch<AppDispatch>();
  const tree = useSelector((state: RootState) => state.wealthManagement.tree);

  // Track structural changes separately from data changes
  const structureKey = useMemo(() => getStructureKey(tree), [tree]);
  const prevStructureKeyRef = useRef(structureKey);
  const positionsRef = useRef<Record<string, { x: number; y: number }>>({});

  // Only recompute layout when structure changes
  if (prevStructureKeyRef.current !== structureKey) {
    prevStructureKeyRef.current = structureKey;
    positionsRef.current = computeLayout(tree);
  } else if (Object.keys(positionsRef.current).length === 0) {
    // Initial layout
    positionsRef.current = computeLayout(tree);
  }

  const flowData = useMemo(
    () => buildFlowData(tree, positionsRef.current),
    [tree]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(flowData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowData.edges);

  const prevFlowDataRef = useRef(flowData);
  const structureChangedRef = useRef(false);

  // Detect if this is a structure change or just a data change
  useEffect(() => {
    if (prevFlowDataRef.current === flowData) return;

    const prevNodeIds = prevFlowDataRef.current.nodes.map((n) => n.id).sort().join(',');
    const newNodeIds = flowData.nodes.map((n) => n.id).sort().join(',');
    const prevEdgeIds = prevFlowDataRef.current.edges.map((e) => e.id).sort().join(',');
    const newEdgeIds = flowData.edges.map((e) => e.id).sort().join(',');

    const isStructureChange = prevNodeIds !== newNodeIds || prevEdgeIds !== newEdgeIds;
    prevFlowDataRef.current = flowData;

    if (isStructureChange) {
      // Structure changed: preserve existing node positions, only use computed positions for new nodes
      structureChangedRef.current = true;
      setNodes((currentNodes) => {
        const currentPositions = new Map(currentNodes.map((n) => [n.id, n.position]));
        return flowData.nodes.map((node) => {
          const existingPos = currentPositions.get(node.id);
          if (existingPos) {
            return { ...node, position: existingPos };
          }
          return node;
        });
      });
      setEdges(flowData.edges);
    } else {
      // Only data changed: update data in-place, preserve user-dragged positions
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          const updated = flowData.nodes.find((n) => n.id === node.id);
          if (!updated) return node;
          return { ...node, data: updated.data };
        })
      );
      setEdges(flowData.edges);
    }
  }, [flowData, setNodes, setEdges]);

  // Fit view after structure change
  const reactFlow = useReactFlow();
  useEffect(() => {
    if (structureChangedRef.current) {
      structureChangedRef.current = false;
      // Small delay to let React Flow render the new nodes
      const timer = setTimeout(() => {
        reactFlow.fitView({ duration: 300, padding: 0.2 });
      }, 50);
      return () => clearTimeout(timer);
    }
  });

  const reset = useCallback(() => {
    dispatch(resetTree());
    positionsRef.current = {};
  }, [dispatch]);

  const addSource = useCallback(() => {
    dispatch(addSourceNode());
  }, [dispatch]);

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (connection.source && connection.target) {
        dispatch(connectNodes({ sourceId: connection.source, targetId: connection.target }));
      }
    },
    [dispatch]
  );

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    reset,
    addSource,
  };
}
