import type { Middleware } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import { wealthApi } from './wealthApi';

// Tree mutation actions that should trigger a flow save
const TREE_MUTATION_ACTIONS = [
  'wealthManagement/updateNodeAmount',
  'wealthManagement/updateNodeLabel',
  'wealthManagement/addSourceNode',
  'wealthManagement/addChildNode',
  'wealthManagement/connectNodes',
  'wealthManagement/removeNode',
  'wealthManagement/setSplitMode',
  'wealthManagement/updateEdgeSplit',
  'wealthManagement/resetTree',
  'wealthManagement/renameFlow',
];

// Asset mutation actions that should trigger a settings save
const ASSET_MUTATION_ACTIONS = [
  'wealthManagement/createAsset',
  'wealthManagement/deleteAsset',
  'wealthManagement/linkAssetToNode',
  'wealthManagement/unlinkAssetFromNode',
];

const DEBOUNCE_MS = 2000;

const flowSaveTimers: Record<string, ReturnType<typeof setTimeout>> = {};
let settingsSaveTimer: ReturnType<typeof setTimeout> | null = null;

export const wealthAutoSaveMiddleware: Middleware = (store) => (next) => (action: unknown) => {
  const result = next(action);
  const act = action as { type: string; payload?: Record<string, unknown> };

  if (!act.type || !store.getState().auth?.session) return result;

  // Auto-save flow tree data
  if (TREE_MUTATION_ACTIONS.includes(act.type)) {
    const flowId = act.payload?.flowId as string | undefined;
    if (!flowId) return result;

    if (flowSaveTimers[flowId]) clearTimeout(flowSaveTimers[flowId]);

    flowSaveTimers[flowId] = setTimeout(() => {
      const state = store.getState() as RootState;
      const flow = state.wealthManagement.flows[flowId];
      if (flow && state.wealthManagement.loaded) {
        store.dispatch({ type: 'wealthManagement/setSaving', payload: true });
        wealthApi
          .updateFlow(flowId, { name: flow.name, tree_data: flow.tree })
          .then(() => {
            store.dispatch({ type: 'wealthManagement/setSaving', payload: false });
          })
          .catch((err) => {
            console.error('Auto-save failed for flow', flowId, err);
            store.dispatch({ type: 'wealthManagement/setSaving', payload: false });
          });
      }
      delete flowSaveTimers[flowId];
    }, DEBOUNCE_MS);
  }

  // Auto-save user settings (assets, links, counters)
  if (ASSET_MUTATION_ACTIONS.includes(act.type)) {
    if (settingsSaveTimer) clearTimeout(settingsSaveTimer);

    settingsSaveTimer = setTimeout(() => {
      const state = store.getState() as RootState;
      if (state.wealthManagement.loaded) {
        wealthApi
          .saveSettings({
            assets: state.wealthManagement.assets,
            asset_node_links: state.wealthManagement.assetNodeLinks,
            next_flow_num: state.wealthManagement.nextFlowNum,
            next_asset_num: state.wealthManagement.nextAssetNum,
          })
          .catch((err) => console.error('Auto-save settings failed', err));
      }
      settingsSaveTimer = null;
    }, DEBOUNCE_MS);
  }

  return result;
};
