const tradingViewScannerUrl = "https://scanner.tradingview.com/futures/scan";
const providerSymbol = "NYMEX:CL1!";

type TradingViewScanResponse = {
  data?: Array<{
    d?: unknown[];
    s?: string;
  }>;
  error?: string;
};

export type OilQuote = {
  changeAbs: number | null;
  changePct: number | null;
  currency: string;
  delayMinutes: number | null;
  description: string;
  exchange: string;
  price: number;
  provider: string;
  providerSymbol: string;
  symbol: string;
  unit: string;
  updatedAt: string;
  updateMode: string | null;
};

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getDelayMinutes(updateMode: string | null) {
  if (!updateMode?.includes("delayed")) {
    return null;
  }

  const delaySeconds = Number(updateMode.match(/_(\d+)$/)?.[1] ?? 0);

  return delaySeconds > 0 ? Math.round(delaySeconds / 60) : null;
}

export async function getOilQuote(): Promise<OilQuote> {
  const response = await fetch(tradingViewScannerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0",
    },
    body: JSON.stringify({
      columns: [
        "close",
        "change",
        "change_abs",
        "currency",
        "description",
        "exchange",
        "lp",
        "pricescale",
        "update_mode",
      ],
      symbols: {
        query: { types: [] },
        tickers: [providerSymbol],
      },
    }),
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`TradingView quote request failed: ${response.status}`);
  }

  const payload = (await response.json()) as TradingViewScanResponse;

  if (payload.error) {
    throw new Error(payload.error);
  }

  const row = payload.data?.[0];
  const values = row?.d ?? [];
  const close = readNumber(values[0]);
  const lastPrice = readNumber(values[6]);
  const price = close ?? lastPrice;

  if (price === null) {
    throw new Error("TradingView quote response did not include a price");
  }

  const updateMode = readString(values[8]) || null;

  return {
    changeAbs: readNumber(values[2]),
    changePct: readNumber(values[1]),
    currency: readString(values[3]) || "USD",
    delayMinutes: getDelayMinutes(updateMode),
    description: readString(values[4]) || "Crude Oil Futures",
    exchange: readString(values[5]) || "NYMEX",
    price,
    provider: "TradingView",
    providerSymbol: row?.s || providerSymbol,
    symbol: "CL1!",
    unit: "BBL",
    updatedAt: new Date().toISOString(),
    updateMode,
  };
}
