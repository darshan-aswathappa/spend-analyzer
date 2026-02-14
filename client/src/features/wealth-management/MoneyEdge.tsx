import { memo, useState, useCallback } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/app/store';
import type { WealthEdgeData } from './types';
import { updateEdgeSplit } from './wealthManagementSlice';
import { formatCurrency } from '@/lib/utils';

type MoneyEdgeProps = EdgeProps & {
  data: WealthEdgeData & { flowId: string };
};

export const MoneyEdge = memo(function MoneyEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: MoneyEdgeProps) {
  const dispatch = useDispatch<AppDispatch>();
  const parentNode = useSelector((state: RootState) =>
    state.wealthManagement.flows[data.flowId]?.tree.nodes[data.sourceId]
  );

  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const isPercentage = parentNode?.splitMode === 'percentage';

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const displayValue = isPercentage
    ? `${Math.round(data.percentage * 10) / 10}%`
    : formatCurrency(data.exactAmount);

  const handleStartEdit = useCallback(() => {
    setInputValue(
      isPercentage
        ? String(Math.round(data.percentage * 10) / 10)
        : String(data.exactAmount)
    );
    setEditing(true);
  }, [isPercentage, data.percentage, data.exactAmount]);

  const handleSubmit = useCallback(() => {
    setEditing(false);
    const num = parseFloat(inputValue);
    if (isNaN(num) || num < 0) return;
    dispatch(updateEdgeSplit({ flowId: data.flowId, edgeId: data.id, value: num }));
  }, [dispatch, data.flowId, data.id, inputValue]);

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{
          stroke: '#94a3b8',
          strokeWidth: 2,
          strokeDasharray: '6 3',
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
        >
          {editing ? (
            <input
              autoFocus
              type="number"
              min="0"
              step={isPercentage ? '1' : '100'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-20 px-1.5 py-0.5 text-xs text-center font-medium rounded-full border border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          ) : (
            <button
              onClick={handleStartEdit}
              className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
              title="Click to edit split"
            >
              {displayValue}
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});
