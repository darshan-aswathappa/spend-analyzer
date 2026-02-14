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

// Gradient segments for the gauge arc: green -> yellow -> orange -> red
const GAUGE_SEGMENTS = [
  { start: 0, end: 0.25, color: '#16a34a' },   // green
  { start: 0.25, end: 0.5, color: '#65a30d' },  // lime
  { start: 0.5, end: 0.7, color: '#ca8a04' },   // yellow
  { start: 0.7, end: 0.85, color: '#ea580c' },   // orange
  { start: 0.85, end: 1, color: '#dc2626' },     // red
];

export function ScoreGauge({ score, rating }: ScoreGaugeProps) {
  const cx = 120;
  const cy = 120;
  const radius = 90;
  const strokeWidth = 18;

  // Needle angle: 0 score = left (PI), 100 score = right (0)
  const needleAngle = Math.PI - (score / 100) * Math.PI;
  const needleLen = radius - 14;
  const needleX = cx + needleLen * Math.cos(needleAngle);
  const needleY = cy - needleLen * Math.sin(needleAngle);

  return (
    <div className="flex flex-col items-center">
      <svg width="240" height="160" viewBox="0 0 240 160">
        {/* Colored arc segments */}
        {GAUGE_SEGMENTS.map((seg, i) => (
          <path
            key={i}
            d={describeArc(cx, cy, radius, seg.start, seg.end)}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap={i === 0 || i === GAUGE_SEGMENTS.length - 1 ? 'round' : 'butt'}
          />
        ))}

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="#1f2937"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="6" fill="#1f2937" />
        <circle cx={cx} cy={cy} r="3" fill="#fff" />

        {/* Labels */}
        <text x="16" y={cy + 16} textAnchor="start" className="text-xs font-medium" fill="#16a34a">
          Low
        </text>
        <text x="224" y={cy + 16} textAnchor="end" className="text-xs font-medium" fill="#dc2626">
          High
        </text>
      </svg>

      {/* Score below gauge */}
      <div className="flex flex-col items-center -mt-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-gray-900">{score}</span>
          <span className="text-sm text-gray-400">/ 100</span>
        </div>
        <div
          className={`mt-2 px-3 py-1 rounded-full border text-xs font-semibold capitalize ${
            RATING_BG[rating] || 'bg-gray-50 text-gray-700 border-gray-200'
          }`}
        >
          {rating} Risk
        </div>
      </div>
    </div>
  );
}

/** Describes an arc path from fraction `start` to `end` (0–1) along a top semi-circle. */
function describeArc(
  cx: number,
  cy: number,
  radius: number,
  start: number,
  end: number
): string {
  // Map 0–1 to PI–0 (left to right along top half)
  const startAngle = Math.PI - start * Math.PI;
  const endAngle = Math.PI - end * Math.PI;

  const x1 = cx + radius * Math.cos(startAngle);
  const y1 = cy - radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(endAngle);
  const y2 = cy - radius * Math.sin(endAngle);

  const sweep = startAngle - endAngle;
  const largeArc = sweep > Math.PI ? 1 : 0;

  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
}
