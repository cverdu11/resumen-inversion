"use server";

import { redirect } from "next/navigation";

import { createAndSendInvestorRecovery } from "@/lib/investor-access";
import { createClient } from "@/lib/supabase/server";

const resetPath = "/recuperar-contrasena/reset";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function recoveryRedirect(params: Record<string, string>): never {
  const query = new URLSearchParams(params);
  redirect(`/recuperar-contrasena?${query.toString()}`);
}

function resetRedirect(error: string): never {
  const query = new URLSearchParams({ error });
  redirect(`${resetPath}?${query.toString()}`);
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!isValidEmail(email)) {
    recoveryRedirect({ error: "invalid_email" });
  }

  const result = await createAndSendInvestorRecovery(email);

  if (!result.ok) {
    console.error("Investor password recovery request failed");
  }

  recoveryRedirect({ status: "sent" });
}

export async function resetInvestorPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!password || !confirmPassword) {
    resetRedirect("missing");
  }

  if (password.length < 10) {
    resetRedirect("weak");
  }

  if (password !== confirmPassword) {
    resetRedirect("mismatch");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    recoveryRedirect({ error: "invalid_link" });
  }

  const { error } = await supabase.auth.updateUser({
    password,
    data: {
      ...user.user_metadata,
      must_change_password: false,
      password_updated_at: new Date().toISOString(),
      role: "investor",
    },
  });

  if (error) {
    resetRedirect("update");
  }

  await supabase.auth.signOut();
  redirect("/?role=investor&login_status=password_reset");
}
