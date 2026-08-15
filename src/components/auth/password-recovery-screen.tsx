"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, KeyRound, LoaderCircle, LockKeyhole } from "lucide-react";
import Link from "next/link";

import { OilDropIcon } from "@/components/landing/oil-drop-icon";
import { createClient } from "@/lib/supabase/client";

type RecoveryState = "idle" | "loading" | "ready" | "invalid" | "updated";

type RecoveryUrlParams = {
  accessToken: string | null;
  refreshToken: string | null;
  code: string | null;
  isRecovery: boolean;
};

function readRecoveryUrlParams(): RecoveryUrlParams {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);
  const type = hashParams.get("type") ?? searchParams.get("type");
  const code = searchParams.get("code");

  return {
    accessToken: hashParams.get("access_token") ?? searchParams.get("access_token"),
    refreshToken:
      hashParams.get("refresh_token") ?? searchParams.get("refresh_token"),
    code,
    isRecovery: type === "recovery" || Boolean(code),
  };
}

function clearRecoveryUrl() {
  const url = new URL(window.location.href);

  url.hash = "";
  for (const key of [
    "access_token",
    "refresh_token",
    "expires_at",
    "expires_in",
    "token_type",
    "type",
    "code",
    "error",
    "error_code",
    "error_description",
  ]) {
    url.searchParams.delete(key);
  }

  window.history.replaceState(null, document.title, `${url.pathname}${url.search}`);
}

function RecoveryShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="fixed inset-0 z-[100] overflow-y-auto bg-[#f7f5ef] text-[#171b25]">
      <div className="flex min-h-[100dvh] items-center justify-center px-5 py-8 sm:px-8 sm:py-12">
        <section className="w-full max-w-md rounded-[2rem] bg-white px-6 py-8 shadow-[0_24px_70px_rgba(23,27,37,0.14)] sm:px-10 sm:py-10">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#f7f5ef] shadow-[0_10px_28px_rgba(23,27,37,0.08)]">
              <OilDropIcon className="size-6 text-black" />
            </span>
            <div>
              <p className="text-sm font-extrabold leading-tight">Oro Negro</p>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#777a85]">
                CL1!
              </p>
            </div>
          </div>

          {children}
        </section>
      </div>
    </main>
  );
}

function BackToLogin() {
  return (
    <Link
      className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#555966] underline decoration-[#555966]/35 underline-offset-4 transition-colors hover:text-[#171b25]"
      href="/?role=investor"
    >
      <ArrowLeft className="size-4" strokeWidth={1.8} />
      Volver al inicio de sesión
    </Link>
  );
}

export function PasswordRecoveryScreen() {
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("idle");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const clientRef = useRef<ReturnType<typeof createClient> | null>(null);

  useEffect(() => {
    const params = readRecoveryUrlParams();

    if (!params.isRecovery) {
      return;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const markReady = () => {
      if (!cancelled) {
        setFormError(null);
        setRecoveryState("ready");
      }
    };

    const initializeRecovery = async () => {
      setRecoveryState("loading");
      clearRecoveryUrl();

      try {
        const supabase = createClient({
          auth: { detectSessionInUrl: false },
          isSingleton: false,
        });
        clientRef.current = supabase;

        const { data: authListener } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (event === "PASSWORD_RECOVERY" && session) {
              markReady();
            }
          },
        );
        unsubscribe = () => authListener.subscription.unsubscribe();

        if (params.code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(
            params.code,
          );

          if (error || !data.session) {
            throw new Error("Recovery code could not be exchanged.");
          }
        } else if (params.accessToken && params.refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: params.accessToken,
            refresh_token: params.refreshToken,
          });

          if (error || !data.session) {
            throw new Error("Recovery session could not be established.");
          }
        } else {
          throw new Error("Recovery link is missing its session.");
        }

        markReady();
      } catch {
        if (!cancelled) {
          setFormError(
            "El enlace de recuperación no es válido o ha caducado. Solicita uno nuevo.",
          );
          setRecoveryState("invalid");
        }
      }
    };

    void initializeRecovery();

    return () => {
      cancelled = true;
      unsubscribe?.();
      clientRef.current = null;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (password.length < 8) {
      setFormError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmation) {
      setFormError("Las contraseñas no coinciden.");
      return;
    }

    const supabase = clientRef.current;

    if (!supabase) {
      setFormError("El enlace de recuperación no está listo. Solicita uno nuevo.");
      setRecoveryState("invalid");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setFormError(
          "No se pudo actualizar la contraseña. Solicita un enlace nuevo e inténtalo otra vez.",
        );
        return;
      }

      await supabase.auth.signOut();
      setPassword("");
      setConfirmation("");
      setRecoveryState("updated");
    } catch {
      setFormError(
        "No se pudo actualizar la contraseña. Solicita un enlace nuevo e inténtalo otra vez.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (recoveryState === "idle") {
    return null;
  }

  if (recoveryState === "loading") {
    return (
      <RecoveryShell>
        <div className="mt-10 text-center">
          <LoaderCircle className="mx-auto size-9 animate-spin text-[#171b25]" />
          <h1 className="mt-6 text-2xl font-black">Validando tu enlace</h1>
          <p className="mt-2 text-sm leading-6 text-[#6f7280]">
            Un momento, estamos preparando el cambio de contraseña.
          </p>
        </div>
      </RecoveryShell>
    );
  }

  if (recoveryState === "invalid") {
    return (
      <RecoveryShell>
        <div className="mt-9 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#fff1f1] text-[#b42318]">
            <KeyRound className="size-8" strokeWidth={1.8} />
          </div>
          <h1 className="mt-6 text-3xl font-black">Enlace no válido</h1>
          <p className="mt-3 text-sm leading-6 text-[#6f7280]">
            {formError ??
              "El enlace de recuperación no es válido o ha caducado. Solicita uno nuevo."}
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

  if (recoveryState === "updated") {
    return (
      <RecoveryShell>
        <div className="mt-9 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#ecfdf3] text-[#087443]">
            <Check className="size-8" strokeWidth={2.2} />
          </div>
          <h1 className="mt-6 text-3xl font-black">Contraseña actualizada</h1>
          <p className="mt-3 text-sm leading-6 text-[#6f7280]">
            Ya puedes entrar con tu nueva contraseña.
          </p>
          <button
            className="mt-7 flex h-12 items-center justify-center rounded-full bg-[#171b25] px-5 text-sm font-black uppercase tracking-[0.1em] text-white shadow-[0_18px_34px_rgba(23,27,37,0.22)] transition-transform hover:-translate-y-0.5"
            type="button"
            onClick={() =>
              window.location.assign("/?role=investor&login_status=password_reset")
            }
          >
            Ir al inicio de sesión
          </button>
        </div>
      </RecoveryShell>
    );
  }

  return (
    <RecoveryShell>
      <div className="mt-9">
        <div className="grid size-14 place-items-center rounded-full bg-[#f7f5ef] text-[#171b25]">
          <LockKeyhole className="size-7" strokeWidth={1.8} />
        </div>
        <h1 className="mt-6 text-3xl font-black">Crea tu nueva contraseña</h1>
        <p className="mt-3 text-sm leading-6 text-[#6f7280]">
          Elige una contraseña nueva para volver a acceder a tu panel.
        </p>

        <form className="mt-7 flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2">
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#6f7280]">
              Nueva contraseña
            </span>
            <input
              className="h-12 rounded-full border border-[#171b25]/10 bg-white px-4 text-sm font-semibold text-[#171b25] shadow-[0_10px_24px_rgba(23,27,37,0.05)] outline-none focus:border-[#171b25]/35 focus:ring-4 focus:ring-[#171b25]/5"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#6f7280]">
              Repite la contraseña
            </span>
            <input
              className="h-12 rounded-full border border-[#171b25]/10 bg-white px-4 text-sm font-semibold text-[#171b25] shadow-[0_10px_24px_rgba(23,27,37,0.05)] outline-none focus:border-[#171b25]/35 focus:ring-4 focus:ring-[#171b25]/5"
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              required
            />
          </label>

          {formError ? (
            <p
              className="rounded-2xl border border-red-900/10 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
              role="alert"
            >
              {formError}
            </p>
          ) : null}

          <button
            className="mt-1 flex h-12 items-center justify-center rounded-full bg-[#171b25] px-5 text-sm font-black uppercase tracking-[0.1em] text-white shadow-[0_18px_34px_rgba(23,27,37,0.22)] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>
        <BackToLogin />
      </div>
    </RecoveryShell>
  );
}
