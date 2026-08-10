import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format as dateFnsFormat } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/** Strips every non-digit character and parses what remains as an integer. Empty/no digits → 0. */
export function parseThousands(value: string | number | null | undefined): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const digits = value.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

/** Formats a number with Indonesian-locale thousand separators ("."). 0/empty → "" so placeholders show through. */
export function formatThousands(value: number | string | null | undefined): string {
  const numeric = typeof value === 'number' ? value : parseThousands(value);
  if (!numeric) return '';
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(numeric);
}

/** Robust date formatter that handles invalid dates and nulls gracefully */
export function formatDate(date: string | Date | null | undefined, fmt: string = "dd MMM yyyy"): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return dateFnsFormat(d, fmt, { locale: localeId });
}
