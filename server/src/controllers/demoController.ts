import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { supabase } from '../config/supabase';
import { DEMO_TRANSACTIONS, DEMO_STATEMENT, DEMO_EMAIL } from '../data/demoTransactions';

export async function seedDemoData(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;

    // Verify this is the demo user by checking their email
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    if (userData?.user?.email !== DEMO_EMAIL) {
      res.status(403).json({ error: 'Seed is only available for the demo account' });
      return;
    }

    // Check if demo data already exists (idempotent)
    const { count } = await supabase
      .from('bank_statements')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (count && count > 0) {
      res.json({ status: 'already_seeded' });
      return;
    }

    // Insert bank statement record
    const { data: statement, error: stmtError } = await supabase
      .from('bank_statements')
      .insert({
        user_id: userId,
        filename: DEMO_STATEMENT.filename,
        bank_name: DEMO_STATEMENT.bank_name,
        statement_period_start: DEMO_STATEMENT.statement_period_start,
        statement_period_end: DEMO_STATEMENT.statement_period_end,
        processing_status: 'completed',
        is_default: true,
      })
      .select()
      .single();

    if (stmtError) throw stmtError;

    // Insert all transactions in batches of 50
    const transactions = DEMO_TRANSACTIONS.map((t) => ({
      user_id: userId,
      statement_id: statement.id,
      date: t.date,
      description: t.description,
      amount: t.amount,
      type: t.type,
      category: t.category,
    }));

    for (let i = 0; i < transactions.length; i += 50) {
      const batch = transactions.slice(i, i + 50);
      const { error: txError } = await supabase
        .from('transactions')
        .insert(batch);
      if (txError) throw txError;
    }

    res.json({ status: 'seeded', transactionCount: transactions.length });
  } catch (err) {
    next(err);
  }
}
