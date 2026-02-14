import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDate(dateStr);
}

export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': 'bg-orange-100 text-orange-700',
  Shopping: 'bg-purple-100 text-purple-700',
  Transport: 'bg-blue-100 text-blue-700',
  Entertainment: 'bg-pink-100 text-pink-700',
  Health: 'bg-green-100 text-green-700',
  Utilities: 'bg-yellow-100 text-yellow-700',
  'Rent & Housing': 'bg-indigo-100 text-indigo-700',
  Travel: 'bg-cyan-100 text-cyan-700',
  Income: 'bg-emerald-100 text-emerald-700',
  Transfers: 'bg-gray-100 text-gray-700',
  Other: 'bg-slate-100 text-slate-700',
};
