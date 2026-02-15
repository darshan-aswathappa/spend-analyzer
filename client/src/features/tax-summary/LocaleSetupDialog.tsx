import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MapPin, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { AppDispatch, RootState } from '@/app/store';
import { saveTaxLocale } from './taxSummarySlice';
import { COUNTRIES, US_STATES, CA_PROVINCES, AU_STATES, IN_STATES } from './constants';

interface Props {
  open: boolean;
  mode: 'setup' | 'edit';
  onClose?: () => void;
}

function getSubdivisions(country: string) {
  switch (country) {
    case 'US': return US_STATES;
    case 'CA': return CA_PROVINCES;
    case 'AU': return AU_STATES;
    case 'IN': return IN_STATES;
    default: return null;
  }
}

export function LocaleSetupDialog({ open, mode, onClose }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { locale, localeSaving } = useSelector((state: RootState) => state.taxSummary);

  const [country, setCountry] = useState(locale?.country ?? '');
  const [stateVal, setStateVal] = useState(locale?.state ?? '');
  const [freeText, setFreeText] = useState('');

  const subdivisions = country ? getSubdivisions(country) : null;

  const effectiveState = subdivisions ? stateVal : freeText;

  async function handleSave() {
    if (!country) return;
    await dispatch(saveTaxLocale({ country, state: effectiveState }));
    onClose?.();
  }

  const countryLabel = COUNTRIES.find((c) => c.value === country)?.label ?? '';

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        // In setup mode the dialog cannot be dismissed
        if (!isOpen && mode === 'edit') onClose?.();
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        // Prevent closing via Escape/outside click in setup mode
        onEscapeKeyDown={(e) => { if (mode === 'setup') e.preventDefault(); }}
        onInteractOutside={(e) => { if (mode === 'setup') e.preventDefault(); }}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <DialogTitle>
              {mode === 'setup' ? 'Set Your Tax Location' : 'Change Tax Location'}
            </DialogTitle>
          </div>
          <DialogDescription>
            Your country and state help frame the tax summary report with the correct jurisdiction context.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Country */}
          <div className="space-y-1.5">
            <Label htmlFor="tax-country">Country <span className="text-red-500">*</span></Label>
            <select
              id="tax-country"
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setStateVal('');
                setFreeText('');
              }}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            >
              <option value="">Select country…</option>
              {COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* State / Province */}
          {country && (
            <div className="space-y-1.5">
              <Label htmlFor="tax-state">
                {country === 'US'
                  ? 'State'
                  : country === 'CA'
                  ? 'Province'
                  : country === 'AU'
                  ? 'State / Territory'
                  : country === 'IN'
                  ? 'State / UT'
                  : 'State / Province / Region'}
                <span className="text-gray-400 ml-1 font-normal">(optional)</span>
              </Label>
              {subdivisions ? (
                <select
                  id="tax-state"
                  value={stateVal}
                  onChange={(e) => setStateVal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select…</option>
                  {subdivisions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="tax-state"
                  type="text"
                  placeholder="e.g. Bavaria, Ontario…"
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              )}
            </div>
          )}

          {/* Preview */}
          {country && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tax report will show:{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {countryLabel}
                {effectiveState ? ` · ${effectiveState}` : ''}
              </span>
            </p>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-2">
          {mode === 'edit' && (
            <Button variant="outline" onClick={onClose} disabled={localeSaving}>
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!country || localeSaving}
            className="gap-2"
          >
            {localeSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'setup' ? 'Continue' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
