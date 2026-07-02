import { Info, type LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type KpiTone = "neutral" | "positive" | "negative";

const toneStyles: Record<
  KpiTone,
  {
    card: string;
    iconWrap: string;
    icon: string;
    label: string;
    value: string;
  }
> = {
  neutral: {
    card: "border-border shadow-[0_0_34px_rgba(15,23,42,0.18)]",
    iconWrap: "bg-muted/70 ring-border",
    icon: "text-muted-foreground",
    label: "text-muted-foreground",
    value: "text-foreground",
  },
  positive: {
    card: "border-positive/35 shadow-[0_0_40px_rgba(34,197,94,0.1)]",
    iconWrap: "bg-positive-soft ring-positive/25",
    icon: "text-positive",
    label: "text-positive",
    value: "text-positive",
  },
  negative: {
    card: "border-danger/40 shadow-[0_0_40px_rgba(239,68,68,0.1)]",
    iconWrap: "bg-danger-soft ring-danger/25",
    icon: "text-danger",
    label: "text-danger",
    value: "text-danger",
  },
};

type KpiCardProps = {
  label: string;
  value: string;
  helper: string;
  explanation?: string;
  icon: LucideIcon;
  tone: KpiTone;
};

export function KpiCard({
  label,
  value,
  helper,
  explanation,
  icon: Icon,
  tone,
}: KpiCardProps) {
  const styles = toneStyles[tone];

  return (
    <Card
      className={cn(
        "group relative overflow-visible transition-transform duration-200 hover:-translate-y-0.5",
        styles.card,
      )}
    >
      {explanation ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label={`Explicar ${label}`}
              className="absolute right-2.5 top-2.5 z-10 grid size-6 place-items-center rounded-full text-muted-foreground/70 transition-colors hover:bg-secondary/70 hover:text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
              type="button"
            >
              <Info className="size-3.5" strokeWidth={2} />
            </button>
          </TooltipTrigger>
          <TooltipContent align="end" className="max-w-[260px]" side="top">
            <p className="font-semibold text-popover-foreground">{label}</p>
            <p className="mt-1 leading-4 text-popover-foreground/84">
              {explanation}
            </p>
          </TooltipContent>
        </Tooltip>
      ) : null}

      <CardHeader className="flex-row items-start gap-3 p-3 pr-9 pb-0 sm:gap-4 sm:p-4 sm:pr-10 sm:pb-0">
        <div
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-full ring-1 sm:size-12",
            styles.iconWrap,
          )}
        >
          <Icon className={cn("size-5 sm:size-6", styles.icon)} strokeWidth={1.9} />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle
            className={cn(
              "text-[0.66rem] font-semibold uppercase leading-4 sm:text-[0.69rem]",
              styles.label,
            )}
          >
            {label}
          </CardTitle>
          <CardDescription className="sr-only">{helper}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 p-3 pt-2 sm:p-4 sm:pt-3">
        <div
          className={cn(
            "text-[1.55rem] font-semibold leading-tight tracking-normal sm:text-2xl xl:text-[1.55rem]",
            styles.value,
          )}
        >
          {value}
        </div>
        <p className="text-xs leading-4 text-card-foreground/82 sm:text-sm sm:leading-5">
          {helper}
        </p>
      </CardContent>
    </Card>
  );
}
