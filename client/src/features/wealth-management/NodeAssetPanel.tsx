import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import type { RootState, AppDispatch } from '@/app/store';
import {
  linkAssetToNode,
  unlinkAssetFromNode,
  createAsset,
  deleteAsset,
} from './wealthManagementSlice';

interface NodeAssetPanelProps {
  nodeId: string;
  nodeName: string;
  open: boolean;
  onClose: () => void;
}

export function NodeAssetPanel({ nodeId, nodeName, open, onClose }: NodeAssetPanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const assets = useSelector((state: RootState) => Object.values(state.wealthManagement.assets));
  const links = useSelector((state: RootState) => state.wealthManagement.assetNodeLinks);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newValue, setNewValue] = useState('');

  const isLinked = (assetId: string) => !!links[`${assetId}:${nodeId}`];

  function toggleLink(assetId: string) {
    if (isLinked(assetId)) {
      dispatch(unlinkAssetFromNode({ assetId, nodeId }));
    } else {
      dispatch(linkAssetToNode({ assetId, nodeId }));
    }
  }

  function handleCreateAsset() {
    if (!newName.trim()) return;
    dispatch(createAsset({
      name: newName.trim(),
      category: newCategory.trim() || 'Other',
      estimatedValue: parseFloat(newValue) || 0,
    }));
    setNewName('');
    setNewCategory('');
    setNewValue('');
    setShowCreate(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Assets for {nodeName}</DialogTitle>
        </DialogHeader>

        {/* Asset list with toggle */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {assets.length === 0 && !showCreate && (
            <p className="text-sm text-gray-500 dark:text-gray-400">No assets yet. Create one below.</p>
          )}
          {assets.map(asset => (
            <div key={asset.id} className="flex items-center justify-between p-2 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex-1 min-w-0 mr-2">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{asset.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{asset.category}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant={isLinked(asset.id) ? 'default' : 'outline'}
                  onClick={() => toggleLink(asset.id)}
                  className="text-xs h-7"
                >
                  {isLinked(asset.id) ? 'Linked' : 'Link'}
                </Button>
                <button
                  onClick={() => dispatch(deleteAsset({ assetId: asset.id }))}
                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete asset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Inline create form */}
        {showCreate ? (
          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="space-y-1">
              <Label className="text-xs">Asset Name</Label>
              <Input
                placeholder="e.g. Family Home, Gold Reserve"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Input
                placeholder="e.g. Property, Gold, Equity"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Estimated Value ($)</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreateAsset} disabled={!newName.trim()}>
                Create Asset
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1 mt-1"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            New Asset
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
