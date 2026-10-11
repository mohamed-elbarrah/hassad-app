import type { ClientDetailEntity } from "@/components/client-detail/ClientDetailPattern";
import type { PmClientTeamView } from "@/features/clients/clientsApi";

export function mapPmClientTeamView(
  teamView: PmClientTeamView,
): ClientDetailEntity {
  const { client, profile } = teamView;

  return {
    id: client.id,
    companyName: client.companyName,
    businessName: client.businessName,
    businessType: client.businessType,
    status: client.status,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
    manager: client.manager,
    profile,
  };
}
