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
  compoundWeeklyReturn,
  getCapitalMovementsForMonth,
  getWeeklyDataForMonth,
  monthlyInvestmentData,
  type MonthlyInvestmentItem,
  type WeeklyInvestmentItem,
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
  const compoundReturn = compoundWeeklyReturn(weeks);

  return (
    <div className="border-t bg-muted/18 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-card-foreground">
            Resultado semanal neto
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{month.month}</p>
        </div>
        <p
          className={cn(
            "text-sm font-semibold tabular-nums",
            valueTone(compoundReturn),
          )}
        >
          {formatPercent(compoundReturn, { sign: true })}
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

export function MonthlySummaryTable() {
  const [page, setPage] = useState(1);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const totalPages = Math.ceil(monthlyInvestmentData.length / rowsPerPage);

  const visibleRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return monthlyInvestmentData.slice(start, start + rowsPerPage);
  }, [page]);

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
    const rows = monthlyInvestmentData.map((item) => [
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
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-4 border-b p-5">
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
            {monthlyInvestmentData.length} meses en total
          </p>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download data-icon="inline-start" />
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table containerClassName="max-h-[460px]">
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
              const capitalMovements = getCapitalMovementsForMonth(item.date);
              const weeklyRows = getWeeklyDataForMonth(item.date);

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
                          movements={capitalMovements}
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4">
          <p className="text-sm text-muted-foreground sm:hidden">
            {monthlyInvestmentData.length} meses en total
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
