import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { supabase } from '../config/supabase';
import type { TaxCategory, TaxCategoryGroup, TaxTransactionItem } from '../types';

const VALID_TAX_CATEGORIES: TaxCategory[] = ['business', 'medical', 'charity'];

export async function getLocale(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('tax_locale_settings')
      .select('country, state')
      .eq('user_id', req.userId)
      .maybeSingle();

    if (error) throw error;

    res.json({ data: data ?? null });
  } catch (err) {
    next(err);
  }
}

export async function upsertLocale(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { country, state } = req.body as { country?: string; state?: string };

    if (!country || typeof country !== 'string' || !country.trim()) {
      res.status(400).json({ error: 'country is required' });
      return;
    }

    const { data, error } = await supabase
      .from('tax_locale_settings')
      .upsert(
        {
          user_id: req.userId,
          country: country.trim(),
          state: (state ?? '').trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select('country, state, updated_at')
      .single();

    if (error) throw error;

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function tagTransaction(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { tax_category } = req.body as { tax_category: TaxCategory | null };

    if (tax_category !== null && !VALID_TAX_CATEGORIES.includes(tax_category)) {
      res.status(400).json({
        error: `tax_category must be one of: ${VALID_TAX_CATEGORIES.join(', ')} or null`,
      });
      return;
    }

    const { data, error } = await supabase
      .from('transactions')
      .update({ tax_category: tax_category ?? null })
      .eq('id', id)
      .eq('user_id', req.userId)
      .select('id, tax_category')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }
      throw error;
    }

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getAnnualSummary(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const yearParam = req.query.year as string | undefined;
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    if (isNaN(year) || year < 2000 || year > 2100) {
      res.status(400).json({ error: 'year must be a valid 4-digit year' });
      return;
    }

    const fromDate = `${year}-01-01`;
    const toDate = `${year}-12-31`;

    const { data, error } = await supabase
      .from('transactions')
      .select('id, date, description, amount, category, tax_category')
      .eq('user_id', req.userId)
      .gte('date', fromDate)
      .lte('date', toDate)
      .not('tax_category', 'is', null)
      .order('date', { ascending: false });

    if (error) throw error;

    const transactions = data ?? [];

    const emptyGroup = (): TaxCategoryGroup => ({ total: 0, count: 0, transactions: [] });

    const tagged: Record<TaxCategory, TaxCategoryGroup> = {
      business: emptyGroup(),
      medical: emptyGroup(),
      charity: emptyGroup(),
    };

    for (const t of transactions) {
      const cat = t.tax_category as TaxCategory;
      if (!tagged[cat]) continue;
      const amount = Number(t.amount);
      tagged[cat].total = Math.round((tagged[cat].total + amount) * 100) / 100;
      tagged[cat].count += 1;
      tagged[cat].transactions.push({
        id: t.id,
        date: t.date,
        description: t.description,
        amount,
        category: t.category,
        tax_category: cat,
      } satisfies TaxTransactionItem);
    }

    const grandTotal =
      Math.round(
        (tagged.business.total + tagged.medical.total + tagged.charity.total) * 100
      ) / 100;

    res.json({
      year,
      tagged,
      grandTotal,
      transactionCount: transactions.length,
    });
  } catch (err) {
    next(err);
  }
}
