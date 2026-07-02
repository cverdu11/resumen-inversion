import { formatCompactSpanishMonth } from "@/lib/formatters";

export type MonthlyInvestmentItem = {
  month: string;
  date: string;
  initialValue: number;
  finalValue: number;
  gain: number;
  returnPct: number;
  maxDrawdownPct: number;
  contributions: number;
  withdrawals: number;
  netCashFlow: number;
  netCapitalContributed: number;
  lowValue?: number;
};

type MonthlyInvestmentSeed = Omit<
  MonthlyInvestmentItem,
  "contributions" | "withdrawals" | "netCashFlow" | "netCapitalContributed"
>;

export type WeeklyInvestmentItem = {
  id: string;
  monthDate: string;
  week: string;
  startDate: string;
  endDate: string;
  returnPct: number;
};

export type CapitalMovementType = "aportacion" | "retirada";

export type CapitalMovementItem = {
  id: string;
  date: string;
  type: CapitalMovementType;
  amount: number;
  note: string;
};

export type RangeKey = "1M" | "3M" | "6M" | "12M" | "YTD" | "TODO";

export const rangeOptions: RangeKey[] = ["1M", "3M", "6M", "12M", "YTD", "TODO"];

export const dataUpdatedAt = "15/05/2024 09:30";

export const annualizedBasisYears = 0.6719466820798697;

export const initialContribution = 10000;

export const capitalMovements: CapitalMovementItem[] = [
  {
    id: "aportacion-2024-11-08",
    date: "2024-11-08",
    type: "aportacion",
    amount: 1000,
    note: "Aportacion extraordinaria",
  },
  {
    id: "retirada-2025-06-13",
    date: "2025-06-13",
    type: "retirada",
    amount: 400,
    note: "Retirada parcial",
  },
  {
    id: "retirada-2026-02-20",
    date: "2026-02-20",
    type: "retirada",
    amount: 600,
    note: "Retirada parcial",
  },
];

const monthlyInvestmentSeedData: MonthlyInvestmentSeed[] = [
  {
    month: "Mayo 2024",
    date: "2024-05-01",
    initialValue: 10000.0,
    finalValue: 10120.0,
    gain: 120.0,
    returnPct: 1.2,
    maxDrawdownPct: -0.8,
  },
  {
    month: "Junio 2024",
    date: "2024-06-01",
    initialValue: 10120.0,
    finalValue: 10711.01,
    gain: 591.01,
    returnPct: 5.84,
    maxDrawdownPct: -1.1,
  },
  {
    month: "Julio 2024",
    date: "2024-07-01",
    initialValue: 10711.01,
    finalValue: 10496.79,
    gain: -214.22,
    returnPct: -2.0,
    maxDrawdownPct: -1.6,
  },
  {
    month: "Agosto 2024",
    date: "2024-08-01",
    initialValue: 10496.79,
    finalValue: 10297.35,
    gain: -199.44,
    returnPct: -1.9,
    maxDrawdownPct: -2.2,
  },
  {
    month: "Septiembre 2024",
    date: "2024-09-01",
    initialValue: 10297.35,
    finalValue: 10081.1,
    gain: -216.24,
    returnPct: -2.1,
    maxDrawdownPct: -3.8,
    lowValue: 9620.0,
  },
  {
    month: "Octubre 2024",
    date: "2024-10-01",
    initialValue: 10081.1,
    finalValue: 10229.3,
    gain: 148.19,
    returnPct: 1.47,
    maxDrawdownPct: -2.15,
  },
  {
    month: "Noviembre 2024",
    date: "2024-11-01",
    initialValue: 10229.3,
    finalValue: 10045.17,
    gain: -184.13,
    returnPct: -1.8,
    maxDrawdownPct: -4.35,
  },
  {
    month: "Diciembre 2024",
    date: "2024-12-01",
    initialValue: 10045.17,
    finalValue: 9864.56,
    gain: -180.61,
    returnPct: -1.8,
    maxDrawdownPct: -1.25,
  },
  {
    month: "Enero 2025",
    date: "2025-01-01",
    initialValue: 9864.56,
    finalValue: 9879.35,
    gain: 14.8,
    returnPct: 0.15,
    maxDrawdownPct: -0.7,
  },
  {
    month: "Febrero 2025",
    date: "2025-02-01",
    initialValue: 9879.35,
    finalValue: 9904.05,
    gain: 24.7,
    returnPct: 0.25,
    maxDrawdownPct: -0.45,
  },
  {
    month: "Marzo 2025",
    date: "2025-03-01",
    initialValue: 9904.05,
    finalValue: 9918.91,
    gain: 14.86,
    returnPct: 0.15,
    maxDrawdownPct: -0.35,
  },
  {
    month: "Abril 2025",
    date: "2025-04-01",
    initialValue: 9918.91,
    finalValue: 9993.3,
    gain: 74.39,
    returnPct: 0.75,
    maxDrawdownPct: -0.55,
  },
  {
    month: "Mayo 2025",
    date: "2025-05-01",
    initialValue: 9993.3,
    finalValue: 10118.22,
    gain: 124.92,
    returnPct: 1.25,
    maxDrawdownPct: -0.25,
  },
  {
    month: "Junio 2025",
    date: "2025-06-01",
    initialValue: 10118.22,
    finalValue: 10072.68,
    gain: -45.53,
    returnPct: -0.45,
    maxDrawdownPct: -1.35,
  },
  {
    month: "Julio 2025",
    date: "2025-07-01",
    initialValue: 10072.68,
    finalValue: 10228.81,
    gain: 156.13,
    returnPct: 1.55,
    maxDrawdownPct: -0.65,
  },
  {
    month: "Agosto 2025",
    date: "2025-08-01",
    initialValue: 10228.81,
    finalValue: 10366.9,
    gain: 138.09,
    returnPct: 1.35,
    maxDrawdownPct: -0.5,
  },
  {
    month: "Septiembre 2025",
    date: "2025-09-01",
    initialValue: 10366.9,
    finalValue: 10548.32,
    gain: 181.42,
    returnPct: 1.75,
    maxDrawdownPct: -0.4,
  },
  {
    month: "Octubre 2025",
    date: "2025-10-01",
    initialValue: 10548.32,
    finalValue: 10511.4,
    gain: -36.92,
    returnPct: -0.35,
    maxDrawdownPct: -1.2,
  },
  {
    month: "Noviembre 2025",
    date: "2025-11-01",
    initialValue: 10511.4,
    finalValue: 10684.84,
    gain: 173.44,
    returnPct: 1.65,
    maxDrawdownPct: -0.45,
  },
  {
    month: "Diciembre 2025",
    date: "2025-12-01",
    initialValue: 10684.84,
    finalValue: 10829.09,
    gain: 144.25,
    returnPct: 1.35,
    maxDrawdownPct: -0.3,
  },
  {
    month: "Enero 2026",
    date: "2026-01-01",
    initialValue: 10829.09,
    finalValue: 10802.01,
    gain: -27.07,
    returnPct: -0.25,
    maxDrawdownPct: -1.05,
  },
  {
    month: "Febrero 2026",
    date: "2026-02-01",
    initialValue: 10802.01,
    finalValue: 10958.64,
    gain: 156.63,
    returnPct: 1.45,
    maxDrawdownPct: -0.35,
  },
  {
    month: "Marzo 2026",
    date: "2026-03-01",
    initialValue: 10958.64,
    finalValue: 11193.55,
    gain: 234.91,
    returnPct: 2.14,
    maxDrawdownPct: -0.2,
  },
];

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

function getMonthKey(date: string) {
  return date.slice(0, 7);
}

export function getCapitalMovementsForMonth(
  monthDate: string,
  movements = capitalMovements,
) {
  const monthKey = getMonthKey(monthDate);

  return movements.filter((movement) => getMonthKey(movement.date) === monthKey);
}

export function getCapitalMovementTotals(
  movements = capitalMovements,
  openingContribution = initialContribution,
) {
  const additionalContributions = movements
    .filter((movement) => movement.type === "aportacion")
    .reduce((total, movement) => total + movement.amount, 0);
  const withdrawals = movements
    .filter((movement) => movement.type === "retirada")
    .reduce((total, movement) => total + movement.amount, 0);
  const totalContributions = openingContribution + additionalContributions;

  return {
    initialContribution: openingContribution,
    additionalContributions,
    totalContributions,
    withdrawals,
    netCapitalContributed: totalContributions - withdrawals,
  };
}

function buildMonthlyInvestmentData(
  seedData: MonthlyInvestmentSeed[],
  movements = capitalMovements,
  openingContribution = initialContribution,
) {
  let openingValue = openingContribution;
  let netCapitalContributed = openingContribution;

  return seedData.map((item) => {
    const monthMovements = getCapitalMovementsForMonth(item.date, movements);
    const contributions = monthMovements
      .filter((movement) => movement.type === "aportacion")
      .reduce((total, movement) => total + movement.amount, 0);
    const withdrawals = monthMovements
      .filter((movement) => movement.type === "retirada")
      .reduce((total, movement) => total + movement.amount, 0);
    const netCashFlow = contributions - withdrawals;
    const capitalAfterFlows = openingValue + netCashFlow;
    const finalValue = roundCurrency(
      capitalAfterFlows * (1 + item.returnPct / 100),
    );
    const gain = roundCurrency(finalValue - openingValue - netCashFlow);

    netCapitalContributed = roundCurrency(
      netCapitalContributed + netCashFlow,
    );

    const month: MonthlyInvestmentItem = {
      ...item,
      initialValue: roundCurrency(openingValue),
      finalValue,
      gain,
      contributions,
      withdrawals,
      netCashFlow,
      netCapitalContributed,
    };

    openingValue = finalValue;

    return month;
  });
}

export const monthlyInvestmentData = buildMonthlyInvestmentData(
  monthlyInvestmentSeedData,
);

const weeklyVariationPattern = [0.18, -0.14, 0.22, -0.08, 0.12];

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function getWeekMonday(date: Date) {
  const monday = new Date(date);
  const day = monday.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;

  monday.setDate(monday.getDate() - daysFromMonday);

  return monday;
}

function getTradingWeekRanges(monthDate: string) {
  const [year, month] = monthDate.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1, 12);
  const nextMonth = new Date(year, month, 1, 12);
  const monthEnd = addDays(nextMonth, -1);
  const ranges: Array<{ startDate: string; endDate: string }> = [];

  for (
    let monday = getWeekMonday(monthStart);
    monday < nextMonth;
    monday = addDays(monday, 7)
  ) {
    const friday = addDays(monday, 4);

    if (friday < monthStart || friday > monthEnd) {
      continue;
    }

    ranges.push({
      startDate: formatDateKey(monday),
      endDate: formatDateKey(friday),
    });
  }

  return ranges;
}

function buildWeeklyReturnPcts(month: MonthlyInvestmentItem, monthIndex: number) {
  const ranges = getTradingWeekRanges(month.date);
  const weekCount = ranges.length;
  const targetFactor = 1 + month.returnPct / 100;
  const evenReturn = (Math.pow(targetFactor, 1 / weekCount) - 1) * 100;
  const direction = month.returnPct >= 0 ? 1 : -1;
  const firstWeeks = ranges.slice(0, -1).map((_, weekIndex) => {
    const offset =
      weeklyVariationPattern[(monthIndex + weekIndex) % weeklyVariationPattern.length] *
      direction;

    return Number((evenReturn + offset).toFixed(2));
  });
  const firstWeeksFactor = firstWeeks.reduce(
    (factor, returnPct) => factor * (1 + returnPct / 100),
    1,
  );
  const finalWeekReturn = (targetFactor / firstWeeksFactor - 1) * 100;

  return [...firstWeeks, Number(finalWeekReturn.toFixed(2))];
}

export const weeklyInvestmentData: WeeklyInvestmentItem[] =
  monthlyInvestmentData.flatMap((month, monthIndex) => {
    const ranges = getTradingWeekRanges(month.date);
    const weeklyReturns = buildWeeklyReturnPcts(month, monthIndex);

    return ranges.map((range, weekIndex) => ({
      id: `${month.date}-w${weekIndex + 1}`,
      monthDate: month.date,
      week: `Semana ${weekIndex + 1}`,
      startDate: range.startDate,
      endDate: range.endDate,
      returnPct: weeklyReturns[weekIndex] ?? 0,
    }));
  });

export function getWeeklyDataForMonth(
  monthDate: string,
  data = weeklyInvestmentData,
) {
  return data.filter((item) => item.monthDate === monthDate);
}

export function getWeeklyDataForMonths(
  months: MonthlyInvestmentItem[],
  data = weeklyInvestmentData,
) {
  const monthDates = new Set(months.map((item) => item.date));

  return data.filter((item) => monthDates.has(item.monthDate));
}

export function compoundWeeklyReturn(data: WeeklyInvestmentItem[]) {
  return (data.reduce((factor, item) => factor * (1 + item.returnPct / 100), 1) - 1) * 100;
}

export function getInvestedCapital(data = monthlyInvestmentData) {
  return data.at(-1)?.netCapitalContributed ?? initialContribution;
}

export function compoundReturn(data: MonthlyInvestmentItem[]) {
  return data.reduce((factor, item) => factor * (1 + item.returnPct / 100), 1);
}

export function calculateAnnualizedReturn(
  totalReturnPct: number,
  basisYears = annualizedBasisYears,
) {
  if (basisYears <= 0) {
    return 0;
  }

  return (Math.pow(1 + totalReturnPct / 100, 1 / basisYears) - 1) * 100;
}

export function getBestPositiveStreak(data: MonthlyInvestmentItem[]) {
  let bestStart = 0;
  let bestEnd = -1;
  let currentStart = 0;
  let currentLength = 0;

  data.forEach((item, index) => {
    if (item.returnPct > 0) {
      if (currentLength === 0) {
        currentStart = index;
      }

      currentLength += 1;

      if (currentLength > bestEnd - bestStart + 1) {
        bestStart = currentStart;
        bestEnd = index;
      }

      return;
    }

    currentLength = 0;
  });

  const start = data[bestStart];
  const end = data[bestEnd];

  return {
    months: Math.max(0, bestEnd - bestStart + 1),
    start,
    end,
    label:
      start && end
        ? `${formatCompactSpanishMonth(start.date)} - ${formatCompactSpanishMonth(end.date)}`
        : "",
  };
}

export function getPreviousMonthLabel(
  data: MonthlyInvestmentItem[],
  item: MonthlyInvestmentItem,
) {
  const index = data.findIndex((candidate) => candidate.date === item.date);
  const previous = data[index - 1];

  if (!previous) {
    return formatCompactSpanishMonth(item.date);
  }

  return `${formatCompactSpanishMonth(previous.date)} - ${formatCompactSpanishMonth(item.date)}`;
}

export function deriveInvestmentSummary(
  data = monthlyInvestmentData,
  movements = capitalMovements,
  openingContribution = initialContribution,
) {
  const movementTotals = getCapitalMovementTotals(
    movements,
    openingContribution,
  );
  const investedCapital = movementTotals.netCapitalContributed;
  const currentValue = data.at(-1)?.finalValue ?? 0;
  const totalProfit =
    currentValue + movementTotals.withdrawals - movementTotals.totalContributions;
  const totalReturnPct = (compoundReturn(data) - 1) * 100;
  const fallbackMonth = data[0] ?? {
    contributions: 0,
    date: "",
    finalValue: 0,
    gain: 0,
    initialValue: 0,
    maxDrawdownPct: 0,
    month: "Sin datos",
    netCapitalContributed: 0,
    netCashFlow: 0,
    returnPct: 0,
    withdrawals: 0,
  };
  const maxDrawdown = data.reduce(
    (lowest, item) =>
      item.maxDrawdownPct < lowest.maxDrawdownPct ? item : lowest,
    fallbackMonth,
  );
  const bestMonth = data.reduce(
    (best, item) => (item.returnPct > best.returnPct ? item : best),
    fallbackMonth,
  );
  const worstMonth = data.reduce(
    (worst, item) => (item.returnPct < worst.returnPct ? item : worst),
    fallbackMonth,
  );
  const trailingTwelve = data.slice(-12);
  const lastTwelveMonthsReturnPct = (compoundReturn(trailingTwelve) - 1) * 100;
  const currentMonth = data.at(-1) ?? fallbackMonth;

  return {
    initialContribution: movementTotals.initialContribution,
    additionalContributions: movementTotals.additionalContributions,
    totalContributions: movementTotals.totalContributions,
    totalWithdrawals: movementTotals.withdrawals,
    netCapitalContributed: movementTotals.netCapitalContributed,
    investedCapital,
    currentValue,
    totalProfit,
    totalReturnPct,
    annualizedReturnPct: calculateAnnualizedReturn(totalReturnPct),
    maxDrawdownPct: maxDrawdown.maxDrawdownPct,
    maxDrawdown,
    bestMonth,
    worstMonth,
    bestPositiveStreak: getBestPositiveStreak(data),
    currentMonth,
    lastTwelveMonthsReturnPct,
  };
}

export function filterDataByRange(
  data: MonthlyInvestmentItem[],
  range: RangeKey,
) {
  if (range === "TODO") {
    return data;
  }

  const latest = data.at(-1);

  if (!latest) {
    return data;
  }

  if (range === "YTD") {
    const year = latest.date.slice(0, 4);
    return data.filter((item) => item.date.startsWith(year));
  }

  const months = Number.parseInt(range.replace("M", ""), 10);
  return data.slice(-months);
}

export function deriveVisibleChartInsights(data: MonthlyInvestmentItem[]) {
  const first = data[0];
  const latest = data.at(-1);
  const lowestByValue = data.reduce((lowest, item) => {
    const itemValue = item.lowValue ?? item.finalValue;
    const lowestValue = lowest.lowValue ?? lowest.finalValue;
    return itemValue < lowestValue ? item : lowest;
  }, data[0]);

  return {
    first,
    latest,
    lowest: lowestByValue,
  };
}

export const investmentSummary = deriveInvestmentSummary(monthlyInvestmentData);
export type InvestmentSummary = ReturnType<typeof deriveInvestmentSummary>;
