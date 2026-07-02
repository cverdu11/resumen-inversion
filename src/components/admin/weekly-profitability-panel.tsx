"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock3,
  Percent,
  Save,
} from "lucide-react";

import { saveWeeklyProfitability } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MockInvestor } from "@/lib/admin-mock-data";
import {
  formatCurrency,
  formatPercent,
  valueTone,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { WeeklyProfitabilityItem } from "@/lib/weekly-profitability";

const periodDateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const monthTitleFormatter = new Intl.DateTimeFormat("es-ES", {
  month: "long",
  year: "numeric",
});

const percentInputFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
  useGrouping: false,
});

const weeklyErrorCopy: Record<string, string> = {
  invalid:
    "Revisa la semana y el porcentaje. El valor debe estar entre -100 % y 100 %.",
  save: "No se pudo guardar la rentabilidad semanal. Pruebalo de nuevo.",
};

const weeklyStatusOptions: {
  value: WeeklyProfitabilityItem["status"];
  label: string;
}[] = [
  { value: "draft", label: "Borrador" },
  { value: "closed", label: "Cerrada" },
  { value: "pending", label: "Pendiente" },
];

const weeklyStatusClassName: Record<WeeklyProfitabilityItem["status"], string> =
  {
    draft: "border-danger/35 bg-danger-soft text-danger",
    closed: "border-positive/35 bg-positive-soft text-positive",
    pending: "border-warning/35 bg-warning-soft text-warning",
  };

const weeklyStatusOptionStyle: Record<
  WeeklyProfitabilityItem["status"],
  { backgroundColor: string; color: string }
> = {
  draft: {
    backgroundColor: "var(--danger-soft)",
    color: "var(--danger)",
  },
  closed: {
    backgroundColor: "var(--positive-soft)",
    color: "var(--positive)",
  },
  pending: {
    backgroundColor: "var(--warning-soft)",
    color: "var(--warning)",
  },
};

const fieldClassName =
  "h-8 w-full rounded-md border bg-background/45 px-2.5 text-sm text-card-foreground outline-none transition-colors focus:border-primary/70 focus:ring-2 focus:ring-primary/20";
const openMonthsStorageKey = "resumen-inversion:weekly-profitability:open-months";

type PeriodSort = "desc" | "asc";
type MonthlyOverviewSortKey =
  | "finalValue"
  | "initialValue"
  | "month"
  | "movementTotal"
  | "result"
  | "returnPct"
  | "weeks";
type SortDirection = "asc" | "desc";

type MonthlyOverviewSortConfig = {
  direction: SortDirection;
  key: MonthlyOverviewSortKey;
};

type MonthlyProfitabilitySummary = {
  averageBase: number;
  id: string;
  finalValue: number;
  initialValue: number;
  monthLabel: string;
  movementTotal: number;
  result: number;
  returnPct: number;
  savedWeeksCount: number;
  totalWeeksCount: number;
  weeks: WeeklyProfitabilityItem[];
};

type PortfolioMovement = {
  amount: number;
  date: string;
};

const firstMonthlyOverviewSortDirection: Record<
  MonthlyOverviewSortKey,
  SortDirection
> = {
  finalValue: "desc",
  initialValue: "desc",
  month: "desc",
  movementTotal: "desc",
  result: "desc",
  returnPct: "desc",
  weeks: "desc",
};

function formatPeriodDate(date: string) {
  const formatted = periodDateFormatter
    .format(new Date(`${date}T12:00:00`))
    .replace(".", "");

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatPeriod(startDate: string, endDate: string) {
  return `${formatPeriodDate(startDate)} - ${formatPeriodDate(endDate)}`;
}

function formatReturnInput(value: number) {
  return percentInputFormatter.format(value);
}

function formatMonthTitle(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const formatted = monthTitleFormatter.format(
    new Date(year, month - 1, 1, 12),
  );

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatSignedCurrency(value: number) {
  return formatCurrency(value, { sign: true });
}

function roundMonthlyValue(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getNextMonthStart(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const nextMonth = new Date(year, month, 1, 12);

  return nextMonth.toISOString().slice(0, 10);
}

function getDateTime(date: string) {
  return new Date(`${date}T12:00:00`).getTime();
}

function getMovementWeekWeight(
  movementDate: string,
  weekStart: string,
  weekEnd: string,
) {
  const dayMs = 24 * 60 * 60 * 1000;
  const startTime = getDateTime(weekStart);
  const endTime = getDateTime(weekEnd);
  const movementTime = Math.max(getDateTime(movementDate), startTime);
  const totalDays = Math.max(1, Math.round((endTime - startTime) / dayMs) + 1);
  const activeDays = Math.max(
    0,
    Math.round((endTime - movementTime) / dayMs) + 1,
  );

  return Math.min(1, activeDays / totalDays);
}

function getPortfolioMovements(investors: MockInvestor[]): PortfolioMovement[] {
  return investors
    .flatMap((investor) =>
      investor.movements.map((movement) => ({
        amount:
          movement.type === "withdrawal" ? -movement.amount : movement.amount,
        date: movement.date,
      })),
    )
    .sort((left, right) => left.date.localeCompare(right.date));
}

function sortWeeksByPeriod(
  weeks: WeeklyProfitabilityItem[],
  periodSort: PeriodSort,
) {
  return [...weeks].sort((left, right) =>
    periodSort === "desc"
      ? right.startDate.localeCompare(left.startDate)
      : left.startDate.localeCompare(right.startDate),
  );
}

function compareMonthlySummariesByKey(
  left: MonthlyProfitabilitySummary,
  right: MonthlyProfitabilitySummary,
  sortKey: MonthlyOverviewSortKey,
) {
  switch (sortKey) {
    case "finalValue":
      return left.finalValue - right.finalValue;
    case "initialValue":
      return left.initialValue - right.initialValue;
    case "month":
      return left.id.localeCompare(right.id);
    case "movementTotal":
      return left.movementTotal - right.movementTotal;
    case "result":
      return left.result - right.result;
    case "returnPct":
      return left.returnPct - right.returnPct;
    case "weeks":
      return left.savedWeeksCount - right.savedWeeksCount;
  }
}

function sortMonthlySummaries(
  summaries: MonthlyProfitabilitySummary[],
  sortConfig: MonthlyOverviewSortConfig,
) {
  return [...summaries].sort((left, right) => {
    const directionMultiplier = sortConfig.direction === "asc" ? 1 : -1;
    const primaryComparison =
      compareMonthlySummariesByKey(left, right, sortConfig.key) *
      directionMultiplier;

    return primaryComparison !== 0
      ? primaryComparison
      : right.id.localeCompare(left.id);
  });
}

function SortableMonthlyHead({
  align = "left",
  children,
  className,
  onSort,
  sortConfig,
  sortKey,
}: {
  align?: "left" | "right";
  children: ReactNode;
  className?: string;
  onSort: (sortKey: MonthlyOverviewSortKey) => void;
  sortConfig: MonthlyOverviewSortConfig;
  sortKey: MonthlyOverviewSortKey;
}) {
  const isActive = sortConfig.key === sortKey;
  const ariaSort = isActive
    ? sortConfig.direction === "asc"
      ? "ascending"
      : "descending"
    : "none";
  const SortIcon = !isActive
    ? ArrowUpDown
    : sortConfig.direction === "asc"
      ? ArrowUp
      : ArrowDown;

  return (
    <TableHead aria-sort={ariaSort} className={className}>
      <button
        className={cn(
          "inline-flex w-full items-center gap-1.5 rounded-md py-1 text-xs font-medium uppercase text-muted-foreground transition-colors hover:text-card-foreground",
          align === "right" ? "justify-end" : "justify-start",
          isActive && "text-card-foreground",
        )}
        onClick={() => onSort(sortKey)}
        title="Ordenar"
        type="button"
      >
        <span>{children}</span>
        <SortIcon
          className={cn(
            "size-3.5 shrink-0",
            isActive ? "text-primary" : "text-muted-foreground/70",
          )}
        />
      </button>
    </TableHead>
  );
}

function parseOpenMonthIds(openMonths?: string) {
  const monthIds = (openMonths ?? "")
    .split(",")
    .map((monthId) => monthId.trim())
    .filter((monthId) => /^\d{4}-\d{2}$/.test(monthId));

  return monthIds.length > 0 ? monthIds : null;
}

function saveOpenMonthIds(monthIds: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(openMonthsStorageKey, monthIds.join(","));
  } catch {
    // Local storage is optional; the current UI state still works without it.
  }
}

function readSavedOpenMonthIds() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return parseOpenMonthIds(
      window.localStorage.getItem(openMonthsStorageKey) ?? "",
    );
  } catch {
    return null;
  }
}

function buildMonthlyProfitabilityOverview(
  investors: MockInvestor[],
  weeks: WeeklyProfitabilityItem[],
  periodSort: PeriodSort,
): MonthlyProfitabilitySummary[] {
  const weeksByMonth = new Map<string, WeeklyProfitabilityItem[]>();
  const portfolioMovements = getPortfolioMovements(investors);
  let movementIndex = 0;
  let portfolioValue = 0;

  for (const week of weeks) {
    const monthKey = week.endDate.slice(0, 7);
    const existingWeeks = weeksByMonth.get(monthKey) ?? [];
    existingWeeks.push(week);
    weeksByMonth.set(monthKey, existingWeeks);
  }

  const monthlySummaries = [...weeksByMonth.entries()]
    .sort(([leftMonth], [rightMonth]) => leftMonth.localeCompare(rightMonth))
    .map(([monthKey, monthWeeks]) => {
      const monthStart = `${monthKey}-01`;
      const nextMonthStart = getNextMonthStart(monthKey);
      const chronologicalWeeks = [...monthWeeks].sort((left, right) =>
        left.startDate.localeCompare(right.startDate),
      );
      const savedMonthWeeks = chronologicalWeeks.filter((week) => week.isSaved);

      while (
        movementIndex < portfolioMovements.length &&
        portfolioMovements[movementIndex].date < monthStart
      ) {
        portfolioValue += portfolioMovements[movementIndex].amount;
        movementIndex += 1;
      }

      const initialValue = portfolioValue;
      let averageBaseTotal = 0;
      let movementTotal = 0;
      let result = 0;
      let savedWeeksCount = 0;

      for (const week of chronologicalWeeks) {
        while (
          movementIndex < portfolioMovements.length &&
          portfolioMovements[movementIndex].date < week.startDate
        ) {
          const movement = portfolioMovements[movementIndex];
          portfolioValue += movement.amount;

          if (movement.date >= monthStart && movement.date < nextMonthStart) {
            movementTotal += movement.amount;
          }

          movementIndex += 1;
        }

        if (week.isSaved) {
          let weeklyBase = portfolioValue;

          while (
            movementIndex < portfolioMovements.length &&
            portfolioMovements[movementIndex].date <= week.endDate
          ) {
            const movement = portfolioMovements[movementIndex];
            const movementWeight = getMovementWeekWeight(
              movement.date,
              week.startDate,
              week.endDate,
            );

            weeklyBase += movement.amount * movementWeight;
            portfolioValue += movement.amount;

            if (movement.date >= monthStart && movement.date < nextMonthStart) {
              movementTotal += movement.amount;
            }

            movementIndex += 1;
          }

          const weeklyResult = (weeklyBase * week.returnPct) / 100;

          averageBaseTotal += weeklyBase;
          portfolioValue += weeklyResult;
          result += weeklyResult;
          savedWeeksCount += 1;
        } else {
          while (
            movementIndex < portfolioMovements.length &&
            portfolioMovements[movementIndex].date <= week.endDate
          ) {
            const movement = portfolioMovements[movementIndex];
            portfolioValue += movement.amount;

            if (movement.date >= monthStart && movement.date < nextMonthStart) {
              movementTotal += movement.amount;
            }

            movementIndex += 1;
          }
        }
      }

      while (
        movementIndex < portfolioMovements.length &&
        portfolioMovements[movementIndex].date < nextMonthStart
      ) {
        const movement = portfolioMovements[movementIndex];
        portfolioValue += movement.amount;
        movementTotal += movement.amount;
        movementIndex += 1;
      }

      const averageBase =
        savedWeeksCount > 0 ? averageBaseTotal / savedWeeksCount : initialValue;
      const returnPct = roundMonthlyValue(
        savedMonthWeeks.reduce((total, week) => total + week.returnPct, 0),
      );

      return {
        averageBase: roundMonthlyValue(averageBase),
        id: monthKey,
        finalValue: roundMonthlyValue(portfolioValue),
        initialValue: roundMonthlyValue(initialValue),
        monthLabel: formatMonthTitle(monthKey),
        movementTotal: roundMonthlyValue(movementTotal),
        result: roundMonthlyValue(result),
        returnPct,
        savedWeeksCount,
        totalWeeksCount: monthWeeks.length,
        weeks: sortWeeksByPeriod(monthWeeks, periodSort),
      };
    });

  return monthlySummaries.sort((left, right) =>
    periodSort === "desc"
      ? right.id.localeCompare(left.id)
      : left.id.localeCompare(right.id),
  );
}

function SaveWeeklyButton({ compact = false }: { compact?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      className={cn("h-8 px-3 text-xs", compact && "px-2.5")}
      disabled={pending}
      size="sm"
      type="submit"
    >
      <Save className="size-3.5" data-icon="inline-start" />
      {pending ? "Guardando" : "Guardar"}
    </Button>
  );
}

function WeeklyStatusSelect({
  className,
  status,
}: {
  className?: string;
  status: WeeklyProfitabilityItem["status"];
}) {
  const [selectedStatus, setSelectedStatus] =
    useState<WeeklyProfitabilityItem["status"]>(status);

  return (
    <select
      className={cn(
        fieldClassName,
        "font-semibold uppercase",
        weeklyStatusClassName[selectedStatus],
        className ?? "w-32 text-xs",
      )}
      name="status"
      onChange={(event) =>
        setSelectedStatus(
          event.target.value as WeeklyProfitabilityItem["status"],
        )
      }
      value={selectedStatus}
    >
      {weeklyStatusOptions.map((option) => (
        <option
          className={weeklyStatusClassName[option.value]}
          key={option.value}
          style={weeklyStatusOptionStyle[option.value]}
          value={option.value}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
}

function WeeklyFormHiddenFields({
  next,
  openMonthsValue,
  week,
}: {
  next: string;
  openMonthsValue: string;
  week: WeeklyProfitabilityItem;
}) {
  return (
    <>
      <input name="next" type="hidden" value={next} />
      <input name="open_months" type="hidden" value={openMonthsValue} />
      <input name="week_start" type="hidden" value={week.startDate} />
      <input name="week_end" type="hidden" value={week.endDate} />
    </>
  );
}

function WeeklyReturnInput({
  inputId,
  week,
}: {
  inputId: string;
  week: WeeklyProfitabilityItem;
}) {
  return (
    <>
      <label className="sr-only" htmlFor={inputId}>
        Rentabilidad de {week.weekLabel}
      </label>
      <div className="relative min-w-0">
        <input
          className={cn(
            fieldClassName,
            "py-1.5 pl-2.5 pr-7 text-right tabular-nums placeholder:text-muted-foreground/70",
          )}
          defaultValue={week.isSaved ? formatReturnInput(week.returnPct) : ""}
          id={inputId}
          inputMode="decimal"
          name="return_pct"
          placeholder="0,00"
          type="text"
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
          %
        </span>
      </div>
    </>
  );
}

function WeeklyReturnForm({
  compact = false,
  formId,
  includeHiddenStatus = true,
  next,
  openMonthsValue,
  showStatus = false,
  scope = "inline",
  week,
}: {
  compact?: boolean;
  formId?: string;
  includeHiddenStatus?: boolean;
  next: string;
  openMonthsValue: string;
  showStatus?: boolean;
  scope?: "desktop" | "mobile" | "inline";
  week: WeeklyProfitabilityItem;
}) {
  const inputId = `return-pct-${scope}-${week.id}`;

  return (
    <form
      action={saveWeeklyProfitability}
      className={cn(
        compact
          ? "grid grid-cols-[minmax(0,7rem)_auto] items-center justify-end gap-2"
          : "mt-3 grid gap-3",
      )}
      id={formId}
    >
      <WeeklyFormHiddenFields
        next={next}
        openMonthsValue={openMonthsValue}
        week={week}
      />
      <WeeklyReturnInput inputId={inputId} week={week} />
      {showStatus ? (
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Estado
          </span>
          <WeeklyStatusSelect className="w-full text-sm" status={week.status} />
        </label>
      ) : includeHiddenStatus ? (
        <input name="status" type="hidden" value={week.status} />
      ) : null}
      <SaveWeeklyButton compact={compact} />
    </form>
  );
}

function DesktopWeeklyReturnForm({
  next,
  openMonthsValue,
  summaryId,
  week,
}: {
  next: string;
  openMonthsValue: string;
  summaryId: string;
  week: WeeklyProfitabilityItem;
}) {
  const inputId = `return-pct-desktop-${summaryId}-${week.id}`;

  return (
    <form
      action={saveWeeklyProfitability}
      className="grid grid-cols-[minmax(8rem,0.75fr)_minmax(15rem,1fr)_minmax(14rem,auto)_minmax(9rem,auto)] items-center gap-4 border-b px-4 py-3 last:border-b-0"
    >
      <WeeklyFormHiddenFields
        next={next}
        openMonthsValue={openMonthsValue}
        week={week}
      />
      <div className="font-medium text-card-foreground">{week.weekLabel}</div>
      <div className="tabular-nums text-card-foreground/82">
        {formatPeriod(week.startDate, week.endDate)}
      </div>
      <div className="grid grid-cols-[minmax(0,7rem)_auto] items-center justify-end gap-2">
        <WeeklyReturnInput inputId={inputId} week={week} />
        <SaveWeeklyButton compact />
      </div>
      <WeeklyStatusSelect status={week.status} />
    </form>
  );
}

function WeekStatusBadge({ status }: { status: WeeklyProfitabilityItem["status"] }) {
  const label =
    weeklyStatusOptions.find((option) => option.value === status)?.label ??
    status;

  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-md border px-3 text-xs font-semibold uppercase",
        weeklyStatusClassName[status],
      )}
    >
      {label}
    </span>
  );
}

function MobileWeekEditor({
  next,
  openMonthsValue,
  week,
}: {
  next: string;
  openMonthsValue: string;
  week: WeeklyProfitabilityItem;
}) {
  return (
    <div className="border-t px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-card-foreground">
            {week.weekLabel}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatPeriod(week.startDate, week.endDate)}
          </p>
        </div>
        <WeekStatusBadge status={week.status} />
      </div>
      <WeeklyReturnForm
        next={next}
        openMonthsValue={openMonthsValue}
        scope="mobile"
        showStatus
        week={week}
      />
    </div>
  );
}

function MonthChildWeeks({
  next,
  openMonthsValue,
  summary,
}: {
  next: string;
  openMonthsValue: string;
  summary: MonthlyProfitabilitySummary;
}) {
  return (
    <div className="border-t bg-muted/14">
      <div className="hidden px-5 py-4 md:block">
        <div className="rounded-md border bg-background/22">
          <div className="grid grid-cols-[minmax(8rem,0.75fr)_minmax(15rem,1fr)_minmax(14rem,auto)_minmax(9rem,auto)] gap-4 border-b px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
            <span>Semana</span>
            <span>Periodo</span>
            <span className="text-right">Rentabilidad</span>
            <span>Estado</span>
          </div>
          {summary.weeks.map((week) => (
            <DesktopWeeklyReturnForm
              key={week.id}
              next={next}
              openMonthsValue={openMonthsValue}
              summaryId={summary.id}
              week={week}
            />
          ))}
        </div>
      </div>

      <div className="md:hidden">
        {summary.weeks.map((week) => (
          <MobileWeekEditor
            key={week.id}
            next={next}
            openMonthsValue={openMonthsValue}
            week={week}
          />
        ))}
      </div>
    </div>
  );
}

function MobileMonthRow({
  isExpanded,
  next,
  openMonthsValue,
  onToggle,
  summary,
}: {
  isExpanded: boolean;
  next: string;
  openMonthsValue: string;
  onToggle: () => void;
  summary: MonthlyProfitabilitySummary;
}) {
  return (
    <div className="border-b last:border-b-0">
      <button
        aria-expanded={isExpanded}
        aria-label={`Semanas de ${summary.monthLabel}`}
        className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/18"
        onClick={onToggle}
        type="button"
      >
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border bg-background/35 text-muted-foreground">
          {isExpanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-card-foreground">
                {summary.monthLabel}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {summary.savedWeeksCount} de {summary.totalWeeksCount} semanas
                guardadas
              </span>
            </span>
            <span
              className={cn(
                "shrink-0 text-sm font-semibold tabular-nums",
                valueTone(summary.returnPct),
              )}
              title={`Base media semanal: ${formatCurrency(summary.averageBase)}`}
            >
              {formatPercent(summary.returnPct, { sign: true })}
            </span>
          </span>
          <span className="mt-3 grid grid-cols-2 gap-2">
            <span className="rounded-md border bg-background/28 px-3 py-2">
              <span className="block text-[0.68rem] font-medium uppercase text-muted-foreground">
                Inicial
              </span>
              <span className="mt-1 block text-sm font-semibold tabular-nums text-card-foreground/90">
                {formatCurrency(summary.initialValue)}
              </span>
            </span>
            <span className="rounded-md border bg-background/28 px-3 py-2">
              <span className="block text-[0.68rem] font-medium uppercase text-muted-foreground">
                Movimientos
              </span>
              <span
                className={cn(
                  "mt-1 block text-sm font-semibold tabular-nums",
                  valueTone(summary.movementTotal),
                )}
              >
                {formatSignedCurrency(summary.movementTotal)}
              </span>
            </span>
            <span className="rounded-md border bg-background/28 px-3 py-2">
              <span className="block text-[0.68rem] font-medium uppercase text-muted-foreground">
                Final
              </span>
              <span className="mt-1 block text-sm font-semibold tabular-nums text-card-foreground/90">
                {formatCurrency(summary.finalValue)}
              </span>
            </span>
            <span className="rounded-md border bg-background/28 px-3 py-2">
              <span className="block text-[0.68rem] font-medium uppercase text-muted-foreground">
                Resultado
              </span>
              <span
                className={cn(
                  "mt-1 block text-sm font-semibold tabular-nums",
                  valueTone(summary.result),
                )}
              >
                {formatSignedCurrency(summary.result)}
              </span>
            </span>
          </span>
        </span>
      </button>
      {isExpanded ? (
        <MonthChildWeeks
          next={next}
          openMonthsValue={openMonthsValue}
          summary={summary}
        />
      ) : null}
    </div>
  );
}

export function WeeklyProfitabilityPanel({
  investors,
  next,
  openMonths,
  weeklyError,
  weeklyStatus,
  weeks,
}: {
  investors: MockInvestor[];
  next: string;
  openMonths?: string;
  weeklyError?: string;
  weeklyStatus?: string;
  weeks: WeeklyProfitabilityItem[];
}) {
  const [monthlySortConfig, setMonthlySortConfig] =
    useState<MonthlyOverviewSortConfig>({
      direction: "desc",
      key: "month",
    });
  const [expandedMonthIds, setExpandedMonthIds] = useState<string[]>(
    () => parseOpenMonthIds(openMonths) ?? readSavedOpenMonthIds() ?? [],
  );
  const periodSort =
    monthlySortConfig.key === "month" ? monthlySortConfig.direction : "desc";
  const currentWeek =
    weeks.find((week) => week.isCurrent) ??
    weeks.find((week) => week.status === "draft");
  const nextWeek =
    weeks.find((week) => currentWeek && week.startDate > currentWeek.startDate) ??
    weeks.find((week) => week.status === "pending");
  const closedWeeks = weeks.filter(
    (week) => week.status === "closed" && week.isSaved,
  );
  const weeklyErrorMessage = weeklyError
    ? weeklyErrorCopy[weeklyError] ??
      "No se pudo guardar la rentabilidad semanal."
    : "";
  const monthlyOverview = useMemo(
    () =>
      sortMonthlySummaries(
        buildMonthlyProfitabilityOverview(investors, weeks, periodSort),
        monthlySortConfig,
      ),
    [investors, monthlySortConfig, periodSort, weeks],
  );
  const availableMonthIds = useMemo(
    () => new Set(monthlyOverview.map((summary) => summary.id)),
    [monthlyOverview],
  );
  const openMonthIds = expandedMonthIds.filter((monthId) =>
    availableMonthIds.has(monthId),
  );
  const openMonthsValue = openMonthIds.join(",");

  function toggleMonth(monthId: string) {
    setExpandedMonthIds((currentMonthIds) => {
      const nextMonthIds = currentMonthIds.includes(monthId)
        ? currentMonthIds.filter((currentMonthId) => currentMonthId !== monthId)
        : [...currentMonthIds, monthId];

      saveOpenMonthIds(nextMonthIds);

      return nextMonthIds;
    });
  }

  function handleMonthlySort(sortKey: MonthlyOverviewSortKey) {
    setMonthlySortConfig((currentSort) => {
      if (currentSort.key !== sortKey) {
        return {
          direction: firstMonthlyOverviewSortDirection[sortKey],
          key: sortKey,
        };
      }

      return {
        direction: currentSort.direction === "asc" ? "desc" : "asc",
        key: sortKey,
      };
    });
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b p-4 sm:p-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(280px,1fr)_minmax(620px,auto)] xl:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <Percent className="size-5 shrink-0 text-card-foreground" />
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold uppercase">
                Rentabilidad semanal
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Porcentaje general que usara el calculo semanal de rentabilidad
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border bg-background/22 px-4 py-3">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold uppercase text-card-foreground">
                    Semana actual
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {currentWeek
                      ? formatPeriod(currentWeek.startDate, currentWeek.endDate)
                      : "Sin semana activa"}
                  </p>
                  <p
                    className={cn(
                      "mt-3 text-2xl font-semibold tabular-nums tracking-normal",
                      currentWeek?.isSaved
                        ? valueTone(currentWeek.returnPct)
                        : "text-muted-foreground",
                    )}
                  >
                    {currentWeek?.isSaved
                      ? formatPercent(currentWeek.returnPct, { sign: true })
                      : "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-md border bg-background/22 px-4 py-3">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold uppercase text-card-foreground">
                    Proxima entrada
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {nextWeek
                      ? formatPeriod(nextWeek.startDate, nextWeek.endDate)
                      : "Calendario al dia"}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-card-foreground">
                    {closedWeeks.length} semanas cerradas
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {weeklyStatus === "saved" ? (
          <div className="border-b bg-positive-soft px-5 py-3 text-sm font-medium text-positive">
            Rentabilidad semanal guardada.
          </div>
        ) : null}
        {weeklyErrorMessage ? (
          <div className="border-b bg-danger-soft px-5 py-3 text-sm font-medium text-danger">
            {weeklyErrorMessage}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase text-card-foreground">
              Resumen mensual
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Capital real con movimientos por fecha y rentabilidad mensual del producto
            </p>
          </div>
          <Button
            className="justify-center"
            onClick={() => handleMonthlySort("month")}
            size="sm"
            type="button"
            variant="outline"
          >
            <ArrowUpDown className="size-4" data-icon="inline-start" />
            {monthlySortConfig.key === "month" &&
            monthlySortConfig.direction === "asc"
              ? "Antiguo primero"
              : "Reciente primero"}
          </Button>
        </div>

        {monthlyOverview.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No hay semanas generadas todavia.
          </div>
        ) : null}

        <div className="md:hidden">
          {monthlyOverview.map((summary) => (
            <MobileMonthRow
              isExpanded={openMonthIds.includes(summary.id)}
              key={summary.id}
              next={next}
              openMonthsValue={openMonthsValue}
              onToggle={() => toggleMonth(summary.id)}
              summary={summary}
            />
          ))}
        </div>

        <Table containerClassName="hidden md:block">
          <TableHeader className="bg-card/95">
            <TableRow className="hover:bg-transparent">
              <SortableMonthlyHead
                className="min-w-56"
                onSort={handleMonthlySort}
                sortConfig={monthlySortConfig}
                sortKey="month"
              >
                Mes
              </SortableMonthlyHead>
              <SortableMonthlyHead
                align="right"
                className="min-w-36"
                onSort={handleMonthlySort}
                sortConfig={monthlySortConfig}
                sortKey="initialValue"
              >
                Capital inicial
              </SortableMonthlyHead>
              <SortableMonthlyHead
                align="right"
                className="min-w-36"
                onSort={handleMonthlySort}
                sortConfig={monthlySortConfig}
                sortKey="movementTotal"
              >
                Movimientos
              </SortableMonthlyHead>
              <SortableMonthlyHead
                align="right"
                className="min-w-36"
                onSort={handleMonthlySort}
                sortConfig={monthlySortConfig}
                sortKey="finalValue"
              >
                Capital final
              </SortableMonthlyHead>
              <SortableMonthlyHead
                align="right"
                className="min-w-32"
                onSort={handleMonthlySort}
                sortConfig={monthlySortConfig}
                sortKey="result"
              >
                Beneficio / perdida
              </SortableMonthlyHead>
              <SortableMonthlyHead
                align="right"
                className="min-w-32"
                onSort={handleMonthlySort}
                sortConfig={monthlySortConfig}
                sortKey="returnPct"
              >
                Rentabilidad
              </SortableMonthlyHead>
              <SortableMonthlyHead
                align="right"
                className="min-w-44"
                onSort={handleMonthlySort}
                sortConfig={monthlySortConfig}
                sortKey="weeks"
              >
                Semanas
              </SortableMonthlyHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthlyOverview.map((summary) => {
              const isExpanded = openMonthIds.includes(summary.id);

              return (
                <Fragment key={summary.id}>
                  <TableRow>
                    <TableCell className="font-medium text-card-foreground/90">
                      <div className="flex items-center gap-2">
                        <Button
                          aria-expanded={isExpanded}
                          aria-label={`Semanas de ${summary.monthLabel}`}
                          className="size-7 rounded-sm"
                          onClick={() => toggleMonth(summary.id)}
                          size="icon"
                          type="button"
                          variant="ghost"
                        >
                          {isExpanded ? (
                            <ChevronDown data-icon="inline-start" />
                          ) : (
                            <ChevronRight data-icon="inline-start" />
                          )}
                        </Button>
                        <span>{summary.monthLabel}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-card-foreground/86">
                      {formatCurrency(summary.initialValue)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums font-medium",
                        valueTone(summary.movementTotal),
                      )}
                    >
                      {formatSignedCurrency(summary.movementTotal)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-card-foreground/86">
                      {formatCurrency(summary.finalValue)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums font-medium",
                        valueTone(summary.result),
                      )}
                    >
                      {formatSignedCurrency(summary.result)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums font-medium",
                        valueTone(summary.returnPct),
                      )}
                      title={`Base media semanal: ${formatCurrency(summary.averageBase)}`}
                    >
                      {formatPercent(summary.returnPct, { sign: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-card-foreground">
                        {summary.savedWeeksCount}/{summary.totalWeeksCount}
                      </span>
                      <span className="ml-1 text-muted-foreground">
                        guardadas
                      </span>
                    </TableCell>
                  </TableRow>
                  {isExpanded ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="p-0" colSpan={7}>
                        <MonthChildWeeks
                          next={next}
                          openMonthsValue={openMonthsValue}
                          summary={summary}
                        />
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
