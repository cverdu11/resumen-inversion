"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function getSafeNext(value: FormDataEntryValue | null) {
  const next = String(value ?? "/admin");

  return next.startsWith("/") ? next : "/admin";
}

function redirectWithPasswordResult(next: string, result: string) {
  const [pathname, query = ""] = next.split("?");
  const params = new URLSearchParams(query);

  params.delete("password_status");
  params.delete("password_error");

  if (result === "updated") {
    params.set("password_status", "updated");
  } else {
    params.set("password_error", result);
  }

  redirect(`${pathname}?${params.toString()}`);
}

export async function changeAdminPassword(formData: FormData) {
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
    redirect("/login?next=/admin");
  }

  const { data: isTrader } = await supabase.rpc("is_trader");

  if (!isTrader) {
    await supabase.auth.signOut();
    redirect("/login?error=unauthorized");
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    redirectWithPasswordResult(next, "current");
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    redirectWithPasswordResult(next, "update");
  }

  redirectWithPasswordResult(next, "updated");
}
