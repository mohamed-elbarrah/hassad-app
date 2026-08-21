import { ClientKind } from "@hassad/shared";

/** The presentation classification for requests/workspace records. */
export type CrmRecordKind = "lead" | "order";

/** Derive presentation from the canonical client kind; request rows do not own a second type. */
export function classifyCrmRecordKind(
  client: { kind?: ClientKind | string | null } | null | undefined,
): CrmRecordKind {
  return client?.kind === ClientKind.CLIENT || client?.kind === "CLIENT"
    ? "order"
    : "lead";
}

export const CRM_QUALIFYING_PROJECT_STATUSES = ["ACTIVE", "COMPLETED"] as const;
