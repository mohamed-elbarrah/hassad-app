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
} from "lucide-react";
import {
  useGetProposalByTokenQuery,
  useApproveProposalByTokenMutation,
  useRequestRevisionByTokenMutation,
} from "@/features/proposals/proposalsApi";
import { ProposalStatus } from "@hassad/shared";
import { Button } from "@/components/ui/button";
import { FormTextarea } from "@/components/portal/FormTextarea";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalSurfaceCard } from "@/components/portal/PortalSurfaceCard";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { PortalInfoPanel } from "@/components/portal/PortalInfoPanel";
import { PortalStatusBanner } from "@/components/portal/PortalStatusBanner";
import { PortalActionButton } from "@/components/portal/PortalActionButton";
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
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            العروض الفنية
          </Button>
        </Link>
        <PortalSurfaceCard title="تعذر تحميل العرض" icon={AlertCircle}>
          <p className="text-center text-sm text-portal-note-text">
            العرض غير متوفر أو انتهت صلاحية الرابط.
          </p>
        </PortalSurfaceCard>
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
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-portal-note-text hover:text-natural-100"
          >
            <ArrowRight className="h-4 w-4" />
            العروض الفنية
          </Button>
        </Link>
        <span className="text-portal-note-text">/</span>
        <span className="max-w-xs truncate text-sm font-medium text-natural-100">
          {data.title}
        </span>
      </div>

      <PortalSurfaceCard
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

          {/* Services List */}
          {Array.isArray(data.servicesList) &&
            (data.servicesList as { name: string; price: number }[]).length >
              0 && (
              <PortalInfoPanel variant="bordered" title="الخدمات المطلوبة">
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
              </PortalInfoPanel>
            )}

          {/* Sales Contact */}
          {(data.contactName || data.contactEmail) && (
            <PortalInfoPanel variant="default" title="خدمة العملاء">
              <div className="space-y-1">
                {data.contactName && (
                  <p className="flex items-center gap-2 text-sm text-portal-note-text">
                    <span className="font-medium text-natural-100">
                      مسؤول التواصل:
                    </span>
                    {data.contactName}
                  </p>
                )}
                {data.contactEmail && (
                  <p className="flex items-center gap-2 text-sm text-portal-note-text">
                    <span className="font-medium text-natural-100">
                      البريد الإلكتروني:
                    </span>
                    <a
                      href={`mailto:${data.contactEmail}`}
                      className="text-action-blue hover:underline"
                    >
                      {data.contactEmail}
                    </a>
                  </p>
                )}
              </div>
            </PortalInfoPanel>
          )}

          {/* PDF Download */}
          {fileUrl ? (
            <PortalInfoPanel variant="default" title="ملف العرض الفني" description="راجع تفاصيل العرض قبل الرد">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 shrink-0 text-action-blue" />
                <div className="min-w-0 flex-1"></div>
                <PortalActionButton href={fileUrl} variant="outline" icon={<Download className="h-4 w-4" />}>
                  تحميل العرض
                </PortalActionButton>
              </div>
            </PortalInfoPanel>
          ) : (
            <PortalInfoPanel variant="default" description="لا يوجد ملف مرفق لهذا العرض.">
            </PortalInfoPanel>
          )}

          {/* Status-specific banners */}
          {data.status === ProposalStatus.APPROVED && (
            <PortalStatusBanner variant="success" title="لقد اعتمدت هذا العرض الفني.">
            </PortalStatusBanner>
          )}

          {data.status === ProposalStatus.REVISION_REQUESTED && (
            <PortalStatusBanner variant="warning" title="طلبت تعديلاً على هذا العرض. سيتواصل معك فريقنا قريباً.">
            </PortalStatusBanner>
          )}

          {data.status === ProposalStatus.REJECTED && (
            <PortalStatusBanner variant="danger" title="تم رفض هذا العرض.">
            </PortalStatusBanner>
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
                <Button
                  onClick={handleApprove}
                  disabled={approving || requesting}
                  className="h-12 rounded-2xl px-5 text-base font-medium gap-2 bg-secondary-500 hover:bg-secondary-600"
                >
                  <CheckCircle className="h-4 w-4" />
                  {approving ? "جارٍ الاعتماد..." : "موافقة على العرض"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleRevision}
                  disabled={approving || requesting}
                  className="h-12 rounded-2xl px-5 text-base font-medium gap-2 border-[1.5px] border-portal-card-border bg-natural-0 text-portal-icon hover:bg-badge-gray-bg"
                >
                  <AlertCircle className="h-4 w-4" />
                  {requesting ? "جارٍ الإرسال..." : "طلب تعديل"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </PortalSurfaceCard>
    </div>
  );
}
