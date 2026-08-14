import type { Metadata } from "next";
import Link from "next/link";

import { requestPasswordReset } from "./actions";

export const metadata: Metadata = {
  title: "Recuperar contraseña | Oro Negro",
  description: "Recupera el acceso al panel inversor de Oro Negro",
};

type RecoveryPageProps = {
  searchParams?: Promise<{ error?: string; status?: string }>;
};

export default async function RecoveryPage({ searchParams }: RecoveryPageProps) {
  const params = await searchParams;
  const message =
    params?.status === "sent"
      ? {
          tone: "success",
          text: "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.",
        }
        : params?.error === "invalid_link"
          ? {
              tone: "error",
              text: "Este enlace ya se utilizó o ha caducado. Pide al trader que genere uno nuevo.",
            }
        : params?.error === "invalid_email"
          ? {
              tone: "error",
              text: "Introduce un correo electrónico válido.",
            }
          : null;

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f5ef] px-6 py-10 text-[#171b25]">
      <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-[0_18px_42px_rgba(23,27,37,0.1)] sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#777a85]">
          Oro Negro
        </p>
        <h1 className="mt-3 text-3xl font-black">Recupera tu acceso</h1>
        <p className="mt-3 text-sm leading-6 text-[#6f7280]">
          Introduce tu correo de inversor y te enviaremos un enlace para elegir una nueva contraseña.
        </p>

        {message ? (
          <div
            className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${
              message.tone === "success"
                ? "border-emerald-900/10 bg-emerald-50 text-emerald-800"
                : "border-red-900/10 bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <form action={requestPasswordReset} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-[#555966]">
            Correo electrónico
            <input
              className="h-11 rounded-full border border-[#171b25]/10 px-4 text-sm outline-none focus:border-[#171b25]/40"
              name="email"
              required
              type="email"
            />
          </label>
          <button
            className="h-12 rounded-full bg-[#171b25] px-5 text-sm font-black uppercase tracking-[0.08em] text-white"
            type="submit"
          >
            Enviar enlace
          </button>
        </form>
        <Link
          className="mt-6 block text-center text-sm font-semibold text-[#555966] underline underline-offset-4"
          href="/?role=investor"
        >
          Volver al inicio de sesión
        </Link>
      </section>
    </main>
  );
}
