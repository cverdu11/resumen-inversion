"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type LoginRole = "trader" | "investor";

function getLoginRole(value: FormDataEntryValue | null): LoginRole {
  return value === "investor" ? "investor" : "trader";
}

function buildLandingRedirect(role: LoginRole, key: "login_error" | "login_status", value: string) {
  const params = new URLSearchParams({
    role,
    [key]: value,
  });

  return `/?${params.toString()}`;
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

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!email || !password) {
    redirect("/login?error=missing");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/login?error=invalid");
  }

  const { data: isTrader } = await supabase.rpc("is_trader");

  if (!isTrader) {
    await supabase.auth.signOut();
    redirect("/login?error=unauthorized");
  }

  redirect(next.startsWith("/") ? next : "/admin");
}

export async function loginFromLanding(formData: FormData) {
  const role = getLoginRole(formData.get("role"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(buildLandingRedirect(role, "login_error", "missing"));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(buildLandingRedirect(role, "login_error", "invalid"));
  }

  if (role === "trader") {
    const { data: isTrader } = await supabase.rpc("is_trader");

    if (!isTrader) {
      await supabase.auth.signOut();
      redirect(buildLandingRedirect(role, "login_error", "unauthorized_trader"));
    }

    redirect("/admin?login_status=success");
  }

  const investor = await getInvestorForCurrentUser(supabase, email);

  if (!investor) {
    await supabase.auth.signOut();
    redirect(buildLandingRedirect(role, "login_error", "unauthorized_investor"));
  }

  redirect("/inversor?login_status=success");
}
