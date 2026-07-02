export type InvestorStatus = "active" | "watch" | "pending" | "paused";

export type InvestorMovement = {
  id: string;
  sourceId?: number;
  sourceType?: "initial_contribution" | "contribution" | "withdrawal";
  date: string;
  type: "contribution" | "withdrawal";
  amount: number;
  note: string;
};

export type InvestorTimelineItem = {
  id: string;
  date: string;
  label: string;
  detail: string;
};

export type InvestorMonthlySummary = {
  id: string;
  month: string;
  balance: number;
  profit: number;
  returnPct: number;
};

export type MockInvestor = {
  id: string;
  name: string;
  surname: string;
  slug: string;
  email?: string | null;
  startDate: string;
  initialContribution: number;
  additionalContributions: number;
  withdrawals: number;
  currentBalance: number;
  profit: number;
  profitabilityPct: number;
  status: InvestorStatus;
  movements: InvestorMovement[];
  timeline: InvestorTimelineItem[];
  monthlySummary: InvestorMonthlySummary[];
};

export type WeeklyProfitabilityItem = {
  id: string;
  weekLabel: string;
  startDate: string;
  endDate: string;
  returnPct: number;
  status: "closed" | "draft" | "pending";
};

export const mockDataUpdatedAt = "30/06/2026 14:30";

export const mockInvestors: MockInvestor[] = [
  {
    id: "inv-carlos-verdu",
    name: "Carlos",
    surname: "Verdu",
    slug: "carlos-verdu",
    startDate: "2024-05-15",
    initialContribution: 10000,
    additionalContributions: 1000,
    withdrawals: 1000,
    currentBalance: 11193.55,
    profit: 1193.55,
    profitabilityPct: 11.94,
    status: "active",
    movements: [
      {
        id: "mov-cv-1",
        date: "2024-05-15",
        type: "contribution",
        amount: 10000,
        note: "Aportacion inicial",
      },
      {
        id: "mov-cv-2",
        date: "2024-11-08",
        type: "contribution",
        amount: 1000,
        note: "Aportacion parcial",
      },
      {
        id: "mov-cv-3",
        date: "2026-02-20",
        type: "withdrawal",
        amount: 600,
        note: "Retirada parcial",
      },
    ],
    timeline: [
      {
        id: "tl-cv-1",
        date: "15/05/2024",
        label: "Alta de inversor",
        detail: "Capital inicial registrado",
      },
      {
        id: "tl-cv-2",
        date: "08/11/2024",
        label: "Aportacion parcial",
        detail: "Incremento de capital neto",
      },
      {
        id: "tl-cv-3",
        date: "20/02/2026",
        label: "Retirada parcial",
        detail: "Movimiento de salida aplicado",
      },
    ],
    monthlySummary: [
      {
        id: "cv-mar-26",
        month: "Marzo 2026",
        balance: 11193.55,
        profit: 234.91,
        returnPct: 2.14,
      },
      {
        id: "cv-feb-26",
        month: "Febrero 2026",
        balance: 10958.64,
        profit: 156.63,
        returnPct: 1.45,
      },
      {
        id: "cv-ene-26",
        month: "Enero 2026",
        balance: 10802.01,
        profit: -27.07,
        returnPct: -0.25,
      },
    ],
  },
  {
    id: "inv-laura-martin",
    name: "Laura",
    surname: "Martin",
    slug: "laura-martin",
    startDate: "2024-09-02",
    initialContribution: 18000,
    additionalContributions: 3500,
    withdrawals: 0,
    currentBalance: 23780.4,
    profit: 2280.4,
    profitabilityPct: 10.61,
    status: "active",
    movements: [
      {
        id: "mov-lm-1",
        date: "2024-09-02",
        type: "contribution",
        amount: 18000,
        note: "Aportacion inicial",
      },
      {
        id: "mov-lm-2",
        date: "2025-07-10",
        type: "contribution",
        amount: 3500,
        note: "Refuerzo de posicion",
      },
    ],
    timeline: [
      {
        id: "tl-lm-1",
        date: "02/09/2024",
        label: "Alta de inversor",
        detail: "Inicio de periodo invertido",
      },
      {
        id: "tl-lm-2",
        date: "10/07/2025",
        label: "Aportacion parcial",
        detail: "Aumento de exposicion",
      },
    ],
    monthlySummary: [
      {
        id: "lm-jun-26",
        month: "Junio 2026",
        balance: 23780.4,
        profit: 192.8,
        returnPct: 0.82,
      },
      {
        id: "lm-may-26",
        month: "Mayo 2026",
        balance: 23587.6,
        profit: 336.4,
        returnPct: 1.45,
      },
      {
        id: "lm-apr-26",
        month: "Abril 2026",
        balance: 23251.2,
        profit: -92.5,
        returnPct: -0.4,
      },
    ],
  },
  {
    id: "inv-diego-santos",
    name: "Diego",
    surname: "Santos",
    slug: "diego-santos",
    startDate: "2025-01-13",
    initialContribution: 25000,
    additionalContributions: 5000,
    withdrawals: 2500,
    currentBalance: 31540.15,
    profit: 4040.15,
    profitabilityPct: 14.69,
    status: "watch",
    movements: [
      {
        id: "mov-ds-1",
        date: "2025-01-13",
        type: "contribution",
        amount: 25000,
        note: "Aportacion inicial",
      },
      {
        id: "mov-ds-2",
        date: "2025-10-03",
        type: "contribution",
        amount: 5000,
        note: "Aportacion parcial",
      },
      {
        id: "mov-ds-3",
        date: "2026-04-17",
        type: "withdrawal",
        amount: 2500,
        note: "Retirada solicitada",
      },
    ],
    timeline: [
      {
        id: "tl-ds-1",
        date: "13/01/2025",
        label: "Alta de inversor",
        detail: "Cuenta activada",
      },
      {
        id: "tl-ds-2",
        date: "03/10/2025",
        label: "Aportacion parcial",
        detail: "Nueva entrada de capital",
      },
      {
        id: "tl-ds-3",
        date: "17/04/2026",
        label: "Retirada parcial",
        detail: "Seguimiento de liquidez",
      },
    ],
    monthlySummary: [
      {
        id: "ds-jun-26",
        month: "Junio 2026",
        balance: 31540.15,
        profit: 274.5,
        returnPct: 0.88,
      },
      {
        id: "ds-may-26",
        month: "Mayo 2026",
        balance: 31265.65,
        profit: 505.8,
        returnPct: 1.65,
      },
      {
        id: "ds-apr-26",
        month: "Abril 2026",
        balance: 30759.85,
        profit: -116.2,
        returnPct: -0.38,
      },
    ],
  },
  {
    id: "inv-marta-ruiz",
    name: "Marta",
    surname: "Ruiz",
    slug: "marta-ruiz",
    startDate: "2025-03-21",
    initialContribution: 12000,
    additionalContributions: 2000,
    withdrawals: 1200,
    currentBalance: 13928.9,
    profit: 1128.9,
    profitabilityPct: 8.82,
    status: "active",
    movements: [
      {
        id: "mov-mr-1",
        date: "2025-03-21",
        type: "contribution",
        amount: 12000,
        note: "Aportacion inicial",
      },
      {
        id: "mov-mr-2",
        date: "2025-12-12",
        type: "contribution",
        amount: 2000,
        note: "Aportacion parcial",
      },
      {
        id: "mov-mr-3",
        date: "2026-05-08",
        type: "withdrawal",
        amount: 1200,
        note: "Retirada parcial",
      },
    ],
    timeline: [
      {
        id: "tl-mr-1",
        date: "21/03/2025",
        label: "Alta de inversor",
        detail: "Inicio de calculo individual",
      },
      {
        id: "tl-mr-2",
        date: "12/12/2025",
        label: "Aportacion parcial",
        detail: "Movimiento añadido al historial",
      },
      {
        id: "tl-mr-3",
        date: "08/05/2026",
        label: "Retirada parcial",
        detail: "Capital neto actualizado",
      },
    ],
    monthlySummary: [
      {
        id: "mr-jun-26",
        month: "Junio 2026",
        balance: 13928.9,
        profit: 118.3,
        returnPct: 0.86,
      },
      {
        id: "mr-may-26",
        month: "Mayo 2026",
        balance: 13810.6,
        profit: 191.7,
        returnPct: 1.41,
      },
      {
        id: "mr-apr-26",
        month: "Abril 2026",
        balance: 13618.9,
        profit: -48.6,
        returnPct: -0.36,
      },
    ],
  },
  {
    id: "inv-javier-cano",
    name: "Javier",
    surname: "Cano",
    slug: "javier-cano",
    startDate: "2025-08-04",
    initialContribution: 30000,
    additionalContributions: 0,
    withdrawals: 5000,
    currentBalance: 27845.2,
    profit: 2845.2,
    profitabilityPct: 11.38,
    status: "paused",
    movements: [
      {
        id: "mov-jc-1",
        date: "2025-08-04",
        type: "contribution",
        amount: 30000,
        note: "Aportacion inicial",
      },
      {
        id: "mov-jc-2",
        date: "2026-01-30",
        type: "withdrawal",
        amount: 5000,
        note: "Retirada parcial",
      },
    ],
    timeline: [
      {
        id: "tl-jc-1",
        date: "04/08/2025",
        label: "Alta de inversor",
        detail: "Capital inicial recibido",
      },
      {
        id: "tl-jc-2",
        date: "30/01/2026",
        label: "Retirada parcial",
        detail: "Operacion completada",
      },
    ],
    monthlySummary: [
      {
        id: "jc-jun-26",
        month: "Junio 2026",
        balance: 27845.2,
        profit: 238.2,
        returnPct: 0.86,
      },
      {
        id: "jc-may-26",
        month: "Mayo 2026",
        balance: 27607,
        profit: 388.6,
        returnPct: 1.43,
      },
      {
        id: "jc-apr-26",
        month: "Abril 2026",
        balance: 27218.4,
        profit: -109,
        returnPct: -0.4,
      },
    ],
  },
  {
    id: "inv-sofia-navarro",
    name: "Sofia",
    surname: "Navarro",
    slug: "sofia-navarro",
    startDate: "2026-02-09",
    initialContribution: 8000,
    additionalContributions: 1500,
    withdrawals: 0,
    currentBalance: 9824.75,
    profit: 324.75,
    profitabilityPct: 3.42,
    status: "pending",
    movements: [
      {
        id: "mov-sn-1",
        date: "2026-02-09",
        type: "contribution",
        amount: 8000,
        note: "Aportacion inicial",
      },
      {
        id: "mov-sn-2",
        date: "2026-06-05",
        type: "contribution",
        amount: 1500,
        note: "Aportacion parcial",
      },
    ],
    timeline: [
      {
        id: "tl-sn-1",
        date: "09/02/2026",
        label: "Alta de inversor",
        detail: "Pendiente de validacion documental",
      },
      {
        id: "tl-sn-2",
        date: "05/06/2026",
        label: "Aportacion parcial",
        detail: "Movimiento en revision",
      },
    ],
    monthlySummary: [
      {
        id: "sn-jun-26",
        month: "Junio 2026",
        balance: 9824.75,
        profit: 81.7,
        returnPct: 0.84,
      },
      {
        id: "sn-may-26",
        month: "Mayo 2026",
        balance: 8243.05,
        profit: 115.5,
        returnPct: 1.42,
      },
      {
        id: "sn-apr-26",
        month: "Abril 2026",
        balance: 8127.55,
        profit: -31.8,
        returnPct: -0.39,
      },
    ],
  },
  {
    id: "inv-andres-ortega",
    name: "Andres",
    surname: "Ortega",
    slug: "andres-ortega",
    startDate: "2024-11-18",
    initialContribution: 22000,
    additionalContributions: 4000,
    withdrawals: 1500,
    currentBalance: 28962.1,
    profit: 4462.1,
    profitabilityPct: 18.21,
    status: "active",
    movements: [
      {
        id: "mov-ao-1",
        date: "2024-11-18",
        type: "contribution",
        amount: 22000,
        note: "Aportacion inicial",
      },
      {
        id: "mov-ao-2",
        date: "2025-04-25",
        type: "contribution",
        amount: 4000,
        note: "Aportacion parcial",
      },
      {
        id: "mov-ao-3",
        date: "2025-12-19",
        type: "withdrawal",
        amount: 1500,
        note: "Retirada parcial",
      },
    ],
    timeline: [
      {
        id: "tl-ao-1",
        date: "18/11/2024",
        label: "Alta de inversor",
        detail: "Perfil activado",
      },
      {
        id: "tl-ao-2",
        date: "25/04/2025",
        label: "Aportacion parcial",
        detail: "Capital adicional registrado",
      },
      {
        id: "tl-ao-3",
        date: "19/12/2025",
        label: "Retirada parcial",
        detail: "Salida de capital aplicada",
      },
    ],
    monthlySummary: [
      {
        id: "ao-jun-26",
        month: "Junio 2026",
        balance: 28962.1,
        profit: 252.3,
        returnPct: 0.88,
      },
      {
        id: "ao-may-26",
        month: "Mayo 2026",
        balance: 28709.8,
        profit: 411.6,
        returnPct: 1.45,
      },
      {
        id: "ao-apr-26",
        month: "Abril 2026",
        balance: 28298.2,
        profit: -101.1,
        returnPct: -0.36,
      },
    ],
  },
];

export const weeklyProfitability: WeeklyProfitabilityItem[] = [
  {
    id: "week-2026-06-22",
    weekLabel: "Semana 26",
    startDate: "2026-06-22",
    endDate: "2026-06-26",
    returnPct: 0.86,
    status: "draft",
  },
  {
    id: "week-2026-06-15",
    weekLabel: "Semana 25",
    startDate: "2026-06-15",
    endDate: "2026-06-19",
    returnPct: 1.12,
    status: "closed",
  },
  {
    id: "week-2026-06-08",
    weekLabel: "Semana 24",
    startDate: "2026-06-08",
    endDate: "2026-06-12",
    returnPct: -0.42,
    status: "closed",
  },
  {
    id: "week-2026-06-01",
    weekLabel: "Semana 23",
    startDate: "2026-06-01",
    endDate: "2026-06-05",
    returnPct: 0.64,
    status: "closed",
  },
  {
    id: "week-2026-05-25",
    weekLabel: "Semana 22",
    startDate: "2026-05-25",
    endDate: "2026-05-29",
    returnPct: 0.38,
    status: "closed",
  },
  {
    id: "week-2026-06-29",
    weekLabel: "Semana 27",
    startDate: "2026-06-29",
    endDate: "2026-07-03",
    returnPct: 0,
    status: "pending",
  },
];

export function getInvestorFullName(investor: MockInvestor) {
  return `${investor.name} ${investor.surname}`;
}

export function getNetCapital(investor: MockInvestor) {
  return (
    investor.initialContribution +
    investor.additionalContributions -
    investor.withdrawals
  );
}

export function getAdminOverview(
  investors = mockInvestors,
  currentWeekProfitability =
    weeklyProfitability.find((item) => item.status === "draft")?.returnPct ?? 0,
) {
  const totalCapitalInvested = investors.reduce(
    (total, investor) => total + getNetCapital(investor),
    0,
  );
  const totalProfit = investors.reduce(
    (total, investor) => total + investor.profit,
    0,
  );
  const totalProfitability =
    totalCapitalInvested > 0 ? (totalProfit / totalCapitalInvested) * 100 : 0;
  return {
    totalInvestors: investors.length,
    totalCapitalInvested,
    totalProfit,
    totalProfitability,
    currentWeekProfitability,
  };
}
