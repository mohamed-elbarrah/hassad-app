"use client";

import { useState } from "react";
import { AlertTriangle, Copy, Check } from "lucide-react";
import { Dialog } from "@/components/design-system/Dialog";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ImpersonateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  onConfirm: (reason: string) => Promise<{ token: string; expiresAt: string }>;
}

export function ImpersonateDialog({
  open,
  onOpenChange,
  userName,
  onConfirm,
}: ImpersonateDialogProps) {
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    token: string;
    expiresAt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      toast.error("يرجى كتابة سبب الدخول كـ " + userName);
      return;
    }
    setIsLoading(true);
    try {
      const res = await onConfirm(reason.trim());
      setResult(res);
      toast.success(`تم الدخول كـ ${userName}`);
    } catch {
      toast.error("فشلت عملية الدخول كـ " + userName);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (result) {
      await navigator.clipboard.writeText(result.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("تم نسخ الرمز");
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setReason("");
      setResult(null);
      setCopied(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={result ? "تم الدخول كـ " + userName : "الدخول كـ " + userName}
      description={
        result
          ? "تم إنشاء رمز الدخول. يمكنك استخدامه الآن."
          : `سيتم إنشاء رمز دخول مؤقت (15 دقيقة) للدخول بحساب ${userName}. سيتم تسجيل هذا الإجراء في سجل التدقيق.`
      }
      icon={result ? undefined : AlertTriangle}
      contentClassName="sm:max-w-md"
      footer={
        result ? (
          <div className="flex gap-2 justify-end">
            <ActionButton variant="outline" onClick={handleCopy}>
              {copied ? (
                <Check className="size-4 ml-1" />
              ) : (
                <Copy className="size-4 ml-1" />
              )}
              {copied ? "تم النسخ" : "نسخ الرمز"}
            </ActionButton>
            <ActionButton onClick={() => handleOpenChange(false)}>
              إغلاق
            </ActionButton>
          </div>
        ) : (
          <div className="flex gap-2 justify-end">
            <ActionButton
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              إلغاء
            </ActionButton>
            <ActionButton
              onClick={handleConfirm}
              disabled={isLoading || !reason.trim()}
            >
              {isLoading ? "جارٍ..." : "تأكيد الدخول"}
            </ActionButton>
          </div>
        )
      }
    >
      {!result && (
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">سبب الدخول</Label>
            <FormInputControl
              placeholder="مثال: طلب دعم فني، مراجعة طلب..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      )}
    </Dialog>
  );
}
