import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowRight, GitBranch } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RootState, AppDispatch } from '@/app/store';
import { createFlow, deleteFlow } from './wealthManagementSlice';

export function WealthFlowListPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const flows = useSelector((state: RootState) =>
    Object.values(state.wealthManagement.flows).sort((a, b) => b.createdAt - a.createdAt)
  );

  const [showCreate, setShowCreate] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');

  function handleCreate() {
    if (!newFlowName.trim()) return;
    dispatch(createFlow({ name: newFlowName.trim() }));
    setNewFlowName('');
    setShowCreate(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Wealth Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Create and manage your wealth distribution flows
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-1.5">
          <Plus className="w-4 h-4" />
          New Flow
        </Button>
      </div>

      {/* Flow list */}
      {flows.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <GitBranch className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No flows yet. Create your first one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {flows.map(flow => {
            const nodeCount = Object.keys(flow.tree.nodes).length;
            const sourceCount = Object.values(flow.tree.nodes).filter(n => n.isSource).length;
            const beneficiaryCount = nodeCount - sourceCount;

            return (
              <Card
                key={flow.id}
                className="cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                onClick={() => navigate(`/wealth-management/${flow.id}`)}
              >
                <CardContent className="flex items-center justify-between py-4 px-5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {flow.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {sourceCount} source{sourceCount !== 1 ? 's' : ''} &middot;{' '}
                      {beneficiaryCount} beneficiar{beneficiaryCount !== 1 ? 'ies' : 'y'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(deleteFlow({ flowId: flow.id }));
                      }}
                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete flow"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create flow dialog */}
      <Dialog open={showCreate} onOpenChange={(v) => { if (!v) { setShowCreate(false); setNewFlowName(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Wealth Flow</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label>Flow Name</Label>
              <Input
                placeholder="e.g. Estate Plan, Trust Fund"
                value={newFlowName}
                onChange={e => setNewFlowName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={!newFlowName.trim()}
            >
              Create Flow
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
