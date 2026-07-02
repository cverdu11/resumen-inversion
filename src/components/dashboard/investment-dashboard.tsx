"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  BarChart3,
  ChevronDown,
  Coins,
  Database,
  LogOut,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { changeInvestorPassword } from "@/app/inversor/actions";
import { PasswordChangeForm } from "@/components/admin/password-change-form";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { MonthlySummaryTable } from "@/components/dashboard/monthly-summary-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  capitalMovements as defaultCapitalMovements,
  dataUpdatedAt as defaultDataUpdatedAt,
  investmentSummary as defaultInvestmentSummary,
  type CapitalMovementItem,
  type InvestmentSummary,
  type MonthlyInvestmentItem,
  monthlyInvestmentData,
  type WeeklyInvestmentItem,
  weeklyInvestmentData,
} from "@/lib/investment-data";
import { formatWholeCurrency, formatWholePercent } from "@/lib/formatters";

const InvestmentChartCard = dynamic(
  () =>
    import("@/components/dashboard/investment-chart").then(
      (mod) => mod.InvestmentChartCard,
    ),
  {
    ssr: false,
    loading: () => <ChartLoadingCard />,
  },
);

function ChartLoadingCard() {
  return (
    <Card className="min-h-[456px] sm:min-h-[536px]">
      <CardHeader className="flex-col items-start gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <CardTitle className="text-base font-semibold uppercase">
            Evolucion del valor de la inversion
          </CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Valor de la inversion (EUR)
          </p>
        </div>
        <div className="h-9 w-full rounded-md border bg-secondary/50 sm:w-72" />
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
        <div className="h-[320px] rounded-md border bg-muted/35 sm:h-[430px]" />
      </CardContent>
    </Card>
  );
}

export type InvestmentDashboardData = {
  capitalMovements: CapitalMovementItem[];
  dataUpdatedAt: string;
  monthlyData: MonthlyInvestmentItem[];
  summary: InvestmentSummary;
  weeklyData: WeeklyInvestmentItem[];
};

type InvestmentDashboardProps = {
  dashboardData?: InvestmentDashboardData;
  loginStatus?: string;
  passwordError?: string;
  passwordStatus?: string;
  requiresPasswordChange?: boolean;
  subtitle?: string;
  title?: string;
  userEmail?: string;
};

export function InvestmentDashboard({
  dashboardData,
  loginStatus,
  passwordError,
  passwordStatus,
  requiresPasswordChange,
  subtitle = "Vision general de rendimiento y evolucion",
  title = "Resumen de Inversion",
  userEmail,
}: InvestmentDashboardProps) {
  const data =
    dashboardData ??
    ({
      capitalMovements: defaultCapitalMovements,
      dataUpdatedAt: defaultDataUpdatedAt,
      monthlyData: monthlyInvestmentData,
      summary: defaultInvestmentSummary,
      weeklyData: weeklyInvestmentData,
    } satisfies InvestmentDashboardData);
  const investmentSummary = data.summary;
  const investorEmail = userEmail ?? "Usuario autenticado";
  const investorInitial = investorEmail.trim().charAt(0).toUpperCase() || "I";
  const [showLoginToast, setShowLoginToast] = useState(
    loginStatus === "success" && !requiresPasswordChange,
  );
  const returnTone =
    investmentSummary.totalReturnPct >= 0 ? "positive" : "negative";
  const profitTone =
    investmentSummary.totalProfit >= 0 ? "positive" : "negative";
  const annualizedTone =
    investmentSummary.annualizedReturnPct >= 0 ? "positive" : "negative";
  const kpis = [
    {
      label: "Capital neto aportado",
      value: formatWholeCurrency(investmentSummary.netCapitalContributed),
      helper: `Aportado ${formatWholeCurrency(
        investmentSummary.totalContributions,
      )} - retirado ${formatWholeCurrency(investmentSummary.totalWithdrawals)}`,
      icon: Database,
      tone: "neutral" as const,
    },
    {
      label: "Valor actual",
      value: formatWholeCurrency(investmentSummary.currentValue),
      helper: "Valor de mercado actual",
      icon: TrendingUp,
      tone: returnTone,
    },
    {
      label: "Beneficio total",
      value: formatWholeCurrency(investmentSummary.totalProfit, {
        sign: true,
      }),
      helper: "Valor actual + retiradas - aportaciones",
      icon: Coins,
      tone: profitTone,
    },
    {
      label: "Rentabilidad total",
      value: formatWholePercent(investmentSummary.totalReturnPct, {
        sign: true,
      }),
      helper: "Rendimiento TWR acumulado",
      icon: Target,
      tone: returnTone,
    },
    {
      label: "Rentabilidad anualizada",
      value: formatWholePercent(investmentSummary.annualizedReturnPct, {
        sign: true,
      }),
      helper: "Tasa anualizada (TWR)",
      icon: BarChart3,
      tone: annualizedTone,
    },
    {
      label: "Maxima caida / drawdown",
      value: formatWholePercent(investmentSummary.maxDrawdownPct, {
        sign: true,
      }),
      helper: "Desde maximo historico",
      icon: TrendingDown,
      tone: "negative" as const,
    },
  ] as const;

  useEffect(() => {
    if (loginStatus !== "success" || requiresPasswordChange) {
      return;
    }

    const hideTimer = window.setTimeout(() => {
      setShowLoginToast(false);
    }, 3000);
    const cleanupTimer = window.setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("login_status");
      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
    }, 3200);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(cleanupTimer);
    };
  }, [loginStatus, requiresPasswordChange]);

  return (
    <main className="dashboard-grid min-h-screen px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex max-w-[1780px] flex-col gap-4 sm:gap-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 text-sm text-card-foreground/84 sm:text-lg">
              {subtitle}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
            <div className="relative w-full sm:w-auto lg:shrink-0">
              {userEmail ? (
                <details
                  className="group/account"
                  open={
                    requiresPasswordChange || passwordError || passwordStatus
                      ? true
                      : undefined
                  }
                >
                  <summary
                    aria-label="Abrir menu de cuenta"
                    className="flex min-h-12 w-full cursor-pointer list-none items-center gap-3 rounded-full border bg-background/35 px-2 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:bg-secondary/70 sm:w-[320px] [&::-webkit-details-marker]:hidden"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary ring-1 ring-primary/25">
                      {investorInitial}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium text-muted-foreground">
                        Sesion inversor
                      </span>
                      <span className="block truncate text-sm font-semibold text-card-foreground">
                        {investorEmail}
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
                        {investorInitial}
                      </span>
                      <p className="mt-3 text-sm font-semibold text-card-foreground">
                        Cuenta inversor
                      </p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {investorEmail}
                      </p>
                    </div>

                    <div className="mt-2 flex flex-col gap-1">
                      <PasswordChangeForm
                        forceChange={requiresPasswordChange}
                        next="/inversor"
                        passwordAction={changeInvestorPassword}
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
              ) : null}
              {showLoginToast ? (
                <div
                  aria-live="polite"
                  className="pointer-events-none absolute right-0 top-full z-30 mt-2 w-full rounded-md border border-positive/30 bg-positive-soft px-4 py-2 text-sm font-semibold text-positive shadow-[0_16px_40px_rgba(0,0,0,0.28)] sm:w-[320px]"
                  role="status"
                >
                  Sesion iniciada correctamente.
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <section className="grid gap-3 min-[380px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px] 2xl:grid-cols-[minmax(0,1fr)_430px]">
          <InvestmentChartCard
            monthlyData={data.monthlyData}
            weeklyData={data.weeklyData}
          />
          <InsightsPanel
            investmentSummary={data.summary}
            monthlyData={data.monthlyData}
          />
        </section>

        <MonthlySummaryTable
          capitalMovements={data.capitalMovements}
          monthlyData={data.monthlyData}
          weeklyData={data.weeklyData}
        />
      </div>
    </main>
  );
}
