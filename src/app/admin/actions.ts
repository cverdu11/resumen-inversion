"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const validInvestorStatuses = ["active", "watch", "pending", "paused"];

function getSafeNext(value: FormDataEntryValue | null) {
  const next = String(value ?? "/admin");

  return next.startsWith("/") ? next : "/admin";
}

function redirectWithPasswordResult(next: string, result: string): never {
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

async function getAuthorizedTraderClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: isTrader } = await supabase.rpc("is_trader");

  if (!isTrader) {
    await supabase.auth.signOut();
    redirect("/login?error=unauthorized");
  }

  return { supabase, user };
}

function normalizeSlug(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "inversor"
  );
}

function parseMoneyInput(value: string) {
  const compactValue = value.replace(/[\u20ac\s]/g, "").trim();

  if (!compactValue) {
    return Number.NaN;
  }

  const hasComma = compactValue.includes(",");
  const hasDot = compactValue.includes(".");

  if (hasComma && hasDot) {
    const decimalSeparator =
      compactValue.lastIndexOf(",") > compactValue.lastIndexOf(".")
        ? ","
        : ".";
    const thousandSeparator = decimalSeparator === "," ? "." : ",";

    return Number(
      compactValue
        .split(thousandSeparator)
        .join("")
        .replace(decimalSeparator, "."),
    );
  }

  if (hasComma || hasDot) {
    const separator = hasComma ? "," : ".";
    const parts = compactValue.split(separator);

    if (parts.length === 2 && parts[1].length > 0 && parts[1].length <= 2) {
      return Number(compactValue.replace(separator, "."));
    }

    return Number(parts.join(""));
  }

  return Number(compactValue);
}

function redirectWithInvestorError(result: string): never {
  redirect(`/admin?tab=panel&investor_error=${result}`);
}

async function getUniqueInvestorSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  baseSlug: string,
) {
  const { data } = await supabase
    .from("investors")
    .select("slug")
    .like("slug", `${baseSlug}%`);

  const usedSlugs = new Set(
    (data ?? []).map((investor) => String(investor.slug)),
  );
  let slug = baseSlug;
  let suffix = 2;

  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function createInvestor(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const surname = String(formData.get("surname") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "");
  const initialContribution = parseMoneyInput(
    String(formData.get("initial_contribution") ?? ""),
  );
  const rawStatus = String(formData.get("status") ?? "active");
  const status = validInvestorStatuses.includes(rawStatus)
    ? rawStatus
    : "active";

  if (
    !name ||
    !surname ||
    !startDate ||
    !Number.isFinite(initialContribution) ||
    initialContribution <= 0
  ) {
    redirectWithInvestorError("missing");
  }

  const { supabase } = await getAuthorizedTraderClient();
  const slug = await getUniqueInvestorSlug(
    supabase,
    normalizeSlug(`${name}-${surname}`),
  );

  const { data: investor, error: investorError } = await supabase
    .from("investors")
    .insert({
      first_name: name,
      last_name: surname,
      slug,
      start_date: startDate,
      status,
    })
    .select("id, slug")
    .single();

  if (investorError || !investor) {
    redirectWithInvestorError("create");
  }

  const { error: movementError } = await supabase
    .from("investor_movements")
    .insert({
      investor_id: investor.id,
      movement_type: "initial_contribution",
      movement_date: startDate,
      amount: initialContribution,
      note: "Aportacion inicial",
    });

  if (movementError) {
    await supabase.from("investors").delete().eq("id", investor.id);
    redirectWithInvestorError("movement");
  }

  redirect(`/admin?tab=panel&investor=${investor.slug}`);
}

export async function deleteInvestor(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();

  if (!slug) {
    redirectWithInvestorError("delete");
  }

  const { supabase } = await getAuthorizedTraderClient();
  const { error } = await supabase.from("investors").delete().eq("slug", slug);

  if (error) {
    redirectWithInvestorError("delete");
  }

  redirect("/admin?tab=panel");
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

  const { supabase, user } = await getAuthorizedTraderClient();

  if (!user.email) {
    redirect("/login?next=/admin");
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
