"use client";

import type { FormEvent } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { InvestorStatus } from "@/lib/admin-mock-data";

export type CreateInvestorInput = {
  name: string;
  surname: string;
  startDate: string;
  initialContribution: number;
  status: InvestorStatus;
};

const inputClassName =
  "h-9 w-full rounded-md border bg-background/45 px-3 text-sm text-card-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-[3px] focus:ring-ring/30";

const labelClassName =
  "text-xs font-semibold uppercase text-muted-foreground";

function parseMoneyInput(value: string) {
  const compactValue = value.replace(/[\u20ac\s]/g, "").trim();

  if (!compactValue) {
    return Number.NaN;
  }

  const hasComma = compactValue.includes(",");
  const hasDot = compactValue.includes(".");

  if (hasComma && hasDot) {
    const decimalSeparator =
      compactValue.lastIndexOf(",") > compactValue.lastIndexOf(".")
        ? ","
        : ".";
    const thousandSeparator = decimalSeparator === "," ? "." : ",";

    return Number(
      compactValue
        .split(thousandSeparator)
        .join("")
        .replace(decimalSeparator, "."),
    );
  }

  if (hasComma || hasDot) {
    const separator = hasComma ? "," : ".";
    const parts = compactValue.split(separator);

    if (parts.length === 2 && parts[1].length > 0 && parts[1].length <= 2) {
      return Number(compactValue.replace(separator, "."));
    }

    return Number(parts.join(""));
  }

  return Number(compactValue);
}

export function CreateInvestorForm({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (input: CreateInvestorInput) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const surname = String(formData.get("surname") ?? "").trim();
    const initialContribution = parseMoneyInput(
      String(formData.get("initial_contribution") ?? ""),
    );

    if (
      !name ||
      !surname ||
      !Number.isFinite(initialContribution) ||
      initialContribution <= 0
    ) {
      return;
    }

    onCreate({
      name,
      surname,
      startDate: String(formData.get("start_date") ?? ""),
      initialContribution,
      status: String(formData.get("status") ?? "active") as InvestorStatus,
    });
  }

  return (
    <form
      className="border-t bg-background/18 px-4 py-4 sm:px-5"
      onSubmit={handleSubmit}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold uppercase text-card-foreground">
            Nuevo inversor
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Alta rápida para el panel trader
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Cerrar alta de inversor"
          onClick={onCancel}
        >
          <X />
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label className="grid gap-1.5">
          <span className={labelClassName}>Nombre</span>
          <input
            className={inputClassName}
            name="name"
            placeholder="Nombre"
            required
          />
        </label>
        <label className="grid gap-1.5">
          <span className={labelClassName}>Apellidos</span>
          <input
            className={inputClassName}
            name="surname"
            placeholder="Apellidos"
            required
          />
        </label>
        <label className="grid gap-1.5">
          <span className={labelClassName}>Fecha inicio</span>
          <input
            className={inputClassName}
            name="start_date"
            type="date"
            defaultValue="2026-06-30"
            required
          />
        </label>
        <label className="grid gap-1.5">
          <span className={labelClassName}>Aportación inicial</span>
          <input
            className={`${inputClassName} tabular-nums`}
            name="initial_contribution"
            type="text"
            inputMode="decimal"
            placeholder="20.000"
            required
          />
        </label>
        <label className="grid gap-1.5">
          <span className={labelClassName}>Estado</span>
          <select
            className={inputClassName}
            name="status"
            defaultValue="active"
          >
            <option value="active">Activo</option>
            <option value="pending">Pendiente</option>
            <option value="watch">Seguimiento</option>
            <option value="paused">Pausado</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm">
          Crear inversor
        </Button>
      </div>
    </form>
  );
}
