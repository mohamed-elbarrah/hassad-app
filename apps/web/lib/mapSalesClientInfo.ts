import type { SalesClientInfo } from "@/features/clients/clientsApi";
import type { ClientDetailEntity } from "@/components/client-detail/ClientDetailPattern";

export function mapSalesClientInfo(
  client: SalesClientInfo,
): ClientDetailEntity {
  return {
    id: client.id,
    companyName: client.companyName,
    businessName: client.businessName,
    businessType: client.businessType,
    status: client.status,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
    source: client.source,
    hasPortalAccess: client.hasPortalAccess,
    lastLoginAt: client.lastLoginAt,
    lastSeenAt: client.lastSeenAt,
    totalProjects: client.totalProjects,
    activeProjects: client.activeProjects,
    completedProjects: client.completedProjects,
    totalContractValue: client.totalContractValue,
    signedContractValue: client.signedContractValue,
    totalInvoiced: client.totalInvoiced,
    totalPaid: client.totalPaid,
    avgSatisfactionScore: client.avgSatisfactionScore,
    profile: client.profile,
    manager: client.manager,
    user: client.user,
    counters: client.counters,
  };
}
