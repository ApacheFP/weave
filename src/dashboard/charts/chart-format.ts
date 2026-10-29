export function formatCurrency(value: number, { locale = 'it-IT', currency = 'EUR', minimumFractionDigits, maximumFractionDigits }: { locale?: string; currency?: string; minimumFractionDigits?: number; maximumFractionDigits?: number } = {}) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, ...(minimumFractionDigits === undefined ? {} : { minimumFractionDigits }), ...(maximumFractionDigits === undefined ? {} : { maximumFractionDigits }) }).format(value);
}

export function formatCompactCurrency(value: number, { locale = 'it-IT', currency = 'EUR' }: { locale?: string; currency?: string } = {}) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function formatPercent(value: number, { locale = 'it-IT', maximumFractionDigits = 0 }: { locale?: string; maximumFractionDigits?: number } = {}) {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits }).format(value);
}

export function formatDay(value: string, options: Intl.DateTimeFormatOptions = {}, locale = 'it-IT') {
  return new Intl.DateTimeFormat(locale, options).format(new Date(`${value}T12:00:00`));
}

/** Rounded shares that still add up to exactly 100%. */
export function wholePercents(values: number[]) {
  const total = values.reduce((sum, value) => sum + Math.max(0, value), 0);
  if (!total) return values.map(() => 0);
  const exact = values.map(value => Math.max(0, value) / total * 100);
  const result = exact.map(Math.floor);
  let remaining = 100 - result.reduce((sum, value) => sum + value, 0);
  exact.map((value, index) => ({ index, rest: value - result[index] })).sort((a, b) => b.rest - a.rest).forEach(({ index }) => {
    if (remaining-- > 0) result[index]++;
  });
  return result.map(value => value / 100);
}
