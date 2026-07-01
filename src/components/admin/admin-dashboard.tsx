"use client";

import { useMemo } from "react";
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

import { InvestorDetailPreview } from "@/components/admin/investor-detail-preview";
import { InvestorTable } from "@/components/admin/investor-table";
import { PasswordChangeForm } from "@/components/admin/password-change-form";
import { WeeklyProfitabilityPanel } from "@/components/admin/weekly-profitability-panel";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getAdminOverview,
  type MockInvestor,
} from "@/lib/admin-mock-data";
import { formatPercent, formatWholeCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { WeeklyProfitabilityItem } from "@/lib/weekly-profitability";

type AdminTab = "panel" | "rentabilidad";

export function AdminDashboard({
  activeTab,
  databaseInvestors,
  investorError,
  passwordError,
  passwordStatus,
  selectedInvestorSlug,
  userEmail,
  weeklyError,
  weeklyProfitability,
  weeklyStatus,
}: {
  activeTab: AdminTab;
  databaseInvestors: MockInvestor[];
  investorError?: string;
  passwordError?: string;
  passwordStatus?: string;
  selectedInvestorSlug?: string;
  userEmail?: string;
  weeklyError?: string;
  weeklyProfitability: WeeklyProfitabilityItem[];
  weeklyStatus?: string;
}) {
  const investors = databaseInvestors;
  const currentWeekProfitability =
    weeklyProfitability.find((week) => week.isCurrent && week.isSaved)
      ?.returnPct ?? 0;
  const overview = useMemo(
    () => getAdminOverview(investors, currentWeekProfitability),
    [currentWeekProfitability, investors],
  );
  const selectedInvestor =
    investors.find((investor) => investor.slug === selectedInvestorSlug) ??
    investors[0];
  const selectedInvestorId = selectedInvestor?.id ?? "";
  const selectedSlug =
    selectedInvestor?.slug ?? selectedInvestorSlug ?? investors[0]?.slug;
  const selectedInvestorParam = selectedSlug ? `&investor=${selectedSlug}` : "";
  const currentAdminPath = `/admin?tab=${activeTab}${selectedInvestorParam}`;

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
      href: `/admin?tab=panel${selectedInvestorParam}`,
      label: "Panel trader",
      value: "panel",
      icon: UsersRound,
    },
    {
      href: `/admin?tab=rentabilidad${selectedInvestorParam}`,
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
                investorError={investorError}
                investors={investors}
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
            <WeeklyProfitabilityPanel
              next={currentAdminPath}
              weeklyError={weeklyError}
              weeklyStatus={weeklyStatus}
              weeks={weeklyProfitability}
            />
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
