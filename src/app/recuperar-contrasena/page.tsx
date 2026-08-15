import type { Metadata } from "next";

import { PasswordRecoveryRequestForm } from "@/components/auth/password-recovery-request-form";

export const metadata: Metadata = {
  title: "Recupera tu acceso | Oro Negro",
  description: "Solicita un enlace para cambiar tu contraseña",
};

export default function PasswordRecoveryPage() {
  return <PasswordRecoveryRequestForm />;
}
