const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: "always",
});

const signedCurrencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "always",
  useGrouping: "always",
});

const compactCurrencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
  useGrouping: "always",
});

const signedCompactCurrencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
  signDisplay: "always",
  useGrouping: "always",
});

const numberFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: "always",
});

const signedNumberFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "always",
  useGrouping: "always",
});

const wholeNumberFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
  useGrouping: "always",
});

const signedWholeNumberFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
  signDisplay: "always",
  useGrouping: "always",
});

const monthFormatter = new Intl.DateTimeFormat("es-ES", {
  month: "long",
  year: "numeric",
});

const axisMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "2-digit",
});

const compactSpanishMonthFormatter = new Intl.DateTimeFormat("es-ES", {
  month: "short",
  year: "2-digit",
});

const fullDateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
});

export function parseDate(date: string) {
  return new Date(`${date}T12:00:00`);
}

export function formatCurrency(value: number, options?: { sign?: boolean }) {
  return options?.sign
    ? signedCurrencyFormatter.format(value)
    : currencyFormatter.format(value);
}

export function formatCompactCurrency(value: number) {
  return compactCurrencyFormatter.format(value);
}

export function formatWholeCurrency(value: number, options?: { sign?: boolean }) {
  return options?.sign
    ? signedCompactCurrencyFormatter.format(value)
    : compactCurrencyFormatter.format(value);
}

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatPercent(value: number, options?: { sign?: boolean }) {
  const formatter = options?.sign ? signedNumberFormatter : numberFormatter;
  return `${formatter.format(value)} %`;
}

export function formatWholePercent(value: number, options?: { sign?: boolean }) {
  const formatter = options?.sign
    ? signedWholeNumberFormatter
    : wholeNumberFormatter;

  return `${formatter.format(value)} %`;
}

export function formatMonthName(date: string) {
  const formatted = monthFormatter.format(parseDate(date));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatAxisMonth(date: string) {
  return axisMonthFormatter.format(parseDate(date));
}

export function formatCompactSpanishMonth(date: string) {
  const formatted = compactSpanishMonthFormatter
    .format(parseDate(date))
    .replace(".", "");

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatFullDate(date: string) {
  return fullDateFormatter.format(parseDate(date));
}

export function formatShortDate(date: string) {
  const formatted = shortDateFormatter.format(parseDate(date)).replace(".", "");

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function valueTone(value: number) {
  if (value > 0) {
    return "text-positive";
  }

  if (value < 0) {
    return "text-danger";
  }

  return "text-muted-foreground";
}
