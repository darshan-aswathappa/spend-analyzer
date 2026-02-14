interface ScoreGaugeProps {
  score: number;
  rating: string;
}

const RATING_BG: Record<string, string> = {
  excellent: 'bg-green-50 text-green-700 border-green-200',
  good: 'bg-lime-50 text-lime-700 border-lime-200',
  fair: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  poor: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
};

function getBarColor(score: number): string {
  if (score <= 20) return 'bg-green-500';
  if (score <= 40) return 'bg-lime-500';
  if (score <= 60) return 'bg-yellow-500';
  if (score <= 80) return 'bg-orange-500';
  return 'bg-red-500';
}

export function ScoreGauge({ score, rating }: ScoreGaugeProps) {
  return (
    <div className="flex flex-col items-center w-full max-w-xs mx-auto">
      {/* Score */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-5xl font-bold text-gray-900">{score}</span>
        <span className="text-base text-gray-400 font-medium">/ 100</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-4">
        <div
          className={`h-full rounded-full transition-all duration-700 ${getBarColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex justify-between w-full mt-1">
        <span className="text-[10px] text-gray-400">Low</span>
        <span className="text-[10px] text-gray-400">High</span>
      </div>

      {/* Rating badge */}
      <div
        className={`mt-3 px-3 py-1 rounded-full border text-xs font-semibold capitalize ${
          RATING_BG[rating] || 'bg-gray-50 text-gray-700 border-gray-200'
        }`}
      >
        {rating} Risk
      </div>
    </div>
  );
}
