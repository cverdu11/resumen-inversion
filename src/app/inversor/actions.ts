"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function getSafeNext(value: FormDataEntryValue | null) {
  const next = String(value ?? "/inversor");

  return next.startsWith("/inversor") ? next : "/inversor";
}

function redirectWithPasswordResult(next: string, result: string): never {
  const [pathname, query = ""] = next.split("?");
  const params = new URLSearchParams(query);

  params.delete("login_status");
  params.delete("password_status");
  params.delete("password_error");

  if (result === "updated") {
    params.set("password_status", "updated");
  } else {
    params.set("password_error", result);
  }

  const queryString = params.toString();

  redirect(queryString ? `${pathname}?${queryString}` : pathname);
}

async function getInvestorForEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  email: string,
) {
  const dataClient = hasSupabaseAdminEnv() ? createAdminClient() : supabase;
  const { data, error } = await dataClient
    .from("investors")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

export async function changeInvestorPassword(formData: FormData) {
  const next = getSafeNext(formData.get("next"));
  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    redirectWithPasswordResult(next, "missing");
  }

  if (newPassword.length < 10) {
    redirectWithPasswordResult(next, "weak");
  }

  if (newPassword !== confirmPassword) {
    redirectWithPasswordResult(next, "mismatch");
  }

  if (currentPassword === newPassword) {
    redirectWithPasswordResult(next, "same");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/?role=investor&login_error=session_required");
  }

  const investor = await getInvestorForEmail(supabase, user.email);

  if (!investor) {
    await supabase.auth.signOut();
    redirect("/?role=investor&login_error=unauthorized_investor");
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    redirectWithPasswordResult(next, "current");
  }

  const {
    data: { user: verifiedUser },
  } = await supabase.auth.getUser();
  const userMetadata = verifiedUser?.user_metadata ?? user.user_metadata ?? {};
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
    data: {
      ...userMetadata,
      must_change_password: false,
      password_updated_at: new Date().toISOString(),
      role: "investor",
    },
  });

  if (updateError) {
    redirectWithPasswordResult(next, "update");
  }

  redirectWithPasswordResult(next, "updated");
}
