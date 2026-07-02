import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Clock3,
  Flame,
  Target,
  Trophy,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPercent } from "@/lib/formatters";
import {
  getPreviousMonthLabel,
  investmentSummary as defaultInvestmentSummary,
  type InvestmentSummary,
  type MonthlyInvestmentItem,
  monthlyInvestmentData,
} from "@/lib/investment-data";
import { cn } from "@/lib/utils";

type InsightTone = "neutral" | "positive" | "negative";

const toneStyles: Record<
  InsightTone,
  { iconWrap: string; icon: string; value: string }
> = {
  neutral: {
    iconWrap: "bg-muted/70 ring-border",
    icon: "text-muted-foreground",
    value: "text-foreground",
  },
  positive: {
    iconWrap: "bg-positive-soft ring-positive/20",
    icon: "text-positive",
    value: "text-positive",
  },
  negative: {
    iconWrap: "bg-danger-soft ring-danger/20",
    icon: "text-danger",
    value: "text-danger",
  },
};

type InsightItem = {
  icon: LucideIcon;
  title: string;
  detail: string;
  value: string;
  tone: InsightTone;
};

function getLatestTwelveLabel(
  monthlyData: MonthlyInvestmentItem[],
  fallbackLabel: string,
) {
  const latestTwelve = monthlyData.slice(-12);

  if (latestTwelve.length <= 1) {
    return fallbackLabel;
  }

  return `${latestTwelve[0].month} - ${latestTwelve.at(-1)?.month}`;
}

export function InsightsPanel({
  investmentSummary = defaultInvestmentSummary,
  monthlyData = monthlyInvestmentData,
}: {
  investmentSummary?: InvestmentSummary;
  monthlyData?: MonthlyInvestmentItem[];
}) {
  const maxDrawdownPeriod = monthlyData.length
    ? getPreviousMonthLabel(monthlyData, investmentSummary.maxDrawdown)
    : "Sin datos";
  const insights: InsightItem[] = [
    {
      icon: Trophy,
      title: "Mejor mes",
      detail: investmentSummary.bestMonth.month,
      value: formatPercent(investmentSummary.bestMonth.returnPct, {
        sign: true,
      }),
      tone: "positive",
    },
    {
      icon: Target,
      title: "Peor mes",
      detail: investmentSummary.worstMonth.month,
      value: formatPercent(investmentSummary.worstMonth.returnPct, {
        sign: true,
      }),
      tone: "negative",
    },
    {
      icon: TrendingUp,
      title: "Mejor racha",
      detail: investmentSummary.bestPositiveStreak.label || "Sin racha",
      value: `${investmentSummary.bestPositiveStreak.months} meses`,
      tone: "positive",
    },
    {
      icon: TrendingDown,
      title: "Maxima caida",
      detail: maxDrawdownPeriod,
      value: formatPercent(investmentSummary.maxDrawdownPct, { sign: true }),
      tone: "negative",
    },
    {
      icon: CalendarDays,
      title: "Mes actual",
      detail: investmentSummary.currentMonth.month,
      value: formatPercent(investmentSummary.currentMonth.returnPct, {
        sign: true,
      }),
      tone:
        investmentSummary.currentMonth.returnPct >= 0 ? "positive" : "negative",
    },
    {
      icon: Clock3,
      title: "Rentabilidad ultimos 12 meses",
      detail: getLatestTwelveLabel(
        monthlyData,
        investmentSummary.currentMonth.month,
      ),
      value: formatPercent(investmentSummary.lastTwelveMonthsReturnPct, {
        sign: true,
      }),
      tone:
        investmentSummary.lastTwelveMonthsReturnPct >= 0
          ? "positive"
          : "negative",
    },
  ];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center gap-3 border-b p-5">
        <Flame className="size-5 text-muted-foreground" strokeWidth={1.9} />
        <CardTitle className="text-base font-semibold uppercase">
          Insights principales
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 p-0">
        <div className="flex flex-1 flex-col">
          {insights.map((insight) => {
            const styles = toneStyles[insight.tone];
            const Icon = insight.icon;

            return (
              <div
                key={insight.title}
                className="grid flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-b px-5 py-4 last:border-b-0"
              >
                <div
                  className={cn(
                    "grid size-11 place-items-center rounded-full ring-1",
                    styles.iconWrap,
                  )}
                >
                  <Icon className={cn("size-5", styles.icon)} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-card-foreground/88">
                    {insight.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {insight.detail}
                  </p>
                </div>
                <div
                  className={cn(
                    "text-right text-lg font-semibold tracking-normal",
                    styles.value,
                  )}
                >
                  {insight.value}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
