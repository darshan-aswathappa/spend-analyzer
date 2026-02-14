import { useReactFlow } from '@xyflow/react';
import { RotateCcw, Maximize, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WealthToolbarProps {
  onReset: () => void;
  onAddSource: () => void;
}

export function WealthToolbar({ onReset, onAddSource }: WealthToolbarProps) {
  const { fitView } = useReactFlow();

  return (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-1.5">
      <Button
        variant="ghost"
        size="sm"
        onClick={onAddSource}
        title="Add new source"
        className="gap-1"
      >
        <PlusCircle className="w-4 h-4" />
        <span className="text-xs">Add Source</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => fitView({ duration: 300, padding: 0.2 })}
        title="Fit to view"
      >
        <Maximize className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        title="Reset"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
    </div>
  );
}
