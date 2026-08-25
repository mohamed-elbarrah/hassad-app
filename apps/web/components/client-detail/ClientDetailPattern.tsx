"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CircleDollarSign,
  FileClock,
  FolderKanban,
  Inbox,
} from "lucide-react";
import {
  BUSINESS_TYPE_AR,
  CLIENT_STATUS_AR,
  PROJECT_STATUS_AR,
  PROPOSAL_STATUS_AR,
  ClientStatus,
  type ClientProfile,
} from "@hassad/shared";
import { PageHeader } from "@/components/common/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatCurrency,
  formatDateTime,
  formatPortalDate,
  formatNumber,
} from "@/lib/format";
import {
  clientActivityLabel,
  contractStatusLabel,
  invoiceStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel,
} from "@/lib/i18n";

export type ClientDetailMode =
  | "admin"
  | "sales"
  | "portal"
  | "finance"
  | "internal";

type NullableString = string | null | undefined;

export interface ClientDetailEntity {
  id: string;
  companyName: string;
  businessName?: NullableString;
  businessType: string;
  status?: NullableString;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  source?: NullableString;
  hasPortalAccess?: boolean;
  lastLoginAt?: NullableString;
  totalProjects?: number | null;
  activeProjects?: number | null;
  completedProjects?: number | null;
  totalContractValue?: number | null;
  totalInvoiced?: number | null;
  totalPaid?: number | null;
  avgSatisfactionScore?: number | null;
  profile?: ClientProfile | null;
  manager?: { id?: string; name?: string; email?: string } | null;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    phoneWhatsapp?: string | null;
    avatarUrl?: string | null;
  } | null;
  counters?: Partial<{
    contracts: number;
    projects: number;
    invoices: number;
    payments: number;
    proposals: number;
    requests: number;
  }>;
}

export interface ClientStatItem {
  label: string;
  value: string;
  hint?: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}

export interface ClientDetailTab {
  value: string;
  label: string;
  count?: number;
  content: ReactNode;
}

export interface ClientInfoFieldItem {
  label: string;
  value?: string | null;
  dir?: "rtl" | "ltr";
}

interface ClientBusinessSection {
  key: string;
  title: string;
  description: string;
  hasContent: boolean;
  content: ReactNode;
}

interface ClientProjectRecord {
  id: string;
  name: string;
  status: string;
  completionPercentage: number;
  pmName?: string | null;
  manager?: { name?: string | null } | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
}

interface ClientContractRecord {
  id: string;
  title: string;
  status: string;
  totalValue: number;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
}

interface ClientInvoiceRecord {
  id: string;
  invoiceNumber: string;
  amount: number;
  remainingAmount?: number;
  status: string;
  dueDate?: string | null;
  issueDate?: string | null;
  createdAt: string;
}

interface ClientPaymentRecord {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  invoiceNumber?: string | null;
}

interface ClientProposalRecord {
  id: string;
  title: string;
  status: string;
  totalPrice: number;
  creator?: { name?: string | null } | null;
  createdAt: string;
}

interface ClientHistoryRecord {
  id: string;
  eventType: string;
  description?: string | null;
  userName?: string | null;
  occurredAt: string;
}

function isFilled(value: unknown) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function normalizeText(value: unknown) {
  if (!isFilled(value)) return null;
  return String(value);
}

function normalizeList(
  values: Array<string | null | undefined> | null | undefined,
) {
  return (values ?? []).filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function statusVariant(status?: string | null) {
  switch (status) {
    case ClientStatus.ACTIVE:
      return "secondary";
    case ClientStatus.SUSPENDED:
      return "destructive";
    default:
      return "outline";
  }
}

function relatedStatusVariant(status?: string | null) {
  if (!status) return "outline";

  if (
    status === "ACTIVE" ||
    status === "COMPLETED" ||
    status === "PAID" ||
    status === "APPROVED"
  ) {
    return "secondary";
  }

  if (
    status === "CANCELLED" ||
    status === "OVERDUE" ||
    status === "REJECTED" ||
    status === "SUSPENDED"
  ) {
    return "destructive";
  }

  return "outline";
}

function ClientRelatedEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Empty className="border bg-muted/30 p-10">
      <EmptyMedia variant="icon">
        <Inbox />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function InfoField({ label, value, dir }: ClientInfoFieldItem) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4 border-b border-border/60 py-3 last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-left text-sm font-medium" dir={dir}>
        {value || "—"}
      </dd>
    </div>
  );
}

function TagField({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/60 py-3 last:border-b-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <Badge key={value} variant="outline">
              {value}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm font-medium">—</p>
      )}
    </div>
  );
}

function SectionCard({
  title,
  description,
  hasContent,
  children,
}: {
  title: string;
  description: string;
  hasContent: boolean;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {hasContent ? (
          children
        ) : (
          <ClientRelatedEmpty
            title="لا توجد بيانات مكتملة"
            description="لم يتم تعبئة هذا القسم في ملف العميل حتى الآن."
          />
        )}
      </CardContent>
    </Card>
  );
}

function getVisibleBusinessSections(mode: ClientDetailMode) {
  switch (mode) {
    case "finance":
      return ["identity", "performance", "visual"];
    case "internal":
      return [
        "identity",
        "product",
        "audience",
        "journey",
        "campaign",
        "performance",
        "visual",
      ];
    default:
      return [
        "identity",
        "product",
        "audience",
        "journey",
        "campaign",
        "performance",
        "visual",
      ];
  }
}

export function getClientBusinessName(
  client: ClientDetailEntity,
  profile?: ClientProfile | null,
) {
  return (
    normalizeText(profile?.communicationInfo?.businessName) ||
    normalizeText(client.businessName)
  );
}

export function getClientIndustry(
  client: ClientDetailEntity,
  profile?: ClientProfile | null,
) {
  return (
    normalizeText(profile?.communicationInfo?.industry) ||
    normalizeText(profile?.industry)
  );
}

export function buildClientPersonalFields(
  client: ClientDetailEntity,
  profile?: ClientProfile | null,
  mode: ClientDetailMode = "admin",
) {
  const fields: ClientInfoFieldItem[] = [
    {
      label: "الاسم المرتبط",
      value: normalizeText(client.user?.name),
    },
    {
      label: "البريد الإلكتروني",
      value: normalizeText(client.user?.email),
      dir: "ltr",
    },
    {
      label: "رقم التواصل",
      value:
        normalizeText(client.user?.phoneWhatsapp) ||
        normalizeText(profile?.decisionMakerPhone),
      dir: "ltr",
    },
    {
      label: "صانع القرار",
      value: normalizeText(profile?.decisionMakerName),
    },
    {
      label: "مدير الحساب",
      value: normalizeText(client.manager?.name),
    },
    {
      label: "الوصول للبوابة",
      value:
        client.hasPortalAccess === undefined
          ? null
          : client.hasPortalAccess
            ? "مفعل"
            : "غير مفعل",
    },
    {
      label: "آخر دخول",
      value: client.lastLoginAt ? formatDateTime(client.lastLoginAt) : null,
    },
    {
      label: "مصدر العميل",
      value: normalizeText(client.source),
    },
    {
      label: "اللغة المفضلة",
      value: normalizeText(profile?.preferredLanguage),
    },
    {
      label: "تفضيل التواصل",
      value: normalizeText(profile?.communicationPreference),
    },
    {
      label: "المنطقة الزمنية",
      value: normalizeText(profile?.timezone),
    },
    {
      label: "أوقات التواصل",
      value: normalizeText(profile?.workingHours),
    },
  ];

  switch (mode) {
    case "portal":
      return fields.filter((field) =>
        [
          "الاسم المرتبط",
          "البريد الإلكتروني",
          "رقم التواصل",
          "صانع القرار",
          "اللغة المفضلة",
          "تفضيل التواصل",
          "المنطقة الزمنية",
          "أوقات التواصل",
        ].includes(field.label),
      );
    case "finance":
      return fields.filter((field) =>
        [
          "الاسم المرتبط",
          "البريد الإلكتروني",
          "رقم التواصل",
          "مدير الحساب",
          "آخر دخول",
        ].includes(field.label),
      );
    case "internal":
      return fields.filter((field) =>
        [
          "صانع القرار",
          "مدير الحساب",
          "اللغة المفضلة",
          "تفضيل التواصل",
          "المنطقة الزمنية",
          "أوقات التواصل",
        ].includes(field.label),
      );
    default:
      return fields;
  }
}

export function buildClientBusinessSections(
  client: ClientDetailEntity,
  profile?: ClientProfile | null,
  mode: ClientDetailMode = "admin",
) {
  const businessName = getClientBusinessName(client, profile);
  const industry = getClientIndustry(client, profile);
  const budgetRange = profile?.budgetInfo?.budgetRange;

  const sections: ClientBusinessSection[] = [
    {
      key: "identity",
      title: "هوية النشاط",
      description: "البيانات الأساسية التي تعرّف نشاط العميل وسياق الحساب.",
      content: (
        <div className="grid gap-4 md:grid-cols-2">
          <InfoField label="اسم الشركة" value={client.companyName} />
          <InfoField label="اسم النشاط" value={businessName} />
          <InfoField
            label="نوع النشاط"
            value={
              BUSINESS_TYPE_AR[
                client.businessType as keyof typeof BUSINESS_TYPE_AR
              ] || client.businessType
            }
          />
          <InfoField label="المجال" value={industry} />
          <InfoField
            label="الموقع الإلكتروني"
            value={normalizeText(profile?.website)}
            dir="ltr"
          />
          <InfoField
            label="تاريخ الإنشاء"
            value={
              client.createdAt
                ? formatPortalDate(client.createdAt) || "—"
                : null
            }
          />
        </div>
      ),
      hasContent:
        isFilled(client.companyName) ||
        isFilled(businessName) ||
        isFilled(industry) ||
        isFilled(profile?.website),
    },
    {
      key: "product",
      title: "المنتج أو الخدمة",
      description: "وصف العرض التجاري والقيمة التي يقدمها العميل.",
      content: (
        <div className="grid gap-4 md:grid-cols-2">
          <InfoField
            label="قصة المنتج"
            value={normalizeText(profile?.productInfo?.productStory)}
          />
          <InfoField
            label="الوصف التفصيلي"
            value={normalizeText(profile?.productInfo?.detailedDescription)}
          />
          <InfoField
            label="القيمة المقترحة"
            value={normalizeText(profile?.productInfo?.valueProposition)}
          />
          <InfoField
            label="المزايا"
            value={normalizeText(profile?.productInfo?.advantages)}
          />
          <InfoField
            label="اتجاه المحتوى"
            value={normalizeText(profile?.productInfo?.contentDirection)}
          />
          <TagField
            label="الفوائد الأساسية"
            values={normalizeList(profile?.productInfo?.benefits)}
          />
        </div>
      ),
      hasContent:
        isFilled(profile?.productInfo?.productStory) ||
        isFilled(profile?.productInfo?.detailedDescription) ||
        isFilled(profile?.productInfo?.valueProposition) ||
        isFilled(profile?.productInfo?.advantages) ||
        isFilled(profile?.productInfo?.benefits) ||
        isFilled(profile?.productInfo?.contentDirection),
    },
    {
      key: "audience",
      title: "الجمهور والرسائل",
      description: "فهم الجمهور، الأسئلة المتكررة، ونبرة الخطاب المناسبة.",
      content: (
        <div className="grid gap-4 md:grid-cols-2">
          <InfoField
            label="تحليل الجمهور"
            value={normalizeText(profile?.audienceInfo?.customerAnalysis)}
          />
          <InfoField
            label="نبرة الصوت"
            value={normalizeText(profile?.brandVoice?.toneOfVoice)}
          />
          <InfoField
            label="الحدود التحريرية"
            value={normalizeText(profile?.brandVoice?.boundaries)}
          />
          <InfoField
            label="الشعار اللفظي"
            value={normalizeText(profile?.brandVoice?.verbalSlogan)}
          />
          <InfoField
            label="أسلوب الظهور"
            value={normalizeText(profile?.brandVoice?.appearanceMethod)}
          />
          <InfoField
            label="الأسئلة المتكررة"
            value={
              profile?.audienceInfo?.faq?.length
                ? `${formatNumber(profile.audienceInfo.faq.length)} سؤال`
                : null
            }
          />
        </div>
      ),
      hasContent:
        isFilled(profile?.audienceInfo?.customerAnalysis) ||
        isFilled(profile?.audienceInfo?.faq) ||
        isFilled(profile?.brandVoice?.toneOfVoice) ||
        isFilled(profile?.brandVoice?.boundaries) ||
        isFilled(profile?.brandVoice?.verbalSlogan) ||
        isFilled(profile?.brandVoice?.appearanceMethod),
    },
    {
      key: "journey",
      title: "رحلة العميل",
      description: "طريقة الطلب والمتابعة بعد التواصل أو الشراء.",
      content: (
        <div className="grid gap-4 md:grid-cols-2">
          <TagField
            label="طرق الطلب"
            values={normalizeList(profile?.customerJourney?.orderMethods)}
          />
          <InfoField
            label="أدوات المتابعة"
            value={normalizeText(profile?.customerJourney?.followUpTools)}
          />
        </div>
      ),
      hasContent:
        isFilled(profile?.customerJourney?.orderMethods) ||
        isFilled(profile?.customerJourney?.followUpTools),
    },
    {
      key: "campaign",
      title: "الحملة الإعلانية",
      description: "أهداف الحملة والعرض والاعتبارات التسويقية المحيطة بها.",
      content: (
        <div className="grid gap-4 md:grid-cols-2">
          <InfoField
            label="هدف الحملة"
            value={normalizeText(profile?.campaignInfo?.campaignGoal)}
          />
          <InfoField
            label="تفاصيل الحملة"
            value={normalizeText(profile?.campaignInfo?.campaignDetails)}
          />
          <InfoField
            label="العرض"
            value={normalizeText(profile?.campaignInfo?.campaignOffer)}
          />
          <InfoField
            label="الضمانات"
            value={normalizeText(profile?.campaignInfo?.guarantees)}
          />
          <InfoField
            label="الموسم"
            value={normalizeText(profile?.campaignInfo?.campaignSeason)}
          />
          <InfoField
            label="المنافسون"
            value={normalizeText(profile?.campaignInfo?.competitors)}
          />
        </div>
      ),
      hasContent:
        isFilled(profile?.campaignInfo?.campaignGoal) ||
        isFilled(profile?.campaignInfo?.campaignDetails) ||
        isFilled(profile?.campaignInfo?.campaignOffer) ||
        isFilled(profile?.campaignInfo?.guarantees) ||
        isFilled(profile?.campaignInfo?.campaignSeason) ||
        isFilled(profile?.campaignInfo?.competitors),
    },
    {
      key: "performance",
      title: "الأداء والميزانية",
      description: "الأداء السابق، التتبع، والميزانية المتاحة للتنفيذ.",
      content: (
        <div className="grid gap-4 md:grid-cols-2">
          <InfoField
            label="أفضل الحملات"
            value={normalizeText(profile?.pastPerformance?.bestCampaigns)}
          />
          <InfoField
            label="الأداء السابق"
            value={normalizeText(profile?.pastPerformance?.pastPerformance)}
          />
          <InfoField
            label="إعداد التتبع"
            value={normalizeText(profile?.pastPerformance?.trackingSetup)}
          />
          <InfoField
            label="الميزانية"
            value={budgetRange ? formatCurrency(budgetRange) : null}
          />
          <TagField
            label="تقارير سابقة"
            values={normalizeList(profile?.budgetInfo?.previousReports)}
          />
        </div>
      ),
      hasContent:
        isFilled(profile?.pastPerformance?.bestCampaigns) ||
        isFilled(profile?.pastPerformance?.pastPerformance) ||
        isFilled(profile?.pastPerformance?.trackingSetup) ||
        isFilled(profile?.budgetInfo?.budgetRange) ||
        isFilled(profile?.budgetInfo?.previousReports),
    },
    {
      key: "visual",
      title: "الهوية البصرية",
      description: "الملفات البصرية والألوان والخطوط والتوجه الإبداعي الحالي.",
      content: (
        <div className="grid gap-4 md:grid-cols-2">
          <InfoField
            label="هوية بصرية جاهزة"
            value={
              profile?.visualIdentityInfo?.hasVisualIdentity === undefined
                ? null
                : profile.visualIdentityInfo.hasVisualIdentity
                  ? "نعم"
                  : "لا"
            }
          />
          <InfoField
            label="دليل الهوية"
            value={normalizeText(
              profile?.visualIdentityInfo?.brandAssets?.guidelinesUrl,
            )}
            dir="ltr"
          />
          <TagField
            label="ألوان العلامة"
            values={normalizeList(
              profile?.visualIdentityInfo?.brandAssets?.brandColors,
            )}
          />
          <TagField
            label="الخطوط"
            values={normalizeList(
              profile?.visualIdentityInfo?.brandAssets?.fonts,
            )}
          />
          <TagField
            label="التوجه البصري"
            values={normalizeList(profile?.visualIdentityInfo?.visualDirection)}
          />
          <InfoField
            label="تصاميم سابقة"
            value={normalizeText(profile?.visualIdentityInfo?.pastDesigns)}
          />
        </div>
      ),
      hasContent:
        isFilled(profile?.visualIdentityInfo?.hasVisualIdentity) ||
        isFilled(profile?.visualIdentityInfo?.brandAssets?.guidelinesUrl) ||
        isFilled(profile?.visualIdentityInfo?.brandAssets?.brandColors) ||
        isFilled(profile?.visualIdentityInfo?.brandAssets?.fonts) ||
        isFilled(profile?.visualIdentityInfo?.visualDirection) ||
        isFilled(profile?.visualIdentityInfo?.pastDesigns),
    },
  ];

  const visibleKeys = getVisibleBusinessSections(mode);
  return sections.filter((section) => visibleKeys.includes(section.key));
}

export function ClientDetailLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8" dir="rtl">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <Skeleton className="h-10 w-28" />
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card>
          <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-start">
            <Skeleton className="size-20 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-40" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="size-10 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="gap-3">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-9 w-full" />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-72 w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ClientPageHeader({
  title,
  description,
  companyName,
  backHref,
  backLabel,
  actions,
}: {
  title: string;
  description: string;
  companyName: string;
  backHref: string;
  backLabel: string;
  actions?: ReactNode;
}) {
  return (
    <PageHeader
      title={title}
      description={`${description} — ${companyName}`}
      icon={Building2}
      actions={
        <>
          <Button variant="outline" size="sm" asChild>
            <Link href={backHref}>
              <ArrowLeft data-icon="inline-start" />
              {backLabel}
            </Link>
          </Button>
          {actions}
        </>
      }
    />
  );
}

export function ClientSummaryCard({
  client,
  profile,
  badges = [],
}: {
  client: ClientDetailEntity;
  profile?: ClientProfile | null;
  badges?: ReactNode[];
}) {
  const businessName = getClientBusinessName(client, profile);
  const businessTypeLabel =
    BUSINESS_TYPE_AR[client.businessType as keyof typeof BUSINESS_TYPE_AR] ||
    client.businessType;

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-start">
        <Avatar className="size-20">
          <AvatarImage
            src={client.user?.avatarUrl ?? undefined}
            alt={client.companyName}
          />
          <AvatarFallback className="text-lg font-semibold">
            {getInitials(client.companyName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-2xl font-semibold tracking-tight">
              {client.companyName}
            </h2>
            {client.status ? (
              <Badge variant={statusVariant(client.status)}>
                {CLIENT_STATUS_AR[
                  client.status as keyof typeof CLIENT_STATUS_AR
                ] || client.status}
              </Badge>
            ) : null}
            {client.hasPortalAccess ? (
              <Badge variant="outline">بوابة العميل مفعلة</Badge>
            ) : null}
          </div>

          <p className="text-sm text-muted-foreground">
            {businessName || "لم يتم تحديد اسم النشاط بعد"}
          </p>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{businessTypeLabel}</Badge>
            {badges}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ClientStatsGrid({ stats }: { stats: ClientStatItem[] }) {
  return (
    <dl className="grid gap-x-6 md:grid-cols-2">
      {stats.map((item) => (
        <div
          key={item.label}
          className="flex min-w-0 items-start gap-3 border-b border-border/60 py-3 last:border-b-0"
        >
          <item.icon />
          <div className="flex min-w-0 flex-col gap-1">
            <dt className="text-sm text-muted-foreground">{item.label}</dt>
            <dd className="text-lg font-semibold">{item.value}</dd>
            {item.hint ? (
              <dd className="text-sm text-muted-foreground">{item.hint}</dd>
            ) : null}
          </div>
        </div>
      ))}
    </dl>
  );
}

export function buildDefaultClientStats(
  client: ClientDetailEntity,
  mode: ClientDetailMode = "admin",
): ClientStatItem[] {
  if (mode === "finance") {
    return [
      {
        label: "إجمالي الفواتير",
        value: formatCurrency(client.totalInvoiced || 0),
        hint: `${formatNumber(client.counters?.invoices || 0)} فاتورة`,
        icon: FileClock,
      },
      {
        label: "المحصل",
        value: formatCurrency(client.totalPaid || 0),
        hint: `${formatNumber(client.counters?.payments || 0)} دفعة`,
        icon: CircleDollarSign,
      },
      {
        label: "العقود",
        value: formatCurrency(client.totalContractValue || 0),
        hint: `${formatNumber(client.counters?.contracts || 0)} عقد`,
        icon: FileClock,
      },
      {
        label: "آخر تحديث",
        value: client.updatedAt
          ? formatPortalDate(client.updatedAt) || "—"
          : "—",
        hint: client.manager?.name || "بدون مدير حساب",
        icon: CalendarDays,
      },
    ];
  }

  return [
    {
      label: "إجمالي المشاريع",
      value: formatNumber(client.totalProjects || 0),
      hint: `${formatNumber(client.activeProjects || 0)} نشط`,
      icon: FolderKanban,
    },
    {
      label: "العقود",
      value: formatCurrency(client.totalContractValue || 0),
      hint: `${formatNumber(client.counters?.contracts || 0)} عقد`,
      icon: FileClock,
    },
    {
      label: "المحصل",
      value: formatCurrency(client.totalPaid || 0),
      hint: `${formatNumber(client.counters?.invoices || 0)} فاتورة`,
      icon: CircleDollarSign,
    },
    {
      label: "آخر تحديث",
      value: client.updatedAt ? formatPortalDate(client.updatedAt) || "—" : "—",
      hint: client.manager?.name || "بدون مدير حساب",
      icon: CalendarDays,
    },
  ];
}

export function ClientProfileCard({
  client,
  profile,
  mode = "admin",
  title = "ملف العميل",
  description = "قسمان واضحان لبيانات الشخص المرتبط وبيانات النشاط التجاري.",
  actions,
  businessOnly = false,
}: {
  client: ClientDetailEntity;
  profile?: ClientProfile | null;
  mode?: ClientDetailMode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  businessOnly?: boolean;
}) {
  const personalFields = buildClientPersonalFields(client, profile, mode);
  const businessSections = buildClientBusinessSections(client, profile, mode);

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {actions}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {businessOnly ? (
          <Tabs defaultValue={businessSections[0]?.key} dir="rtl">
            <div className="overflow-x-auto pb-1">
              <TabsList className="min-w-max">
                {businessSections.map((section) => (
                  <TabsTrigger key={section.key} value={section.key}>{section.title}</TabsTrigger>
                ))}
              </TabsList>
            </div>
            {businessSections.map((section) => (
              <TabsContent key={section.key} value={section.key} className="mt-4">
                <section className="flex flex-col gap-3" aria-labelledby={`business-${section.key}`}>
                  <div>
                    <h3 id={`business-${section.key}`} className="font-semibold">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                  {section.content}
                </section>
              </TabsContent>
            ))}
          </Tabs>
        ) : null}
        {!businessOnly ? <Tabs defaultValue="personal" dir="rtl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal">بيانات شخصية</TabsTrigger>
            <TabsTrigger value="business">بيانات النشاط</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-0">
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                بيانات التواصل والحساب
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {personalFields.map((field) => (
                  <InfoField key={field.label} {...field} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="business" className="mt-0">
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                ملف النشاط والتسويق
              </p>
              {businessSections.map((section) => (
                <SectionCard
                  key={section.key}
                  title={section.title}
                  description={section.description}
                  hasContent={section.hasContent}
                >
                  {section.content}
                </SectionCard>
              ))}
            </div>
          </TabsContent>
        </Tabs> : null}
      </CardContent>
    </Card>
  );
}

export function ClientRecordsTabs({
  title,
  description,
  tabs,
  defaultValue,
}: {
  title: string;
  description: string;
  tabs: ClientDetailTab[];
  defaultValue?: string;
}) {
  const visibleTabs = tabs.filter((tab) => Boolean(tab));

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Tabs defaultValue={defaultValue ?? visibleTabs[0]?.value} dir="rtl">
          <TabsList
            className={`grid h-auto w-full justify-start rounded-none border-b bg-transparent p-0 ${visibleTabs.length === 5 ? "grid-cols-2 md:grid-cols-5" : visibleTabs.length === 4 ? "grid-cols-2 md:grid-cols-4" : visibleTabs.length === 3 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2"}`}
          >
            {visibleTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="h-auto rounded-none border-b-2 border-transparent px-4 py-3 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <span className="flex items-center gap-2">
                  <span>{tab.label}</span>
                  {typeof tab.count === "number" ? (
                    <span className="text-xs text-muted-foreground">
                      {formatNumber(tab.count)}
                    </span>
                  ) : null}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {visibleTabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-0">
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

export function ClientProjectsTable({
  projects,
  hrefBuilder,
  emptyTitle = "لا توجد مشاريع مرتبطة",
  emptyDescription = "سيظهر هنا كل مشروع مرتبط بهذا العميل عند إنشائه.",
}: {
  projects: ClientProjectRecord[];
  hrefBuilder?: (projectId: string) => string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (projects.length === 0) {
    return (
      <ClientRelatedEmpty title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>المشروع</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>التقدم</TableHead>
            <TableHead>مدير المشروع</TableHead>
            {hrefBuilder ? (
              <TableHead className="text-left">التفاصيل</TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{project.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatPortalDate(project.startDate) || "—"} إلى{" "}
                    {formatPortalDate(project.endDate) || "—"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={relatedStatusVariant(project.status)}>
                  {PROJECT_STATUS_AR[
                    project.status as keyof typeof PROJECT_STATUS_AR
                  ] || project.status}
                </Badge>
              </TableCell>
              <TableCell>
                {formatNumber(project.completionPercentage)}%
              </TableCell>
              <TableCell>
                {project.pmName || project.manager?.name || "—"}
              </TableCell>
              {hrefBuilder ? (
                <TableCell className="text-left">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={hrefBuilder(project.id)}>فتح</Link>
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ClientContractsTable({
  contracts,
  hrefBuilder,
  emptyTitle = "لا توجد عقود مرتبطة",
  emptyDescription = "عند وجود عقد لهذا العميل سيظهر هنا مباشرة.",
}: {
  contracts: ClientContractRecord[];
  hrefBuilder?: (contractId: string) => string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (contracts.length === 0) {
    return (
      <ClientRelatedEmpty title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>العقد</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>القيمة</TableHead>
            <TableHead>الفترة</TableHead>
            {hrefBuilder ? (
              <TableHead className="text-left">التفاصيل</TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => (
            <TableRow key={contract.id}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{contract.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatPortalDate(contract.createdAt) || "—"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={relatedStatusVariant(contract.status)}>
                  {contractStatusLabel(contract.status)}
                </Badge>
              </TableCell>
              <TableCell>{formatCurrency(contract.totalValue)}</TableCell>
              <TableCell>
                {formatPortalDate(contract.startDate) || "—"} إلى{" "}
                {formatPortalDate(contract.endDate) || "—"}
              </TableCell>
              {hrefBuilder ? (
                <TableCell className="text-left">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={hrefBuilder(contract.id)}>فتح</Link>
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ClientInvoicesTable({
  invoices,
  hrefBuilder,
  emptyTitle = "لا توجد فواتير مرتبطة",
  emptyDescription = "سيظهر هنا سجل الفواتير بمجرد إصدارها لهذا العميل.",
}: {
  invoices: ClientInvoiceRecord[];
  hrefBuilder?: (invoiceId: string) => string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (invoices.length === 0) {
    return (
      <ClientRelatedEmpty title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الفاتورة</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>القيمة</TableHead>
            <TableHead>الاستحقاق</TableHead>
            {hrefBuilder ? (
              <TableHead className="text-left">التفاصيل</TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{invoice.invoiceNumber}</span>
                  <span className="text-xs text-muted-foreground">
                    {invoice.remainingAmount !== undefined
                      ? `المتبقي ${formatCurrency(invoice.remainingAmount)}`
                      : formatPortalDate(
                          invoice.issueDate || invoice.createdAt,
                        ) || "—"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={relatedStatusVariant(invoice.status)}>
                  {invoiceStatusLabel(invoice.status)}
                </Badge>
              </TableCell>
              <TableCell>{formatCurrency(invoice.amount)}</TableCell>
              <TableCell>{formatPortalDate(invoice.dueDate) || "—"}</TableCell>
              {hrefBuilder ? (
                <TableCell className="text-left">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={hrefBuilder(invoice.id)}>فتح</Link>
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ClientPaymentsTable({
  payments,
  emptyTitle = "لا توجد مدفوعات مرتبطة",
  emptyDescription = "سيظهر هنا سجل الدفعات بمجرد تسجيلها لهذا العميل.",
}: {
  payments: ClientPaymentRecord[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (payments.length === 0) {
    return (
      <ClientRelatedEmpty title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الدفعة</TableHead>
            <TableHead>الطريقة</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>المرجع</TableHead>
            <TableHead>التاريخ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{formatCurrency(payment.amount)}</TableCell>
              <TableCell>{paymentMethodLabel(payment.method)}</TableCell>
              <TableCell>
                <Badge variant={relatedStatusVariant(payment.status)}>
                  {paymentStatusLabel(payment.status)}
                </Badge>
              </TableCell>
              <TableCell>{payment.invoiceNumber || "—"}</TableCell>
              <TableCell>{formatDateTime(payment.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ClientProposalsTable({
  proposals,
  hrefBuilder,
  loading = false,
  emptyTitle = "لا توجد عروض أسعار مرتبطة",
  emptyDescription = "سيظهر هنا كل عرض سعر مرتبط بهذا العميل بمجرد إنشائه.",
}: {
  proposals: ClientProposalRecord[];
  hrefBuilder?: (proposalId: string) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <ClientRelatedEmpty title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>العرض</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>القيمة</TableHead>
            <TableHead>المنشئ</TableHead>
            {hrefBuilder ? (
              <TableHead className="text-left">التفاصيل</TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {proposals.map((proposal) => (
            <TableRow key={proposal.id}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{proposal.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatPortalDate(proposal.createdAt) || "—"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={relatedStatusVariant(proposal.status)}>
                  {PROPOSAL_STATUS_AR[
                    proposal.status as keyof typeof PROPOSAL_STATUS_AR
                  ] || proposal.status}
                </Badge>
              </TableCell>
              <TableCell>{formatCurrency(proposal.totalPrice)}</TableCell>
              <TableCell>{proposal.creator?.name || "—"}</TableCell>
              {hrefBuilder ? (
                <TableCell className="text-left">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={hrefBuilder(proposal.id)}>فتح</Link>
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ClientHistoryTable({
  history,
  emptyTitle = "لا يوجد سجل نشاط",
  emptyDescription = "لم يتم تسجيل أحداث على هذا العميل بعد.",
}: {
  history: ClientHistoryRecord[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (history.length === 0) {
    return (
      <ClientRelatedEmpty title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الحدث</TableHead>
            <TableHead>الوصف</TableHead>
            <TableHead>بواسطة</TableHead>
            <TableHead>التاريخ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Badge variant="outline">
                  {clientActivityLabel(item.eventType)}
                </Badge>
              </TableCell>
              <TableCell>{item.description || "—"}</TableCell>
              <TableCell>{item.userName || "—"}</TableCell>
              <TableCell>{formatDateTime(item.occurredAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ClientContextPanel({
  client,
  profile,
  mode = "internal",
  badges = [],
  stats,
  profileActions,
  profileContent,
}: {
  client: ClientDetailEntity;
  profile?: ClientProfile | null;
  mode?: ClientDetailMode;
  badges?: ReactNode[];
  stats?: ClientStatItem[];
  profileActions?: ReactNode;
  profileContent?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <ClientSummaryCard client={client} profile={profile} badges={badges} />
      {stats && stats.length > 0 ? <ClientStatsGrid stats={stats} /> : null}
      {profileContent ?? (
        <ClientProfileCard
          client={client}
          profile={profile}
          mode={mode}
          actions={profileActions}
        />
      )}
    </div>
  );
}
