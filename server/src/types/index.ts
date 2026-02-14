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
