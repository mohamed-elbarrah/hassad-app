import type { ClientDetailEntity } from "@/components/client-detail/ClientDetailPattern";
import type { OperationalClientInfoView } from "@/features/clients/clientInfo.types";

export function mapOperationalClientInfoView(
  view: OperationalClientInfoView,
): ClientDetailEntity {
  const { client, profile } = view;

  return {
    id: client.id,
    companyName: client.companyName,
    businessName: client.businessName,
    businessType: client.businessType,
    status: client.status,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
    profile,
  };
}
