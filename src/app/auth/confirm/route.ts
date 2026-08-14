import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

const resetPath = "/recuperar-contrasena/reset";

function getAllowedNext(value: string | null) {
  return value === resetPath ? value : null;
}

function getOtpType(value: string | null): "invite" | "recovery" | null {
  return value === "invite" || value === "recovery" ? value : null;
}

function recoveryErrorRedirect(request: NextRequest, status = 307) {
  const url = new URL("/recuperar-contrasena", request.url);
  url.searchParams.set("error", "invalid_link");

  return NextResponse.redirect(url, { status });
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = getAllowedNext(url.searchParams.get("next"));
  const tokenHash = url.searchParams.get("token_hash");
  const type = getOtpType(url.searchParams.get("type"));

  if (!next || !tokenHash || !type) {
    return recoveryErrorRedirect(request);
  }

  const confirmUrl = new URL("/recuperar-contrasena/confirm", request.url);
  confirmUrl.searchParams.set("token_hash", tokenHash);
  confirmUrl.searchParams.set("type", type);
  confirmUrl.searchParams.set("next", next);

  return NextResponse.redirect(confirmUrl);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const next = getAllowedNext(String(formData.get("next") ?? ""));
  const tokenHash = String(formData.get("token_hash") ?? "");
  const type = getOtpType(String(formData.get("type") ?? ""));

  if (!next || !tokenHash || !type) {
    return recoveryErrorRedirect(request, 303);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return recoveryErrorRedirect(request, 303);
  }

  return NextResponse.redirect(new URL(next, request.url), { status: 303 });
}
