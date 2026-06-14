"use client";

import { Dialog } from "@/components/design-system/Dialog";
import { IntakeForm } from "./IntakeForm";

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

  const title = mandatory 
    ? "مرحباً بك في حصاد! 👋" 
    : "طلب خدمة جديد";
    
  const description = mandatory
    ? "نحن متحمسون للعمل معك! أخبرنا قليلاً عن مشروعك حتى نتمكن من مساعدتك بشكل أفضل."
    : "املأ البيانات التالية لبدء مشروعك معنا. فريق المبيعات سيتواصل معك خلال 24 ساعة.";

  return (
    <Dialog
      open
      onOpenChange={handleOpenChange}
      title={
        <div className="text-right">
          <h2 className="text-xl font-bold text-natural-100 leading-tight">
            {title}
          </h2>
          <p className="text-sm text-neutral-400 mt-1.5 leading-relaxed">
            {description}
          </p>
        </div>
      }
      description={null}
      contentClassName="sm:max-w-[560px] max-h-[90vh]"
      onInteractOutside={mandatory ? (e) => e.preventDefault() : undefined}
      onEscapeKeyDown={mandatory ? (e) => e.preventDefault() : undefined}
      hideClose={mandatory}
      className="space-y-0"
      headerClassName="pb-0"
    >
      <div className="mt-2">
        <IntakeForm
          onSuccess={onSuccess}
          submitLabel={mandatory ? "إرسال الطلب والبدء 🚀" : "إرسال الطلب"}
        />
      </div>
    </Dialog>
  );
}
