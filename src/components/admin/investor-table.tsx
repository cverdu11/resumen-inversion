"use client";

import { useState } from "react";
import { Eye, Pencil, Plus, Trash2, UsersRound } from "lucide-react";
import Link from "next/link";
import { useFormStatus } from "react-dom";

import { deleteInvestor } from "@/app/admin/actions";
import { CreateInvestorForm } from "@/components/admin/create-investor-form";
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
  getInvestorFullName,
  type InvestorStatus,
  type MockInvestor,
} from "@/lib/admin-mock-data";
import {
  formatCurrency,
  formatPercent,
  formatShortDate,
  valueTone,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";

const statusStyles: Record<
  InvestorStatus,
  {
    label: string;
    className: string;
  }
> = {
  active: {
    label: "Activo",
    className: "border-positive/35 bg-positive-soft text-positive",
  },
  watch: {
    label: "Seguimiento",
    className: "border-warning/35 bg-warning-soft text-warning",
  },
  pending: {
    label: "Pendiente",
    className: "border-info/35 bg-info-soft text-info",
  },
  paused: {
    label: "Pausado",
    className: "border-muted-foreground/30 bg-muted/60 text-muted-foreground",
  },
};

export function InvestorStatusPill({ status }: { status: InvestorStatus }) {
  const styles = statusStyles[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-[0.68rem] font-semibold uppercase",
        styles.className,
      )}
    >
      {styles.label}
    </span>
  );
}

function DeleteInvestorButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-danger transition-colors hover:bg-danger-soft disabled:cursor-default disabled:opacity-55"
    >
      <Trash2 className="size-4" />
      {pending ? "Eliminando..." : "Eliminar inversor"}
    </button>
  );
}

function InvestorActionsMenu({ investor }: { investor: MockInvestor }) {
  return (
    <details className="group relative">
      <summary
        className="grid size-8 cursor-pointer list-none place-items-center rounded-sm border text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-card-foreground [&::-webkit-details-marker]:hidden"
        aria-label={`Editar ${getInvestorFullName(investor)}`}
      >
        <Pencil className="size-4" />
      </summary>
      <div className="absolute left-0 top-10 z-30 w-52 rounded-md border bg-card p-1 shadow-xl shadow-background/40">
        <form
          action={deleteInvestor}
          onSubmit={(event) => {
            if (
              !window.confirm(
                `Eliminar a ${getInvestorFullName(investor)} del dashboard y la base de datos?`,
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="slug" value={investor.slug} />
          <DeleteInvestorButton />
        </form>
      </div>
    </details>
  );
}

function MobileInvestorCard({
  investor,
  isSelected,
}: {
  investor: MockInvestor;
  isSelected: boolean;
}) {
  return (
    <div
      className={cn(
        "w-full border-b px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-secondary/35",
        isSelected && "bg-secondary/55",
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <Link
          href={`/admin?tab=panel&investor=${investor.slug}`}
          className="min-w-0"
          aria-current={isSelected ? "true" : undefined}
        >
          <span className="block truncate text-sm font-semibold text-card-foreground">
            {getInvestorFullName(investor)}
          </span>
          <span className="mt-1 block truncate text-xs text-muted-foreground">
            /investor/{investor.slug}
          </span>
        </Link>
        <span className="flex shrink-0 items-center gap-2">
          <InvestorActionsMenu investor={investor} />
          <InvestorStatusPill status={investor.status} />
        </span>
      </span>

      <span className="mt-4 grid grid-cols-2 gap-2">
        <span className="rounded-md border bg-background/28 px-3 py-2">
          <span className="block text-[0.68rem] font-medium uppercase text-muted-foreground">
            Balance
          </span>
          <span className="mt-1 block text-sm font-semibold tabular-nums text-card-foreground">
            {formatCurrency(investor.currentBalance)}
          </span>
        </span>
        <span className="rounded-md border bg-background/28 px-3 py-2">
          <span className="block text-[0.68rem] font-medium uppercase text-muted-foreground">
            Beneficio
          </span>
          <span
            className={cn(
              "mt-1 block text-sm font-semibold tabular-nums",
              valueTone(investor.profit),
            )}
          >
            {formatCurrency(investor.profit, { sign: true })}
          </span>
        </span>
        <span className="rounded-md border bg-background/28 px-3 py-2">
          <span className="block text-[0.68rem] font-medium uppercase text-muted-foreground">
            Inicio
          </span>
          <span className="mt-1 block text-sm font-semibold tabular-nums text-card-foreground">
            {formatShortDate(investor.startDate)}
          </span>
        </span>
        <span className="rounded-md border bg-background/28 px-3 py-2">
          <span className="block text-[0.68rem] font-medium uppercase text-muted-foreground">
            Rentabilidad
          </span>
          <span
            className={cn(
              "mt-1 block text-sm font-semibold tabular-nums",
              valueTone(investor.profitabilityPct),
            )}
          >
            {formatPercent(investor.profitabilityPct, { sign: true })}
          </span>
        </span>
      </span>
    </div>
  );
}

export function InvestorTable({
  investorError,
  investors,
  selectedInvestorId,
}: {
  investorError?: string;
  investors: MockInvestor[];
  selectedInvestorId: string;
}) {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-col items-start gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <UsersRound className="size-5 shrink-0 text-card-foreground" />
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold uppercase">
              Inversores
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {investors.length} perfiles en cartera
            </p>
          </div>
        </div>
        <Button
          variant={isCreating ? "secondary" : "outline"}
          size="sm"
          aria-expanded={isCreating}
          onClick={() => setIsCreating((current) => !current)}
        >
          <Plus data-icon="inline-start" />
          Nuevo inversor
        </Button>
      </CardHeader>
      {isCreating ? (
        <CreateInvestorForm onCancel={() => setIsCreating(false)} />
      ) : null}
      {investorError ? (
        <div className="border-b bg-danger-soft px-5 py-3 text-sm font-medium text-danger">
          No se pudo crear el inversor. Revisa los datos e intentalo de nuevo.
        </div>
      ) : null}
      <CardContent className="p-0">
        <div className="lg:hidden">
          {investors.map((investor) => (
            <MobileInvestorCard
              key={investor.id}
              investor={investor}
              isSelected={selectedInvestorId === investor.id}
            />
          ))}
        </div>
        <Table
          containerClassName="hidden max-h-[560px] lg:block"
          className="min-w-[1164px] [&_td]:px-3 [&_th]:px-3"
        >
          <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur">
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[220px]">Inversor</TableHead>
              <TableHead className="min-w-[90px]">Fecha inicio</TableHead>
              <TableHead className="min-w-[124px] text-right">
                Aportación inicial
              </TableHead>
              <TableHead className="min-w-[150px] text-right">
                Aportaciones parciales
              </TableHead>
              <TableHead className="min-w-[110px] text-right">
                Retiradas
              </TableHead>
              <TableHead className="min-w-[135px] text-right">
                Balance actual
              </TableHead>
              <TableHead className="min-w-[105px] text-right">
                Beneficio
              </TableHead>
              <TableHead className="min-w-[95px]">Estado</TableHead>
              <TableHead className="min-w-[175px]">Ruta inversor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {investors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-28 text-center text-sm text-muted-foreground"
                >
                  No hay inversores registrados todavia.
                </TableCell>
              </TableRow>
            ) : null}
            {investors.map((investor) => {
              const isSelected = selectedInvestorId === investor.id;

              return (
                <TableRow
                  key={investor.id}
                  data-state={isSelected ? "selected" : undefined}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <InvestorActionsMenu investor={investor} />
                      <Button
                        variant={isSelected ? "default" : "ghost"}
                        size="icon"
                        className="size-8 rounded-sm"
                        aria-label={`Vista previa de ${getInvestorFullName(
                          investor,
                        )}`}
                        asChild
                      >
                        <Link
                          href={`/admin?tab=panel&investor=${investor.slug}`}
                        >
                          <Eye data-icon="inline-start" />
                        </Link>
                      </Button>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-card-foreground">
                          {getInvestorFullName(investor)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          ID {investor.id.replace("inv-", "")}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums text-card-foreground/86">
                    {formatShortDate(investor.startDate)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-card-foreground/86">
                    {formatCurrency(investor.initialContribution)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-positive">
                    {formatCurrency(investor.additionalContributions, {
                      sign: true,
                    })}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-danger">
                    {investor.withdrawals > 0
                      ? formatCurrency(-investor.withdrawals, { sign: true })
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-card-foreground/86">
                    {formatCurrency(investor.currentBalance)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums font-medium",
                      valueTone(investor.profit),
                    )}
                  >
                    {formatCurrency(investor.profit, { sign: true })}
                  </TableCell>
                  <TableCell>
                    <InvestorStatusPill status={investor.status} />
                  </TableCell>
                  <TableCell>
                    <code className="whitespace-nowrap rounded-md border bg-background/35 px-2 py-1 text-xs text-card-foreground/90">
                      /investor/{investor.slug}
                    </code>
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
