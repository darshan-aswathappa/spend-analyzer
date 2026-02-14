import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { supabase } from '../config/supabase';

async function resolveStatementId(userId: string, queryStatementId?: string): Promise<string | null> {
  if (queryStatementId) return queryStatementId;

  const { data } = await supabase
    .from('bank_statements')
    .select('id')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();

  return data?.id || null;
}

export async function getTransactions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { category, type, from, to, limit = '100', offset = '0', statement_id } = req.query as Record<string, string>;

    const activeStatementId = await resolveStatementId(req.userId, statement_id);

    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', req.userId)
      .order('date', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (activeStatementId) query = query.eq('statement_id', activeStatementId);
    if (category) query = query.eq('category', category);
    if (type) query = query.eq('type', type);
    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ transactions: data, total: count });
  } catch (err) {
    next(err);
  }
}

export async function getSummary(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { statement_id } = req.query as Record<string, string>;
    const activeStatementId = await resolveStatementId(req.userId, statement_id);

    let query = supabase
      .from('transactions')
      .select('amount, type, category')
      .eq('user_id', req.userId);

    if (activeStatementId) query = query.eq('statement_id', activeStatementId);

    const { data, error } = await query;
    if (error) throw error;

    const totalCredits = data
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalDebits = data
      .filter((t) => t.type === 'debit')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const byCategory = data
      .filter((t) => t.type === 'debit')
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {});

    res.json({
      totalCredits,
      totalDebits,
      balance: totalCredits - totalDebits,
      byCategory,
    });
  } catch (err) {
    next(err);
  }
}
