import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  userId: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  statement_id: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  category: string;
  created_at: string;
}

export interface BankStatement {
  id: string;
  user_id: string;
  filename: string;
  bank_name: string | null;
  statement_period_start: string | null;
  statement_period_end: string | null;
  uploaded_at: string;
  is_default: boolean;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error: string | null;
  file_path: string | null;
}

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  category: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface MonthlyTrend {
  month: string;
  totalDebits: number;
  totalCredits: number;
  net: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
}

export interface TrendsResponse {
  monthly: MonthlyTrend[];
  byCategory: CategoryBreakdown[];
}

export interface MonthlyReportCategory {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlyReportResponse {
  month: string;
  summary: { totalCredits: number; totalDebits: number; balance: number };
  byCategory: MonthlyReportCategory[];
  topTransactions: Array<{ date: string; description: string; amount: number; category: string; type: string }>;
  transactionCount: number;
}

export interface ProjectionsResponse {
  projectedMonth: string;
  projectedSpending: Record<string, number>;
  projectedIncome: number;
  projectedExpenses: number;
  projectedNetWorth: number;
  currentBalance: number;
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
}

export interface FixedObligation {
  name: string;
  amount: number;
  category: string;
}

export interface RiskOnboarding {
  id: string;
  user_id: string;
  monthly_income: number;
  income_source: 'salaried' | 'freelance' | 'business' | 'mixed';
  fixed_obligations: FixedObligation[];
  savings_target_percentage: number;
  primary_goal: 'debt_payoff' | 'emergency_fund' | 'investment' | 'retirement' | 'general_savings';
  essential_categories: string[];
  created_at: string;
  updated_at: string;
}

export interface RiskSubScores {
  budget_adherence: number;
  expense_to_income: number;
  category_concentration: number;
  spending_volatility: number;
  recurring_vs_discretionary: number;
  savings_rate: number;
  trend_direction: number;
}

export interface RiskBreakdown {
  needs_pct: number;
  wants_pct: number;
  savings_pct: number;
  total_income: number;
  total_expenses: number;
  expense_to_income_ratio: number;
  hhi_index: number;
  volatility_cv: number;
  discretionary_ratio: number;
  actual_savings_rate: number;
  spending_trend_slope: number;
  months_analyzed: number;
}

export interface RiskScore {
  id: string;
  user_id: string;
  overall_score: number;
  rating: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  sub_scores: RiskSubScores;
  breakdown: RiskBreakdown;
  ai_tips: string[];
  calculated_for_month: string;
  created_at: string;
}
