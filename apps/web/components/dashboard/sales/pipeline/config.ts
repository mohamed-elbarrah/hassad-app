import { REQUEST_STATUS_AR, RequestStatus } from "@hassad/shared";
import type { KanbanConfig } from "@/components/dashboard/kanban";
import type { SalesPipelineStage } from "@/features/sales/salesApi";
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

const DEFAULT_STAGE_METADATA: SalesPipelineStage[] = [
  {
    code: RequestStatus.SUBMITTED,
    order: 1,
    groupCode: "INTAKE",
    isTerminal: false,
  },
  {
    code: RequestStatus.QUALIFYING,
    order: 2,
    groupCode: "INTAKE",
    isTerminal: false,
  },
  {
    code: RequestStatus.PROPOSAL_IN_PROGRESS,
    order: 3,
    groupCode: "PROPOSAL",
    isTerminal: false,
  },
  {
    code: RequestStatus.PROPOSAL_SENT,
    order: 4,
    groupCode: "PROPOSAL",
    isTerminal: false,
  },
  {
    code: RequestStatus.NEGOTIATION,
    order: 5,
    groupCode: "PROPOSAL",
    isTerminal: false,
  },
  {
    code: RequestStatus.CONTRACT_PREPARATION,
    order: 6,
    groupCode: "CONTRACT",
    isTerminal: false,
  },
  {
    code: RequestStatus.CONTRACT_SENT,
    order: 7,
    groupCode: "CONTRACT",
    isTerminal: false,
  },
  { code: RequestStatus.SIGNED, order: 8, groupCode: "WON", isTerminal: false },
  {
    code: RequestStatus.PROJECT_CREATED,
    order: 9,
    groupCode: "WON",
    isTerminal: true,
  },
  {
    code: RequestStatus.CANCELLED,
    order: 10,
    groupCode: "CANCELLED",
    isTerminal: true,
  },
];

const GROUP_LABELS: Record<SalesPipelineStage["groupCode"], string> = {
  INTAKE: "الاستقبال والتأهيل",
  PROPOSAL: "العرض والتفاوض",
  CONTRACT: "العقد والإغلاق",
  WON: "الصفقات المحسومة",
  CANCELLED: "الطلبات الملغاة",
};

export function createSalesPipelineConfig(
  options: {
    includeCancelled?: boolean;
    stages?: SalesPipelineStage[];
  } = {},
): KanbanConfig {
  const metadata = [
    ...(options.stages?.length ? options.stages : DEFAULT_STAGE_METADATA),
  ]
    .filter(
      (stage) =>
        options.includeCancelled || stage.code !== RequestStatus.CANCELLED,
    )
    .sort((left, right) => left.order - right.order);
  const stageOrder = metadata.map((stage) => stage.code);
  const groupOrder: SalesPipelineStage["groupCode"][] = [
    "INTAKE",
    "PROPOSAL",
    "CONTRACT",
    "WON",
    "CANCELLED",
  ];

  return {
    groups: groupOrder
      .map((groupCode) => ({
        id: groupCode.toLowerCase(),
        label: GROUP_LABELS[groupCode],
        stages: metadata
          .filter((stage) => stage.groupCode === groupCode)
          .map((stage) => stage.code),
      }))
      .filter((group) => group.stages.length > 0),
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
