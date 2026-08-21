"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { ClientProfile } from "@hassad/shared";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CircleDollarSign,
  FileText,
  FolderKanban,
  History,
  Mail,
  Pencil,
  Phone,
  Receipt,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  portalProjectStatusLabel,
} from "@/lib/i18n";

export interface SalesClientDetailData {
  client: {
    id: string;
    companyName: string;
    businessName?: string | null;
    businessType: string;
    status?: string | null;
    createdAt?: string | Date;
    totalProjects?: number | null;
    activeProjects?: number | null;
    totalContractValue?: number | null;
    totalInvoiced?: number | null;
    totalPaid?: number | null;
    user?: {
      name?: string;
      email?: string;
      phoneWhatsapp?: string | null;
    } | null;
    historyLogs?: Array<{
      id: string;
      eventType: string;
      description?: string | null;
      user?: { name?: string | null } | null;
      occurredAt: string | Date;
    }>;
  };
  profile: ClientProfile | null;
  projectTotal?: number;
  contractTotal?: number;
  invoiceTotal?: number;
  projects: Array<{
    id: string;
    name: string;
    status: string;
    completionPercentage?: number | null;
    manager?: { name?: string | null } | null;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
  }>;
  contracts: Array<{
    id: string;
    title: string;
    status: string;
    totalValue: number;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    amount: number;
    status: string;
    dueDate?: string | Date | null;
    issueDate?: string | Date | null;
    createdAt: string | Date;
    payments?: Array<{
      id: string;
      amount?: number | null;
      method?: string | null;
      status?: string | null;
      createdAt?: string | Date;
      date?: string | Date;
    }>;
  }>;
  profileContent?: ReactNode;
  onEditProfile: () => void;
  onNewRequest: () => void;
  projectsNotice?: ReactNode;
  contractsNotice?: ReactNode;
  invoicesNotice?: ReactNode;
}

function Status({ value, label }: { value: string; label: string }) {
  const destructive = [
    "CANCELLED",
    "OVERDUE",
    "LATE",
    "STOPPED",
    "FAILED",
  ].includes(value);
  return (
    <Badge
      variant={
        destructive
          ? "destructive"
          : value === "PAID" || value === "COMPLETED" || value === "ACTIVE"
            ? "secondary"
            : "outline"
      }
    >
      {label}
    </Badge>
  );
}

function DetailEmpty({ title }: { title: string }) {
  return (
    <Empty className="min-h-48 border bg-muted/20 p-8">
      <EmptyMedia variant="icon">
        <FolderKanban />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>
          ستظهر البيانات المرتبطة بالعميل هنا عند توفرها.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function profileText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function ProfileField({
  label,
  value,
  dir,
}: {
  label: string;
  value?: unknown;
  dir?: "rtl" | "ltr";
}) {
  const text = profileText(value);
  return (
    <div className="flex flex-col gap-1 rounded-md border bg-muted/20 p-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd dir={dir} className="whitespace-pre-wrap break-words">
        {text ?? "غير متوفر"}
      </dd>
    </div>
  );
}

function ProfileTags({
  label,
  values,
}: {
  label: string;
  values?: Array<string | null | undefined>;
}) {
  const tags = (values ?? []).filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );
  return (
    <div className="flex flex-col gap-2 rounded-md border bg-muted/20 p-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="flex flex-wrap gap-2">
        {tags.length ? (
          tags.map((tag, index) => (
            <Badge key={`${tag}-${index}`} variant="secondary">
              {tag}
            </Badge>
          ))
        ) : (
          <span className="text-sm">غير متوفر</span>
        )}
      </dd>
    </div>
  );
}

function BusinessProfile({
  client,
  profile,
}: {
  client: SalesClientDetailData["client"];
  profile: ClientProfile | null;
}) {
  const section = (
    key: string,
    title: string,
    description: string,
    children: ReactNode,
  ) => (
    <TabsContent value={key} className="mt-4">
      <section
        className="flex flex-col gap-3"
        aria-labelledby={`profile-${key}`}
      >
        <div>
          <h3 id={`profile-${key}`} className="font-semibold">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">{children}</dl>
      </section>
    </TabsContent>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>بيانات النشاط</CardTitle>
        <CardDescription>
          المعلومات التعريفية والتسويقية المسجلة للعميل.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="identity" dir="rtl">
          <div className="overflow-x-auto pb-1">
            <TabsList className="min-w-max">
              <TabsTrigger value="identity">هوية النشاط</TabsTrigger>
              <TabsTrigger value="product">المنتج أو الخدمة</TabsTrigger>
              <TabsTrigger value="audience">الجمهور</TabsTrigger>
              <TabsTrigger value="journey">رحلة العميل</TabsTrigger>
              <TabsTrigger value="campaign">الحملة</TabsTrigger>
              <TabsTrigger value="performance">الأداء والميزانية</TabsTrigger>
              <TabsTrigger value="visual">الهوية البصرية</TabsTrigger>
            </TabsList>
          </div>
          {section(
            "identity",
            "هوية النشاط",
            "البيانات الأساسية للنشاط والعميل.",
            <>
              <ProfileField label="اسم الشركة" value={client.companyName} />
              <ProfileField
                label="اسم النشاط"
                value={
                  profile?.communicationInfo?.businessName ??
                  client.businessName
                }
              />
              <ProfileField label="نوع النشاط" value={client.businessType} />
              <ProfileField
                label="المجال"
                value={
                  profile?.communicationInfo?.industry ?? profile?.industry
                }
              />
              <ProfileField
                label="الموقع الإلكتروني"
                value={profile?.website}
                dir="ltr"
              />
              <ProfileField
                label="تاريخ الإنشاء"
                value={formatPortalDate(client.createdAt)}
              />
            </>,
          )}
          {section(
            "product",
            "المنتج أو الخدمة",
            "العرض التجاري والقيمة التي يقدمها النشاط.",
            <>
              <ProfileField
                label="قصة المنتج"
                value={profile?.productInfo?.productStory}
              />
              <ProfileField
                label="الوصف التفصيلي"
                value={profile?.productInfo?.detailedDescription}
              />
              <ProfileField
                label="القيمة المقترحة"
                value={profile?.productInfo?.valueProposition}
              />
              <ProfileField
                label="المزايا"
                value={profile?.productInfo?.advantages}
              />
              <ProfileField
                label="اتجاه المحتوى"
                value={profile?.productInfo?.contentDirection}
              />
              <ProfileTags
                label="الفوائد الأساسية"
                values={profile?.productInfo?.benefits}
              />
            </>,
          )}
          {section(
            "audience",
            "الجمهور ونبرة العلامة",
            "الجمهور المستهدف وأسلوب الخطاب.",
            <>
              <ProfileField
                label="تحليل الجمهور"
                value={profile?.audienceInfo?.customerAnalysis}
              />
              <ProfileField
                label="نبرة الصوت"
                value={profile?.brandVoice?.toneOfVoice}
              />
              <ProfileField
                label="الحدود التحريرية"
                value={profile?.brandVoice?.boundaries}
              />
              <ProfileField
                label="الشعار اللفظي"
                value={profile?.brandVoice?.verbalSlogan}
              />
              <ProfileField
                label="أسلوب الظهور"
                value={profile?.brandVoice?.appearanceMethod}
              />
              <ProfileTags
                label="الأسئلة المتكررة"
                values={profile?.audienceInfo?.faq?.map(
                  (item) => item.question,
                )}
              />
            </>,
          )}
          {section(
            "journey",
            "رحلة العميل",
            "طرق الطلب والمتابعة بعد التواصل أو الشراء.",
            <>
              <ProfileTags
                label="طرق الطلب"
                values={profile?.customerJourney?.orderMethods}
              />
              <ProfileField
                label="أدوات المتابعة"
                value={profile?.customerJourney?.followUpTools}
              />
            </>,
          )}
          {section(
            "campaign",
            "الحملة الإعلانية",
            "الأهداف والعروض والاعتبارات التسويقية.",
            <>
              <ProfileField
                label="هدف الحملة"
                value={profile?.campaignInfo?.campaignGoal}
              />
              <ProfileField
                label="تفاصيل الحملة"
                value={profile?.campaignInfo?.campaignDetails}
              />
              <ProfileField
                label="العرض"
                value={profile?.campaignInfo?.campaignOffer}
              />
              <ProfileField
                label="الضمانات"
                value={profile?.campaignInfo?.guarantees}
              />
              <ProfileField
                label="الموسم"
                value={profile?.campaignInfo?.campaignSeason}
              />
              <ProfileField
                label="المنافسون"
                value={profile?.campaignInfo?.competitors}
              />
            </>,
          )}
          {section(
            "performance",
            "الأداء والميزانية",
            "الأداء السابق والتتبع والميزانية المتاحة.",
            <>
              <ProfileField
                label="أفضل الحملات"
                value={profile?.pastPerformance?.bestCampaigns}
              />
              <ProfileField
                label="الأداء السابق"
                value={profile?.pastPerformance?.pastPerformance}
              />
              <ProfileField
                label="إعداد التتبع"
                value={profile?.pastPerformance?.trackingSetup}
              />
              <ProfileField
                label="الميزانية"
                value={
                  profile?.budgetInfo?.budgetRange == null
                    ? null
                    : formatCurrency(profile.budgetInfo.budgetRange)
                }
              />
              <ProfileTags
                label="تقارير سابقة"
                values={profile?.budgetInfo?.previousReports}
              />
            </>,
          )}
          {section(
            "visual",
            "الهوية البصرية",
            "الألوان والخطوط والملفات والتوجه الإبداعي.",
            <>
              <ProfileField
                label="هوية بصرية جاهزة"
                value={
                  profile?.visualIdentityInfo?.hasVisualIdentity == null
                    ? null
                    : profile.visualIdentityInfo.hasVisualIdentity
                      ? "نعم"
                      : "لا"
                }
              />
              <ProfileField
                label="دليل الهوية"
                value={profile?.visualIdentityInfo?.brandAssets?.guidelinesUrl}
                dir="ltr"
              />
              <ProfileTags
                label="ألوان العلامة"
                values={profile?.visualIdentityInfo?.brandAssets?.brandColors}
              />
              <ProfileTags
                label="الخطوط"
                values={profile?.visualIdentityInfo?.brandAssets?.fonts}
              />
              <ProfileTags
                label="التوجه البصري"
                values={profile?.visualIdentityInfo?.visualDirection}
              />
              <ProfileField
                label="التصاميم السابقة"
                value={profile?.visualIdentityInfo?.pastDesigns}
              />
            </>,
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}

export function SalesClientDetail({
  client,
  profile,
  projects,
  contracts,
  invoices,
  projectTotal,
  contractTotal,
  invoiceTotal,
  profileContent,
  onEditProfile,
  onNewRequest,
  projectsNotice,
  contractsNotice,
  invoicesNotice,
}: SalesClientDetailData) {
  const name = client.companyName || client.businessName || "عميل";
  const user = client.user;
  const paid = invoices
    .flatMap((invoice) => invoice.payments ?? [])
    .reduce((sum, payment) => sum + (payment.amount ?? 0), 0);
  const invoiced = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const payments = invoices.flatMap((invoice) =>
    (invoice.payments ?? []).map((payment) => ({
      ...payment,
      invoiceNumber: invoice.invoiceNumber,
      createdAt: payment.createdAt ?? payment.date ?? invoice.createdAt,
    })),
  );
  const stats = [
    [
      "المشاريع",
      formatNumber(
        projectTotal ?? (projects.length || client.totalProjects || 0),
      ),
      FolderKanban,
    ],
    [
      "قيمة العقود",
      formatCurrency(
        client.totalContractValue ??
          contracts.reduce((sum, item) => sum + item.totalValue, 0),
      ),
      FileText,
    ],
    [
      "إجمالي الفواتير",
      formatCurrency(client.totalInvoiced ?? invoiced),
      Receipt,
    ],
    ["المحصل", formatCurrency(client.totalPaid ?? paid), CircleDollarSign],
  ] as const;

  return (
    <main dir="rtl" className="flex flex-col gap-6  ">
      <PageHeader
        title="تفاصيل العميل"
        description="ملف موحد للعلاقة التجارية والمالية مع العميل."
        icon={Building2}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/sales/clients">
                <ArrowRight data-icon="inline-start" />
                العملاء
              </Link>
            </Button>
            <Button size="sm" onClick={onNewRequest}>
              طلب جديد
            </Button>
          </div>
        }
      />
      <section className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-5 p-5">
              <div className="flex items-center gap-3">
                <Avatar className="size-14">
                  <AvatarFallback className="bg-primary/10 text-lg text-primary">
                    {name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold">{name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {profile?.communicationInfo?.industry ??
                      profile?.industry ??
                      "عميل مبيعات"}
                  </p>
                </div>
              </div>
              <Status
                value={client.status ?? "UNKNOWN"}
                label={
                  client.status === "ACTIVE"
                    ? "نشط"
                    : client.status === "STOPPED"
                      ? "متوقف"
                      : "غير محدد"
                }
              />
              <div className="flex flex-col gap-3 text-sm">
                {user?.name && (
                  <p className="flex items-center gap-2">
                    <UserRound className="size-4 text-muted-foreground" />
                    {user.name}
                  </p>
                )}
                {user?.email && (
                  <a
                    className="flex min-w-0 items-center gap-2 truncate hover:text-primary"
                    dir="ltr"
                    href={`mailto:${user.email}`}
                  >
                    <Mail className="size-4 shrink-0 text-muted-foreground" />
                    {user.email}
                  </a>
                )}
                {user?.phoneWhatsapp && (
                  <a
                    className="flex items-center gap-2 hover:text-primary"
                    dir="ltr"
                    href={`tel:${user.phoneWhatsapp}`}
                  >
                    <Phone className="size-4 text-muted-foreground" />
                    {user.phoneWhatsapp}
                  </a>
                )}
              </div>
              <Button variant="outline" onClick={onEditProfile}>
                <Pencil data-icon="inline-start" />
                تعديل الملف
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">بيانات الملف</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">اسم النشاط</span>
                <span>
                  {profile?.communicationInfo?.businessName ??
                    client.businessName ??
                    "—"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">تاريخ الانضمام</span>
                <span>{formatPortalDate(client.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        </aside>
        <div className="flex min-w-0 flex-col gap-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(([label, value, Icon]) => (
              <Card key={label}>
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-1 text-xl font-semibold">{value}</p>
                  </div>
                  <Icon className="size-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
          {profileContent ?? (
            <BusinessProfile client={client} profile={profile} />
          )}
          <Tabs defaultValue="projects" className="flex flex-col gap-4">
            <TabsList className="h-auto w-full justify-start overflow-x-auto">
              <TabsTrigger value="projects">
                المشاريع ({projectTotal ?? projects.length})
              </TabsTrigger>
              <TabsTrigger value="contracts">
                العقود ({contractTotal ?? contracts.length})
              </TabsTrigger>
              <TabsTrigger value="invoices">
                الفواتير ({invoiceTotal ?? invoices.length})
              </TabsTrigger>
              <TabsTrigger value="payments">
                الدفعات ({payments.length})
              </TabsTrigger>
              <TabsTrigger value="activity">
                النشاط ({client.historyLogs?.length ?? 0})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="projects">
              {projectsNotice ?? (
                <Card>
                  <CardHeader>
                    <CardTitle>المشاريع</CardTitle>
                    <CardDescription>
                      المشاريع المرتبطة بهذا العميل.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {projects.length === 0 ? (
                      <DetailEmpty title="لا توجد مشاريع" />
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>المشروع</TableHead>
                              <TableHead>الحالة</TableHead>
                              <TableHead>التقدم</TableHead>
                              <TableHead>مدير المشروع</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {projects.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                  {item.name}
                                </TableCell>
                                <TableCell>
                                  <Status
                                    value={item.status}
                                    label={portalProjectStatusLabel(
                                      item.status,
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  {formatNumber(item.completionPercentage ?? 0)}
                                  %
                                </TableCell>
                                <TableCell>
                                  {item.manager?.name ?? "—"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="contracts">
              {contractsNotice ?? (
                <RecordTable
                  title="العقود"
                  empty="لا توجد عقود"
                  rows={contracts}
                  columns={[
                    ["العقد", (x) => x.title],
                    [
                      "الحالة",
                      (x) => (
                        <Status
                          value={x.status}
                          label={contractStatusLabel(x.status)}
                        />
                      ),
                    ],
                    ["القيمة", (x) => formatCurrency(x.totalValue)],
                    ["البداية", (x) => formatPortalDate(x.startDate)],
                  ]}
                />
              )}
            </TabsContent>
            <TabsContent value="invoices">
              {invoicesNotice ?? (
                <RecordTable
                  title="الفواتير"
                  empty="لا توجد فواتير"
                  rows={invoices}
                  columns={[
                    ["الفاتورة", (x) => x.invoiceNumber],
                    [
                      "الحالة",
                      (x) => (
                        <Status
                          value={x.status}
                          label={invoiceStatusLabel(x.status)}
                        />
                      ),
                    ],
                    ["القيمة", (x) => formatCurrency(x.amount)],
                    ["الاستحقاق", (x) => formatPortalDate(x.dueDate)],
                  ]}
                />
              )}
            </TabsContent>
            <TabsContent value="payments">
              {invoicesNotice ?? (
                <RecordTable
                  title="الدفعات"
                  empty="لا توجد دفعات"
                  rows={payments}
                  columns={[
                    ["الفاتورة", (x) => x.invoiceNumber],
                    ["المبلغ", (x) => formatCurrency(x.amount)],
                    ["الطريقة", (x) => paymentMethodLabel(x.method)],
                    ["الحالة", (x) => paymentStatusLabel(x.status)],
                    ["التاريخ", (x) => formatDateTime(x.createdAt)],
                  ]}
                />
              )}
            </TabsContent>
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="size-5" />
                    سجل النشاط
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {client.historyLogs?.length ? (
                    <div className="flex flex-col gap-4">
                      {client.historyLogs.map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-3 border-b pb-3 last:border-0"
                        >
                          <CalendarDays className="mt-1 size-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {clientActivityLabel(item.eventType)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDateTime(item.occurredAt)} ·{" "}
                              {item.user?.name ?? "فريق المبيعات"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <DetailEmpty title="لا يوجد نشاط مسجل" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </main>
  );
}

function RecordTable<T extends { id: string }>({
  title,
  empty,
  rows,
  columns,
}: {
  title: string;
  empty: string;
  rows: T[];
  columns: Array<[string, (row: T) => ReactNode]>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <DetailEmpty title={empty} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map(([label]) => (
                    <TableHead key={label}>{label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    {columns.map(([label, render]) => (
                      <TableCell key={label}>{render(row)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SalesClientDetailLoading() {
  return (
    <main dir="rtl" className="flex flex-col gap-6  ">
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <Skeleton className="h-80" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-96" />
        </div>
      </div>
    </main>
  );
}
