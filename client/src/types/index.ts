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
