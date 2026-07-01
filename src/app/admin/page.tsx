import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import type { InvestorStatus, MockInvestor } from "@/lib/admin-mock-data";
import { formatMonthName } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Panel trader | Resumen de Inversión",
  description: "Dashboard mock para gestión de inversores",
};

type AdminPageProps = {
  searchParams?: Promise<{
    investor?: string;
    investor_error?: string;
    password_error?: string;
    password_status?: string;
    tab?: string;
  }>;
};

type DatabaseInvestorRow = {
  id: number;
  first_name: string;
  last_name: string;
  slug: string;
  start_date: string;
  status: string;
};

type DatabaseMovementRow = {
  id: number;
  investor_id: number;
  movement_type: "initial_contribution" | "contribution" | "withdrawal";
  movement_date: string;
  amount: string | number;
  note: string | null;
};

const validInvestorStatuses = new Set<InvestorStatus>([
  "active",
  "watch",
  "pending",
  "paused",
]);

function toInvestorStatus(value: string): InvestorStatus {
  return validInvestorStatuses.has(value as InvestorStatus)
    ? (value as InvestorStatus)
    : "pending";
}

function formatTimelineDate(date: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function getMovementLabel(type: DatabaseMovementRow["movement_type"]) {
  if (type === "withdrawal") {
    return "Retirada parcial";
  }

  if (type === "contribution") {
    return "Aportacion parcial";
  }

  return "Alta de inversor";
}

function getMovementDetail(type: DatabaseMovementRow["movement_type"]) {
  if (type === "withdrawal") {
    return "Movimiento de salida aplicado";
  }

  if (type === "contribution") {
    return "Incremento de capital neto";
  }

  return "Capital inicial registrado";
}

function mapDatabaseInvestors(
  investors: DatabaseInvestorRow[],
  movements: DatabaseMovementRow[],
): MockInvestor[] {
  const movementsByInvestor = new Map<number, DatabaseMovementRow[]>();

  for (const movement of movements) {
    const existingMovements = movementsByInvestor.get(movement.investor_id);

    if (existingMovements) {
      existingMovements.push(movement);
    } else {
      movementsByInvestor.set(movement.investor_id, [movement]);
    }
  }

  return investors.map((investor) => {
    const investorMovements = movementsByInvestor.get(investor.id) ?? [];
    const initialContribution = investorMovements
      .filter((movement) => movement.movement_type === "initial_contribution")
      .reduce((total, movement) => total + Number(movement.amount), 0);
    const additionalContributions = investorMovements
      .filter((movement) => movement.movement_type === "contribution")
      .reduce((total, movement) => total + Number(movement.amount), 0);
    const withdrawals = investorMovements
      .filter((movement) => movement.movement_type === "withdrawal")
      .reduce((total, movement) => total + Number(movement.amount), 0);
    const currentBalance =
      initialContribution + additionalContributions - withdrawals;

    return {
      id: `inv-db-${investor.id}`,
      name: investor.first_name,
      surname: investor.last_name,
      slug: investor.slug,
      startDate: investor.start_date,
      initialContribution,
      additionalContributions,
      withdrawals,
      currentBalance,
      profit: 0,
      profitabilityPct: 0,
      status: toInvestorStatus(investor.status),
      movements: investorMovements.map((movement) => ({
        id: `mov-db-${movement.id}`,
        sourceId: movement.id,
        sourceType: movement.movement_type,
        date: movement.movement_date,
        type:
          movement.movement_type === "withdrawal"
            ? ("withdrawal" as const)
            : ("contribution" as const),
        amount: Number(movement.amount),
        note: movement.note ?? getMovementLabel(movement.movement_type),
      })),
      timeline: investorMovements.map((movement) => ({
        id: `tl-db-${movement.id}`,
        date: formatTimelineDate(movement.movement_date),
        label: getMovementLabel(movement.movement_type),
        detail: getMovementDetail(movement.movement_type),
      })),
      monthlySummary: [
        {
          id: `db-${investor.id}-current`,
          month: formatMonthName(investor.start_date),
          balance: currentBalance,
          profit: 0,
          returnPct: 0,
        },
      ],
    };
  });
}

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

  const { data: investorRows } = await supabase
    .from("investors")
    .select("id, first_name, last_name, slug, start_date, status")
    .order("created_at", { ascending: true });
  const databaseInvestorRows = (investorRows ?? []) as DatabaseInvestorRow[];
  const investorIds = databaseInvestorRows.map((investor) => investor.id);
  const { data: movementRows } = investorIds.length
    ? await supabase
        .from("investor_movements")
        .select("id, investor_id, movement_type, movement_date, amount, note")
        .in("investor_id", investorIds)
        .order("movement_date", { ascending: true })
    : { data: [] };
  const databaseInvestors = mapDatabaseInvestors(
    databaseInvestorRows,
    (movementRows ?? []) as DatabaseMovementRow[],
  );

  return (
    <AdminDashboard
      activeTab={params?.tab === "rentabilidad" ? "rentabilidad" : "panel"}
      databaseInvestors={databaseInvestors}
      investorError={params?.investor_error}
      passwordError={params?.password_error}
      passwordStatus={params?.password_status}
      selectedInvestorSlug={params?.investor}
      userEmail={user.email}
    />
  );
}
