"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
      // Disable Radix close-on-outside-click / Escape in mandatory mode
      modal
    >
      <DialogContent
        className="max-w-lg w-full max-h-[90vh] overflow-y-auto"
        // In mandatory mode: hide the default (×) close button via CSS trick —
        // we override the close button by applying a classname that hides it.
        onInteractOutside={mandatory ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={mandatory ? (e) => e.preventDefault() : undefined}
      >
        {/* Hide the auto-generated X button in mandatory mode */}
        {mandatory && (
          <style>{`
            [data-radix-dialog-close] { display: none !important; }
          `}</style>
        )}

        <DialogHeader className="text-right" dir="rtl">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {mandatory ? "مرحباً بك! أخبرنا عن مشروعك" : "صفقة جديدة"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                {mandatory
                  ? "يرجى تعبئة البيانات التالية حتى يتمكن فريقنا من التواصل معك بأسرع وقت."
                  : "أدخل بيانات العميل الجديد لإضافته إلى خط المبيعات."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div dir="rtl">
          <IntakeForm
            onSuccess={onSuccess}
            submitLabel={mandatory ? "إرسال الطلب" : "إضافة إلى خط المبيعات"}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
