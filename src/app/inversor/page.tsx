import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { InvestmentDashboard } from "@/components/dashboard/investment-dashboard";
import {
  buildInvestorDashboardData,
  type InvestorDashboardInvestorRow,
  type InvestorDashboardMovementRow,
  type InvestorDashboardWeeklyRow,
} from "@/lib/investor-dashboard-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Panel inversor | Oro Negro",
  description: "Resumen de capital, beneficio y evolución de la inversión",
};

type InvestorPageProps = {
  searchParams?: Promise<{
    login_status?: string;
    password_error?: string;
    password_status?: string;
  }>;
};

type InvestorRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  start_date: string;
};

export default async function InvestorPage({ searchParams }: InvestorPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/?role=investor&login_error=session_required");
  }

  const dataClient = hasSupabaseAdminEnv() ? createAdminClient() : supabase;
  const { data: investor, error } = await dataClient
    .from("investors")
    .select("id, first_name, last_name, email, start_date")
    .ilike("email", user.email)
    .maybeSingle();

  if (error || !investor) {
    await supabase.auth.signOut();
    redirect("/?role=investor&login_error=unauthorized_investor");
  }

  const typedInvestor = investor as InvestorRow;
  const investorName = `${typedInvestor.first_name} ${typedInvestor.last_name}`;
  const userMetadata = user.user_metadata ?? {};
  const requiresPasswordChange =
    userMetadata.must_change_password === true ||
    (userMetadata.role === "investor" && !userMetadata.password_updated_at);
  const { data: movementRows } = await dataClient
    .from("investor_movements")
    .select("id, movement_type, movement_date, amount, note")
    .eq("investor_id", typedInvestor.id)
    .order("movement_date", { ascending: true });
  const { data: weeklyRows } = await dataClient
    .from("weekly_profitability")
    .select("id, week_start, week_end, return_pct, status")
    .eq("status", "closed")
    .order("week_start", { ascending: true });
  const dashboardData = buildInvestorDashboardData({
    investor: typedInvestor as InvestorDashboardInvestorRow,
    movements: (movementRows ?? []) as InvestorDashboardMovementRow[],
    weeklyRows: (weeklyRows ?? []) as InvestorDashboardWeeklyRow[],
  });

  return (
    <InvestmentDashboard
      dashboardData={dashboardData}
      investorName={investorName}
      loginStatus={params?.login_status}
      passwordError={params?.password_error}
      passwordStatus={params?.password_status}
      requiresPasswordChange={requiresPasswordChange}
      subtitle={`Resumen privado de ${investorName}`}
      title="Panel inversor"
      userEmail={user.email}
    />
  );
}
