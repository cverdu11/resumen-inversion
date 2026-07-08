"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowUpDown,
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
  UserRound,
  X,
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
  filterDataByRange,
  getPreviousMonthLabel,
  investmentSummary as defaultInvestmentSummary,
  type CapitalMovementItem,
  type InvestmentSummary,
  type MonthlyInvestmentItem,
  monthlyInvestmentData,
  type RangeKey,
  rangeOptions,
  type WeeklyInvestmentItem,
  weeklyInvestmentData,
} from "@/lib/investment-data";
import {
  formatCompactSpanishMonth,
  formatFullDate,
  formatPercent,
  formatShortDate,
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

type MobileChartPoint = {
  accumulatedReturnPct: number;
  date: string;
  id: string;
  invested: number;
  isMonthStart: boolean;
  monthDate: string;
  monthLabel: string;
  monthlyReturnPct: number;
  value: number;
};

type MobileChartSeries = {
  highPoint?: MobileChartPoint;
  latestPoint?: MobileChartPoint;
  lowPoint?: MobileChartPoint;
  periodLabel: string;
  points: MobileChartPoint[];
  rangeReturnPct: number;
};

type MobileChartGeometry = {
  areaPath: string;
  gridLines: Array<{ y: number; label: string }>;
  linePath: string;
  latest?: { x: number; y: number };
  markers: Array<{ monthDate: string; point: MobileChartPoint; x: number; y: number }>;
  ticks: Array<{ label: string; x: number }>;
};

type MobileChartCardProps = {
  currentValue: string;
  onRangeChange: (range: RangeKey) => void;
  range: RangeKey;
  series: MobileChartSeries;
  totalReturnDisplay: string;
};

type MobileMonthlySortOrder = "newest" | "oldest";

type MobileMonthlyCardProps = {
  isExpanded: boolean;
  month: MonthlyInvestmentItem;
  onToggle: () => void;
  weeks: WeeklyInvestmentItem[];
};

const mobileChartRangeOptions = rangeOptions.filter((option) =>
  ["3M", "6M", "12M", "TODO"].includes(option),
);

const mobileWeekDayFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
});

const mobileWeekMonthFormatter = new Intl.DateTimeFormat("es-ES", {
  month: "short",
});

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

function formatMobileWeekRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  const startMonth = startDate.slice(0, 7);
  const endMonth = endDate.slice(0, 7);

  if (startMonth === endMonth) {
    const startDay = mobileWeekDayFormatter.format(start);
    const endDay = mobileWeekDayFormatter.format(end);
    const month = mobileWeekMonthFormatter
      .format(end)
      .replace(".", "")
      .toLowerCase();

    return `${startDay}-${endDay} ${month}`;
  }

  return `${formatShortDate(startDate).toLowerCase()} - ${formatShortDate(
    endDate,
  ).toLowerCase()}`;
}

function getDefaultMobileMonthlyExpandedMonth(
  monthlyDataItems: MonthlyInvestmentItem[],
) {
  const latestUsefulMonth = [...monthlyDataItems]
    .reverse()
    .find((month) => month.returnPct !== 0 || month.gain !== 0);

  return latestUsefulMonth?.date ?? monthlyDataItems.at(-1)?.date ?? null;
}

function formatMobileWeeksCount(weeks: WeeklyInvestmentItem[]) {
  if (!weeks.length) {
    return "Sin semanas";
  }

  return `${weeks.length} ${weeks.length === 1 ? "semana" : "semanas"}`;
}

function formatMobileAxisValue(value: number) {
  return `${Math.round(value / 1000)}K`;
}

function getCompoundReturnPct(items: MonthlyInvestmentItem[]) {
  return (
    (items.reduce((factor, item) => factor * (1 + item.returnPct / 100), 1) -
      1) *
    100
  );
}

function getWeeklyItemsForMonth(
  monthDate: string,
  weeklyDataItems: WeeklyInvestmentItem[],
) {
  return weeklyDataItems.filter((item) => item.monthDate === monthDate);
}

function buildMobileChartSeries(
  monthlyDataItems: MonthlyInvestmentItem[],
  weeklyDataItems: WeeklyInvestmentItem[],
  range: RangeKey,
): MobileChartSeries {
  const visibleMonths = filterDataByRange(monthlyDataItems, range);
  const accumulatedReturnByMonth = new Map<string, number>();
  let accumulatedFactor = 1;

  monthlyDataItems.forEach((month) => {
    accumulatedFactor *= 1 + month.returnPct / 100;
    accumulatedReturnByMonth.set(month.date, (accumulatedFactor - 1) * 100);
  });

  const points = visibleMonths.flatMap<MobileChartPoint>((month) => {
    const accumulatedReturnPct = accumulatedReturnByMonth.get(month.date) ?? 0;
    const monthLabel = formatCompactSpanishMonth(month.date);
    const weeklyItems = getWeeklyItemsForMonth(month.date, weeklyDataItems);
    const monthStartValue = month.initialValue + month.netCashFlow;
    let runningValue = monthStartValue;
    const monthStartPoint: MobileChartPoint = {
      date: month.date,
      id: `${month.date}-start`,
      invested: month.netCapitalContributed,
      isMonthStart: true,
      monthDate: month.date,
      monthLabel,
      monthlyReturnPct: month.returnPct,
      accumulatedReturnPct,
      value: monthStartValue,
    };

    if (!weeklyItems.length) {
      return [
        monthStartPoint,
        {
          date: month.date,
          id: `${month.date}-end`,
          invested: month.netCapitalContributed,
          isMonthStart: false,
          monthDate: month.date,
          monthLabel,
          monthlyReturnPct: month.returnPct,
          accumulatedReturnPct,
          value: month.finalValue,
        },
      ];
    }

    return [
      monthStartPoint,
      ...weeklyItems.map((week, weekIndex) => {
        runningValue *= 1 + week.returnPct / 100;

        return {
          date: week.endDate,
          id: week.id,
          invested: month.netCapitalContributed,
          isMonthStart: false,
          monthDate: month.date,
          monthLabel,
          monthlyReturnPct: month.returnPct,
          accumulatedReturnPct,
          value:
            weekIndex === weeklyItems.length - 1
              ? month.finalValue
              : runningValue,
        };
      }),
    ];
  });
  const highPoint = points.reduce<MobileChartPoint | undefined>(
    (highest, point) => (!highest || point.value > highest.value ? point : highest),
    undefined,
  );
  const lowPoint = points.reduce<MobileChartPoint | undefined>(
    (lowest, point) => (!lowest || point.value < lowest.value ? point : lowest),
    undefined,
  );
  const firstMonth = visibleMonths[0];
  const latestMonth = visibleMonths.at(-1);

  return {
    highPoint,
    latestPoint: points.at(-1),
    lowPoint,
    periodLabel:
      firstMonth && latestMonth
        ? `${formatCompactSpanishMonth(firstMonth.date)} - ${formatCompactSpanishMonth(
            latestMonth.date,
          )}`
        : "Sin datos",
    points,
    rangeReturnPct: getCompoundReturnPct(visibleMonths),
  };
}

function createMobileChartGeometry(
  points: MobileChartPoint[],
): MobileChartGeometry | null {
  if (points.length < 2) {
    return null;
  }

  const width = 320;
  const height = 176;
  const padding = {
    bottom: 36,
    left: 24,
    right: 22,
    top: 12,
  };
  const values = points.flatMap((point) => [point.value, point.invested]);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const lowerBound = Math.max(0, Math.floor((minValue * 0.86) / 500) * 500);
  const upperBound = Math.ceil((maxValue * 1.08) / 500) * 500;
  const valueRange = Math.max(1, upperBound - lowerBound);
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const scaleX = (index: number) =>
    padding.left + (points.length === 1 ? 0 : (plotWidth * index) / (points.length - 1));
  const scaleY = (value: number) =>
    padding.top + ((upperBound - value) / valueRange) * plotHeight;
  const coordinates = points.map((point, index) => ({
    point,
    x: scaleX(index),
    y: scaleY(point.value),
  }));
  const linePath = coordinates
    .map(({ x, y }, index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const first = coordinates[0];
  const latest = coordinates.at(-1);
  const baseline = height - padding.bottom;
  const areaPath =
    first && latest
      ? `${linePath} L ${latest.x.toFixed(2)} ${baseline} L ${first.x.toFixed(
          2,
        )} ${baseline} Z`
      : "";
  const gridValues = [upperBound, (upperBound + lowerBound) / 2, lowerBound];
  const monthStartCoordinates = coordinates.filter(({ point }) => point.isMonthStart);
  const markerMap = new Map<
    string,
    { monthDate: string; point: MobileChartPoint; x: number; y: number }
  >();

  coordinates.forEach(({ point, x, y }) => {
    markerMap.set(point.monthDate, {
      monthDate: point.monthDate,
      point,
      x,
      y,
    });
  });

  const tickStep = Math.max(1, Math.ceil(monthStartCoordinates.length / 4));
  const ticks = monthStartCoordinates
    .filter(
      (_, index) =>
        index % tickStep === 0 || index === monthStartCoordinates.length - 1,
    )
    .map(({ point, x }) => ({
      label: point.monthLabel,
      x,
    }));

  return {
    areaPath,
    gridLines: gridValues.map((value) => ({
      label: formatMobileAxisValue(value),
      y: scaleY(value),
    })),
    latest: latest ? { x: latest.x, y: latest.y } : undefined,
    linePath,
    markers: Array.from(markerMap.values()),
    ticks,
  };
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

function MobileMonthlyCard({
  isExpanded,
  month,
  onToggle,
  weeks,
}: MobileMonthlyCardProps) {
  const returnTone = getKpiTone(month.returnPct);
  const gainTone = getKpiTone(month.gain);
  const maxWeeklyReturn = Math.max(
    1,
    ...weeks.map((week) => Math.abs(week.returnPct)),
  );

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[1.35rem] border bg-[linear-gradient(145deg,rgba(31,34,29,0.96),rgba(18,21,18,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.055),0_12px_26px_rgba(0,0,0,0.24)]",
        isExpanded
          ? "border-positive/24 bg-[radial-gradient(circle_at_83%_13%,rgba(34,197,94,0.18),transparent_36%),linear-gradient(145deg,rgba(31,34,29,0.98),rgba(13,18,15,0.98))]"
          : "border-white/[0.08]",
      )}
    >
      <button
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? "Contraer" : "Expandir"} ${month.month}`}
        className="grid w-full grid-cols-[minmax(0,1fr)_auto_2rem] items-center gap-3 px-4 py-4 text-left"
        onClick={onToggle}
        type="button"
      >
        <span className="min-w-0">
          <span className="block truncate text-[1rem] font-black leading-tight tracking-[-0.035em] text-card-foreground">
            {month.month}
          </span>
          <span className="mt-1 block truncate text-[0.66rem] font-extrabold leading-tight text-muted-foreground">
            {formatWholeCurrency(month.finalValue)} · {formatMobileWeeksCount(weeks)}
          </span>
        </span>
        <span
          className={cn(
            "shrink-0 pr-1 text-[1.45rem] font-black leading-none tracking-[-0.055em]",
            mobileMetricToneStyles[returnTone].value,
          )}
        >
          {formatPercent(month.returnPct, { sign: true })}
        </span>
        <span
          className={cn(
            "grid size-8 place-items-center rounded-full border bg-black/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.055)]",
            isExpanded
              ? "border-positive/22 text-positive"
              : "border-white/[0.08] text-card-foreground/72",
          )}
        >
          <ChevronDown
            className={cn("size-4", isExpanded && "rotate-180")}
            strokeWidth={2.3}
          />
        </span>
      </button>

      {isExpanded ? (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-[0.95rem] border border-white/[0.05] bg-black/18 px-3 py-2.5">
              <p className="text-[0.62rem] font-black uppercase tracking-[0.13em] text-muted-foreground">
                Inicial
              </p>
              <p className="mt-1 text-[0.82rem] font-black tracking-[-0.035em] text-card-foreground">
                {formatWholeCurrency(month.initialValue)}
              </p>
            </div>
            <div className="rounded-[0.95rem] border border-white/[0.05] bg-black/18 px-3 py-2.5">
              <p className="text-[0.62rem] font-black uppercase tracking-[0.13em] text-muted-foreground">
                Final
              </p>
              <p className="mt-1 text-[0.82rem] font-black tracking-[-0.035em] text-card-foreground">
                {formatWholeCurrency(month.finalValue)}
              </p>
            </div>
            <div className="rounded-[0.95rem] border border-white/[0.05] bg-black/18 px-3 py-2.5">
              <p className="text-[0.62rem] font-black uppercase tracking-[0.13em] text-muted-foreground">
                Beneficio
              </p>
              <p
                className={cn(
                  "mt-1 text-[0.82rem] font-black tracking-[-0.035em]",
                  mobileMetricToneStyles[gainTone].value,
                )}
              >
                {formatWholeCurrency(month.gain, { sign: true })}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2.5">
            {weeks.map((week) => {
              const weeklyTone = getKpiTone(week.returnPct);
              const width = Math.max(
                8,
                Math.round((Math.abs(week.returnPct) / maxWeeklyReturn) * 100),
              );

              return (
                <div
                  className="grid grid-cols-[5.25rem_minmax(0,1fr)_4.05rem] items-center gap-2"
                  key={week.id}
                >
                  <p className="truncate text-[0.66rem] font-black tracking-[-0.02em] text-card-foreground">
                    {formatMobileWeekRange(week.startDate, week.endDate)}
                  </p>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className={cn(
                        "h-full rounded-full shadow-[0_0_14px_rgba(45,242,139,0.26)]",
                        weeklyTone === "negative"
                          ? "bg-danger"
                          : weeklyTone === "positive"
                            ? "bg-positive"
                            : "bg-card-foreground/40",
                      )}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <p
                    className={cn(
                      "whitespace-nowrap text-right text-[0.66rem] font-black tabular-nums",
                      mobileMetricToneStyles[weeklyTone].value,
                    )}
                  >
                    {formatPercent(week.returnPct, { sign: true })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function MobileInvestmentChartCard({
  currentValue,
  onRangeChange,
  range,
  series,
  totalReturnDisplay,
}: MobileChartCardProps) {
  const [selectedMonthDate, setSelectedMonthDate] = useState<string | null>(null);
  const geometry = useMemo(
    () => createMobileChartGeometry(series.points),
    [series.points],
  );
  const selectedMarker = geometry?.markers.find(
    (marker) => marker.monthDate === selectedMonthDate,
  );
  const rangeTone = getKpiTone(series.rangeReturnPct);
  const rangeStyles = mobileMetricToneStyles[rangeTone];

  return (
    <section className="relative overflow-hidden rounded-[1.65rem] border border-white/[0.09] bg-[radial-gradient(circle_at_78%_34%,rgba(34,197,94,0.2),transparent_43%),linear-gradient(135deg,#1b1e19_0%,#141713_56%,#0a160f_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_38px_rgba(0,0,0,0.3)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.04),transparent_36%),radial-gradient(circle_at_86%_80%,rgba(16,185,129,0.13),transparent_42%)]" />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.66rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
              Evolucion
            </p>
            <p className="mt-3 text-[2.28rem] font-black leading-none tracking-[-0.06em] text-white">
              {currentValue}
            </p>
          </div>
          <span
            className={cn(
              "mt-1 inline-flex shrink-0 items-center rounded-full border px-2.5 py-1.5 text-[0.62rem] font-black shadow-[0_10px_24px_rgba(16,185,129,0.12)]",
              rangeTone === "negative"
                ? "border-danger/25 bg-danger-soft text-danger"
                : rangeTone === "positive"
                  ? "border-positive/25 bg-positive-soft text-white"
                  : "border-white/10 bg-white/8 text-white",
            )}
          >
            {totalReturnDisplay}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1 rounded-full border border-white/[0.08] bg-black/18 p-1">
          {mobileChartRangeOptions.map((option) => {
            const isSelected = range === option;

            return (
              <button
                aria-pressed={isSelected}
                className={cn(
                  "h-7 rounded-full text-[0.55rem] font-black uppercase tracking-[0.08em] text-white/48",
                  isSelected &&
                    "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]",
                )}
                key={option}
                onClick={() => {
                  setSelectedMonthDate(null);
                  onRangeChange(option);
                }}
                type="button"
              >
                {option === "TODO" ? "Todo" : option}
              </button>
            );
          })}
        </div>

        <div className="relative mt-3 h-[196px] overflow-hidden rounded-[1.15rem] bg-black/10 px-2 pb-2 pt-3">
          {!geometry ? (
            <div className="grid h-full place-items-center text-[0.72rem] text-muted-foreground">
              Sin datos suficientes.
            </div>
          ) : (
            <>
              <svg
                aria-label="Grafico de evolucion semanal de la inversion"
                className="h-full w-full overflow-visible"
                role="img"
                viewBox="0 0 320 176"
              >
                <defs>
                  <linearGradient id="mobile-investment-area" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#28e184" stopOpacity="0.38" />
                    <stop offset="62%" stopColor="#28e184" stopOpacity="0.13" />
                    <stop offset="100%" stopColor="#28e184" stopOpacity="0" />
                  </linearGradient>
                  <filter id="mobile-chart-glow" x="-20%" y="-60%" width="140%" height="220%">
                    <feGaussianBlur stdDeviation="3.2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {geometry.gridLines.map((line) => (
                  <g key={line.label}>
                    <line
                      stroke="rgba(255,255,255,0.08)"
                      strokeDasharray="3 7"
                      x1="18"
                      x2="302"
                      y1={line.y}
                      y2={line.y}
                    />
                    <text
                      fill="rgba(255,255,255,0.38)"
                      fontSize="8"
                      fontWeight="700"
                      textAnchor="end"
                      x="304"
                      y={line.y - 4}
                    >
                      {line.label}
                    </text>
                  </g>
                ))}
                <path d={geometry.areaPath} fill="url(#mobile-investment-area)" />
                <path
                  d={geometry.linePath}
                  fill="none"
                  filter="url(#mobile-chart-glow)"
                  stroke="#28e184"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3.2"
                />
                {selectedMarker ? (
                  <line
                    stroke="rgba(186, 230, 253, 0.46)"
                    strokeWidth="1"
                    x1={selectedMarker.x}
                    x2={selectedMarker.x}
                    y1="12"
                    y2="140"
                  />
                ) : null}
                {geometry.markers.map((marker) => {
                  const isSelected =
                    selectedMarker?.monthDate === marker.monthDate;
                  const isLatest =
                    series.latestPoint?.monthDate === marker.monthDate;

                  return (
                    <circle
                      cx={marker.x}
                      cy={marker.y}
                      fill={isSelected || isLatest ? "#28e184" : "#0b2015"}
                      key={marker.monthDate}
                      r={isSelected ? "5.4" : isLatest ? "4.8" : "3.6"}
                      stroke={
                        isSelected
                          ? "#f8fff9"
                          : isLatest
                            ? "#dcfce7"
                            : "rgba(40,225,132,0.74)"
                      }
                      strokeWidth={isSelected || isLatest ? "2" : "1.6"}
                    />
                  );
                })}
                {geometry.latest && !geometry.markers.length ? (
                  <circle
                    cx={geometry.latest.x}
                    cy={geometry.latest.y}
                    fill="#28e184"
                    r="4.2"
                    stroke="#dcfce7"
                    strokeWidth="2"
                  />
                ) : null}
                {geometry.ticks.map((tick) => (
                  <text
                    fill="rgba(255,255,255,0.42)"
                    fontSize="8"
                    fontWeight="800"
                    key={`${tick.label}-${tick.x}`}
                    textAnchor="middle"
                    x={tick.x}
                    y="168"
                  >
                    {tick.label}
                  </text>
                ))}
              </svg>
              <div className="absolute inset-x-2 bottom-2 top-3 z-20">
                {geometry.markers.map((marker) => (
                  <button
                    aria-label={`Ver detalle de ${marker.point.monthLabel}`}
                    className="absolute size-10 -translate-x-1/2 -translate-y-1/2 rounded-full touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-positive/50"
                    key={marker.monthDate}
                    onClick={() =>
                      setSelectedMonthDate((currentMonthDate) =>
                        currentMonthDate === marker.monthDate
                          ? null
                          : marker.monthDate,
                      )
                    }
                    style={{
                      left: `${(marker.x / 320) * 100}%`,
                      top: `${(marker.y / 176) * 100}%`,
                    }}
                    type="button"
                  />
                ))}
              </div>
              {selectedMarker ? (
                <div
                  className="pointer-events-auto absolute top-7 z-30 w-[15rem] rounded-[0.85rem] border border-white/12 bg-[#0b1720]/95 px-3 py-3 text-[0.68rem] shadow-[0_18px_42px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                  style={
                    selectedMarker.x < 164
                      ? { left: "0.9rem" }
                      : { right: "0.9rem" }
                  }
                >
                  <button
                    aria-label="Cerrar detalle mensual"
                    className="absolute right-2 top-2 grid size-7 place-items-center rounded-full text-card-foreground/58 transition-colors hover:bg-white/8 hover:text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-positive/50"
                    onClick={() => setSelectedMonthDate(null)}
                    type="button"
                  >
                    <X className="size-3.5" strokeWidth={2.2} />
                  </button>
                  <p className="pr-8 font-black text-card-foreground">
                    {formatFullDate(selectedMarker.point.monthDate)}
                  </p>
                  <div className="mt-2.5 grid gap-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-card-foreground/62">Valor</span>
                      <span className="font-black text-positive">
                        {formatWholeCurrency(selectedMarker.point.value)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-card-foreground/62">
                        Capital neto aportado
                      </span>
                      <span className="font-black text-card-foreground">
                        {formatWholeCurrency(selectedMarker.point.invested)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-card-foreground/62">
                        Rentabilidad mensual
                      </span>
                      <span
                        className={cn(
                          "font-black",
                          mobileMetricToneStyles[
                            getKpiTone(selectedMarker.point.monthlyReturnPct)
                          ].value,
                        )}
                      >
                        {formatPercent(selectedMarker.point.monthlyReturnPct, {
                          sign: true,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-card-foreground/62">
                        Rentabilidad acumulada
                      </span>
                      <span
                        className={cn(
                          "font-black",
                          mobileMetricToneStyles[
                            getKpiTone(selectedMarker.point.accumulatedReturnPct)
                          ].value,
                        )}
                      >
                        {formatPercent(
                          selectedMarker.point.accumulatedReturnPct,
                          { sign: true },
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 text-[0.58rem] font-semibold text-muted-foreground">
          <span>{series.periodLabel}</span>
          <span className={rangeStyles.value}>
            {formatPercent(series.rangeReturnPct, { sign: true })}
          </span>
        </div>
      </div>
    </section>
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
  const [isMobileAccountMenuOpen, setIsMobileAccountMenuOpen] = useState(
    Boolean(requiresPasswordChange || passwordError || passwordStatus),
  );
  const [activeMobileTab, setActiveMobileTab] =
    useState<MobileInvestorTab>("summary");
  const [activeMobileInfo, setActiveMobileInfo] = useState<string | null>(null);
  const [mobileChartRange, setMobileChartRange] =
    useState<RangeKey>("TODO");
  const [mobileMonthlySortOrder, setMobileMonthlySortOrder] =
    useState<MobileMonthlySortOrder>("newest");
  const [expandedMobileMonth, setExpandedMobileMonth] = useState<string | null>(
    () => getDefaultMobileMonthlyExpandedMonth(data.monthlyData),
  );
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
  const mobileChartSeries = useMemo(
    () =>
      buildMobileChartSeries(
        data.monthlyData,
        data.weeklyData,
        mobileChartRange,
      ),
    [data.monthlyData, data.weeklyData, mobileChartRange],
  );
  const mobileMonthlyRows = useMemo(() => {
    return [...data.monthlyData].sort((left, right) =>
      mobileMonthlySortOrder === "newest"
        ? right.date.localeCompare(left.date)
        : left.date.localeCompare(right.date),
    );
  }, [data.monthlyData, mobileMonthlySortOrder]);

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

    if (isMobile) {
      return (
        <>
          <button
            aria-expanded={isMobileAccountMenuOpen}
            aria-label="Abrir ajustes de cuenta"
            className="flex cursor-pointer list-none items-center gap-3 rounded-full pr-3 text-left"
            onClick={() => setIsMobileAccountMenuOpen(true)}
            type="button"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary ring-1 ring-primary/25">
              {investorInitials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block max-w-[178px] truncate text-[0.9rem] font-semibold text-card-foreground">
                {displayInvestorName}
              </span>
              <span className="mt-0.5 block text-[0.55rem] font-black uppercase tracking-[0.26em] text-muted-foreground">
                Oro Negro
              </span>
            </span>
          </button>

          {isMobileAccountMenuOpen ? (
            <div
              aria-labelledby="mobile-account-settings-title"
              aria-modal="true"
              className="fixed inset-0 z-50 bg-black/62 px-3 py-[calc(env(safe-area-inset-top)+0.9rem)] backdrop-blur-xl"
              role="dialog"
            >
              {requiresPasswordChange ? null : (
                <button
                  aria-label="Cerrar panel de ajustes"
                  className="absolute inset-0 cursor-default"
                  onClick={() => setIsMobileAccountMenuOpen(false)}
                  type="button"
                />
              )}
              <div className="no-scrollbar relative mx-auto flex h-full max-w-[28rem] flex-col overflow-y-auto rounded-[2rem] border border-white/[0.08] bg-[#0b0c0b] px-5 pb-5 pt-4 shadow-[0_28px_80px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="mb-7 grid grid-cols-[3rem_1fr_3rem] items-center">
                  {requiresPasswordChange ? (
                    <span />
                  ) : (
                    <button
                      aria-label="Cerrar ajustes"
                      className="grid size-11 place-items-center rounded-full border border-white/[0.08] bg-white/[0.055] text-card-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      onClick={() => setIsMobileAccountMenuOpen(false)}
                      type="button"
                    >
                      <X className="size-5" strokeWidth={2.3} />
                    </button>
                  )}
                  <h2
                    className="text-center text-[0.68rem] font-black uppercase tracking-[0.34em] text-card-foreground"
                    id="mobile-account-settings-title"
                  >
                    Ajustes
                  </h2>
                  <span />
                </div>

                <div className="overflow-hidden rounded-[1.55rem] border border-white/[0.08] bg-[rgba(42,40,35,0.88)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <div className="flex min-h-16 items-center gap-3 rounded-[1.1rem] px-3 py-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
                      <UserRound className="size-4" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-card-foreground">
                        Perfil
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {displayInvestorName} · {investorEmail}
                      </span>
                    </span>
                  </div>

                  <div className="my-1 h-px bg-white/[0.08]" />

                  <PasswordChangeForm
                    forceChange={requiresPasswordChange}
                    next="/inversor"
                    passwordAction={changeInvestorPassword}
                    passwordError={passwordError}
                    passwordStatus={passwordStatus}
                    summaryLabel="Cuenta y seguridad"
                  />

                  <div className="my-1 h-px bg-white/[0.08]" />

                  <form action="/auth/signout" method="post">
                    <button
                      className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-card-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
                      type="submit"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                        <LogOut className="size-4" strokeWidth={1.9} />
                      </span>
                      Cerrar sesion
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : null}
        </>
      );
    }

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

  function renderMobileChart() {
    return (
      <div className="h-full pb-8">
        <div className="mb-3">
          <h1 className="text-[2rem] font-black leading-none tracking-[-0.055em] text-white">
            Grafico
          </h1>
        </div>

        <MobileInvestmentChartCard
          currentValue={formatWholeCurrency(investmentSummary.currentValue)}
          onRangeChange={setMobileChartRange}
          range={mobileChartRange}
          series={mobileChartSeries}
          totalReturnDisplay={`${totalReturnDisplay} total`}
        />
      </div>
    );
  }

  function renderMobileMonthly() {
    const sortLabel =
      mobileMonthlySortOrder === "newest"
        ? "Reciente primero"
        : "Antiguo primero";

    return (
      <div className="h-full pb-8">
        <div className="mb-5">
          <h1 className="text-[2rem] font-black leading-none tracking-[-0.055em] text-white">
            Mensual
          </h1>
        </div>

        <div className="mb-3 flex items-center px-0.5">
          <div className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.045] py-0.5 pl-0.5 pr-3 text-[0.66rem] font-black text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.055)]">
            <button
              aria-label={`Cambiar orden. Orden actual: ${sortLabel}`}
              className="grid size-7 place-items-center rounded-full text-card-foreground/82 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-positive/45"
              onClick={() =>
                setMobileMonthlySortOrder((currentOrder) =>
                  currentOrder === "newest" ? "oldest" : "newest",
                )
              }
              type="button"
            >
              <ArrowUpDown className="size-3.5" strokeWidth={2} />
            </button>
            <span>{sortLabel}</span>
          </div>
        </div>

        <section className="grid gap-3">
          {mobileMonthlyRows.map((month) => {
            const weeks = getWeeklyItemsForMonth(month.date, data.weeklyData);
            const isExpanded = expandedMobileMonth === month.date;

            return (
              <MobileMonthlyCard
                isExpanded={isExpanded}
                key={month.date}
                month={month}
                onToggle={() =>
                  setExpandedMobileMonth((currentMonth) =>
                    currentMonth === month.date ? null : month.date,
                  )
                }
                weeks={weeks}
              />
            );
          })}
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
              : activeMobileTab === "chart"
                ? renderMobileChart()
              : activeMobileTab === "insights"
                ? renderMobileInsights()
              : activeMobileTab === "monthly"
                ? renderMobileMonthly()
              : renderMobileEmptyTab()}
          </section>
        </div>

        <nav
          aria-label="Navegacion del panel inversor"
          className={cn(
            "fixed bottom-[calc(env(safe-area-inset-bottom)+0.65rem)] left-1/2 z-30 flex h-[3.87rem] w-[85vw] max-w-[20.75rem] -translate-x-1/2 items-stretch gap-[0.1rem] overflow-hidden rounded-[2.15rem] border border-white/[0.12] bg-[rgba(14,14,13,0.74)] p-[0.32rem] shadow-[0_-12px_34px_rgba(0,0,0,0.48),0_0_0_1px_rgba(255,255,255,0.035),inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-1px_0_rgba(0,0,0,0.58)] backdrop-blur-2xl",
            isMobileAccountMenuOpen && "pointer-events-none opacity-0",
          )}
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
