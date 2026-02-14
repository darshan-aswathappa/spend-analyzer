import { supabase } from '../config/supabase';
import { RiskOnboarding, RiskSubScores, RiskBreakdown, Transaction } from '../types';
import { generateRiskTips } from './riskTipsService';

interface MonthlyAggregate {
  month: string;
  totalDebits: number;
  totalCredits: number;
  categoryDebits: Map<string, number>;
}

function getRating(score: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
  if (score <= 20) return 'excellent';
  if (score <= 40) return 'good';
  if (score <= 60) return 'fair';
  if (score <= 80) return 'poor';
  return 'critical';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function interpolate(value: number, brackets: [number, number][]): number {
  for (let i = 0; i < brackets.length - 1; i++) {
    const [threshold, score] = brackets[i];
    const [nextThreshold, nextScore] = brackets[i + 1];
    if (value <= threshold) return score;
    if (value <= nextThreshold) {
      const ratio = (value - threshold) / (nextThreshold - threshold);
      return score + ratio * (nextScore - score);
    }
  }
  return brackets[brackets.length - 1][1];
}

function aggregateByMonth(transactions: Transaction[]): MonthlyAggregate[] {
  const map = new Map<string, MonthlyAggregate>();

  for (const t of transactions) {
    const month = t.date.substring(0, 7); // YYYY-MM
    let agg = map.get(month);
    if (!agg) {
      agg = { month, totalDebits: 0, totalCredits: 0, categoryDebits: new Map() };
      map.set(month, agg);
    }
    const amount = Number(t.amount);
    if (t.type === 'debit') {
      agg.totalDebits += amount;
      agg.categoryDebits.set(t.category, (agg.categoryDebits.get(t.category) || 0) + amount);
    } else {
      agg.totalCredits += amount;
    }
  }

  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

// Rule 1: 50/30/20 Budget Adherence (weight: 20%)
function calcBudgetAdherence(
  totalDebits: number,
  totalIncome: number,
  categoryTotals: Map<string, number>,
  essentialCategories: string[]
): number {
  if (totalIncome <= 0) return 100;

  let needsTotal = 0;
  let wantsTotal = 0;

  for (const [category, amount] of categoryTotals) {
    if (essentialCategories.includes(category)) {
      needsTotal += amount;
    } else if (category !== 'Income' && category !== 'Transfers') {
      wantsTotal += amount;
    }
  }

  const needsPct = needsTotal / totalIncome;
  const wantsPct = wantsTotal / totalIncome;
  const savingsPct = (totalIncome - totalDebits) / totalIncome;

  const needsDeviation = Math.max(0, needsPct - 0.50) * 100;
  const wantsDeviation = Math.max(0, wantsPct - 0.30) * 100;
  const savingsDeviation = Math.max(0, 0.20 - savingsPct) * 100;

  return clamp(
    Math.round(needsDeviation * 1.5 + wantsDeviation * 2.0 + savingsDeviation * 2.5),
    0,
    100
  );
}

// Rule 2: Expense-to-Income Ratio (weight: 15%)
function calcExpenseToIncomeRatio(totalDebits: number, totalIncome: number): number {
  if (totalIncome <= 0) return 100;
  const ratio = totalDebits / totalIncome;

  return Math.round(
    interpolate(ratio, [
      [0.70, 0],
      [0.85, 25],
      [0.95, 50],
      [1.0, 75],
      [1.2, 100],
    ])
  );
}

// Rule 3: Category Concentration Risk - HHI (weight: 10%)
function calcCategoryConcentration(categoryTotals: Map<string, number>, totalDebits: number): number {
  if (totalDebits <= 0 || categoryTotals.size <= 1) return 0;

  let hhi = 0;
  for (const amount of categoryTotals.values()) {
    const share = amount / totalDebits;
    hhi += share * share;
  }
  hhi *= 10000;

  return Math.round(
    interpolate(hhi, [
      [1500, 0],
      [2500, 30],
      [4000, 60],
      [6000, 90],
    ])
  );
}

// Rule 4: Spending Volatility (weight: 10%)
function calcSpendingVolatility(
  monthlyAggregates: MonthlyAggregate[],
  incomeSource: string
): number {
  if (monthlyAggregates.length < 2) return 50; // not enough data, neutral score

  const debits = monthlyAggregates.map((m) => m.totalDebits);
  const mean = debits.reduce((a, b) => a + b, 0) / debits.length;
  if (mean === 0) return 0;

  const variance = debits.reduce((sum, d) => sum + (d - mean) ** 2, 0) / debits.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;

  // Higher tolerance for freelance/business
  const offset = incomeSource === 'freelance' || incomeSource === 'business' ? 0.10 : 0;

  return Math.round(
    interpolate(cv - offset, [
      [0.10, 0],
      [0.25, 25],
      [0.40, 50],
      [0.60, 75],
      [0.80, 100],
    ])
  );
}

// Rule 5: Recurring vs Discretionary (weight: 15%)
function calcRecurringVsDiscretionary(
  totalDebits: number,
  fixedObligationsTotal: number
): number {
  if (totalDebits <= 0) return 0;

  const discretionaryRatio = Math.max(0, totalDebits - fixedObligationsTotal) / totalDebits;

  return Math.round(
    interpolate(discretionaryRatio, [
      [0.30, 0],
      [0.50, 25],
      [0.70, 50],
      [0.85, 75],
      [1.0, 100],
    ])
  );
}

// Rule 6: Savings Rate (weight: 20%)
function calcSavingsRate(
  totalIncome: number,
  totalDebits: number,
  targetPct: number
): number {
  if (totalIncome <= 0) return 100;

  const savingsRate = (totalIncome - totalDebits) / totalIncome;
  const target = targetPct / 100;

  if (savingsRate >= target) return 0;
  if (savingsRate >= target * 0.75) return 20;
  if (savingsRate >= target * 0.50) return 40;
  if (savingsRate >= target * 0.25) return 60;
  if (savingsRate >= 0) return 80;
  return 100; // negative savings
}

// Rule 7: Trend Direction (weight: 10%)
function calcTrendDirection(monthlyAggregates: MonthlyAggregate[]): number {
  if (monthlyAggregates.length < 3) return 50; // not enough data, neutral

  const debits = monthlyAggregates.map((m) => m.totalDebits);
  const n = debits.length;
  const mean = debits.reduce((a, b) => a + b, 0) / n;
  if (mean === 0) return 0;

  // Simple linear regression: y = a + bx
  const xMean = (n - 1) / 2;
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (debits[i] - mean);
    denominator += (i - xMean) ** 2;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const normalizedSlope = slope / mean; // percentage change per month

  return Math.round(
    interpolate(normalizedSlope, [
      [-0.05, 0],
      [0, 15],
      [0.05, 40],
      [0.10, 70],
      [0.15, 100],
    ])
  );
}

export async function calculateRiskScore(userId: string, onboarding: RiskOnboarding) {
  // Fetch all transactions for this user
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  if (error) throw error;

  const allTxns = (transactions || []) as Transaction[];
  const monthlyAggregates = aggregateByMonth(allTxns);

  // Compute totals across all data
  let totalDebits = 0;
  let totalCredits = 0;
  const categoryTotals = new Map<string, number>();

  for (const t of allTxns) {
    const amount = Number(t.amount);
    if (t.type === 'debit') {
      totalDebits += amount;
      categoryTotals.set(t.category, (categoryTotals.get(t.category) || 0) + amount);
    } else {
      totalCredits += amount;
    }
  }

  // Use the higher of onboarding income (annualized to match data span) or actual credits
  const monthsAnalyzed = Math.max(monthlyAggregates.length, 1);
  const monthlyIncomeFromOnboarding = onboarding.monthly_income;
  const avgMonthlyCredits = totalCredits / monthsAnalyzed;
  const effectiveMonthlyIncome = Math.max(monthlyIncomeFromOnboarding, avgMonthlyCredits);

  // Normalize totals to per-month for rules that compare to monthly income
  const avgMonthlyDebits = totalDebits / monthsAnalyzed;

  // Fixed obligations total (monthly)
  const fixedObligationsTotal = (onboarding.fixed_obligations || []).reduce(
    (sum, ob) => sum + Number(ob.amount),
    0
  );

  // Calculate all 7 sub-scores
  const subScores: RiskSubScores = {
    budget_adherence: calcBudgetAdherence(
      avgMonthlyDebits,
      effectiveMonthlyIncome,
      // Normalize category totals to monthly averages
      new Map(
        Array.from(categoryTotals.entries()).map(([k, v]) => [k, v / monthsAnalyzed])
      ),
      onboarding.essential_categories
    ),
    expense_to_income: calcExpenseToIncomeRatio(avgMonthlyDebits, effectiveMonthlyIncome),
    category_concentration: calcCategoryConcentration(categoryTotals, totalDebits),
    spending_volatility: calcSpendingVolatility(monthlyAggregates, onboarding.income_source),
    recurring_vs_discretionary: calcRecurringVsDiscretionary(avgMonthlyDebits, fixedObligationsTotal),
    savings_rate: calcSavingsRate(
      effectiveMonthlyIncome,
      avgMonthlyDebits,
      onboarding.savings_target_percentage
    ),
    trend_direction: calcTrendDirection(monthlyAggregates),
  };

  // Weighted combination
  const overallScore = Math.round(
    subScores.budget_adherence * 0.20 +
      subScores.expense_to_income * 0.15 +
      subScores.category_concentration * 0.10 +
      subScores.spending_volatility * 0.10 +
      subScores.recurring_vs_discretionary * 0.15 +
      subScores.savings_rate * 0.20 +
      subScores.trend_direction * 0.10
  );

  const finalScore = clamp(overallScore, 0, 100);
  const rating = getRating(finalScore);

  // Build breakdown for transparency
  const actualSavingsRate =
    effectiveMonthlyIncome > 0
      ? (effectiveMonthlyIncome - avgMonthlyDebits) / effectiveMonthlyIncome
      : 0;

  // Calculate needs/wants percentages
  let needsTotal = 0;
  let wantsTotal = 0;
  for (const [category, amount] of categoryTotals) {
    const monthlyAmount = amount / monthsAnalyzed;
    if (onboarding.essential_categories.includes(category)) {
      needsTotal += monthlyAmount;
    } else if (category !== 'Income' && category !== 'Transfers') {
      wantsTotal += monthlyAmount;
    }
  }

  const breakdown: RiskBreakdown = {
    needs_pct: effectiveMonthlyIncome > 0 ? Math.round((needsTotal / effectiveMonthlyIncome) * 1000) / 10 : 0,
    wants_pct: effectiveMonthlyIncome > 0 ? Math.round((wantsTotal / effectiveMonthlyIncome) * 1000) / 10 : 0,
    savings_pct: Math.round(actualSavingsRate * 1000) / 10,
    total_income: Math.round(effectiveMonthlyIncome * 100) / 100,
    total_expenses: Math.round(avgMonthlyDebits * 100) / 100,
    expense_to_income_ratio:
      effectiveMonthlyIncome > 0
        ? Math.round((avgMonthlyDebits / effectiveMonthlyIncome) * 1000) / 10
        : 0,
    hhi_index: (() => {
      let hhi = 0;
      if (totalDebits > 0) {
        for (const amount of categoryTotals.values()) {
          const share = amount / totalDebits;
          hhi += share * share;
        }
      }
      return Math.round(hhi * 10000);
    })(),
    volatility_cv: (() => {
      if (monthlyAggregates.length < 2) return 0;
      const debits = monthlyAggregates.map((m) => m.totalDebits);
      const mean = debits.reduce((a, b) => a + b, 0) / debits.length;
      if (mean === 0) return 0;
      const variance = debits.reduce((sum, d) => sum + (d - mean) ** 2, 0) / debits.length;
      return Math.round((Math.sqrt(variance) / mean) * 1000) / 1000;
    })(),
    discretionary_ratio:
      avgMonthlyDebits > 0
        ? Math.round(
            (Math.max(0, avgMonthlyDebits - fixedObligationsTotal) / avgMonthlyDebits) * 1000
          ) / 10
        : 0,
    actual_savings_rate: Math.round(actualSavingsRate * 1000) / 10,
    spending_trend_slope: (() => {
      if (monthlyAggregates.length < 3) return 0;
      const debits = monthlyAggregates.map((m) => m.totalDebits);
      const n = debits.length;
      const mean = debits.reduce((a, b) => a + b, 0) / n;
      if (mean === 0) return 0;
      const xMean = (n - 1) / 2;
      let num = 0;
      let den = 0;
      for (let i = 0; i < n; i++) {
        num += (i - xMean) * (debits[i] - mean);
        den += (i - xMean) ** 2;
      }
      const slope = den !== 0 ? num / den : 0;
      return Math.round((slope / mean) * 1000) / 1000;
    })(),
    months_analyzed: monthsAnalyzed,
  };

  // Generate AI tips (minimal AI usage)
  let aiTips: string[] = [];
  try {
    aiTips = await generateRiskTips(subScores, breakdown, onboarding);
  } catch {
    aiTips = ['Unable to generate personalized tips at this time.'];
  }

  return {
    overall_score: finalScore,
    rating,
    sub_scores: subScores,
    breakdown,
    ai_tips: aiTips,
  };
}
