import type { LucideIcon } from "lucide-react";
import { Eye, LockKeyhole, Mail, UserRound } from "lucide-react";

import { loginFromLanding } from "@/app/login/actions";

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
      text: "Inicia sesion para acceder al panel inversor.",
    };
  }

  return null;
}

function OilDropIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M32 5.75C25.08 16.22 16 27.25 16 38.02C16 48.06 23.2 56 32 56C40.8 56 48 48.06 48 38.02C48 27.25 38.92 16.22 32 5.75Z"
        fill="currentColor"
      />
      <path
        d="M23.7 38.7C23.7 44.1 27.18 48.1 32.12 49.18"
        stroke="rgba(255,255,255,0.58)"
        strokeLinecap="round"
        strokeWidth="4"
      />
    </svg>
  );
}

function AbstractField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-20 top-12 h-[520px] w-[560px] rounded-full bg-[#d9d0b8]/24 blur-3xl" />
      <div className="absolute left-[24%] top-[-16%] h-[680px] w-[340px] rotate-[31deg] rounded-full bg-[#f3ead2]/60 blur-2xl" />
      <div className="absolute bottom-[-24%] right-[-8%] h-[520px] w-[520px] rounded-full bg-[#53638f]/44 blur-3xl" />
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
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[#8b8d97]"
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

function QuoteCard() {
  return (
    <div className="w-full max-w-[470px] rounded-[28px] bg-white/10 px-6 py-5 text-white shadow-[0_26px_68px_rgba(0,0,0,0.16)] backdrop-blur-md">
      <div className="flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white shadow-[0_16px_34px_rgba(0,0,0,0.16)]">
          <OilDropIcon className="size-9 text-black" />
        </span>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.28em] text-white/78">
            Cotizacion crudo
          </p>
          <p className="mt-2 text-sm font-bold text-white">CL1! · USD/BLL</p>
        </div>
      </div>
      <div className="mt-6 flex items-end justify-between gap-5">
        <p className="text-6xl font-black leading-none text-white">67.76</p>
        <div
          className="mb-2 flex items-center gap-2 rounded-full bg-white/14 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/72"
          title="Pendiente de conectar a un proveedor de cotizacion en vivo"
        >
          <Eye className="size-4" strokeWidth={1.9} />
          Live
        </div>
      </div>
    </div>
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
    <main className="min-h-screen bg-[#263263] px-4 py-6 text-[#171b25] sm:px-6 lg:grid lg:place-items-center">
      <section className="relative mx-auto grid min-h-[660px] w-full max-w-[1180px] overflow-hidden rounded-[28px] bg-[#111832] shadow-[0_34px_90px_rgba(9,13,31,0.38)] lg:grid-cols-[370px_minmax(0,1fr)]">
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
            action={loginFromLanding}
            className="mt-14 flex flex-1 flex-col justify-center"
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
              className="mt-8 flex h-12 items-center justify-center rounded-full bg-[#171b25] px-5 text-sm font-black uppercase tracking-[0.1em] text-white shadow-[0_18px_34px_rgba(23,27,37,0.22)] transition-transform hover:-translate-y-0.5"
              type="submit"
            >
              Login
            </button>
          </form>
        </aside>

        <section className="relative min-h-[520px] overflow-hidden px-8 py-10 text-white sm:px-12 lg:px-16">
          <AbstractField />

          <div className="relative z-10 flex min-h-[580px] flex-col justify-center gap-10 lg:block">
            <div className="lg:absolute lg:left-0 lg:top-[175px]">
              <QuoteCard />
            </div>

            <div className="lg:absolute lg:left-0 lg:right-0 lg:top-[405px]">
              <p className="text-[4.4rem] font-black leading-[0.85] tracking-normal text-white sm:text-[6.2rem] lg:text-[6.9rem]">
                Welcome.
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
