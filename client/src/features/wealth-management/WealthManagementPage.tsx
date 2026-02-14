import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useWealthTree } from './useWealthTree';
import { WealthNode } from './WealthNode';
import { MoneyEdge } from './MoneyEdge';
import { WealthToolbar } from './WealthToolbar';

export function WealthManagementPage() {
  const { nodes, edges, onNodesChange, onEdgesChange, reset } = useWealthTree();
  const { resolvedTheme } = useTheme();

  const nodeTypes = useMemo(() => ({ wealth: WealthNode }), []);
  const edgeTypes = useMemo(() => ({ money: MoneyEdge }), []);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col -m-4 md:-m-6">
      {/* Mobile blocker */}
      <div className="flex md:hidden flex-col items-center justify-center text-center py-16 px-6 flex-1">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 max-w-sm">
          <Monitor className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Desktop Recommended
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The wealth management playground is best experienced on a larger screen. Please switch to a desktop or tablet for the full experience.
          </p>
        </div>
      </div>

      {/* Desktop content */}
      <div className="hidden md:flex flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          colorMode={resolvedTheme === 'dark' ? 'dark' : 'light'}
          proOptions={{ hideAttribution: true }}
          minZoom={0.2}
          maxZoom={2}
          defaultEdgeOptions={{ animated: true }}
        >
          <Background gap={20} size={1} />
          <Controls showInteractive={false} />
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
          />
          <WealthToolbar onReset={reset} />
        </ReactFlow>
      </div>
    </div>
  );
}
