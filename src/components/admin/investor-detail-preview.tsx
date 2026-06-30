"use client";

import {
  ArrowUpRight,
  CalendarDays,
  Coins,
  History,
  MinusCircle,
  PlusCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getInvestorFullName,
  getNetCapital,
  type MockInvestor,
} from "@/lib/admin-mock-data";
import {
  formatCurrency,
  formatPercent,
  formatShortDate,
  valueTone,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";

import { InvestorStatusPill } from "./investor-table";

type MovementActionType = "contribution" | "withdrawal";

const inputClassName =
  "h-9 rounded-md border bg-background/45 px-3 text-sm text-card-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-[3px] focus:ring-ring/30";

function DetailMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="border-b px-5 py-4 last:border-b-0">
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-lg font-semibold tabular-nums text-card-foreground",
          tone,
        )}
      >
        {value}
      </p>
    </div>
  );
}

function MovementActionForm({ type }: { type: MovementActionType }) {
  const isContribution = type === "contribution";
  const Icon = isContribution ? PlusCircle : MinusCircle;

  return (
    <details className="group rounded-lg border bg-background/28">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm font-semibold text-card-foreground transition-colors hover:bg-secondary/35 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-md border",
              isContribution
                ? "bg-positive-soft text-positive"
                : "bg-danger-soft text-danger",
            )}
          >
            <Icon className="size-4" />
          </span>
          {isContribution ? "Nueva aportación" : "Nueva retirada"}
        </span>
        <span className="text-lg leading-none text-muted-foreground group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="grid gap-3 border-t p-3">
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Fecha
          </span>
          <input type="date" defaultValue="2026-06-30" className={inputClassName} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Importe
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0,00"
            className={cn(inputClassName, "tabular-nums")}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Concepto
          </span>
          <input
            type="text"
            defaultValue={
              isContribution ? "Aportación parcial" : "Retirada parcial"
            }
            className={inputClassName}
          />
        </label>
        <Button type="button" size="sm">
          {isContribution ? "Guardar aportación" : "Guardar retirada"}
        </Button>
      </div>
    </details>
  );
}

function formatMovementNote(note: string) {
  return note.replaceAll("Aportacion", "Aportación");
}

export function InvestorDetailPreview({
  investor,
}: {
  investor: MockInvestor;
}) {
  return (
    <Card className="overflow-hidden 2xl:sticky 2xl:top-6">
      <CardHeader className="border-b p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="truncate text-base font-semibold uppercase">
              {getInvestorFullName(investor)}
            </CardTitle>
            <p className="mt-2 truncate text-sm text-muted-foreground">
              /investor/{investor.slug}
            </p>
          </div>
          <InvestorStatusPill status={investor.status} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm">
            <ArrowUpRight data-icon="inline-start" />
            Abrir resumen
          </Button>
          <Button variant="ghost" size="sm">
            Editar datos
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-2">
          <DetailMetric
            label="Capital neto"
            value={formatCurrency(getNetCapital(investor))}
          />
          <DetailMetric
            label="Balance actual"
            value={formatCurrency(investor.currentBalance)}
          />
          <DetailMetric
            label="Beneficio"
            value={formatCurrency(investor.profit, { sign: true })}
            tone={valueTone(investor.profit)}
          />
          <DetailMetric
            label="Rentabilidad"
            value={formatPercent(investor.profitabilityPct, { sign: true })}
            tone={valueTone(investor.profitabilityPct)}
          />
        </div>

        <section className="border-t px-5 py-4">
          <div className="flex items-center gap-3">
            <CalendarDays className="size-5 text-muted-foreground" />
            <div>
              <h2 className="text-sm font-semibold uppercase text-card-foreground">
                Datos base
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Inicio {formatShortDate(investor.startDate)}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Aportación inicial</span>
              <span className="font-semibold tabular-nums text-card-foreground">
                {formatCurrency(investor.initialContribution)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">
                Aportaciones parciales
              </span>
              <span className="font-semibold tabular-nums text-positive">
                {formatCurrency(investor.additionalContributions, {
                  sign: true,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Retiradas</span>
              <span className="font-semibold tabular-nums text-danger">
                {investor.withdrawals > 0
                  ? formatCurrency(-investor.withdrawals, { sign: true })
                  : "-"}
              </span>
            </div>
          </div>
        </section>

        <section className="border-t px-5 py-4">
          <div className="flex items-center gap-3">
            <Coins className="size-5 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase text-card-foreground">
              Movimientos
            </h2>
          </div>
          <div className="mt-4 grid gap-2">
            <MovementActionForm type="contribution" />
            <MovementActionForm type="withdrawal" />
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {investor.movements.map((movement) => {
              const isContribution = movement.type === "contribution";
              const Icon = isContribution ? PlusCircle : MinusCircle;
              const amount = isContribution ? movement.amount : -movement.amount;

              return (
                <div
                  key={movement.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3"
                >
                  <span
                    className={cn(
                      "grid size-8 place-items-center rounded-md border",
                      isContribution
                        ? "bg-positive-soft text-positive"
                        : "bg-danger-soft text-danger",
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-card-foreground">
                      {formatMovementNote(movement.note)}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {formatShortDate(movement.date)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      valueTone(amount),
                    )}
                  >
                    {formatCurrency(amount, { sign: true })}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border-t px-5 py-4">
          <div className="flex items-center gap-3">
            <History className="size-5 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase text-card-foreground">
              Cronología
            </h2>
          </div>
          <div className="mt-4 flex flex-col">
            {investor.timeline.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 border-l border-border pb-4 pl-4 last:pb-0"
              >
                <span className="-ml-[1.42rem] mt-1 size-2 rounded-full bg-primary shadow-[0_0_18px_rgba(34,197,94,0.5)]" />
                <div className="-mt-4 min-w-0 pl-2">
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {item.date}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-card-foreground">
                    {formatMovementNote(item.label)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t px-5 py-4">
          <h2 className="text-sm font-semibold uppercase text-card-foreground">
            Resumen mensual
          </h2>
          <div className="mt-4 flex flex-col">
            {investor.monthlySummary.map((month) => (
              <div
                key={month.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b py-3 first:pt-0 last:border-b-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-card-foreground">
                    {month.month}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatCurrency(month.balance)}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      valueTone(month.profit),
                    )}
                  >
                    {formatCurrency(month.profit, { sign: true })}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-xs font-medium tabular-nums",
                      valueTone(month.returnPct),
                    )}
                  >
                    {formatPercent(month.returnPct, { sign: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
