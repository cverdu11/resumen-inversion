"use client";

import { FormEvent, useState } from "react";
import { Check, Mail, Send } from "lucide-react";
import Link from "next/link";

import { requestPasswordRecovery } from "@/app/recuperar-contrasena/actions";
import { OilDropIcon } from "@/components/landing/oil-drop-icon";

export function PasswordRecoveryRequestForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("idle");
    setIsSubmitting(true);

    try {
      const result = await requestPasswordRecovery(
        new FormData(event.currentTarget),
      );

      setStatus(result.ok ? "success" : "error");
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#f7f5ef] px-5 py-8 text-[#171b25] sm:px-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md items-center justify-center">
        <section className="w-full rounded-[2rem] bg-white px-6 py-8 shadow-[0_24px_70px_rgba(23,27,37,0.14)] sm:px-10 sm:py-10">
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

          {status === "success" ? (
            <div className="mt-10 text-center">
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#ecfdf3] text-[#087443]">
                <Check className="size-8" strokeWidth={2.2} />
              </div>
              <h1 className="mt-6 text-3xl font-black">Revisa tu correo</h1>
              <p className="mt-3 text-sm leading-6 text-[#6f7280]">
                Si el correo está registrado, recibirás un enlace para elegir
                una nueva contraseña.
              </p>
              <Link
                className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#555966] underline decoration-[#555966]/35 underline-offset-4 transition-colors hover:text-[#171b25]"
                href="/?role=investor"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <div className="mt-9">
              <div className="grid size-14 place-items-center rounded-full bg-[#f7f5ef] text-[#171b25]">
                <Send className="size-7" strokeWidth={1.8} />
              </div>
              <h1 className="mt-6 text-3xl font-black">Recupera tu acceso</h1>
              <p className="mt-3 text-sm leading-6 text-[#6f7280]">
                Introduce tu correo de inversor y te enviaremos un enlace para
                elegir una nueva contraseña.
              </p>

              <form className="mt-7 flex flex-col gap-4" onSubmit={handleSubmit}>
                <label className="flex flex-col gap-2">
                  <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#6f7280]">
                    Correo electrónico
                  </span>
                  <span className="flex h-12 items-center gap-3 rounded-full border border-[#171b25]/10 bg-white px-4 text-[#171b25] shadow-[0_10px_24px_rgba(23,27,37,0.05)]">
                    <Mail className="size-4 shrink-0" strokeWidth={1.9} />
                    <input
                      className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[#8b8d97]"
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="inversor@email.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </span>
                </label>

                {status === "error" ? (
                  <p
                    className="rounded-2xl border border-red-900/10 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
                    role="alert"
                  >
                    No se pudo enviar el enlace ahora. Inténtalo de nuevo en
                    unos minutos.
                  </p>
                ) : null}

                <button
                  className="mt-1 flex h-12 items-center justify-center rounded-full bg-[#171b25] px-5 text-sm font-black uppercase tracking-[0.1em] text-white shadow-[0_18px_34px_rgba(23,27,37,0.22)] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enviando..." : "Enviar enlace"}
                </button>
              </form>

              <Link
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#555966] underline decoration-[#555966]/35 underline-offset-4 transition-colors hover:text-[#171b25]"
                href="/?role=investor"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
