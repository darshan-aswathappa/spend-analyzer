import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { WealthTreeState, SplitMode } from './types';

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

interface WealthManagementState {
  tree: WealthTreeState;
}

const initialState: WealthManagementState = {
  tree: createInitialTree(),
};

const wealthManagementSlice = createSlice({
  name: 'wealthManagement',
  initialState,
  reducers: {
    updateNodeAmount(state, action: PayloadAction<{ id: string; amount: number }>) {
      const node = state.tree.nodes[action.payload.id];
      if (node && node.isSource) {
        node.amount = action.payload.amount;
        recalculate(state.tree);
      }
    },

    updateNodeLabel(state, action: PayloadAction<{ id: string; label: string }>) {
      const node = state.tree.nodes[action.payload.id];
      if (node) {
        node.label = action.payload.label;
      }
    },

    addSourceNode(state) {
      const newId = `node-${state.tree.nextNodeNum}`;
      state.tree.nextNodeNum += 1;

      state.tree.nodes[newId] = {
        id: newId,
        label: `Source ${Object.values(state.tree.nodes).filter((n) => n.isSource).length + 1}`,
        amount: 0,
        splitMode: 'percentage',
        isSource: true,
      };
    },

    addChildNode(state, action: PayloadAction<{ parentId: string }>) {
      const { parentId } = action.payload;
      const parent = state.tree.nodes[parentId];
      if (!parent) return;

      const newId = `node-${state.tree.nextNodeNum}`;
      state.tree.nextNodeNum += 1;

      // Create the child node (non-source, amount computed from parents)
      state.tree.nodes[newId] = {
        id: newId,
        label: `Beneficiary ${state.tree.nextNodeNum - 1}`,
        amount: 0,
        splitMode: 'percentage',
        isSource: false,
      };

      // Create edge
      const edgeId = `edge-${parentId}-${newId}`;
      state.tree.edges[edgeId] = {
        id: edgeId,
        sourceId: parentId,
        targetId: newId,
        percentage: 0,
        exactAmount: 0,
      };

      // Redistribute evenly among all children of this parent
      const siblingEdges = Object.values(state.tree.edges).filter((e) => e.sourceId === parentId);
      const count = siblingEdges.length;
      const evenPercent = Math.round((100 / count) * 100) / 100;
      const evenAmount = Math.round((parent.amount / count) * 100) / 100;

      for (const edge of siblingEdges) {
        edge.percentage = evenPercent;
        edge.exactAmount = evenAmount;
      }

      recalculate(state.tree);
    },

    // Connect two existing nodes (drag handle connection)
    connectNodes(state, action: PayloadAction<{ sourceId: string; targetId: string }>) {
      const { sourceId, targetId } = action.payload;
      if (!state.tree.nodes[sourceId] || !state.tree.nodes[targetId]) return;

      // Prevent cycles
      if (wouldCreateCycle(state.tree, sourceId, targetId)) return;

      // Prevent duplicate edges
      const existing = Object.values(state.tree.edges).find(
        (e) => e.sourceId === sourceId && e.targetId === targetId
      );
      if (existing) return;

      const edgeId = `edge-${sourceId}-${targetId}`;
      state.tree.edges[edgeId] = {
        id: edgeId,
        sourceId,
        targetId,
        percentage: 0,
        exactAmount: 0,
      };

      // Target is no longer a source if it now has incoming edges
      const target = state.tree.nodes[targetId];
      if (target.isSource) {
        target.isSource = false;
      }

      // Redistribute the source's outgoing edges evenly
      const parent = state.tree.nodes[sourceId];
      const siblingEdges = Object.values(state.tree.edges).filter((e) => e.sourceId === sourceId);
      const count = siblingEdges.length;
      const evenPercent = Math.round((100 / count) * 100) / 100;
      const evenAmount = parent ? Math.round((parent.amount / count) * 100) / 100 : 0;

      for (const edge of siblingEdges) {
        edge.percentage = evenPercent;
        edge.exactAmount = evenAmount;
      }

      recalculate(state.tree);
    },

    removeNode(state, action: PayloadAction<{ id: string }>) {
      const nodeId = action.payload.id;
      const node = state.tree.nodes[nodeId];
      if (!node) return;

      // Find parent edges (edges pointing to this node)
      const parentEdges = Object.values(state.tree.edges).filter((e) => e.targetId === nodeId);

      // Collect all descendants that ONLY connect through this node
      const descendantIds = getDescendantIds(state.tree, nodeId);
      // Filter: only remove descendants that have no other path from a source
      const toRemove = [nodeId];
      for (const descId of descendantIds) {
        const incomingToDesc = Object.values(state.tree.edges).filter(
          (e) => e.targetId === descId && !toRemove.includes(e.sourceId)
        );
        if (incomingToDesc.length === 0) {
          toRemove.push(descId);
        }
      }

      // Remove nodes and associated edges
      for (const id of toRemove) {
        delete state.tree.nodes[id];
        for (const [edgeId, edge] of Object.entries(state.tree.edges)) {
          if (edge.sourceId === id || edge.targetId === id) {
            delete state.tree.edges[edgeId];
          }
        }
      }

      // Redistribute remaining siblings under each parent
      for (const parentEdge of parentEdges) {
        const parentId = parentEdge.sourceId;
        if (!state.tree.nodes[parentId]) continue;

        const remainingEdges = Object.values(state.tree.edges).filter((e) => e.sourceId === parentId);
        const count = remainingEdges.length;

        if (count > 0) {
          const parent = state.tree.nodes[parentId];
          const evenPercent = Math.round((100 / count) * 100) / 100;
          const evenAmount = parent ? Math.round((parent.amount / count) * 100) / 100 : 0;

          for (const edge of remainingEdges) {
            edge.percentage = evenPercent;
            edge.exactAmount = evenAmount;
          }
        }
      }

      recalculate(state.tree);
    },

    setSplitMode(state, action: PayloadAction<{ id: string; mode: SplitMode }>) {
      const node = state.tree.nodes[action.payload.id];
      if (!node) return;

      node.splitMode = action.payload.mode;

      const childEdges = Object.values(state.tree.edges).filter((e) => e.sourceId === node.id);
      const count = childEdges.length;
      if (count > 0) {
        const evenPercent = Math.round((100 / count) * 100) / 100;
        const evenAmount = Math.round((node.amount / count) * 100) / 100;
        for (const edge of childEdges) {
          edge.percentage = evenPercent;
          edge.exactAmount = evenAmount;
        }
      }

      recalculate(state.tree);
    },

    updateEdgeSplit(
      state,
      action: PayloadAction<{ edgeId: string; value: number }>
    ) {
      const edge = state.tree.edges[action.payload.edgeId];
      if (!edge) return;

      const parent = state.tree.nodes[edge.sourceId];
      if (!parent) return;

      const siblingEdges = Object.values(state.tree.edges).filter(
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

      recalculate(state.tree);
    },

    resetTree(state) {
      state.tree = createInitialTree();
    },
  },
});

export const {
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
