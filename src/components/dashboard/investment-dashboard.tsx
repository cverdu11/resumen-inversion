"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  Coins,
  Database,
  LogOut,
  Target,
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
  investmentSummary as defaultInvestmentSummary,
  type CapitalMovementItem,
  type InvestmentSummary,
  type MonthlyInvestmentItem,
  monthlyInvestmentData,
  type WeeklyInvestmentItem,
  weeklyInvestmentData,
} from "@/lib/investment-data";
import { formatWholeCurrency, formatWholePercent } from "@/lib/formatters";
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
  helper: string;
  icon: LucideIcon;
  label: string;
  tone: MobileMetricTone;
  value: string;
};

type MobileWeeklyChartPoint = {
  monthLabel: string;
  value: number;
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

const mobileMonthFormatter = new Intl.DateTimeFormat("es-ES", {
  month: "short",
});

function getCompactMonthLabel(date: string) {
  const label = mobileMonthFormatter
    .format(new Date(`${date}T12:00:00`))
    .replace(".", "");

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function buildMobileWeeklyChartPoints(
  weeklyData: WeeklyInvestmentItem[],
  currentValue: number,
) {
  const recentWeeks = weeklyData.slice(-12);

  if (!recentWeeks.length || currentValue <= 0) {
    return [];
  }

  const recentFactor = recentWeeks.reduce(
    (factor, week) => factor * (1 + week.returnPct / 100),
    1,
  );
  let runningValue = recentFactor > 0 ? currentValue / recentFactor : currentValue;

  return recentWeeks.map((week) => {
    runningValue *= 1 + week.returnPct / 100;

    return {
      monthLabel: getCompactMonthLabel(week.monthDate || week.endDate),
      value: runningValue,
    };
  });
}

function formatMobileAxisValue(value: number) {
  return `${Math.round(value / 1000)}K`;
}

function MobileWeeklyValueChart({
  points,
}: {
  points: MobileWeeklyChartPoint[];
}) {
  if (points.length < 2) {
    return null;
  }

  const width = 190;
  const height = 126;
  const padding = {
    bottom: 20,
    left: 8,
    right: 25,
    top: 12,
  };
  const values = points.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const verticalPad = Math.max((maxValue - minValue) * 0.28, maxValue * 0.025);
  const axisMin = Math.max(0, minValue - verticalPad);
  const axisMax = maxValue + verticalPad;
  const range = Math.max(1, axisMax - axisMin);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const coords = points.map((point, index) => {
    const x =
      padding.left +
      (points.length === 1 ? 0 : (chartWidth * index) / (points.length - 1));
    const y =
      padding.top +
      chartHeight -
      ((point.value - axisMin) / range) * chartHeight;

    return { ...point, x, y };
  });
  const linePath = coords
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const baseY = height - padding.bottom;
  const areaPath = `${linePath} L ${coords.at(-1)?.x ?? width} ${baseY} L ${
    coords[0]?.x ?? 0
  } ${baseY} Z`;
  const monthLabelIndexes = coords.reduce<number[]>((indexes, point, index) => {
    const isFirstMonthPoint =
      index === 0 || point.monthLabel !== coords[index - 1]?.monthLabel;

    if (isFirstMonthPoint) {
      indexes.push(index);
    }

    return indexes;
  }, []);
  const labelIndexes =
    monthLabelIndexes.length > 4
      ? [
          monthLabelIndexes[0],
          monthLabelIndexes[Math.floor(monthLabelIndexes.length / 2)],
          monthLabelIndexes[monthLabelIndexes.length - 1],
        ].filter((item, index, source) => source.indexOf(item) === index)
      : monthLabelIndexes;
  const axisLabels = [axisMax, axisMin + range / 2, axisMin];

  return (
    <div
      aria-label="Evolucion semanal del valor actual"
      className="pointer-events-none absolute inset-y-4 right-2 w-[58%] opacity-95"
      role="img"
    >
      <svg
        className="h-full w-full overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          <linearGradient id="mobile-weekly-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0" />
          </linearGradient>
          <filter
            id="mobile-weekly-glow"
            height="180%"
            width="180%"
            x="-40%"
            y="-40%"
          >
            <feGaussianBlur stdDeviation="2.6" />
          </filter>
        </defs>
        {[0.2, 0.5, 0.8].map((line) => (
          <line
            key={line}
            stroke="rgba(255,255,255,0.07)"
            strokeDasharray="2 5"
            strokeWidth="1"
            x1={padding.left}
            x2={width - padding.right - 2}
            y1={padding.top + chartHeight * line}
            y2={padding.top + chartHeight * line}
          />
        ))}
        <path d={areaPath} fill="url(#mobile-weekly-area)" />
        <path
          d={linePath}
          fill="none"
          filter="url(#mobile-weekly-glow)"
          opacity="0.48"
          stroke="rgb(34, 197, 94)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="5"
        />
        <path
          d={linePath}
          fill="none"
          stroke="rgb(31, 224, 128)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.8"
        />
        <circle
          cx={coords.at(-1)?.x}
          cy={coords.at(-1)?.y}
          fill="#d7ffe8"
          r="3.2"
          stroke="rgb(31, 224, 128)"
          strokeWidth="1.8"
        />
        {axisLabels.map((labelValue, index) => (
          <text
            fill="rgba(226,232,240,0.42)"
            fontSize="7"
            fontWeight="800"
            key={labelValue}
            textAnchor="end"
            x={width - 1}
            y={
              padding.top +
              chartHeight * (index === 0 ? 0.05 : index === 1 ? 0.5 : 0.95)
            }
          >
            {formatMobileAxisValue(labelValue)}
          </text>
        ))}
        {labelIndexes.map((index) => {
          const point = coords[index];

          return (
            <text
              fill="rgba(226,232,240,0.56)"
              fontSize="7"
              fontWeight="800"
              key={`${point.monthLabel}-${index}`}
              textAnchor={
                index === 0
                  ? "start"
                  : index === points.length - 1
                    ? "end"
                    : "middle"
              }
              x={point.x}
              y={height - 2}
            >
              {point.monthLabel}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function MobileMetricCard({
  helper,
  icon: Icon,
  label,
  tone,
  value,
}: MobileMetricCardProps) {
  const styles = mobileMetricToneStyles[tone];

  return (
    <article className="flex min-h-[122px] flex-col justify-between rounded-[1.35rem] border border-white/10 bg-[#1a1d19]/95 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_14px_30px_rgba(0,0,0,0.3)]">
      <Icon
        className={cn(
          "size-5",
          styles.icon,
        )}
        strokeWidth={2}
      />
      <div>
        <p
          className={cn(
            "truncate text-[1.22rem] font-black leading-none tracking-[-0.04em]",
            styles.value,
          )}
        >
          {value}
        </p>
        <p className="mt-1.5 truncate text-[0.68rem] leading-3 text-card-foreground/72">
          {helper}
        </p>
      </div>
      <p className="sr-only">{label}</p>
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
      helper: "Capital neto aportado",
      icon: Database,
      label: "Capital neto",
      tone: "neutral",
      value: formatWholeCurrency(investmentSummary.netCapitalContributed),
    },
    {
      helper: "Beneficio total",
      icon: Coins,
      label: "Beneficio",
      tone: profitTone,
      value: formatWholeCurrency(investmentSummary.totalProfit, {
        sign: true,
      }),
    },
    {
      helper: "Rentabilidad anualizada",
      icon: BarChart3,
      label: "Anualizada",
      tone: annualizedTone,
      value: annualizedReturnDisplay,
    },
    {
      helper: "Maxima caida",
      icon: TrendingDown,
      label: "Maxima caida",
      tone: drawdownTone,
      value: drawdownDisplay,
    },
  ];
  const mobileWeeklyChartPoints = buildMobileWeeklyChartPoints(
    data.weeklyData,
    investmentSummary.currentValue,
  );

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
      <div className="h-full">
        <div className="mb-3">
          <h1 className="text-[2rem] font-black leading-none tracking-[-0.055em] text-white">
            Resumen
          </h1>
        </div>

        <section className="relative h-[172px] overflow-hidden rounded-[1.65rem] border border-white/10 bg-[radial-gradient(circle_at_79%_49%,rgba(34,197,94,0.3),transparent_43%),linear-gradient(135deg,#191c18_0%,#151916_47%,#0e2116_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_38px_rgba(0,0,0,0.34)]">
          <MobileWeeklyValueChart points={mobileWeeklyChartPoints} />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="min-w-0">
              <p className="text-[0.66rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                Valor actual
              </p>
              <p className="mt-3 text-[2.28rem] font-black leading-none tracking-[-0.06em] text-white">
                {formatWholeCurrency(investmentSummary.currentValue)}
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-positive/20 bg-positive-soft px-2.5 py-1.5 text-[0.66rem] font-black text-white">
              <Target className="size-3 text-positive" strokeWidth={2.2} />
              {totalReturnDisplay} total
            </span>
          </div>
        </section>

        <section className="mt-3 grid grid-cols-2 gap-3">
          {mobileSummaryCards.map((card) => (
            <MobileMetricCard key={card.label} {...card} />
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

          <section className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
            {activeMobileTab === "summary"
              ? renderMobileSummary()
              : renderMobileEmptyTab()}
          </section>
        </div>

        <nav
          aria-label="Navegacion del panel inversor"
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.6rem)] left-1/2 z-30 grid h-11 w-[18rem] max-w-[calc(100vw-3rem)] -translate-x-1/2 grid-cols-4 rounded-[1.65rem] border border-white/14 bg-[linear-gradient(180deg,rgba(56,56,51,0.72),rgba(17,17,15,0.78))] p-[3px] shadow-[0_-8px_26px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(0,0,0,0.36)] backdrop-blur-2xl"
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
                  "flex min-w-0 flex-col items-center justify-center gap-[1px] rounded-[1.45rem] px-1 text-[0.5rem] font-semibold leading-none text-white/80 transition-all duration-200",
                  isActive
                    ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0.08))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_6px_16px_rgba(0,0,0,0.24)]"
                    : "hover:bg-white/8",
                )}
                onClick={() => setActiveMobileTab(tab.id)}
              >
                <Icon
                  className={cn("size-3.5", isActive ? "text-positive" : "text-white/84")}
                  strokeWidth={2.2}
                />
                <span className="truncate">{tab.label}</span>
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
