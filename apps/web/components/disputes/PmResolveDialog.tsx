"use client";

import { useState } from "react";
import { CheckCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/design-system/Dialog";

interface PmResolveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (message: string) => void;
  isLoading?: boolean;
}

export function PmResolveDialog({
  open,
  onOpenChange,
  onResolve,
  isLoading = false,
}: PmResolveDialogProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (message.trim().length < 10) return;
    onResolve(message.trim());
  };

  const handleClose = () => {
    if (isLoading) return;
    setMessage("");
    onOpenChange(false);
  };

  const isValid = message.trim().length >= 10;

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      title="تأكيد حل المشكلة"
      description="أخبر العميل كيف تم حل المشكلة"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !isValid}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                جارٍ...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 ml-2" />
                إرسال للتأكيد
              </>
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-4" dir="rtl">
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-sm text-green-800">
            <p className="font-medium">ماذا سيحدث؟</p>
            <p>سيتم إرسال رسالتك للعميل وسيُطلب منه تأكيد الحل.</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-natural-100">
            رسالة الحل <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full min-h-[120px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-secondary-500 focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500/20 resize-none"
            placeholder="اشرح كيف تم حل المشكلة للعميل..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            dir="rtl"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between text-xs">
            <span className={message.trim().length >= 10 ? "text-green-600" : "text-portal-note-text"}>
              {message.trim().length}/10 أحرف على الأقل
            </span>
            <span className="text-portal-note-text">الحد الأقصى 1000 حرف</span>
          </div>
        </div>
      </div>
    </Dialog>
  );
}