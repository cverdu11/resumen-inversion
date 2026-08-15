"use server";

import { getSiteUrl } from "@/lib/investor-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type PasswordRecoveryResult =
  | { ok: true }
  | { error: "invalid" | "unavailable"; ok: false };

function normalizeEmail(value: FormDataEntryValue | null) {
  const email = String(value ?? "").trim().toLowerCase();

  if (!email) {
    return null;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function getRecoveryRedirectUrl() {
  const url = new URL("/", getSiteUrl());

  url.searchParams.set("role", "investor");

  return url.toString();
}

export async function requestPasswordRecovery(
  formData: FormData,
): Promise<PasswordRecoveryResult> {
  const email = normalizeEmail(formData.get("email"));

  if (!email) {
    return { error: "invalid", ok: false };
  }

  if (!hasSupabaseAdminEnv()) {
    console.error("[password-recovery] Supabase admin configuration is missing.");
    return { error: "unavailable", ok: false };
  }

  try {
    const admin = createAdminClient();
    const { data: investor, error: investorError } = await admin
      .from("investors")
      .select("id")
      .eq("email", email)
      .limit(1)
      .maybeSingle();

    if (investorError) {
      console.error(
        `[password-recovery] Investor lookup failed: ${investorError.message}`,
      );
      return { error: "unavailable", ok: false };
    }

    // Keep the response neutral for unknown addresses and only issue links
    // for investor accounts that belong to this application.
    if (!investor) {
      return { ok: true };
    }

    const supabase = await createClient();
    const { error: recoveryError } =
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getRecoveryRedirectUrl(),
      });

    if (recoveryError) {
      console.error(
        `[password-recovery] Supabase recovery request failed: ${recoveryError.message}`,
      );
      return { error: "unavailable", ok: false };
    }

    return { ok: true };
  } catch {
    console.error("[password-recovery] Unexpected recovery request failure.");
    return { error: "unavailable", ok: false };
  }
}
