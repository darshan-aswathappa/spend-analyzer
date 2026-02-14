import { memo, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Trash2, Percent, DollarSign, Briefcase, X } from 'lucide-react';
import type { AppDispatch, RootState } from '@/app/store';
import type { WealthNodeData } from './types';
import {
  updateNodeAmount,
  updateNodeLabel,
  addChildNode,
  removeNode,
  setSplitMode,
  unlinkAssetFromNode,
} from './wealthManagementSlice';
import { formatCurrency } from '@/lib/utils';
import { NodeAssetPanel } from './NodeAssetPanel';

type WealthNodeProps = NodeProps & {
  data: WealthNodeData & { hasChildren: boolean; hasParents: boolean; flowId: string };
};

export const WealthNode = memo(function WealthNode({ data }: WealthNodeProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [editingLabel, setEditingLabel] = useState(false);
  const [editingAmount, setEditingAmount] = useState(false);
  const [labelValue, setLabelValue] = useState(data.label);
  const [amountValue, setAmountValue] = useState(String(data.amount));
  const [showAssetPanel, setShowAssetPanel] = useState(false);

  const linkedAssets = useSelector((state: RootState) => {
    return Object.values(state.wealthManagement.assetNodeLinks)
      .filter(link => link.nodeId === data.id)
      .map(link => state.wealthManagement.assets[link.assetId])
      .filter(Boolean);
  });

  const handleLabelSubmit = useCallback(() => {
    setEditingLabel(false);
    if (labelValue.trim() && labelValue.trim() !== data.label) {
      dispatch(updateNodeLabel({ flowId: data.flowId, id: data.id, label: labelValue.trim() }));
    } else {
      setLabelValue(data.label);
    }
  }, [dispatch, data.flowId, data.id, data.label, labelValue]);

  const handleAmountSubmit = useCallback(() => {
    setEditingAmount(false);
    const num = parseFloat(amountValue);
    if (!isNaN(num) && num >= 0 && num !== data.amount) {
      dispatch(updateNodeAmount({ flowId: data.flowId, id: data.id, amount: num }));
    } else {
      setAmountValue(String(data.amount));
    }
  }, [dispatch, data.flowId, data.id, data.amount, amountValue]);

  return (
    <div
      className={`
        w-[220px] rounded-xl border bg-white dark:bg-gray-900 shadow-sm
        ${data.isSource
          ? 'border-green-400 dark:border-green-600 ring-2 ring-green-100 dark:ring-green-900/40'
          : 'border-gray-200 dark:border-gray-700'}
      `}
    >
      {/* Target handle (top) — always visible for connecting */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white dark:!border-gray-900"
      />

      <div className="p-3">
        {/* Header row: label + delete */}
        <div className="flex items-center justify-between gap-1 mb-2">
          {editingLabel ? (
            <input
              autoFocus
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onBlur={handleLabelSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleLabelSubmit()}
              className="flex-1 min-w-0 px-1.5 py-0.5 text-xs font-medium rounded border border-gray-200 dark:border-gray-600 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          ) : (
            <button
              onClick={() => { setLabelValue(data.label); setEditingLabel(true); }}
              className="flex-1 min-w-0 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 truncate hover:text-blue-600 dark:hover:text-blue-400"
              title="Click to rename"
            >
              {data.label}
            </button>
          )}
          <button
            onClick={() => dispatch(removeNode({ flowId: data.flowId, id: data.id }))}
            className="shrink-0 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
            title="Remove"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Amount */}
        <div className="mb-2">
          {data.isSource && editingAmount ? (
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">$</span>
              <input
                autoFocus
                type="number"
                min="0"
                step="100"
                value={amountValue}
                onChange={(e) => setAmountValue(e.target.value)}
                onBlur={handleAmountSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleAmountSubmit()}
                className="flex-1 min-w-0 px-1.5 py-0.5 text-sm font-semibold rounded border border-gray-200 dark:border-gray-600 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ) : (
            <button
              onClick={() => {
                if (data.isSource) {
                  setAmountValue(String(data.amount));
                  setEditingAmount(true);
                }
              }}
              className={`text-lg font-bold ${
                data.isSource
                  ? 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 cursor-pointer'
                  : 'text-gray-900 dark:text-gray-100 cursor-default'
              }`}
              title={data.isSource ? 'Click to edit amount' : undefined}
            >
              {formatCurrency(data.amount)}
            </button>
          )}
          {data.isSource && (
            <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">SOURCE</span>
          )}
        </div>

        {/* Split mode toggle — only when node has children */}
        {data.hasChildren && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 mr-1">Split:</span>
            <button
              onClick={() => dispatch(setSplitMode({ flowId: data.flowId, id: data.id, mode: 'percentage' }))}
              className={`p-1 rounded text-[10px] font-medium transition-colors ${
                data.splitMode === 'percentage'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              title="Split by percentage"
            >
              <Percent className="w-3 h-3" />
            </button>
            <button
              onClick={() => dispatch(setSplitMode({ flowId: data.flowId, id: data.id, mode: 'exact' }))}
              className={`p-1 rounded text-[10px] font-medium transition-colors ${
                data.splitMode === 'exact'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              title="Split by exact amount"
            >
              <DollarSign className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Add child button */}
        <button
          onClick={() => dispatch(addChildNode({ flowId: data.flowId, parentId: data.id }))}
          className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Child
        </button>

        {/* Assets section — beneficiary (non-source) nodes only */}
        {!data.isSource && (
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">ASSETS</span>
              <button
                onClick={() => setShowAssetPanel(true)}
                className="p-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-500 transition-colors"
                title="Manage assets"
              >
                <Briefcase className="w-3 h-3" />
              </button>
            </div>
            {linkedAssets.length === 0 ? (
              <p className="text-[10px] text-gray-400 italic">None linked</p>
            ) : (
              <div className="space-y-0.5">
                {linkedAssets.map(asset => (
                  <div key={asset.id} className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-600 dark:text-gray-300 truncate">{asset.name}</span>
                    <button
                      onClick={() => dispatch(unlinkAssetFromNode({ assetId: asset.id, nodeId: data.id }))}
                      className="p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Source handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white dark:!border-gray-900"
      />

      {/* Asset panel dialog */}
      {showAssetPanel && (
        <NodeAssetPanel
          nodeId={data.id}
          nodeName={data.label}
          open={showAssetPanel}
          onClose={() => setShowAssetPanel(false)}
        />
      )}
    </div>
  );
});
