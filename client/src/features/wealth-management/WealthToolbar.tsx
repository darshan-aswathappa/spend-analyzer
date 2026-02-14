import { useReactFlow } from '@xyflow/react';
import { RotateCcw, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WealthToolbarProps {
  onReset: () => void;
}

export function WealthToolbar({ onReset }: WealthToolbarProps) {
  const { fitView } = useReactFlow();

  return (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-1.5">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => fitView({ duration: 300 })}
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
