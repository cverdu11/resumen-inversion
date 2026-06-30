"use client";

import { CalendarDays, CheckCircle2, Clock3, Percent, PencilLine } from "lucide-react";

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
import type { WeeklyProfitabilityItem } from "@/lib/admin-mock-data";
import { formatPercent, formatShortDate, valueTone } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const weeklyStatus: Record<
  WeeklyProfitabilityItem["status"],
  {
    label: string;
    className: string;
    icon: typeof CheckCircle2;
  }
> = {
  closed: {
    label: "Cerrada",
    className: "border-positive/35 bg-positive-soft text-positive",
    icon: CheckCircle2,
  },
  draft: {
    label: "Borrador",
    className: "border-info/35 bg-info-soft text-info",
    icon: PencilLine,
  },
  pending: {
    label: "Pendiente",
    className: "border-warning/35 bg-warning-soft text-warning",
    icon: Clock3,
  },
};

function WeeklyStatusPill({
  status,
}: {
  status: WeeklyProfitabilityItem["status"];
}) {
  const styles = weeklyStatus[status];
  const Icon = styles.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[0.68rem] font-semibold uppercase",
        styles.className,
      )}
    >
      <Icon className="size-3.5" />
      {styles.label}
    </span>
  );
}

function MobileWeekRow({ week }: { week: WeeklyProfitabilityItem }) {
  return (
    <div className="border-b px-4 py-4 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-card-foreground">
            {week.weekLabel}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatShortDate(week.startDate)} - {formatShortDate(week.endDate)}
          </p>
        </div>
        <WeeklyStatusPill status={week.status} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-4 rounded-md border bg-background/28 px-3 py-2">
        <span className="text-xs font-medium uppercase text-muted-foreground">
          Rentabilidad
        </span>
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            week.status === "pending"
              ? "text-muted-foreground"
              : valueTone(week.returnPct),
          )}
        >
          {week.status === "pending"
            ? "Por definir"
            : formatPercent(week.returnPct, { sign: true })}
        </span>
      </div>
    </div>
  );
}

export function WeeklyProfitabilityPanel({
  weeks,
}: {
  weeks: WeeklyProfitabilityItem[];
}) {
  const currentDraft = weeks.find((week) => week.status === "draft");
  const pendingWeek = weeks.find((week) => week.status === "pending");
  const closedWeeks = weeks.filter((week) => week.status === "closed");

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-col items-start gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <Percent className="size-5 shrink-0 text-card-foreground" />
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold uppercase">
              Rentabilidad semanal
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Porcentajes generales aplicables por semana
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <PencilLine data-icon="inline-start" />
          Nueva semana
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid border-b lg:grid-cols-[1fr_1fr]">
          <div className="border-b px-5 py-4 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-3">
              <CalendarDays className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold uppercase text-card-foreground">
                  Semana actual
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {currentDraft
                    ? `${formatShortDate(
                        currentDraft.startDate,
                      )} - ${formatShortDate(currentDraft.endDate)}`
                    : "Sin borrador activo"}
                </p>
              </div>
            </div>
            <p
              className={cn(
                "mt-4 text-3xl font-semibold tabular-nums tracking-normal",
                currentDraft ? valueTone(currentDraft.returnPct) : "text-muted-foreground",
              )}
            >
              {currentDraft
                ? formatPercent(currentDraft.returnPct, { sign: true })
                : "-"}
            </p>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center gap-3">
              <Clock3 className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold uppercase text-card-foreground">
                  Próxima entrada
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {pendingWeek
                    ? `${formatShortDate(
                        pendingWeek.startDate,
                      )} - ${formatShortDate(pendingWeek.endDate)}`
                    : "Calendario al dia"}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="rounded-md border bg-background/35 px-3 py-2 text-sm text-muted-foreground">
                % pendiente
              </span>
              <span className="rounded-md border bg-background/35 px-3 py-2 text-sm text-card-foreground">
                {closedWeeks.length} semanas cerradas
              </span>
            </div>
          </div>
        </div>

        <div className="md:hidden">
          {weeks.map((week) => (
            <MobileWeekRow key={week.id} week={week} />
          ))}
        </div>

        <Table containerClassName="hidden md:block">
          <TableHeader className="bg-card/95">
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-36">Semana</TableHead>
              <TableHead className="min-w-44">Periodo</TableHead>
              <TableHead className="min-w-36 text-right">
                Rentabilidad
              </TableHead>
              <TableHead className="min-w-32">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weeks.map((week) => (
              <TableRow key={week.id}>
                <TableCell className="font-medium text-card-foreground">
                  {week.weekLabel}
                </TableCell>
                <TableCell className="tabular-nums text-card-foreground/86">
                  {formatShortDate(week.startDate)} -{" "}
                  {formatShortDate(week.endDate)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums font-semibold",
                    week.status === "pending"
                      ? "text-muted-foreground"
                      : valueTone(week.returnPct),
                  )}
                >
                  {week.status === "pending"
                    ? "-"
                    : formatPercent(week.returnPct, { sign: true })}
                </TableCell>
                <TableCell>
                  <WeeklyStatusPill status={week.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
