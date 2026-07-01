"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowUpDown,
  CalendarDays,
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
import { formatPercent, valueTone } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { WeeklyProfitabilityItem } from "@/lib/weekly-profitability";

const periodDateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const percentInputFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
  useGrouping: false,
});

const weeklyErrorCopy: Record<string, string> = {
  invalid: "Revisa la semana y el porcentaje. El valor debe estar entre -100 % y 100 %.",
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
    draft: "border-info/35 bg-info-soft text-info",
    closed: "border-positive/35 bg-positive-soft text-positive",
    pending: "border-warning/35 bg-warning-soft text-warning",
  };

const fieldClassName =
  "h-8 w-full rounded-md border bg-background/45 px-2.5 text-sm text-card-foreground outline-none transition-colors focus:border-primary/70 focus:ring-2 focus:ring-primary/20";

type PeriodSort = "desc" | "asc";

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
  formId,
  status,
}: {
  className?: string;
  formId?: string;
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
      form={formId}
      name="status"
      onChange={(event) =>
        setSelectedStatus(
          event.target.value as WeeklyProfitabilityItem["status"],
        )
      }
      value={selectedStatus}
    >
      {weeklyStatusOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function WeeklyReturnForm({
  compact = false,
  formId,
  includeHiddenStatus = true,
  next,
  showStatus = false,
  scope = "inline",
  week,
}: {
  compact?: boolean;
  formId?: string;
  includeHiddenStatus?: boolean;
  next: string;
  showStatus?: boolean;
  scope?: "desktop" | "mobile" | "inline";
  week: WeeklyProfitabilityItem;
}) {
  const inputId = `return-pct-${scope}-${week.id}`;

  return (
    <form
      action={saveWeeklyProfitability}
      id={formId}
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2",
        compact ? "justify-end md:flex md:items-center" : "mt-3",
      )}
    >
      <input name="next" type="hidden" value={next} />
      <input name="week_start" type="hidden" value={week.startDate} />
      <input name="week_end" type="hidden" value={week.endDate} />
      <label className="sr-only" htmlFor={inputId}>
        Rentabilidad de {week.weekLabel}
      </label>
      <div className="relative min-w-0">
        <input
          className={cn(
            fieldClassName,
            "py-1.5 pl-2.5 pr-7 text-right tabular-nums placeholder:text-muted-foreground/70",
            compact && "md:w-24",
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
      {showStatus ? (
        <label className="col-span-2 grid gap-1.5">
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

function MobileWeekRow({
  next,
  week,
}: {
  next: string;
  week: WeeklyProfitabilityItem;
}) {
  return (
    <div className="border-b px-4 py-4 last:border-b-0">
      <div>
        <p className="text-sm font-semibold text-card-foreground">
          {week.weekLabel}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {week.monthLabel}
        </p>
        <p className="mt-1 text-xs text-card-foreground/76">
          {formatPeriod(week.startDate, week.endDate)}
        </p>
      </div>
      <WeeklyReturnForm next={next} scope="mobile" showStatus week={week} />
    </div>
  );
}

export function WeeklyProfitabilityPanel({
  next,
  weeklyError,
  weeklyStatus,
  weeks,
}: {
  next: string;
  weeklyError?: string;
  weeklyStatus?: string;
  weeks: WeeklyProfitabilityItem[];
}) {
  const [periodSort, setPeriodSort] = useState<PeriodSort>("desc");
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
    ? weeklyErrorCopy[weeklyError] ?? "No se pudo guardar la rentabilidad semanal."
    : "";
  const sortedWeeks = useMemo(
    () =>
      [...weeks].sort((left, right) =>
        periodSort === "desc"
          ? right.startDate.localeCompare(left.startDate)
          : left.startDate.localeCompare(right.startDate),
      ),
    [periodSort, weeks],
  );

  function togglePeriodSort() {
    setPeriodSort((currentSort) => (currentSort === "desc" ? "asc" : "desc"));
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

        <div className="border-b px-4 py-3 md:hidden">
          <Button
            className="w-full justify-center"
            onClick={togglePeriodSort}
            size="sm"
            type="button"
            variant="outline"
          >
            <ArrowUpDown className="size-4" data-icon="inline-start" />
            Periodo:{" "}
            {periodSort === "desc" ? "reciente primero" : "antiguo primero"}
          </Button>
        </div>

        <div className="md:hidden">
          {sortedWeeks.map((week) => (
            <MobileWeekRow key={week.id} next={next} week={week} />
          ))}
        </div>

        <Table containerClassName="hidden md:block">
          <TableHeader className="bg-card/95">
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-32">Semana</TableHead>
              <TableHead className="min-w-44">Mes</TableHead>
              <TableHead className="min-w-56">
                <button
                  className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-left text-xs font-semibold uppercase text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-card-foreground"
                  onClick={togglePeriodSort}
                  type="button"
                >
                  Periodo
                  <ArrowUpDown className="size-3.5" />
                  <span className="text-[0.65rem] font-medium normal-case">
                    {periodSort === "desc"
                      ? "reciente primero"
                      : "antiguo primero"}
                  </span>
                </button>
              </TableHead>
              <TableHead className="min-w-44 text-right">
                Rentabilidad
              </TableHead>
              <TableHead className="min-w-56">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedWeeks.map((week) => {
              const formId = `weekly-form-desktop-${week.id}`;

              return (
                <TableRow key={week.id}>
                  <TableCell className="font-medium text-card-foreground">
                    {week.weekLabel}
                  </TableCell>
                  <TableCell className="text-card-foreground/86">
                    {week.monthLabel}
                  </TableCell>
                  <TableCell className="tabular-nums text-card-foreground/86">
                    {formatPeriod(week.startDate, week.endDate)}
                  </TableCell>
                  <TableCell>
                    <WeeklyReturnForm
                      compact
                      formId={formId}
                      includeHiddenStatus={false}
                      next={next}
                      scope="desktop"
                      week={week}
                    />
                  </TableCell>
                  <TableCell>
                    <WeeklyStatusSelect
                      formId={formId}
                      status={week.status}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
