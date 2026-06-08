"use client";

import { useState, use } from "react";
import {
  useApproveProposalByTokenMutation,
  useGetProposalByTokenQuery,
  useRequestRevisionByTokenMutation,
} from "@/features/proposals/proposalsApi";
import { ProposalStatus } from "@hassad/shared";
import { ActionButton } from "@/components/design-system/ActionButton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { FormTextareaControl } from "@/components/design-system/FormTextareaControl";
import { toast } from "sonner";
import {
  FileText,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { UserAvatar } from "@/components/design-system/UserAvatar";

import { buildPortalFileUrl } from "@/lib/portal-files";

interface PageProps {
  params: Promise<{ token: string }>;
}

const STATUS_LABELS: Record<ProposalStatus, string> = {
  [ProposalStatus.DRAFT]: "مسودة",
  [ProposalStatus.SENT]: "بانتظار ردّك",
  [ProposalStatus.APPROVED]: "معتمد",
  [ProposalStatus.REVISION_REQUESTED]: "بحاجة تعديل",
  [ProposalStatus.REJECTED]: "مرفوض",
};

const STATUS_COLORS: Record<ProposalStatus, string> = {
  [ProposalStatus.DRAFT]: "bg-neutral-100 text-neutral-700",
  [ProposalStatus.SENT]: "bg-action-blue-soft text-action-blue",
  [ProposalStatus.APPROVED]: "bg-success-100 text-success-700",
  [ProposalStatus.REVISION_REQUESTED]: "bg-alert-100 text-alert-700",
  [ProposalStatus.REJECTED]: "bg-danger-100 text-danger-700",
};

export default function ProposalSharePage({ params }: PageProps) {
  const { token } = use(params);
  const { data, isLoading, isError } = useGetProposalByTokenQuery(token);
  const [approveProposal, { isLoading: approving }] =
    useApproveProposalByTokenMutation();
  const [requestRevision, { isLoading: requesting }] =
    useRequestRevisionByTokenMutation();
  const [notes, setNotes] = useState("");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-neutral-300">جارٍ تحميل العرض...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-danger-500">
          العرض غير متوفر أو انتهت صلاحية الرابط.
        </p>
      </div>
    );
  }

  const canRespond = data.status === ProposalStatus.SENT;
  const statusLabel =
    STATUS_LABELS[data.status as ProposalStatus] ?? data.status;
  const statusColor =
    STATUS_COLORS[data.status as ProposalStatus] ??
    "bg-neutral-50 text-neutral-300";

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
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl" dir="rtl">
        <SurfaceCard className="w-full max-w-2xl">
          <div className="pb-4 px-5 pt-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-semibold">{data.title}</h2>
                {companyLabel && (
                  <p className="text-sm text-neutral-300 mt-1">
                    {companyLabel}
                    {contactLabel ? ` — ${contactLabel}` : ""}
                  </p>
                )}
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${statusColor}`}
              >
                {statusLabel}
              </span>
            </div>
          </div>

          <div className="space-y-5 px-5 pb-5">
            {/* ── Services + Contact row ──────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:gap-4 gap-5">
              {/* ── Services List (70%) ──────────────────────────────────────── */}
              {Array.isArray(data.servicesList) &&
                (data.servicesList as { name: string; price: number }[])
                  .length > 0 && (
                  <div className="rounded-xl border p-4 space-y-3 md:w-[70%]">
                    <p className="text-sm font-semibold">الخدمات المطلوبة</p>
                    {(
                      data.servicesList as { name: string; price: number }[]
                    ).map((service, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-natural-100">{service.name}</span>
                        <span className="text-neutral-300 font-medium">
                          {service.price.toLocaleString("en-US")} رس
                        </span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex items-center justify-between text-sm font-bold">
                      <span>الإجمالي الكلي</span>
                      <span>{data.totalPrice.toLocaleString("en-US")} رس</span>
                    </div>
                  </div>
                )}

              {/* ── Sales Contact (30%) ─────────────────────────────────────── */}
              {(data.creator?.name || data.contactName) && (
                <div className="rounded-xl border bg-neutral-50 p-4 md:w-[30%]">
                  <div className="flex md:flex-col items-center md:items-center gap-3 md:gap-4 md:justify-center md:text-center h-full">
                    <UserAvatar
                      name={data.creator?.name || data.contactName || "??"}
                      size="md"
                      variant="circle"
                    />
                    <div className="flex-1 min-w-0 md:flex-1">
                      <p className="text-sm font-semibold text-natural-100 truncate">
                        {data.creator?.name || data.contactName}
                      </p>
                      <p className="text-xs text-neutral-300">مستشارك الفني</p>
                    </div>
                    <a href="/portal/chat?openSales=true">
                      <ActionButton
                        variant="outline"
                        size="sm"
                        className="gap-2 shrink-0"
                      >
                        <MessageSquare className="w-4 h-4" />
                        تواصل معه
                      </ActionButton>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* ── PDF Download ────────────────────────────────────────────── */}
            {fileUrl ? (
              <div className="flex items-center gap-3 rounded-xl border bg-neutral-50 p-4">
                <FileText className="w-8 h-8 text-action-blue shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">ملف العرض الفني</p>
                  <p className="text-xs text-neutral-300">
                    يمكنك تحميل الملف لمراجعة تفاصيل العرض
                  </p>
                </div>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  <ActionButton
                    variant="outline"
                    size="sm"
                    className="gap-2 shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    تحميل العرض
                  </ActionButton>
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border bg-neutral-50 p-4">
                <AlertCircle className="w-5 h-5 text-neutral-300" />
                <p className="text-sm text-neutral-300">
                  لا يوجد ملف مرفق لهذا العرض.
                </p>
              </div>
            )}

            {/* ── Status-specific feedback ─────────────────────────────── */}
            {data.status === ProposalStatus.APPROVED && (
              <div className="flex items-center gap-2 rounded-xl bg-success-100 border border-success-200 px-4 py-3">
                <CheckCircle className="w-5 h-5 text-success-600 shrink-0" />
                <p className="text-sm text-success-700 font-medium">
                  لقد اعتمدت هذا العرض الفني.
                </p>
              </div>
            )}

            {data.status === ProposalStatus.REVISION_REQUESTED && (
              <div className="flex items-center gap-2 rounded-xl bg-alert-100 border border-alert-200 px-4 py-3">
                <AlertCircle className="w-5 h-5 text-alert-600 shrink-0" />
                <p className="text-sm text-alert-700 font-medium">
                  طلبت تعديلاً على هذا العرض.
                </p>
              </div>
            )}

            {data.status === ProposalStatus.REJECTED && (
              <div className="flex items-center gap-2 rounded-xl bg-danger-100 border border-danger-200 px-4 py-3">
                <XCircle className="w-5 h-5 text-danger-600 shrink-0" />
                <p className="text-sm text-danger-700 font-medium">
                  تم رفض هذا العرض.
                </p>
              </div>
            )}

            {/* ── Response area (only when SENT) ──────────────────────── */}
            {canRespond && (
              <>
                <div>
                  <p className="text-sm font-medium mb-2">
                    ملاحظاتك (اختياري عند الموافقة — مطلوبة عند طلب التعديل)
                  </p>
                  <FormTextareaControl
                    rows={3}
                    placeholder="اكتب ملاحظاتك هنا..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <ActionButton
                    onClick={handleApprove}
                    disabled={approving || requesting}
                    className="gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {approving ? "جارٍ الاعتماد..." : "موافقة على العرض"}
                  </ActionButton>
                  <ActionButton
                    variant="outline"
                    onClick={handleRevision}
                    disabled={approving || requesting}
                    className="gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {requesting ? "جارٍ الإرسال..." : "طلب تعديل"}
                  </ActionButton>
                </div>
              </>
            )}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
