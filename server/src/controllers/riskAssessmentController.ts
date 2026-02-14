import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, RiskOnboarding } from '../types';
import { supabase } from '../config/supabase';
import { calculateRiskScore } from '../services/riskScoringService';

export async function getOnboarding(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('risk_onboarding')
      .select('*')
      .eq('user_id', req.userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({ data: data || null });
  } catch (err) {
    next(err);
  }
}

export async function submitOnboarding(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      monthly_income,
      income_source,
      fixed_obligations,
      savings_target_percentage,
      primary_goal,
      essential_categories,
    } = req.body;

    if (!monthly_income || !income_source) {
      res.status(400).json({ error: 'monthly_income and income_source are required' });
      return;
    }

    const { data, error } = await supabase
      .from('risk_onboarding')
      .upsert(
        {
          user_id: req.userId,
          monthly_income,
          income_source,
          fixed_obligations: fixed_obligations || [],
          savings_target_percentage: savings_target_percentage ?? 20,
          primary_goal: primary_goal || 'general_savings',
          essential_categories: essential_categories || [
            'Rent & Housing',
            'Utilities',
            'Transport',
            'Health',
          ],
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) throw error;

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function updateOnboarding(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    const allowedFields = [
      'monthly_income',
      'income_source',
      'fixed_obligations',
      'savings_target_percentage',
      'primary_goal',
      'essential_categories',
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const { data, error } = await supabase
      .from('risk_onboarding')
      .update(updates)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getScore(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const force = req.query.force === 'true';
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Check onboarding exists
    const { data: onboarding, error: onbErr } = await supabase
      .from('risk_onboarding')
      .select('*')
      .eq('user_id', req.userId)
      .single();

    if (onbErr || !onboarding) {
      res.status(400).json({ error: 'Complete onboarding first' });
      return;
    }

    // Check for cached score this month
    if (!force) {
      const { data: cached, error: cacheErr } = await supabase
        .from('risk_scores')
        .select('*')
        .eq('user_id', req.userId)
        .eq('calculated_for_month', currentMonth)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!cacheErr && cached) {
        res.json({ score: cached });
        return;
      }
    }

    // Calculate fresh score
    const score = await calculateRiskScore(req.userId, onboarding as RiskOnboarding);

    // Save to DB
    const { data: saved, error: saveErr } = await supabase
      .from('risk_scores')
      .insert({
        user_id: req.userId,
        overall_score: score.overall_score,
        rating: score.rating,
        sub_scores: score.sub_scores,
        breakdown: score.breakdown,
        ai_tips: score.ai_tips,
        calculated_for_month: currentMonth,
      })
      .select()
      .single();

    if (saveErr) throw saveErr;

    res.json({ score: saved });
  } catch (err) {
    next(err);
  }
}

export async function getScoreHistory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const months = Math.min(parseInt(req.query.months as string) || 6, 24);

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const cutoffMonth = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('risk_scores')
      .select('*')
      .eq('user_id', req.userId)
      .gte('calculated_for_month', cutoffMonth)
      .order('calculated_for_month', { ascending: true });

    if (error) throw error;

    // Deduplicate: keep the latest score per month
    const byMonth = new Map<string, any>();
    for (const row of data || []) {
      byMonth.set(row.calculated_for_month, row);
    }

    res.json({ history: Array.from(byMonth.values()) });
  } catch (err) {
    next(err);
  }
}
