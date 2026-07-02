import { NextResponse } from "next/server";

import { getOilQuote } from "@/lib/oil-quote";

export const runtime = "nodejs";

export async function GET() {
  try {
    const quote = await getOilQuote();

    return NextResponse.json(quote, {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Unable to fetch oil quote", error);

    return NextResponse.json(
      {
        error: "oil_quote_unavailable",
        message: "No se pudo obtener la cotizacion de CL1!",
      },
      { status: 502 },
    );
  }
}
