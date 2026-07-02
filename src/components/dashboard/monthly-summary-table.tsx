"use client";

import { Fragment, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";

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
import {
  type CapitalMovementItem,
  capitalMovements as defaultCapitalMovements,
  getCapitalMovementsForMonth,
  getWeeklyDataForMonth,
  monthlyInvestmentData,
  type MonthlyInvestmentItem,
  type WeeklyInvestmentItem,
  weeklyInvestmentData,
} from "@/lib/investment-data";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatShortDate,
  valueTone,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";

const rowsPerPage = 8;

function csvEscape(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function formatMovementAmount(movement: CapitalMovementItem) {
  return movement.type === "aportacion" ? movement.amount : -movement.amount;
}

function WeeklyBreakdown({
  month,
  movements,
  weeks,
}: {
  month: MonthlyInvestmentItem;
  movements: CapitalMovementItem[];
  weeks: WeeklyInvestmentItem[];
}) {
  return (
    <div className="border-t bg-muted/18 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-card-foreground">
            Resultado mensual neto
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{month.month}</p>
        </div>
        <p
          className={cn(
            "text-sm font-semibold tabular-nums",
            valueTone(month.returnPct),
          )}
        >
          {formatPercent(month.returnPct, { sign: true })}
        </p>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {weeks.map((week) => (
          <div
            key={week.id}
            className="flex items-center justify-between gap-3 rounded-md border bg-background/35 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-card-foreground">
                {week.week}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatShortDate(week.startDate)} -{" "}
                {formatShortDate(week.endDate)}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 text-sm font-semibold tabular-nums",
                valueTone(week.returnPct),
              )}
            >
              {formatPercent(week.returnPct, { sign: true })}
            </span>
          </div>
        ))}
      </div>
      {movements.length ? (
        <div className="mt-4 rounded-md border bg-background/30 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-card-foreground">
              Aportaciones y retiradas
            </p>
            <p className="text-xs text-muted-foreground">
              {movements.length} movimientos
            </p>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {movements.map((movement) => {
              const signedAmount = formatMovementAmount(movement);

              return (
                <div
                  key={movement.id}
                  className="flex items-center justify-between gap-3 rounded-md border bg-muted/18 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-card-foreground">
                      {movement.type === "aportacion"
                        ? "Aportacion"
                        : "Retirada"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatShortDate(movement.date)} - {movement.note}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-semibold tabular-nums",
                      valueTone(signedAmount),
                    )}
                  >
                    {formatCurrency(signedAmount, { sign: true })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MobileMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <span className="rounded-md border bg-background/28 px-3 py-2">
      <span className="block text-[0.68rem] font-medium uppercase text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "mt-1 block text-sm font-semibold tabular-nums text-card-foreground/90",
          tone,
        )}
      >
        {value}
      </span>
    </span>
  );
}

function MobileMonthlyRow({
  item,
  movements,
  weeks,
  isExpanded,
  onToggle,
}: {
  item: MonthlyInvestmentItem;
  movements: CapitalMovementItem[];
  weeks: WeeklyInvestmentItem[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/18"
        aria-expanded={isExpanded}
        aria-label={`Detalle semanal de ${item.month}`}
        onClick={onToggle}
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
                {item.month}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Valor final {formatCurrency(item.finalValue)}
              </span>
            </span>
            <span
              className={cn(
                "shrink-0 text-sm font-semibold tabular-nums",
                valueTone(item.returnPct),
              )}
            >
              {formatPercent(item.returnPct, { sign: true })}
            </span>
          </span>
          <span className="mt-3 grid grid-cols-2 gap-2">
            <MobileMetric
              label="Inicial"
              value={formatCurrency(item.initialValue)}
            />
            <MobileMetric
              label="Ganancia"
              value={formatCurrency(item.gain, { sign: true })}
              tone={valueTone(item.gain)}
            />
            {item.contributions > 0 ? (
              <MobileMetric
                label="Aportaciones"
                value={formatCurrency(item.contributions, { sign: true })}
                tone="text-positive"
              />
            ) : null}
            {item.withdrawals > 0 ? (
              <MobileMetric
                label="Retiradas"
                value={formatCurrency(-item.withdrawals, { sign: true })}
                tone="text-danger"
              />
            ) : null}
          </span>
        </span>
      </button>
      {isExpanded ? (
        <WeeklyBreakdown month={item} movements={movements} weeks={weeks} />
      ) : null}
    </div>
  );
}

export function MonthlySummaryTable({
  capitalMovements = defaultCapitalMovements,
  monthlyData = monthlyInvestmentData,
  weeklyData = weeklyInvestmentData,
}: {
  capitalMovements?: CapitalMovementItem[];
  monthlyData?: MonthlyInvestmentItem[];
  weeklyData?: WeeklyInvestmentItem[];
}) {
  const [page, setPage] = useState(1);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(monthlyData.length / rowsPerPage));

  const visibleRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return monthlyData.slice(start, start + rowsPerPage);
  }, [monthlyData, page]);

  function exportCsv() {
    const headers = [
      "Mes",
      "Valor inicial (€)",
      "Aportaciones (€)",
      "Retiradas (€)",
      "Valor final (€)",
      "Ganancia (€)",
      "Rentabilidad (%)",
    ];
    const rows = monthlyData.map((item) => [
      item.month,
      formatNumber(item.initialValue),
      formatNumber(item.contributions),
      formatNumber(item.withdrawals),
      formatNumber(item.finalValue),
      formatNumber(item.gain),
      formatNumber(item.returnPct),
    ]);
    const csv = [
      headers.map(csvEscape).join(";"),
      ...rows.map((row) => row.map(csvEscape).join(";")),
    ].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "resumen-mensual-inversion.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader className="flex-col items-start gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <CalendarDays className="size-5 shrink-0 text-card-foreground" />
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold uppercase">
              Resumen mensual
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Evolución detallada mes a mes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden text-sm text-muted-foreground sm:block">
            {monthlyData.length} meses en total
          </p>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download data-icon="inline-start" />
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="md:hidden">
          {visibleRows.map((item) => {
            const isExpanded = expandedMonth === item.date;
            const monthMovements = getCapitalMovementsForMonth(
              item.date,
              capitalMovements,
            );
            const weeklyRows = getWeeklyDataForMonth(item.date, weeklyData);

            return (
              <MobileMonthlyRow
                key={item.date}
                item={item}
                movements={monthMovements}
                weeks={weeklyRows}
                isExpanded={isExpanded}
                onToggle={() =>
                  setExpandedMonth((current) =>
                    current === item.date ? null : item.date,
                  )
                }
              />
            );
          })}
        </div>
        <Table containerClassName="hidden max-h-[460px] md:block">
          <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur">
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-44">Mes</TableHead>
              <TableHead className="min-w-40 text-right">
                Valor inicial (€)
              </TableHead>
              <TableHead className="min-w-36 text-right">
                Aportaciones (€)
              </TableHead>
              <TableHead className="min-w-32 text-right">
                Retiradas (€)
              </TableHead>
              <TableHead className="min-w-40 text-right">
                Valor final (€)
              </TableHead>
              <TableHead className="min-w-36 text-right">
                Ganancia (€)
              </TableHead>
              <TableHead className="min-w-36 text-right">
                Rentabilidad (%)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((item) => {
              const isExpanded = expandedMonth === item.date;
              const monthMovements = getCapitalMovementsForMonth(
                item.date,
                capitalMovements,
              );
              const weeklyRows = getWeeklyDataForMonth(item.date, weeklyData);

              return (
                <Fragment key={item.date}>
                  <TableRow>
                    <TableCell className="font-medium text-card-foreground/90">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-sm"
                          aria-expanded={isExpanded}
                          aria-label={`Detalle semanal de ${item.month}`}
                          onClick={() =>
                            setExpandedMonth((current) =>
                              current === item.date ? null : item.date,
                            )
                          }
                        >
                          {isExpanded ? (
                            <ChevronDown data-icon="inline-start" />
                          ) : (
                            <ChevronRight data-icon="inline-start" />
                          )}
                        </Button>
                        <span>{item.month}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-card-foreground/86">
                      {formatCurrency(item.initialValue)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums font-medium",
                        item.contributions > 0
                          ? "text-positive"
                          : "text-muted-foreground",
                      )}
                    >
                      {item.contributions > 0
                        ? formatCurrency(item.contributions, { sign: true })
                        : "-"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums font-medium",
                        item.withdrawals > 0
                          ? "text-danger"
                          : "text-muted-foreground",
                      )}
                    >
                      {item.withdrawals > 0
                        ? formatCurrency(-item.withdrawals, { sign: true })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-card-foreground/86">
                      {formatCurrency(item.finalValue)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums font-medium",
                        valueTone(item.gain),
                      )}
                    >
                      {formatCurrency(item.gain, { sign: true })}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums font-medium",
                        valueTone(item.returnPct),
                      )}
                    >
                      {formatPercent(item.returnPct, { sign: true })}
                    </TableCell>
                  </TableRow>
                  {isExpanded ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={7} className="p-0">
                        <WeeklyBreakdown
                          month={item}
                          movements={monthMovements}
                          weeks={weeklyRows}
                        />
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-4 sm:px-5">
          <p className="text-sm text-muted-foreground sm:hidden">
            {monthlyData.length} meses en total
          </p>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Página anterior"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft />
            </Button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (pageNumber) => (
                <Button
                  key={pageNumber}
                  variant={pageNumber === page ? "default" : "ghost"}
                  size="sm"
                  aria-label={`Ir a la página ${pageNumber}`}
                  onClick={() => {
                    setPage(pageNumber);
                    setExpandedMonth(null);
                  }}
                >
                  {pageNumber}
                </Button>
              ),
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Página siguiente"
              disabled={page === totalPages}
              onClick={() => {
                setPage((current) => Math.min(totalPages, current + 1));
                setExpandedMonth(null);
              }}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
