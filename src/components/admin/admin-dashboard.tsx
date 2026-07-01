"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  BarChart3,
  ChevronDown,
  Coins,
  Database,
  LogOut,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import { InvestorDetailPreview } from "@/components/admin/investor-detail-preview";
import { InvestorTable } from "@/components/admin/investor-table";
import { PasswordChangeForm } from "@/components/admin/password-change-form";
import { WeeklyProfitabilityPanel } from "@/components/admin/weekly-profitability-panel";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Button } from "@/components/ui/button";
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
  openMonths,
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
  openMonths?: string;
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
  const selectedInvestor = investors.find(
    (investor) => investor.slug === selectedInvestorSlug,
  );
  const selectedInvestorId = selectedInvestor?.id ?? "";
  const traderEmail = userEmail ?? "Usuario autenticado";
  const traderInitial = traderEmail.trim().charAt(0).toUpperCase() || "T";
  const currentAdminPath =
    activeTab === "rentabilidad"
      ? "/admin?tab=rentabilidad"
      : selectedInvestor
        ? `/admin?investor=${selectedInvestor.slug}`
        : "/admin";

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
      label: "Rentabilidad total",
      value: formatPercent(overview.totalProfitability, { sign: true }),
      helper: "Beneficio sobre capital neto",
      icon: BarChart3,
      tone:
        overview.totalProfitability >= 0
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
      href: "/admin",
      label: "Panel trader",
      value: "panel",
      icon: UsersRound,
    },
    {
      href: "/admin?tab=rentabilidad",
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
          <div className="relative w-full sm:w-auto lg:shrink-0">
            <details
              className="group/account"
              open={passwordError || passwordStatus ? true : undefined}
            >
              <summary
                aria-label="Abrir menú de cuenta"
                className="flex min-h-12 w-full cursor-pointer list-none items-center gap-3 rounded-full border bg-background/35 px-2 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:bg-secondary/70 sm:w-[320px] [&::-webkit-details-marker]:hidden"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary ring-1 ring-primary/25">
                  {traderInitial}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-muted-foreground">
                    Sesión trader
                  </span>
                  <span className="block truncate text-sm font-semibold text-card-foreground">
                    {traderEmail}
                  </span>
                </span>
                <ChevronDown
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-open/account:rotate-180"
                  strokeWidth={1.9}
                />
              </summary>

              <div className="glass-panel absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-lg border p-2 shadow-[0_24px_70px_rgba(0,0,0,0.42)] sm:left-auto sm:w-[360px]">
                <div className="rounded-md bg-secondary/45 px-5 py-5 text-center">
                  <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary/15 text-lg font-bold text-primary ring-1 ring-primary/25">
                    {traderInitial}
                  </span>
                  <p className="mt-3 text-sm font-semibold text-card-foreground">
                    Cuenta trader
                  </p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {traderEmail}
                  </p>
                </div>

                <div className="mt-2 flex flex-col gap-1">
                  <PasswordChangeForm
                    next={currentAdminPath}
                    passwordError={passwordError}
                    passwordStatus={passwordStatus}
                  />
                  <form action="/auth/signout" method="post">
                    <Button
                      className="h-11 w-full justify-start rounded-md px-3 text-sm"
                      variant="ghost"
                      type="submit"
                    >
                      <LogOut data-icon="inline-start" strokeWidth={1.9} />
                      Salir
                    </Button>
                  </form>
                </div>
              </div>
            </details>
          </div>
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

            <section
              className={cn(
                "grid gap-4",
                selectedInvestor && "2xl:grid-cols-[minmax(0,1fr)_460px]",
              )}
            >
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
          <section>
            <WeeklyProfitabilityPanel
              next={currentAdminPath}
              openMonths={openMonths}
              weeklyError={weeklyError}
              weeklyStatus={weeklyStatus}
              weeks={weeklyProfitability}
            />
          </section>
        )}
      </div>
    </main>
  );
}
