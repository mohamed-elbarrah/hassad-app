import { REQUEST_STATUS_AR, RequestStatus } from "@hassad/shared";
import type { KanbanConfig } from "@/components/dashboard/kanban";
import { KANBAN_TONES } from "@/components/dashboard/kanban/theme";

const STAGE_THEME: Record<
  RequestStatus,
  {
    dotClass: string;
    bandClass: string;
    surfaceClass: string;
    countClass: string;
  }
> = {
  [RequestStatus.SUBMITTED]: {
    ...KANBAN_TONES.neutral,
  },
  [RequestStatus.QUALIFYING]: {
    ...KANBAN_TONES.cyan,
  },
  [RequestStatus.PROPOSAL_IN_PROGRESS]: {
    ...KANBAN_TONES.blue,
  },
  [RequestStatus.PROPOSAL_SENT]: {
    ...KANBAN_TONES.purple,
  },
  [RequestStatus.NEGOTIATION]: {
    ...KANBAN_TONES.purple,
  },
  [RequestStatus.CONTRACT_PREPARATION]: {
    ...KANBAN_TONES.yellow,
  },
  [RequestStatus.CONTRACT_SENT]: {
    ...KANBAN_TONES.orange,
  },
  [RequestStatus.SIGNED]: {
    ...KANBAN_TONES.green,
  },
  [RequestStatus.PROJECT_CREATED]: {
    ...KANBAN_TONES.green,
  },
  [RequestStatus.CANCELLED]: {
    ...KANBAN_TONES.red,
  },
};

const DEFAULT_STAGE_ORDER: RequestStatus[] = [
  RequestStatus.SUBMITTED,
  RequestStatus.QUALIFYING,
  RequestStatus.PROPOSAL_IN_PROGRESS,
  RequestStatus.PROPOSAL_SENT,
  RequestStatus.NEGOTIATION,
  RequestStatus.CONTRACT_PREPARATION,
  RequestStatus.CONTRACT_SENT,
  RequestStatus.SIGNED,
  RequestStatus.PROJECT_CREATED,
];

export function createSalesPipelineConfig(
  options: {
    includeCancelled?: boolean;
  } = {},
): KanbanConfig {
  const stageOrder = options.includeCancelled
    ? [...DEFAULT_STAGE_ORDER, RequestStatus.CANCELLED]
    : DEFAULT_STAGE_ORDER;

  return {
    groups: [
      {
        id: "intake",
        label: "الاستقبال والتأهيل",
        stages: [RequestStatus.SUBMITTED, RequestStatus.QUALIFYING],
      },
      {
        id: "proposal",
        label: "العرض والتفاوض",
        stages: [
          RequestStatus.PROPOSAL_IN_PROGRESS,
          RequestStatus.PROPOSAL_SENT,
          RequestStatus.NEGOTIATION,
        ],
      },
      {
        id: "contract",
        label: "العقد والإغلاق",
        stages: [
          RequestStatus.CONTRACT_PREPARATION,
          RequestStatus.CONTRACT_SENT,
        ],
      },
      {
        id: "won",
        label: "الصفقات المحسومة",
        stages: [RequestStatus.SIGNED, RequestStatus.PROJECT_CREATED],
      },
      ...(options.includeCancelled
        ? [
            {
              id: "cancelled",
              label: "الطلبات الملغاة",
              stages: [RequestStatus.CANCELLED],
            },
          ]
        : []),
    ],
    stages: Object.fromEntries(
      Object.entries(STAGE_THEME).map(([status, theme]) => [
        status,
        {
          label: REQUEST_STATUS_AR[status as RequestStatus],
          emptyLabel: "لا توجد فرص",
          ...theme,
        },
      ]),
    ),
    stageOrder,
  };
}
