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
}

export interface TransactionSummary {
  totalCredits: number;
  totalDebits: number;
  balance: number;
  byCategory: Record<string, number>;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
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

export interface TrendsData {
  monthly: MonthlyTrend[];
  byCategory: CategoryBreakdown[];
}

export interface ProjectionsData {
  projectedMonth: string;
  projectedSpending: Record<string, number>;
  projectedIncome: number;
  projectedExpenses: number;
  projectedNetWorth: number;
  currentBalance: number;
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
}

export interface MonthlyReportCategory {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlyReportData {
  month: string;
  summary: { totalCredits: number; totalDebits: number; balance: number };
  byCategory: MonthlyReportCategory[];
  topTransactions: Array<{ date: string; description: string; amount: number; category: string; type: string }>;
  transactionCount: number;
}
