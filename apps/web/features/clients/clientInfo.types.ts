import type { Client, ClientProfile } from "@hassad/shared";

export type OperationalClientProfile = Pick<
  ClientProfile,
  | "id"
  | "clientId"
  | "communicationInfo"
  | "productInfo"
  | "audienceInfo"
  | "brandVoice"
  | "customerJourney"
  | "campaignInfo"
  | "visualIdentityInfo"
  | "createdAt"
  | "updatedAt"
>;

export interface OperationalClientInfoView {
  client: Pick<
    Client,
    | "id"
    | "companyName"
    | "businessName"
    | "businessType"
    | "kind"
    | "status"
    | "createdAt"
    | "updatedAt"
  >;
  profile: OperationalClientProfile | null;
}
