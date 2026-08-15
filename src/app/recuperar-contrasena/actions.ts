"use server";

import {
  escapeHtml,
  getSiteUrl,
} from "@/lib/investor-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

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

function getRecoveryUrl(tokenHash: string) {
  const url = new URL("/auth/confirm", getSiteUrl());

  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", "recovery");

  return url.toString();
}

async function sendRecoveryEmail(email: string, recoveryUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.INVESTOR_ACCESS_EMAIL_FROM ??
    process.env.RESEND_FROM_EMAIL ??
    "";

  if (!apiKey || !from) {
    console.error("[password-recovery] Resend configuration is missing.");
    return false;
  }

  const safeRecoveryUrl = escapeHtml(recoveryUrl);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Recupera tu acceso a Oro Negro",
      text: [
        "Has solicitado recuperar tu acceso a Oro Negro.",
        "",
        `Continúa aquí: ${recoveryUrl}`,
        "",
        "Si no has solicitado este correo, puedes ignorarlo.",
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
          <h1 style="font-size: 20px; margin: 0 0 16px;">Recupera tu acceso</h1>
          <p>Has solicitado elegir una nueva contraseña para Oro Negro.</p>
          <p>
            <a href="${safeRecoveryUrl}" style="display: inline-block; margin-top: 12px; background: #111827; color: #ffffff; padding: 10px 16px; border-radius: 999px; text-decoration: none;">
              Continuar con la recuperación
            </a>
          </p>
          <p style="color: #6b7280; font-size: 13px;">
            Si no has solicitado este correo, puedes ignorarlo.
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    console.error(
      `[password-recovery] Resend returned HTTP ${response.status}.`,
    );
  }

  return response.ok;
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

    const { data, error } = await admin.auth.admin.generateLink({
      email,
      options: {
        redirectTo: `${getSiteUrl()}/auth/confirm`,
      },
      type: "recovery",
    });

    if (error || !data.properties.hashed_token) {
      console.error(
        `[password-recovery] Recovery link generation failed: ${error?.message ?? "missing token"}`,
      );
      return { ok: true };
    }

    const didSend = await sendRecoveryEmail(
      email,
      getRecoveryUrl(data.properties.hashed_token),
    );

    return didSend
      ? { ok: true }
      : { error: "unavailable", ok: false };
  } catch {
    console.error("[password-recovery] Unexpected recovery request failure.");
    return { error: "unavailable", ok: false };
  }
}
