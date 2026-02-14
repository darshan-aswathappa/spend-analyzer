import { ScoreGauge } from './ScoreGauge';
import { SubScoreCard } from './SubScoreCard';
import { ScoreHistoryChart } from './ScoreHistoryChart';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  Settings,
  PieChart,
  DollarSign,
  BarChart3,
  Activity,
  Repeat,
  PiggyBank,
  TrendingUp,
  Lightbulb,
} from 'lucide-react';
import type { RiskScore } from '@/types';

interface RiskDashboardProps {
  score: RiskScore | null;
  history: RiskScore[];
  scoreLoading: boolean;
  onRecalculate: () => void;
  onEditProfile: () => void;
}

const SUB_SCORE_CONFIG = [
  {
    key: 'budget_adherence' as const,
    name: '50/30/20 Adherence',
    icon: PieChart,
    weight: '20%',
    description: 'How well spending fits the 50% needs / 30% wants / 20% savings rule',
  },
  {
    key: 'expense_to_income' as const,
    name: 'Expense-to-Income',
    icon: DollarSign,
    weight: '15%',
    description: 'Total spending compared to total income',
  },
  {
    key: 'category_concentration' as const,
    name: 'Category Concentration',
    icon: BarChart3,
    weight: '10%',
    description: 'Whether spending is spread across categories or concentrated in one',
  },
  {
    key: 'spending_volatility' as const,
    name: 'Spending Volatility',
    icon: Activity,
    weight: '10%',
    description: 'How much monthly spending varies from month to month',
  },
  {
    key: 'recurring_vs_discretionary' as const,
    name: 'Recurring vs Discretionary',
    icon: Repeat,
    weight: '15%',
    description: 'Ratio of fixed obligations to discretionary spending',
  },
  {
    key: 'savings_rate' as const,
    name: 'Savings Rate',
    icon: PiggyBank,
    weight: '20%',
    description: 'How close your actual savings are to your target',
  },
  {
    key: 'trend_direction' as const,
    name: 'Spending Trend',
    icon: TrendingUp,
    weight: '10%',
    description: 'Whether spending is trending up or down over time',
  },
];

export function RiskDashboard({
  score,
  history,
  scoreLoading,
  onRecalculate,
  onEditProfile,
}: RiskDashboardProps) {
  if (scoreLoading && !score) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold text-gray-900">Risk Assessment</h1>
        </div>
        <div className="flex flex-col items-center py-12">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mb-4" />
          <p className="text-sm text-gray-500">Analyzing your spending patterns...</p>
          <p className="text-xs text-gray-400 mt-1">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (!score) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold text-gray-900">Risk Assessment</h1>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-sm text-yellow-700">
            Unable to calculate score. Please ensure you have uploaded at least one statement.
          </p>
          <Button onClick={onRecalculate} variant="outline" size="sm" className="mt-3">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Risk Assessment</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEditProfile}>
            <Settings className="h-3.5 w-3.5" />
            Edit Profile
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRecalculate}
            disabled={scoreLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${scoreLoading ? 'animate-spin' : ''}`} />
            Recalculate
          </Button>
        </div>
      </div>

      {/* Score Gauge */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <div className="flex flex-col items-center">
          <ScoreGauge score={score.overall_score} rating={score.rating} />
          <p className="text-xs text-gray-400 mt-3">
            Based on {score.breakdown.months_analyzed} month(s) of transaction data
          </p>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Needs</p>
            <p className="text-lg font-semibold text-gray-900">{score.breakdown.needs_pct}%</p>
            <p className="text-xs text-gray-400">target: 50%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Wants</p>
            <p className="text-lg font-semibold text-gray-900">{score.breakdown.wants_pct}%</p>
            <p className="text-xs text-gray-400">target: 30%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Savings</p>
            <p className="text-lg font-semibold text-gray-900">{score.breakdown.savings_pct}%</p>
            <p className="text-xs text-gray-400">target: 20%</p>
          </div>
        </div>
      </div>

      {/* AI Tips */}
      {score.ai_tips.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-blue-900">Personalized Tips</h3>
          </div>
          <ul className="space-y-2">
            {score.ai_tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-blue-800">
                <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sub-Score Breakdown */}
      <h2 className="text-sm font-semibold text-gray-900 mb-3">Score Breakdown</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
        {SUB_SCORE_CONFIG.map((config) => (
          <SubScoreCard
            key={config.key}
            name={config.name}
            score={score.sub_scores[config.key]}
            description={config.description}
            icon={config.icon}
            weight={config.weight}
          />
        ))}
      </div>

      {/* Score History */}
      <ScoreHistoryChart data={history} />
    </div>
  );
}
