"use client";

import { KeyRound } from "lucide-react";

import { changeAdminPassword } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

const inputClassName =
  "h-9 w-full rounded-md border bg-background/45 px-3 text-sm text-card-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-[3px] focus:ring-ring/30";

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
      className="group border-t pt-3"
      open={errorMessage || successMessage ? true : undefined}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-1.5 text-sm font-semibold text-card-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-2">
          <KeyRound className="size-4 shrink-0 text-muted-foreground" />
          Cambiar contraseña
        </span>
        <span className="text-lg leading-none text-muted-foreground group-open:rotate-45">
          +
        </span>
      </summary>
      <form action={changeAdminPassword} className="mt-3 grid gap-3">
        <input type="hidden" name="next" value={next} />
        {successMessage ? (
          <p className="text-sm font-medium text-positive">{successMessage}</p>
        ) : null}
        {errorMessage ? (
          <p className="text-sm font-medium text-danger">{errorMessage}</p>
        ) : null}
        <label className="grid gap-1.5">
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
        <label className="grid gap-1.5">
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
        <label className="grid gap-1.5">
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
        <Button type="submit" size="sm">
          Guardar contraseña
        </Button>
      </form>
    </details>
  );
}
