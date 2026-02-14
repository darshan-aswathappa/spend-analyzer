import OpenAI from 'openai';
import { env } from '../config/env';
import { RiskSubScores, RiskBreakdown, RiskOnboarding } from '../types';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const RULE_LABELS: Record<keyof RiskSubScores, string> = {
  budget_adherence: '50/30/20 Budget Adherence',
  expense_to_income: 'Expense-to-Income Ratio',
  category_concentration: 'Category Concentration',
  spending_volatility: 'Spending Volatility',
  recurring_vs_discretionary: 'Recurring vs Discretionary Spending',
  savings_rate: 'Savings Rate',
  trend_direction: 'Spending Trend Direction',
};

export async function generateRiskTips(
  subScores: RiskSubScores,
  breakdown: RiskBreakdown,
  onboarding: RiskOnboarding
): Promise<string[]> {
  // Find the 3 worst-scoring rules
  const sorted = (Object.entries(subScores) as [keyof RiskSubScores, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const weakAreas = sorted
    .filter(([, score]) => score > 20)
    .map(([key, score]) => `${RULE_LABELS[key]}: ${score}/100`);

  if (weakAreas.length === 0) {
    return ['Your spending habits look excellent! Keep up the great work.'];
  }

  const goalDescriptions: Record<string, string> = {
    debt_payoff: 'paying off debt',
    emergency_fund: 'building an emergency fund',
    investment: 'growing investments',
    retirement: 'retirement savings',
    general_savings: 'general savings',
  };

  const prompt = `You are a concise personal finance advisor. Based on the following spend risk assessment, provide exactly 3 to 5 short, actionable tips (1 sentence each).

User's primary financial goal: ${goalDescriptions[onboarding.primary_goal] || 'general savings'}
Monthly income: $${onboarding.monthly_income}
Savings target: ${onboarding.savings_target_percentage}%

Weakest areas (higher score = worse):
${weakAreas.join('\n')}

Key metrics:
- Needs spending: ${breakdown.needs_pct}% of income
- Wants spending: ${breakdown.wants_pct}% of income
- Savings rate: ${breakdown.actual_savings_rate}%
- Expense-to-income ratio: ${breakdown.expense_to_income_ratio}%

Return a JSON object: { "tips": ["tip1", "tip2", ...] }

Rules:
- Each tip must be specific, actionable, and relate to the weak areas
- Reference the user's goal where relevant
- Keep each tip to 1 sentence, max 30 words
- Be encouraging but honest`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.4,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return ['Unable to generate tips at this time.'];

  const parsed = JSON.parse(content);
  return Array.isArray(parsed.tips) ? parsed.tips.slice(0, 5) : [];
}
