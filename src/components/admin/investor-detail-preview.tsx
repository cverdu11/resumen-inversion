"use client";

import {
  CalendarDays,
  Coins,
  History,
  MinusCircle,
  Pencil,
  PlusCircle,
  Save,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";

import {
  addInvestorMovement,
  deleteInvestorMovement,
  updateInvestorMovement,
} from "@/app/admin/actions";
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
  type InvestorMovement,
  type MockInvestor,
} from "@/lib/admin-mock-data";
import {
  formatCurrency,
  formatFullDate,
  formatPercent,
  formatShortDate,
  valueTone,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";

import { InvestorStatusPill } from "./investor-table";

type MovementActionType = "contribution" | "withdrawal";

const compactInputClassName =
  "h-8 w-full rounded-md border bg-background/45 px-2.5 text-sm text-card-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-[3px] focus:ring-ring/30";
const fieldLabelClassName =
  "text-[0.68rem] font-semibold uppercase tracking-[0.02em] text-muted-foreground";
const defaultDisplayMovementNotes = {
  contribution: "Aportaci\u00f3n parcial",
  withdrawal: "Retirada parcial",
} as const;

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

function MovementSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="sm"
      className="h-8 px-3 min-[420px]:mb-px min-[420px]:self-end"
      disabled={pending}
    >
      {pending ? "Guardando..." : "Guardar"}
    </Button>
  );
}

function MovementUpdateButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="sm"
      className="h-7 px-2.5"
      disabled={pending}
    >
      <Save data-icon="inline-start" />
      {pending ? "Guardando..." : "Guardar"}
    </Button>
  );
}

function MovementDeleteButton({ movementLabel }: { movementLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      formAction={deleteInvestorMovement}
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-danger hover:bg-danger-soft hover:text-danger"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(`Eliminar este movimiento: ${movementLabel}?`)) {
          event.preventDefault();
        }
      }}
    >
      <Trash2 data-icon="inline-start" />
      {pending ? "Eliminando..." : "Eliminar"}
    </Button>
  );
}

function MovementActionForm({
  investorSlug,
  type,
}: {
  investorSlug: string;
  type: MovementActionType;
}) {
  const isContribution = type === "contribution";
  const Icon = isContribution ? PlusCircle : MinusCircle;
  const defaultNote = defaultDisplayMovementNotes[type];

  return (
    <details className="group rounded-md border border-border/80 bg-background/20">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-card-foreground transition-colors hover:bg-secondary/30 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "grid size-6 shrink-0 place-items-center rounded-md border",
              isContribution
                ? "bg-positive-soft text-positive"
                : "bg-danger-soft text-danger",
            )}
          >
            <Icon className="size-3.5" />
          </span>
          {isContribution ? "Nueva aportación" : "Nueva retirada"}
        </span>
        <span className="text-lg leading-none text-muted-foreground group-open:rotate-45">
          +
        </span>
      </summary>
      <form action={addInvestorMovement} className="grid gap-2 border-t p-2.5">
        <input type="hidden" name="slug" value={investorSlug} />
        <input type="hidden" name="movement_type" value={type} />
        <label className="grid gap-1">
          <span className={fieldLabelClassName}>Fecha</span>
          <input
            type="date"
            lang="es-ES"
            name="movement_date"
            className={compactInputClassName}
            required
          />
        </label>
        <label className="grid gap-1">
          <span className={fieldLabelClassName}>Importe</span>
          <input
            name="amount"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            className={cn(compactInputClassName, "tabular-nums")}
            required
          />
        </label>
        <div className="grid gap-2 min-[420px]:grid-cols-[minmax(0,1fr)_auto] min-[420px]:items-end">
          <label className="grid gap-1">
            <span className={fieldLabelClassName}>Concepto</span>
            <input
              name="note"
              type="text"
              defaultValue={defaultNote}
              className={compactInputClassName}
            />
          </label>
          <MovementSubmitButton />
        </div>
      </form>
    </details>
  );
}

function formatMovementNote(note: string) {
  return note.replaceAll("Aportacion", "Aportaci\u00f3n");
}

function normalizeMovementNote(note: string) {
  return note
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isDefaultMovementNote(note: string) {
  const normalizedNote = normalizeMovementNote(note);

  return (
    normalizedNote === "aportacion parcial" ||
    normalizedNote === "retirada parcial"
  );
}

function getMovementDisplayNote(movement: InvestorMovement) {
  const note = formatMovementNote(movement.note);

  return isDefaultMovementNote(note)
    ? defaultDisplayMovementNotes[movement.type]
    : note;
}

function MovementEditForm({
  investorSlug,
  movement,
  onCancel,
}: {
  investorSlug: string;
  movement: InvestorMovement;
  onCancel: () => void;
}) {
  const initialNote = getMovementDisplayNote(movement);
  const [selectedType, setSelectedType] = useState<MovementActionType>(
    movement.type,
  );
  const [noteValue, setNoteValue] = useState(initialNote);

  if (!movement.sourceId || movement.sourceType === "initial_contribution") {
    return null;
  }

  return (
    <div className="mt-2 rounded-md border border-border/70 bg-background/20 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <form action={updateInvestorMovement} className="grid gap-2.5">
        <input type="hidden" name="slug" value={investorSlug} />
        <input type="hidden" name="movement_id" value={movement.sourceId} />
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className={fieldLabelClassName}>Tipo</span>
            <select
              name="movement_type"
              className={compactInputClassName}
              value={selectedType}
              onChange={(event) => {
                const nextType =
                  event.target.value === "withdrawal"
                    ? "withdrawal"
                    : "contribution";

                setSelectedType(nextType);
                setNoteValue((currentNote) =>
                  isDefaultMovementNote(currentNote)
                    ? defaultDisplayMovementNotes[nextType]
                    : currentNote,
                );
              }}
            >
              <option value="contribution">{"Aportaci\u00f3n"}</option>
              <option value="withdrawal">Retirada</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className={fieldLabelClassName}>Fecha</span>
            <input
              type="date"
              lang="es-ES"
              name="movement_date"
              className={compactInputClassName}
              defaultValue={movement.date}
              required
            />
          </label>
        </div>
        <div className="grid gap-2 min-[420px]:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)]">
          <label className="grid gap-1">
            <span className={fieldLabelClassName}>Importe</span>
            <input
              name="amount"
              type="text"
              inputMode="decimal"
              className={cn(compactInputClassName, "tabular-nums")}
              defaultValue={String(movement.amount)}
              required
            />
          </label>
          <label className="grid gap-1">
            <span className={fieldLabelClassName}>Concepto</span>
            <input
              name="note"
              type="text"
              className={compactInputClassName}
              value={noteValue}
              onChange={(event) => setNoteValue(event.target.value)}
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <MovementDeleteButton
            movementLabel={getMovementDisplayNote(movement)}
          />
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2.5"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <MovementUpdateButton />
          </div>
        </div>
      </form>
    </div>
  );
}

function MovementsSection({ investor }: { investor: MockInvestor }) {
  const [editingMovementId, setEditingMovementId] = useState<string | null>(
    null,
  );

  return (
    <section className="border-t px-5 py-4">
      <div className="flex items-center gap-3">
        <Coins className="size-5 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase text-card-foreground">
          Movimientos
        </h2>
      </div>
      <div className="mt-4 grid gap-2">
        <MovementActionForm
          investorSlug={investor.slug}
          type="contribution"
        />
        <MovementActionForm investorSlug={investor.slug} type="withdrawal" />
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {investor.movements.map((movement) => {
          const isContribution = movement.type === "contribution";
          const Icon = isContribution ? PlusCircle : MinusCircle;
          const amount = isContribution ? movement.amount : -movement.amount;
          const canEdit =
            Boolean(movement.sourceId) &&
            movement.sourceType !== "initial_contribution";
          const isEditing = editingMovementId === movement.id;

          return (
            <div key={movement.id}>
              <div
                className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3"
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
                    {getMovementDisplayNote(movement)}
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
                {canEdit ? (
                  <Button
                    type="button"
                    variant={isEditing ? "secondary" : "ghost"}
                    size="icon"
                    className="size-8 rounded-sm"
                    aria-label={`Editar ${getMovementDisplayNote(movement)}`}
                    onClick={() =>
                      setEditingMovementId((currentId) =>
                        currentId === movement.id ? null : movement.id,
                      )
                    }
                  >
                    <Pencil data-icon="inline-start" />
                  </Button>
                ) : (
                  <span className="size-8" />
                )}
              </div>
              {isEditing ? (
                <MovementEditForm
                  investorSlug={investor.slug}
                  movement={movement}
                  onCancel={() => setEditingMovementId(null)}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
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
          <CardTitle className="min-w-0 truncate text-base font-semibold uppercase">
            {getInvestorFullName(investor)}
          </CardTitle>
          <InvestorStatusPill status={investor.status} />
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

        <MovementsSection investor={investor} />

        <section className="border-t px-5 py-4">
          <div className="flex items-center gap-3">
            <CalendarDays className="size-5 text-muted-foreground" />
            <div>
              <h2 className="text-sm font-semibold uppercase text-card-foreground">
                Datos base
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Inicio {formatFullDate(investor.startDate)}
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
