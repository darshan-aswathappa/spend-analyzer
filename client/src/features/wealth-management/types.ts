export type SplitMode = 'percentage' | 'exact';

export interface WealthNodeData {
  [key: string]: unknown;
  id: string;
  label: string;
  amount: number;
  parentId: string | null;
  splitMode: SplitMode;
}

export interface WealthEdgeData {
  [key: string]: unknown;
  id: string;
  sourceId: string;
  targetId: string;
  percentage: number;
  exactAmount: number;
}

export interface WealthTreeState {
  nodes: Record<string, WealthNodeData>;
  edges: Record<string, WealthEdgeData>;
  rootId: string;
  nextNodeNum: number;
}
