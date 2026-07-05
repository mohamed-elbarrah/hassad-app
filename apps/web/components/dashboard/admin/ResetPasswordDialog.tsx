"use client";

import { useState } from "react";
import { KeyRound, Copy, Check, AlertTriangle } from "lucide-react";
import { Dialog } from "@/components/design-system/Dialog";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  onConfirm: () => Promise<{ temporaryPassword: string }>;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  userName,
  onConfirm,
}: ResetPasswordDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ temporaryPassword: string } | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const res = await onConfirm();
      setResult(res);
      toast.success(`تم إعادة تعيين كلمة المرور لـ ${userName}`);
    } catch {
      toast.error("فشلت عملية إعادة تعيين كلمة المرور");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (result) {
      await navigator.clipboard.writeText(result.temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("تم نسخ كلمة المرور");
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setResult(null);
      setCopied(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={result ? "تم إعادة تعيين كلمة المرور" : "إعادة تعيين كلمة المرور"}
      description={
        result
          ? "كلمة المرور المؤقتة أدناه. يجب على المستخدم تغييرها عند تسجيل الدخول."
          : `سيتم إنشاء كلمة مرور مؤقتة للحساب ${userName}. يجب على المستخدم تغييرها عند تسجيل الدخول.`
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
              {copied ? "تم النسخ" : "نسخ كلمة المرور"}
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
            <ActionButton onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? "جارٍ..." : "تأكيد إعادة التعيين"}
            </ActionButton>
          </div>
        )
      }
    >
      {result && (
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">كلمة المرور المؤقتة</Label>
            <div className="flex items-center gap-2 rounded-xl border border-portal-divider bg-badge-gray-bg px-4 py-3 font-mono text-lg text-natural-100 dir-ltr text-left">
              <KeyRound className="size-5 text-secondary-500 ml-2 shrink-0" />
              <span className="break-all">{result.temporaryPassword}</span>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
