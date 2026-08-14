import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

const resetPath = "/recuperar-contrasena/reset";

function getAllowedNext(value: string | null, request: NextRequest) {
  if (!value) {
    return null;
  }

  try {
    const next = new URL(value, request.url);
    const requestOrigin = new URL(request.url).origin;

    if (
      next.origin !== requestOrigin ||
      next.pathname !== resetPath ||
      next.search ||
      next.hash
    ) {
      return null;
    }

    return resetPath;
  } catch {
    return null;
  }
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
  const next = getAllowedNext(url.searchParams.get("next"), request);
  const tokenHash = url.searchParams.get("token_hash");
  const type = getOtpType(url.searchParams.get("type"));
  const code = url.searchParams.get("code");

  if (next && code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }

    return recoveryErrorRedirect(request);
  }

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
  const next = getAllowedNext(String(formData.get("next") ?? ""), request);
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
