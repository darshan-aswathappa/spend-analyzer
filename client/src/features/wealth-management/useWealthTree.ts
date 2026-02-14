import { useMemo, useCallback, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNodesState, useEdgesState, type Node, type Edge } from '@xyflow/react';
import type { RootState, AppDispatch } from '@/app/store';
import type { WealthNodeData, WealthEdgeData } from './types';
import { resetTree } from './wealthManagementSlice';

interface LayoutResult {
  nodes: Node<WealthNodeData & { isRoot: boolean; hasChildren: boolean }>[];
  edges: Edge<WealthEdgeData>[];
}

function computeLayout(tree: RootState['wealthManagement']['tree']): LayoutResult {
  const { nodes: treeNodes, edges: treeEdges, rootId } = tree;

  // Build children map
  const childrenMap: Record<string, string[]> = {};
  for (const edge of Object.values(treeEdges)) {
    if (!childrenMap[edge.sourceId]) childrenMap[edge.sourceId] = [];
    childrenMap[edge.sourceId].push(edge.targetId);
  }

  // Calculate subtree widths for proper centering
  const NODE_WIDTH = 220;
  const H_GAP = 60;
  const V_GAP = 160;

  const subtreeWidths: Record<string, number> = {};

  function calcWidth(nodeId: string): number {
    const children = childrenMap[nodeId] || [];
    if (children.length === 0) {
      subtreeWidths[nodeId] = NODE_WIDTH;
      return NODE_WIDTH;
    }
    const totalChildrenWidth = children.reduce(
      (sum, childId) => sum + calcWidth(childId),
      0
    );
    const width = totalChildrenWidth + H_GAP * (children.length - 1);
    subtreeWidths[nodeId] = Math.max(NODE_WIDTH, width);
    return subtreeWidths[nodeId];
  }

  if (treeNodes[rootId]) {
    calcWidth(rootId);
  }

  // Position nodes
  const positions: Record<string, { x: number; y: number }> = {};

  function positionNode(nodeId: string, centerX: number, y: number) {
    positions[nodeId] = { x: centerX - NODE_WIDTH / 2, y };

    const children = childrenMap[nodeId] || [];
    if (children.length === 0) return;

    const totalWidth =
      children.reduce((sum, cid) => sum + subtreeWidths[cid], 0) +
      H_GAP * (children.length - 1);

    let startX = centerX - totalWidth / 2;
    for (const childId of children) {
      const childWidth = subtreeWidths[childId];
      positionNode(childId, startX + childWidth / 2, y + V_GAP);
      startX += childWidth + H_GAP;
    }
  }

  if (treeNodes[rootId]) {
    positionNode(rootId, 0, 0);
  }

  // Build React Flow nodes
  const flowNodes: LayoutResult['nodes'] = Object.values(treeNodes).map((node) => ({
    id: node.id,
    type: 'wealth',
    position: positions[node.id] || { x: 0, y: 0 },
    data: {
      ...node,
      isRoot: node.id === rootId,
      hasChildren: (childrenMap[node.id] || []).length > 0,
    },
  }));

  // Build React Flow edges
  const flowEdges: LayoutResult['edges'] = Object.values(treeEdges).map((edge) => ({
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

  const layout = useMemo(() => computeLayout(tree), [tree]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layout.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layout.edges);

  // Track previous layout to detect changes from Redux
  const prevLayoutRef = useRef(layout);

  useEffect(() => {
    if (prevLayoutRef.current !== layout) {
      prevLayoutRef.current = layout;
      setNodes(layout.nodes);
      setEdges(layout.edges);
    }
  }, [layout, setNodes, setEdges]);

  const reset = useCallback(() => {
    dispatch(resetTree());
  }, [dispatch]);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    reset,
  };
}
