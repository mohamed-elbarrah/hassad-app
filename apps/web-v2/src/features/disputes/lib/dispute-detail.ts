import {
  DisputePriority,
  DisputeStatus,
} from "@hassad/shared";

import type { StatusTone } from "@/components/patterns/status-badge";
import type { WorkflowStep } from "@/components/patterns/workflow-stepper";
import { clientDirectoryRecords } from "@/features/clients/lib/client-directory";
import {
  disputeDirectoryRecords,
  formatDisputeCategory,
  formatDisputePriority,
  formatDisputeStatus,
  getDisputePriorityTone,
  getDisputeStatusTone,
  type DisputeDirectoryRecord,
} from "@/features/disputes/lib/dispute-directory";
import { projectDirectoryRecords } from "@/features/projects/lib/project-directory";

export type DisputeDetailAction = {
  id: string;
  label: string;
  description: string;
  availability: string;
  tone: StatusTone;
};

export type DisputeDetailMessage = {
  id: string;
  date: string;
  author: string;
  role: "Client" | "PM" | "Admin";
  visibility: "External" | "Internal";
  content: string;
  tone: StatusTone;
};

export type DisputeDetailAttachment = {
  id: string;
  name: string;
  source: string;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
  linkedTo: string;
};

export type DisputeDetailHistory = {
  id: string;
  date: string;
  title: string;
  actor: string;
  summary: string;
  tone: StatusTone;
  completed?: boolean;
};

export type DisputeDetailRecord = {
  id: string;
  ticketNumber: string;
  title: string;
  categoryLabel: string;
  statusLabel: string;
  statusTone: StatusTone;
  priorityLabel: string;
  priorityTone: StatusTone;
  openedAt: string;
  lastActivity: string;
  deadlineLabel: string;
  ageLabel: string;
  signalLabel: string;
  signalSummary: string;
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
  currentPmName: string;
  currentPmInitials: string;
  reviewerName: string | null;
  resolverName: string | null;
  newPmName: string | null;
  complaintSummary: string;
  pmHandlingSummary: string;
  currentBlocker: string;
  recommendedAction: string;
  resolutionSummary: string;
  clientExpectation: string;
  projectCommercialState: string;
  metrics: Array<{
    label: string;
    value: string;
    description: string;
    trend?: { label: string; tone: StatusTone };
  }>;
  workflow: WorkflowStep[];
  actions: DisputeDetailAction[];
  pmStats: Array<{
    label: string;
    value: string;
    description: string;
  }>;
  messages: DisputeDetailMessage[];
  attachments: DisputeDetailAttachment[];
  history: DisputeDetailHistory[];
};

type DisputeScenario = {
  openedAt: string;
  deadlineLabel: string;
  ageLabel: string;
  reviewerName: string | null;
  resolverName: string | null;
  newPmName: string | null;
  complaintSummary: string;
  pmHandlingSummary: string;
  currentBlocker: string;
  recommendedAction: string;
  resolutionSummary: string;
  clientExpectation: string;
  projectCommercialState: string;
  workflow: WorkflowStep[];
  actions: DisputeDetailAction[];
  pmStats: Array<{
    label: string;
    value: string;
    description: string;
  }>;
  messages: DisputeDetailMessage[];
  attachments: DisputeDetailAttachment[];
  history: DisputeDetailHistory[];
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function buildWorkflow(status: DisputeStatus): WorkflowStep[] {
  const stepState = (
    step: "approval" | "active" | "client" | "resolved",
  ): WorkflowStep["state"] => {
    if (status === DisputeStatus.PENDING_APPROVAL) {
      return step === "approval" ? "current" : "upcoming";
    }

    if (status === DisputeStatus.REJECTED) {
      return step === "approval" ? "completed" : "upcoming";
    }

    if (
      status === DisputeStatus.APPROVED ||
      status === DisputeStatus.IN_PROGRESS ||
      status === DisputeStatus.ESCALATED
    ) {
      if (step === "approval") return "completed";
      if (step === "active") return "current";
      return "upcoming";
    }

    if (status === DisputeStatus.PENDING_CLIENT) {
      if (step === "approval" || step === "active") return "completed";
      if (step === "client") return "current";
      return "upcoming";
    }

    if (status === DisputeStatus.RESOLVED || status === DisputeStatus.CLOSED) {
      return "completed";
    }

    return "upcoming";
  };

  return [
    { key: "approval", label: "Approval", state: stepState("approval") },
    { key: "active", label: "PM handling", state: stepState("active") },
    { key: "client", label: "Client confirmation", state: stepState("client") },
    { key: "resolved", label: "Resolved", state: stepState("resolved") },
  ];
}

function buildMetrics(
  record: DisputeDirectoryRecord,
  scenario: DisputeScenario,
): DisputeDetailRecord["metrics"] {
  return [
    {
      label: "Case age",
      value: scenario.ageLabel,
      description: "Time since the dispute was opened.",
      trend: {
        label: record.staleDays >= 3 ? "Needs follow-up" : "Fresh activity",
        tone: record.staleDays >= 3 ? "warning" : "success",
      },
    },
    {
      label: "SLA deadline",
      value: scenario.deadlineLabel,
      description: "Admin or PM response checkpoint for this case.",
      trend: {
        label:
          record.status === DisputeStatus.PENDING_APPROVAL ||
          record.status === DisputeStatus.ESCALATED
            ? "Priority now"
            : "Tracked",
        tone:
          record.status === DisputeStatus.PENDING_APPROVAL ||
          record.status === DisputeStatus.ESCALATED
            ? "destructive"
            : "active",
      },
    },
    {
      label: "Messages",
      value: String(scenario.messages.length),
      description: "Client, PM, and admin updates recorded on the case.",
      trend: {
        label:
          scenario.messages.some((message) => message.visibility === "Internal")
            ? "Internal notes present"
            : "External only",
        tone: "active",
      },
    },
    {
      label: "Evidence files",
      value: String(scenario.attachments.length),
      description: "Proof, screenshots, and working files tied to the dispute.",
      trend: {
        label: scenario.attachments.length > 0 ? "Ready for review" : "No evidence",
        tone: scenario.attachments.length > 0 ? "success" : "warning",
      },
    },
  ];
}

function buildScenario(record: DisputeDirectoryRecord): DisputeScenario {
  const sharedPmStats =
    record.pmName === "Mona Saleh"
      ? [
          {
            label: "Total disputes",
            value: "12",
            description: "Cases assigned to Mona across active and closed projects.",
          },
          {
            label: "Resolved",
            value: "9",
            description: "Closed without PM reassignment.",
          },
          {
            label: "Escalated",
            value: "2",
            description: "Cases that reached admin escalation.",
          },
          {
            label: "Avg resolution",
            value: "2.3d",
            description: "Average time from approval to resolution.",
          },
        ]
      : [
          {
            label: "Total disputes",
            value: "8",
            description: "Cases assigned to Fadi across active and closed projects.",
          },
          {
            label: "Resolved",
            value: "5",
            description: "Closed without PM reassignment.",
          },
          {
            label: "Escalated",
            value: "3",
            description: "Cases that reached admin escalation.",
          },
          {
            label: "Avg resolution",
            value: "3.8d",
            description: "Average time from approval to resolution.",
          },
        ];

  const sharedHistory: DisputeDetailHistory[] = [
    {
      id: `${record.id}-created`,
      date: "Aug 2, 2026",
      title: "Dispute created",
      actor: record.clientName,
      summary: "Client submitted the complaint and attached initial evidence.",
      tone: "active",
      completed: true,
    },
  ];

  switch (record.id) {
    case "dispute-greenline-delay-1042":
      return {
        openedAt: "Aug 9, 2026 · 09:42",
        deadlineLabel: "Awaiting admin approval",
        ageLabel: "18m",
        reviewerName: null,
        resolverName: null,
        newPmName: null,
        complaintSummary:
          "Greenline says the August paid media assets missed the agreed review window and blocked campaign launch.",
        pmHandlingSummary:
          "The PM has not responded yet because the case is still pending admin approval.",
        currentBlocker:
          "The case cannot move to PM handling until admin accepts or rejects the ticket.",
        recommendedAction:
          "Approve the case, set priority, and start the three-day response SLA for the PM.",
        resolutionSummary: "No resolution yet.",
        clientExpectation:
          "Greenline expects a confirmed revised review date and a launch recovery plan today.",
        projectCommercialState:
          "Retainer is active and the next invoice is due this week, so launch delay affects billed output.",
        workflow: buildWorkflow(record.status),
        actions: [
          {
            id: "approve",
            label: "Approve dispute",
            description: "Open the case for PM handling and assign the priority level.",
            availability: "Available now",
            tone: "destructive",
          },
          {
            id: "reject",
            label: "Reject dispute",
            description: "Close the case with a rejection reason if it does not meet policy.",
            availability: "Available now",
            tone: "neutral",
          },
        ],
        pmStats: sharedPmStats,
        messages: [
          {
            id: `${record.id}-message-1`,
            date: "Aug 9, 2026 · 09:42",
            author: "Lina Green",
            role: "Client",
            visibility: "External",
            content:
              "The campaign assets arrived after our internal review slot. We need a corrected delivery date today.",
            tone: "destructive",
          },
          {
            id: `${record.id}-message-2`,
            date: "Aug 9, 2026 · 09:49",
            author: "Portal system",
            role: "Admin",
            visibility: "Internal",
            content:
              "Ticket entered approval queue. PM response remains locked until admin review.",
            tone: "active",
          },
        ],
        attachments: [
          {
            id: `${record.id}-attachment-1`,
            name: "review-window-confirmation.pdf",
            source: "Client evidence",
            type: "PDF",
            uploadedAt: "Aug 9, 2026 · 09:42",
            uploadedBy: "Lina Green",
            linkedTo: "Initial complaint",
          },
        ],
        history: [
          ...sharedHistory,
          {
            id: `${record.id}-queued`,
            date: "Aug 9, 2026",
            title: "Queued for admin approval",
            actor: "Portal system",
            summary: "Ticket is waiting for approve or reject action from admin.",
            tone: "warning",
            completed: false,
          },
        ],
      };

    case "dispute-riyadh-quality-1038":
      return {
        openedAt: "Aug 2, 2026 · 14:20",
        deadlineLabel: "Past due by 1 day",
        ageLabel: "7d",
        reviewerName: "Sara Admin",
        resolverName: null,
        newPmName: null,
        complaintSummary:
          "Riyadh Clinics says the landing page revisions still break brand and clinical compliance guidelines.",
        pmHandlingSummary:
          "The PM proposed a revision plan, but the client rejected it and escalated the case for admin review.",
        currentBlocker:
          "Client confidence is low and the escalated case is aging without a final owner decision.",
        recommendedAction:
          "Decide whether to change the PM or close the case with a documented recovery path.",
        resolutionSummary: "No final resolution yet.",
        clientExpectation:
          "Client wants a named owner, revised delivery date, and assurance that compliance review will happen before launch.",
        projectCommercialState:
          "Performance marketing remains active, but the landing page block is delaying a high-value clinic campaign.",
        workflow: buildWorkflow(record.status),
        actions: [
          {
            id: "change-pm",
            label: "Change PM",
            description: "Reassign ownership if client trust in the current PM is broken.",
            availability: "Available now",
            tone: "destructive",
          },
          {
            id: "close",
            label: "Close dispute",
            description: "Close with a final admin resolution if a recovery path is agreed.",
            availability: "Available now",
            tone: "warning",
          },
        ],
        pmStats: sharedPmStats,
        messages: [
          {
            id: `${record.id}-message-1`,
            date: "Aug 2, 2026 · 14:20",
            author: "Maha Riyadh",
            role: "Client",
            visibility: "External",
            content:
              "The revised page still uses off-brand sections and misses the medical disclaimer hierarchy we approved.",
            tone: "destructive",
          },
          {
            id: `${record.id}-message-2`,
            date: "Aug 4, 2026 · 10:05",
            author: record.pmName,
            role: "PM",
            visibility: "External",
            content:
              "We can deliver a corrected version within two working days after legal text is reconfirmed.",
            tone: "warning",
          },
          {
            id: `${record.id}-message-3`,
            date: "Aug 5, 2026 · 16:10",
            author: "Maha Riyadh",
            role: "Client",
            visibility: "External",
            content:
              "We cannot accept another partial fix. Please escalate this to admin and consider a new owner.",
            tone: "destructive",
          },
          {
            id: `${record.id}-message-4`,
            date: "Aug 6, 2026 · 09:12",
            author: "Sara Admin",
            role: "Admin",
            visibility: "Internal",
            content:
              "Escalated case. Review PM reassignment versus monitored recovery before end of day.",
            tone: "warning",
          },
        ],
        attachments: [
          {
            id: `${record.id}-attachment-1`,
            name: "clinic-guidelines.pdf",
            source: "Client evidence",
            type: "PDF",
            uploadedAt: "Aug 2, 2026 · 14:20",
            uploadedBy: "Maha Riyadh",
            linkedTo: "Initial complaint",
          },
          {
            id: `${record.id}-attachment-2`,
            name: "revision-round-3.fig",
            source: "PM response",
            type: "FIG",
            uploadedAt: "Aug 4, 2026 · 10:05",
            uploadedBy: record.pmName,
            linkedTo: "Proposed revision",
          },
        ],
        history: [
          ...sharedHistory,
          {
            id: `${record.id}-approved`,
            date: "Aug 2, 2026",
            title: "Approved by admin",
            actor: "Sara Admin",
            summary: "Priority marked urgent and PM SLA started.",
            tone: "active",
            completed: true,
          },
          {
            id: `${record.id}-escalated`,
            date: "Aug 5, 2026",
            title: "Client escalated case",
            actor: record.clientName,
            summary: "Client rejected the PM answer and asked for admin intervention.",
            tone: "destructive",
            completed: true,
          },
        ],
      };

    case "dispute-safa-communication-1031":
      return {
        openedAt: "Aug 4, 2026 · 11:05",
        deadlineLabel: "1 day left",
        ageLabel: "5d",
        reviewerName: "Sara Admin",
        resolverName: null,
        newPmName: null,
        complaintSummary:
          "Safa Logistics says it has not received a clear timing update for the pending review cycle.",
        pmHandlingSummary:
          "The PM acknowledged the dispute and is collecting the delivery timeline from the team before replying to the client.",
        currentBlocker:
          "The client still lacks a date-owned response and may escalate if no update goes out today.",
        recommendedAction:
          "Monitor for a same-day client response. If none is logged, escalate to PM leadership.",
        resolutionSummary: "No resolution yet.",
        clientExpectation:
          "Client wants a dated response with review timing and who owns the next handoff.",
        projectCommercialState:
          "The employer brand project remains active and on contract, but missed comms are reducing client confidence.",
        workflow: buildWorkflow(record.status),
        actions: [
          {
            id: "monitor",
            label: "Monitor PM response",
            description: "Keep the current PM if the response goes out inside the SLA window.",
            availability: "Available now",
            tone: "warning",
          },
          {
            id: "close",
            label: "Close dispute",
            description: "Close only after the client confirms the communication issue is resolved.",
            availability: "Blocked until client confirmation",
            tone: "neutral",
          },
        ],
        pmStats: sharedPmStats,
        messages: [
          {
            id: `${record.id}-message-1`,
            date: "Aug 4, 2026 · 11:05",
            author: "Nada Safa",
            role: "Client",
            visibility: "External",
            content:
              "We keep hearing that review timing is being checked, but no one has given us a final date.",
            tone: "warning",
          },
          {
            id: `${record.id}-message-2`,
            date: "Aug 4, 2026 · 12:14",
            author: record.pmName,
            role: "PM",
            visibility: "External",
            content:
              "I have acknowledged the issue and I am consolidating the final review slot from design and content.",
            tone: "active",
          },
          {
            id: `${record.id}-message-3`,
            date: "Aug 9, 2026 · 08:40",
            author: "Sara Admin",
            role: "Admin",
            visibility: "Internal",
            content:
              "No external update was sent yesterday. Watch this case closely for same-day response.",
            tone: "warning",
          },
        ],
        attachments: [
          {
            id: `${record.id}-attachment-1`,
            name: "handoff-thread.pdf",
            source: "Client evidence",
            type: "PDF",
            uploadedAt: "Aug 4, 2026 · 11:05",
            uploadedBy: "Nada Safa",
            linkedTo: "Initial complaint",
          },
        ],
        history: [
          ...sharedHistory,
          {
            id: `${record.id}-approved`,
            date: "Aug 4, 2026",
            title: "Approved by admin",
            actor: "Sara Admin",
            summary: "Case approved and assigned normal priority.",
            tone: "active",
            completed: true,
          },
          {
            id: `${record.id}-acknowledged`,
            date: "Aug 4, 2026",
            title: "PM acknowledged",
            actor: record.pmName,
            summary: "PM accepted the case and started timeline collection.",
            tone: "success",
            completed: true,
          },
        ],
      };

    case "dispute-al-noor-scope-1027":
      return {
        openedAt: "Jul 31, 2026 · 15:55",
        deadlineLabel: "Waiting client reply",
        ageLabel: "9d",
        reviewerName: "Sara Admin",
        resolverName: record.pmName,
        newPmName: null,
        complaintSummary:
          "Al Noor says launch deliverables now include extra packaging work not reflected in the current signed scope.",
        pmHandlingSummary:
          "The PM documented the original scope, proposed a paid change path, and sent it back to the client for confirmation.",
        currentBlocker:
          "The client has not yet confirmed whether to accept the paid scope extension or revert to the signed deliverables.",
        recommendedAction:
          "Hold until the client replies. Close once the client confirms the proposed path.",
        resolutionSummary:
          "PM proposed a scoped change request and revised launch checklist. Client confirmation is still pending.",
        clientExpectation:
          "Client wants clarity on whether the packaging work is included or must be quoted separately.",
        projectCommercialState:
          "Launch campaign is active, and the outcome may create an additional proposal before production starts.",
        workflow: buildWorkflow(record.status),
        actions: [
          {
            id: "close",
            label: "Close dispute",
            description: "Close the case when the client confirms the proposed resolution.",
            availability: "Available after client confirmation",
            tone: "attention",
          },
          {
            id: "change-pm",
            label: "Change PM",
            description: "Only use if the client rejects the PM handling and escalates.",
            availability: "Not recommended",
            tone: "neutral",
          },
        ],
        pmStats: sharedPmStats,
        messages: [
          {
            id: `${record.id}-message-1`,
            date: "Jul 31, 2026 · 15:55",
            author: "Rayan Noor",
            role: "Client",
            visibility: "External",
            content:
              "We expected the launch package to include the new packaging adaptation as part of the campaign.",
            tone: "warning",
          },
          {
            id: `${record.id}-message-2`,
            date: "Aug 1, 2026 · 10:25",
            author: record.pmName,
            role: "PM",
            visibility: "External",
            content:
              "The current signed scope covers launch assets only. We shared a paid extension path for packaging work.",
            tone: "active",
          },
          {
            id: `${record.id}-message-3`,
            date: "Aug 7, 2026 · 17:00",
            author: "Sara Admin",
            role: "Admin",
            visibility: "Internal",
            content:
              "Keep commercial visibility on this case in case it becomes a new proposal.",
            tone: "active",
          },
        ],
        attachments: [
          {
            id: `${record.id}-attachment-1`,
            name: "signed-scope.pdf",
            source: "Contract proof",
            type: "PDF",
            uploadedAt: "Aug 1, 2026 · 10:25",
            uploadedBy: record.pmName,
            linkedTo: "PM response",
          },
          {
            id: `${record.id}-attachment-2`,
            name: "change-request-draft.pdf",
            source: "PM response",
            type: "PDF",
            uploadedAt: "Aug 1, 2026 · 10:28",
            uploadedBy: record.pmName,
            linkedTo: "Resolution proposal",
          },
        ],
        history: [
          ...sharedHistory,
          {
            id: `${record.id}-approved`,
            date: "Jul 31, 2026",
            title: "Approved by admin",
            actor: "Sara Admin",
            summary: "Case approved for PM review and scope verification.",
            tone: "active",
            completed: true,
          },
          {
            id: `${record.id}-pending-client`,
            date: "Aug 1, 2026",
            title: "Waiting for client confirmation",
            actor: record.pmName,
            summary: "Resolution proposal was sent back to the client.",
            tone: "attention",
            completed: false,
          },
        ],
      };

    case "dispute-enterprise-attitude-1016":
      return {
        openedAt: "Jul 27, 2026 · 13:18",
        deadlineLabel: "Closed on time",
        ageLabel: "13d",
        reviewerName: "Sara Admin",
        resolverName: "Sara Admin",
        newPmName: null,
        complaintSummary:
          "Enterprise Foods raised a complaint about workshop tone during the discovery session.",
        pmHandlingSummary:
          "The PM documented the workshop sequence, acknowledged the concern, and proposed a reset session with leadership present.",
        currentBlocker: "No blocker remains. Client confirmed the recovery step.",
        recommendedAction:
          "Close the case after archiving the final confirmation and coaching note.",
        resolutionSummary:
          "Client accepted the apology, attended a reset workshop, and confirmed the matter is resolved.",
        clientExpectation:
          "Client wanted acknowledgment of the issue and a clear change in how future sessions are facilitated.",
        projectCommercialState:
          "The rebrand project is still healthy and no commercial change was needed after the workshop reset.",
        workflow: buildWorkflow(record.status),
        actions: [
          {
            id: "close",
            label: "Close dispute",
            description: "Case is ready for final administrative closure.",
            availability: "Available now",
            tone: "success",
          },
        ],
        pmStats: sharedPmStats,
        messages: [
          {
            id: `${record.id}-message-1`,
            date: "Jul 27, 2026 · 13:18",
            author: "Nora Enterprise",
            role: "Client",
            visibility: "External",
            content:
              "The workshop tone felt dismissive to our team and we need assurance that future sessions will be handled differently.",
            tone: "warning",
          },
          {
            id: `${record.id}-message-2`,
            date: "Jul 28, 2026 · 09:00",
            author: record.pmName,
            role: "PM",
            visibility: "External",
            content:
              "I understand the concern. We scheduled a reset session with leadership present and shared the revised facilitation plan.",
            tone: "active",
          },
          {
            id: `${record.id}-message-3`,
            date: "Aug 8, 2026 · 11:45",
            author: "Nora Enterprise",
            role: "Client",
            visibility: "External",
            content: "The reset session addressed the issue. You can close the case.",
            tone: "success",
          },
        ],
        attachments: [
          {
            id: `${record.id}-attachment-1`,
            name: "reset-session-notes.pdf",
            source: "Admin evidence",
            type: "PDF",
            uploadedAt: "Aug 8, 2026 · 11:20",
            uploadedBy: "Sara Admin",
            linkedTo: "Resolution",
          },
        ],
        history: [
          ...sharedHistory,
          {
            id: `${record.id}-approved`,
            date: "Jul 27, 2026",
            title: "Approved by admin",
            actor: "Sara Admin",
            summary: "Case approved and tracked as a client trust issue.",
            tone: "active",
            completed: true,
          },
          {
            id: `${record.id}-resolved`,
            date: "Aug 8, 2026",
            title: "Client confirmed resolution",
            actor: record.clientName,
            summary: "Client accepted the workshop recovery action.",
            tone: "success",
            completed: true,
          },
        ],
      };

    default:
      return {
        openedAt: "Jul 18, 2026 · 10:10",
        deadlineLabel: "Closed",
        ageLabel: "22d",
        reviewerName: "Sara Admin",
        resolverName: "Sara Admin",
        newPmName: "Mona Saleh",
        complaintSummary:
          "The client requested executive review after repeated deadline changes.",
        pmHandlingSummary:
          "The case escalated to admin review and ended with PM reassignment plus a reset delivery plan.",
        currentBlocker: "No blocker remains.",
        recommendedAction: "Archive the case as reference for future account risk review.",
        resolutionSummary:
          "PM was reassigned and the client accepted the new delivery plan before closure.",
        clientExpectation:
          "Client wanted stable ownership and a recovery path after multiple deadline slips.",
        projectCommercialState:
          "The loyalty activation remained commercially active, but delivery confidence required ownership change.",
        workflow: buildWorkflow(record.status),
        actions: [
          {
            id: "archived",
            label: "No pending action",
            description: "Case is already closed and documented.",
            availability: "Completed",
            tone: "neutral",
          },
        ],
        pmStats: sharedPmStats,
        messages: [
          {
            id: `${record.id}-message-1`,
            date: "Jul 18, 2026 · 10:10",
            author: "Oasis team",
            role: "Client",
            visibility: "External",
            content:
              "We need executive review because deadlines kept moving without clear accountability.",
            tone: "destructive",
          },
          {
            id: `${record.id}-message-2`,
            date: "Jul 21, 2026 · 16:30",
            author: "Sara Admin",
            role: "Admin",
            visibility: "Internal",
            content:
              "Approved PM reassignment after reviewing delivery history and client escalation pattern.",
            tone: "active",
          },
        ],
        attachments: [
          {
            id: `${record.id}-attachment-1`,
            name: "recovery-plan.pdf",
            source: "Admin evidence",
            type: "PDF",
            uploadedAt: "Jul 22, 2026 · 11:40",
            uploadedBy: "Sara Admin",
            linkedTo: "Final resolution",
          },
        ],
        history: [
          ...sharedHistory,
          {
            id: `${record.id}-pm-change`,
            date: "Jul 22, 2026",
            title: "PM changed",
            actor: "Sara Admin",
            summary: "Project ownership moved to a new PM and the dispute was resolved.",
            tone: "success",
            completed: true,
          },
          {
            id: `${record.id}-closed`,
            date: "Aug 6, 2026",
            title: "Case closed",
            actor: "Sara Admin",
            summary: "Client accepted the new delivery plan and the dispute was closed.",
            tone: "success",
            completed: true,
          },
        ],
      };
  }
}

export function getDisputeDetailById(disputeId: string): DisputeDetailRecord | null {
  const record = disputeDirectoryRecords.find((item) => item.id === disputeId);

  if (!record) {
    return null;
  }

  const scenario = buildScenario(record);
  const clientId =
    clientDirectoryRecords.find((client) => client.companyName === record.clientName)?.id ??
    `client-${record.clientName.toLowerCase().replaceAll(" ", "-")}`;
  const projectId =
    projectDirectoryRecords.find((project) => project.name === record.projectName)?.id ??
    `project-${record.projectName.toLowerCase().replaceAll(" ", "-")}`;

  return {
    id: record.id,
    ticketNumber: record.ticketNumber,
    title: record.title,
    categoryLabel: formatDisputeCategory(record.category),
    statusLabel: formatDisputeStatus(record.status),
    statusTone: getDisputeStatusTone(record.status),
    priorityLabel: formatDisputePriority(record.priority),
    priorityTone: getDisputePriorityTone(record.priority),
    openedAt: scenario.openedAt,
    lastActivity: record.lastActivityLabel,
    deadlineLabel: scenario.deadlineLabel,
    ageLabel: scenario.ageLabel,
    signalLabel: record.signalLabel,
    signalSummary: record.signalSummary,
    clientId,
    clientName: record.clientName,
    projectId,
    projectName: record.projectName,
    currentPmName: record.pmName,
    currentPmInitials: getInitials(record.pmName),
    reviewerName: scenario.reviewerName,
    resolverName: scenario.resolverName,
    newPmName: scenario.newPmName,
    complaintSummary: scenario.complaintSummary,
    pmHandlingSummary: scenario.pmHandlingSummary,
    currentBlocker: scenario.currentBlocker,
    recommendedAction: scenario.recommendedAction,
    resolutionSummary: scenario.resolutionSummary,
    clientExpectation: scenario.clientExpectation,
    projectCommercialState: scenario.projectCommercialState,
    metrics: buildMetrics(record, scenario),
    workflow: scenario.workflow,
    actions: scenario.actions,
    pmStats: scenario.pmStats,
    messages: scenario.messages,
    attachments: scenario.attachments,
    history: scenario.history,
  };
}

export function getDisputePriorityActionTone(priority: DisputePriority): StatusTone {
  if (priority === DisputePriority.URGENT) return "destructive";
  if (priority === DisputePriority.HIGH) return "warning";
  return "active";
}
