import { randomBytes } from "node:crypto";
import type { User } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

export type InvestorAccessError =
  | "auth_config"
  | "auth_create"
  | "email_config"
  | "email_send";

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
      status: "sent";
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

function getSiteUrl() {
  const rawUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    "https://resumen-inversion.vercel.app";

  return rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
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
    name: investorName,
    role: "investor",
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

async function sendInvestorAccessEmail({
  email,
  investorName,
  password,
}: Pick<InvestorAccessInput, "email" | "investorName"> & {
  password: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.INVESTOR_ACCESS_EMAIL_FROM ??
    process.env.RESEND_FROM_EMAIL ??
    "";

  if (!apiKey || !from) {
    return { ok: false as const, error: "email_config" as const };
  }

  const loginUrl = `${getSiteUrl()}/?role=investor`;
  const safeName = escapeHtml(investorName);
  const safeEmail = escapeHtml(email);
  const safePassword = escapeHtml(password);
  const safeLoginUrl = escapeHtml(loginUrl);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Acceso a Oro Negro",
      text: [
        `Hola ${investorName},`,
        "",
        "Estas son tus credenciales de acceso a Oro Negro:",
        `Usuario: ${email}`,
        `Contrasena: ${password}`,
        `Login: ${loginUrl}`,
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
          <h1 style="font-size: 20px; margin: 0 0 16px;">Acceso a Oro Negro</h1>
          <p>Hola ${safeName},</p>
          <p>Estas son tus credenciales de acceso:</p>
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; background: #f9fafb;">
            <p><strong>Usuario:</strong> ${safeEmail}</p>
            <p><strong>Contrasena:</strong> ${safePassword}</p>
          </div>
          <p>
            <a href="${safeLoginUrl}" style="display: inline-block; margin-top: 12px; background: #111827; color: #ffffff; padding: 10px 16px; border-radius: 999px; text-decoration: none;">
              Entrar al panel inversor
            </a>
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    return { ok: false as const, error: "email_send" as const };
  }

  return { ok: true as const };
}

export async function createAndSendInvestorAccess(
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
  const emailResult = await sendInvestorAccessEmail({
    email: input.email,
    investorName: input.investorName,
    password,
  });

  if (!emailResult.ok) {
    return { ok: false, error: emailResult.error, credentials };
  }

  return { ok: true, status: "sent", credentials };
}
