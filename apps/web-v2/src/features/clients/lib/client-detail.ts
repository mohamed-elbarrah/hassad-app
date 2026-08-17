import type {
  AudienceInfo,
  BrandVoice,
  BudgetInfo,
  CampaignInfo,
  CommunicationInfo,
  CustomerJourney,
  FaqPair,
  PastPerformance,
  ProductInfo,
  VisualIdentityInfo,
} from "@hassad/shared";
import { BusinessType } from "@hassad/shared";

import type { StatusTone } from "@/components/patterns/status-badge";
import {
  clientDirectoryRecords,
  formatClientStage,
  formatMoney,
  type ClientDirectoryRecord,
} from "@/features/clients/lib/client-directory";

export type ClientBusinessTabKey =
  | "identity"
  | "product"
  | "audience"
  | "journey"
  | "campaign"
  | "performance"
  | "visual";

export type ClientBusinessField =
  | {
      label: string;
      type: "text" | "long-text" | "enum" | "file" | "image";
      value?: string | null;
    }
  | {
      label: string;
      type: "boolean";
      value?: boolean | null;
      trueLabel?: string;
      falseLabel?: string;
    }
  | {
      label: string;
      type: "currency";
      value?: number | null;
    }
  | {
      label: string;
      type: "list" | "colors" | "file-list" | "image-list";
      values?: string[] | null;
    }
  | {
      label: string;
      type: "faq";
      items?: FaqPair[] | null;
    };

export type ClientBusinessGroup = {
  key: ClientBusinessTabKey;
  label: string;
  description: string;
  fields: ClientBusinessField[];
};

export type ClientBusinessProfile = {
  communicationInfo?: Pick<CommunicationInfo, "businessName" | "industry">;
  productInfo?: ProductInfo;
  audienceInfo?: AudienceInfo;
  brandVoice?: BrandVoice;
  customerJourney?: CustomerJourney;
  campaignInfo?: CampaignInfo;
  pastPerformance?: PastPerformance;
  budgetInfo?: BudgetInfo;
  visualIdentityInfo?: VisualIdentityInfo;
};

export type ClientStat = {
  label: string;
  value: string;
  description: string;
  tone?: StatusTone;
  trendLabel?: string;
};

export type ClientChartPoint = {
  label: string;
  revenue: number;
  paid: number;
  outstanding: number;
};

export type ClientPipelinePoint = {
  label: string;
  projects: number;
  offers: number;
  contracts: number;
};

export type ClientRiskRow = {
  item: string;
  type: string;
  blocker: string;
  amountOrStatus: string;
  owner: string;
  action: string;
  tone: StatusTone;
};

export type ClientProjectCommercialRow = {
  item: string;
  category: string;
  status: string;
  amount: string;
  owner: string;
  due: string;
  tone: StatusTone;
};

export type ClientDisputeRow = {
  title: string;
  relatedTo: string;
  status: string;
  priority: string;
  openedAt: string;
  owner: string;
  blocker: string;
  tone: StatusTone;
};

export type ClientActivityRow = {
  title: string;
  description: string;
  time: string;
  impact: string;
  tone: StatusTone;
};

export type ClientDetailRecord = {
  id: string;
  chatTargetUserId: string | null;
  contactName: string;
  companyName: string;
  email: string;
  phone: string;
  contactRole: string;
  portalStatus: string;
  lastSeen: string;
  owner: string;
  summary: ClientDirectoryRecord;
  businessProfile: ClientBusinessProfile;
  stats: ClientStat[];
  spendTrend: ClientChartPoint[];
  commercialMix: ClientPipelinePoint[];
  risks: ClientRiskRow[];
  projectsCommercial: ClientProjectCommercialRow[];
  disputes: ClientDisputeRow[];
  activity: ClientActivityRow[];
};

const spendTrendConfig = [
  { label: "Jan", revenue: 12000, paid: 9000, outstanding: 3000 },
  { label: "Feb", revenue: 16000, paid: 12000, outstanding: 4000 },
  { label: "Mar", revenue: 18000, paid: 15000, outstanding: 3000 },
  { label: "Apr", revenue: 14000, paid: 12000, outstanding: 2000 },
  { label: "May", revenue: 21000, paid: 18000, outstanding: 3000 },
  { label: "Jun", revenue: 19000, paid: 16000, outstanding: 3000 },
] as const;

function getSummary(id: string) {
  return clientDirectoryRecords.find((client) => client.id === id);
}

const toneOfVoiceLabels: Record<string, string> = {
  formal: "Formal and serious",
  casual: "Casual",
  youthful: "Youthful",
  professional: "Professional",
};

const appearanceMethodLabels: Record<string, string> = {
  voiceover: "Voiceover",
  model: "Model on camera",
  hands: "Hands-only product shots",
};

const orderMethodLabels: Record<string, string> = {
  store: "Direct store purchase",
  whatsapp: "WhatsApp",
  form: "Form submission",
  phone: "Phone call",
  email: "Email",
};

const trackingSetupLabels: Record<string, string> = {
  active: "Connected and active",
  new: "Needs new setup",
  partial: "Connected but needs updates",
};

function mapEnumValue(
  value: string | undefined,
  labels: Record<string, string>,
) {
  if (!value) {
    return undefined;
  }

  return labels[value] ?? value;
}

function mapEnumList(
  values: string[] | undefined,
  labels: Record<string, string>,
) {
  return values?.map((value) => labels[value] ?? value);
}

export function getClientBusinessSections(
  profile: ClientBusinessProfile,
): ClientBusinessGroup[] {
  return [
    {
      key: "identity",
      label: "Identity",
      description: "Core business identity collected from the intake profile.",
      fields: [
        {
          label: "Business name",
          type: "text",
          value: profile.communicationInfo?.businessName,
        },
        {
          label: "Industry",
          type: "text",
          value: profile.communicationInfo?.industry,
        },
      ],
    },
    {
      key: "product",
      label: "Product",
      description: "What the client sells, why it matters, and where the offer wins.",
      fields: [
        {
          label: "Product story",
          type: "long-text",
          value: profile.productInfo?.productStory,
        },
        {
          label: "Detailed description",
          type: "long-text",
          value: profile.productInfo?.detailedDescription,
        },
        {
          label: "Value proposition",
          type: "long-text",
          value: profile.productInfo?.valueProposition,
        },
        {
          label: "Advantages",
          type: "long-text",
          value: profile.productInfo?.advantages,
        },
        {
          label: "Benefits",
          type: "list",
          values: profile.productInfo?.benefits,
        },
        {
          label: "Content direction",
          type: "long-text",
          value: profile.productInfo?.contentDirection,
        },
      ],
    },
    {
      key: "audience",
      label: "Audience",
      description: "Audience understanding, messaging rules, and verbal identity.",
      fields: [
        {
          label: "Customer analysis",
          type: "long-text",
          value: profile.audienceInfo?.customerAnalysis,
        },
        {
          label: "FAQ",
          type: "faq",
          items: profile.audienceInfo?.faq,
        },
        {
          label: "Tone of voice",
          type: "enum",
          value: mapEnumValue(profile.brandVoice?.toneOfVoice, toneOfVoiceLabels),
        },
        {
          label: "Boundaries",
          type: "long-text",
          value: profile.brandVoice?.boundaries,
        },
        {
          label: "Verbal slogan",
          type: "text",
          value: profile.brandVoice?.verbalSlogan,
        },
        {
          label: "Appearance method",
          type: "enum",
          value: mapEnumValue(
            profile.brandVoice?.appearanceMethod,
            appearanceMethodLabels,
          ),
        },
      ],
    },
    {
      key: "journey",
      label: "Journey",
      description: "How leads order and how the account follows up after interest.",
      fields: [
        {
          label: "Order methods",
          type: "list",
          values: mapEnumList(
            profile.customerJourney?.orderMethods,
            orderMethodLabels,
          ),
        },
        {
          label: "Follow-up tools",
          type: "long-text",
          value: profile.customerJourney?.followUpTools,
        },
      ],
    },
    {
      key: "campaign",
      label: "Campaign",
      description: "Campaign goals, offers, and commercial context for launch planning.",
      fields: [
        {
          label: "Campaign goal",
          type: "long-text",
          value: profile.campaignInfo?.campaignGoal,
        },
        {
          label: "Campaign details",
          type: "long-text",
          value: profile.campaignInfo?.campaignDetails,
        },
        {
          label: "Campaign offer",
          type: "long-text",
          value: profile.campaignInfo?.campaignOffer,
        },
        {
          label: "Guarantees",
          type: "long-text",
          value: profile.campaignInfo?.guarantees,
        },
        {
          label: "Campaign season",
          type: "text",
          value: profile.campaignInfo?.campaignSeason,
        },
        {
          label: "Competitors",
          type: "long-text",
          value: profile.campaignInfo?.competitors,
        },
      ],
    },
    {
      key: "performance",
      label: "Performance",
      description: "Past results, tracking readiness, and budget inputs for planning.",
      fields: [
        {
          label: "Best campaigns",
          type: "long-text",
          value: profile.pastPerformance?.bestCampaigns,
        },
        {
          label: "Past performance",
          type: "long-text",
          value: profile.pastPerformance?.pastPerformance,
        },
        {
          label: "Tracking setup",
          type: "enum",
          value: mapEnumValue(
            profile.pastPerformance?.trackingSetup,
            trackingSetupLabels,
          ),
        },
        {
          label: "Budget range",
          type: "currency",
          value: profile.budgetInfo?.budgetRange,
        },
        {
          label: "Previous reports",
          type: "file-list",
          values: profile.budgetInfo?.previousReports,
        },
      ],
    },
    {
      key: "visual",
      label: "Visual",
      description: "Brand assets, colors, and visual references collected in intake.",
      fields: [
        {
          label: "Visual identity ready",
          type: "boolean",
          value: profile.visualIdentityInfo?.hasVisualIdentity,
          trueLabel: "Ready",
          falseLabel: "Not ready",
        },
        {
          label: "Logo",
          type: "image",
          value: profile.visualIdentityInfo?.brandAssets?.logoUrl,
        },
        {
          label: "Brand guidelines",
          type: "file",
          value: profile.visualIdentityInfo?.brandAssets?.guidelinesUrl,
        },
        {
          label: "Brand colors",
          type: "colors",
          values: profile.visualIdentityInfo?.brandAssets?.brandColors,
        },
        {
          label: "Fonts",
          type: "list",
          values: profile.visualIdentityInfo?.brandAssets?.fonts,
        },
        {
          label: "Visual direction",
          type: "list",
          values: profile.visualIdentityInfo?.visualDirection,
        },
        {
          label: "Past designs",
          type: "long-text",
          value: profile.visualIdentityInfo?.pastDesigns,
        },
        {
          label: "Product photos",
          type: "image-list",
          values: profile.visualIdentityInfo?.productPhotos,
        },
      ],
    },
  ];
}

function buildStats(summary: ClientDirectoryRecord): ClientStat[] {
  return [
    {
      label: "Total projects",
      value: String(summary.totalProjects),
      description: `${summary.activeProjects} active right now`,
    },
    {
      label: "Total spend",
      value: formatMoney(summary.totalSpend),
      description: "Revenue closed with this account",
    },
    {
      label: "Outstanding",
      value: formatMoney(summary.outstandingAmount),
      description: "Amount still open in finance",
      tone: summary.outstandingAmount > 0 ? "warning" : "success",
      trendLabel: summary.outstandingAmount > 0 ? "Attention" : "Clear",
    },
    {
      label: "Pending offers",
      value: String(summary.pendingOffers),
      description: `${summary.signedContracts} signed contracts`,
    },
  ];
}

function buildCommercialMix(summary: ClientDirectoryRecord): ClientPipelinePoint[] {
  return [
    {
      label: "Projects",
      projects: summary.totalProjects,
      offers: summary.pendingOffers,
      contracts: summary.signedContracts,
    },
    {
      label: "Current",
      projects: summary.activeProjects,
      offers: summary.openOrders,
      contracts: Math.max(summary.signedContracts - 1, 0),
    },
  ];
}

const clientDetails: ClientDetailRecord[] = [
  {
    id: "client-greenline",
    chatTargetUserId: "client-user-greenline",
    contactName: "Rana Khaled",
    companyName: "Greenline",
    email: "rana.khaled@greenline.com",
    phone: "+966500000211",
    contactRole: "Marketing Manager",
    portalStatus: "Portal active",
    lastSeen: "Online",
    owner: "Mona Saleh",
    summary: getSummary("client-greenline")!,
    businessProfile: {
      communicationInfo: {
        businessName: "Greenline Growth Studio",
        industry: "Retail sustainability products",
      },
      productInfo: {
        productStory:
          "Greenline sells sustainable retail products with recurring seasonal launches.",
        detailedDescription:
          "The business combines ecommerce campaigns with monthly branded content plans.",
        valueProposition:
          "Reliable growth campaigns with strong local brand positioning.",
        advantages:
          "Fast approvals, strong internal team, clear monthly reporting cadence.",
        benefits: [
          "Higher repeat orders",
          "Cleaner acquisition cost",
          "Stronger launch readiness",
        ],
        contentDirection:
          "Clean product storytelling with practical home-use education.",
      },
      audienceInfo: {
        customerAnalysis:
          "Urban families and environmentally aware shoppers in Riyadh and Jeddah.",
        faq: [
          {
            question: "How fast is shipping?",
            answer: "Most Riyadh and Jeddah orders arrive within 24 to 48 hours.",
          },
          {
            question: "Are products locally sourced?",
            answer: "Core bundles mix local sourcing with selected imported items.",
          },
        ],
      },
      brandVoice: {
        toneOfVoice: "professional",
        boundaries: "Avoid aggressive discount-first messaging.",
        verbalSlogan: "Sustainable choices made simple.",
        appearanceMethod: "hands",
      },
      customerJourney: {
        orderMethods: ["store", "whatsapp", "form"],
        followUpTools: "Weekly check-ins and a shared campaign tracker.",
      },
      campaignInfo: {
        campaignGoal: "Increase monthly repeat purchases and launch performance.",
        campaignDetails:
          "Monthly creative batches with paid-social and ecommerce support.",
        campaignOffer: "Seasonal bundle promotion with retention ads.",
        guarantees: "Report delivery and campaign optimization cycle every month.",
        campaignSeason: "Back-to-school and end-of-season pushes.",
        competitors: "EcoCart, Better Basket",
      },
      pastPerformance: {
        bestCampaigns: "Spring home refresh and family bundle launch.",
        pastPerformance:
          "Strong repeat purchase performance and stable paid-media ROI.",
        trackingSetup: "active",
      },
      budgetInfo: {
        budgetRange: 25000,
        previousReports: [
          "greenline-paid-media-june-2026.pdf",
          "greenline-ecommerce-retention-q2.pdf",
        ],
      },
      visualIdentityInfo: {
        hasVisualIdentity: true,
        brandAssets: {
          logoUrl: "https://placehold.co/120x120/png?text=GL",
          guidelinesUrl: "greenline-brand-guidelines.pdf",
          brandColors: ["#2D6A4F", "#D8C3A5", "#F8F7F2"],
          fonts: ["Inter", "IBM Plex Sans Arabic"],
        },
        visualDirection: [
          "Clean product-first compositions",
          "Restrained seasonal accents",
          "Bright catalog framing",
        ],
        pastDesigns:
          "Launch kits, ecommerce banners, and monthly carousel systems.",
        productPhotos: [
          "https://placehold.co/240x160/png?text=Bundle+1",
          "https://placehold.co/240x160/png?text=Bundle+2",
        ],
      },
    },
    stats: buildStats(getSummary("client-greenline")!),
    spendTrend: spendTrendConfig.map((item) => ({ ...item })),
    commercialMix: buildCommercialMix(getSummary("client-greenline")!),
    risks: [
      {
        item: "August campaign report",
        type: "Approval delay",
        blocker: "Client review is still pending and blocks the next paid-media cycle.",
        amountOrStatus: "Waiting review",
        owner: "Mona Saleh",
        action: "Approve and release next batch",
        tone: "attention",
      },
      {
        item: "Invoice GL-204",
        type: "Outstanding balance",
        blocker: "Finance still has an open amount on the current monthly retainer.",
        amountOrStatus: formatMoney(22000),
        owner: "Finance",
        action: "Close payment follow-up",
        tone: "warning",
      },
    ],
    projectsCommercial: [
      {
        item: "August retail growth sprint",
        category: "Project",
        status: "Active",
        amount: formatMoney(42000),
        owner: "Mona Saleh",
        due: "Aug 15, 2026",
        tone: "active",
      },
      {
        item: "Autumn bundle proposal",
        category: "Offer",
        status: "Pending client decision",
        amount: formatMoney(18000),
        owner: "Omar Nasser",
        due: "Aug 12, 2026",
        tone: "attention",
      },
      {
        item: "2026 content retainer",
        category: "Contract",
        status: "Signed",
        amount: formatMoney(86000),
        owner: "Omar Nasser",
        due: "Sep 1, 2026",
        tone: "success",
      },
    ],
    disputes: [
      {
        title: "Report revision scope",
        relatedTo: "August campaign report",
        status: "Open",
        priority: "Medium",
        openedAt: "Aug 6, 2026",
        owner: "Mona Saleh",
        blocker: "Client requested extra revisions outside the agreed cycle.",
        tone: "warning",
      },
    ],
    activity: [
      {
        title: "Approved July retention campaign",
        description: "Client approved the retention campaign and unlocked creative publishing.",
        time: "Today, 10:05",
        impact: "Campaign moved to execution",
        tone: "success",
      },
      {
        title: "Invoice follow-up opened",
        description: "Finance opened follow-up on the outstanding retainer balance.",
        time: "Yesterday, 15:20",
        impact: "Needs payment confirmation",
        tone: "warning",
      },
    ],
  },
  {
    id: "client-enterprise-foods",
    chatTargetUserId: "client-user-enterprise-foods",
    contactName: "Salem Harbi",
    companyName: "Enterprise Foods",
    email: "salem.harbi@enterprisefoods.sa",
    phone: "+966500000212",
    contactRole: "Commercial Director",
    portalStatus: "Portal active",
    lastSeen: "Yesterday, 16:40",
    owner: "Omar Nasser",
    summary: getSummary("client-enterprise-foods")!,
    businessProfile: {
      communicationInfo: {
        businessName: "Enterprise Foods Foodservice",
        industry: "Food manufacturing and distribution",
      },
      productInfo: {
        productStory:
          "Enterprise Foods serves wholesale buyers and hospitality accounts across major cities.",
        detailedDescription:
          "The account is evaluating brand and lead-generation support for a new sales push.",
        valueProposition:
          "Large catalog, stable supply chain, and trusted procurement relationships.",
        advantages:
          "Strong operations, good market reputation, and decision-maker access.",
        benefits: [
          "Better commercial positioning",
          "Stronger inbound quality",
          "Clearer proposal storytelling",
        ],
        contentDirection:
          "Procurement-focused proof points with clear commercial outcomes.",
      },
      audienceInfo: {
        customerAnalysis:
          "Procurement teams, restaurants, and multi-branch hospitality operators.",
        faq: [
          {
            question: "What delivery windows are available?",
            answer: "Accounts can schedule recurring delivery windows by branch and region.",
          },
          {
            question: "Which certifications matter most?",
            answer: "Buyers usually ask first about sourcing, storage, and food safety certificates.",
          },
        ],
      },
      brandVoice: {
        toneOfVoice: "formal",
        boundaries:
          "Avoid consumer-style language and playful visual framing.",
        verbalSlogan: "Supply confidence at scale.",
        appearanceMethod: "voiceover",
      },
      customerJourney: {
        orderMethods: ["phone", "email", "form"],
        followUpTools: "Commercial meetings and proposal email loop.",
      },
      campaignInfo: {
        campaignGoal:
          "Move the account from proposal review into signed onboarding work.",
        campaignDetails:
          "Positioning package with sales materials and launch campaign planning.",
        campaignOffer: "Lead-generation and sales enablement starter package.",
        guarantees: "Delivery roadmap and onboarding handoff after approval.",
        campaignSeason: "Pre-Q4 procurement planning",
        competitors: "Prime Supply, Saudi Foods Hub",
      },
      pastPerformance: {
        bestCampaigns: "No prior campaigns with Hassad yet.",
        pastPerformance: "Lead is still in pre-conversion stage.",
        trackingSetup: "new",
      },
      budgetInfo: {
        budgetRange: 18000,
        previousReports: [
          "enterprise-foods-proposal-review.pdf",
          "enterprise-foods-qualification-notes.pdf",
        ],
      },
      visualIdentityInfo: {
        hasVisualIdentity: false,
        brandAssets: {
          logoUrl: "https://placehold.co/120x120/png?text=EF",
          brandColors: ["#B42318", "#2B2B2B", "#D6B98C"],
          fonts: ["Montserrat", "Tajawal"],
        },
        visualDirection: [
          "Wholesale credibility",
          "Strong product proof",
          "Operational, industrial framing",
        ],
        pastDesigns: "Legacy corporate deck and packaging references.",
        productPhotos: [
          "enterprise-box-packaging.jpg",
          "enterprise-distribution-truck.jpg",
        ],
      },
    },
    stats: buildStats(getSummary("client-enterprise-foods")!),
    spendTrend: spendTrendConfig.map((item) => ({
      ...item,
      revenue: item.revenue * 0,
      paid: item.paid * 0,
      outstanding: item.outstanding * 0,
    })),
    commercialMix: buildCommercialMix(getSummary("client-enterprise-foods")!),
    risks: [
      {
        item: "Rebrand proposal",
        type: "Decision pending",
        blocker: "Client has not confirmed the proposal decision after the last meeting.",
        amountOrStatus: "Proposal pending",
        owner: "Omar Nasser",
        action: "Close decision call",
        tone: "attention",
      },
      {
        item: "Commercial handoff",
        type: "No signed contract",
        blocker: "Work cannot start until the proposal converts into a signed contract.",
        amountOrStatus: "Lead stage",
        owner: "Sales",
        action: "Push contract path",
        tone: "warning",
      },
    ],
    projectsCommercial: [
      {
        item: "Enterprise rebrand proposal",
        category: "Offer",
        status: "Sent",
        amount: formatMoney(24000),
        owner: "Omar Nasser",
        due: "Aug 11, 2026",
        tone: "attention",
      },
      {
        item: "Foodservice launch request",
        category: "Request",
        status: "Qualifying",
        amount: "Scope in review",
        owner: "Sales",
        due: "Aug 14, 2026",
        tone: "warning",
      },
    ],
    disputes: [],
    activity: [
      {
        title: "Proposal review completed",
        description: "Client reviewed the commercial proposal and requested internal alignment.",
        time: "Yesterday, 16:40",
        impact: "Waiting final decision",
        tone: "attention",
      },
      {
        title: "Qualification notes updated",
        description: "Sales updated procurement constraints and decision stakeholders.",
        time: "Aug 5, 2026",
        impact: "Improves next follow-up",
        tone: "neutral",
      },
    ],
  },
];

export function getClientDetailById(clientId: string) {
  return clientDetails.find((client) => client.id === clientId);
}

export function getClientBusinessTypeLabel(type: BusinessType | string) {
  switch (type) {
    case BusinessType.RESTAURANT:
      return "Restaurant";
    case BusinessType.CLINIC:
      return "Clinic";
    case BusinessType.STORE:
      return "Store";
    case BusinessType.SERVICE:
      return "Service business";
    default:
      return typeof type === "string" ? type : "Other";
  }
}

export function getPortalStatusTone(status: string): StatusTone {
  if (status.toLowerCase().includes("active")) {
    return "success";
  }
  return "neutral";
}

export function getClientTypeTone(summary: ClientDirectoryRecord): StatusTone {
  return summary.stage === "lead" ? "attention" : summary.stageTone;
}

export function getClientTypeLabel(summary: ClientDirectoryRecord) {
  return formatClientStage(summary.stage);
}
