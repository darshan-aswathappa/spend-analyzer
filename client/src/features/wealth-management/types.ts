export type SplitMode = 'percentage' | 'exact';

export interface WealthNodeData {
  [key: string]: unknown;
  id: string;
  label: string;
  amount: number;
  splitMode: SplitMode;
  isSource: boolean; // true = user-editable amount (top-level source node)
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
  nextNodeNum: number;
}

export interface WealthFlow {
  id: string;
  name: string;
  createdAt: number;
  tree: WealthTreeState;
}

export interface WealthAsset {
  id: string;
  name: string;
  category: string;
  estimatedValue: number;
}

export interface AssetNodeLink {
  assetId: string;
  nodeId: string;
}
