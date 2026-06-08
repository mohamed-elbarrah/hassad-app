"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/design-system/Dialog";
import { ActionButton } from "@/components/design-system/ActionButton";

interface ContactAttemptDialogProps {
  clientId: string;
  clientName: string;
}

export function ContactAttemptDialog({
  clientName,
}: ContactAttemptDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ActionButton size="sm" variant="outline" onClick={() => setOpen(true)}>
        تسجيل محاولة تواصل
      </ActionButton>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={`تسجيل محاولة تواصل — ${clientName}`}
        contentClassName="sm:max-w-md"
      >
        <div className="py-4 text-sm text-neutral-300 text-center">
          هذه الميزة متاحة فقط من صفحة العميل المحتمل (Leads).
        </div>
        <div className="flex justify-end">
          <ActionButton
            variant="outline"
            onClick={() => {
              setOpen(false);
              toast.info(
                "انتقل إلى صفحة العميل المحتمل لتسجيل محاولة التواصل.",
              );
            }}
          >
            إغلاق
          </ActionButton>
        </div>
      </Dialog>
    </>
  );
}
