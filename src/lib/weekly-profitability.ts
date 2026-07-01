export type WeeklyProfitabilityStatus = "closed" | "draft" | "pending";

export type DatabaseWeeklyProfitabilityRow = {
  id: number;
  week_start: string;
  week_end: string;
  return_pct: string | number;
  status: WeeklyProfitabilityStatus;
  note: string | null;
};

export type WeeklyProfitabilityItem = {
  id: string;
  sourceId?: number;
  weekLabel: string;
  monthLabel: string;
  startDate: string;
  endDate: string;
  returnPct: number;
  status: WeeklyProfitabilityStatus;
  isCurrent: boolean;
  isSaved: boolean;
};

const weekRangeBeforeCurrent = 5;
const weekRangeAfterCurrent = 1;

const monthFormatter = new Intl.DateTimeFormat("es-ES", {
  month: "long",
  year: "numeric",
});

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseLocalDate(date: string) {
  return new Date(`${date}T12:00:00`);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function getIsoWeekStart(date: Date) {
  const nextDate = new Date(date);
  const day = nextDate.getDay() || 7;
  nextDate.setDate(nextDate.getDate() - day + 1);

  return nextDate;
}

function getIsoWeekNumber(date: Date) {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));

  const firstThursday = new Date(target.getFullYear(), 0, 4);
  firstThursday.setDate(
    firstThursday.getDate() + 3 - ((firstThursday.getDay() + 6) % 7),
  );

  return (
    1 +
    Math.round(
      (target.getTime() - firstThursday.getTime()) /
        (7 * 24 * 60 * 60 * 1000),
    )
  );
}

function formatMonthLabel(startDate: string, endDate: string) {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  const startLabel = monthFormatter.format(start);
  const endLabel = monthFormatter.format(end);
  const label =
    startLabel === endLabel
      ? startLabel
      : `${startLabel.split(" ")[0]} / ${endLabel}`;

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getGeneratedStatus(
  weekStart: string,
  currentWeekStart: string,
  isSaved: boolean,
): WeeklyProfitabilityStatus {
  if (weekStart === currentWeekStart) {
    return "draft";
  }

  if (weekStart < currentWeekStart && isSaved) {
    return "closed";
  }

  return "pending";
}

function buildWeekItem(
  weekStart: string,
  savedRow: DatabaseWeeklyProfitabilityRow | undefined,
  currentWeekStart: string,
): WeeklyProfitabilityItem {
  const start = parseLocalDate(weekStart);
  const endDate = savedRow?.week_end ?? toDateInputValue(addDays(start, 4));
  const isSaved = Boolean(savedRow);
  const status = getGeneratedStatus(weekStart, currentWeekStart, isSaved);

  return {
    id: savedRow ? `weekly-db-${savedRow.id}` : `weekly-${weekStart}`,
    sourceId: savedRow?.id,
    weekLabel: `Semana ${getIsoWeekNumber(start)}`,
    monthLabel: formatMonthLabel(weekStart, endDate),
    startDate: weekStart,
    endDate,
    returnPct: savedRow ? Number(savedRow.return_pct) : 0,
    status,
    isCurrent: weekStart === currentWeekStart,
    isSaved,
  };
}

export function getWeekStatusForDate(
  weekStart: string,
  referenceDate = new Date(),
): WeeklyProfitabilityStatus {
  const currentWeekStart = toDateInputValue(getIsoWeekStart(referenceDate));

  if (weekStart === currentWeekStart) {
    return "draft";
  }

  return weekStart < currentWeekStart ? "closed" : "pending";
}

export function buildWeeklyProfitabilityItems(
  savedRows: DatabaseWeeklyProfitabilityRow[],
  referenceDate = new Date(),
) {
  const currentWeekStartDate = getIsoWeekStart(referenceDate);
  const currentWeekStart = toDateInputValue(currentWeekStartDate);
  const rowsByWeekStart = new Map(
    savedRows.map((row) => [row.week_start, row] as const),
  );
  const weekStarts = new Set<string>();

  for (
    let offset = -weekRangeBeforeCurrent;
    offset <= weekRangeAfterCurrent;
    offset += 1
  ) {
    weekStarts.add(toDateInputValue(addDays(currentWeekStartDate, offset * 7)));
  }

  for (const row of savedRows) {
    weekStarts.add(row.week_start);
  }

  return [...weekStarts]
    .map((weekStart) =>
      buildWeekItem(weekStart, rowsByWeekStart.get(weekStart), currentWeekStart),
    )
    .sort((left, right) => {
      const groupOrder: Record<WeeklyProfitabilityStatus, number> = {
        draft: 0,
        closed: 1,
        pending: 2,
      };
      const groupDifference = groupOrder[left.status] - groupOrder[right.status];

      if (groupDifference !== 0) {
        return groupDifference;
      }

      if (left.status === "pending") {
        return left.startDate.localeCompare(right.startDate);
      }

      return right.startDate.localeCompare(left.startDate);
    });
}
