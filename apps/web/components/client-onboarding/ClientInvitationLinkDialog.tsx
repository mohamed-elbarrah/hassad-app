"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ClientInvitationLinkDialogProps {
  open: boolean;
  setupUrl: string | null;
  onOpenChange: (open: boolean) => void;
}

export function ClientInvitationLinkDialog({
  open,
  setupUrl,
  onOpenChange,
}: ClientInvitationLinkDialogProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function copyLink() {
    if (!setupUrl) return;

    setCopyError(false);
    try {
      await navigator.clipboard.writeText(setupUrl);
      setCopied(true);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>رابط إعداد حساب العميل</DialogTitle>
          <DialogDescription>
            انسخ الرابط وأرسله إلى العميل ليحدد كلمة المرور الخاصة به.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Input
              aria-label="رابط إعداد حساب العميل"
              value={setupUrl ?? ""}
              readOnly
              dir="ltr"
              className="min-w-0"
            />
            <Button type="button" variant="outline" onClick={copyLink}>
              <Copy data-icon="inline-start" />
              {copied ? "تم النسخ" : "نسخ الرابط"}
            </Button>
          </div>
          <p aria-live="polite" className="text-xs text-muted-foreground">
            {copyError
              ? "تعذر نسخ الرابط. حدده وانسخه يدوياً."
              : copied
                ? "تم نسخ الرابط."
                : "الرابط صالح لمدة 72 ساعة."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
