"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  Paperclip,
  X,
  Copy,
  CheckCheck,
  Plus,
} from "lucide-react";
import { DurationUnit, type RequestStatus } from "@hassad/shared";
import { Dialog } from "@/components/design-system/Dialog";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import {
  FormSelect,
  FormSelectContent,
  FormSelectItem,
  FormSelectTrigger,
  FormSelectValue,
} from "@/components/design-system/FormSelectControl";
import {
  useCreateProposalMutation,
  useUpdateProposalMutation,
  type ProposalListItem,
  type ServiceItem,
} from "@/features/proposals/proposalsApi";
import { useGetRequestsQuery } from "@/features/requests/requestsApi";
import { useGetProfileQuery } from "@/features/auth/authApi";
import { SearchCombobox } from "@/components/common/SearchCombobox";

const REQUEST_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "طلب جديد",
  QUALIFYING: "مراجعة المبيعات",
  PROPOSAL_IN_PROGRESS: "إعداد العرض",
  PROPOSAL_SENT: "تم إرسال العرض",
  NEGOTIATION: "تفاوض",
  CONTRACT_PREPARATION: "إعداد العقد",
  CONTRACT_SENT: "العقد مرسل",
  SIGNED: "تم التوقيع",
  PROJECT_CREATED: "تحول إلى مشروع",
  CANCELLED: "ملغي",
};

const PROPOSAL_READY_STATUSES = new Set<string>([
  "QUALIFYING",
  "PROPOSAL_IN_PROGRESS",
  "PROPOSAL_SENT",
  "NEGOTIATION",
]);

function formatNumber(num: number): string {
  if (num === 0) return "0";
  if (!num) return "";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProposalFormDialogProps {
  mode?: "create" | "edit";
  proposal?: ProposalListItem | null;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// ── Main Component ──────────────────────────────────────────────────────────

export function ProposalFormDialog({
  mode = "create",
  proposal,
  trigger,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: ProposalFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled =
    externalOpen !== undefined && externalOnOpenChange !== undefined;
  const open = isControlled ? externalOpen! : internalOpen;
  const setOpen = isControlled ? externalOnOpenChange! : setInternalOpen;

  const isEdit = mode === "edit";

  // ── State ──────────────────────────────────────────────────────────────
  const [requestSearch, setRequestSearch] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [sentLink, setSentLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [services, setServices] = useState<{ name: string; price: string }[]>([
    { name: "", price: "" },
  ]);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [durationDays, setDurationDays] = useState("0");
  const [durationUnit, setDurationUnit] = useState<string>("DAYS");
  const [offerValidityDays, setOfferValidityDays] = useState("30");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── API hooks ───────────────────────────────────────────────────────────
  const [createProposal] = useCreateProposalMutation();
  const [updateProposal] = useUpdateProposalMutation();
  const { data: requestsData, isFetching: requestsFetching } =
    useGetRequestsQuery({ limit: 100 }, { skip: !open });
  const { data: currentUser } = useGetProfileQuery(undefined, { skip: !open });

  const contactName = proposal?.contactName || currentUser?.name || "";
  const contactEmail = proposal?.contactEmail || currentUser?.email || "";

  // ── Populate form when proposal data loads (edit mode) ─────────────────
  useEffect(() => {
    if (!open) return;

    if (proposal && isEdit) {
      setSelectedRequestId(proposal.requestId ?? "");
      setTitle(proposal.title ?? "");
      setStartDate(
        proposal.startDate
          ? typeof proposal.startDate === "string"
            ? proposal.startDate.split("T")[0]
            : ""
          : "",
      );
      setDurationDays(String(proposal.durationDays ?? 0));
      setDurationUnit(proposal.durationUnit ?? "DAYS");
      setOfferValidityDays(String(proposal.offerValidityDays ?? 30));

      const existingServices = Array.isArray(proposal.servicesList)
        ? (proposal.servicesList as { name: string; price: number }[]).map(
            (s) => ({
              name: s.name ?? "",
              price: s.price ? formatNumber(s.price) : "",
            }),
          )
        : [];
      setServices(
        existingServices.length > 0
          ? existingServices
          : [{ name: "", price: "" }],
      );
      setPdfFile(null);
      setSentLink(null);
      setCopied(false);
      setFieldErrors({});
    } else {
      setSelectedRequestId("");
      setTitle("");
      setStartDate("");
      setDurationDays("0");
      setDurationUnit("DAYS");
      setOfferValidityDays("30");
      setServices([{ name: "", price: "" }]);
      setPdfFile(null);
      setSentLink(null);
      setCopied(false);
      setFieldErrors({});
    }
  }, [open, proposal, isEdit, currentUser]);

  // ── Derived ────────────────────────────────────────────────────────────
  const proposalRequests = (requestsData ?? []).filter((r: any) =>
    PROPOSAL_READY_STATUSES.has(r.status),
  );

  const filteredRequests = proposalRequests.filter(
    (r: any) =>
      !requestSearch ||
      r.companyName.toLowerCase().includes(requestSearch.toLowerCase()) ||
      r.contactName.toLowerCase().includes(requestSearch.toLowerCase()),
  );

  const requestOptions = filteredRequests.map((r: any) => ({
    id: r.id,
    label: `${r.companyName} — ${r.contactName} (${REQUEST_STATUS_LABELS[r.status] ?? r.status})`,
  }));

  const totalAmount = services.reduce((sum, s) => {
    const price = parseInt(s.price.replace(/,/g, "")) || 0;
    return sum + price;
  }, 0);

  // ── Services management ────────────────────────────────────────────────
  const addService = useCallback(() => {
    setServices((prev) => [...prev, { name: "", price: "" }]);
  }, []);

  const updateServiceName = useCallback(
    (index: number, value: string) => {
      setServices((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], name: value };
        return next;
      });
    },
    [],
  );

  const updateServicePrice = useCallback(
    (index: number, rawValue: string) => {
      const digits = rawValue.replace(/[^\d]/g, "");
      const formatted = digits ? formatNumber(parseInt(digits)) : "";
      setServices((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], price: formatted };
        return next;
      });
    },
    [],
  );

  const removeService = useCallback((index: number) => {
    if (services.length <= 1) return;
    setRemovingIndex(index);
    setTimeout(() => {
      setServices((prev) => prev.filter((_, i) => i !== index));
      setRemovingIndex(null);
    }, 250);
  }, [services.length]);

  // ── Validate & Submit ──────────────────────────────────────────────────
  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!selectedRequestId && !isEdit) {
      errors.requestId = "اختر الطلب";
    }
    if (!title.trim() || title.trim().length < 2) {
      errors.title = "أدخل عنوان العرض";
    }
    if (!pdfFile && !isEdit) {
      errors.file = "يرجى رفع ملف PDF للعرض الفني";
    }
    if (pdfFile && pdfFile.type !== "application/pdf" && !pdfFile.name.endsWith(".pdf")) {
      errors.file = "يجب أن يكون الملف بصيغة PDF";
    }
    if (services.every((s) => !s.name.trim())) {
      errors.servicesList = "أضف خدمة واحدة على الأقل";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const serviceItems: ServiceItem[] = services
        .filter((s) => s.name.trim())
        .map((s) => ({
          name: s.name,
          price: parseInt(s.price.replace(/,/g, "")) || 0,
        }));

      if (isEdit && proposal) {
        await updateProposal({
          id: proposal.id,
          body: {
            title,
            servicesList: serviceItems,
            totalPrice: totalAmount,
            durationDays: parseInt(durationDays) || 0,
            durationUnit: durationUnit as DurationUnit,
            contactName,
            contactEmail,
            startDate: startDate || undefined,
            offerValidityDays: parseInt(offerValidityDays) || 30,
          },
        }).unwrap();
        toast.success("تم تحديث العرض الفني بنجاح");
        setOpen(false);
      } else {
        if (!pdfFile) {
          setFieldErrors((prev) => ({ ...prev, file: "يرجى رفع ملف PDF" }));
          setIsSubmitting(false);
          return;
        }

        const result = await createProposal({
          requestId: selectedRequestId,
          title,
          file: pdfFile,
          servicesList: serviceItems,
          totalPrice: totalAmount,
          durationDays: parseInt(durationDays) || 0,
          durationUnit: durationUnit as DurationUnit,
          contactName,
          contactEmail,
          startDate,
          offerValidityDays: parseInt(offerValidityDays) || 30,
        }).unwrap();

        if (result.shareLinkToken) {
          const link = `${window.location.origin}/proposal/${result.shareLinkToken}`;
          setSentLink(link);
        }
        toast.success("تم إنشاء العرض الفني وإرساله بنجاح");
      }
    } catch (err: unknown) {
      const msg =
        (err as any)?.data?.message ??
        (isEdit ? "فشل تحديث العرض الفني" : "فشل إنشاء العرض الفني");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  function copyLink() {
    if (!sentLink) return;
    navigator.clipboard.writeText(sentLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSentLink(null);
      setCopied(false);
      setServices([{ name: "", price: "" }]);
      setRemovingIndex(null);
      setPdfFile(null);
      setFieldErrors({});
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <>
      {!isControlled && (
        <ActionButton variant="primary" onClick={() => setInternalOpen(true)}>
          {isEdit ? "تعديل العرض" : "إنشاء عرض جديد"}
        </ActionButton>
      )}

      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
        title={isEdit ? "تعديل العرض" : "إنشاء عرض جديد"}
        contentClassName="sm:max-w-[520px] p-0 gap-0 rounded-[24px] overflow-hidden"
        className="space-y-6 max-h-[90vh] overflow-y-auto modal-scroll p-6"
      >
            {/* ── Success state (create only) ─────────────────────── */}
            {sentLink && !isEdit ? (
              <div className="space-y-5 py-2">
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="h-14 w-14 rounded-full bg-success-100 flex items-center justify-center">
                    <CheckCheck className="h-7 w-7 text-success-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-base">
                      تم إنشاء العرض وإرساله
                    </p>
                    <p className="text-sm text-neutral-300 mt-1">
                      شارك الرابط مع العميل لمراجعة العرض والرد عليه
                    </p>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="relative w-full">
                    <FormInputControl
                      readOnly
                      value={sentLink}
                      dir="ltr"
                      className="w-full h-12 px-4 pr-36 text-xs font-mono truncate bg-neutral-50"
                    />
                    <div className="absolute inset-y-0 right-2 flex items-center">
                      <ActionButton
                        size="sm"
                        variant={copied ? "secondary" : "primary"}
                        onClick={copyLink}
                        className="px-4 py-2 text-[13px] rounded-lg"
                      >
                        {copied ? "تم النسخ ✓" : "نسخ الرابط"}
                      </ActionButton>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenChange(false)}
                  className="w-full h-12 border border-neutral-200 rounded-xl text-[13px] font-medium text-secondary-500 hover:bg-neutral-50 transition-colors"
                >
                  إغلاق
                </button>
              </div>
            ) : (
              /* ── Form ─────────────────────────────────────────── */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header */}
                <div className="text-center space-y-1.5">
                  <h1 className="text-[22px] font-bold text-natural-100 leading-tight">
                    {isEdit ? "تعديل العرض" : "إنشاء عرض جديد"}
                  </h1>
                  <p className="text-[13px] text-neutral-300 leading-relaxed px-2">
                    أدخل تفاصيل العرض وأرسله مباشرة للعميل برابط مخصص
                  </p>
                </div>

                {/* ── Customer Info ─────────────────────────────────── */}
                <div>
                  <h2 className="text-[15px] font-bold text-natural-100 mb-3">
                    بيانات العميل
                  </h2>
                  <div className="border border-neutral-200 rounded-2xl p-4 space-y-4 bg-natural-0">
                    {/* Request picker */}
                    <div>
                      <label className="text-[13px] font-bold text-natural-100 block mb-1.5">
                        الطلب
                      </label>
                      <SearchCombobox
                        value={selectedRequestId}
                        onChange={setSelectedRequestId}
                        options={requestOptions}
                        onSearchChange={setRequestSearch}
                        placeholder="ابحث عن طلب جاهز للعرض..."
                        searchPlaceholder="اكتب اسم الشركة أو العميل"
                        isLoading={requestsFetching}
                      />
                      {fieldErrors.requestId && (
                        <p className="text-[11px] text-danger-500 mt-1">
                          {fieldErrors.requestId}
                        </p>
                      )}
                    </div>

                    {/* مسؤول التواصل — auto-filled, hidden */}
                    <input type="hidden" value={contactName} readOnly />

                    {/* البريد الإلكتروني — auto-filled, hidden */}
                    <input type="hidden" value={contactEmail} readOnly />

                    {/* ── Title ────────────────────────────────────────── */}
                    <div>
                      <label className="text-[13px] font-bold text-natural-100 block mb-1.5">
                        عنوان العرض
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="باقة إدارة وسائل التواصل الاجتماعي"
                        className="w-full h-12 px-4 text-right text-[13px] text-natural-100 placeholder:text-neutral-200 border border-neutral-200 rounded-xl focus:outline-none focus:border-secondary-500 transition-colors bg-natural-0"
                      />
                      {fieldErrors.title && (
                        <p className="text-[11px] text-danger-500 mt-1">
                          {fieldErrors.title}
                        </p>
                      )}
                    </div>

                    {/* ── PDF Upload ─────────────────────────────────────── */}
                    <div>
                      <label className="text-[13px] font-bold text-natural-100 block mb-1.5">
                        ملف العرض الفني (PDF)
                        {!isEdit && <span className="text-danger-500 mr-1">*</span>}
                      </label>
                      <div
                        className="flex items-center gap-3 rounded-xl border border-neutral-200 h-12 px-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="w-4 h-4 text-neutral-200 shrink-0" />
                        <span className="text-[13px] text-neutral-300 flex-1 truncate">
                          {pdfFile
                            ? pdfFile.name
                            : isEdit
                              ? "اختر ملف PDF جديد (اتركه فارغاً للإبقاء على الملف الحالي)"
                              : "انقر لاختيار ملف PDF..."}
                        </span>
                        {pdfFile && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPdfFile(null);
                              if (fileInputRef.current)
                                fileInputRef.current.value = "";
                            }}
                            className="shrink-0 text-neutral-200 hover:text-danger-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setPdfFile(file);
                        }}
                      />
                      {fieldErrors.file && (
                        <p className="text-[11px] text-danger-500 mt-1">
                          {fieldErrors.file}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Services ─────────────────────────────────────── */}
                <div>
                  <h2 className="text-[15px] font-bold text-natural-100 mb-3">
                    الخدمات المطلوبة
                  </h2>
                  <div className="border border-neutral-200 rounded-2xl p-4 space-y-3 bg-natural-0">
                    {services.map((service, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 ${removingIndex === index ? "service-row-removing" : "service-row"}`}
                      >
                        <button
                          type="button"
                          onClick={() => removeService(index)}
                          className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-200 hover:text-danger-500 hover:border-danger-300 transition-all duration-200 flex-shrink-0"
                          title="حذف الخدمة"
                          disabled={services.length <= 1}
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <input
                          type="text"
                          value={service.name}
                          onChange={(e) =>
                            updateServiceName(index, e.target.value)
                          }
                          placeholder="اسم الخدمة"
                          className="flex-1 h-12 px-4 text-right text-[13px] text-natural-100 placeholder:text-neutral-200 border border-neutral-200 rounded-xl focus:outline-none focus:border-secondary-500 transition-colors bg-natural-0"
                        />
                        <div className="relative w-[130px] flex-shrink-0">
                          <input
                            type="text"
                            dir="ltr"
                            value={service.price}
                            onChange={(e) =>
                              updateServicePrice(index, e.target.value)
                            }
                            placeholder="0"
                            className="w-full h-12 px-3 pl-10 text-left text-[13px] text-natural-100 placeholder:text-neutral-200 border border-neutral-200 rounded-xl focus:outline-none focus:border-secondary-500 transition-colors bg-natural-0"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-200 text-[12px] font-medium pointer-events-none">
                            رس
                          </span>
                        </div>
                      </div>
                    ))}

                    <ActionButton
                      variant="outline"
                      type="button"
                      onClick={addService}
                      className="w-full h-12 text-[13px] font-medium gap-2 mt-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>اضافة خدمة اخرى</span>
                    </ActionButton>

                    {fieldErrors.servicesList && (
                      <p className="text-[11px] text-danger-500">
                        {fieldErrors.servicesList}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Total ──────────────────────────────────────────── */}
                <div className="bg-neutral-50 rounded-xl px-5 py-4 flex items-center justify-between">
                  <span className="text-[15px] font-bold text-natural-100">
                    {formatNumber(totalAmount)} رس
                  </span>
                  <span className="text-[14px] font-bold text-natural-100">
                    الإجمالي الكلي
                  </span>
                </div>

                {/* ── Dates & Terms ────────────────────────────────── */}
                <div>
                  <h2 className="text-[15px] font-bold text-natural-100 mb-3">
                    التواريخ والشروط
                  </h2>
                  <div className="border border-neutral-200 rounded-2xl p-4 bg-natural-0">
                    <div className="grid grid-cols-3 gap-3">
                      {/* Start Date */}
                      <div>
                        <label className="text-[11px] font-bold text-neutral-300 text-center mb-2 block">
                          تاريخ البداية
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full h-12 px-2 text-[13px] text-secondary-500 border border-neutral-200 rounded-xl focus:outline-none focus:border-secondary-500 transition-colors bg-natural-0 text-center appearance-none"
                        />
                      </div>

                      {/* Duration */}
                      <div>
                        <label className="text-[11px] font-bold text-neutral-300 text-center mb-2 block">
                          مدة التنفيذ
                        </label>
                        <div className="flex items-stretch gap-1.5">
                          <input
                            type="number"
                            min={0}
                            placeholder="0"
                            value={durationDays}
                            onChange={(e) => setDurationDays(e.target.value)}
                            className="flex-1 min-w-0 h-12 px-2 text-[13px] text-secondary-500 border border-neutral-200 rounded-xl focus:outline-none focus:border-secondary-500 transition-colors bg-natural-0 text-center"
                          />
                          <select
                            value={durationUnit}
                            onChange={(e) => setDurationUnit(e.target.value)}
                            className="h-12 px-2 text-[13px] text-secondary-500 border border-neutral-200 rounded-xl focus:outline-none focus:border-secondary-500 transition-colors bg-natural-0 appearance-none cursor-pointer"
                            style={{ width: "70px" }}
                          >
                            <option value="DAYS">أيام</option>
                            <option value="WEEKS">أسابيع</option>
                            <option value="MONTHS">أشهر</option>
                          </select>
                        </div>
                      </div>

                      {/* Offer Validity */}
                      <div>
                        <label className="text-[11px] font-bold text-neutral-300 text-center mb-2 block">
                          صلاحية العرض
                        </label>
                        <input
                          type="number"
                          min={1}
                          placeholder="30"
                          value={offerValidityDays}
                          onChange={(e) => setOfferValidityDays(e.target.value)}
                          className="w-full h-12 px-2 text-[13px] text-secondary-500 border border-neutral-200 rounded-xl focus:outline-none focus:border-secondary-500 transition-colors bg-natural-0 text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Buttons row ─────────────────────────────── */}
                <div className="flex gap-3">
                  <ActionButton
                    variant="outline"
                    type="button"
                    onClick={() => handleOpenChange(false)}
                    className="w-[30%] h-14 text-[13px] font-medium"
                  >
                    إلغاء
                  </ActionButton>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-14 bg-secondary-500 hover:bg-secondary-600 text-white text-[15px] font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-secondary-500/20 hover:shadow-xl hover:shadow-secondary-500/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isSubmitting
                      ? "جارٍ الإرسال..."
                      : isEdit
                        ? "تحديث العرض"
                        : "ارسال العرض للعميل"}
                  </button>
                </div>
              </form>
            )}

      <style dangerouslySetInnerHTML={{
        __html: `
          .modal-scroll::-webkit-scrollbar { width: 6px; }
          .modal-scroll::-webkit-scrollbar-track { background: transparent; }
          .modal-scroll::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 20px; }
          .modal-scroll::-webkit-scrollbar-thumb:hover { background-color: #d1d5db; }
          @keyframes proposalSlideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes proposalSlideOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(20px); } }
          .service-row { animation: proposalSlideIn 0.3s ease-out; }
          .service-row-removing { animation: proposalSlideOut 0.3s ease-in forwards; }
          [role="dialog"] > button.absolute { display: none !important; }
          input[type="number"]::-webkit-inner-spin-button,
          input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
          input[type="number"] { -moz-appearance: textfield; }
          input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
        `,
      }}
      />
      </Dialog>
    </>
  );
}