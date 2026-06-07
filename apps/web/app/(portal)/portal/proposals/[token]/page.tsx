"use client";

import { useState, use } from "react";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  XCircle,
  MessageSquare,
} from "lucide-react";
import {
  useGetProposalByTokenQuery,
  useApproveProposalByTokenMutation,
  useRequestRevisionByTokenMutation,
} from "@/features/proposals/proposalsApi";
import { ProposalStatus } from "@hassad/shared";
import { ActionButton } from "@/components/design-system/ActionButton";
import { UserAvatar } from "@/components/design-system/UserAvatar";
import { FormTextarea } from "@/components/design-system/FormTextarea";
import { Skeleton } from "@/components/design-system/Skeleton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { InfoPanel } from "@/components/design-system/InfoPanel";
import { StatusBanner } from "@/components/design-system/StatusBanner";
import { toast } from "sonner";

import { buildPortalFileUrl } from "@/lib/portal-files";
import { mapProposalStatusToUI } from "@/lib/utils/statusMapping";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function PortalProposalDetailPage({ params }: PageProps) {
  const { token } = use(params);
  const { data, isLoading, isError } = useGetProposalByTokenQuery(token, { pollingInterval: 30_000 });
  const [approveProposal, { isLoading: approving }] =
    useApproveProposalByTokenMutation();
  const [requestRevision, { isLoading: requesting }] =
    useRequestRevisionByTokenMutation();
  const [notes, setNotes] = useState("");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4" dir="rtl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-4" dir="rtl">
        <Link href="/portal/proposals">
          <ActionButton variant="ghost" size="sm" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            العروض الفنية
          </ActionButton>
        </Link>
        <SurfaceCard title="تعذر تحميل العرض" icon={AlertCircle}>
          <p className="text-center text-sm text-portal-note-text">
            العرض غير متوفر أو انتهت صلاحية الرابط.
          </p>
        </SurfaceCard>
      </div>
    );
  }

  const canRespond = data.status === ProposalStatus.SENT;
  const fileUrl = data.filePath
    ? buildPortalFileUrl(data.filePath as string)
    : null;
  const companyLabel = data.request?.companyName ?? data.lead?.companyName;
  const contactLabel = data.request?.contactName ?? data.lead?.contactName;

  async function handleApprove() {
    try {
      await approveProposal({ token, body: { notes } }).unwrap();
      toast.success("تم اعتماد العرض الفني — شكراً لك");
    } catch {
      toast.error("تعذّر اعتماد العرض. حاول مجدداً.");
    }
  }

  async function handleRevision() {
    if (!notes.trim()) {
      toast.error("يرجى كتابة ملاحظاتك قبل طلب التعديل");
      return;
    }
    try {
      await requestRevision({ token, body: { notes } }).unwrap();
      toast.success("تم إرسال طلب التعديل");
    } catch {
      toast.error("تعذّر إرسال طلب التعديل. حاول مجدداً.");
    }
  }

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/portal/proposals">
          <ActionButton
            variant="ghost"
            size="sm"
            className="gap-1.5 text-portal-note-text hover:text-natural-100"
          >
            <ArrowRight className="h-4 w-4" />
            العروض الفنية
          </ActionButton>
        </Link>
        <span className="text-portal-note-text">/</span>
        <span className="max-w-xs truncate text-sm font-medium text-natural-100">
          {data.title}
        </span>
      </div>

      <SurfaceCard
        title={data.title}
        icon={FileText}
        action={<StatusBadge status={mapProposalStatusToUI(data.status)} />}
      >
        <div className="space-y-5">
          {companyLabel && (
            <p className="text-sm text-portal-note-text">
              {companyLabel}
              {contactLabel ? ` — ${contactLabel}` : ""}
            </p>
          )}

          {/* Services + Contact row */}
          <div className="flex flex-col md:flex-row md:gap-4 gap-5">
            {/* Services List (80%) */}
            {Array.isArray(data.servicesList) &&
              (data.servicesList as { name: string; price: number }[]).length >
                0 && (
                <div className="md:w-[80%]">
                  <InfoPanel variant="bordered" title="الخدمات المطلوبة">
                    <div className="space-y-2">
                      {(data.servicesList as { name: string; price: number }[]).map(
                        (service, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-natural-100">{service.name}</span>
                            <span className="font-medium text-portal-note-text">
                              {service.price.toLocaleString("ar-SA-u-nu-latn")} ر.س
                            </span>
                          </div>
                        ),
                      )}
                      <div className="flex items-center justify-between border-t border-portal-divider pt-2 text-sm font-bold text-natural-100">
                        <span>الإجمالي الكلي</span>
                        <span>
                          {data.totalPrice.toLocaleString("ar-SA-u-nu-latn")} ر.س
                        </span>
                      </div>
                    </div>
                  </InfoPanel>
                </div>
              )}

            {/* Sales Contact (30%) */}
            {(data.creator?.name || data.contactName) && (
              <div className="md:w-[20%]">
                <InfoPanel variant="default" className="h-full">
                  <div className="flex md:flex-col items-center md:items-center gap-3 md:gap-4 md:justify-center md:text-center h-full">
                    <UserAvatar
                      name={data.creator?.name || data.contactName || "??"}
                      className="h-12 w-12 shrink-0 bg-primary/10"
                    />
                    <div className="flex-1 min-w-0 md:flex-1">
                      <p className="text-sm font-semibold text-natural-100 truncate">
                        {data.creator?.name || data.contactName}
                      </p>
                      <p className="text-xs text-portal-note-text">مستشارك الفني</p>
                    </div>
                    <Link href="/portal/chat?openSales=true">
                      <ActionButton variant="outline" size="sm" className="gap-2 shrink-0">
                        <MessageSquare className="w-4 w-4" />
                        تواصل معه
                      </ActionButton>
                    </Link>
                  </div>
                </InfoPanel>
              </div>
            )}
          </div>

          {/* PDF Download */}
          {fileUrl ? (
            <InfoPanel variant="default" title="ملف العرض الفني" description="راجع تفاصيل العرض قبل الرد">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 shrink-0 text-action-blue" />
                <div className="min-w-0 flex-1"></div>
                <ActionButton href={fileUrl} variant="outline" icon={<Download className="h-4 w-4" />}>
                  تحميل العرض
                </ActionButton>
              </div>
            </InfoPanel>
          ) : (
            <InfoPanel variant="default" description="لا يوجد ملف مرفق لهذا العرض.">
            </InfoPanel>
          )}

          {/* Status-specific banners */}
          {data.status === ProposalStatus.APPROVED && (
            <StatusBanner variant="success" title="لقد اعتمدت هذا العرض الفني.">
            </StatusBanner>
          )}

          {data.status === ProposalStatus.REVISION_REQUESTED && (
            <StatusBanner variant="warning" title="طلبت تعديلاً على هذا العرض. سيتواصل معك فريقنا قريباً.">
            </StatusBanner>
          )}

          {data.status === ProposalStatus.REJECTED && (
            <StatusBanner variant="danger" title="تم رفض هذا العرض.">
            </StatusBanner>
          )}

          {/* Response area */}
          {canRespond && (
            <div className="space-y-4 rounded-2xl border border-portal-card-border p-4">
              <p className="text-sm font-semibold text-natural-100">
                ردّك على العرض
              </p>
                <FormTextarea
                  label="ملاحظاتك (اختيارية عند الموافقة — مطلوبة عند طلب التعديل)"
                  rows={3}
                  placeholder="اكتب ملاحظاتك هنا..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  onClick={handleApprove}
                  disabled={approving || requesting}
                  className="h-12 rounded-2xl px-5 text-base font-medium gap-2 bg-secondary-500 hover:bg-secondary-600"
                >
                  <CheckCircle className="h-4 w-4" />
                  {approving ? "جارٍ الاعتماد..." : "موافقة على العرض"}
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  onClick={handleRevision}
                  disabled={approving || requesting}
                  className="h-12 rounded-2xl px-5 text-base font-medium gap-2 border-[1.5px] border-portal-card-border bg-natural-0 text-portal-icon hover:bg-badge-gray-bg"
                >
                  <AlertCircle className="h-4 w-4" />
                  {requesting ? "جارٍ الإرسال..." : "طلب تعديل"}
                </ActionButton>
              </div>
            </div>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}
