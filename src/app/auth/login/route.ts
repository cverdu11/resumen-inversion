import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

type LoginRole = "trader" | "investor";

function getLoginRole(value: FormDataEntryValue | null): LoginRole {
  return value === "investor" ? "investor" : "trader";
}

function buildLandingRedirect(
  request: NextRequest,
  role: LoginRole,
  key: "login_error" | "login_status",
  value: string,
) {
  const url = new URL("/", request.url);
  url.searchParams.set("role", role);
  url.searchParams.set(key, value);

  return url.toString();
}

async function getInvestorForCurrentUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  email: string,
) {
  const { data, error } = await supabase
    .from("investors")
    .select("id, slug")
    .ilike("email", email)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const role = getLoginRole(formData.get("role"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(buildLandingRedirect(request, role, "login_error", "missing"));
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    redirect(buildLandingRedirect(request, role, "login_error", "invalid"));
  }

  if (role === "trader") {
    const { data: isTrader, error: traderError } =
      await supabase.rpc("is_trader");

    if (traderError) {
      await supabase.auth.signOut();
      redirect(buildLandingRedirect(request, role, "login_error", "server"));
    }

    if (!isTrader) {
      await supabase.auth.signOut();
      redirect(
        buildLandingRedirect(request, role, "login_error", "unauthorized_trader"),
      );
    }

    redirect(new URL("/admin?login_status=success", request.url).toString());
  }

  const investor = await getInvestorForCurrentUser(supabase, email);

  if (!investor) {
    await supabase.auth.signOut();
    redirect(
      buildLandingRedirect(request, role, "login_error", "unauthorized_investor"),
    );
  }

  redirect(new URL("/inversor?login_status=success", request.url).toString());
}
