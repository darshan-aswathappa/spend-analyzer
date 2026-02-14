import type { LucideIcon } from 'lucide-react';

interface SubScoreCardProps {
  name: string;
  score: number;
  description: string;
  icon: LucideIcon;
  weight: string;
}

function getBarColor(score: number): string {
  if (score <= 20) return 'bg-green-500';
  if (score <= 40) return 'bg-lime-500';
  if (score <= 60) return 'bg-yellow-500';
  if (score <= 80) return 'bg-orange-500';
  return 'bg-red-500';
}

function getScoreLabel(score: number): string {
  if (score <= 20) return 'Excellent';
  if (score <= 40) return 'Good';
  if (score <= 60) return 'Fair';
  if (score <= 80) return 'Poor';
  return 'Critical';
}

export function SubScoreCard({ name, score, description, icon: Icon, weight }: SubScoreCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-gray-50 dark:bg-gray-950 rounded-lg">
            <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{name}</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">{weight} weight</p>
          </div>
        </div>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{score}/100</span>
      </div>
      <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        <span className={`text-xs font-medium ${score <= 40 ? 'text-green-600' : score <= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  );
}
