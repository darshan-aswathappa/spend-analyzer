import OpenAI from 'openai';
import { env } from '../config/env';
import { ProjectionsResponse } from '../types';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

interface MonthlyAggregate {
  month: string;
  byCategory: Record<string, number>;
  totalIncome: number;
  totalExpenses: number;
}

export async function generateProjections(
  historicalData: MonthlyAggregate[],
  currentBalance: number
): Promise<ProjectionsResponse> {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const projectedMonth = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;

  const prompt = `You are a financial analyst. Given the following monthly spending summary for the last ${historicalData.length} months, predict the next month's (${projectedMonth}) spending by category, total income, and total expenses.

Historical data:
${JSON.stringify(historicalData, null, 2)}

Current balance: $${currentBalance.toFixed(2)}

Return a JSON object with exactly this structure:
{
  "projectedSpending": { "category_name": amount, ... },
  "projectedIncome": number,
  "projectedExpenses": number,
  "confidence": "low" | "medium" | "high",
  "reasoning": "brief 1-2 sentence explanation"
}

Rules:
- Use the same category names from the historical data
- Base predictions on trends and averages in the data
- Set confidence based on data consistency: "high" if 4+ months of consistent data, "medium" if 2-3 months, "low" if 1 month or erratic patterns
- All amounts should be positive numbers rounded to 2 decimal places
- Be realistic and conservative in projections`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from AI');
  }

  const parsed = JSON.parse(content);

  const projectedNetWorth =
    Math.round((currentBalance + parsed.projectedIncome - parsed.projectedExpenses) * 100) / 100;

  return {
    projectedMonth,
    projectedSpending: parsed.projectedSpending,
    projectedIncome: parsed.projectedIncome,
    projectedExpenses: parsed.projectedExpenses,
    projectedNetWorth,
    currentBalance: Math.round(currentBalance * 100) / 100,
    confidence: parsed.confidence,
    reasoning: parsed.reasoning,
  };
}
