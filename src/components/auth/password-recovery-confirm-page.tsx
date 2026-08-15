"use client";

import { useState } from "react";
import { KeyRound, LoaderCircle } from "lucide-react";
import Link from "next/link";

import { BackToLogin, RecoveryShell } from "@/components/auth/recovery-shell";
import { createClient } from "@/lib/supabase/client";

type ConfirmState = "checking" | "ready" | "confirming" | "invalid";

type PasswordRecoveryConfirmPageProps = {
  tokenHash: string | null;
  isRecovery: boolean;
};

const INVALID_LINK_MESSAGE =
  "El enlace de recuperación no es válido o ha caducado. Solicita uno nuevo.";

export function PasswordRecoveryConfirmPage({
  tokenHash,
  isRecovery,
}: PasswordRecoveryConfirmPageProps) {
  const isValidLink = Boolean(tokenHash && isRecovery);
  const [confirmState, setConfirmState] = useState<ConfirmState>(
    isValidLink ? "ready" : "invalid",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(
    isValidLink ? null : INVALID_LINK_MESSAGE,
  );

  async function handleConfirm() {
    if (!tokenHash) {
      setErrorMessage(INVALID_LINK_MESSAGE);
      setConfirmState("invalid");
      return;
    }

    setErrorMessage(null);
    setConfirmState("confirming");

    try {
      const supabase = createClient({
        auth: { detectSessionInUrl: false },
        isSingleton: false,
      });
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      });

      if (error || !data.session) {
        throw new Error("Recovery token could not be verified.");
      }

      window.location.assign("/?recovery=ready");
    } catch {
      setErrorMessage(INVALID_LINK_MESSAGE);
      setConfirmState("invalid");
    }
  }

  if (confirmState === "checking" || confirmState === "confirming") {
    return (
      <RecoveryShell>
        <div className="mt-10 text-center">
          <LoaderCircle className="mx-auto size-9 animate-spin text-[#171b25]" />
          <h1 className="mt-6 text-2xl font-black">
            {confirmState === "confirming"
              ? "Validando tu enlace"
              : "Preparando tu recuperación"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#6f7280]">
            {confirmState === "confirming"
              ? "Un momento, estamos comprobando el enlace."
              : "Un momento, estamos preparando el cambio de contraseña."}
          </p>
        </div>
      </RecoveryShell>
    );
  }

  if (confirmState === "invalid") {
    return (
      <RecoveryShell>
        <div className="mt-9 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#fff1f1] text-[#b42318]">
            <KeyRound className="size-8" strokeWidth={1.8} />
          </div>
          <h1 className="mt-6 text-3xl font-black">Enlace no válido</h1>
          <p className="mt-3 text-sm leading-6 text-[#6f7280]">
            {errorMessage}
          </p>
          <Link
            className="mt-7 flex h-12 items-center justify-center rounded-full bg-[#171b25] px-5 text-sm font-black uppercase tracking-[0.1em] text-white shadow-[0_18px_34px_rgba(23,27,37,0.22)] transition-transform hover:-translate-y-0.5"
            href="/recuperar-contrasena"
          >
            Solicitar otro enlace
          </Link>
          <BackToLogin />
        </div>
      </RecoveryShell>
    );
  }

  return (
    <RecoveryShell>
      <div className="mt-9 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#f7f5ef] text-[#171b25]">
          <KeyRound className="size-8" strokeWidth={1.8} />
        </div>
        <h1 className="mt-6 text-3xl font-black">Confirma tu recuperación</h1>
        <p className="mt-3 text-sm leading-6 text-[#6f7280]">
          Pulsa el botón para continuar y elegir una nueva contraseña.
        </p>
        <button
          className="mt-7 flex h-12 w-full items-center justify-center rounded-full bg-[#171b25] px-5 text-sm font-black uppercase tracking-[0.1em] text-white shadow-[0_18px_34px_rgba(23,27,37,0.22)] transition-transform hover:-translate-y-0.5"
          type="button"
          onClick={handleConfirm}
        >
          Continuar
        </button>
        <BackToLogin />
      </div>
    </RecoveryShell>
  );
}
