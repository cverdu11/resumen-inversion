import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Confirmar acceso | Oro Negro",
  description: "Confirma el acceso seguro al panel inversor de Oro Negro",
};

const resetPath = "/recuperar-contrasena/reset";

type ConfirmPageProps = {
  searchParams?: Promise<{ next?: string; token_hash?: string; type?: string }>;
};

function getOtpType(value?: string): "invite" | "recovery" | null {
  return value === "invite" || value === "recovery" ? value : null;
}

export default async function ConfirmRecoveryPage({
  searchParams,
}: ConfirmPageProps) {
  const params = await searchParams;
  const next = params?.next === resetPath ? params.next : null;
  const tokenHash = params?.token_hash;
  const type = getOtpType(params?.type);

  if (!next || !tokenHash || !type) {
    redirect("/recuperar-contrasena?error=invalid_link");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f5ef] px-6 py-10 text-[#171b25]">
      <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-[0_18px_42px_rgba(23,27,37,0.1)] sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#777a85]">
          Oro Negro
        </p>
        <h1 className="mt-3 text-3xl font-black">Confirma tu acceso</h1>
        <p className="mt-3 text-sm leading-6 text-[#6f7280]">
          Pulsa continuar para abrir de forma segura el formulario donde elegirás tu contraseña.
        </p>
        <form action="/auth/confirm" className="mt-6" method="post">
          <input name="token_hash" type="hidden" value={tokenHash} />
          <input name="type" type="hidden" value={type} />
          <input name="next" type="hidden" value={next} />
          <button
            className="h-12 w-full rounded-full bg-[#171b25] px-5 text-sm font-black uppercase tracking-[0.08em] text-white"
            type="submit"
          >
            Continuar
          </button>
        </form>
      </section>
    </main>
  );
}
