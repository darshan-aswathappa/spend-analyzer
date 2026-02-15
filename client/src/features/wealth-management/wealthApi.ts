import apiClient from '@/lib/apiClient';
import type { WealthTreeState, WealthAsset, AssetNodeLink } from './types';

export interface WealthFlowRow {
  id: string;
  user_id: string;
  name: string;
  tree_data: WealthTreeState;
  created_at: string;
  updated_at: string;
}

export interface WealthUserSettingsRow {
  user_id: string;
  assets: Record<string, WealthAsset>;
  asset_node_links: Record<string, AssetNodeLink>;
  next_flow_num: number;
  next_asset_num: number;
  updated_at: string;
}

export const wealthApi = {
  getFlows: () =>
    apiClient
      .get<{ flows: WealthFlowRow[] }>('/wealth-flows')
      .then((r) => r.data.flows),

  createFlow: (name: string, tree_data: WealthTreeState) =>
    apiClient
      .post<{ flow: WealthFlowRow }>('/wealth-flows', { name, tree_data })
      .then((r) => r.data.flow),

  updateFlow: (flowId: string, payload: { name?: string; tree_data?: WealthTreeState }) =>
    apiClient
      .put<{ flow: WealthFlowRow }>(`/wealth-flows/${flowId}`, payload)
      .then((r) => r.data.flow),

  deleteFlow: (flowId: string) =>
    apiClient.delete(`/wealth-flows/${flowId}`),

  getSettings: () =>
    apiClient
      .get<{ settings: WealthUserSettingsRow | null }>('/wealth-flows/settings')
      .then((r) => r.data.settings),

  saveSettings: (payload: {
    assets: Record<string, WealthAsset>;
    asset_node_links: Record<string, AssetNodeLink>;
    next_flow_num: number;
    next_asset_num: number;
  }) =>
    apiClient
      .put<{ settings: WealthUserSettingsRow }>('/wealth-flows/settings', payload)
      .then((r) => r.data.settings),
};
