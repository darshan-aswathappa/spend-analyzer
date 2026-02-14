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
