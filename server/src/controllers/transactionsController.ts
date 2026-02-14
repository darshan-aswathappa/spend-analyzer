import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, MonthlyTrend, CategoryBreakdown } from '../types';
import { supabase } from '../config/supabase';
import { generateProjections } from '../services/projectionService';

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

export async function getTrends(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { months = '6', statement_id } = req.query as Record<string, string>;
    const monthCount = Math.min(parseInt(months) || 6, 24);

    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - monthCount);
    const fromStr = fromDate.toISOString().split('T')[0];

    let query = supabase
      .from('transactions')
      .select('date, amount, type, category')
      .eq('user_id', req.userId)
      .gte('date', fromStr)
      .order('date', { ascending: true });

    if (statement_id) query = query.eq('statement_id', statement_id);

    const { data, error } = await query;
    if (error) throw error;

    // Aggregate by month
    const monthMap = new Map<string, { totalDebits: number; totalCredits: number }>();
    const categoryMap = new Map<string, number>();

    for (const t of data || []) {
      const month = t.date.substring(0, 7); // "YYYY-MM"
      const entry = monthMap.get(month) || { totalDebits: 0, totalCredits: 0 };
      const amount = Number(t.amount);

      if (t.type === 'debit') {
        entry.totalDebits += amount;
        categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + amount);
      } else {
        entry.totalCredits += amount;
      }
      monthMap.set(month, entry);
    }

    const monthly: MonthlyTrend[] = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, { totalDebits, totalCredits }]) => ({
        month,
        totalDebits: Math.round(totalDebits * 100) / 100,
        totalCredits: Math.round(totalCredits * 100) / 100,
        net: Math.round((totalCredits - totalDebits) * 100) / 100,
      }));

    const byCategory: CategoryBreakdown[] = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category, total]) => ({
        category,
        total: Math.round(total * 100) / 100,
      }));

    res.json({ monthly, byCategory });
  } catch (err) {
    next(err);
  }
}

export async function getProjections(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { statement_id } = req.query as Record<string, string>;

    // Fetch last 6 months of transactions
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - 6);
    const fromStr = fromDate.toISOString().split('T')[0];

    let query = supabase
      .from('transactions')
      .select('date, amount, type, category')
      .eq('user_id', req.userId)
      .gte('date', fromStr)
      .order('date', { ascending: true });

    if (statement_id) query = query.eq('statement_id', statement_id);

    const { data: recentData, error: recentError } = await query;
    if (recentError) throw recentError;

    // Fetch ALL transactions to compute current balance
    let balanceQuery = supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', req.userId);

    if (statement_id) balanceQuery = balanceQuery.eq('statement_id', statement_id);

    const { data: allData, error: allError } = await balanceQuery;
    if (allError) throw allError;

    const currentBalance = (allData || []).reduce((sum, t) => {
      const amount = Number(t.amount);
      return sum + (t.type === 'credit' ? amount : -amount);
    }, 0);

    // Aggregate recent data by month for AI
    const monthlyAggregates = new Map<string, { byCategory: Record<string, number>; totalIncome: number; totalExpenses: number }>();
    for (const t of recentData || []) {
      const month = t.date.substring(0, 7);
      const entry = monthlyAggregates.get(month) || { byCategory: {}, totalIncome: 0, totalExpenses: 0 };
      const amount = Number(t.amount);

      if (t.type === 'debit') {
        entry.totalExpenses += amount;
        entry.byCategory[t.category] = (entry.byCategory[t.category] || 0) + amount;
      } else {
        entry.totalIncome += amount;
      }
      monthlyAggregates.set(month, entry);
    }

    const historicalData = Array.from(monthlyAggregates.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));

    if (historicalData.length === 0) {
      res.json({
        projectedMonth: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().substring(0, 7),
        projectedSpending: {},
        projectedIncome: 0,
        projectedExpenses: 0,
        projectedNetWorth: currentBalance,
        currentBalance: Math.round(currentBalance * 100) / 100,
        confidence: 'low',
        reasoning: 'Not enough historical data to make projections.',
      });
      return;
    }

    const projections = await generateProjections(historicalData, currentBalance);
    res.json(projections);
  } catch (err) {
    next(err);
  }
}
