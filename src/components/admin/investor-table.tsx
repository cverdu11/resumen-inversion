"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  Copy,
  Eye,
  EyeOff,
  Mail,
  Pencil,
  Plus,
  Save,
  Trash2,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useFormStatus } from "react-dom";

import {
  deleteInvestor,
  sendInvestorAccess,
  updateInvestor,
} from "@/app/admin/actions";
import { CreateInvestorForm } from "@/components/admin/create-investor-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getInvestorFullName,
  type InvestorStatus,
  type MockInvestor,
} from "@/lib/admin-mock-data";
import {
  formatCurrency,
  formatFullDate,
  formatPercent,
  valueTone,
} from "@/lib/formatters";
import type { InvestorAccessCredentials } from "@/lib/investor-access";
import { cn } from "@/lib/utils";

const editInputClassName =
  "h-9 w-full rounded-md border bg-background/45 px-3 text-sm text-card-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-[3px] focus:ring-ring/30";

const editLabelClassName =
  "text-xs font-semibold uppercase text-muted-foreground";

const accessButtonClassName = "h-10 w-full justify-center sm:w-52";

const accessStatusCopy: Record<string, string> = {
  sent: "Credenciales generadas. Resend ha aceptado el envio del correo.",
};

const accessErrorCopy: Record<string, string> = {
  auth_config:
    "Email guardado, pero falta configurar SUPABASE_SERVICE_ROLE_KEY para crear el usuario de acceso.",
  auth_create: "No se pudo crear o actualizar el usuario de acceso.",
  duplicate_email: "Ese email ya esta asignado a otro inversor.",
  email_config:
    "Usuario creado, pero falta configurar RESEND_API_KEY e INVESTOR_ACCESS_EMAIL_FROM para enviar el correo.",
  email_send: "No se pudo enviar el correo de credenciales.",
  invalid_email: "El email del inversor no es valido.",
  missing_email: "Anade un email al inversor antes de enviar credenciales.",
  trader_email: "Ese email pertenece a una cuenta trader activa.",
};

const investorErrorCopy: Record<string, string> = {
  duplicate_email: accessErrorCopy.duplicate_email,
  invalid_email: accessErrorCopy.invalid_email,
  trader_email: accessErrorCopy.trader_email,
};

type InvestorSortKey =
  | "additionalContributions"
  | "currentBalance"
  | "initialContribution"
  | "name"
  | "profit"
  | "profitabilityPct"
  | "startDate"
  | "status"
  | "withdrawals";

type SortDirection = "asc" | "desc";

type InvestorSortConfig = {
  direction: SortDirection;
  key: InvestorSortKey;
};

const statusStyles: Record<
  InvestorStatus,
  {
    label: string;
    className: string;
  }
> = {
  active: {
    label: "Activo",
    className: "border-positive/35 bg-positive-soft text-positive",
  },
  watch: {
    label: "Seguimiento",
    className: "border-warning/35 bg-warning-soft text-warning",
  },
  pending: {
    label: "Pendiente",
    className: "border-info/35 bg-info-soft text-info",
  },
  paused: {
    label: "Pausado",
    className: "border-muted-foreground/30 bg-muted/60 text-muted-foreground",
  },
};

const statusSortRank: Record<InvestorStatus, number> = {
  active: 0,
  watch: 1,
  pending: 2,
  paused: 3,
};

const firstSortDirection: Record<InvestorSortKey, SortDirection> = {
  additionalContributions: "desc",
  currentBalance: "desc",
  initialContribution: "desc",
  name: "asc",
  profit: "desc",
  profitabilityPct: "desc",
  startDate: "desc",
  status: "asc",
  withdrawals: "desc",
};

export function InvestorStatusPill({ status }: { status: InvestorStatus }) {
  const styles = statusStyles[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-[0.68rem] font-semibold uppercase",
        styles.className,
      )}
    >
      {styles.label}
    </span>
  );
}

function compareInvestorNames(left: MockInvestor, right: MockInvestor) {
  return getInvestorFullName(left).localeCompare(getInvestorFullName(right), "es", {
    sensitivity: "base",
  });
}

function compareInvestorsByKey(
  left: MockInvestor,
  right: MockInvestor,
  sortKey: InvestorSortKey,
) {
  switch (sortKey) {
    case "additionalContributions":
      return left.additionalContributions - right.additionalContributions;
    case "currentBalance":
      return left.currentBalance - right.currentBalance;
    case "initialContribution":
      return left.initialContribution - right.initialContribution;
    case "name":
      return compareInvestorNames(left, right);
    case "profit":
      return left.profit - right.profit;
    case "profitabilityPct":
      return left.profitabilityPct - right.profitabilityPct;
    case "startDate":
      return left.startDate.localeCompare(right.startDate);
    case "status":
      return statusSortRank[left.status] - statusSortRank[right.status];
    case "withdrawals":
      return left.withdrawals - right.withdrawals;
  }
}

function sortInvestors(
  investors: MockInvestor[],
  sortConfig: InvestorSortConfig | null,
) {
  if (sortConfig === null) {
    return investors;
  }

  return [...investors].sort((left, right) => {
    const directionMultiplier = sortConfig.direction === "asc" ? 1 : -1;
    const primaryComparison =
      compareInvestorsByKey(left, right, sortConfig.key) * directionMultiplier;

    return primaryComparison !== 0
      ? primaryComparison
      : compareInvestorNames(left, right);
  });
}

function SortableTableHead({
  align = "left",
  children,
  className,
  onSort,
  sortConfig,
  sortKey,
}: {
  align?: "left" | "right";
  children: ReactNode;
  className?: string;
  onSort: (sortKey: InvestorSortKey) => void;
  sortConfig: InvestorSortConfig | null;
  sortKey: InvestorSortKey;
}) {
  const isActive = sortConfig?.key === sortKey;
  const ariaSort = isActive
    ? sortConfig.direction === "asc"
      ? "ascending"
      : "descending"
    : "none";
  const SortIcon = !isActive
    ? ArrowUpDown
    : sortConfig.direction === "asc"
      ? ArrowUp
      : ArrowDown;

  return (
    <TableHead aria-sort={ariaSort} className={className}>
      <button
        className={cn(
          "inline-flex w-full items-center gap-1.5 rounded-md py-1 text-xs font-medium uppercase text-muted-foreground transition-colors hover:text-card-foreground",
          align === "right" ? "justify-end" : "justify-start",
          isActive && "text-card-foreground",
        )}
        onClick={() => onSort(sortKey)}
        title="Ordenar"
        type="button"
      >
        <span>{children}</span>
        <SortIcon
          className={cn(
            "size-3.5 shrink-0",
            isActive ? "text-primary" : "text-muted-foreground/70",
          )}
        />
      </button>
    </TableHead>
  );
}

function DeleteInvestorButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-danger transition-colors hover:bg-danger-soft disabled:cursor-default disabled:opacity-55"
    >
      <Trash2 className="size-4" />
      {pending ? "Eliminando..." : "Eliminar inversor"}
    </button>
  );
}

function UpdateInvestorButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className={accessButtonClassName}
      type="submit"
      size="sm"
      disabled={pending}
    >
      <Save data-icon="inline-start" />
      {pending ? "Guardando..." : "Guardar cambios"}
    </Button>
  );
}

function SendInvestorAccessButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className={accessButtonClassName}
      type="submit"
      size="sm"
      variant="outline"
      disabled={pending}
    >
      <Mail data-icon="inline-start" />
      {pending ? "Enviando..." : "Enviar credenciales"}
    </Button>
  );
}

function InvestorAccessCredentialsPanel({
  credentials,
}: {
  credentials: InvestorAccessCredentials;
}) {
  const [isCopied, setIsCopied] = useState(false);
  const credentialsText = [
    `Inversor: ${credentials.investorName}`,
    `Usuario: ${credentials.email}`,
    `Contrasena: ${credentials.password}`,
    `Login: ${credentials.loginUrl}`,
  ].join("\n");

  async function copyCredentials() {
    try {
      await navigator.clipboard.writeText(credentialsText);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2200);
    } catch {
      setIsCopied(false);
    }
  }

  return (
    <div className="border-b bg-background/26 px-5 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-card-foreground">
            Credenciales temporales listas para copiar
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Puedes enviarlas manualmente al inversor. La contrasena se regenera
            cada vez que pulsas enviar credenciales.
          </p>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <div className="rounded-md border bg-background/45 px-3 py-2">
              <p className="text-[0.68rem] font-semibold uppercase text-muted-foreground">
                Usuario
              </p>
              <p className="mt-1 truncate font-semibold text-card-foreground">
                {credentials.email}
              </p>
            </div>
            <div className="rounded-md border bg-background/45 px-3 py-2">
              <p className="text-[0.68rem] font-semibold uppercase text-muted-foreground">
                Contrasena
              </p>
              <p className="mt-1 font-semibold tracking-normal text-card-foreground">
                {credentials.password}
              </p>
            </div>
            <div className="rounded-md border bg-background/45 px-3 py-2">
              <p className="text-[0.68rem] font-semibold uppercase text-muted-foreground">
                Login
              </p>
              <p className="mt-1 truncate font-semibold text-card-foreground">
                {credentials.loginUrl}
              </p>
            </div>
          </div>
        </div>
        <Button
          className="shrink-0 justify-center"
          onClick={copyCredentials}
          size="sm"
          type="button"
          variant="outline"
        >
          {isCopied ? (
            <Check data-icon="inline-start" />
          ) : (
            <Copy data-icon="inline-start" />
          )}
          {isCopied ? "Copiado" : "Copiar credenciales"}
        </Button>
      </div>
    </div>
  );
}

function InvestorEditPanel({ investor }: { investor: MockInvestor }) {
  return (
    <div className="grid gap-4 rounded-md border bg-background/24 p-4">
      <form action={updateInvestor} className="grid gap-4">
        <input type="hidden" name="current_slug" value={investor.slug} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="grid gap-1.5">
            <span className={editLabelClassName}>Nombre</span>
            <input
              className={editInputClassName}
              name="name"
              defaultValue={investor.name}
              required
            />
          </label>
          <label className="grid gap-1.5">
            <span className={editLabelClassName}>Apellidos</span>
            <input
              className={editInputClassName}
              name="surname"
              defaultValue={investor.surname}
              required
            />
          </label>
          <label className="grid gap-1.5">
            <span className={editLabelClassName}>Email inversor</span>
            <input
              className={editInputClassName}
              name="email"
              type="email"
              inputMode="email"
              defaultValue={investor.email ?? ""}
              placeholder="inversor@email.com"
            />
          </label>
          <label className="grid gap-1.5">
            <span className={editLabelClassName}>Fecha inicio</span>
            <input
              className={editInputClassName}
              lang="es-ES"
              name="start_date"
              type="date"
              defaultValue={investor.startDate}
              required
            />
          </label>
          <label className="grid gap-1.5">
            <span className={editLabelClassName}>Aportación inicial</span>
            <input
              className={cn(editInputClassName, "tabular-nums")}
              name="initial_contribution"
              type="text"
              inputMode="decimal"
              defaultValue={String(investor.initialContribution)}
              required
            />
          </label>
          <label className="grid gap-1.5">
            <span className={editLabelClassName}>Estado</span>
            <select
              className={editInputClassName}
              name="status"
              defaultValue={investor.status}
            >
              <option value="active">Activo</option>
              <option value="pending">Pendiente</option>
              <option value="watch">Seguimiento</option>
              <option value="paused">Pausado</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            La ruta se actualiza automaticamente si cambias el nombre. Si
            anades o cambias el email, se enviaran nuevas credenciales.
          </p>
          <div className="w-full sm:w-auto">
            <UpdateInvestorButton />
          </div>
        </div>
      </form>
      {investor.email ? (
        <form action={sendInvestorAccess} className="flex justify-end">
          <input type="hidden" name="slug" value={investor.slug} />
          <SendInvestorAccessButton />
        </form>
      ) : null}
      <div className="border-t pt-3">
        <form
          action={deleteInvestor}
          className="max-w-56"
          onSubmit={(event) => {
            if (
              !window.confirm(
                `Eliminar a ${getInvestorFullName(investor)} del dashboard y la base de datos?`,
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="slug" value={investor.slug} />
          <DeleteInvestorButton />
        </form>
      </div>
    </div>
  );
}

function MobileInvestorCard({
  investor,
  isEditing,
  isSelected,
  onToggleEdit,
}: {
  investor: MockInvestor;
  isEditing: boolean;
  isSelected: boolean;
  onToggleEdit: () => void;
}) {
  return (
    <div
      className={cn(
        "w-full border-b px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-secondary/35",
        isSelected && "bg-secondary/55",
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 items-start gap-3">
          <Button
            variant={isEditing ? "secondary" : "ghost"}
            size="icon"
            className="size-8 rounded-sm"
            aria-label={`Editar ${getInvestorFullName(investor)}`}
            onClick={onToggleEdit}
          >
            <Pencil data-icon="inline-start" />
          </Button>
          <Link
            href={isSelected ? "/admin" : `/admin?investor=${investor.slug}`}
            className="min-w-0"
            aria-current={isSelected ? "true" : undefined}
          >
            <span className="block truncate text-sm font-semibold text-card-foreground">
              {getInvestorFullName(investor)}
            </span>
            <span className="mt-1 block truncate text-xs text-muted-foreground">
              ID {investor.id.replace("inv-", "")}
            </span>
            <span className="mt-1 block truncate text-xs text-muted-foreground">
              {investor.email ?? "Sin email de acceso"}
            </span>
          </Link>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <InvestorStatusPill status={investor.status} />
        </span>
      </span>

      <span className="mt-4 grid grid-cols-2 gap-2">
        <span className="rounded-md border bg-background/28 px-3 py-2">
          <span className="block text-[0.68rem] font-medium uppercase text-muted-foreground">
            Balance
          </span>
          <span className="mt-1 block text-sm font-semibold tabular-nums text-card-foreground">
            {formatCurrency(investor.currentBalance)}
          </span>
        </span>
        <span className="rounded-md border bg-background/28 px-3 py-2">
          <span className="block text-[0.68rem] font-medium uppercase text-muted-foreground">
            Beneficio
          </span>
          <span
            className={cn(
              "mt-1 block text-sm font-semibold tabular-nums",
              valueTone(investor.profit),
            )}
          >
            {formatCurrency(investor.profit, { sign: true })}
          </span>
        </span>
        <span className="rounded-md border bg-background/28 px-3 py-2">
          <span className="block text-[0.68rem] font-medium uppercase text-muted-foreground">
            Inicio
          </span>
          <span className="mt-1 block text-sm font-semibold tabular-nums text-card-foreground">
            {formatFullDate(investor.startDate)}
          </span>
        </span>
        <span className="rounded-md border bg-background/28 px-3 py-2">
          <span className="block text-[0.68rem] font-medium uppercase text-muted-foreground">
            Rentabilidad
          </span>
          <span
            className={cn(
              "mt-1 block text-sm font-semibold tabular-nums",
              valueTone(investor.profitabilityPct),
            )}
          >
            {formatPercent(investor.profitabilityPct, { sign: true })}
          </span>
        </span>
      </span>
      {isEditing ? (
        <div className="mt-4">
          <InvestorEditPanel investor={investor} />
        </div>
      ) : null}
    </div>
  );
}

export function InvestorTable({
  accessCredentials,
  accessError,
  accessStatus,
  investorError,
  investors,
  selectedInvestorId,
}: {
  accessCredentials?: InvestorAccessCredentials;
  accessError?: string;
  accessStatus?: string;
  investorError?: string;
  investors: MockInvestor[];
  selectedInvestorId: string;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingInvestorSlug, setEditingInvestorSlug] = useState<string | null>(
    null,
  );
  const [sortConfig, setSortConfig] = useState<InvestorSortConfig | null>(null);
  const sortedInvestors = useMemo(
    () => sortInvestors(investors, sortConfig),
    [investors, sortConfig],
  );

  function toggleEditingInvestor(slug: string) {
    setEditingInvestorSlug((currentSlug) =>
      currentSlug === slug ? null : slug,
    );
  }

  function handleSort(sortKey: InvestorSortKey) {
    setSortConfig((currentSortConfig) => {
      if (currentSortConfig?.key !== sortKey) {
        return {
          direction: firstSortDirection[sortKey],
          key: sortKey,
        };
      }

      return {
        direction: currentSortConfig.direction === "asc" ? "desc" : "asc",
        key: sortKey,
      };
    });
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-col items-start gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <UsersRound className="size-5 shrink-0 text-card-foreground" />
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold uppercase">
              Inversores
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {investors.length} perfiles en cartera
            </p>
          </div>
        </div>
        <Button
          variant={isCreating ? "secondary" : "outline"}
          size="sm"
          aria-expanded={isCreating}
          onClick={() => setIsCreating((current) => !current)}
        >
          <Plus data-icon="inline-start" />
          Nuevo inversor
        </Button>
      </CardHeader>
      {isCreating ? (
        <CreateInvestorForm onCancel={() => setIsCreating(false)} />
      ) : null}
      {investorError ? (
        <div className="border-b bg-danger-soft px-5 py-3 text-sm font-medium text-danger">
          {investorErrorCopy[investorError] ??
            "No se pudo guardar el cambio. Revisa los datos e intentalo de nuevo."}
        </div>
      ) : null}
      {accessStatus && accessStatusCopy[accessStatus] ? (
        <div className="border-b bg-positive-soft px-5 py-3 text-sm font-medium text-positive">
          {accessStatusCopy[accessStatus]}
        </div>
      ) : null}
      {accessError && accessErrorCopy[accessError] ? (
        <div className="border-b bg-warning-soft px-5 py-3 text-sm font-medium text-warning">
          {accessErrorCopy[accessError]}
        </div>
      ) : null}
      {accessCredentials ? (
        <InvestorAccessCredentialsPanel credentials={accessCredentials} />
      ) : null}
      <CardContent className="p-0">
        <div className="lg:hidden">
          {investors.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No hay inversores registrados todavia.
            </div>
          ) : null}
          {sortedInvestors.map((investor) => (
            <MobileInvestorCard
              key={investor.id}
              investor={investor}
              isEditing={editingInvestorSlug === investor.slug}
              isSelected={selectedInvestorId === investor.id}
              onToggleEdit={() => toggleEditingInvestor(investor.slug)}
            />
          ))}
        </div>
        <Table
          containerClassName="hidden lg:block"
          className="min-w-[1108px] [&_td]:px-3 [&_th]:px-3"
        >
          <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur">
            <TableRow className="hover:bg-transparent">
              <SortableTableHead
                className="min-w-[220px]"
                onSort={handleSort}
                sortConfig={sortConfig}
                sortKey="name"
              >
                Inversor
              </SortableTableHead>
              <SortableTableHead
                className="min-w-[90px]"
                onSort={handleSort}
                sortConfig={sortConfig}
                sortKey="startDate"
              >
                Fecha inicio
              </SortableTableHead>
              <SortableTableHead
                align="right"
                className="min-w-[124px] text-right"
                onSort={handleSort}
                sortConfig={sortConfig}
                sortKey="initialContribution"
              >
                Aportación inicial
              </SortableTableHead>
              <SortableTableHead
                align="right"
                className="min-w-[150px] text-right"
                onSort={handleSort}
                sortConfig={sortConfig}
                sortKey="additionalContributions"
              >
                Aportaciones parciales
              </SortableTableHead>
              <SortableTableHead
                align="right"
                className="min-w-[110px] text-right"
                onSort={handleSort}
                sortConfig={sortConfig}
                sortKey="withdrawals"
              >
                Retiradas
              </SortableTableHead>
              <SortableTableHead
                align="right"
                className="min-w-[135px] text-right"
                onSort={handleSort}
                sortConfig={sortConfig}
                sortKey="currentBalance"
              >
                Balance actual
              </SortableTableHead>
              <SortableTableHead
                align="right"
                className="min-w-[105px] text-right"
                onSort={handleSort}
                sortConfig={sortConfig}
                sortKey="profit"
              >
                Beneficio
              </SortableTableHead>
              <SortableTableHead
                align="right"
                className="min-w-[120px] text-right"
                onSort={handleSort}
                sortConfig={sortConfig}
                sortKey="profitabilityPct"
              >
                Rentabilidad
              </SortableTableHead>
              <SortableTableHead
                className="min-w-[95px]"
                onSort={handleSort}
                sortConfig={sortConfig}
                sortKey="status"
              >
                Estado
              </SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {investors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-28 text-center text-sm text-muted-foreground"
                >
                  No hay inversores registrados todavia.
                </TableCell>
              </TableRow>
            ) : null}
            {sortedInvestors.map((investor) => {
              const isSelected = selectedInvestorId === investor.id;

              return (
                <Fragment key={investor.id}>
                  <TableRow
                    data-state={isSelected ? "selected" : undefined}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Button
                          variant={
                            editingInvestorSlug === investor.slug
                              ? "secondary"
                              : "ghost"
                          }
                          size="icon"
                          className="size-8 rounded-sm"
                          aria-label={`Editar ${getInvestorFullName(investor)}`}
                          onClick={() => toggleEditingInvestor(investor.slug)}
                        >
                          <Pencil data-icon="inline-start" />
                        </Button>
                        <Button
                          variant={isSelected ? "default" : "ghost"}
                          size="icon"
                          className="size-8 rounded-sm"
                          aria-label={
                            isSelected
                              ? `Ocultar vista previa de ${getInvestorFullName(
                                  investor,
                                )}`
                              : `Vista previa de ${getInvestorFullName(
                                  investor,
                                )}`
                          }
                          asChild
                        >
                          <Link
                            href={
                              isSelected
                                ? "/admin"
                                : `/admin?investor=${investor.slug}`
                            }
                          >
                            {isSelected ? (
                              <Eye data-icon="inline-start" />
                            ) : (
                              <EyeOff data-icon="inline-start" />
                            )}
                          </Link>
                        </Button>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-card-foreground">
                            {getInvestorFullName(investor)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            ID {investor.id.replace("inv-", "")}
                          </p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {investor.email ?? "Sin email de acceso"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums text-card-foreground/86">
                      {formatFullDate(investor.startDate)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-card-foreground/86">
                      {formatCurrency(investor.initialContribution)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium text-positive">
                      {formatCurrency(investor.additionalContributions, {
                        sign: true,
                      })}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium text-danger">
                      {investor.withdrawals > 0
                        ? formatCurrency(-investor.withdrawals, { sign: true })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-card-foreground/86">
                      {formatCurrency(investor.currentBalance)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums font-medium",
                        valueTone(investor.profit),
                      )}
                    >
                      {formatCurrency(investor.profit, { sign: true })}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums font-medium",
                        valueTone(investor.profitabilityPct),
                      )}
                    >
                      {formatPercent(investor.profitabilityPct, {
                        sign: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <InvestorStatusPill status={investor.status} />
                    </TableCell>
                  </TableRow>
                  {editingInvestorSlug === investor.slug ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={9} className="bg-background/16 p-4">
                        <InvestorEditPanel investor={investor} />
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
