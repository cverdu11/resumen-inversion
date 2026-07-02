"use client";

import dynamic from "next/dynamic";
import {
  BarChart3,
  CalendarDays,
  Coins,
  Database,
  LogOut,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { MonthlySummaryTable } from "@/components/dashboard/monthly-summary-table";
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
  subtitle?: string;
  title?: string;
  userEmail?: string;
};

export function InvestmentDashboard({
  dashboardData,
  loginStatus,
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
            {loginStatus === "success" ? (
              <div className="rounded-md border border-positive/30 bg-positive-soft px-4 py-2 text-sm font-semibold text-positive">
                Sesion iniciada correctamente.
              </div>
            ) : null}
            {userEmail ? (
              <form action="/auth/signout" method="post">
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border bg-background/30 px-4 text-sm font-semibold text-card-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:bg-secondary/70"
                  type="submit"
                >
                  <LogOut className="size-4" strokeWidth={1.9} />
                  Salir
                </button>
              </form>
            ) : null}
            <Card className="w-full max-w-sm border-border lg:w-auto">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-md border bg-muted/70 text-muted-foreground">
                  <CalendarDays className="size-5" strokeWidth={1.9} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">
                    Datos actualizados al
                  </p>
                  <p className="mt-1 text-base font-medium tabular-nums text-card-foreground">
                    {data.dataUpdatedAt}
                  </p>
                </div>
              </CardContent>
            </Card>
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
