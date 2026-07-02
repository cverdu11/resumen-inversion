"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Label,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  compoundWeeklyReturn,
  filterDataByRange,
  getWeeklyDataForMonths,
  monthlyInvestmentData,
  rangeOptions,
  weeklyInvestmentData,
  type MonthlyInvestmentItem,
  type RangeKey,
  type WeeklyInvestmentItem,
} from "@/lib/investment-data";
import {
  formatAxisMonth,
  formatCompactCurrency,
  formatCurrency,
  formatFullDate,
  formatPercent,
  valueTone,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";

type ChartDatum = MonthlyInvestmentItem & {
  invested: number;
  value: number;
  accumulatedReturnPct: number;
  periodReturnPct: number;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: ChartDatum }>;
};

const annotationColors = {
  positive: {
    fill: "rgba(21, 128, 61, 0.96)",
    stroke: "rgba(74, 222, 128, 0.42)",
    text: "#ecfdf5",
    detail: "#bbf7d0",
  },
  neutral: {
    fill: "rgba(30, 41, 59, 0.96)",
    stroke: "rgba(203, 213, 225, 0.32)",
    text: "#f8fafc",
    detail: "#cbd5e1",
  },
  negative: {
    fill: "rgba(127, 29, 29, 0.96)",
    stroke: "rgba(248, 113, 113, 0.42)",
    text: "#fff1f2",
    detail: "#fecaca",
  },
};

type AnnotationLabelProps = {
  viewBox?: unknown;
  title: string;
  detail?: string;
  tone: keyof typeof annotationColors;
  align?: "start" | "middle" | "end";
  offsetX?: number;
  offsetY?: number;
};

function getAnnotationWidth(title: string, detail?: string) {
  const titleWidth = title.length * 7;
  const detailWidth = detail ? detail.length * 6 : 0;

  return Math.ceil(Math.max(68, titleWidth, detailWidth) + 18);
}

function getCartesianLabelPoint(viewBox: unknown) {
  if (!viewBox || typeof viewBox !== "object") {
    return { x: 0, y: 0 };
  }

  const candidate = viewBox as { x?: unknown; y?: unknown };

  return {
    x: typeof candidate.x === "number" ? candidate.x : 0,
    y: typeof candidate.y === "number" ? candidate.y : 0,
  };
}

function AnnotationLabel({
  viewBox,
  title,
  detail,
  tone,
  align = "start",
  offsetX = 0,
  offsetY = -16,
}: AnnotationLabelProps) {
  const colors = annotationColors[tone];
  const point = getCartesianLabelPoint(viewBox);
  const x = point.x + offsetX;
  const y = point.y + offsetY;
  const width = getAnnotationWidth(title, detail);
  const height = detail ? 40 : 28;
  const rectX =
    align === "end" ? -width : align === "middle" ? -width / 2 : 0;
  const textX =
    align === "end" ? -width + 9 : align === "middle" ? -width / 2 + 9 : 9;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x={rectX}
        y={-height}
        width={width}
        height={height}
        rx={8}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={1}
        style={{ filter: "drop-shadow(0 8px 18px rgba(0, 0, 0, 0.22))" }}
      />
      <rect
        x={rectX + 1}
        y={-height + 1}
        width={3}
        height={height - 2}
        rx={2}
        fill={colors.detail}
        opacity={0.72}
      />
      <text
        x={textX}
        y={detail ? -22 : -9}
        fill={colors.text}
        fontSize={12}
        fontWeight={700}
      >
        {title}
      </text>
      {detail ? (
        <text x={textX} y={-7} fill={colors.detail} fontSize={11}>
          {detail}
        </text>
      ) : null}
    </g>
  );
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const datum = payload[0]?.payload;

  if (!datum) {
    return null;
  }

  return (
    <div className="min-w-64 rounded-lg border bg-popover/95 p-4 text-sm shadow-2xl backdrop-blur">
      <p className="font-semibold text-popover-foreground">
        {formatFullDate(datum.date)}
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Valor</span>
          <span
            className={cn(
              "font-semibold tabular-nums",
              valueTone(datum.accumulatedReturnPct),
            )}
          >
            {formatCurrency(datum.finalValue)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Capital neto aportado</span>
          <span className="font-semibold tabular-nums text-card-foreground">
            {formatCurrency(datum.netCapitalContributed)}
          </span>
        </div>
        {datum.contributions > 0 ? (
          <div className="flex items-center justify-between gap-6">
            <span className="text-muted-foreground">Aportaciones</span>
            <span className="font-semibold tabular-nums text-positive">
              {formatCurrency(datum.contributions, { sign: true })}
            </span>
          </div>
        ) : null}
        {datum.withdrawals > 0 ? (
          <div className="flex items-center justify-between gap-6">
            <span className="text-muted-foreground">Retiradas</span>
            <span className="font-semibold tabular-nums text-danger">
              {formatCurrency(-datum.withdrawals, { sign: true })}
            </span>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Rentabilidad mensual</span>
          <span
            className={cn(
              "font-semibold tabular-nums",
              valueTone(datum.returnPct),
            )}
          >
            {formatPercent(datum.returnPct, { sign: true })}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Rentabilidad acumulada</span>
          <span
            className={cn(
              "font-semibold tabular-nums",
              valueTone(datum.accumulatedReturnPct),
            )}
          >
            {formatPercent(datum.accumulatedReturnPct, { sign: true })}
          </span>
        </div>
      </div>
    </div>
  );
}

function getTickDates(data: ChartDatum[]) {
  if (data.length <= 8) {
    return data.map((item) => item.date);
  }

  const step = data.length > 18 ? 2 : 2;
  const ticks = data
    .filter((_, index) => index % step === 0)
    .map((item) => item.date);
  const latest = data.at(-1)?.date;

  if (latest && !ticks.includes(latest)) {
    ticks.push(latest);
  }

  return ticks;
}

function useCompactChart() {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const update = () => setIsCompact(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return isCompact;
}

function WeeklyRangeSummary({ weeks }: { weeks: WeeklyInvestmentItem[] }) {
  if (!weeks.length) {
    return null;
  }

  const compoundReturn = compoundWeeklyReturn(weeks);
  const bestWeek = weeks.reduce((best, item) =>
    item.returnPct > best.returnPct ? item : best,
  );
  const worstWeek = weeks.reduce((worst, item) =>
    item.returnPct < worst.returnPct ? item : worst,
  );
  const positiveWeeks = weeks.filter((item) => item.returnPct >= 0).length;
  const negativeWeeks = weeks.length - positiveWeeks;
  const compoundTone =
    compoundReturn >= 0
      ? "bg-positive-soft text-positive"
      : "bg-danger-soft text-danger";

  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 rounded-lg border border-border/60 bg-background/35 px-3 py-2 text-[0.72rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:gap-x-3 sm:text-xs">
      <span className="font-medium text-card-foreground/90">
        Semanal neto
      </span>
      <span
        className={cn(
          "rounded-md px-2 py-0.5 font-semibold tabular-nums",
          compoundTone,
        )}
      >
        {formatPercent(compoundReturn, { sign: true })}
      </span>
      <span className="text-muted-foreground">
        {weeks.length} semanas
      </span>
      <span className="hidden h-3 w-px bg-border/70 sm:block" />
      <span className="hidden text-muted-foreground sm:inline">
        {positiveWeeks} positivas / {negativeWeeks} negativas
      </span>
      <span className="hidden h-3 w-px bg-border/70 sm:block" />
      <span className="font-medium text-positive tabular-nums">
        Mejor {formatPercent(bestWeek.returnPct, { sign: true })}
      </span>
      <span className="font-medium text-danger tabular-nums">
        Peor {formatPercent(worstWeek.returnPct, { sign: true })}
      </span>
    </div>
  );
}

export function InvestmentChartCard({
  monthlyData = monthlyInvestmentData,
  weeklyData = weeklyInvestmentData,
}: {
  monthlyData?: MonthlyInvestmentItem[];
  weeklyData?: WeeklyInvestmentItem[];
}) {
  const [range, setRange] = useState<RangeKey>("TODO");
  const isCompactChart = useCompactChart();
  const visibleData = useMemo(
    () => filterDataByRange(monthlyData, range),
    [monthlyData, range],
  );
  const visibleWeeklyData = useMemo(
    () => getWeeklyDataForMonths(visibleData, weeklyData),
    [visibleData, weeklyData],
  );
  const periodStartValue = visibleData[0]?.initialValue ?? 0;
  const chartData = useMemo<ChartDatum[]>(
    () =>
      visibleData.reduce<ChartDatum[]>((items, item) => {
        const previousReturnPct = items.at(-1)?.periodReturnPct ?? 0;
        const previousFactor = 1 + previousReturnPct / 100;
        const periodFactor = previousFactor * (1 + item.returnPct / 100);

        return [
          ...items,
          {
            ...item,
            invested: item.netCapitalContributed,
            value: item.finalValue,
            accumulatedReturnPct: (periodFactor - 1) * 100,
            periodReturnPct: (periodFactor - 1) * 100,
          },
        ];
      }, []),
    [visibleData],
  );
  const yDomain = useMemo<[number, number]>(() => {
    if (!chartData.length) {
      return [0, 100];
    }

    const values = [
      periodStartValue,
      ...chartData.flatMap((item) => [
        item.finalValue,
        item.invested,
      ]),
    ];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max(260, (max - min) * 0.18);

    return [
      Math.floor((min - padding) / 100) * 100,
      Math.ceil((max + padding) / 100) * 100,
    ];
  }, [chartData, periodStartValue]);
  const ticks = useMemo(() => getTickDates(chartData), [chartData]);
  const chartMargin = useMemo(
    () =>
      isCompactChart
        ? { top: 34, right: 8, left: 0, bottom: 8 }
        : { top: 40, right: 30, left: 0, bottom: 16 },
    [isCompactChart],
  );
  const yAxisWidth = isCompactChart ? 68 : 76;

  const startDatum = chartData[0];
  const latestDatum = chartData.at(-1);
  const startY = periodStartValue;
  const startTitle = formatCurrency(periodStartValue);
  const startDetail = undefined;
  const periodReturnPct = latestDatum?.periodReturnPct ?? 0;
  const investmentIsPositive = periodReturnPct >= 0;
  const valueStroke = investmentIsPositive ? "#28e184" : "#ff5d5d";
  const valueDotStroke = investmentIsPositive ? "#dcfce7" : "#fecaca";
  const valueAreaColor = investmentIsPositive ? "#28e184" : "#ff5d5d";
  const latestAnnotationTone = investmentIsPositive ? "positive" : "negative";
  const selectedRangeToneClass = investmentIsPositive
    ? "data-[state=on]:bg-positive-soft data-[state=on]:text-positive data-[state=on]:shadow-[0_0_18px_rgba(34,197,94,0.16)]"
    : "data-[state=on]:bg-danger-soft data-[state=on]:text-danger data-[state=on]:shadow-[0_0_18px_rgba(239,68,68,0.14)]";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-col gap-3 p-4 sm:gap-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle className="text-sm font-semibold uppercase sm:text-base">
            Evolución del valor de la inversión
          </CardTitle>
          <CardDescription className="mt-1.5 sm:mt-2">
            Valor de la inversión (€)
          </CardDescription>
        </div>
        <div className="no-scrollbar -mx-1 w-full overflow-x-auto px-1 pb-1 lg:w-auto">
          <ToggleGroup
            type="single"
            value={range}
            className="min-w-max"
            onValueChange={(value) => {
              if (value) {
                setRange(value as RangeKey);
              }
            }}
            aria-label="Seleccionar rango de fechas"
          >
            {rangeOptions.map((option) => (
              <ToggleGroupItem
                key={option}
                value={option}
                aria-label={`Rango ${option}`}
                className={selectedRangeToneClass}
              >
                {option}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
        {!chartData.length ? (
          <div className="grid h-[320px] place-items-center rounded-md border bg-muted/18 text-sm text-muted-foreground sm:h-[430px]">
            Sin datos de inversion todavia.
          </div>
        ) : (
          <>
        <div className="mb-4 flex flex-col gap-3 sm:mb-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm sm:gap-5">
            <div className="flex items-center gap-2 text-card-foreground/88">
              <span
                className={cn(
                  "h-0.5 w-9 rounded-full",
                  investmentIsPositive ? "bg-positive" : "bg-danger",
                )}
              />
              Valor actual
            </div>
            <div className="flex items-center gap-2 text-card-foreground/88">
              <span className="h-0.5 w-9 rounded-full border-t border-dashed border-muted-foreground/70" />
              Capital neto aportado
            </div>
          </div>
          <WeeklyRangeSummary weeks={visibleWeeklyData} />
        </div>
        <div>
          <div className="h-[320px] min-w-0 sm:h-[430px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={chartMargin}
              >
                <defs>
                  <linearGradient id="investmentArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={valueAreaColor} stopOpacity={0.34} />
                    <stop offset="62%" stopColor={valueAreaColor} stopOpacity={0.1} />
                    <stop offset="100%" stopColor={valueAreaColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="rgba(148, 163, 184, 0.14)"
                  strokeDasharray="4 6"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  ticks={ticks}
                  tickFormatter={formatAxisMonth}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(148, 163, 184, 0.34)" }}
                  tickMargin={12}
                  minTickGap={18}
                />
                <YAxis
                  width={yAxisWidth}
                  domain={yDomain}
                  tickFormatter={(value) => formatCompactCurrency(Number(value))}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(148, 163, 184, 0.34)" }}
                  tickMargin={10}
                />
                <RechartsTooltip
                  cursor={{ stroke: "rgba(148, 163, 184, 0.35)", strokeWidth: 1 }}
                  content={<ChartTooltip />}
                />
                <Line
                  type="stepAfter"
                  dataKey="invested"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="7 7"
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
                {chartData
                  .filter((item) => item.netCashFlow !== 0)
                  .map((item) => {
                    const isContribution = item.netCashFlow > 0;

                    return (
                      <ReferenceDot
                        key={`cash-flow-${item.date}`}
                        x={item.date}
                        y={item.netCapitalContributed}
                        r={isCompactChart ? 4 : 5}
                        fill={isContribution ? "#28e184" : "#ff5d5d"}
                        stroke={isContribution ? "#bbf7d0" : "#fecaca"}
                        strokeWidth={2}
                      />
                    );
                  })}
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={valueStroke}
                  strokeWidth={3}
                  fill="url(#investmentArea)"
                  dot={false}
                  isAnimationActive={false}
                  activeDot={{
                    r: isCompactChart ? 5 : 6,
                    stroke: "#ecfdf5",
                    strokeWidth: 2,
                    fill: valueStroke,
                  }}
                />
                {startDatum ? (
                  <ReferenceDot
                    x={startDatum.date}
                    y={startY}
                    r={isCompactChart ? 4 : 5}
                    fill="#94a3b8"
                    stroke="#e2e8f0"
                    strokeWidth={2}
                  >
                    <Label
                      content={(props) => (
                        <AnnotationLabel
                          {...props}
                          title={startTitle}
                          detail={startDetail}
                          tone="neutral"
                          offsetX={isCompactChart ? 8 : 12}
                        />
                      )}
                    />
                  </ReferenceDot>
                ) : null}
                {latestDatum ? (
                  <ReferenceDot
                    x={latestDatum.date}
                    y={latestDatum.finalValue}
                    r={isCompactChart ? 4 : 5}
                    fill={valueStroke}
                    stroke={valueDotStroke}
                    strokeWidth={2}
                  >
                    <Label
                      content={(props) => (
                        <AnnotationLabel
                          {...props}
                          title={formatCurrency(latestDatum.finalValue)}
                          detail={formatPercent(
                            latestDatum.periodReturnPct,
                            {
                              sign: true,
                            },
                          )}
                          tone={latestAnnotationTone}
                          align="end"
                          offsetX={isCompactChart ? -8 : -12}
                        />
                      )}
                    />
                  </ReferenceDot>
                ) : null}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
