"use client";

import { Dialog } from "@/components/design-system/Dialog";
import { IntakeForm } from "./IntakeForm";
import { ClipboardList } from "lucide-react";

interface IntakeFormModalProps {
  /**
   * When true: backdrop non-dismissible, no close button (first-login mode).
   * When false: user can close the dialog freely.
   */
  mandatory?: boolean;
  onSuccess: () => void;
  onClose?: () => void;
}

export function IntakeFormModal({
  mandatory = false,
  onSuccess,
  onClose,
}: IntakeFormModalProps) {
  function handleOpenChange(open: boolean) {
    // In mandatory mode, block all close attempts
    if (mandatory) return;
    if (!open) onClose?.();
  }

  return (
    <Dialog
      open
      onOpenChange={handleOpenChange}
      contentClassName="sm:max-w-lg max-h-[90vh] overflow-y-auto"
      onInteractOutside={mandatory ? (e) => e.preventDefault() : undefined}
      onEscapeKeyDown={mandatory ? (e) => e.preventDefault() : undefined}
      hideClose={mandatory}
      className="space-y-4"
    >
      {/* ── Custom header (matches original visual layout) ─────────── */}
      <div className="flex items-center gap-3 mb-1" dir="rtl">
        <div className="w-10 h-10 rounded-lg bg-secondary-500/10 flex items-center justify-center shrink-0">
          <ClipboardList className="w-5 h-5 text-secondary-500" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-natural-100">
            {mandatory ? "مرحباً بك! أخبرنا عن مشروعك" : "صفقة جديدة"}
          </h1>
          <p className="text-sm text-neutral-300 mt-0.5">
            {mandatory
              ? "يرجى تعبئة البيانات التالية حتى يتمكن فريقنا من التواصل معك بأسرع وقت."
              : "أدخل بيانات العميل الجديد لإضافته إلى خط المبيعات."}
          </p>
        </div>
      </div>

      <IntakeForm
        onSuccess={onSuccess}
        submitLabel={mandatory ? "إرسال الطلب" : "إضافة إلى خط المبيعات"}
      />
    </Dialog>
  );
}
