import { supabase } from '../config/supabase';
import { Transaction } from '../types';

const DISCRETIONARY_CATEGORIES = ['Entertainment', 'Shopping', 'Travel', 'Food & Dining'];

const BASE_RISK: Record<string, 'High' | 'Medium' | 'Low'> = {
  Entertainment: 'High',
  Shopping: 'High',
  Travel: 'High',
  Transfers: 'High',
  'Food & Dining': 'Medium',
  Transport: 'Medium',
  Other: 'Medium',
  Utilities: 'Low',
  'Rent & Housing': 'Low',
  Health: 'Low',
  Income: 'Low',
};

const RISK_KEYWORDS: Record<string, string[]> = {
  payday_lender: [
    'payday', 'cash advance', 'moneylion', 'earnin', 'brigit',
    'speedy cash', 'advance america', 'check cashing', 'loan mart',
    'checksmart', 'ace cash', 'loanmart', 'curo',
  ],
  gambling: [
    'draftkings', 'fanduel', 'betmgm', 'bet365', 'pokerstars', 'casino',
    'lottery', 'sportsbook', 'bovada', 'pointsbet', 'betrivers', 'barstool',
    'mybookie', 'betonline', 'betway',
  ],
  predatory: [
    'rent-a-center', 'rentacenter', 'brighthouse', 'flexshopper',
    'katapult', 'progressive leasing', 'tempoe',
  ],
};

const RISK_LEVEL_ORDER: ('Low' | 'Medium' | 'High')[] = ['Low', 'Medium', 'High'];

function bumpRisk(level: 'Low' | 'Medium' | 'High'): 'Low' | 'Medium' | 'High' {
  const idx = RISK_LEVEL_ORDER.indexOf(level);
  return RISK_LEVEL_ORDER[Math.min(idx + 1, 2)];
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().substring(0, 10);
}

// ─── Impulse Spending Score ───────────────────────────────────────────────────

export async function getImpulseScore(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, date, description, amount, type, category')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  if (error) throw error;

  const txns = (data || []) as Transaction[];
  const debits = txns.filter((t) => t.type === 'debit');
  const credits = txns.filter((t) => t.type === 'credit' && t.category === 'Income');

  const totalDebits = debits.reduce((s, t) => s + Number(t.amount), 0);
  const discDebits = debits.filter((t) => DISCRETIONARY_CATEGORIES.includes(t.category));
  const totalDisc = discDebits.reduce((s, t) => s + Number(t.amount), 0);
  const disc_pct = totalDebits > 0 ? totalDisc / totalDebits : 0;

  // Post-payday detection
  let post_payday_ratio = 0;
  if (credits.length > 0) {
    const windows: number[] = [];
    for (const income of credits) {
      const d0 = income.date;
      const d3 = addDays(d0, 3);
      const window_disc = debits
        .filter(
          (t) =>
            DISCRETIONARY_CATEGORIES.includes(t.category) &&
            t.date >= d0 &&
            t.date <= d3
        )
        .reduce((s, t) => s + Number(t.amount), 0);
      windows.push(window_disc);
    }

    const avg_post_payday = windows.reduce((a, b) => a + b, 0) / windows.length;

    // Average 3-day discretionary window across the full period
    const dateSet = new Set(debits.map((t) => t.date));
    const total_days = dateSet.size || 1;
    const avg_normal_3d = (totalDisc / total_days) * 3;

    post_payday_ratio = avg_normal_3d > 0 ? avg_post_payday / avg_normal_3d : 1;
  }

  // Score: higher = more impulsive (bad)
  const disc_component = disc_pct * 60;
  const payday_component = credits.length > 0 ? Math.min(Math.max(post_payday_ratio - 1, 0), 1) * 40 : 0;
  const score = clamp(Math.round(disc_component + payday_component), 0, 100);

  const rating: 'Low' | 'Medium' | 'High' = score < 35 ? 'Low' : score < 65 ? 'Medium' : 'High';

  const top_transactions = discDebits
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 5)
    .map((t) => ({
      date: t.date,
      description: t.description,
      amount: Number(t.amount),
      category: t.category,
    }));

  const months = new Set(txns.map((t) => t.date.substring(0, 7))).size;

  return {
    score,
    rating,
    discretionary_pct: Math.round(disc_pct * 1000) / 10,
    post_payday_ratio: Math.round(post_payday_ratio * 100) / 100,
    top_transactions,
    months_analyzed: months,
  };
}

// ─── Category Risk Heatmap ────────────────────────────────────────────────────

export async function getCategoryHeatmap(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('date, amount, category, type')
    .eq('user_id', userId)
    .eq('type', 'debit')
    .order('date', { ascending: true });

  if (error) throw error;

  const txns = (data || []) as Transaction[];

  // Group by category → month → total
  const catMonthMap = new Map<string, Map<string, number>>();
  for (const t of txns) {
    const month = t.date.substring(0, 7);
    if (!catMonthMap.has(t.category)) catMonthMap.set(t.category, new Map());
    const mm = catMonthMap.get(t.category)!;
    mm.set(month, (mm.get(month) || 0) + Number(t.amount));
  }

  // Get sorted list of all months
  const allMonths = Array.from(
    new Set(txns.map((t) => t.date.substring(0, 7)))
  ).sort();
  const recentMonths = allMonths.slice(-6);
  const last3 = recentMonths.slice(-3);
  const prev3 = recentMonths.slice(-6, -3);

  const categories = [];
  for (const [name, monthMap] of catMonthMap.entries()) {
    if (name === 'Income') continue;

    const monthly_data = recentMonths.map((m) => ({
      month: m,
      amount: Math.round((monthMap.get(m) || 0) * 100) / 100,
    }));

    const last3_avg =
      last3.length > 0
        ? last3.reduce((s, m) => s + (monthMap.get(m) || 0), 0) / last3.length
        : 0;
    const prev3_avg =
      prev3.length > 0
        ? prev3.reduce((s, m) => s + (monthMap.get(m) || 0), 0) / prev3.length
        : 0;

    const trend_pct =
      prev3_avg > 0 ? Math.round(((last3_avg - prev3_avg) / prev3_avg) * 1000) / 10 : 0;

    const trend: 'up' | 'down' | 'flat' =
      trend_pct > 10 ? 'up' : trend_pct < -10 ? 'down' : 'flat';

    const base_risk = BASE_RISK[name] || 'Medium';
    const effective_risk =
      trend_pct > 25 && base_risk !== 'High' ? bumpRisk(base_risk) : base_risk;

    const latest_month_amount = monthMap.get(last3[last3.length - 1] || '') || 0;

    categories.push({
      name,
      base_risk,
      effective_risk,
      monthly_avg: Math.round(last3_avg * 100) / 100,
      latest_month_amount: Math.round(latest_month_amount * 100) / 100,
      trend,
      trend_pct,
      monthly_data,
    });
  }

  // Sort by effective risk then amount
  const riskOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
  categories.sort(
    (a, b) =>
      riskOrder[a.effective_risk] - riskOrder[b.effective_risk] ||
      b.monthly_avg - a.monthly_avg
  );

  return { categories, months_analyzed: allMonths.length };
}

// ─── Merchant Risk Flags ──────────────────────────────────────────────────────

export async function getMerchantFlags(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, date, description, amount, type')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw error;

  const txns = (data || []) as Transaction[];

  // Key: merchant_key → aggregated info
  type FlagEntry = {
    merchant_key: string;
    risk_type: string;
    risk_level: 'high';
    transaction_count: number;
    total_amount: number;
    latest_date: string;
    sample_description: string;
  };

  const flagMap = new Map<string, FlagEntry>();

  for (const t of txns) {
    const lower = t.description.toLowerCase();
    let matched_type: string | null = null;

    for (const [risk_type, keywords] of Object.entries(RISK_KEYWORDS)) {
      if (keywords.some((kw) => lower.includes(kw))) {
        matched_type = risk_type;
        break;
      }
    }

    if (!matched_type) continue;

    const key = t.description.substring(0, 35).trim();
    if (!flagMap.has(key)) {
      flagMap.set(key, {
        merchant_key: key,
        risk_type: matched_type,
        risk_level: 'high',
        transaction_count: 0,
        total_amount: 0,
        latest_date: t.date,
        sample_description: t.description,
      });
    }
    const entry = flagMap.get(key)!;
    entry.transaction_count += 1;
    entry.total_amount += Number(t.amount);
    if (t.date > entry.latest_date) entry.latest_date = t.date;
  }

  const flagged = Array.from(flagMap.values()).map((f) => ({
    ...f,
    total_amount: Math.round(f.total_amount * 100) / 100,
  }));

  return {
    flagged,
    total_flagged: flagged.length,
    total_risk_amount: Math.round(
      flagged.reduce((s, f) => s + f.total_amount, 0) * 100
    ) / 100,
  };
}

// ─── Payment Behavior Analysis ────────────────────────────────────────────────

const BILL_CATEGORIES = ['Utilities', 'Rent & Housing'];

const PAYMENT_THRESHOLDS: Record<string, { early: number; on_time: number }> = {
  'Rent & Housing': { early: 3, on_time: 8 },
  Utilities: { early: 10, on_time: 18 },
};

export async function getPaymentBehavior(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('date, description, amount, type, category')
    .eq('user_id', userId)
    .eq('type', 'debit')
    .in('category', BILL_CATEGORIES)
    .order('date', { ascending: true });

  if (error) throw error;

  const txns = (data || []) as Transaction[];

  // Group by normalized description key
  const groups = new Map<string, { category: string; months: Map<string, number> }>();
  for (const t of txns) {
    const key = t.description.toLowerCase().replace(/[^a-z\s]/g, '').trim().substring(0, 25);
    if (!groups.has(key)) groups.set(key, { category: t.category, months: new Map() });
    const g = groups.get(key)!;
    const month = t.date.substring(0, 7);
    g.months.set(month, parseInt(t.date.split('-')[2]));
  }

  // Only keep recurring (2+ months)
  const recurring = Array.from(groups.entries()).filter(([, g]) => g.months.size >= 2);

  let early = 0, on_time = 0, late = 0, missed = 0;

  const bills = recurring.map(([key, g]) => {
    const thresholds = PAYMENT_THRESHOLDS[g.category] || { early: 10, on_time: 18 };
    const sortedMonths = Array.from(g.months.keys()).sort();
    const paymentDays = Array.from(g.months.values());
    const avg_payment_day = Math.round(
      paymentDays.reduce((a, b) => a + b, 0) / paymentDays.length
    );

    // Check for missing months between first and last
    const firstDate = new Date(sortedMonths[0] + '-01');
    const lastDate = new Date(sortedMonths[sortedMonths.length - 1] + '-01');
    let expected = 0;
    const cursor = new Date(firstDate);
    while (cursor <= lastDate) {
      expected++;
      cursor.setMonth(cursor.getMonth() + 1);
    }
    const missed_count = Math.max(0, expected - sortedMonths.length);
    missed += missed_count;

    for (const day of paymentDays) {
      if (day <= thresholds.early) early++;
      else if (day <= thresholds.on_time) on_time++;
      else late++;
    }

    const behavior: 'early' | 'on_time' | 'late' =
      avg_payment_day <= thresholds.early
        ? 'early'
        : avg_payment_day <= thresholds.on_time
        ? 'on_time'
        : 'late';

    return {
      name: key.charAt(0).toUpperCase() + key.slice(1),
      category: g.category,
      avg_payment_day,
      occurrences: sortedMonths.length,
      behavior,
    };
  });

  const total = early + on_time + late + missed;
  const raw_score =
    total > 0
      ? (early * 100 + on_time * 75 + late * 35) / (total * 100)
      : null;

  const score = raw_score !== null ? Math.round(raw_score * 100) : null;
  const rating =
    score === null
      ? null
      : score >= 80
      ? 'excellent'
      : score >= 60
      ? 'good'
      : score >= 40
      ? 'fair'
      : 'poor';

  const allMonths = new Set(txns.map((t) => t.date.substring(0, 7))).size;

  return {
    score,
    rating,
    breakdown: { early, on_time, late, missed },
    bills,
    months_analyzed: allMonths,
  };
}

// ─── Spending Velocity Alerts ─────────────────────────────────────────────────

export async function getVelocityAlerts(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('date, amount, type')
    .eq('user_id', userId)
    .eq('type', 'debit')
    .order('date', { ascending: true });

  if (error) throw error;

  const txns = (data || []) as Transaction[];

  // Group by month
  const monthMap = new Map<string, number>();
  const dayMap = new Map<string, number>(); // date → total
  for (const t of txns) {
    const month = t.date.substring(0, 7);
    monthMap.set(month, (monthMap.get(month) || 0) + Number(t.amount));
    dayMap.set(t.date, (dayMap.get(t.date) || 0) + Number(t.amount));
  }

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const days_elapsed = now.getDate();
  const days_in_month = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const current_month_total = Math.round((monthMap.get(currentMonth) || 0) * 100) / 100;
  const projected_monthly =
    days_elapsed > 0
      ? Math.round((current_month_total / days_elapsed) * days_in_month * 100) / 100
      : 0;

  // Last 3 complete months
  const allMonths = Array.from(monthMap.keys())
    .filter((m) => m < currentMonth)
    .sort()
    .slice(-3);

  const three_month_avg =
    allMonths.length > 0
      ? Math.round(
          (allMonths.reduce((s, m) => s + (monthMap.get(m) || 0), 0) / allMonths.length) * 100
        ) / 100
      : 0;

  const velocity_ratio =
    three_month_avg > 0
      ? Math.round((projected_monthly / three_month_avg) * 100) / 100
      : 1;

  const alert_level: 'normal' | 'warning' | 'critical' =
    velocity_ratio >= 1.5 ? 'critical' : velocity_ratio >= 1.2 ? 'warning' : 'normal';

  // Burst days: current month daily spending > 2x daily average
  const daily_avg = days_elapsed > 0 ? current_month_total / days_elapsed : 0;
  const burst_days = Array.from(dayMap.entries())
    .filter(([date, amt]) => date.startsWith(currentMonth) && amt > daily_avg * 2)
    .map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }));

  const monthly_history = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 }));

  return {
    current_month_total,
    projected_monthly,
    three_month_avg,
    velocity_ratio,
    alert_level,
    days_elapsed,
    days_in_month,
    monthly_history,
    burst_days,
    months_analyzed: allMonths.length,
  };
}
