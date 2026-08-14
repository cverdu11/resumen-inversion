"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  createAndSendInvestorAccess,
  normalizeInvestorEmail,
  type InvestorAccessCredentials,
  type InvestorAccessError,
  type InvestorAccessStatus,
} from "@/lib/investor-access";
import { createClient } from "@/lib/supabase/server";
import type { WeeklyProfitabilityStatus } from "@/lib/weekly-profitability";

const validInvestorStatuses = ["active", "watch", "pending", "paused"];
const validWeeklyStatuses: WeeklyProfitabilityStatus[] = [
  "draft",
  "closed",
  "pending",
];
const defaultMovementNotes = {
  contribution: "Aportacion parcial",
  withdrawal: "Retirada parcial",
} as const;
const investorAccessCookieName = "investor_access_credentials";

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

function getSafeOpenMonths(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((monthId) => monthId.trim())
    .filter((monthId) => /^\d{4}-\d{2}$/.test(monthId))
    .join(",");
}

function redirectWithWeeklyResult(
  next: string,
  result: string,
  openMonths?: string,
): never {
  const [pathname, query = ""] = next.split("?");
  const params = new URLSearchParams(query);

  params.delete("weekly_status");
  params.delete("weekly_error");
  params.delete("open_months");
  params.set("tab", "rentabilidad");

  if (openMonths) {
    params.set("open_months", openMonths);
  }

  if (result === "saved") {
    params.set("weekly_status", "saved");
  } else {
    params.set("weekly_error", result);
  }

  redirect(`${pathname}?${params.toString()}`);
}

async function getAuthorizedTraderClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?role=trader&login_error=session_required");
  }

  const { data: isTrader } = await supabase.rpc("is_trader");

  if (!isTrader) {
    await supabase.auth.signOut();
    redirect("/?role=trader&login_error=unauthorized_trader");
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

function parsePercentageInput(value: string) {
  return parseMoneyInput(value.replace("%", ""));
}

function normalizeNoteLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getMovementNoteForSave(
  note: string,
  movementType: keyof typeof defaultMovementNotes,
) {
  const normalizedNote = normalizeNoteLabel(note);
  const isDefaultLabel =
    normalizedNote === "aportacion parcial" ||
    normalizedNote === "retirada parcial";

  return !note || isDefaultLabel ? defaultMovementNotes[movementType] : note;
}

function redirectWithInvestorError(result: string): never {
  redirect(`/admin?investor_error=${result}`);
}

async function setInvestorAccessCredentialsCookie(
  credentials?: InvestorAccessCredentials,
) {
  if (!credentials) {
    return;
  }

  const cookieStore = await cookies();

  cookieStore.set({
    httpOnly: true,
    maxAge: 5 * 60,
    name: investorAccessCookieName,
    path: "/admin",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    value: Buffer.from(JSON.stringify(credentials), "utf8").toString(
      "base64url",
    ),
  });
}

async function redirectWithInvestorAccessResult(
  slug: string,
  result:
    | {
        credentials?: InvestorAccessCredentials;
        ok: true;
        status: InvestorAccessStatus;
      }
    | {
        credentials?: InvestorAccessCredentials;
        ok: false;
        error:
          | InvestorAccessError
          | "duplicate_email"
          | "invalid_email"
          | "missing_email"
          | "trader_email";
      },
  options?: { showInvestor?: boolean },
): Promise<never> {
  await setInvestorAccessCredentialsCookie(result.credentials);

  const params = new URLSearchParams();

  if (options?.showInvestor ?? true) {
    params.set("investor", slug);
  }

  if (result.ok) {
    params.set("access_status", result.status);
  } else {
    params.set("access_error", result.error);
  }

  redirect(`/admin?${params.toString()}`);
}

async function getUniqueInvestorSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  baseSlug: string,
  currentInvestorId?: number,
) {
  const { data } = await supabase
    .from("investors")
    .select("id, slug")
    .like("slug", `${baseSlug}%`);

  const usedSlugs = new Set(
    (data ?? [])
      .filter((investor) => Number(investor.id) !== currentInvestorId)
      .map((investor) => String(investor.slug)),
  );
  let slug = baseSlug;
  let suffix = 2;

  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

async function getInvestorBySlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string,
) {
  const { data, error } = await supabase
    .from("investors")
    .select("id, slug, email")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    redirectWithInvestorError("not_found");
  }

  return data;
}

async function validateInvestorEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  email: string,
  currentInvestorId?: number,
) {
  if (!email) {
    return null;
  }

  let duplicateQuery = supabase
    .from("investors")
    .select("id")
    .ilike("email", email)
    .limit(1);

  if (currentInvestorId) {
    duplicateQuery = duplicateQuery.neq("id", currentInvestorId);
  }

  const { data: duplicateInvestors } = await duplicateQuery;

  if (duplicateInvestors?.length) {
    return "duplicate_email" as const;
  }

  const { data: traderProfiles } = await supabase
    .from("trader_profiles")
    .select("id")
    .ilike("email", email)
    .eq("is_active", true)
    .limit(1);

  if (traderProfiles?.length) {
    return "trader_email" as const;
  }

  return null;
}

export async function createInvestor(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const surname = String(formData.get("surname") ?? "").trim();
  const normalizedEmail = normalizeInvestorEmail(formData.get("email"));
  const startDate = String(formData.get("start_date") ?? "");
  const initialContribution = parseMoneyInput(
    String(formData.get("initial_contribution") ?? ""),
  );
  const rawStatus = String(formData.get("status") ?? "active");
  const status = validInvestorStatuses.includes(rawStatus)
    ? rawStatus
    : "active";

  if (normalizedEmail === null) {
    redirectWithInvestorError("invalid_email");
  }

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
  const emailError = await validateInvestorEmail(supabase, normalizedEmail);

  if (emailError) {
    redirectWithInvestorError(emailError);
  }

  const slug = await getUniqueInvestorSlug(
    supabase,
    normalizeSlug(`${name}-${surname}`),
  );

  const { data: investor, error: investorError } = await supabase
    .from("investors")
    .insert({
      first_name: name,
      last_name: surname,
      email: normalizedEmail || null,
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

  if (normalizedEmail) {
    const accessResult = await createAndSendInvestorAccess({
      email: normalizedEmail,
      investorId: Number(investor.id),
      investorName: `${name} ${surname}`,
      investorSlug: investor.slug,
    });

    await redirectWithInvestorAccessResult(investor.slug, accessResult, {
      showInvestor: false,
    });
  }

  redirect(`/admin?investor=${investor.slug}`);
}

export async function updateInvestor(formData: FormData) {
  const currentSlug = String(formData.get("current_slug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const surname = String(formData.get("surname") ?? "").trim();
  const normalizedEmail = normalizeInvestorEmail(formData.get("email"));
  const startDate = String(formData.get("start_date") ?? "");
  const initialContribution = parseMoneyInput(
    String(formData.get("initial_contribution") ?? ""),
  );
  const rawStatus = String(formData.get("status") ?? "active");
  const status = validInvestorStatuses.includes(rawStatus)
    ? rawStatus
    : "active";

  if (normalizedEmail === null) {
    redirectWithInvestorError("invalid_email");
  }

  if (
    !currentSlug ||
    !name ||
    !surname ||
    !startDate ||
    !Number.isFinite(initialContribution) ||
    initialContribution <= 0
  ) {
    redirectWithInvestorError("missing");
  }

  const { supabase } = await getAuthorizedTraderClient();
  const investor = await getInvestorBySlug(supabase, currentSlug);
  const emailError = await validateInvestorEmail(
    supabase,
    normalizedEmail,
    investor.id,
  );

  if (emailError) {
    await redirectWithInvestorAccessResult(
      investor.slug,
      {
        ok: false,
        error: emailError,
      },
      {
        showInvestor: false,
      },
    );
  }

  const nextSlug = await getUniqueInvestorSlug(
    supabase,
    normalizeSlug(`${name}-${surname}`),
    investor.id,
  );
  const { error: investorError } = await supabase
    .from("investors")
    .update({
      first_name: name,
      last_name: surname,
      email: normalizedEmail || null,
      slug: nextSlug,
      start_date: startDate,
      status,
    })
    .eq("id", investor.id);

  if (investorError) {
    redirectWithInvestorError("update");
  }

  const { data: initialMovement } = await supabase
    .from("investor_movements")
    .select("id")
    .eq("investor_id", investor.id)
    .eq("movement_type", "initial_contribution")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (initialMovement) {
    const { error: movementError } = await supabase
      .from("investor_movements")
      .update({
        movement_date: startDate,
        amount: initialContribution,
        note: "Aportacion inicial",
      })
      .eq("id", initialMovement.id);

    if (movementError) {
      redirectWithInvestorError("movement");
    }
  } else {
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
      redirectWithInvestorError("movement");
    }
  }

  if (
    normalizedEmail &&
    normalizedEmail !== String(investor.email ?? "").toLowerCase()
  ) {
    const accessResult = await createAndSendInvestorAccess({
      email: normalizedEmail,
      investorId: Number(investor.id),
      investorName: `${name} ${surname}`,
      investorSlug: nextSlug,
    });

    await redirectWithInvestorAccessResult(nextSlug, accessResult, {
      showInvestor: false,
    });
  }

  redirect("/admin");
}

export async function sendInvestorAccess(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();

  if (!slug) {
    redirectWithInvestorError("missing");
  }

  const { supabase } = await getAuthorizedTraderClient();
  const { data: investor, error } = await supabase
    .from("investors")
    .select("id, first_name, last_name, slug, email")
    .eq("slug", slug)
    .single();

  if (error || !investor) {
    redirectWithInvestorError("not_found");
  }

  const email = normalizeInvestorEmail(investor.email);

  if (!email) {
    return await redirectWithInvestorAccessResult(
      slug,
      {
        ok: false,
        error: email === null ? "invalid_email" : "missing_email",
      },
      {
        showInvestor: false,
      },
    );
  }

  const emailError = await validateInvestorEmail(
    supabase,
    email,
    Number(investor.id),
  );

  if (emailError) {
    await redirectWithInvestorAccessResult(
      slug,
      {
        ok: false,
        error: emailError,
      },
      {
        showInvestor: false,
      },
    );
  }

  const accessResult = await createAndSendInvestorAccess({
    email,
    investorId: Number(investor.id),
    investorName: `${investor.first_name} ${investor.last_name}`,
    investorSlug: investor.slug,
  });

  await redirectWithInvestorAccessResult(slug, accessResult, {
    showInvestor: false,
  });
}

export async function addInvestorMovement(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();
  const movementDate = String(formData.get("movement_date") ?? "");
  const amount = parseMoneyInput(String(formData.get("amount") ?? ""));
  const note = String(formData.get("note") ?? "").trim();
  const rawType = String(formData.get("movement_type") ?? "");
  const movementType =
    rawType === "withdrawal"
      ? "withdrawal"
      : rawType === "contribution"
        ? "contribution"
        : "";

  if (
    !slug ||
    !movementDate ||
    !movementType ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    redirectWithInvestorError("movement");
  }

  const { supabase } = await getAuthorizedTraderClient();
  const investor = await getInvestorBySlug(supabase, slug);
  const { error } = await supabase.from("investor_movements").insert({
    investor_id: investor.id,
    movement_type: movementType,
    movement_date: movementDate,
    amount,
    note: getMovementNoteForSave(note, movementType),
  });

  if (error) {
    redirectWithInvestorError("movement");
  }

  redirect(`/admin?investor=${slug}`);
}

export async function updateInvestorMovement(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();
  const movementId = Number(formData.get("movement_id"));
  const movementDate = String(formData.get("movement_date") ?? "");
  const amount = parseMoneyInput(String(formData.get("amount") ?? ""));
  const note = String(formData.get("note") ?? "").trim();
  const rawType = String(formData.get("movement_type") ?? "");
  const movementType =
    rawType === "withdrawal"
      ? "withdrawal"
      : rawType === "contribution"
        ? "contribution"
        : "";

  if (
    !slug ||
    !Number.isInteger(movementId) ||
    !movementDate ||
    !movementType ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    redirectWithInvestorError("movement");
  }

  const { supabase } = await getAuthorizedTraderClient();
  const investor = await getInvestorBySlug(supabase, slug);
  const { error } = await supabase
    .from("investor_movements")
    .update({
      movement_type: movementType,
      movement_date: movementDate,
      amount,
      note: getMovementNoteForSave(note, movementType),
    })
    .eq("id", movementId)
    .eq("investor_id", investor.id)
    .neq("movement_type", "initial_contribution");

  if (error) {
    redirectWithInvestorError("movement");
  }

  redirect(`/admin?investor=${slug}`);
}

export async function deleteInvestorMovement(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();
  const movementId = Number(formData.get("movement_id"));

  if (!slug || !Number.isInteger(movementId)) {
    redirectWithInvestorError("movement");
  }

  const { supabase } = await getAuthorizedTraderClient();
  const investor = await getInvestorBySlug(supabase, slug);
  const { error } = await supabase
    .from("investor_movements")
    .delete()
    .eq("id", movementId)
    .eq("investor_id", investor.id)
    .neq("movement_type", "initial_contribution");

  if (error) {
    redirectWithInvestorError("movement");
  }

  redirect(`/admin?investor=${slug}`);
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

  redirect("/admin");
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
    redirect("/?role=trader&login_error=session_required");
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

export async function saveWeeklyProfitability(formData: FormData) {
  const next = getSafeNext(formData.get("next"));
  const openMonths = getSafeOpenMonths(formData.get("open_months"));
  const weekStart = String(formData.get("week_start") ?? "");
  const weekEnd = String(formData.get("week_end") ?? "");
  const returnPct = parsePercentageInput(String(formData.get("return_pct") ?? ""));
  const rawStatus = String(formData.get("status") ?? "draft");
  const status = validWeeklyStatuses.includes(
    rawStatus as WeeklyProfitabilityStatus,
  )
    ? (rawStatus as WeeklyProfitabilityStatus)
    : "draft";

  if (
    !weekStart ||
    !weekEnd ||
    weekEnd < weekStart ||
    !Number.isFinite(returnPct) ||
    Math.abs(returnPct) > 100
  ) {
    redirectWithWeeklyResult(next, "invalid", openMonths);
  }

  const { supabase } = await getAuthorizedTraderClient();
  const { error } = await supabase.from("weekly_profitability").upsert(
    {
      week_start: weekStart,
      week_end: weekEnd,
      return_pct: returnPct,
      status,
      closed_at: status === "closed" ? new Date().toISOString() : null,
    },
    { onConflict: "week_start" },
  );

  if (error) {
    redirectWithWeeklyResult(next, "save", openMonths);
  }

  redirectWithWeeklyResult(next, "saved", openMonths);
}
