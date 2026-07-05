"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  FileText,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  Clock,
  History,
  Package,
} from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/design-system/Tabs";
import { ActionButton } from "@/components/design-system/ActionButton";
import { toast } from "sonner";
import { useGetAdminProposalQuery } from "@/features/admin/adminApi";
import { PROPOSAL_STATUS_AR } from "@hassad/shared";
import { EmptyState } from "@/components/design-system/EmptyState";
import { formatDate, formatCurrency } from "@/lib/format";

const TABS = [
  { value: "overview", label: "نظرة عامة" },
  { value: "services", label: "الخدمات" },
  { value: "history", label: "السجل" },
  { value: "share", label: "رابط العرض" },
];

export default function AdminProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  const { data: proposal, isLoading } = useGetAdminProposalQuery(proposalId);

  const handleCopyLink = () => {
    if (!proposal?.token) return;
    const url = `${window.location.origin}/proposal/${proposal.token}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("تم نسخ الرابط");
    }).catch(() => {
      toast.error("فشل النسخ");
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-100" />
            <div className="h-4 w-72 animate-pulse rounded-lg bg-neutral-100" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 animate-pulse rounded-xl bg-neutral-100" />
          </div>
        </div>
        <div className="h-96 w-full animate-pulse rounded-2xl bg-neutral-100" />
      </div>
    );
  }

  const services: any[] = proposal?.servicesList ?? [];

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title={proposal?.title ?? "العرض الفني"}
        description={proposal?.client?.companyName ?? proposal?.lead?.companyName ?? ""}
        icon={FileText}
        actions={
          <div className="flex gap-2 flex-wrap">
            <ActionButton variant="outline" size="md" onClick={() => router.push("/dashboard/admin/proposals")}>
              <ArrowRight className="size-4 ml-1" />
              العودة
            </ActionButton>
            {proposal?.status && (
              <StatusBadge status={proposal.status} label={PROPOSAL_STATUS_AR[proposal.status] ?? proposal.status} />
            )}
            {proposal?.status === "DRAFT" && (
              <ActionButton variant="primary" size="md">
                <Send className="size-4 ml-1" />
                إرسال
              </ActionButton>
            )}
            {proposal?.status === "SENT" && (
              <>
                <ActionButton variant="primary" size="md">
                  <CheckCircle className="size-4 ml-1" />
                  قبول
                </ActionButton>
                <ActionButton variant="outline" size="md">
                  <XCircle className="size-4 ml-1" />
                  رفض
                </ActionButton>
              </>
            )}
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full overflow-x-auto">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SurfaceCard title="معلومات العرض" icon={FileText}>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">العنوان</span>
                  <span className="text-sm font-medium">{proposal?.title ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">العميل</span>
                  <span className="text-sm font-medium">
                    {proposal?.client?.companyName ?? proposal?.lead?.companyName ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">المبلغ الإجمالي</span>
                  <span className="text-sm font-medium">{formatCurrency(proposal?.totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">المدة</span>
                  <span className="text-sm font-medium">{proposal?.duration ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">المنصات</span>
                  <span className="text-sm font-medium">
                    {Array.isArray(proposal?.platforms) ? proposal.platforms.join(", ") : proposal?.platforms ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">الحالة</span>
                  <StatusBadge status={proposal?.status} label={PROPOSAL_STATUS_AR[proposal?.status] ?? proposal?.status} />
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard title="التواريخ" icon={Clock}>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">تاريخ الإنشاء</span>
                  <span className="text-sm font-medium">{formatDate(proposal?.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">تاريخ الإرسال</span>
                  <span className="text-sm font-medium">{proposal?.sentAt ? formatDate(proposal.sentAt) : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">تاريخ الموافقة</span>
                  <span className="text-sm font-medium">{proposal?.approvedAt ? formatDate(proposal.approvedAt) : "—"}</span>
                </div>
              </div>
            </SurfaceCard>
          </div>
        </TabsContent>

        {/* Tab 2: Services */}
        <TabsContent value="services" className="mt-4">
          <SurfaceCard title="الخدمات" icon={Package} action={
            proposal?.totalPrice != null && (
              <span className="text-sm font-medium text-natural-100">
                الإجمالي: {formatCurrency(proposal.totalPrice)}
              </span>
            )
          }>
            {services.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-portal-divider">
                      <th className="px-4 py-3 text-right text-sm font-medium text-portal-note-text">الخدمة</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-portal-note-text">الكمية</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-portal-note-text">سعر الوحدة</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-portal-note-text">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((svc: any, idx: number) => (
                      <tr key={idx} className="border-b border-portal-divider last:border-0">
                        <td className="px-4 py-3 text-sm font-medium">{svc.name ?? "—"}</td>
                        <td className="px-4 py-3 text-sm">{svc.quantity ?? 0}</td>
                        <td className="px-4 py-3 text-sm">{formatCurrency(svc.unitPrice)}</td>
                        <td className="px-4 py-3 text-sm font-medium">{formatCurrency(svc.total ?? svc.quantity * svc.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={Package} title="لا توجد خدمات" hint="لم يتم إضافة خدمات لهذا العرض بعد" />
            )}
          </SurfaceCard>
        </TabsContent>

        {/* Tab 3: History */}
        <TabsContent value="history" className="mt-4">
          <SurfaceCard title="سجل الحالات" icon={History}>
            {proposal?.statusHistory?.length > 0 ? (
              <div className="space-y-0">
                {(proposal.statusHistory as any[]).map((entry: any, idx: number) => {
                  const isLast = idx === proposal.statusHistory.length - 1;
                  return (
                    <div key={entry.id ?? idx} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
                          <History className="h-4 w-4 text-portal-icon" />
                        </div>
                        {!isLast && <div className="w-px flex-1 bg-neutral-200 my-1" />}
                      </div>
                      <div className="pb-6">
                        <p className="text-sm font-medium text-natural-100">
                          {PROPOSAL_STATUS_AR[entry.toStatus ?? entry.status] ?? entry.toStatus ?? entry.status}
                        </p>
                        {entry.note && <p className="text-sm text-neutral-300 mt-0.5">{entry.note}</p>}
                        <div className="flex gap-3 mt-1">
                          {entry.changedBy && (
                            <p className="text-xs text-neutral-200">{entry.changedBy}</p>
                          )}
                          <p className="text-xs text-neutral-200">
                            {formatDate(entry.createdAt ?? entry.changedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={History} title="لا يوجد سجل" hint="لم يتم تسجيل أي تغييرات في حالة هذا العرض بعد" />
            )}
          </SurfaceCard>
        </TabsContent>

        {/* Tab 4: Share Link */}
        <TabsContent value="share" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SurfaceCard title="رابط المشاركة" icon={ExternalLink}>
              <div className="space-y-4">
                {proposal?.token ? (
                  <>
                    <div className="flex items-center justify-between rounded-lg border border-portal-divider bg-neutral-50 px-4 py-3">
                      <span className="text-sm text-portal-note-text truncate ml-2 dir-ltr" dir="ltr">
                        {`${typeof window !== "undefined" ? window.location.origin : ""}/proposal/${proposal.token}`}
                      </span>
                      <ActionButton variant="ghost" size="sm" onClick={handleCopyLink}>
                        <Copy className="size-4" />
                      </ActionButton>
                    </div>
                    <div className="flex gap-2">
                      <ActionButton variant="primary" size="sm" onClick={handleCopyLink}>
                        <Copy className="size-4 ml-1" />
                        نسخ الرابط
                      </ActionButton>
                      <ActionButton variant="outline" size="sm" onClick={() => window.open(`/proposal/${proposal.token}`, "_blank")}>
                        <ExternalLink className="size-4 ml-1" />
                        فتح الرابط
                      </ActionButton>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-portal-note-text py-4">لا يوجد رابط مشاركة متاح</p>
                )}
              </div>
            </SurfaceCard>

            <SurfaceCard title="معلومات الرمز" icon={Eye}>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">الرمز</span>
                  <span className="text-sm font-medium" dir="ltr">{proposal?.token ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-portal-note-text">تاريخ الإنشاء</span>
                  <span className="text-sm font-medium">{formatDate(proposal?.createdAt)}</span>
                </div>
              </div>
            </SurfaceCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
