import { randomBytes } from "node:crypto";
import type { User } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

export type InvestorAccessError =
  | "auth_config"
  | "auth_create";

export type InvestorAccessStatus = "manual";

type InvestorAccessInput = {
  email: string;
  investorId: number;
  investorName: string;
  investorSlug: string;
};

export type InvestorAccessCredentials = {
  email: string;
  investorName: string;
  loginUrl: string;
  password: string;
};

type InvestorAccessResult =
  | {
      credentials: InvestorAccessCredentials;
      ok: true;
      status: InvestorAccessStatus;
    }
  | {
      credentials?: InvestorAccessCredentials;
      ok: false;
      error: InvestorAccessError;
    };

const passwordAlphabet =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!#%?";

export function normalizeInvestorEmail(value: FormDataEntryValue | null) {
  const email = String(value ?? "").trim().toLowerCase();

  if (!email) {
    return "";
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function generateTemporaryPassword(length = 14) {
  const bytes = randomBytes(length);

  return Array.from(bytes, (byte) => passwordAlphabet[byte % passwordAlphabet.length]).join(
    "",
  );
}

export function getSiteUrl() {
  const rawUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    "https://resumen-inversion.vercel.app";
  const normalizedUrl = rawUrl.trim().replace(/\/+$/, "");

  if (normalizedUrl.includes("localhost")) {
    return "https://resumen-inversion.vercel.app";
  }

  return normalizedUrl.startsWith("http")
    ? normalizedUrl
    : `https://${normalizedUrl}`;
}

async function findAuthUserByEmail(email: string) {
  const admin = createAdminClient();
  const perPage = 1000;
  let page = 1;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      return { error };
    }

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === email,
    );

    if (user || data.users.length < perPage) {
      return { user: user ?? null };
    }

    page += 1;
  }

  return { user: null };
}

async function upsertInvestorAuthUser({
  email,
  investorId,
  investorName,
  investorSlug,
  password,
}: InvestorAccessInput & { password: string }) {
  const admin = createAdminClient();
  const userMetadata = {
    investor_id: investorId,
    investor_slug: investorSlug,
    must_change_password: true,
    name: investorName,
    role: "investor",
    temporary_password_created_at: new Date().toISOString(),
  };
  const existingUserResult = await findAuthUserByEmail(email);

  if ("error" in existingUserResult) {
    return { error: existingUserResult.error };
  }

  const existingUser = existingUserResult.user as User | null;

  if (existingUser) {
    return admin.auth.admin.updateUserById(existingUser.id, {
      email_confirm: true,
      password,
      user_metadata: {
        ...existingUser.user_metadata,
        ...userMetadata,
      },
    });
  }

  return admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: userMetadata,
  });
}

export async function createInvestorAccess(
  input: InvestorAccessInput,
): Promise<InvestorAccessResult> {
  if (!hasSupabaseAdminEnv()) {
    return { ok: false, error: "auth_config" };
  }

  const password = generateTemporaryPassword();
  const { error: authError } = await upsertInvestorAuthUser({
    ...input,
    password,
  });

  if (authError) {
    return { ok: false, error: "auth_create" };
  }

  const credentials = {
    email: input.email,
    investorName: input.investorName,
    loginUrl: `${getSiteUrl()}/?role=investor`,
    password,
  };
  return { ok: true, status: "manual", credentials };
}
