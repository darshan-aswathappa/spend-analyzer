import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { supabase } from '../config/supabase';

export async function getMonthlyReport(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { month, statement_id } = req.query as Record<string, string>;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      res.status(400).json({ error: 'month query param required in YYYY-MM format' });
      return;
    }

    const [year, mon] = month.split('-').map(Number);
    const startDate = `${month}-01`;
    const lastDay = new Date(year, mon, 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('amount', { ascending: false });

    if (statement_id) query = query.eq('statement_id', statement_id);

    const { data, error } = await query;
    if (error) throw error;

    const transactions = data || [];

    const totalCredits = transactions
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalDebits = transactions
      .filter((t) => t.type === 'debit')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Category breakdown
    const categoryMap = new Map<string, { amount: number; count: number }>();
    for (const t of transactions) {
      if (t.type === 'debit') {
        const entry = categoryMap.get(t.category) || { amount: 0, count: 0 };
        entry.amount += Number(t.amount);
        entry.count += 1;
        categoryMap.set(t.category, entry);
      }
    }

    const byCategory = Array.from(categoryMap.entries())
      .sort((a, b) => b[1].amount - a[1].amount)
      .map(([category, { amount, count }]) => ({
        category,
        amount: Math.round(amount * 100) / 100,
        percentage: totalDebits > 0 ? Math.round((amount / totalDebits) * 1000) / 10 : 0,
        transactionCount: count,
      }));

    // Top 10 transactions by amount
    const topTransactions = transactions.slice(0, 10).map((t) => ({
      date: t.date,
      description: t.description,
      amount: Number(t.amount),
      category: t.category,
      type: t.type,
    }));

    res.json({
      month,
      summary: {
        totalCredits: Math.round(totalCredits * 100) / 100,
        totalDebits: Math.round(totalDebits * 100) / 100,
        balance: Math.round((totalCredits - totalDebits) * 100) / 100,
      },
      byCategory,
      topTransactions,
      transactionCount: transactions.length,
    });
  } catch (err) {
    next(err);
  }
}
