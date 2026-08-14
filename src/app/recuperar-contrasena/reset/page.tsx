import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { resetInvestorPassword } from "../actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Nueva contraseña | Oro Negro",
  description: "Elige una nueva contraseña para tu acceso de inversor",
};

type ResetPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

const errorCopy: Record<string, string> = {
  mismatch: "Las contraseñas no coinciden.",
  missing: "Completa los dos campos.",
  update: "No se pudo actualizar la contraseña. Inténtalo de nuevo.",
  weak: "La contraseña debe tener al menos 10 caracteres.",
};

export default async function ResetPasswordPage({ searchParams }: ResetPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/recuperar-contrasena?error=invalid_link");
  }

  const params = await searchParams;
  const error = params?.error ? errorCopy[params.error] : undefined;

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f5ef] px-6 py-10 text-[#171b25]">
      <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-[0_18px_42px_rgba(23,27,37,0.1)] sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#777a85]">
          Oro Negro
        </p>
        <h1 className="mt-3 text-3xl font-black">Elige tu contraseña</h1>
        <p className="mt-3 text-sm leading-6 text-[#6f7280]">
          Usa una contraseña de al menos 10 caracteres. Al guardarla tendrás que iniciar sesión de nuevo.
        </p>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-900/10 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {error}
          </div>
        ) : null}

        <form action={resetInvestorPassword} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-[#555966]">
            Nueva contraseña
            <input
              className="h-11 rounded-full border border-[#171b25]/10 px-4 text-sm outline-none focus:border-[#171b25]/40"
              minLength={10}
              name="password"
              required
              type="password"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-[#555966]">
            Repite la contraseña
            <input
              className="h-11 rounded-full border border-[#171b25]/10 px-4 text-sm outline-none focus:border-[#171b25]/40"
              minLength={10}
              name="confirm_password"
              required
              type="password"
            />
          </label>
          <button
            className="h-12 rounded-full bg-[#171b25] px-5 text-sm font-black uppercase tracking-[0.08em] text-white"
            type="submit"
          >
            Guardar contraseña
          </button>
        </form>
      </section>
    </main>
  );
}
