import { DisputeStatus } from "@hassad/shared";

import { mapDisputeDetailFromApi } from "@/features/admin-details/lib/detail-workspace-mappers";
import { mapDisputeIndexItem } from "@/features/admin-details/lib/admin-index-mappers";
import type { DisputeDetailRecord } from "@/features/disputes/lib/dispute-detail";
import type {
  PmDisputeListItem,
  PmDisputeStats,
  PmDisputeWorkspaceResponse,
} from "@/lib/api/pm-disputes-api";

export type PmDisputeWorkspaceRecord = {
  dispute: DisputeDetailRecord;
  threads: PmDisputeWorkspaceResponse["threads"];
  pmStats: PmDisputeStats;
};

function buildPmActions(status: DisputeStatus): DisputeDetailRecord["actions"] {
  const actions: DisputeDetailRecord["actions"] = [];

  if (status === DisputeStatus.APPROVED) {
    actions.push(
      {
        id: "acknowledge",
        label: "Acknowledge dispute",
        description: "Start handling the case and move it into active PM work.",
        availability: "Available now",
        tone: "warning",
      },
      {
        id: "resolve",
        label: "Mark resolved",
        description: "Send the resolution message to the client and request verification.",
        availability: "Available now",
        tone: "success",
      },
    );
  }

  if (status === DisputeStatus.IN_PROGRESS || status === DisputeStatus.ESCALATED) {
    actions.push({
      id: "resolve",
      label: "Mark resolved",
      description: "Send the resolution message to the client and request verification.",
      availability: "Available now",
      tone: "success",
    });
  }

  if (status === DisputeStatus.PENDING_CLIENT) {
    actions.push({
      id: "follow-up",
      label: "Follow up with client",
      description: "Send a reply in the client thread while awaiting verification.",
      availability: "Available now",
      tone: "attention",
    });
  }

  if (actions.length === 0 && [DisputeStatus.RESOLVED, DisputeStatus.CLOSED].includes(status)) {
    actions.push({
      id: "closed",
      label: "Closed case",
      description: "This dispute is already finalized and now serves as read-only history.",
      availability: "Read only",
      tone: "neutral",
    });
  }

  return actions;
}

export function mapPmDisputeListItem(item: PmDisputeListItem) {
  return mapDisputeIndexItem(item);
}

type AdminDisputeApiPayload = Parameters<typeof mapDisputeDetailFromApi>[0];

export function mapPmDisputeWorkspace(payload: PmDisputeWorkspaceResponse): PmDisputeWorkspaceRecord {
  const dispute = mapDisputeDetailFromApi(payload.detail as AdminDisputeApiPayload);

  return {
    dispute: {
      ...dispute,
      actions: buildPmActions((payload.detail as { status?: DisputeStatus }).status ?? DisputeStatus.IN_PROGRESS),
    },
    threads: payload.threads,
    pmStats: payload.pmStats,
  };
}
