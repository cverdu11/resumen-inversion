import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { InvestmentDashboard } from "@/components/dashboard/investment-dashboard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Panel inversor | Oro Negro",
  description: "Resumen de capital, beneficio y evolución de la inversión",
};

type InvestorPageProps = {
  searchParams?: Promise<{
    login_status?: string;
  }>;
};

type InvestorRow = {
  first_name: string;
  last_name: string;
  email: string | null;
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

  const { data: investor, error } = await supabase
    .from("investors")
    .select("first_name, last_name, email")
    .ilike("email", user.email)
    .maybeSingle();

  if (error || !investor) {
    await supabase.auth.signOut();
    redirect("/?role=investor&login_error=unauthorized_investor");
  }

  const typedInvestor = investor as InvestorRow;
  const investorName = `${typedInvestor.first_name} ${typedInvestor.last_name}`;

  return (
    <InvestmentDashboard
      loginStatus={params?.login_status}
      subtitle={`Resumen privado de ${investorName}`}
      title="Panel inversor"
      userEmail={user.email}
    />
  );
}
