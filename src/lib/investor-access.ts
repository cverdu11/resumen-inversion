import type { User } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

export type InvestorAccessError = "auth_config" | "auth_create";

export type InvestorAccessStatus = "manual" | "sent";
export type InvestorAccessMode = "invite" | "recovery";

type InvestorAccessInput = {
  email: string;
  investorId: number;
  investorName: string;
  investorSlug: string;
};

export type InvestorAccessCredentials = {
  accessUrl: string;
  email: string;
  investorName: string;
  loginUrl: string;
  mode: InvestorAccessMode;
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

export type InvestorRecoveryResult =
  | { ok: true }
  | { ok: false };

export function normalizeInvestorEmail(value: FormDataEntryValue | null) {
  const email = String(value ?? "").trim().toLowerCase();

  if (!email) {
    return "";
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function getSiteUrl() {
  const productionFallback = "https://resumen-inversion.vercel.app";
  const rawUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    (process.env.NODE_ENV === "production"
      ? productionFallback
      : `http://localhost:${process.env.PORT ?? "3000"}`);

  if (rawUrl) {
    try {
      const url = new URL(
        rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`,
      );

      if (url.protocol === "http:" || url.protocol === "https:") {
        if (
          process.env.NODE_ENV === "production" &&
          ["localhost", "127.0.0.1", "::1"].includes(url.hostname)
        ) {
          return productionFallback;
        }

        return url.origin;
      }
    } catch {
      // Fall through to the local development origin.
    }
  }

  return process.env.NODE_ENV === "production"
    ? productionFallback
    : `http://localhost:${process.env.PORT ?? "3000"}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

function getAccessUrl(tokenHash: string, verificationType: InvestorAccessMode) {
  const url = new URL("/auth/confirm", getSiteUrl());
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", verificationType);
  url.searchParams.set("next", "/recuperar-contrasena/reset");

  return url.toString();
}

async function createAccessLink(input: InvestorAccessInput) {
  const admin = createAdminClient();
  const existingUserResult = await findAuthUserByEmail(input.email);

  if ("error" in existingUserResult) {
    return { error: existingUserResult.error };
  }

  const existingUser = existingUserResult.user as User | null;
  const mode: InvestorAccessMode = existingUser ? "recovery" : "invite";
  const { data, error } = await admin.auth.admin.generateLink(
    existingUser
      ? { email: input.email, type: "recovery" }
      : {
          email: input.email,
          type: "invite",
          options: {
            data: {
              investor_id: input.investorId,
              investor_slug: input.investorSlug,
              must_change_password: true,
              name: input.investorName,
              role: "investor",
              temporary_password_created_at: new Date().toISOString(),
            },
          },
        },
  );
  const tokenHash = data?.properties?.hashed_token;
  const verificationType = data?.properties?.verification_type;

  if (
    error ||
    !tokenHash ||
    (verificationType !== "invite" && verificationType !== "recovery")
  ) {
    return { error: error ?? new Error("Invalid access link response") };
  }

  return {
    accessUrl: getAccessUrl(tokenHash, verificationType),
    mode,
  };
}

async function sendInvestorAccessEmail({
  accessUrl,
  email,
  investorName,
  loginUrl,
  mode,
}: InvestorAccessCredentials) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.INVESTOR_ACCESS_EMAIL_FROM ??
    process.env.RESEND_FROM_EMAIL ??
    "";

  if (!apiKey || !from) return { ok: false as const };

  const isInvite = mode === "invite";
  const subject = isInvite
    ? "Activa tu acceso a Oro Negro"
    : "Restablece tu acceso a Oro Negro";
  const actionCopy = isInvite ? "activar tu acceso" : "restablecer tu acceso";
  const safeName = escapeHtml(investorName);
  const safeEmail = escapeHtml(email);
  const safeAccessUrl = escapeHtml(accessUrl);
  const safeLoginUrl = escapeHtml(loginUrl);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: email,
        subject,
        text: [
          `Hola ${investorName},`,
          "",
          `Usa este enlace de un solo uso para ${actionCopy} y elegir una contraseña:`,
          accessUrl,
          "",
          `Después podrás iniciar sesión en: ${loginUrl}`,
        ].join("\n"),
        html: `
          <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
            <h1 style="font-size: 20px; margin: 0 0 16px;">${isInvite ? "Activa tu acceso" : "Restablece tu acceso"}</h1>
            <p>Hola ${safeName},</p>
            <p>Usa este enlace de un solo uso para ${actionCopy} y elegir una contraseña.</p>
            <p><a href="${safeAccessUrl}" style="display: inline-block; margin-top: 12px; background: #111827; color: #ffffff; padding: 10px 16px; border-radius: 999px; text-decoration: none;">${isInvite ? "Activar acceso" : "Restablecer acceso"}</a></p>
            <p style="font-size: 14px; color: #4b5563;">El acceso se activará para ${safeEmail}. Después podrás iniciar sesión en <a href="${safeLoginUrl}">Oro Negro</a>.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      console.error("Investor access email delivery failed", {
        status: response.status,
      });
    }

    return { ok: response.ok };
  } catch {
    console.error("Investor access email delivery failed", {
      status: "network_error",
    });
    return { ok: false as const };
  }
}

async function sendSupabaseRecoveryEmail(email: string) {
  try {
    const admin = createAdminClient();
    const redirectTo = new URL("/auth/confirm", getSiteUrl());
    redirectTo.searchParams.set("next", "/recuperar-contrasena/reset");
    const { error } = await admin.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo.toString(),
    });

    if (error) {
      console.error("Supabase recovery email fallback failed", {
        status: error.status ?? "unknown",
      });
    }

    return !error;
  } catch {
    console.error("Supabase recovery email fallback failed", {
      status: "network_error",
    });
    return false;
  }
}

export async function createAndSendInvestorAccess(
  input: InvestorAccessInput,
): Promise<InvestorAccessResult> {
  if (!hasSupabaseAdminEnv()) {
    return { ok: false, error: "auth_config" };
  }

  const accessLinkResult = await createAccessLink(input);

  if ("error" in accessLinkResult) {
    return { ok: false, error: "auth_create" };
  }

  const credentials: InvestorAccessCredentials = {
    accessUrl: accessLinkResult.accessUrl,
    email: input.email,
    investorName: input.investorName,
    loginUrl: new URL("/?role=investor", getSiteUrl()).toString(),
    mode: accessLinkResult.mode,
  };
  const emailResult = await sendInvestorAccessEmail(credentials);

  return { credentials, ok: true, status: emailResult.ok ? "sent" : "manual" };
}

export async function createAndSendInvestorRecovery(
  email: string,
): Promise<InvestorRecoveryResult> {
  if (!hasSupabaseAdminEnv()) {
    return { ok: false };
  }

  try {
    const admin = createAdminClient();
    const requestedAt = new Date().toISOString();
    const cooldownExpiresAt = new Date(Date.now() - 60_000).toISOString();
    const { data: investors, error: investorError } = await admin.rpc(
      "claim_investor_password_recovery",
      {
        p_cooldown_before: cooldownExpiresAt,
        p_email: email,
        p_requested_at: requestedAt,
      },
    );

    if (investorError) {
      return { ok: false };
    }

    const investor = investors?.[0];

    if (!investor) {
      return { ok: true };
    }

    const { data, error } = await admin.auth.admin.generateLink({
      email,
      type: "recovery",
    });
    const tokenHash = data?.properties?.hashed_token;
    const verificationType = data?.properties?.verification_type;

    if (error || !tokenHash || verificationType !== "recovery") {
      return { ok: false };
    }

    const investorName = `${investor.first_name} ${investor.last_name}`.trim();
    const accessEmailResult = await sendInvestorAccessEmail({
      accessUrl: getAccessUrl(tokenHash, verificationType),
      email,
      investorName: investorName || "inversor",
      loginUrl: new URL("/?role=investor", getSiteUrl()).toString(),
      mode: "recovery",
    });

    if (accessEmailResult.ok) {
      return { ok: true };
    }

    return { ok: await sendSupabaseRecoveryEmail(email) };
  } catch {
    return { ok: false };
  }
}
