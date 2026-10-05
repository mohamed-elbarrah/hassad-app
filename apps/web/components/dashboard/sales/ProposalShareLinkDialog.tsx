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

interface ProposalShareLinkDialogProps {
  open: boolean;
  shareLink: string | null;
  onOpenChange: (open: boolean) => void;
}

export function ProposalShareLinkDialog({
  open,
  shareLink,
  onOpenChange,
}: ProposalShareLinkDialogProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function copyLink() {
    if (!shareLink) return;

    setCopyError(false);
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setCopied(false);
      setCopyError(false);
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent dir="rtl" closeLabel="إغلاق" className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>رابط العرض الفني</DialogTitle>
          <DialogDescription>
            انسخ الرابط وأرسله إلى العميل لمراجعة العرض الفني.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Input
              aria-label="رابط العرض الفني"
              value={shareLink ?? ""}
              readOnly
              dir="ltr"
              className="min-w-0"
            />
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={copyLink}
            >
              <Copy data-icon="inline-start" />
              {copied ? "تم النسخ" : "نسخ الرابط"}
            </Button>
          </div>
          <p aria-live="polite" className="text-xs text-muted-foreground">
            {copyError
              ? "تعذر نسخ الرابط. حدده وانسخه يدوياً."
              : copied
                ? "تم نسخ الرابط."
                : "يمكنك نسخ الرابط وإرساله إلى العميل."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
