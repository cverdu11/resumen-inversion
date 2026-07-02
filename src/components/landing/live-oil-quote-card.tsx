"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

import { OilDropIcon } from "@/components/landing/oil-drop-icon";
import type { OilQuote } from "@/lib/oil-quote";

const quoteRefreshMs = 60_000;

const priceFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const timeFormatter = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
});

function formatUpdatedAt(updatedAt: string) {
  return timeFormatter.format(new Date(updatedAt));
}

function getQuoteMeta(quote: OilQuote | null) {
  if (!quote) {
    return "Conectando cotizacion...";
  }

  const delayText = quote.delayMinutes
    ? `delay ${quote.delayMinutes} min`
    : "tiempo real";

  return `${quote.provider} - ${delayText} - ${formatUpdatedAt(quote.updatedAt)}`;
}

export function LiveOilQuoteCard() {
  const [quote, setQuote] = useState<OilQuote | null>(null);
  const [status, setStatus] = useState<"error" | "loading" | "ready">(
    "loading",
  );

  useEffect(() => {
    let isMounted = true;

    async function loadQuote() {
      try {
        const response = await fetch("/api/oil-quote");

        if (!response.ok) {
          throw new Error("Quote request failed");
        }

        const nextQuote = (await response.json()) as OilQuote;

        if (!isMounted) {
          return;
        }

        setQuote(nextQuote);
        setStatus("ready");
      } catch {
        if (isMounted) {
          setStatus("error");
        }
      }
    }

    void loadQuote();
    const intervalId = window.setInterval(loadQuote, quoteRefreshMs);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const priceLabel = quote ? priceFormatter.format(quote.price) : "--.--";
  const statusLabel =
    status === "ready" ? "Live" : status === "loading" ? "..." : "N/D";
  const title = quote
    ? `Proveedor: ${quote.provider} (${quote.providerSymbol}). Modo: ${
        quote.updateMode ?? "actualizado"
      }.`
    : "Cotizacion pendiente de conectar.";

  return (
    <div className="w-full max-w-[440px] rounded-[24px] bg-white/[0.11] px-5 py-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.18)] backdrop-blur-md">
      <div className="flex items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white shadow-[0_16px_34px_rgba(0,0,0,0.16)]">
          <OilDropIcon className="size-8 text-black" />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-white/78">
            Cotizacion crudo
          </p>
          <p className="mt-2 text-sm font-bold text-white">CL1! - USD/BBL</p>
        </div>
      </div>
      <div className="mt-5 flex items-end justify-between gap-5">
        <div className="min-w-0">
          <p
            aria-live="polite"
            className="text-5xl font-black leading-none text-white sm:text-6xl"
          >
            {priceLabel}
          </p>
          <p className="mt-2 truncate text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/50">
            {status === "error" ? "Cotizacion no disponible" : getQuoteMeta(quote)}
          </p>
        </div>
        <div
          className="mb-2 flex items-center gap-2 rounded-full bg-white/14 px-3.5 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/72"
          title={title}
        >
          <Eye className="size-4" strokeWidth={1.9} />
          {statusLabel}
        </div>
      </div>
    </div>
  );
}
