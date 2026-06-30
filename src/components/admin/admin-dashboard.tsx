"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  Coins,
  Database,
  Percent,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import type { CreateInvestorInput } from "@/components/admin/create-investor-form";
import { InvestorDetailPreview } from "@/components/admin/investor-detail-preview";
import { InvestorTable } from "@/components/admin/investor-table";
import { PasswordChangeForm } from "@/components/admin/password-change-form";
import { WeeklyProfitabilityPanel } from "@/components/admin/weekly-profitability-panel";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getAdminOverview,
  mockInvestors,
  type MockInvestor,
  weeklyProfitability,
} from "@/lib/admin-mock-data";
import {
  formatMonthName,
  formatPercent,
  formatWholeCurrency,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";

type AdminTab = "panel" | "rentabilidad";

type StoredInvestorsPayload = {
  version: 1;
  investors: MockInvestor[];
};

const localInvestorsStorageKey = "resumen-inversion-admin-investors-v1";
const localInvestorsChangedEvent = "resumen-inversion-admin-investors-changed";
const emptyStoredInvestors: MockInvestor[] = [];

let storedInvestorsRawSnapshot: string | null = null;
let storedInvestorsSnapshot: MockInvestor[] = emptyStoredInvestors;

function isStoredInvestor(value: unknown): value is MockInvestor {
  if (!value || typeof value !== "object") {
    return false;
  }

  const investor = value as Partial<MockInvestor>;

  return Boolean(
    investor.id &&
      investor.name &&
      investor.surname &&
      investor.slug &&
      investor.startDate &&
      typeof investor.initialContribution === "number" &&
      typeof investor.currentBalance === "number",
  );
}

function readStoredInvestors() {
  if (typeof window === "undefined") {
    return emptyStoredInvestors;
  }

  try {
    const rawValue = window.localStorage.getItem(localInvestorsStorageKey);

    if (rawValue === storedInvestorsRawSnapshot) {
      return storedInvestorsSnapshot;
    }

    if (!rawValue) {
      storedInvestorsRawSnapshot = rawValue;
      storedInvestorsSnapshot = emptyStoredInvestors;

      return storedInvestorsSnapshot;
    }

    const payload = JSON.parse(rawValue) as Partial<StoredInvestorsPayload>;

    if (payload.version !== 1 || !Array.isArray(payload.investors)) {
      storedInvestorsRawSnapshot = rawValue;
      storedInvestorsSnapshot = emptyStoredInvestors;

      return storedInvestorsSnapshot;
    }

    storedInvestorsRawSnapshot = rawValue;
    storedInvestorsSnapshot = payload.investors.filter(isStoredInvestor);

    return storedInvestorsSnapshot;
  } catch {
    storedInvestorsRawSnapshot = null;
    storedInvestorsSnapshot = emptyStoredInvestors;

    return storedInvestorsSnapshot;
  }
}

function persistStoredInvestors(investors: MockInvestor[]) {
  const payload: StoredInvestorsPayload = {
    version: 1,
    investors,
  };

  const serializedPayload = JSON.stringify(payload);

  window.localStorage.setItem(localInvestorsStorageKey, serializedPayload);
  storedInvestorsRawSnapshot = serializedPayload;
  storedInvestorsSnapshot = investors;
  window.dispatchEvent(new Event(localInvestorsChangedEvent));
}

function subscribeStoredInvestors(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(localInvestorsChangedEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(localInvestorsChangedEvent, onStoreChange);
  };
}

function normalizeSlug(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "inversor"
  );
}

function getUniqueSlug(baseSlug: string, investors: MockInvestor[]) {
  const usedSlugs = new Set(investors.map((investor) => investor.slug));
  let slug = baseSlug;
  let suffix = 2;

  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function formatTimelineDate(date: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function buildCreatedInvestor(
  input: CreateInvestorInput,
  investors: MockInvestor[],
): MockInvestor {
  const baseSlug = normalizeSlug(`${input.name}-${input.surname}`);
  const slug = getUniqueSlug(baseSlug, investors);

  return {
    id: `inv-${slug}`,
    name: input.name,
    surname: input.surname,
    slug,
    startDate: input.startDate,
    initialContribution: input.initialContribution,
    additionalContributions: 0,
    withdrawals: 0,
    currentBalance: input.initialContribution,
    profit: 0,
    profitabilityPct: 0,
    status: input.status,
    movements: [
      {
        id: `mov-${slug}-initial`,
        date: input.startDate,
        type: "contribution",
        amount: input.initialContribution,
        note: "Aportación inicial",
      },
    ],
    timeline: [
      {
        id: `tl-${slug}-initial`,
        date: formatTimelineDate(input.startDate),
        label: "Alta de inversor",
        detail: "Capital inicial registrado",
      },
    ],
    monthlySummary: [
      {
        id: `${slug}-initial-month`,
        month: formatMonthName(input.startDate),
        balance: input.initialContribution,
        profit: 0,
        returnPct: 0,
      },
    ],
  };
}

export function AdminDashboard({
  activeTab,
  passwordError,
  passwordStatus,
  selectedInvestorSlug,
  userEmail,
}: {
  activeTab: AdminTab;
  passwordError?: string;
  passwordStatus?: string;
  selectedInvestorSlug?: string;
  userEmail?: string;
}) {
  const createdInvestors = useSyncExternalStore(
    subscribeStoredInvestors,
    readStoredInvestors,
    () => emptyStoredInvestors,
  );
  const investors = useMemo(
    () => [...mockInvestors, ...createdInvestors],
    [createdInvestors],
  );
  const overview = useMemo(() => getAdminOverview(investors), [investors]);
  const selectedInvestor =
    investors.find((investor) => investor.slug === selectedInvestorSlug) ??
    investors[0];
  const selectedInvestorId = selectedInvestor?.id ?? "";
  const selectedSlug =
    selectedInvestor?.slug ?? selectedInvestorSlug ?? investors[0]?.slug;
  const currentAdminPath = `/admin?tab=${activeTab}&investor=${selectedSlug}`;

  function handleCreateInvestor(input: CreateInvestorInput) {
    const newInvestor = buildCreatedInvestor(input, investors);
    const nextInvestors = [...createdInvestors, newInvestor];

    persistStoredInvestors(nextInvestors);
    window.location.assign(`/admin?tab=panel&investor=${newInvestor.slug}`);
  }

  const kpis = [
    {
      label: "Total inversores",
      value: String(overview.totalInvestors),
      helper: "Perfiles gestionados",
      icon: UsersRound,
      tone: "neutral" as const,
    },
    {
      label: "Capital total invertido",
      value: formatWholeCurrency(overview.totalCapitalInvested),
      helper: "Capital neto aportado",
      icon: Database,
      tone: "neutral" as const,
    },
    {
      label: "Beneficio total",
      value: formatWholeCurrency(overview.totalProfit, { sign: true }),
      helper: "Beneficio agregado",
      icon: Coins,
      tone:
        overview.totalProfit >= 0
          ? ("positive" as const)
          : ("negative" as const),
    },
    {
      label: "Rentabilidad media",
      value: formatPercent(overview.averageProfitability, { sign: true }),
      helper: "Media simple por inversor",
      icon: BarChart3,
      tone:
        overview.averageProfitability >= 0
          ? ("positive" as const)
          : ("negative" as const),
    },
    {
      label: "Rentabilidad semana actual",
      value: formatPercent(overview.currentWeekProfitability, { sign: true }),
      helper: "Semana en borrador",
      icon: TrendingUp,
      tone:
        overview.currentWeekProfitability >= 0
          ? ("positive" as const)
          : ("negative" as const),
    },
  ];

  const tabs = [
    {
      href: `/admin?tab=panel&investor=${selectedSlug}`,
      label: "Panel trader",
      value: "panel",
      icon: UsersRound,
    },
    {
      href: `/admin?tab=rentabilidad&investor=${selectedSlug}`,
      label: "% Rentabilidad semanal",
      value: "rentabilidad",
      icon: TrendingUp,
    },
  ] as const;

  return (
    <main className="dashboard-grid min-h-screen px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex max-w-[1780px] flex-col gap-4 sm:gap-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl">
              Panel trader
            </h1>
            <p className="mt-2 text-sm text-card-foreground/84 sm:text-lg">
              Gestión de inversores y rentabilidad semanal
            </p>
          </div>
          <Card className="w-full max-w-md border-border lg:w-auto">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center gap-4">
                <div className="grid size-5 shrink-0 place-items-center text-muted-foreground">
                  <CalendarDays className="size-5" strokeWidth={1.9} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">
                    Sesión trader
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-card-foreground">
                    {userEmail ?? "Usuario autenticado"}
                  </p>
                </div>
                <form action="/auth/signout" method="post">
                  <Button variant="ghost" size="sm" type="submit">
                    Salir
                  </Button>
                </form>
              </div>
              <PasswordChangeForm
                next={currentAdminPath}
                passwordError={passwordError}
                passwordStatus={passwordStatus}
              />
            </CardContent>
          </Card>
        </header>

        <nav aria-label="Secciones del panel trader">
          <div className="no-scrollbar overflow-x-auto">
            <div className="inline-flex min-w-full gap-2 rounded-lg border bg-background/30 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:min-w-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.value;

                return (
                  <Link
                    key={tab.value}
                    href={tab.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors sm:flex-none",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-[0_0_24px_rgba(34,197,94,0.2)]"
                        : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" strokeWidth={1.9} />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {activeTab === "panel" ? (
          <>
            <section className="grid gap-3 min-[380px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {kpis.map((kpi) => (
                <KpiCard key={kpi.label} {...kpi} />
              ))}
            </section>

            <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_460px]">
              <InvestorTable
                investors={investors}
                onCreateInvestor={handleCreateInvestor}
                selectedInvestorId={selectedInvestorId}
              />
              {selectedInvestor ? (
                <InvestorDetailPreview
                  key={selectedInvestor.id}
                  investor={selectedInvestor}
                />
              ) : null}
            </section>
          </>
        ) : (
          <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_460px]">
            <WeeklyProfitabilityPanel weeks={weeklyProfitability} />
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="border-b px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Percent className="size-5 text-muted-foreground" />
                    <div>
                      <h2 className="text-sm font-semibold uppercase text-card-foreground">
                        Estructura preparada
                      </h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Rutas, cálculos y acceso quedan para la siguiente fase
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 border-b">
                  <div className="border-r px-5 py-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Ruta admin
                    </p>
                    <p className="mt-2 text-sm font-semibold text-card-foreground">
                      /admin
                    </p>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Ruta inversor
                    </p>
                    <p className="mt-2 text-sm font-semibold text-card-foreground">
                      /investor/[slug]
                    </p>
                  </div>
                </div>
                <div className="flex flex-col">
                  {[
                    "Autenticación trader/admin",
                    "Base de datos de inversores",
                    "Motor de rentabilidad semanal",
                    "Enlaces protegidos o sesiones de inversor",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between gap-4 border-b px-5 py-3 last:border-b-0"
                    >
                      <span className="text-sm text-card-foreground/88">
                        {item}
                      </span>
                      <span className="rounded-md border bg-background/35 px-2 py-1 text-[0.68rem] font-semibold uppercase text-muted-foreground">
                        Próximo
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </main>
  );
}
