"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  Clock3,
  Coins,
  Database,
  Info,
  LogOut,
  Target,
  Trophy,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
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
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  capitalMovements as defaultCapitalMovements,
  dataUpdatedAt as defaultDataUpdatedAt,
  getPreviousMonthLabel,
  investmentSummary as defaultInvestmentSummary,
  type CapitalMovementItem,
  type InvestmentSummary,
  type MonthlyInvestmentItem,
  monthlyInvestmentData,
  type WeeklyInvestmentItem,
  weeklyInvestmentData,
} from "@/lib/investment-data";
import {
  formatPercent,
  formatWholeCurrency,
  formatWholePercent,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";

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
  investorName?: string;
  loginStatus?: string;
  passwordError?: string;
  passwordStatus?: string;
  requiresPasswordChange?: boolean;
  subtitle?: string;
  title?: string;
  userEmail?: string;
};

type MobileInvestorTab = "chart" | "insights" | "monthly" | "summary";

const mobileInvestorTabs: Array<{
  icon: LucideIcon;
  id: MobileInvestorTab;
  label: string;
}> = [
  {
    icon: Target,
    id: "summary",
    label: "Resumen",
  },
  {
    icon: BarChart3,
    id: "chart",
    label: "Grafico",
  },
  {
    icon: TrendingUp,
    id: "insights",
    label: "Insights",
  },
  {
    icon: CalendarDays,
    id: "monthly",
    label: "Mensual",
  },
];

function getKpiTone(value: number) {
  if (value > 0) {
    return "positive" as const;
  }

  if (value < 0) {
    return "negative" as const;
  }

  return "neutral" as const;
}

type MobileMetricTone = "negative" | "neutral" | "positive";

type MobileMetricCardProps = {
  explanation?: string;
  helper: string;
  icon: LucideIcon;
  infoSide?: "left" | "right";
  isInfoOpen?: boolean;
  label: string;
  onInfoToggle?: () => void;
  tone: MobileMetricTone;
  value: string;
};

type MobileInsightCardProps = {
  detail: string;
  icon: LucideIcon;
  title: string;
  tone: MobileMetricTone;
  value: string;
};

const mobileMetricToneStyles: Record<
  MobileMetricTone,
  {
    icon: string;
    value: string;
  }
> = {
  negative: {
    icon: "text-danger",
    value: "text-danger",
  },
  neutral: {
    icon: "text-muted-foreground",
    value: "text-card-foreground",
  },
  positive: {
    icon: "text-positive",
    value: "text-positive",
  },
};

function getInvestorInitials(name: string | undefined, email: string) {
  const trimmedName = name?.trim();

  if (trimmedName) {
    const nameParts = trimmedName.split(/\s+/).filter(Boolean);

    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }

    return trimmedName.slice(0, 2).toUpperCase();
  }

  return email.trim().slice(0, 2).toUpperCase() || "IN";
}

function getLatestTwelveLabel(
  monthlyDataItems: MonthlyInvestmentItem[],
  fallbackLabel: string,
) {
  const latestTwelve = monthlyDataItems.slice(-12);

  if (latestTwelve.length <= 1) {
    return fallbackLabel;
  }

  return `${latestTwelve[0].month} - ${latestTwelve.at(-1)?.month}`;
}

function MobileMetricCard({
  explanation,
  helper,
  icon: Icon,
  infoSide = "right",
  isInfoOpen = false,
  label,
  onInfoToggle,
  tone,
  value,
}: MobileMetricCardProps) {
  const styles = mobileMetricToneStyles[tone];
  const infoId = `mobile-info-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <article className="relative flex min-h-[122px] flex-col justify-between rounded-[1.35rem] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(31,34,29,0.96),rgba(18,21,18,0.96))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.055),0_12px_26px_rgba(0,0,0,0.26)]">
      {explanation ? (
        <>
          <button
            aria-controls={infoId}
            aria-expanded={isInfoOpen}
            aria-label={`Explicar ${label}`}
            className="absolute right-3 top-3 z-20 grid size-6 place-items-center rounded-full text-muted-foreground/72 hover:bg-white/8 hover:text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
            onClick={onInfoToggle}
            type="button"
          >
            <Info className="size-3.5" strokeWidth={2} />
          </button>
          {isInfoOpen ? (
            <div
              className={cn(
                "absolute top-10 z-30 w-[min(14rem,calc(100vw-2.5rem))] rounded-[0.9rem] border border-white/12 bg-[#111812] px-3 py-2.5 text-left shadow-[0_18px_42px_rgba(0,0,0,0.46)]",
                infoSide === "left" ? "left-3" : "right-3",
              )}
              id={infoId}
              role="note"
            >
              <p className="text-[0.72rem] font-bold leading-4 text-card-foreground">
                {label}
              </p>
              <p className="mt-1 text-[0.66rem] leading-4 text-card-foreground/78">
                {explanation}
              </p>
            </div>
          ) : null}
        </>
      ) : null}
      <Icon
        className={cn(
          "size-5 shrink-0",
          styles.icon,
        )}
        strokeWidth={2}
      />
      <div>
        <p
          className={cn(
            "truncate text-[1.2rem] font-black leading-none tracking-[-0.035em]",
            styles.value,
          )}
        >
          {value}
        </p>
        <p className="mt-1.5 truncate text-[0.66rem] leading-3 text-card-foreground/72">
          {helper}
        </p>
      </div>
      <p className="sr-only">{label}</p>
    </article>
  );
}

function MobileInsightCard({
  detail,
  icon: Icon,
  title,
  tone,
  value,
}: MobileInsightCardProps) {
  const styles = mobileMetricToneStyles[tone];

  return (
    <article className="flex min-h-[108px] flex-col justify-between rounded-[1.25rem] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(31,34,29,0.96),rgba(18,21,18,0.96))] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.055),0_12px_26px_rgba(0,0,0,0.24)]">
      <div className="flex items-start justify-between gap-2">
        <Icon className={cn("size-5 shrink-0", styles.icon)} strokeWidth={2} />
        <p
          className={cn(
            "text-right text-[1.08rem] font-black leading-none tracking-[-0.035em]",
            styles.value,
          )}
        >
          {value}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-[0.74rem] font-bold leading-tight text-card-foreground">
          {title}
        </p>
        <p className="mt-1 text-[0.62rem] leading-tight text-card-foreground/66">
          {detail}
        </p>
      </div>
    </article>
  );
}

export function InvestmentDashboard({
  dashboardData,
  investorName,
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
  const displayInvestorName = investorName?.trim() || "Cuenta inversor";
  const investorInitials = getInvestorInitials(investorName, investorEmail);
  const [showLoginToast, setShowLoginToast] = useState(
    loginStatus === "success" && !requiresPasswordChange,
  );
  const [activeMobileTab, setActiveMobileTab] =
    useState<MobileInvestorTab>("summary");
  const [activeMobileInfo, setActiveMobileInfo] = useState<string | null>(null);
  const returnTone = getKpiTone(investmentSummary.totalReturnPct);
  const profitTone = getKpiTone(investmentSummary.totalProfit);
  const annualizedTone = getKpiTone(investmentSummary.annualizedReturnPct);
  const drawdownTone = getKpiTone(investmentSummary.maxDrawdownPct);
  const totalReturnDisplay = formatWholePercent(
    investmentSummary.totalReturnPct,
    {
      sign: true,
    },
  );
  const annualizedReturnDisplay = formatWholePercent(
    investmentSummary.annualizedReturnPct,
    {
      sign: true,
    },
  );
  const drawdownDisplay = formatWholePercent(investmentSummary.maxDrawdownPct, {
    sign: true,
  });
  const maxDrawdownPeriod = data.monthlyData.length
    ? getPreviousMonthLabel(data.monthlyData, investmentSummary.maxDrawdown)
    : "Sin datos";
  const kpis = [
    {
      label: "Capital neto aportado",
      value: formatWholeCurrency(investmentSummary.netCapitalContributed),
      helper: `Aportado ${formatWholeCurrency(
        investmentSummary.totalContributions,
      )} - retirado ${formatWholeCurrency(investmentSummary.totalWithdrawals)}`,
      explanation:
        "Capital que has aportado menos retiradas. No incluye beneficios ni perdidas de mercado.",
      icon: Database,
      tone: "neutral" as const,
    },
    {
      label: "Valor actual",
      value: formatWholeCurrency(investmentSummary.currentValue),
      helper: "Valor de mercado actual",
      explanation:
        "Valor estimado de tu inversion hoy, despues de aplicar aportaciones, retiradas y rentabilidades guardadas.",
      icon: TrendingUp,
      tone: returnTone,
    },
    {
      label: "Beneficio total",
      value: formatWholeCurrency(investmentSummary.totalProfit, {
        sign: true,
      }),
      helper: "Valor actual + retiradas - aportaciones",
      explanation:
        "Ganancia o perdida en euros. Se calcula como valor actual mas retiradas menos todo el capital aportado.",
      icon: Coins,
      tone: profitTone,
    },
    {
      label: "Rentabilidad total",
      value: totalReturnDisplay,
      helper: "Rendimiento TWR acumulado",
      explanation:
        "Rentabilidad acumulada del producto desde tu inicio. Usa TWR para medir rendimiento sin distorsion por aportaciones o retiradas.",
      icon: Target,
      tone: returnTone,
    },
    {
      label: "Rentabilidad anualizada",
      value: annualizedReturnDisplay,
      helper: "Tasa anualizada (TWR)",
      explanation:
        "La rentabilidad total expresada como ritmo anual segun tus dias reales de inversion. En periodos cortos puede verse muy alta o muy baja.",
      icon: BarChart3,
      tone: annualizedTone,
    },
    {
      label: "Maxima caida / drawdown",
      value: drawdownDisplay,
      helper: "Desde maximo historico",
      explanation:
        "Mayor caida desde un maximo historico hasta un punto posterior mas bajo. Sirve para ver el riesgo de retroceso.",
      icon: TrendingDown,
      tone: drawdownTone,
    },
  ] as const;
  const mobileSummaryCards: MobileMetricCardProps[] = [
    {
      explanation:
        "Capital que has aportado menos retiradas. No incluye beneficios ni perdidas de mercado.",
      helper: "Capital neto aportado",
      icon: Database,
      label: "Capital neto",
      tone: "neutral",
      value: formatWholeCurrency(investmentSummary.netCapitalContributed),
    },
    {
      explanation:
        "Ganancia o perdida en euros. Se calcula como valor actual mas retiradas menos todo el capital aportado.",
      helper: "Beneficio total",
      icon: Coins,
      label: "Beneficio",
      tone: profitTone,
      value: formatWholeCurrency(investmentSummary.totalProfit, {
        sign: true,
      }),
    },
    {
      explanation:
        "La rentabilidad total expresada como ritmo anual segun tus dias reales de inversion. En periodos cortos puede verse muy alta o muy baja.",
      helper: "Rentabilidad anualizada",
      icon: BarChart3,
      label: "Anualizada",
      tone: annualizedTone,
      value: annualizedReturnDisplay,
    },
    {
      explanation:
        "Mayor caida desde un maximo historico hasta un punto posterior mas bajo. Sirve para ver el riesgo de retroceso.",
      helper: "Maxima caida",
      icon: TrendingDown,
      label: "Maxima caida",
      tone: drawdownTone,
      value: drawdownDisplay,
    },
  ];
  const mobileInsightsCards: MobileInsightCardProps[] = [
    {
      detail: investmentSummary.bestMonth.month,
      icon: Trophy,
      title: "Mejor mes",
      tone: getKpiTone(investmentSummary.bestMonth.returnPct),
      value: formatPercent(investmentSummary.bestMonth.returnPct, {
        sign: true,
      }),
    },
    {
      detail: investmentSummary.worstMonth.month,
      icon: Target,
      title: "Peor mes",
      tone: getKpiTone(investmentSummary.worstMonth.returnPct),
      value: formatPercent(investmentSummary.worstMonth.returnPct, {
        sign: true,
      }),
    },
    {
      detail: investmentSummary.bestPositiveStreak.label || "Sin racha",
      icon: TrendingUp,
      title: "Mejor racha",
      tone: getKpiTone(investmentSummary.bestPositiveStreak.months),
      value: `${investmentSummary.bestPositiveStreak.months} meses`,
    },
    {
      detail: maxDrawdownPeriod,
      icon: TrendingDown,
      title: "Maxima caida",
      tone: getKpiTone(investmentSummary.maxDrawdownPct),
      value: formatPercent(investmentSummary.maxDrawdownPct, {
        sign: true,
      }),
    },
    {
      detail: investmentSummary.currentMonth.month,
      icon: CalendarDays,
      title: "Mes actual",
      tone: getKpiTone(investmentSummary.currentMonth.returnPct),
      value: formatPercent(investmentSummary.currentMonth.returnPct, {
        sign: true,
      }),
    },
    {
      detail: getLatestTwelveLabel(
        data.monthlyData,
        investmentSummary.currentMonth.month,
      ),
      icon: Clock3,
      title: "Ultimos 12 meses",
      tone: getKpiTone(investmentSummary.lastTwelveMonthsReturnPct),
      value: formatPercent(investmentSummary.lastTwelveMonthsReturnPct, {
        sign: true,
      }),
    },
  ];

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

  function renderKpiSection() {
    return (
      <TooltipProvider delayDuration={120}>
        <section className="grid gap-3 min-[380px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </section>
      </TooltipProvider>
    );
  }

  function renderAccountMenu(variant: "desktop" | "mobile") {
    if (!userEmail) {
      return null;
    }

    const isMobile = variant === "mobile";

    return (
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
          className={cn(
            "flex cursor-pointer list-none items-center text-left transition-colors [&::-webkit-details-marker]:hidden",
            isMobile
              ? "gap-3 rounded-full pr-3"
              : "min-h-12 w-full gap-3 rounded-full border bg-background/35 px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:bg-secondary/70 sm:w-[320px]",
          )}
        >
          <span
            className={cn(
              "grid shrink-0 place-items-center rounded-full bg-primary/15 font-bold text-primary ring-1 ring-primary/25",
              isMobile ? "size-10 text-sm" : "size-9 text-sm",
            )}
          >
            {investorInitials}
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block font-medium text-muted-foreground",
                isMobile ? "sr-only" : "text-xs",
              )}
            >
              Cuenta inversor
            </span>
            <span
              className={cn(
                "block truncate font-semibold text-card-foreground",
                isMobile ? "max-w-[178px] text-[0.9rem]" : "text-sm",
              )}
            >
              {isMobile ? displayInvestorName : investorEmail}
            </span>
            {isMobile ? (
              <span className="mt-0.5 block text-[0.55rem] font-black uppercase tracking-[0.26em] text-muted-foreground">
                Oro Negro
              </span>
            ) : null}
          </span>
          {isMobile ? null : (
            <ChevronDown
              className="size-4 shrink-0 text-muted-foreground transition-transform group-open/account:rotate-180"
              strokeWidth={1.9}
            />
          )}
        </summary>

        <div
          className={cn(
            "glass-panel z-50 overflow-hidden border p-2 shadow-[0_24px_70px_rgba(0,0,0,0.42)]",
            isMobile
              ? "fixed left-5 right-5 top-24 rounded-[1.35rem]"
              : "absolute left-0 right-0 mt-2 rounded-lg sm:left-auto sm:w-[360px]",
          )}
        >
          <div
            className={cn(
              "bg-secondary/45 px-5 py-5 text-center",
              isMobile ? "rounded-[1.1rem]" : "rounded-md",
            )}
          >
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary/15 text-lg font-bold text-primary ring-1 ring-primary/25">
              {investorInitials}
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
    );
  }

  function renderDesktopDashboard() {
    return (
      <main className="dashboard-grid hidden min-h-screen px-3 py-4 sm:px-6 sm:py-6 lg:block lg:px-8">
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
                {renderAccountMenu("desktop")}
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

          <div className="flex flex-col gap-5">
            {renderKpiSection()}

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px] 2xl:grid-cols-[minmax(0,1fr)_430px]">
              <InvestmentChartCard monthlyData={data.monthlyData} />
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
        </div>
      </main>
    );
  }

  function renderMobileSummary() {
    return (
      <div className="h-full pb-8">
        <div className="mb-3">
          <h1 className="text-[2rem] font-black leading-none tracking-[-0.055em] text-white">
            Resumen
          </h1>
        </div>

        <section className="relative h-[154px] overflow-hidden rounded-[1.65rem] border border-white/[0.09] bg-[radial-gradient(circle_at_83%_36%,rgba(34,197,94,0.2),transparent_43%),linear-gradient(135deg,#1b1e19_0%,#141713_55%,#0b1710_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_38px_rgba(0,0,0,0.3)]">
          <div className="pointer-events-none absolute inset-0 rounded-[1.65rem] bg-[linear-gradient(115deg,rgba(255,255,255,0.045),transparent_36%),radial-gradient(circle_at_86%_78%,rgba(16,185,129,0.12),transparent_40%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="min-w-0">
              <p className="text-[0.66rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                Valor actual
              </p>
              <p className="mt-3 text-[2.28rem] font-black leading-none tracking-[-0.06em] text-white">
                {formatWholeCurrency(investmentSummary.currentValue)}
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-positive/25 bg-positive-soft px-2.5 py-1.5 text-[0.66rem] font-black text-white shadow-[0_10px_24px_rgba(16,185,129,0.12)]">
              <Target className="size-3 text-positive" strokeWidth={2.2} />
              {totalReturnDisplay} total
            </span>
          </div>
        </section>

        <TooltipProvider delayDuration={120}>
          <section className="mt-3.5 grid grid-cols-2 gap-3">
            {mobileSummaryCards.map((card) => (
              <MobileMetricCard
                infoSide={
                  card.label === "Capital neto" || card.label === "Anualizada"
                    ? "left"
                    : "right"
                }
                isInfoOpen={activeMobileInfo === card.label}
                key={card.label}
                onInfoToggle={() =>
                  setActiveMobileInfo((currentLabel) =>
                    currentLabel === card.label ? null : card.label,
                  )
                }
                {...card}
              />
            ))}
          </section>
        </TooltipProvider>
      </div>
    );
  }

  function renderMobileInsights() {
    return (
      <div className="h-full pb-8">
        <div className="mb-3">
          <h1 className="text-[2rem] font-black leading-none tracking-[-0.055em] text-white">
            Insights
          </h1>
        </div>

        <section className="grid grid-cols-2 gap-x-3.5 gap-y-4">
          {mobileInsightsCards.map((card) => (
            <MobileInsightCard key={card.title} {...card} />
          ))}
        </section>
      </div>
    );
  }

  function renderMobileEmptyTab() {
    const activeTab = mobileInvestorTabs.find(
      (tab) => tab.id === activeMobileTab,
    );

    return (
      <div className="h-full">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-muted-foreground">
          Proximamente
        </p>
        <h1 className="mt-2 text-[2.45rem] font-black leading-none tracking-[-0.055em] text-white">
          {activeTab?.label}
        </h1>
      </div>
    );
  }

  function renderMobileDashboard() {
    return (
      <main className="dashboard-grid relative flex h-[100dvh] min-h-[100svh] overflow-hidden bg-[#030507] text-white lg:hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_17%,rgba(30,64,91,0.32),transparent_34%),linear-gradient(180deg,#050707_0%,#020407_100%)]" />
        <div className="relative z-10 flex h-full w-full flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+4.25rem)] pt-5">
          <header className="relative mb-2 min-h-10">
            {renderAccountMenu("mobile")}
            {showLoginToast ? (
              <div
                aria-live="polite"
                className="pointer-events-none absolute left-0 right-0 top-full z-40 mt-3 rounded-[1.1rem] border border-positive/30 bg-positive-soft px-4 py-3 text-sm font-semibold text-positive shadow-[0_16px_40px_rgba(0,0,0,0.28)]"
                role="status"
              >
                Sesion iniciada correctamente.
              </div>
            ) : null}
          </header>

          <section className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-3">
            {activeMobileTab === "summary"
              ? renderMobileSummary()
              : activeMobileTab === "insights"
                ? renderMobileInsights()
              : renderMobileEmptyTab()}
          </section>
        </div>

        <nav
          aria-label="Navegacion del panel inversor"
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.65rem)] left-1/2 z-30 flex h-[3.87rem] w-[85vw] max-w-[20.75rem] -translate-x-1/2 items-stretch gap-[0.1rem] overflow-hidden rounded-[2.15rem] border border-white/[0.12] bg-[rgba(14,14,13,0.74)] p-[0.32rem] shadow-[0_-12px_34px_rgba(0,0,0,0.48),0_0_0_1px_rgba(255,255,255,0.035),inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-1px_0_rgba(0,0,0,0.58)] backdrop-blur-2xl"
        >
          {mobileInvestorTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMobileTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={isActive}
                className={cn(
                  "relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-[0.14rem] rounded-[1.85rem] px-[0.2rem] text-white/74",
                  isActive
                    ? "z-10 bg-[linear-gradient(180deg,rgba(104,104,100,0.54),rgba(57,57,54,0.4))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.32),0_10px_20px_rgba(0,0,0,0.32)]"
                    : "hover:bg-white/8 hover:text-white",
                )}
                onClick={() => {
                  setActiveMobileInfo(null);
                  setActiveMobileTab(tab.id);
                }}
              >
                <Icon
                  className={cn(
                    "size-[1.2rem]",
                    isActive ? "text-white" : "text-white/86",
                  )}
                  strokeWidth={2.5}
                />
                <span className="-translate-y-[0.4px] truncate text-[0.50rem] font-semibold leading-none">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </main>
    );
  }

  return (
    <>
      {renderDesktopDashboard()}
      {renderMobileDashboard()}
    </>
  );
}
