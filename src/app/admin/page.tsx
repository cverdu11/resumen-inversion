import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Panel trader | Resumen de Inversión",
  description: "Dashboard mock para gestión de inversores",
};

type AdminPageProps = {
  searchParams?: Promise<{
    investor?: string;
    password_error?: string;
    password_status?: string;
    tab?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
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

  return (
    <AdminDashboard
      activeTab={params?.tab === "rentabilidad" ? "rentabilidad" : "panel"}
      passwordError={params?.password_error}
      passwordStatus={params?.password_status}
      selectedInvestorSlug={params?.investor}
      userEmail={user.email}
    />
  );
}
