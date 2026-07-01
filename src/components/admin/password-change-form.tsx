"use client";

import { AlertCircle, CheckCircle2, ChevronDown, KeyRound } from "lucide-react";

import { changeAdminPassword } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

const inputClassName =
  "h-10 w-full rounded-md border bg-background/45 px-3 text-sm text-card-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-[3px] focus:ring-ring/30";
const fieldClassName = "flex flex-col gap-1.5";

function getPasswordErrorMessage(error?: string) {
  if (error === "missing") {
    return "Completa todos los campos.";
  }

  if (error === "weak") {
    return "La nueva contraseña debe tener al menos 10 caracteres.";
  }

  if (error === "mismatch") {
    return "La nueva contraseña y la confirmación no coinciden.";
  }

  if (error === "same") {
    return "La nueva contraseña debe ser diferente a la actual.";
  }

  if (error === "current") {
    return "La contraseña actual no es correcta.";
  }

  if (error === "update") {
    return "No se pudo actualizar la contraseña. Inténtalo de nuevo.";
  }

  return null;
}

export function PasswordChangeForm({
  next,
  passwordError,
  passwordStatus,
}: {
  next: string;
  passwordError?: string;
  passwordStatus?: string;
}) {
  const errorMessage = getPasswordErrorMessage(passwordError);
  const successMessage =
    passwordStatus === "updated"
      ? "Contraseña actualizada correctamente."
      : null;

  return (
    <details
      className="group/password rounded-md"
      open={errorMessage || successMessage ? true : undefined}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-md px-3 text-sm font-medium text-card-foreground transition-colors hover:bg-secondary/70 hover:text-foreground [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
            <KeyRound className="size-4" strokeWidth={1.9} />
          </span>
          Cambiar contraseña
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform group-open/password:rotate-180"
          strokeWidth={1.9}
        />
      </summary>
      <form action={changeAdminPassword} className="flex flex-col gap-3 px-3 pb-3 pt-2">
        <input type="hidden" name="next" value={next} />
        {successMessage ? (
          <p className="flex items-start gap-2 rounded-md bg-positive-soft px-3 py-2 text-xs font-medium text-positive">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" strokeWidth={1.9} />
            {successMessage}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
            <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={1.9} />
            {errorMessage}
          </p>
        ) : null}
        <label className={fieldClassName}>
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Contraseña actual
          </span>
          <input
            className={inputClassName}
            name="current_password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <label className={fieldClassName}>
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Nueva contraseña
          </span>
          <input
            className={inputClassName}
            name="new_password"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
          />
        </label>
        <label className={fieldClassName}>
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Confirmar nueva contraseña
          </span>
          <input
            className={inputClassName}
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
          />
        </label>
        <Button className="mt-1 w-full" type="submit" size="sm">
          Guardar contraseña
        </Button>
      </form>
    </details>
  );
}
