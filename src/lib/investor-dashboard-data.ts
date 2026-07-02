import { formatMonthName } from "@/lib/formatters";
import {
  deriveInvestmentSummary,
  type CapitalMovementItem,
  type MonthlyInvestmentItem,
  type WeeklyInvestmentItem,
} from "@/lib/investment-data";

export type InvestorDashboardInvestorRow = {
  id: number;
  start_date: string;
};

export type InvestorDashboardMovementRow = {
  id: number;
  amount: string | number;
  movement_date: string;
  movement_type: "initial_contribution" | "contribution" | "withdrawal";
  note: string | null;
};

export type InvestorDashboardWeeklyRow = {
  id: number;
  return_pct: string | number;
  status: string;
  week_end: string;
  week_start: string;
};

const dashboardDateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundPercent(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getMonthKey(date: string) {
  return date.slice(0, 7);
}

function getNextMonthStart(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const nextMonth = new Date(year, month, 1, 12);

  return nextMonth.toISOString().slice(0, 10);
}

function getMovementEffect(movement: InvestorDashboardMovementRow) {
  const amount = Number(movement.amount);

  return movement.movement_type === "withdrawal" ? -amount : amount;
}

function getWeekLabel(weekEnd: string) {
  const start = new Date(`${weekEnd.slice(0, 4)}-01-01T12:00:00`);
  const end = new Date(`${weekEnd}T12:00:00`);
  const diffDays = Math.floor(
    (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
  );

  return `Semana ${Math.floor(diffDays / 7) + 1}`;
}

function mapCapitalMovements(
  movements: InvestorDashboardMovementRow[],
): CapitalMovementItem[] {
  return movements.map((movement) => ({
    amount: Number(movement.amount),
    date: movement.movement_date,
    id: `movement-${movement.id}`,
    note:
      movement.note ??
      (movement.movement_type === "withdrawal"
        ? "Retirada"
        : "Aportacion"),
    type:
      movement.movement_type === "withdrawal"
        ? ("retirada" as const)
        : ("aportacion" as const),
  }));
}

function mapWeeklyData(
  weeks: InvestorDashboardWeeklyRow[],
): WeeklyInvestmentItem[] {
  return weeks.map((week) => ({
    endDate: week.week_end,
    id: `week-${week.id}`,
    monthDate: `${getMonthKey(week.week_end)}-01`,
    returnPct: Number(week.return_pct),
    startDate: week.week_start,
    week: getWeekLabel(week.week_end),
  }));
}

function getDashboardUpdatedAt(
  movements: InvestorDashboardMovementRow[],
  weeks: InvestorDashboardWeeklyRow[],
) {
  const latestWeek = weeks.at(-1)?.week_end;
  const latestMovement = movements.at(-1)?.movement_date;
  const latestDate = [latestWeek, latestMovement]
    .filter(Boolean)
    .sort()
    .at(-1);

  if (!latestDate) {
    return dashboardDateFormatter.format(new Date());
  }

  return dashboardDateFormatter.format(new Date(`${latestDate}T12:00:00`));
}

function buildMonthlyData(
  investor: InvestorDashboardInvestorRow,
  movements: InvestorDashboardMovementRow[],
  weeks: InvestorDashboardWeeklyRow[],
) {
  const orderedMovements = [...movements].sort((left, right) => {
    const dateComparison = left.movement_date.localeCompare(
      right.movement_date,
    );

    return dateComparison === 0 ? left.id - right.id : dateComparison;
  });
  const orderedWeeks = [...weeks]
    .filter(
      (week) => week.status === "closed" && week.week_end >= investor.start_date,
    )
    .sort((left, right) => left.week_start.localeCompare(right.week_start));
  const monthIds = new Set<string>();

  for (const movement of orderedMovements) {
    monthIds.add(getMonthKey(movement.movement_date));
  }

  for (const week of orderedWeeks) {
    monthIds.add(getMonthKey(week.week_end));
  }

  const monthKeys = [...monthIds].sort();
  let balance = 0;
  let netCapital = 0;
  let movementIndex = 0;

  return monthKeys.map((monthKey): MonthlyInvestmentItem => {
    const monthStart = `${monthKey}-01`;
    const nextMonthStart = getNextMonthStart(monthKey);
    const monthWeeks = orderedWeeks.filter(
      (week) => getMonthKey(week.week_end) === monthKey,
    );

    while (
      movementIndex < orderedMovements.length &&
      orderedMovements[movementIndex].movement_date < monthStart
    ) {
      const effect = getMovementEffect(orderedMovements[movementIndex]);
      balance += effect;
      netCapital += effect;
      movementIndex += 1;
    }

    const initialValue = balance;
    const monthMovements: InvestorDashboardMovementRow[] = [];
    let contributions = 0;
    let withdrawals = 0;

    while (
      movementIndex < orderedMovements.length &&
      orderedMovements[movementIndex].movement_date < nextMonthStart
    ) {
      const movement = orderedMovements[movementIndex];
      const effect = getMovementEffect(movement);
      monthMovements.push(movement);

      if (effect >= 0) {
        contributions += effect;
      } else {
        withdrawals += Math.abs(effect);
      }

      movementIndex += 1;
    }

    const monthMovementTotal = monthMovements.reduce(
      (total, movement) => total + getMovementEffect(movement),
      0,
    );
    const weeklyBases = monthWeeks.map((week) => {
      const weeklyMovementEffect = monthMovements
        .filter((movement) => movement.movement_date <= week.week_end)
        .reduce((total, movement) => total + getMovementEffect(movement), 0);

      return initialValue + weeklyMovementEffect;
    });
    const gain = monthWeeks.reduce((total, week, index) => {
      const weeklyBase = weeklyBases[index] ?? initialValue;

      return weeklyBase > 0
        ? total + (weeklyBase * Number(week.return_pct)) / 100
        : total;
    }, 0);
    const returnPct = roundPercent(
      monthWeeks.reduce((total, week) => total + Number(week.return_pct), 0),
    );
    balance = initialValue + monthMovementTotal + gain;
    netCapital += monthMovementTotal;
    const finalValue = roundCurrency(balance);

    return {
      contributions: roundCurrency(contributions),
      date: monthStart,
      finalValue,
      gain: roundCurrency(gain),
      initialValue: roundCurrency(initialValue),
      maxDrawdownPct: Math.min(0, returnPct),
      month: formatMonthName(monthStart),
      netCapitalContributed: roundCurrency(netCapital),
      netCashFlow: roundCurrency(contributions - withdrawals),
      returnPct,
      withdrawals: roundCurrency(withdrawals),
    };
  });
}

export function buildInvestorDashboardData({
  investor,
  movements,
  weeklyRows,
}: {
  investor: InvestorDashboardInvestorRow;
  movements: InvestorDashboardMovementRow[];
  weeklyRows: InvestorDashboardWeeklyRow[];
}) {
  const capitalMovements = mapCapitalMovements(movements);
  const monthlyData = buildMonthlyData(investor, movements, weeklyRows);
  const weeklyData = mapWeeklyData(
    weeklyRows.filter(
      (week) => week.status === "closed" && week.week_end >= investor.start_date,
    ),
  );

  return {
    capitalMovements,
    dataUpdatedAt: getDashboardUpdatedAt(movements, weeklyRows),
    monthlyData,
    summary: deriveInvestmentSummary(monthlyData, capitalMovements, 0),
    weeklyData,
  };
}
