import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Monitor, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useWealthTree } from './useWealthTree';
import { WealthNode } from './WealthNode';
import { MoneyEdge } from './MoneyEdge';
import { WealthToolbar } from './WealthToolbar';
import type { RootState } from '@/app/store';

function WealthManagementCanvas({ flowId }: { flowId: string }) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, reset, addSource } =
    useWealthTree(flowId);
  const { resolvedTheme } = useTheme();

  const nodeTypes = useMemo(() => ({ wealth: WealthNode }), []);
  const edgeTypes = useMemo(() => ({ money: MoneyEdge }), []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      colorMode={resolvedTheme === 'dark' ? 'dark' : 'light'}
      proOptions={{ hideAttribution: true }}
      minZoom={0.2}
      maxZoom={2}
      defaultEdgeOptions={{ animated: true }}
      connectionLineStyle={{ stroke: '#94a3b8', strokeWidth: 2 }}
    >
      <Background gap={20} size={1} />
      <Controls showInteractive={false} />
      <MiniMap nodeStrokeWidth={3} zoomable pannable />
      <WealthToolbar onReset={reset} onAddSource={addSource} />
    </ReactFlow>
  );
}

export function WealthManagementPage() {
  const { flowId } = useParams<{ flowId: string }>();
  const navigate = useNavigate();
  const flow = useSelector((state: RootState) =>
    flowId ? state.wealthManagement.flows[flowId] : undefined
  );

  if (!flowId || !flow) {
    navigate('/wealth-management', { replace: true });
    return null;
  }

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
            The wealth management playground is best experienced on a larger screen. Please switch
            to a desktop or tablet for the full experience.
          </p>
        </div>
      </div>

      {/* Desktop content */}
      <div className="hidden md:flex flex-1 relative">
        {/* Back navigation */}
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 bg-white dark:bg-gray-900 shadow-sm"
            onClick={() => navigate('/wealth-management')}
          >
            <ChevronLeft className="w-4 h-4" />
            {flow.name}
          </Button>
        </div>

        <ReactFlowProvider>
          <WealthManagementCanvas flowId={flowId} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
