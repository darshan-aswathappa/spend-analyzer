import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { WealthTreeState, WealthFlow, WealthAsset, AssetNodeLink, SplitMode } from './types';

function createInitialTree(): WealthTreeState {
  return {
    nodes: {
      'node-1': {
        id: 'node-1',
        label: 'Estate',
        amount: 5000,
        splitMode: 'percentage',
        isSource: true,
      },
    },
    edges: {},
    nextNodeNum: 2,
  };
}

// Topological sort for DAG recalculation (handles multiple parents)
function topologicalSort(state: WealthTreeState): string[] {
  const inDegree: Record<string, number> = {};
  const adjList: Record<string, string[]> = {};

  for (const nodeId of Object.keys(state.nodes)) {
    inDegree[nodeId] = 0;
    adjList[nodeId] = [];
  }

  for (const edge of Object.values(state.edges)) {
    inDegree[edge.targetId] = (inDegree[edge.targetId] || 0) + 1;
    if (!adjList[edge.sourceId]) adjList[edge.sourceId] = [];
    adjList[edge.sourceId].push(edge.targetId);
  }

  const queue = Object.keys(inDegree).filter((id) => inDegree[id] === 0);
  const sorted: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);
    for (const neighbor of adjList[current] || []) {
      inDegree[neighbor] -= 1;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  return sorted;
}

function recalculate(state: WealthTreeState) {
  const sorted = topologicalSort(state);

  for (const nodeId of sorted) {
    const node = state.nodes[nodeId];
    if (!node) continue;

    // Source nodes keep their user-set amount
    if (node.isSource) continue;

    // Non-source nodes: amount = sum of all incoming edge contributions
    const incomingEdges = Object.values(state.edges).filter((e) => e.targetId === nodeId);
    let total = 0;

    for (const edge of incomingEdges) {
      const parent = state.nodes[edge.sourceId];
      if (!parent) continue;

      if (parent.splitMode === 'percentage') {
        total += Math.round((parent.amount * edge.percentage) / 100 * 100) / 100;
      } else {
        total += edge.exactAmount;
      }
    }

    node.amount = Math.round(total * 100) / 100;
  }
}

function getDescendantIds(state: WealthTreeState, nodeId: string): string[] {
  const result: string[] = [];
  const queue = [nodeId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const childEdges = Object.values(state.edges).filter((e) => e.sourceId === current);
    for (const edge of childEdges) {
      if (!result.includes(edge.targetId)) {
        result.push(edge.targetId);
        queue.push(edge.targetId);
      }
    }
  }
  return result;
}

// Check if adding an edge would create a cycle
function wouldCreateCycle(state: WealthTreeState, sourceId: string, targetId: string): boolean {
  if (sourceId === targetId) return true;
  // Check if targetId can reach sourceId (if so, adding sourceId->targetId creates a cycle)
  const visited = new Set<string>();
  const queue = [targetId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === sourceId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    const outEdges = Object.values(state.edges).filter((e) => e.sourceId === current);
    for (const edge of outEdges) {
      queue.push(edge.targetId);
    }
  }
  return false;
}

// Helper to clean up asset links for a set of node IDs
function cleanupLinksForNodes(
  assetNodeLinks: Record<string, AssetNodeLink>,
  nodeIds: Set<string>
) {
  for (const linkKey of Object.keys(assetNodeLinks)) {
    if (nodeIds.has(assetNodeLinks[linkKey].nodeId)) {
      delete assetNodeLinks[linkKey];
    }
  }
}

interface WealthManagementState {
  flows: Record<string, WealthFlow>;
  assets: Record<string, WealthAsset>;
  assetNodeLinks: Record<string, AssetNodeLink>;
  nextFlowNum: number;
  nextAssetNum: number;
}

const initialState: WealthManagementState = {
  flows: {
    'flow-1': {
      id: 'flow-1',
      name: 'Estate Plan',
      createdAt: Date.now(),
      tree: createInitialTree(),
    },
  },
  assets: {},
  assetNodeLinks: {},
  nextFlowNum: 2,
  nextAssetNum: 1,
};

const wealthManagementSlice = createSlice({
  name: 'wealthManagement',
  initialState,
  reducers: {
    // --- Flow management ---
    createFlow(state, action: PayloadAction<{ name: string }>) {
      const id = `flow-${state.nextFlowNum}`;
      state.nextFlowNum += 1;
      state.flows[id] = {
        id,
        name: action.payload.name,
        createdAt: Date.now(),
        tree: createInitialTree(),
      };
    },

    deleteFlow(state, action: PayloadAction<{ flowId: string }>) {
      const flow = state.flows[action.payload.flowId];
      if (!flow) return;
      const nodeIds = new Set(Object.keys(flow.tree.nodes));
      cleanupLinksForNodes(state.assetNodeLinks, nodeIds);
      delete state.flows[action.payload.flowId];
    },

    renameFlow(state, action: PayloadAction<{ flowId: string; name: string }>) {
      const flow = state.flows[action.payload.flowId];
      if (flow) flow.name = action.payload.name;
    },

    // --- Asset management ---
    createAsset(state, action: PayloadAction<{ name: string; category: string; estimatedValue: number }>) {
      const id = `asset-${state.nextAssetNum}`;
      state.nextAssetNum += 1;
      state.assets[id] = {
        id,
        name: action.payload.name,
        category: action.payload.category,
        estimatedValue: action.payload.estimatedValue,
      };
    },

    deleteAsset(state, action: PayloadAction<{ assetId: string }>) {
      delete state.assets[action.payload.assetId];
      for (const linkKey of Object.keys(state.assetNodeLinks)) {
        if (state.assetNodeLinks[linkKey].assetId === action.payload.assetId) {
          delete state.assetNodeLinks[linkKey];
        }
      }
    },

    linkAssetToNode(state, action: PayloadAction<{ assetId: string; nodeId: string }>) {
      const key = `${action.payload.assetId}:${action.payload.nodeId}`;
      state.assetNodeLinks[key] = {
        assetId: action.payload.assetId,
        nodeId: action.payload.nodeId,
      };
    },

    unlinkAssetFromNode(state, action: PayloadAction<{ assetId: string; nodeId: string }>) {
      const key = `${action.payload.assetId}:${action.payload.nodeId}`;
      delete state.assetNodeLinks[key];
    },

    // --- Tree mutations (all require flowId) ---
    updateNodeAmount(state, action: PayloadAction<{ flowId: string; id: string; amount: number }>) {
      const flow = state.flows[action.payload.flowId];
      if (!flow) return;
      const node = flow.tree.nodes[action.payload.id];
      if (node && node.isSource) {
        node.amount = action.payload.amount;
        recalculate(flow.tree);
      }
    },

    updateNodeLabel(state, action: PayloadAction<{ flowId: string; id: string; label: string }>) {
      const flow = state.flows[action.payload.flowId];
      if (!flow) return;
      const node = flow.tree.nodes[action.payload.id];
      if (node) {
        node.label = action.payload.label;
      }
    },

    addSourceNode(state, action: PayloadAction<{ flowId: string }>) {
      const flow = state.flows[action.payload.flowId];
      if (!flow) return;
      const newId = `node-${flow.tree.nextNodeNum}`;
      flow.tree.nextNodeNum += 1;

      flow.tree.nodes[newId] = {
        id: newId,
        label: `Source ${Object.values(flow.tree.nodes).filter((n) => n.isSource).length + 1}`,
        amount: 0,
        splitMode: 'percentage',
        isSource: true,
      };
    },

    addChildNode(state, action: PayloadAction<{ flowId: string; parentId: string }>) {
      const flow = state.flows[action.payload.flowId];
      if (!flow) return;
      const { parentId } = action.payload;
      const parent = flow.tree.nodes[parentId];
      if (!parent) return;

      const newId = `node-${flow.tree.nextNodeNum}`;
      flow.tree.nextNodeNum += 1;

      flow.tree.nodes[newId] = {
        id: newId,
        label: `Beneficiary ${flow.tree.nextNodeNum - 1}`,
        amount: 0,
        splitMode: 'percentage',
        isSource: false,
      };

      const edgeId = `edge-${parentId}-${newId}`;
      flow.tree.edges[edgeId] = {
        id: edgeId,
        sourceId: parentId,
        targetId: newId,
        percentage: 0,
        exactAmount: 0,
      };

      const siblingEdges = Object.values(flow.tree.edges).filter((e) => e.sourceId === parentId);
      const count = siblingEdges.length;
      const evenPercent = Math.round((100 / count) * 100) / 100;
      const evenAmount = Math.round((parent.amount / count) * 100) / 100;

      for (const edge of siblingEdges) {
        edge.percentage = evenPercent;
        edge.exactAmount = evenAmount;
      }

      recalculate(flow.tree);
    },

    connectNodes(state, action: PayloadAction<{ flowId: string; sourceId: string; targetId: string }>) {
      const flow = state.flows[action.payload.flowId];
      if (!flow) return;
      const { sourceId, targetId } = action.payload;
      if (!flow.tree.nodes[sourceId] || !flow.tree.nodes[targetId]) return;

      if (wouldCreateCycle(flow.tree, sourceId, targetId)) return;

      const existing = Object.values(flow.tree.edges).find(
        (e) => e.sourceId === sourceId && e.targetId === targetId
      );
      if (existing) return;

      const edgeId = `edge-${sourceId}-${targetId}`;
      flow.tree.edges[edgeId] = {
        id: edgeId,
        sourceId,
        targetId,
        percentage: 0,
        exactAmount: 0,
      };

      const target = flow.tree.nodes[targetId];
      if (target.isSource) {
        target.isSource = false;
      }

      const parent = flow.tree.nodes[sourceId];
      const siblingEdges = Object.values(flow.tree.edges).filter((e) => e.sourceId === sourceId);
      const count = siblingEdges.length;
      const evenPercent = Math.round((100 / count) * 100) / 100;
      const evenAmount = parent ? Math.round((parent.amount / count) * 100) / 100 : 0;

      for (const edge of siblingEdges) {
        edge.percentage = evenPercent;
        edge.exactAmount = evenAmount;
      }

      recalculate(flow.tree);
    },

    removeNode(state, action: PayloadAction<{ flowId: string; id: string }>) {
      const flow = state.flows[action.payload.flowId];
      if (!flow) return;
      const nodeId = action.payload.id;
      const node = flow.tree.nodes[nodeId];
      if (!node) return;

      const parentEdges = Object.values(flow.tree.edges).filter((e) => e.targetId === nodeId);

      const descendantIds = getDescendantIds(flow.tree, nodeId);
      const toRemove = [nodeId];
      for (const descId of descendantIds) {
        const incomingToDesc = Object.values(flow.tree.edges).filter(
          (e) => e.targetId === descId && !toRemove.includes(e.sourceId)
        );
        if (incomingToDesc.length === 0) {
          toRemove.push(descId);
        }
      }

      // Clean up asset links for removed nodes
      cleanupLinksForNodes(state.assetNodeLinks, new Set(toRemove));

      for (const id of toRemove) {
        delete flow.tree.nodes[id];
        for (const [edgeId, edge] of Object.entries(flow.tree.edges)) {
          if (edge.sourceId === id || edge.targetId === id) {
            delete flow.tree.edges[edgeId];
          }
        }
      }

      for (const parentEdge of parentEdges) {
        const parentId = parentEdge.sourceId;
        if (!flow.tree.nodes[parentId]) continue;

        const remainingEdges = Object.values(flow.tree.edges).filter((e) => e.sourceId === parentId);
        const count = remainingEdges.length;

        if (count > 0) {
          const parent = flow.tree.nodes[parentId];
          const evenPercent = Math.round((100 / count) * 100) / 100;
          const evenAmount = parent ? Math.round((parent.amount / count) * 100) / 100 : 0;

          for (const edge of remainingEdges) {
            edge.percentage = evenPercent;
            edge.exactAmount = evenAmount;
          }
        }
      }

      recalculate(flow.tree);
    },

    setSplitMode(state, action: PayloadAction<{ flowId: string; id: string; mode: SplitMode }>) {
      const flow = state.flows[action.payload.flowId];
      if (!flow) return;
      const node = flow.tree.nodes[action.payload.id];
      if (!node) return;

      node.splitMode = action.payload.mode;

      const childEdges = Object.values(flow.tree.edges).filter((e) => e.sourceId === node.id);
      const count = childEdges.length;
      if (count > 0) {
        const evenPercent = Math.round((100 / count) * 100) / 100;
        const evenAmount = Math.round((node.amount / count) * 100) / 100;
        for (const edge of childEdges) {
          edge.percentage = evenPercent;
          edge.exactAmount = evenAmount;
        }
      }

      recalculate(flow.tree);
    },

    updateEdgeSplit(
      state,
      action: PayloadAction<{ flowId: string; edgeId: string; value: number }>
    ) {
      const flow = state.flows[action.payload.flowId];
      if (!flow) return;
      const edge = flow.tree.edges[action.payload.edgeId];
      if (!edge) return;

      const parent = flow.tree.nodes[edge.sourceId];
      if (!parent) return;

      const siblingEdges = Object.values(flow.tree.edges).filter(
        (e) => e.sourceId === parent.id && e.id !== edge.id
      );

      if (parent.splitMode === 'percentage') {
        const clamped = Math.min(100, Math.max(0, action.payload.value));
        edge.percentage = clamped;

        const remaining = 100 - clamped;
        const siblingTotal = siblingEdges.reduce((sum, e) => sum + e.percentage, 0);

        if (siblingTotal > 0) {
          for (const sib of siblingEdges) {
            sib.percentage = Math.round((sib.percentage / siblingTotal) * remaining * 100) / 100;
          }
        } else if (siblingEdges.length > 0) {
          const even = remaining / siblingEdges.length;
          for (const sib of siblingEdges) {
            sib.percentage = Math.round(even * 100) / 100;
          }
        }
      } else {
        const clamped = Math.min(parent.amount, Math.max(0, action.payload.value));
        edge.exactAmount = clamped;

        const remaining = parent.amount - clamped;
        const siblingTotal = siblingEdges.reduce((sum, e) => sum + e.exactAmount, 0);

        if (siblingTotal > 0) {
          for (const sib of siblingEdges) {
            sib.exactAmount = Math.round((sib.exactAmount / siblingTotal) * remaining * 100) / 100;
          }
        } else if (siblingEdges.length > 0) {
          const even = remaining / siblingEdges.length;
          for (const sib of siblingEdges) {
            sib.exactAmount = Math.round(even * 100) / 100;
          }
        }
      }

      recalculate(flow.tree);
    },

    resetTree(state, action: PayloadAction<{ flowId: string }>) {
      const flow = state.flows[action.payload.flowId];
      if (!flow) return;
      const nodeIds = new Set(Object.keys(flow.tree.nodes));
      cleanupLinksForNodes(state.assetNodeLinks, nodeIds);
      flow.tree = createInitialTree();
    },
  },
});

export const {
  createFlow,
  deleteFlow,
  renameFlow,
  createAsset,
  deleteAsset,
  linkAssetToNode,
  unlinkAssetFromNode,
  updateNodeAmount,
  updateNodeLabel,
  addSourceNode,
  addChildNode,
  connectNodes,
  removeNode,
  setSplitMode,
  updateEdgeSplit,
  resetTree,
} = wealthManagementSlice.actions;

export default wealthManagementSlice.reducer;
