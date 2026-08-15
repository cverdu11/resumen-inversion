import type { Metadata } from "next";

import { PasswordRecoveryConfirmPage } from "@/components/auth/password-recovery-confirm-page";

export const metadata: Metadata = {
  title: "Confirma tu recuperación | Oro Negro",
  description: "Confirma el enlace para cambiar tu contraseña",
};

type AuthConfirmPageProps = {
  searchParams?: Promise<{
    token_hash?: string;
    type?: string;
  }>;
};

export default async function AuthConfirmPage({
  searchParams,
}: AuthConfirmPageProps) {
  const params = await searchParams;

  return (
    <PasswordRecoveryConfirmPage
      tokenHash={params?.token_hash ?? null}
      isRecovery={params?.type === "recovery"}
    />
  );
}
