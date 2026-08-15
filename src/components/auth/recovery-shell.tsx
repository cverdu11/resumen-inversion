import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { OilDropIcon } from "@/components/landing/oil-drop-icon";

export function RecoveryShell({ children }: { children: ReactNode }) {
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

export function BackToLogin() {
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
