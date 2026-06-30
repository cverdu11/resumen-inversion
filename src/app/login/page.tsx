import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LockKeyhole, Mail } from "lucide-react";

import { login } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Acceso trader | Resumen de Inversión",
  description: "Acceso privado al panel trader",
};

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
  }>;
};

const inputClassName =
  "h-11 w-full rounded-md border bg-background/45 px-3 text-sm text-card-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-[3px] focus:ring-ring/30";

function getErrorMessage(error?: string) {
  if (error === "missing") {
    return "Introduce email y contraseña.";
  }

  if (error === "unauthorized") {
    return "Tu usuario no tiene acceso al panel trader.";
  }

  if (error === "invalid") {
    return "Email o contraseña incorrectos.";
  }

  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: isTrader } = await supabase.rpc("is_trader");

    if (isTrader) {
      redirect(params?.next?.startsWith("/") ? params.next : "/admin");
    }
  }

  const errorMessage = getErrorMessage(params?.error);
  const next = params?.next?.startsWith("/") ? params.next : "/admin";

  return (
    <main className="dashboard-grid flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md overflow-hidden">
        <CardHeader className="border-b p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-full border bg-positive-soft text-positive">
              <LockKeyhole className="size-5" strokeWidth={1.9} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold uppercase">
                Acceso trader
              </CardTitle>
              <CardDescription className="mt-1">
                Panel privado de gestión semanal
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {errorMessage ? (
            <div className="mb-4 rounded-md border border-danger/35 bg-danger-soft px-3 py-2 text-sm text-danger">
              {errorMessage}
            </div>
          ) : null}

          <form action={login} className="flex flex-col gap-4">
            <input type="hidden" name="next" value={next} />
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Email
              </span>
              <span className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className={`${inputClassName} pl-10`}
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="trader@email.com"
                  required
                />
              </span>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Contraseña
              </span>
              <input
                className={inputClassName}
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <Button type="submit" className="mt-1">
              Entrar al panel
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
