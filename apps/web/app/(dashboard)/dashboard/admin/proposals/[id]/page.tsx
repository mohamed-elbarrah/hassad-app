"use client";

import { useParams, useRouter } from "next/navigation";
import { FileText, ArrowRight, Send, CheckCircle, XCircle } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Skeleton } from "@/components/design-system/Skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/Tabs";
import { DataTable } from "@/components/design-system/DataTable";
import { useGetAdminProposalQuery } from "@/features/admin/adminApi";
import {
  PROPOSAL_STATUS_AR,
  ProposalStatus,
  Proposal,
} from "@hassad/shared";

export default function AdminProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: proposal, isLoading } = useGetAdminProposalQuery(id);

  if (isLoading)
    return (
      <div className="flex flex-col gap-6 p-6" dir="rtl">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  if (!proposal)
    return (
      <div className="p-6 text-center text-portal-note-text" dir="rtl">
        العرض غير موجود
      </div>
    );

  const canSend =
    proposal.status === ProposalStatus.DRAFT;
  const canApprove =
    proposal.status === ProposalStatus.SENT ||
    proposal.status === ProposalStatus.REVISION_REQUESTED;
  const canReject =
    proposal.status === ProposalStatus.SENT ||
    proposal.status === ProposalStatus.REVISION_REQUESTED;

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title={proposal.title}
        description={`${proposal.client?.companyName ?? proposal.lead?.companyName ?? "—"} · ${PROPOSAL_STATUS_AR[proposal.status] ?? proposal.status}`}
        icon={FileText}
        actions={
          <div className="flex items-center gap-2">
            {canSend && (
              <ActionButton variant="primary" size="sm" icon={<Send className="size-4" />}>
                إرسال
              </ActionButton>
            )}
            {canApprove && (
              <ActionButton variant="primary" size="sm" icon={<CheckCircle className="size-4" />}>
                قبول
              </ActionButton>
            )}
            {canReject && (
              <ActionButton variant="outline" size="sm" icon={<XCircle className="size-4" />}>
                رفض
              </ActionButton>
            )}
            <ActionButton variant="outline" size="md" onClick={() => router.back()}>
              <ArrowRight className="size-4 ml-1" />
              العودة
            </ActionButton>
          </div>
        }
      />

      <SurfaceCard>
        <Tabs defaultValue="overview" dir="rtl">
          <TabsList className="w-full justify-start gap-1 px-4 pt-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="services">الخدمات</TabsTrigger>
          </TabsList>
          <div className="p-6">
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-portal-note-text">العميل</span>
                    <p className="text-base font-medium">
                      {proposal.client?.companyName ?? proposal.lead?.companyName ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">جهة الاتصال</span>
                    <p className="text-base font-medium">
                      {proposal.contactName ?? proposal.lead?.contactName ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">البريد الإلكتروني</span>
                    <p className="text-base font-medium">{proposal.contactEmail ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">الحالة</span>
                    <div className="mt-1">
                      <StatusBadge
                        status={proposal.status}
                        label={PROPOSAL_STATUS_AR[proposal.status] ?? proposal.status}
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">المنشئ</span>
                    <p className="text-base font-medium">
                      {proposal.creator?.name ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-portal-note-text">المبلغ الإجمالي</span>
                    <p className="text-base font-medium">
                      {proposal.totalPrice?.toLocaleString()} ر.س
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">المدة</span>
                    <p className="text-base font-medium">
                      {proposal.durationDays} {proposal.durationUnit === "MONTHS" ? "شهر" : "يوم"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">تاريخ البدء</span>
                    <p className="text-base font-medium">
                      {proposal.startDate?.slice(0, 10) ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">صلاحية العرض</span>
                    <p className="text-base font-medium">
                      {proposal.offerValidityDays ? `${proposal.offerValidityDays} يوم` : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">تاريخ الإرسال</span>
                    <p className="text-base font-medium">
                      {proposal.sentAt?.slice(0, 10) ?? "لم يُرسل بعد"}
                    </p>
                  </div>
                </div>
              </div>

              {proposal.shareLinkToken && (
                <div className="mt-6 pt-6 border-t border-portal-divider">
                  <span className="text-sm text-portal-note-text">رابط المشاركة</span>
                  <p className="text-sm font-medium text-action-blue mt-1 break-all">
                    {`${window.location.origin}/proposal/${proposal.shareLinkToken}`}
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="services">
              <DataTable
                columns={[
                  { id: "name", label: "الخدمة" },
                  { id: "description", label: "الوصف" },
                  { id: "price", label: "السعر" },
                ]}
                data={proposal.servicesList ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: FileText,
                  message: "لا توجد خدمات",
                  hint: "لم يتم إضافة خدمات لهذا العرض",
                }}
                renderRow={(s: any, i: number) => (
                  <tr key={i} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm font-medium">{s.name ?? s.serviceName}</td>
                    <td className="px-5 py-3 text-sm text-portal-note-text">{s.description ?? "—"}</td>
                    <td className="px-5 py-3 text-sm">
                      {s.price != null ? `${s.price.toLocaleString()} ر.س` : "—"}
                    </td>
                  </tr>
                )}
              />
            </TabsContent>
          </div>
        </Tabs>
      </SurfaceCard>
    </div>
  );
}
