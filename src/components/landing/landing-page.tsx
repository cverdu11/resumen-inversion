import type { LucideIcon } from "lucide-react";
import { LockKeyhole, Mail, UserRound } from "lucide-react";

import { LiveOilQuoteCard } from "@/components/landing/live-oil-quote-card";
import { OilDropIcon } from "@/components/landing/oil-drop-icon";

type LoginRole = "trader" | "investor";

function getSelectedRole(role?: string): LoginRole {
  return role === "investor" ? "investor" : "trader";
}

function getLoginMessage(error?: string, status?: string) {
  if (status === "signed_out") {
    return {
      tone: "success" as const,
      text: "Sesion cerrada correctamente.",
    };
  }

  if (error === "missing") {
    return {
      tone: "error" as const,
      text: "Introduce usuario y contraseña.",
    };
  }

  if (error === "invalid") {
    return {
      tone: "error" as const,
      text: "Usuario o contraseña incorrectos.",
    };
  }

  if (error === "unauthorized_trader") {
    return {
      tone: "error" as const,
      text: "Este usuario no tiene acceso al panel trader.",
    };
  }

  if (error === "unauthorized_investor") {
    return {
      tone: "error" as const,
      text: "Este usuario no esta vinculado a ningun inversor.",
    };
  }

  if (error === "session_required") {
    return {
      tone: "error" as const,
      text: "Inicia sesion para acceder al panel seleccionado.",
    };
  }

  if (error === "server") {
    return {
      tone: "error" as const,
      text: "No se pudo validar el acceso. Intentalo de nuevo.",
    };
  }

  return null;
}

function AbstractField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-20 top-12 h-[520px] w-[560px] rounded-full bg-[#d9d0b8]/24 blur-3xl" />
      <div className="absolute left-[24%] top-[-16%] h-[680px] w-[340px] rotate-[31deg] rounded-full bg-[#f3ead2]/60 blur-2xl" />
      <div className="absolute bottom-[-24%] right-[-8%] h-[520px] w-[520px] rounded-full bg-[#0f172a]/58 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.17),transparent_25%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_48%)]" />
    </div>
  );
}

function LoginField({
  icon: Icon,
  label,
  name,
  type = "text",
}: {
  icon: LucideIcon;
  label: string;
  name: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#6f7280]">
        {label}
      </span>
      <span className="flex h-11 items-center gap-3 rounded-full border border-[#171b25]/10 bg-white px-4 text-[#171b25] shadow-[0_10px_24px_rgba(23,27,37,0.05)]">
        <Icon className="size-4 shrink-0" strokeWidth={1.9} />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none selection:bg-transparent selection:text-[#171b25] placeholder:text-[#8b8d97]"
          name={name}
          type={type}
          aria-label={label}
          required
        />
      </span>
    </label>
  );
}

function AccessChoice({
  label,
  value,
  defaultChecked,
}: {
  label: string;
  value: LoginRole;
  defaultChecked?: boolean;
}) {
  return (
    <label className="group relative flex h-10 cursor-pointer items-center justify-center rounded-full px-4 text-sm font-bold text-[#555966] transition-colors has-[:checked]:bg-[#171b25] has-[:checked]:text-white has-[:checked]:shadow-[0_14px_28px_rgba(23,27,37,0.18)] hover:bg-white/70 hover:text-[#171b25]">
      <input
        className="sr-only"
        type="radio"
        name="role"
        value={value}
        defaultChecked={defaultChecked}
      />
      {label}
    </label>
  );
}

export function LandingPage({
  loginError,
  loginStatus,
  role,
}: {
  loginError?: string;
  loginStatus?: string;
  role?: string;
}) {
  const selectedRole = getSelectedRole(role);
  const message = getLoginMessage(loginError, loginStatus);

  return (
    <main className="min-h-screen bg-[#020617] text-[#171b25]">
      <section className="relative grid min-h-screen w-full overflow-hidden bg-[#050914] lg:grid-cols-[minmax(390px,31vw)_minmax(0,1fr)]">
        <aside className="relative z-10 flex flex-col bg-[#f7f5ef] px-7 py-7 sm:px-10 sm:py-9">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-white shadow-[0_10px_28px_rgba(23,27,37,0.08)]">
              <OilDropIcon className="size-6 text-black" />
            </span>
            <div>
              <p className="text-sm font-extrabold leading-tight">Oro Negro</p>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#777a85]">
                CL1!
              </p>
            </div>
          </div>

          <form
            action="/auth/login"
            className="mt-14 flex flex-1 flex-col justify-center"
            method="post"
          >
            <div className="mx-auto grid size-20 place-items-center rounded-full border border-[#171b25]/10 bg-white shadow-[0_18px_34px_rgba(23,27,37,0.08)]">
              <UserRound className="size-10" strokeWidth={1.7} />
            </div>

            <h1 className="mt-9 text-center text-3xl font-black tracking-normal">
              Acceso privado
            </h1>
            <p className="mx-auto mt-3 max-w-[260px] text-center text-sm leading-6 text-[#6f7280]">
              Selecciona el panel y entra con tus credenciales.
            </p>

            <div className="mt-8 grid grid-cols-2 rounded-full bg-[#e7e3da] p-1">
              <AccessChoice
                label="Trader"
                value="trader"
                defaultChecked={selectedRole === "trader"}
              />
              <AccessChoice
                label="Inversor"
                value="investor"
                defaultChecked={selectedRole === "investor"}
              />
            </div>

            {message ? (
              <div
                className={
                  message.tone === "success"
                    ? "mt-5 rounded-2xl border border-emerald-900/10 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
                    : "mt-5 rounded-2xl border border-red-900/10 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
                }
              >
                {message.text}
              </div>
            ) : null}

            <div className="mt-7 flex flex-col gap-4">
              <LoginField icon={Mail} label="Usuario" name="email" />
              <LoginField
                icon={LockKeyhole}
                label="Contraseña"
                name="password"
                type="password"
              />
            </div>

            <button
              className="mt-8 flex h-12 cursor-pointer items-center justify-center rounded-full bg-[#171b25] px-5 text-sm font-black uppercase tracking-[0.1em] text-white shadow-[0_18px_34px_rgba(23,27,37,0.22)] transition-transform hover:-translate-y-0.5"
              type="submit"
            >
              Login
            </button>
          </form>
        </aside>

        <section className="relative flex min-h-screen items-center overflow-hidden px-8 py-10 text-white sm:px-12 lg:px-16 xl:px-20">
          <AbstractField />

          <div className="relative z-10 w-full max-w-[720px] lg:-translate-y-12">
            <LiveOilQuoteCard />

            <p className="mt-9 text-[4.2rem] font-black leading-[0.88] tracking-normal text-white sm:text-[5.6rem] lg:text-[6.2rem] xl:text-[6.7rem]">
              Welcome.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
