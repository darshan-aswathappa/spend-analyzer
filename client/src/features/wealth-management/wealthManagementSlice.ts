import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { WealthTreeState, SplitMode } from './types';

const ROOT_ID = 'node-1';

function createInitialTree(): WealthTreeState {
  return {
    nodes: {
      [ROOT_ID]: {
        id: ROOT_ID,
        label: 'Estate',
        amount: 5000,
        parentId: null,
        splitMode: 'percentage',
      },
    },
    edges: {},
    rootId: ROOT_ID,
    nextNodeNum: 2,
  };
}

function recalculate(state: WealthTreeState) {
  const { nodes, edges } = state;
  const root = nodes[state.rootId];
  if (!root) return;

  // BFS top-down recalculation
  const queue = [root.id];
  while (queue.length > 0) {
    const parentId = queue.shift()!;
    const parent = nodes[parentId];
    if (!parent) continue;

    // Find child edges
    const childEdges = Object.values(edges).filter((e) => e.sourceId === parentId);
    if (childEdges.length === 0) continue;

    for (const edge of childEdges) {
      const child = nodes[edge.targetId];
      if (!child) continue;

      if (parent.splitMode === 'percentage') {
        child.amount = Math.round((parent.amount * edge.percentage) / 100 * 100) / 100;
      } else {
        child.amount = edge.exactAmount;
      }

      queue.push(child.id);
    }
  }
}

function getDescendantIds(state: WealthTreeState, nodeId: string): string[] {
  const result: string[] = [];
  const queue = [nodeId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const childEdges = Object.values(state.edges).filter((e) => e.sourceId === current);
    for (const edge of childEdges) {
      result.push(edge.targetId);
      queue.push(edge.targetId);
    }
  }
  return result;
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
      if (node) {
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

    addChildNode(state, action: PayloadAction<{ parentId: string }>) {
      const { parentId } = action.payload;
      const parent = state.tree.nodes[parentId];
      if (!parent) return;

      const newId = `node-${state.tree.nextNodeNum}`;
      state.tree.nextNodeNum += 1;

      // Create the child node
      state.tree.nodes[newId] = {
        id: newId,
        label: `Beneficiary ${state.tree.nextNodeNum - 1}`,
        amount: 0,
        parentId,
        splitMode: 'percentage',
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

      // Redistribute evenly among all children
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

    removeNode(state, action: PayloadAction<{ id: string }>) {
      const nodeId = action.payload.id;
      const node = state.tree.nodes[nodeId];
      if (!node || nodeId === state.tree.rootId) return;

      // Collect all descendants
      const descendantIds = getDescendantIds(state.tree, nodeId);
      const allToRemove = [nodeId, ...descendantIds];

      // Remove nodes and associated edges
      for (const id of allToRemove) {
        delete state.tree.nodes[id];
        // Remove edges where this node is source or target
        for (const [edgeId, edge] of Object.entries(state.tree.edges)) {
          if (edge.sourceId === id || edge.targetId === id) {
            delete state.tree.edges[edgeId];
          }
        }
      }

      // Redistribute remaining siblings under the parent
      const parentId = node.parentId!;
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

      recalculate(state.tree);
    },

    setSplitMode(state, action: PayloadAction<{ id: string; mode: SplitMode }>) {
      const node = state.tree.nodes[action.payload.id];
      if (!node) return;

      node.splitMode = action.payload.mode;

      // Redistribute evenly when switching modes
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

        // Auto-adjust siblings proportionally
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

        // Auto-adjust siblings proportionally
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
  addChildNode,
  removeNode,
  setSplitMode,
  updateEdgeSplit,
  resetTree,
} = wealthManagementSlice.actions;

export default wealthManagementSlice.reducer;
