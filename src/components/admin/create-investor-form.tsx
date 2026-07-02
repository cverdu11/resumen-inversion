"use client";

import { X } from "lucide-react";
import { useFormStatus } from "react-dom";

import { createInvestor } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

const inputClassName =
  "h-9 w-full rounded-md border bg-background/45 px-3 text-sm text-card-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-[3px] focus:ring-ring/30";

const labelClassName =
  "text-xs font-semibold uppercase text-muted-foreground";

function CreateInvestorSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Creando..." : "Crear inversor"}
    </Button>
  );
}

export function CreateInvestorForm({
  onCancel,
}: {
  onCancel: () => void;
}) {
  return (
    <form
      action={createInvestor}
      className="border-t bg-background/18 px-4 py-4 sm:px-5"
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

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
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
          <span className={labelClassName}>Email inversor</span>
          <input
            className={inputClassName}
            name="email"
            type="email"
            inputMode="email"
            placeholder="inversor@email.com"
          />
        </label>
        <label className="grid gap-1.5">
          <span className={labelClassName}>Fecha inicio</span>
          <input
            className={inputClassName}
            lang="es-ES"
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
        <CreateInvestorSubmitButton />
      </div>
    </form>
  );
}
