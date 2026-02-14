import { useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/app/store';
import apiClient from '@/lib/apiClient';
import { setOnboarding, setOnboardingSubmitting } from './riskAssessmentSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  Briefcase,
  Target,
  CheckSquare,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
} from 'lucide-react';
import type { FixedObligation, RiskOnboarding } from '@/types';

const ALL_CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Transport',
  'Entertainment',
  'Health',
  'Utilities',
  'Rent & Housing',
  'Travel',
  'Income',
  'Transfers',
  'Other',
];

const DEFAULT_ESSENTIAL = ['Rent & Housing', 'Utilities', 'Transport', 'Health'];

const INCOME_SOURCES = [
  { value: 'salaried', label: 'Salaried' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'business', label: 'Business Owner' },
  { value: 'mixed', label: 'Mixed Income' },
];

const GOALS = [
  { value: 'debt_payoff', label: 'Pay Off Debt', description: 'Focus on eliminating outstanding debts' },
  { value: 'emergency_fund', label: 'Emergency Fund', description: 'Build a financial safety net' },
  { value: 'investment', label: 'Grow Investments', description: 'Maximize investment portfolio' },
  { value: 'retirement', label: 'Retirement', description: 'Save for a comfortable retirement' },
  { value: 'general_savings', label: 'General Savings', description: 'Build overall savings' },
];

const STEPS = [
  { icon: DollarSign, title: 'Income', description: 'Tell us about your income' },
  { icon: Briefcase, title: 'Obligations', description: 'Your fixed monthly expenses' },
  { icon: Target, title: 'Goals', description: 'Set your financial targets' },
  { icon: CheckSquare, title: 'Categories', description: 'Customize your essentials' },
];

interface OnboardingWizardProps {
  existingData?: RiskOnboarding | null;
  onComplete: () => void;
}

export function OnboardingWizard({ existingData, onComplete }: OnboardingWizardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [monthlyIncome, setMonthlyIncome] = useState(existingData?.monthly_income?.toString() || '');
  const [incomeSource, setIncomeSource] = useState(existingData?.income_source || 'salaried');
  const [obligations, setObligations] = useState<FixedObligation[]>(
    existingData?.fixed_obligations?.length
      ? existingData.fixed_obligations
      : [
          { name: 'Rent', amount: 0, category: 'Rent & Housing' },
          { name: 'Insurance', amount: 0, category: 'Health' },
        ]
  );
  const [savingsTarget, setSavingsTarget] = useState(existingData?.savings_target_percentage ?? 20);
  const [primaryGoal, setPrimaryGoal] = useState(existingData?.primary_goal || 'general_savings');
  const [essentialCategories, setEssentialCategories] = useState<string[]>(
    existingData?.essential_categories || DEFAULT_ESSENTIAL
  );

  function addObligation() {
    setObligations([...obligations, { name: '', amount: 0, category: 'Other' }]);
  }

  function removeObligation(index: number) {
    setObligations(obligations.filter((_, i) => i !== index));
  }

  function updateObligation(index: number, field: keyof FixedObligation, value: string | number) {
    const updated = [...obligations];
    updated[index] = { ...updated[index], [field]: value };
    setObligations(updated);
  }

  function toggleCategory(category: string) {
    setEssentialCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  }

  function canProceed(): boolean {
    if (step === 0) return !!monthlyIncome && Number(monthlyIncome) > 0;
    return true;
  }

  async function handleSubmit() {
    setError(null);
    dispatch(setOnboardingSubmitting(true));

    try {
      const payload = {
        monthly_income: Number(monthlyIncome),
        income_source: incomeSource,
        fixed_obligations: obligations.filter((o) => o.name && o.amount > 0),
        savings_target_percentage: savingsTarget,
        primary_goal: primaryGoal,
        essential_categories: essentialCategories,
      };

      const method = existingData ? 'put' : 'post';
      const { data } = await apiClient[method]('/risk-assessment/onboarding', payload);
      dispatch(setOnboarding(data.data));
      onComplete();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save onboarding data');
    } finally {
      dispatch(setOnboardingSubmitting(false));
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Spend Risk Assessment</h1>
        <p className="text-sm text-gray-500">
          Let's set up your financial profile to calculate your spending risk score
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  i < step
                    ? 'bg-blue-600 text-white'
                    : i === step
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <s.icon className="h-4 w-4" />
              </div>
              <span
                className={`text-xs mt-1.5 ${
                  i <= step ? 'text-blue-600 font-medium' : 'text-gray-400'
                }`}
              >
                {s.title}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-1 mt-[-18px] ${
                  i < step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">{STEPS[step].title}</h2>
        <p className="text-sm text-gray-500 mb-6">{STEPS[step].description}</p>

        {/* Step 1: Income */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="income" className="text-sm font-medium text-gray-700">
                Monthly Income
              </Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <Input
                  id="income"
                  type="number"
                  placeholder="5000"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="pl-7"
                  min={0}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Your gross monthly income from all sources
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Income Source</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {INCOME_SOURCES.map((src) => (
                  <button
                    key={src.value}
                    type="button"
                    onClick={() => setIncomeSource(src.value as any)}
                    className={`px-3 py-2.5 rounded-lg border text-sm text-left transition-colors ${
                      incomeSource === src.value
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {src.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Fixed Obligations */}
        {step === 1 && (
          <div className="space-y-3">
            {obligations.map((ob, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder="Name (e.g., Rent)"
                  value={ob.name}
                  onChange={(e) => updateObligation(i, 'name', e.target.value)}
                  className="flex-1"
                />
                <div className="relative w-28">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    $
                  </span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={ob.amount || ''}
                    onChange={(e) => updateObligation(i, 'amount', Number(e.target.value))}
                    className="pl-6"
                    min={0}
                  />
                </div>
                <Select
                  value={ob.category}
                  onValueChange={(v) => updateObligation(i, 'category', v)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_CATEGORIES.filter((c) => c !== 'Income' && c !== 'Transfers').map(
                      (cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => removeObligation(i)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addObligation} className="mt-2">
              <Plus className="h-3.5 w-3.5" />
              Add Obligation
            </Button>
            <p className="text-xs text-gray-400 mt-2">
              Add your recurring monthly expenses like rent, loan EMIs, insurance, and subscriptions
            </p>
          </div>
        )}

        {/* Step 3: Financial Goals */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <Label className="text-sm font-medium text-gray-700">Savings Target</Label>
              <div className="flex items-center gap-4 mt-2">
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={savingsTarget}
                  onChange={(e) => setSavingsTarget(Number(e.target.value))}
                  className="flex-1 accent-blue-600"
                />
                <span className="text-lg font-semibold text-blue-600 w-14 text-right">
                  {savingsTarget}%
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                The 50/30/20 rule recommends saving at least 20% of income
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Primary Financial Goal</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {GOALS.map((goal) => (
                  <button
                    key={goal.value}
                    type="button"
                    onClick={() => setPrimaryGoal(goal.value as any)}
                    className={`px-4 py-3 rounded-lg border text-left transition-colors ${
                      primaryGoal === goal.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        primaryGoal === goal.value ? 'text-blue-700' : 'text-gray-900'
                      }`}
                    >
                      {goal.label}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">{goal.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Category Preferences */}
        {step === 3 && (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Select which spending categories you consider <strong>essential needs</strong>.
              Everything else will be treated as discretionary wants.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ALL_CATEGORIES.filter((c) => c !== 'Income' && c !== 'Transfers').map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                    essentialCategories.includes(cat)
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      essentialCategories.includes(cat)
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {essentialCategories.includes(cat) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
            className={step === 0 ? 'invisible' : ''}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed()}>
              Calculate My Score
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
