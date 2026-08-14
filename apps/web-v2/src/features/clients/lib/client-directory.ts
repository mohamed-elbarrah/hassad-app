import type { ClientWorkspaceRecord } from "@hassad/shared";

export type ClientDirectoryStage = "lead" | "active" | "completed";
export type ClientDirectoryFilter = "all" | "clients" | "requests";
export type ClientDirectorySort = "highest-spend" | "lowest-spend";

export type ClientDirectoryRecord = ClientWorkspaceRecord;

export const clientDirectoryRecords: ClientDirectoryRecord[] = [
  {
    id: "client-greenline",
    contactName: "Rana Khaled",
    companyName: "Greenline",
    stage: "active",
    totalProjects: 7,
    activeProjects: 3,
    openOrders: 2,
    pendingOffers: 1,
    signedContracts: 4,
    totalSpend: 186000,
    outstandingAmount: 22000,
    lastSeen: "Online",
    owner: "Mona Saleh",
    stageTone: "active",
    financeTone: "warning",
  },
  {
    id: "client-al-noor",
    contactName: "Majed Al Noor",
    companyName: "Al Noor",
    stage: "active",
    totalProjects: 5,
    activeProjects: 2,
    openOrders: 1,
    pendingOffers: 0,
    signedContracts: 3,
    totalSpend: 142000,
    outstandingAmount: 0,
    lastSeen: "2h ago",
    owner: "Mona Saleh",
    stageTone: "warning",
    financeTone: "success",
  },
  {
    id: "client-oasis-retail",
    contactName: "Dina Faris",
    companyName: "Oasis Retail",
    stage: "active",
    totalProjects: 4,
    activeProjects: 1,
    openOrders: 1,
    pendingOffers: 1,
    signedContracts: 2,
    totalSpend: 118000,
    outstandingAmount: 16000,
    lastSeen: "Today, 09:10",
    owner: "Omar Nasser",
    stageTone: "attention",
    financeTone: "warning",
  },
  {
    id: "client-enterprise-foods",
    contactName: "Salem Harbi",
    companyName: "Enterprise Foods",
    stage: "lead",
    totalProjects: 0,
    activeProjects: 0,
    openOrders: 3,
    pendingOffers: 2,
    signedContracts: 0,
    totalSpend: 0,
    outstandingAmount: 0,
    lastSeen: "Yesterday, 16:40",
    owner: "Omar Nasser",
    stageTone: "attention",
    financeTone: "neutral",
  },
  {
    id: "client-riyadh-clinics",
    contactName: "Lama Nasser",
    companyName: "Riyadh Clinics",
    stage: "lead",
    totalProjects: 0,
    activeProjects: 0,
    openOrders: 2,
    pendingOffers: 1,
    signedContracts: 0,
    totalSpend: 0,
    outstandingAmount: 0,
    lastSeen: "3d ago",
    owner: "Omar Nasser",
    stageTone: "warning",
    financeTone: "neutral",
  },
  {
    id: "client-northstar",
    contactName: "Abeer Adel",
    companyName: "Northstar",
    stage: "completed",
    totalProjects: 3,
    activeProjects: 0,
    openOrders: 0,
    pendingOffers: 0,
    signedContracts: 3,
    totalSpend: 94000,
    outstandingAmount: 9000,
    lastSeen: "Aug 5, 2026",
    owner: "Mona Saleh",
    stageTone: "neutral",
    financeTone: "warning",
  },
];

export function formatClientStage(stage: ClientDirectoryStage) {
  if (stage === "active" || stage === "completed") return "Client";
  return "Lead";
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getFilteredSortedClients(
  filter: ClientDirectoryFilter,
  sort: ClientDirectorySort
) {
  const filtered = clientDirectoryRecords.filter((client) => {
    if (filter === "clients") {
      return client.totalProjects > 0;
    }

    if (filter === "requests") {
      return client.totalProjects === 0 && client.openOrders > 0;
    }

    return true;
  });

  return filtered.toSorted((left, right) => {
    if (sort === "lowest-spend") {
      return left.totalSpend - right.totalSpend;
    }

    return right.totalSpend - left.totalSpend;
  });
}
