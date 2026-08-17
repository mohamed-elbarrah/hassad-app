export type CrmRecordKind = "lead" | "order";

/**
 * Canonical CRM classification rule.
 * A record becomes an order only after its client has at least one active or
 * completed project. Otherwise it remains a lead.
 */
export function classifyCrmRecordKind(
  projects: ReadonlyArray<{ status: string }> | null | undefined,
): CrmRecordKind {
  return projects?.some(
    (project) => project.status === "ACTIVE" || project.status === "COMPLETED",
  )
    ? "order"
    : "lead";
}

export const CRM_QUALIFYING_PROJECT_STATUSES = ["ACTIVE", "COMPLETED"] as const;
